import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import WebhookEventModel from '@/lib/models/WebhookEvent';
import OrderModel from '@/lib/models/Order';
import { apiEndpoint } from '@/lib/siteConfig';

const KIVORA_WEBHOOK_SECRET = process.env.KIVORA_WEBHOOK_SECRET || 'whsec_Wr7vSNrJGVNcso7rR7gRM8IpPY9OZMQb';

// 🔒 SEGURANÇA: Validação criptográfica da assinatura HMAC-SHA256 da Kivora
function verifyKivoraSignature(rawBody: string, req: Request): { valid: boolean; reason?: string } {
  const secret = KIVORA_WEBHOOK_SECRET;
  if (!secret) {
    return { valid: true };
  }

  const headers = req.headers;
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('secret');

  // 1. Verificação por parâmetro secreto na URL (?secret=whsec_...)
  if (querySecret && querySecret === secret) {
    return { valid: true };
  }

  // 2. Verificação por cabeçalho secreto direto (x-webhook-secret / x-kivora-secret)
  const directSecret = headers.get('x-webhook-secret') || headers.get('x-kivora-secret');
  if (directSecret && directSecret === secret) {
    return { valid: true };
  }

  // 3. Verificação por Authorization Bearer
  const authHeader = headers.get('authorization');
  if (authHeader && (authHeader === `Bearer ${secret}` || authHeader === secret)) {
    return { valid: true };
  }

  // 4. Verificação por cabeçalhos padrão de assinatura HMAC-SHA256
  const signatureHeader = 
    headers.get('x-kivora-signature') ||
    headers.get('kivora-signature') ||
    headers.get('x-signature') ||
    headers.get('webhook-signature') ||
    headers.get('x-webhook-signature');

  if (!signatureHeader) {
    return { valid: false, reason: 'Assinatura ou segredo ausente nos cabeçalhos' };
  }

  try {
    // Caso especial: o gateway enviou o próprio segredo no cabeçalho de assinatura
    if (signatureHeader === secret) {
      return { valid: true };
    }

    // Formato com timestamp (t=timestamp,v1=signature)
    if (signatureHeader.includes('v1=') && signatureHeader.includes('t=')) {
      const parts = signatureHeader.split(',');
      const timestampPart = parts.find(p => p.trim().startsWith('t='))?.trim().slice(2);
      const signaturePart = parts.find(p => p.trim().startsWith('v1='))?.trim().slice(3);

      if (timestampPart && signaturePart) {
        const payloadToSign = `${timestampPart}.${rawBody}`;
        const hmac = crypto.createHmac('sha256', secret);
        const expected = hmac.update(payloadToSign).digest('hex');
        const expectedBuf = Buffer.from(expected, 'hex');
        const receivedBuf = Buffer.from(signaturePart, 'hex');
        if (expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
          return { valid: true };
        }
      }
    }

    // Formato HMAC Hexadecimal direto
    const cleanSignature = signatureHeader.replace(/^sha256=/, '').trim();
    const hmacHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedHexBuf = Buffer.from(hmacHex, 'utf-8');
    const receivedHexBuf = Buffer.from(cleanSignature, 'utf-8');
    if (expectedHexBuf.length === receivedHexBuf.length && crypto.timingSafeEqual(expectedHexBuf, receivedHexBuf)) {
      return { valid: true };
    }

    // Formato HMAC Base64
    const hmacBase64 = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    const expectedB64Buf = Buffer.from(hmacBase64, 'utf-8');
    const receivedB64Buf = Buffer.from(cleanSignature, 'utf-8');
    if (expectedB64Buf.length === receivedB64Buf.length && crypto.timingSafeEqual(expectedB64Buf, receivedB64Buf)) {
      return { valid: true };
    }
  } catch (err) {
    console.error('[KIVORA SIGNATURE ERROR]:', err);
    return { valid: false, reason: 'Erro ao processar assinatura' };
  }

  return { valid: false, reason: 'Assinatura inválida' };
}

// 🔒 BACKEND ROBUSTEZ: Sistema de retry para webhooks falhados
const WEBHOOK_RETRY_ATTEMPTS = 3;
const WEBHOOK_RETRY_DELAY = 1000; // 1 segundo

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number = WEBHOOK_RETRY_ATTEMPTS,
  delay: number = WEBHOOK_RETRY_DELAY
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`[WEBHOOK RETRY] Attempt ${i + 1}/${attempts} failed:`, error);
      
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
      }
    }
  }
  
  throw lastError!;
}

export async function POST(req: Request) {
  let processed = false;
  let errorMessage = '';

  // 1. Ler o body em texto puro para cálculo e validação do hash HMAC
  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Erro ao ler corpo da requisição' }, { status: 400 });
  }

  // 2. 🔒 VERIFICAÇÃO DE ASSINATURA / SEGREDO DO WEBHOOK
  const sigCheck = verifyKivoraSignature(rawBody, req);
  if (!sigCheck.valid) {
    console.warn('[KIVORA WEBHOOK] ⚠️ Requisição rejeitada por segurança:', sigCheck.reason);
    return NextResponse.json(
      { error: 'Não autorizado: assinatura inválida ou ausente.', reason: sigCheck.reason },
      { status: 401 }
    );
  }

  // 3. Converter body para JSON
  let body: any = null;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    console.log('[KIVORA WEBHOOK] Evento recebido:', body);
    
    const { id, type, created_at, livemode, data: eventData } = body;
    
    // Validar estrutura do evento
    if (!id || !type || !eventData) {
      console.error('[KIVORA WEBHOOK] Estrutura de evento inválida:', body);
      errorMessage = 'Estrutura de evento inválida';
      // Registrar evento de estrutura inválida no MongoDB
      try {
        await connectDB();
        await WebhookEventModel.create({
          eventId: id || 'unknown',
          eventType: type || 'unknown',
          paymentId: eventData?.id,
          reference: eventData?.reference,
          status: eventData?.status,
          amount: eventData?.amount,
          currency: eventData?.currency,
          processed: false,
          errorMessage,
          createdAt: new Date().toISOString()
        });
      } catch (dbErr) {
        console.error('[KIVORA WEBHOOK] Erro ao gravar evento inválido no MongoDB:', dbErr);
      }
      return NextResponse.json({ error: 'Invalid event structure' }, { status: 400 });
    }

    // Extrair metadados do cliente se disponíveis
    const metadata = eventData.metadata || {};
    const clientName = metadata.clientName || 'Cliente';
    const clientEmail = metadata.clientEmail;
    const serviceName = metadata.serviceName || 'Serviço';

    // Processar diferentes tipos de eventos
    switch (type) {
      case 'payment.created':
        console.log('[KIVORA WEBHOOK] Pagamento criado:', eventData.id);
        break;
        
      case 'payment.pending':
        console.log('[KIVORA WEBHOOK] Pagamento pendente:', eventData.id);
        break;
        
      case 'payment.completed':
        console.log('[KIVORA WEBHOOK] Pagamento completado:', eventData.id);
        // Atualizar status do pedido para 'completed' (com retry)
        await withRetry(() => updateOrderStatus(eventData.reference || '', 'completed', eventData.id, eventData, metadata));
        // Enviar notificação de sucesso por email para cliente (com retry)
        if (clientEmail) {
          await withRetry(() => sendPaymentNotification(clientEmail, clientName, serviceName, 'completed', eventData.amount, undefined, eventData.reference));
        }
        // Notificar admin sobre pagamento confirmado (com retry)
        await withRetry(() => notifyAdminAboutPayment(clientName, clientEmail || '', serviceName, 'completed', eventData.amount, eventData.reference));
        processed = true;
        break;
        
      case 'payment.failed':
        console.log('[KIVORA WEBHOOK] Pagamento falhou:', eventData.id);
        
        // Extrair motivo da falha se disponível (priorizar schema oficial da Kivora)
        const failureReason = 
          eventData.error?.message || // Schema oficial: error.message
          eventData.failure_reason || 
          eventData.error_message || 
          eventData.errorMessage || 
          'Motivo não especificado';
        
        const failureCode = 
          eventData.error?.code || // Schema oficial: error.code
          eventData.failure_code || 
          eventData.error_code || 
          eventData.errorCode || 
          'UNKNOWN';
        
        console.log('[KIVORA WEBHOOK] Detalhes da falha:', { failureCode, failureReason });
        
        // Atualizar status do pedido para 'cancelled' e salvar motivo da falha (com retry)
        await withRetry(() => updateOrderStatus(eventData.reference || '', 'cancelled', eventData.id, eventData, metadata, failureReason));
        // Enviar notificação de falha por email para cliente com motivo específico
        if (clientEmail) {
          await sendPaymentNotification(clientEmail, clientName, serviceName, 'failed', eventData.amount, failureReason, eventData.reference);
        }
        // Notificar admin sobre pagamento falhado com motivo específico
        await notifyAdminAboutPayment(clientName, clientEmail || '', serviceName, 'failed', eventData.amount, eventData.reference, failureReason);
        processed = true;
        break;
        
      case 'b2c.created':
        console.log('[KIVORA WEBHOOK] Envio B2C criado:', eventData.id);
        processed = true;
        break;
        
      case 'b2c.completed':
        console.log('[KIVORA WEBHOOK] Envio B2C completado:', eventData.id);
        processed = true;
        break;
        
      case 'b2c.failed':
        console.log('[KIVORA WEBHOOK] Envio B2C falhou:', eventData.id);
        processed = true;
        break;

      case 'subscription.created':
        console.log('[KIVORA WEBHOOK] Assinatura criada:', eventData.id);
        processed = true;
        break;

      case 'subscription.cancelled':
        console.log('[KIVORA WEBHOOK] Assinatura cancelada:', eventData.id);
        processed = true;
        break;

      case 'subscription.renewed':
        console.log('[KIVORA WEBHOOK] Assinatura renovada:', eventData.id);
        processed = true;
        break;

      default:
        console.log('[KIVORA WEBHOOK] Tipo de evento não tratado:', type);
        processed = true;
    }

    // Registrar evento no MongoDB para monitoramento persistente (server-side)
    const failureReason = type === 'payment.failed' 
      ? (eventData.error?.message || eventData.failure_reason || eventData.error_message || eventData.errorMessage || 'Motivo não especificado')
      : undefined;
    const failureCode = type === 'payment.failed'
      ? (eventData.error?.code || eventData.failure_code || eventData.error_code || eventData.errorCode || 'UNKNOWN')
      : undefined;

    try {
      await connectDB();
      await WebhookEventModel.create({
        eventId: id,
        eventType: type,
        paymentId: eventData.id,
        reference: eventData.reference,
        status: eventData.status,
        amount: eventData.amount,
        currency: eventData.currency,
        clientName,
        clientEmail,
        serviceName,
        processed,
        errorMessage,
        failureReason,
        failureCode,
        createdAt: new Date().toISOString()
      });
      console.log('[KIVORA WEBHOOK] Evento gravado no MongoDB:', id);
    } catch (dbErr) {
      console.error('[KIVORA WEBHOOK] Erro ao gravar evento no MongoDB:', dbErr);
    }

    // Responder com 200 OK para confirmar recebimento
    return NextResponse.json({ received: true, eventId: id });
    
  } catch (error) {
    console.error('[KIVORA WEBHOOK] Erro ao processar webhook:', error);
    errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Registrar evento falhado no MongoDB usando o body já lido
    try {
      if (body) {
        await connectDB();
        await WebhookEventModel.create({
          eventId: body.id || 'unknown',
          eventType: body.type || 'unknown',
          paymentId: body.data?.id,
          reference: body.data?.reference,
          processed: false,
          errorMessage,
          createdAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('[KIVORA WEBHOOK] Erro ao registrar evento falhado no MongoDB:', e);
    }
    
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Função auxiliar para enviar notificação por email
async function sendPaymentNotification(
  email: string,
  clientName: string,
  serviceName: string,
  status: 'completed' | 'failed',
  amount?: number,
  failureReason?: string,
  reference?: string
) {
  try {
    console.log(`[KIVORA WEBHOOK] Enviando notificação ${status} para ${email}`);
    const { dispatchMessage } = await import('@/lib/notifications');

    if (status === 'completed') {
      // 1. Enviar confirmação de pagamento para o cliente
      await dispatchMessage({
        recipientEmail: email,
        recipientName: clientName || 'Cliente',
        templateId: 'payment-confirmed',
        variables: {
          numero_pedido: reference || 'N/A',
          valor: `${Number(amount || 0).toLocaleString('pt-MZ')} MT`
        },
        isAutomatic: true,
        eventType: 'kivora_payment_success'
      });

      // 2. Auto-provisionamento: gerar e enviar credenciais cPanel se for serviço de hospedagem
      try {
        const { generateHostingCredentials } = await import('@/lib/provisioning');
        const creds = generateHostingCredentials(reference || 'ORD', email);
        await dispatchMessage({
          recipientEmail: email,
          recipientName: clientName || 'Cliente',
          templateId: 'service-credentials',
          variables: {
            numero_pedido: reference || 'ORD',
            utilizador: creds.username,
            palavra_passe: creds.password,
            link_painel: creds.cpanelUrl,
            link_webmail: creds.webmailUrl,
            servidor_dns1: creds.nameserver1,
            servidor_dns2: creds.nameserver2
          },
          isAutomatic: true,
          eventType: 'service_auto_provisioned'
        });
      } catch (credErr) {
        console.error('[KIVORA WEBHOOK] Erro ao enviar credenciais de acesso:', credErr);
      }

      // 3. Se o serviço for um curso, matricular e enviar boas-vindas
      if (serviceName?.toLowerCase().includes('curso')) {
        try {
          const { CourseModel } = await import('@/lib/models/CourseModel');
          const courses = await CourseModel.find({});
          const matchingCourse = courses.find((course: any) => 
            course.title.toLowerCase().includes(serviceName.toLowerCase()) ||
            serviceName.toLowerCase().includes(course.title.toLowerCase())
          );
          if (matchingCourse) {
            await dispatchMessage({
              recipientEmail: email,
              recipientName: clientName || 'Cliente',
              templateId: 'course_enrollment',
              variables: {
                courseTitle: matchingCourse.title
              },
              isAutomatic: true,
              eventType: 'course_auto_enrollment'
            });
          }
        } catch (courseErr) {
          console.error('[KIVORA WEBHOOK] Erro ao processar curso no webhook:', courseErr);
        }
      }
    } else {
      // Falha no pagamento
      await dispatchMessage({
        recipientEmail: email,
        recipientName: clientName || 'Cliente',
        templateId: 'payment-failed',
        variables: {
          numero_pedido: reference || 'N/A',
          valor: `${Number(amount || 0).toLocaleString('pt-MZ')} MT`,
          motivo_falha: failureReason || 'Não especificado'
        },
        isAutomatic: true,
        eventType: 'kivora_payment_failed'
      });
    }

    console.log(`[KIVORA WEBHOOK] Notificação ${status} enviada com sucesso para ${email}`);
  } catch (error) {
    console.error('[KIVORA WEBHOOK] Erro ao enviar notificação de pagamento:', error);
  }
}

// Função auxiliar para notificar admin sobre novo pagamento
async function notifyAdminAboutPayment(
  clientName: string,
  clientEmail: string,
  serviceName: string,
  status: 'completed' | 'failed',
  amount?: number,
  reference?: string,
  failureReason?: string
) {
  try {
    console.log(`[KIVORA WEBHOOK] Notificando admin sobre pagamento ${status}`);
    const { addAdminNotification } = await import('@/lib/notifications');
    const { sendEmail } = await import('@/lib/sendgrid');

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@wehosthere.com';
    const subject = status === 'completed'
      ? `💰 Novo Pagamento Confirmado: ${clientName} - ${amount || 0} MZN`
      : `⚠️ Pagamento Falhou: ${clientName} - ${amount || 0} MZN`;
    
    const message = status === 'completed'
      ? `Olá Administrador,\n\nNovo pagamento confirmado via Kivora:\n\n• Cliente: ${clientName} (${clientEmail})\n• Serviço: ${serviceName}\n• Valor: ${amount || 0} MZN\n• Referência: ${reference || 'N/A'}\n• Data: ${new Date().toLocaleString('pt-MZ')}\n\nVerifique o pedido no painel admin.\nEquipe WEHOSTHERE`
      : `Olá Administrador,\n\nPagamento falhou na Kivora:\n\n• Cliente: ${clientName} (${clientEmail})\n• Serviço: ${serviceName}\n• Valor: ${amount || 0} MZN\n• Referência: ${reference || 'N/A'}\n• Motivo: ${failureReason || 'Não especificado'}\n• Data: ${new Date().toLocaleString('pt-MZ')}\n\nVerifique o pedido no painel admin.\nEquipe WEHOSTHERE`;

    // 1. Notificação no painel admin (MongoDB)
    addAdminNotification({
      title: subject,
      message: status === 'completed' 
        ? `Pagamento de ${amount || 0} MZN confirmado via Kivora para ${serviceName}. Ref: ${reference || 'N/A'}`
        : `Pagamento de ${amount || 0} MZN falhou via Kivora. Motivo: ${failureReason || 'Não especificado'}`,
      type: status === 'completed' ? 'payment_success' : 'payment_failed',
      userEmail: clientEmail,
      userName: clientName,
      link: '/admin?tab=orders'
    });

    // 2. Notificação por e-mail para o administrador
    await sendEmail({
      to: adminEmail,
      subject,
      text: message
    });

    // 3. Notificação PUSH direta para o telemóvel dos administradores
    try {
      const { sendPushToAdmins } = await import('@/lib/pushService');
      await sendPushToAdmins({
        title: status === 'completed'
          ? `💰 Pagamento Recebido: ${amount || 0} MZN`
          : `⚠️ Falha no Pagamento: ${amount || 0} MZN`,
        message: status === 'completed'
          ? `${clientName} pagou ${amount || 0} MZN para ${serviceName}!`
          : `${clientName}: ${failureReason || 'Pagamento não concluído'}`,
        url: '/admin?tab=orders',
        tag: `payment-${status}-${Date.now()}`
      });
    } catch (pushErr) {
      console.warn('[KIVORA WEBHOOK] Falha não impeditiva ao disparar push para admins:', pushErr);
    }
    
    console.log(`[KIVORA WEBHOOK] Admin notificado com sucesso sobre pagamento ${status}`);
  } catch (error) {
    console.error('[KIVORA WEBHOOK] Erro ao notificar admin:', error);
  }
}

// Função auxiliar para atualizar status do pedido via MongoDB
async function updateOrderStatus(
  reference: string,
  status: 'completed' | 'cancelled',
  kivoraPaymentId?: string,
  eventData?: any,
  metadata?: any,
  failureReason?: string
) {
  try {
    await connectDB();
    const queryConditions: any[] = [];
    if (kivoraPaymentId) {
      queryConditions.push({ kivoraPaymentId });
    }
    if (reference) {
      queryConditions.push({ reference });
      queryConditions.push({ id: reference });
      const cleanRef = reference.replace('REF_', '').replace('ORDER_', '');
      if (cleanRef) {
        queryConditions.push({ id: { $regex: new RegExp(cleanRef, 'i') } });
      }
    }

    let order = queryConditions.length > 0
      ? await OrderModel.findOne({ $or: queryConditions })
      : null;

    if (order) {
      console.log(`[KIVORA WEBHOOK] Atualizando pedido ${order.id} para status: ${status}${failureReason ? ` (Motivo: ${failureReason})` : ''}`);
      await OrderModel.findOneAndUpdate(
        { id: order.id },
        { 
          status,
          ...(kivoraPaymentId && !order.kivoraPaymentId ? { kivoraPaymentId } : {}),
          ...(failureReason ? { failureReason } : {}),
          ...(status === 'completed' ? { valorFaturado: order.amount || 0, valorPorFaturar: 0 } : {})
        }
      );
      if (status === 'completed') {
        try {
          const InvoiceModel = (await import('@/lib/models/Invoice')).default;
          await InvoiceModel.updateMany(
            {
              $or: [
                { id: order.id },
                { invoiceNumber: order.id },
                { id: reference },
                { invoiceNumber: reference }
              ]
            },
            {
              $set: {
                status: 'paid',
                paidAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            }
          );
        } catch (invErr) {
          console.warn('[KIVORA WEBHOOK] Aviso ao atualizar fatura:', invErr);
        }
      }
    } else if (status === 'completed' && (kivoraPaymentId || reference)) {
      // Se o pedido não existia (ex: fluxo rápido ou falha de rede prévia), criar agora
      const fallbackId = reference || `ORD-${Date.now().toString().slice(-6)}`;
      const clientName = metadata?.clientName || eventData?.customer?.name || 'Cliente';
      const clientEmail = metadata?.clientEmail || eventData?.customer?.email || 'cliente@wehosthere.com';
      const serviceName = metadata?.serviceName || 'Hospedagem Web';
      const amount = Number(eventData?.amount) || 0;

      console.log(`[KIVORA WEBHOOK] Criando pedido aprovado não localizado previamente: ${fallbackId}`);
      await OrderModel.create({
        id: fallbackId,
        clientName,
        clientEmail,
        clientPhone: metadata?.clientPhone || eventData?.customer?.phone || '',
        serviceName,
        amount,
        paymentMethod: 'mpesa',
        kivoraPaymentId,
        reference,
        status: 'completed',
        createdAt: new Date().toISOString()
      });
    } else {
      console.log(`[KIVORA WEBHOOK] Pedido não encontrado para referência: ${reference}, paymentId: ${kivoraPaymentId}`);
    }
  } catch (error) {
    console.error('[KIVORA WEBHOOK] Erro ao atualizar pedido:', error);
  }
}

// Endpoint GET para o painel admin consultar os últimos eventos de webhook registrados
export async function GET(req: Request) {
  // 🔒 SEGURANÇA: Restringir acesso a chamadas autorizadas (same-origin ou token interno)
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const authHeader = req.headers.get('x-internal-auth') || req.headers.get('authorization');
  const internalSecret = process.env.NEXTAUTH_SECRET || '';

  const isInternal = authHeader && (authHeader === internalSecret || authHeader === `Bearer ${internalSecret}`);
  const isSameOrigin = (origin && (
    origin === 'https://wehosthere.com' ||
    origin === 'https://www.wehosthere.com' ||
    origin === 'http://localhost:3000' ||
    origin === 'http://localhost:3001'
  )) || (referer && (
    referer.startsWith('https://wehosthere.com') ||
    referer.startsWith('https://www.wehosthere.com') ||
    referer.startsWith('http://localhost:3000') ||
    referer.startsWith('http://localhost:3001')
  ));

  if (!isInternal && !isSameOrigin) {
    return NextResponse.json({ error: 'Acesso não autorizado aos registos' }, { status: 401 });
  }

  try {
    await connectDB();
    const events = await WebhookEventModel.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ events });
  } catch (error) {
    console.error('[KIVORA WEBHOOK GET] Erro ao buscar eventos:', error);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}

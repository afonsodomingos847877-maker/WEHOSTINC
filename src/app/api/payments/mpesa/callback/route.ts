import { NextResponse } from 'next/server';
import { addAdminNotification, dispatchMessage } from '@/lib/notifications';
import { connectDB } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';
import SiteModel from '@/lib/models/Site';
import { generateInvoicePdf } from '@/lib/invoiceGenerator';
import { generateHostingCredentials } from '@/lib/provisioning';
import { CourseModel } from '@/lib/models/CourseModel';
import { timingSafeCompare } from '@/lib/serverAuth';

function verifyMpesaCallbackAuth(req: Request): boolean {
  const secret = process.env.MPESA_CALLBACK_SECRET?.trim();
  if (!secret) {
    return false;
  }
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('secret') || '';
  const headerSecret =
    req.headers.get('x-callback-secret') ||
    req.headers.get('x-webhook-secret') ||
    '';
  const authHeader = req.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  return (
    timingSafeCompare(querySecret, secret) ||
    timingSafeCompare(headerSecret, secret) ||
    timingSafeCompare(bearer, secret)
  );
}

export async function POST(req: Request) {
  if (!verifyMpesaCallbackAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized callback' }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log('[M-PESA CALLBACK RECEBIDO]');

    // Extrair dados do callback M-Pesa (formato Vodacom)
    const transactionStatus = String(body.output_ResponseCode || body.TransactionStatus || 'unknown');
    const transactionId = body.output_TransactionID || body.TransactionID || 'N/A';
    const amount = body.output_Amount || body.Amount || 0;
    const msisdn = body.output_MSISDN || body.MSISDN || 'N/A';
    const thirdPartyRef = String(body.input_ThirdPartyReference || body.ThirdPartyReference || body.reference || 'N/A');
    let userEmail = '';
    let userName = msisdn;

    const isSuccess = transactionStatus === '0' || transactionStatus === 'INS-0' || transactionStatus.toUpperCase() === 'SUCCESS';

    // Atualização automática na Base de Dados (Se disponível)
    let orderIdClean = '';
    let existingOrder: any = null;
    try {
      await connectDB();
      if (thirdPartyRef && thirdPartyRef !== 'N/A') {
        orderIdClean = thirdPartyRef.replace(/^ORDER_/i, '').trim();
        if (!/^[a-zA-Z0-9_-]{3,64}$/.test(orderIdClean)) {
          return NextResponse.json({ error: 'Referência de pedido inválida' }, { status: 400 });
        }
        const escapedOrderId = orderIdClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        existingOrder = await OrderModel.findOneAndUpdate(
          { id: { $regex: new RegExp(`^${escapedOrderId}$`, 'i') } },
          { 
            status: isSuccess ? 'completed' : 'pending',
            ...(isSuccess ? { valorFaturado: amount } : {})
          },
          { new: true }
        ).lean();

        if (!existingOrder) {
          return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
        }

        userEmail = String(existingOrder.clientEmail || existingOrder.userEmail || '').trim().toLowerCase();
        userName = existingOrder.clientName || msisdn;

        if (isSuccess && userEmail) {
          await SiteModel.updateMany(
            { userEmail },
            { status: 'active' }
          );
        }
      } else {
        return NextResponse.json({ error: 'Referência ausente' }, { status: 400 });
      }
    } catch (dbErr) {
      console.warn('Alerta no DB durante callback M-Pesa:', dbErr);
      return NextResponse.json({ status: 'ERROR' }, { status: 500 });
    }

    if (isSuccess) {
      // 🟢 CASO DE SUCESSO: Notificar Administrador
      addAdminNotification({
        title: `💳 Pagamento M-Pesa Confirmado`,
        message: `Pagamento de ${Number(amount).toLocaleString('pt-MZ')} MT recebido via M-Pesa (${msisdn}). TxID: ${transactionId}. Ref: ${thirdPartyRef}.`,
        type: 'payment_success',
        userEmail: userEmail || msisdn,
        userName: userName,
        link: '/admin?tab=orders'
      });

      // ✉️ Enviar recibo ao cliente por e-mail
      if (userEmail) {
        let pdfBase64 = '';
        try {
          pdfBase64 = await generateInvoicePdf({
            invoiceNumber: thirdPartyRef,
            invoiceRef: thirdPartyRef,
            customerName: userName || 'Cliente',
            customerEmail: userEmail,
            issuedAt: new Date().toISOString(),
            status: 'paid',
            items: [{
              service: 'Serviços WEHOSTHERE',
              description: 'Pagamento via M-Pesa',
              quantity: 1,
              unitPrice: Number(amount),
              discount: 0,
              subtotal: Number(amount)
            }],
            subtotal: Number(amount),
            discount: 0,
            total: Number(amount),
            currency: 'MZN'
          });
        } catch (err) {
          console.error('Erro ao gerar PDF da fatura:', err);
        }

        await dispatchMessage({
          recipientEmail: userEmail,
          recipientName: userName || 'Cliente',
          templateId: 'payment-confirmed',
          variables: {
            numero_pedido: thirdPartyRef,
            valor: `${Number(amount).toLocaleString('pt-MZ')} MT`
          },
          isAutomatic: true,
          eventType: 'mpesa_payment_success',
          attachments: pdfBase64 ? [{ filename: `Fatura_${thirdPartyRef}.pdf`, content: pdfBase64 }] : []
        });

        // 🔑 AUTO-PROVISIONAMENTO: Enviar credenciais de acesso ao serviço por e-mail
        try {
          const creds = generateHostingCredentials(thirdPartyRef, userEmail);
          await dispatchMessage({
            recipientEmail: userEmail,
            recipientName: userName || 'Cliente',
            templateId: 'service-credentials',
            variables: {
              numero_pedido: thirdPartyRef,
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
          console.error('Erro ao gerar/enviar credenciais de acesso:', credErr);
        }

        // 🎓 Inscrição automática para cursos
        try {
          const order = existingOrder;
          
          if (order && order.serviceName?.toLowerCase().includes('curso') && userEmail) {
            // Buscar cursos para encontrar o curso correspondente
            const courses = await CourseModel.find({});
            
            // Tentar encontrar o curso pelo nome ou pela correspondência parcial
            const matchingCourse = courses.find((course: any) => 
              course.title.toLowerCase().includes(order.serviceName.toLowerCase()) ||
              order.serviceName.toLowerCase().includes(course.title.toLowerCase())
            );

            if (matchingCourse) {
              // Criar inscrição via API
              const enrollmentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'create',
                  enrollment: {
                    userId: userEmail,
                    courseId: matchingCourse.id,
                    status: 'active',
                    enrolledAt: new Date().toISOString(),
                    paymentId: order.id
                  }
                })
              });

              if (enrollmentResponse.ok) {
                console.log('[M-PESA Callback] Inscrição automática criada para:', userEmail, 'no curso:', matchingCourse.title);
                
                // Enviar email de boas-vindas ao curso
                await dispatchMessage({
                  recipientEmail: userEmail,
                  recipientName: userName || 'Cliente',
                  templateId: 'course_enrollment',
                  variables: {
                    courseTitle: matchingCourse.title
                  },
                  isAutomatic: true,
                  eventType: 'course_auto_enrollment'
                });
              }
            }
          }
        } catch (enrollErr) {
          console.error('Erro ao criar inscrição automática no callback M-Pesa:', enrollErr);
          // Não falhar o pagamento se a inscrição falhar
        }
      }
    } else {
      // 🔴 CASO DE ERRO / FALHA: Notificar Administrador
      addAdminNotification({
        title: `⚠️ Pagamento M-Pesa Falhado`,
        message: `Falha no pagamento via M-Pesa de ${msisdn}. Código: ${transactionStatus}. TxID: ${transactionId}. Ref: ${thirdPartyRef}.`,
        type: 'payment_failed',
        userEmail: userEmail || msisdn,
        userName: userName,
        link: '/admin?tab=orders'
      });

      // ✉️ Notificar o cliente sobre a falha no pagamento
      if (userEmail) {
        await dispatchMessage({
          recipientEmail: userEmail,
          recipientName: userName || 'Cliente',
          templateId: 'payment-failed',
          variables: {
            numero_pedido: thirdPartyRef,
            valor: `${Number(amount).toLocaleString('pt-MZ')} MT`
          },
          isAutomatic: true,
          eventType: 'mpesa_payment_failed'
        });
      }
    }

    return NextResponse.json({ status: 'SUCCESS', message: 'Callback processado' });
  } catch (error) {
    console.error('Erro no Callback M-Pesa:', error);
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}

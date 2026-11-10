import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';
import { addAdminNotification, dispatchMessage } from '@/lib/notifications';
import { generateHostingCredentials } from '@/lib/provisioning';
import Affiliate from '@/lib/models/Affiliate';
import Commission from '@/lib/models/Commission';
import AffiliateClick from '@/lib/models/AffiliateClick';
import UserModel from '@/lib/models/User';
import EnrollmentModel from '@/lib/models/Enrollment';
import crypto from 'crypto';
import { getSessionUser, hasValidInternalAuth, isAdminRole, requireAdmin, requireAuth } from '@/lib/serverAuth';

let FALLBACK_ORDERS: any[] = [];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue (orders):', err);
    return false;
  }
}

// Process affiliate commission when order is approved
async function processAffiliateCommission(orderData: any, affiliateCode: string | undefined) {
  try {
    if (!affiliateCode) return;

    // Find affiliate by code
    const affiliate = await Affiliate.findOne({ affiliateCode });
    if (!affiliate || affiliate.status !== 'active') return;

    // Check if commission already exists for this order
    const existingCommission = await Commission.findOne({ orderId: orderData.id });
    if (existingCommission) return;

    // Calculate commission (30%)
    const orderAmount = orderData.valorPorFaturar || orderData.amount || 0;
    const commissionRate = 0.30; // 30%
    const commissionAmount = orderAmount * commissionRate;

    // Create commission
    const commission = await Commission.create({
      affiliateId: affiliate.userId,
      userId: affiliate.userId,
      orderId: orderData.id,
      orderAmount,
      commissionRate,
      commissionAmount,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        changedAt: new Date().toISOString(),
        note: 'Comissão criada automaticamente'
      }],
      referredCustomerEmail: orderData.clientEmail || orderData.userEmail || '',
      referredCustomerName: orderData.clientName || orderData.userName || '',
      createdAt: new Date().toISOString(),
    });

    // Send email notification to affiliate about new commission
    const AffiliateUser = (await import('@/lib/models/User')).default;
    const affiliateUser = await AffiliateUser.findOne({ id: affiliate.userId });
    
    if (affiliateUser) {
      const { dispatchMessage } = await import('@/lib/notifications');
      await dispatchMessage({
        recipientEmail: affiliateUser.email,
        recipientName: affiliateUser.name,
        templateId: 'affiliate-commission-earned',
        variables: {
          nome_afiliado: affiliateUser.name,
          valor_comissao: commissionAmount.toFixed(2),
          valor_pedido: orderAmount.toFixed(2),
          taxa_comissao: (commissionRate * 100).toFixed(0),
          numero_pedido: orderData.id,
          nome_cliente: orderData.clientName || orderData.userName || orderData.clientEmail || orderData.userEmail || 'Cliente',
          data: new Date().toLocaleDateString('pt-MZ'),
        },
        isAutomatic: true,
        eventType: 'affiliate_commission_earned'
      });
    }

    // Update affiliate click to mark as converted
    await AffiliateClick.updateMany(
      {
        affiliateCode,
        convertedToSale: false,
      },
      {
        convertedToSale: true,
        conversionOrderId: orderData.id,
        conversionDate: new Date().toISOString(),
      }
    );

    console.log(`Comissão de afiliado criada: ${commissionAmount} MZN para afiliado ${affiliate.affiliateCode}`);
  } catch (error) {
    console.error('Erro ao processar comissão de afiliado:', error);
  }
}

export async function GET(req: Request) {
  let isAdminOrInternal = hasValidInternalAuth(req);
  let sessionEmail = '';

  if (!isAdminOrInternal) {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;
    isAdminOrInternal = isAdminRole(auth.user.role);
    sessionEmail = auth.user.email.toLowerCase().trim();
  }

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    
    if (await tryMongo()) {
      // Se orderId for fornecido, buscar pedido específico
      if (orderId) {
        const order = await OrderModel.findOne({ id: orderId }).lean() as any;
        if (order) {
          if (!isAdminOrInternal) {
            const ownerEmail = String(order.clientEmail || order.userEmail || '').toLowerCase().trim();
            if (ownerEmail !== sessionEmail) {
              return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
            }
          }
          const amt = Number(order.amount ?? order.valorFaturado ?? order.valorPorFaturar ?? 0);
          const mappedOrder = {
            ...order,
            amount: amt,
            valorFaturado: order.valorFaturado !== undefined ? Number(order.valorFaturado) : (order.status === 'completed' ? amt : 0),
            valorPorFaturar: order.valorPorFaturar !== undefined ? Number(order.valorPorFaturar) : (order.status === 'completed' ? 0 : amt),
          };
          return NextResponse.json({ success: true, order: mappedOrder });
        }
        return NextResponse.json({ success: false, error: 'Pedido não encontrado' }, { status: 404 });
      }
      
      // Admins veem todos os pedidos; clientes apenas os seus próprios pedidos
      const orderQuery: any = {};
      if (!isAdminOrInternal) {
        const escapedEmail = sessionEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        orderQuery.$or = [
          { clientEmail: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } },
          { userEmail: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } }
        ];
      }
      const orders = await OrderModel.find(orderQuery).sort({ createdAt: -1 }).lean();

      // Auto-reconciliação: se existirem pedidos pendentes com faturas já liquidadas/pagas em InvoiceModel
      try {
        const InvoiceModel = (await import('@/lib/models/Invoice')).default;
        const pendingOrders = orders.filter((o: any) => o.status === 'pending');
        if (pendingOrders.length > 0) {
          const orderIds = pendingOrders.map((o: any) => o.id);
          const paidInvoices = await InvoiceModel.find({
            status: 'paid',
            $or: [
              { invoiceNumber: { $in: orderIds } },
              { id: { $in: orderIds } }
            ]
          }).lean();

          if (paidInvoices.length > 0) {
            const paidNumbers = new Set(paidInvoices.map((inv: any) => inv.invoiceNumber).concat(paidInvoices.map((inv: any) => inv.id)));
            for (const o of orders) {
              if (o.status === 'pending' && (paidNumbers.has(o.id) || paidNumbers.has(o.reference))) {
                o.status = 'completed';
                o.valorFaturado = o.amount || o.valorPorFaturar;
                o.valorPorFaturar = 0;
                await OrderModel.updateOne(
                  { id: o.id },
                  { $set: { status: 'completed', valorFaturado: o.valorFaturado, valorPorFaturar: 0, updatedAt: new Date().toISOString() } }
                );
              }
            }
          }
        }
      } catch (recErr) {
        console.warn('[Orders API GET] Aviso na auto-reconciliação de pedidos com faturas:', recErr);
      }

      const mappedOrders = orders.map((o: any) => {
        const amt = Number(o.amount ?? o.valorFaturado ?? o.valorPorFaturar ?? 0);
        return {
          ...o,
          amount: amt,
          valorFaturado: o.valorFaturado !== undefined ? Number(o.valorFaturado) : (o.status === 'completed' ? amt : 0),
          valorPorFaturar: o.valorPorFaturar !== undefined ? Number(o.valorPorFaturar) : (o.status === 'completed' ? 0 : amt),
        };
      });
      return NextResponse.json({ orders: mappedOrders });
    }
  } catch (e) { console.error('MongoDB indisponível (orders):', e); }
  
  // Fallback para memória (restrito ao utilizador autenticado ou admin)
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  const visibleFallback = isAdminOrInternal
    ? FALLBACK_ORDERS
    : FALLBACK_ORDERS.filter(o => String(o.clientEmail || o.userEmail || '').toLowerCase().trim() === sessionEmail);
  
  if (orderId) {
    const order = visibleFallback.find(o => o.id === orderId);
    if (order) {
      return NextResponse.json({ success: true, order });
    }
    return NextResponse.json({ success: false, error: 'Pedido não encontrado' }, { status: 404 });
  }
  
  return NextResponse.json({ orders: visibleFallback });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, order, orderId, status, email, courseTitle } = body;
    const useMongo = await tryMongo();

    // Get affiliate code from cookies for commission tracking
    const affiliateCode = req.headers.get('cookie')?.match(/affiliate_code=([^;]+)/)?.[1];

    // Action otimizado para verificar pagamento de curso específico
    if (action === 'check_course_payment') {
      const auth = await requireAuth(req);
      if (auth.error) return auth.error;

      if (!email || !courseTitle) {
        return NextResponse.json({ hasPaid: false }, { status: 400 });
      }

      const normalizedEmail = String(email).toLowerCase().trim();
      if (!isAdminRole(auth.user.role) && auth.user.email !== normalizedEmail) {
        return NextResponse.json({ hasPaid: false, error: 'Acesso negado' }, { status: 403 });
      }

      const escapedTitle = String(courseTitle).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      if (useMongo) {
        // 1º Prioridade: Verificar Matrícula Ativa no Modelo Enrollment
        const enrollmentExists = await EnrollmentModel.exists({
          studentEmail: normalizedEmail,
          status: 'active',
          $or: [
            { courseTitle: { $regex: escapedTitle, $options: 'i' } },
            { courseId: body.courseId || 'NONE' }
          ]
        });
        if (enrollmentExists) {
          return NextResponse.json({ hasPaid: true });
        }

        // 2º Fallback para Pedido Concluído específico deste curso
        const hasPaid = await OrderModel.exists({
          clientEmail: normalizedEmail,
          status: 'completed',
          serviceName: { $regex: escapedTitle, $options: 'i' }
        });
        return NextResponse.json({ hasPaid: !!hasPaid });
      }

      const hasPaid = FALLBACK_ORDERS.some(o => 
        o.clientEmail?.toLowerCase() === normalizedEmail &&
        o.status === 'completed' &&
        o.serviceName?.toLowerCase().includes(String(courseTitle).toLowerCase())
      );
      return NextResponse.json({ hasPaid });
    }

    if (action === 'update_status') {
      const adminAuth = await requireAdmin(req);
      if (adminAuth.error) return adminAuth.error;

      // 🔒 SEGURANÇA: Apenas administradores autenticados podem alterar status manualmente
      let orderDoc: any = null;
      if (useMongo) {
        orderDoc = await OrderModel.findOne({ id: orderId }).lean();
        
        const isFinished = status === 'completed' || status === 'approved' || status === 'active';
        await OrderModel.findOneAndUpdate(
          { id: orderId },
          { 
            status,
            ...(isFinished ? {
              valorFaturado: orderDoc?.amount || orderDoc?.valorPorFaturar || 0,
              valorPorFaturar: 0,
            } : {}),
            updatedAt: new Date().toISOString()
          }
        );

        // 🔗 Sincronizar automaticamente fatura correspondente em InvoiceModel
        if (isFinished) {
          try {
            const InvoiceModel = (await import('@/lib/models/Invoice')).default;
            const orderRef = orderDoc?.reference || orderId;
            const invoiceFilter = {
              $or: [
                { id: orderId },
                { invoiceNumber: orderId },
                { id: orderRef },
                { invoiceNumber: orderRef }
              ]
            };
            const matchedInvoices = await InvoiceModel.find(invoiceFilter);
            if (matchedInvoices.length > 0) {
              await InvoiceModel.updateMany(invoiceFilter, {
                $set: {
                  status: 'paid',
                  paidAt: new Date().toISOString(),
                  paymentMethod: orderDoc?.paymentMethod || 'manual',
                  updatedAt: new Date().toISOString()
                }
              });
            } else if (orderDoc?.clientEmail) {
              await InvoiceModel.updateMany(
                {
                  customerEmail: { $regex: new RegExp(`^${orderDoc.clientEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                  status: { $in: ['pending', 'draft'] }
                },
                {
                  $set: {
                    status: 'paid',
                    paidAt: new Date().toISOString(),
                    paymentMethod: orderDoc?.paymentMethod || 'manual',
                    updatedAt: new Date().toISOString()
                  }
                }
              );
            }
          } catch (invSyncErr) {
            console.error('[API/orders] Erro ao sincronizar fatura com pedido:', invSyncErr);
          }
        } else if (status === 'cancelled') {
          try {
            const InvoiceModel = (await import('@/lib/models/Invoice')).default;
            await InvoiceModel.updateMany(
              {
                $or: [
                  { id: orderId },
                  { invoiceNumber: orderId },
                  { id: orderDoc?.reference || '' },
                  { invoiceNumber: orderDoc?.reference || '' }
                ]
              },
              {
                $set: {
                  status: 'cancelled',
                  updatedAt: new Date().toISOString()
                }
              }
            );
          } catch {}
        }
      }

      // Mapear status para texto legível
      const statusLabels: Record<string, string> = {
        pending: 'Pendente', active: 'Ativo', approved: 'Aprovado',
        rejected: 'Rejeitado', cancelled: 'Cancelado', completed: 'Concluído'
      };
      const statusLabel = statusLabels[status] || status;

      const notifTypeMap: Record<string, string> = {
        approved: 'order_approved', rejected: 'order_rejected',
        cancelled: 'order_cancelled', active: 'order_approved'
      };
      const notifType = notifTypeMap[status] || 'order_updated';

      const templateMap: Record<string, string> = {
        approved: 'order-approved', rejected: 'order-rejected',
        cancelled: 'order-cancelled'
      };
      const templateId = templateMap[status] || 'order-status-changed';

      if (useMongo) {
        if (orderDoc) {
          addAdminNotification({
            title: `📋 Pedido #${orderId} → ${statusLabel}`,
            message: `Estado do pedido de ${orderDoc.clientName || orderDoc.clientEmail || 'cliente'} atualizado para "${statusLabel}".`,
            type: notifType as any,
            userEmail: orderDoc.clientEmail,
            userName: orderDoc.clientName,
            link: '/admin?tab=orders'
          });

          if (orderDoc.clientEmail) {
            dispatchMessage({
              recipientEmail: orderDoc.clientEmail,
              recipientName: orderDoc.clientName || orderDoc.clientEmail.split('@')[0],
              templateId,
              variables: {
                numero_pedido: orderId,
                valor: `${(orderDoc.valorPorFaturar || orderDoc.amount || 0).toLocaleString('pt-MZ')} MT`,
                estado_pedido: statusLabel
              },
              isAutomatic: true,
              eventType: `order_${status}`
            });

            // 🎓 AUTO-MATRÍCULA DE CURSO AO CONFIRMAR PEDIDO
            if (status === 'approved' || status === 'completed' || status === 'active') {
              try {
                const sName = (orderDoc.serviceName || '');
                if (sName.toLowerCase().includes('curso')) {
                  const targetEmail = (orderDoc.clientEmail || '').toLowerCase().trim();
                  const cleanTitle = sName.replace(/^curso:\s*/i, '').replace(/\(.*\)/, '').trim();
                  const existingEnr = await EnrollmentModel.findOne({
                    studentEmail: targetEmail,
                    courseTitle: { $regex: cleanTitle, $options: 'i' },
                    status: 'active'
                  });

                  const isSecondInstallment = (orderDoc as any).installmentNumber === 2 || sName.toLowerCase().includes('2ª parcela');
                  const isInstallments = (orderDoc as any).installments === 2 || sName.toLowerCase().includes('parcela');

                  if (existingEnr) {
                    if (isSecondInstallment) {
                      existingEnr.installmentsPaid = 2;
                      existingEnr.remainingAmount = 0;
                      existingEnr.amountPaid = (existingEnr.amountPaid || 0) + (orderDoc.amount || 0);
                      await existingEnr.save();
                    }
                  } else {
                    const claimToken = 'CLM_' + crypto.randomBytes(16).toString('hex');
                    const paid = orderDoc.amount || 0;
                    const totalAmt = (orderDoc as any).totalCoursePrice || (isInstallments ? paid * 2 : paid);
                    const remaining = isInstallments ? Math.max(0, totalAmt - paid) : 0;

                    await EnrollmentModel.create({
                      id: 'ENR_' + Date.now().toString().slice(-6) + '_' + Math.floor(100 + Math.random() * 900),
                      courseId: (orderDoc as any).courseId || 'COURSE_AUTO',
                      courseTitle: cleanTitle || sName,
                      studentEmail: targetEmail,
                      studentName: orderDoc.clientName || 'Aluno',
                      studentPhone: orderDoc.clientPhone || '',
                      orderId: orderDoc.id,
                      paymentReference: orderDoc.reference || orderDoc.kivoraPaymentId,
                      amountPaid: paid,
                      paymentMethod: orderDoc.paymentMethod || 'mpesa',
                      paymentPlan: isInstallments ? 'installments_2x' : 'full',
                      installmentsTotal: isInstallments ? 2 : 1,
                      installmentsPaid: isSecondInstallment ? 2 : 1,
                      totalCourseAmount: totalAmt,
                      remainingAmount: remaining,
                      claimToken,
                      claimed: false,
                      status: 'active',
                      enrolledAt: new Date().toISOString()
                    });
                  }
                }
              } catch (enrErr) {
                console.warn('[Orders API] Erro ao criar matrícula automática:', enrErr);
              }
            }

            // 🚀 ATIVAR PLANO NO MODELO DE UTILIZADOR
            if (status === 'approved' || status === 'completed' || status === 'active') {
              try {
                const sName = (orderDoc.serviceName || '').toLowerCase();
                let detectedPlan: 'basic' | 'pro' | 'enterprise' | null = null;
                if (sName.includes('básico') || sName.includes('basico') || sName.includes('basic')) {
                  detectedPlan = 'basic';
                } else if (sName.includes('profissional') || sName.includes('pro')) {
                  detectedPlan = 'pro';
                } else if (sName.includes('empresarial') || sName.includes('enterprise')) {
                  detectedPlan = 'enterprise';
                }

                if (detectedPlan && orderDoc.clientEmail) {
                  await UserModel.findOneAndUpdate(
                    { email: { $regex: new RegExp(`^${orderDoc.clientEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
                    { plan: detectedPlan, status: 'active' }
                  );
                }
              } catch (planErr) {
                console.error('Erro ao atualizar plano do usuário no MongoDB:', planErr);
              }
            }

            // 🔑 AUTO-PROVISIONAMENTO: Se o pedido foi APROVADO, enviar credenciais de acesso
            if (status === 'approved' || status === 'completed' || status === 'active') {
              try {
                const creds = generateHostingCredentials(orderId, orderDoc.clientEmail);
                await dispatchMessage({
                  recipientEmail: orderDoc.clientEmail,
                  recipientName: orderDoc.clientName || 'Cliente',
                  templateId: 'service-credentials',
                  variables: {
                    numero_pedido: orderId,
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
                console.error('Erro ao enviar credenciais ao cliente:', credErr);
              }

              // Process affiliate commission
              await processAffiliateCommission(orderDoc, affiliateCode);
            }
          }
        }

        return NextResponse.json({ success: true, orders: await OrderModel.find({}).sort({ createdAt: -1 }).lean() });
      }

      const fallbackOrder = FALLBACK_ORDERS.find(o => o.id === orderId);
      FALLBACK_ORDERS = FALLBACK_ORDERS.map(o => o.id === orderId ? { ...o, status } : o);

      if (fallbackOrder) {
        addAdminNotification({
          title: `📋 Pedido #${orderId} → ${statusLabel}`,
          message: `Estado do pedido de ${fallbackOrder.clientName || fallbackOrder.clientEmail || 'cliente'} atualizado para "${statusLabel}".`,
          type: notifType as any,
          userEmail: fallbackOrder.clientEmail,
          userName: fallbackOrder.clientName,
          link: '/admin?tab=orders'
        });
      }

      return NextResponse.json({ success: true, orders: FALLBACK_ORDERS });
    }

    if (action === 'delete') {
      const adminAuth = await requireAdmin(req);
      if (adminAuth.error) return adminAuth.error;

      const targetId = (orderId || body.id || '').toLowerCase().trim();
      const escapedTargetId = targetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (useMongo) {
        if (targetId) {
          await OrderModel.deleteMany({ id: { $regex: new RegExp(`^${escapedTargetId}$`, 'i') } });
        }
        return NextResponse.json({ success: true, orders: await OrderModel.find({}).sort({ createdAt: -1 }).lean() });
      }
      FALLBACK_ORDERS = FALLBACK_ORDERS.filter(o => o.id?.toLowerCase() !== targetId);
      return NextResponse.json({ success: true, orders: FALLBACK_ORDERS });
    }

    const sessionUser = await getSessionUser(req);
    const isAdmin = isAdminRole(sessionUser?.role);

    const rawOrder = order || { 
      id: body.id || `ORD-${Date.now().toString().slice(-5)}`, 
      clientName: body.clientName, 
      clientEmail: body.clientEmail, 
      clientPhone: body.clientPhone || '', 
      serviceName: body.serviceName, 
      amount: body.amount,
      valorFaturado: body.valorFaturado || 0,
      valorPorFaturar: body.valorPorFaturar || body.amount || 0,
      paymentMethod: body.paymentMethod || 'bank_transfer', 
      proofUrl: body.proofUrl, 
      proofName: body.proofName, 
      status: body.status || 'pending', 
      createdAt: body.createdAt || new Date().toISOString() 
    };

    const orderData = {
      ...rawOrder,
      ...(isAdmin ? {} : {
        status: 'pending',
        valorFaturado: 0,
        valorPorFaturar: Number(rawOrder.amount || rawOrder.valorPorFaturar || 0),
      }),
    };

    if (useMongo) {
      const existing = await OrderModel.findOne({ id: orderData.id }).lean() as any;
      if (existing && !isAdmin) {
        const ownerEmail = String(existing.clientEmail || existing.userEmail || '').toLowerCase().trim();
        const isSameOwner = sessionUser && ownerEmail === sessionUser.email;
        if (!isSameOwner || existing.status !== 'pending') {
          return NextResponse.json({ error: 'Não autorizado a modificar pedido existente.' }, { status: 403 });
        }
        await OrderModel.findOneAndUpdate(
          { id: orderData.id },
          {
            $set: {
              ...(orderData.proofUrl ? { proofUrl: orderData.proofUrl, proofName: orderData.proofName } : {}),
              ...(orderData.paymentMethod ? { paymentMethod: orderData.paymentMethod } : {}),
              updatedAt: new Date().toISOString(),
            },
          }
        );
        return NextResponse.json({ success: true, order: existing });
      }
      const isNew = !existing;
      await OrderModel.findOneAndUpdate({ id: orderData.id }, orderData, { upsert: true, new: true });

      if (isNew) {
        // Notificar admin de novo pedido
        addAdminNotification({
          title: `📦 Novo Pedido: #${orderData.id}`,
          message: `${orderData.clientName || orderData.userEmail || 'Cliente'} criou um novo pedido de ${orderData.serviceName || 'serviço'} no valor de ${(orderData.valorPorFaturar || orderData.amount || 0).toLocaleString('pt-MZ')} MT.`,
          type: 'order_new',
          userEmail: orderData.clientEmail || orderData.userEmail,
          userName: orderData.clientName || orderData.userName,
          link: '/admin?tab=orders'
        });

        // 🔔 Push imediato para admins no telemóvel (awaited para garantir entrega no runtime serverless/Vercel)
        try {
          const { sendPushToAdmins } = await import('@/lib/pushService');
          await sendPushToAdmins({
            title: `📦 Novo Pedido: ${orderData.serviceName || 'Serviço'}`,
            message: `${orderData.clientName || orderData.clientEmail || 'Cliente'} fez um pedido de ${(orderData.valorPorFaturar || orderData.amount || 0).toLocaleString('pt-MZ')} MT.`,
            url: '/admin?tab=orders',
            tag: `new-order-${orderData.id}`
          });
        } catch (pushErr) {
          console.warn('[Orders API] Falha não impeditiva ao disparar push:', pushErr);
        }

        // 📧 Notificação imediata por e-mail para todos os Administradores
        try {
          const { sendEmail } = await import('@/lib/sendgrid');
          const adminEmailsSet = new Set<string>();
          if (process.env.ADMIN_NOTIFICATION_EMAIL) adminEmailsSet.add(process.env.ADMIN_NOTIFICATION_EMAIL);
          if (process.env.ADMIN_EMAIL) adminEmailsSet.add(process.env.ADMIN_EMAIL);

          try {
            const adminUsers = await UserModel.find({ role: { $in: ['admin', 'super_admin'] } }).select('email').lean();
            adminUsers.forEach((u: any) => {
              if (u?.email) adminEmailsSet.add(u.email);
            });
          } catch (dbErr) {
            console.warn('[Orders API] Falha ao consultar administradores na base de dados:', dbErr);
          }

          if (adminEmailsSet.size === 0) {
            adminEmailsSet.add('info@wehosthere.com');
          }

          for (const recipient of Array.from(adminEmailsSet)) {
            await sendEmail({
              to: recipient,
              subject: `🛒 Novo Pedido #${orderData.id}: ${orderData.clientName || 'Cliente'} - ${orderData.serviceName || 'Serviço'}`,
              text: `Olá Administrador,\n\nUm novo pedido foi registado na plataforma:\n\n• Pedido: #${orderData.id}\n• Cliente: ${orderData.clientName || 'Cliente'} (${orderData.clientEmail || orderData.userEmail || 'N/A'})\n• Serviço: ${orderData.serviceName || 'Plano de Hospedagem / Domínio'}\n• Valor: ${(orderData.valorPorFaturar || orderData.amount || 0).toLocaleString('pt-MZ')} MT\n• Método de Pagamento: ${orderData.paymentMethod || 'N/A'}\n• Estado: ${orderData.status || 'Pendente'}\n• Data: ${new Date().toLocaleString('pt-MZ')}\n\nAceda ao painel administrativo para verificar:\nhttps://wehosthere.com/admin?tab=orders\n\nAtenciosamente,\nSistema de Notificações WEHOSTHERE`
            });
          }
        } catch (adminMailErr) {
          console.warn('[Orders API] Falha não impeditiva ao enviar email ao admin:', adminMailErr);
        }

        // Enviar e-mail ao cliente
        dispatchMessage({
          recipientEmail: orderData.clientEmail || orderData.userEmail || '',
          recipientName: orderData.clientName || orderData.userName || 'Cliente',
          templateId: 'order-received',
          variables: {
            numero_pedido: orderData.id,
            valor: `${(orderData.valorPorFaturar || orderData.amount || 0).toLocaleString('pt-MZ')} MT`,
            estado_pedido: 'Pendente'
          },
          isAutomatic: true,
          eventType: 'order_new'
        });
      }

      return NextResponse.json(
        isAdmin
          ? { success: true, order: orderData, orders: await OrderModel.find({}).sort({ createdAt: -1 }).lean() }
          : { success: true, order: orderData }
      );
    }
    if (!isAdmin) {
      return NextResponse.json({ success: true, order: orderData });
    }
    const idx = FALLBACK_ORDERS.findIndex(o => o.id === orderData.id);
    const isNewFallback = idx < 0;
    if (idx >= 0) FALLBACK_ORDERS[idx] = { ...FALLBACK_ORDERS[idx], ...orderData };
    else FALLBACK_ORDERS.unshift(orderData);

    if (isNewFallback) {
      addAdminNotification({
        title: `📦 Novo Pedido: #${orderData.id}`,
        message: `${orderData.clientName || orderData.userEmail || 'Cliente'} criou um novo pedido de ${orderData.serviceName || 'serviço'}.`,
        type: 'order_new',
        userEmail: orderData.clientEmail || orderData.userEmail,
        userName: orderData.clientName || orderData.userName,
        link: '/admin?tab=orders'
      });

      // 🔔 Push imediato para admins no telemóvel (fallback)
      try {
        const { sendPushToAdmins } = await import('@/lib/pushService');
        await sendPushToAdmins({
          title: `📦 Novo Pedido: ${orderData.serviceName || 'Serviço'}`,
          message: `${orderData.clientName || orderData.clientEmail || 'Cliente'} fez um pedido de ${(orderData.valorPorFaturar || orderData.amount || 0).toLocaleString('pt-MZ')} MT.`,
          url: '/admin?tab=orders',
          tag: `new-order-${orderData.id}`
        });
      } catch (pushErr) {
        console.warn('[Orders API Fallback] Falha não impeditiva ao disparar push:', pushErr);
      }

      // 📧 Notificação imediata por e-mail para o Administrador (fallback)
      try {
        const { sendEmail } = await import('@/lib/sendgrid');
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'info@wehosthere.com';
        await sendEmail({
          to: adminEmail,
          subject: `📦 Novo Pedido #${orderData.id}: ${orderData.clientName || 'Cliente'} - ${orderData.serviceName || 'Serviço'}`,
          text: `Olá Administrador,\n\nUm novo pedido foi registado na plataforma:\n\n• Pedido: #${orderData.id}\n• Cliente: ${orderData.clientName || 'Cliente'} (${orderData.clientEmail || orderData.userEmail || 'N/A'})\n• Serviço: ${orderData.serviceName || 'Plano de Hospedagem / Domínio'}\n• Valor: ${(orderData.valorPorFaturar || orderData.amount || 0).toLocaleString('pt-MZ')} MT\n• Método de Pagamento: ${orderData.paymentMethod || 'N/A'}\n• Estado: ${orderData.status || 'Pendente'}\n• Data: ${new Date().toLocaleString('pt-MZ')}\n\nAceda ao painel administrativo para verificar:\nhttps://wehosthere.com/admin?tab=orders\n\nAtenciosamente,\nSistema de Notificações WEHOSTHERE`
        });
      } catch (adminMailErr) {
        console.warn('[Orders API Fallback] Falha ao enviar email ao admin:', adminMailErr);
      }

      dispatchMessage({
        recipientEmail: orderData.clientEmail || orderData.userEmail || '',
        recipientName: orderData.clientName || orderData.userName || 'Cliente',
        templateId: 'order-received',
        variables: {
          numero_pedido: orderData.id,
          valor: `${(orderData.valorPorFaturar || orderData.amount || 0).toLocaleString('pt-MZ')} MT`,
          estado_pedido: 'Pendente'
        },
        isAutomatic: true,
        eventType: 'order_new'
      });
    }

    return NextResponse.json({ success: true, order: orderData, orders: FALLBACK_ORDERS });
  } catch (error) {
    console.error('Erro na API de Pedidos:', error);
    return NextResponse.json({ error: 'Erro ao processar pedidos' }, { status: 500 });
  }
}

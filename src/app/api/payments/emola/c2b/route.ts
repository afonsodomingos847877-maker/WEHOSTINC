import { NextResponse } from 'next/server';
import { kivora } from '@/lib/kivora';
import { notifyAdminPaymentError } from '@/lib/paymentAlerts';

export async function POST(req: Request) {
  let parsedBody: any = {};
  try {
    const body = await req.json();
    parsedBody = body;
    const { msisdn, amount, reference, thirdPartyReference, clientName, clientEmail, serviceName } = body;

    const devErrorMsg = 'O pagamento automático via e-Mola encontra-se temporariamente em desenvolvimento. Por favor, utilize M-Pesa ou Transferência / Comprovativo.';
    try {
      await notifyAdminPaymentError({
        clientName,
        clientEmail,
        clientPhone: msisdn,
        serviceName,
        paymentMethod: 'emola',
        amount: typeof amount === 'number' ? amount : Number(amount),
        reference: reference || thirdPartyReference,
        reason: 'Tentativa de pagamento e-Mola (método em desenvolvimento)'
      });
    } catch (notifyErr) {
      console.error('[EMOLA C2B] Falha ao notificar admin:', notifyErr);
    }

    return NextResponse.json(
      {
        error: devErrorMsg,
        status: 'in_development',
        adminNotified: true
      },
      { status: 400 }
    );

    // Normalizar número de telefone para Kivora (remover +258 se presente)
    let phone = msisdn.replace(/\D/g, '');
    if (phone.startsWith('258')) {
      phone = phone.substring(3);
    }

    const paymentRef = reference || thirdPartyReference || `REF_${Date.now()}`;
    const orderId = thirdPartyReference || `ORD-${Date.now().toString().slice(-6)}`;

    // 🔔 Push imediato: pagamento eMola (dispara ANTES da Kivora para garantir alerta mesmo em caso de erro no gateway)
    try {
      const { sendPushToAdmins } = await import('@/lib/pushService');
      await sendPushToAdmins({
        title: '💰 Pagamento eMola',
        message: `${clientName || 'Um cliente'} (${msisdn}) iniciou pagamento de ${amount} MZN para "${serviceName || 'Serviço'}".`,
        url: '/admin?tab=orders',
        tag: `emola-payment-${orderId}`
      });
    } catch (pushErr) {
      console.warn('[EMOLA C2B] Falha não impeditiva ao disparar push:', pushErr);
    }

    // Usar API Kivora como gateway para processar pagamento eMola
    const result = await kivora.createC2BPayment({
      phone,
      amount,
      currency: 'MZN',
      reference: paymentRef,
      description: `Pagamento eMola via Kivora - ${serviceName || reference || 'Serviço'}`,
      senderName: 'WEHOSTHERE', // Nome que aparece no telemóvel do cliente
      customer: {
        name: clientName || undefined,
        email: clientEmail || undefined,
        phone: msisdn
      },
      metadata: {
        clientName,
        clientEmail,
        clientPhone: msisdn,
        serviceName
      }
    });

    console.log('[EMOLA C2B VIA KIVORA RESPONSE]:', result);

    // Persistir/Criar o pedido imediatamente no MongoDB com status 'pending' para que apareça no painel admin
    if (result.id) {
      try {
        const { connectDB } = await import('@/lib/mongodb');
        const OrderModel = (await import('@/lib/models/Order')).default;
        await connectDB();

        await OrderModel.findOneAndUpdate(
          {
            $or: [
              { id: orderId },
              { reference: paymentRef },
              { kivoraPaymentId: result.id }
            ]
          },
          {
            $set: {
              id: orderId,
              clientName: clientName || 'Cliente eMola',
              clientEmail: clientEmail || 'cliente@emola.mz',
              clientPhone: msisdn,
              serviceName: serviceName || 'Pagamento eMola',
              amount,
              paymentMethod: 'emola',
              kivoraPaymentId: result.id,
              reference: paymentRef,
              status: 'pending'
            },
            $setOnInsert: {
              createdAt: new Date().toISOString()
            }
          },
          { upsert: true, new: true }
        );
        console.log(`[EMOLA C2B] Pedido ${orderId} registado no MongoDB com kivoraPaymentId ${result.id}`);
      } catch (dbErr) {
        console.error('[EMOLA C2B] Erro ao gravar pedido no MongoDB:', dbErr);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Falha ao processar pagamento via eMola';
    console.error('Erro na rota API eMola C2B (via Kivora):', error);
    try {
      await notifyAdminPaymentError({
        clientName: parsedBody?.clientName,
        clientEmail: parsedBody?.clientEmail,
        clientPhone: parsedBody?.msisdn,
        serviceName: parsedBody?.serviceName,
        paymentMethod: 'emola',
        amount: typeof parsedBody?.amount === 'number' ? parsedBody.amount : Number(parsedBody?.amount),
        reference: parsedBody?.reference || parsedBody?.thirdPartyReference,
        reason: errorMsg
      });
    } catch (notifyErr) {
      console.error('[EMOLA C2B] Falha ao notificar admin sobre erro:', notifyErr);
    }
    return NextResponse.json(
      { error: errorMsg, adminNotified: true },
      { status: 500 }
    );
  }
}

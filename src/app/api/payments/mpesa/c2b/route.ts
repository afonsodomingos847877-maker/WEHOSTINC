import { NextResponse } from 'next/server';
import { kivora } from '@/lib/kivora';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let parsedBody: any = {};
  try {
    const body = await req.json();
    parsedBody = body;
    const { msisdn, amount, reference, thirdPartyReference, clientName, clientEmail, serviceName } = body;

    if (!msisdn || !amount) {
      return NextResponse.json(
        { error: 'Parâmetros msisdn e amount são obrigatórios.' },
        { status: 400 }
      );
    }

    // Normalizar número de telefone para Kivora (remover +258 se presente)
    let phone = msisdn.replace(/\D/g, '');
    if (phone.startsWith('258')) {
      phone = phone.substring(3);
    }

    const paymentRef = reference || thirdPartyReference || `REF_${Date.now()}`;
    const orderId = thirdPartyReference || `ORD-${Date.now().toString().slice(-6)}`;

    // 🔔 Push em background (NÃO bloqueia a resposta ao cliente nem o gateway)
    (async () => {
      try {
        const { sendPushToAdmins } = await import('@/lib/pushService');
        await sendPushToAdmins({
          title: '💰 Pagamento M-Pesa',
          message: `${clientName || 'Um cliente'} (${msisdn}) iniciou pagamento de ${amount} MZN para "${serviceName || 'Serviço'}".`,
          url: '/admin?tab=orders',
          tag: `mpesa-payment-${orderId}`,
        });
      } catch (pushErr) {
        console.warn('[M-PESA C2B] Falha não impeditiva ao disparar push:', pushErr);
      }
    })();

    // Usar API Kivora como gateway para processar pagamento M-Pesa
    const result = await kivora.createC2BPayment({
      phone,
      amount,
      currency: 'MZN',
      reference: paymentRef,
      description: `Pagamento M-Pesa via Kivora - ${serviceName || reference || 'Serviço'}`,
      senderName: 'WEHOSTHERE',
      customer: {
        name: clientName || undefined,
        email: clientEmail || undefined,
        phone: msisdn,
      },
      metadata: {
        clientName,
        clientEmail,
        clientPhone: msisdn,
        serviceName,
      },
    });

    console.log('[M-PESA C2B VIA KIVORA RESPONSE]:', result);

    const normalizedKivoraStatus = String(result?.status || '').toLowerCase();
    const initialOrderStatus =
      normalizedKivoraStatus === 'paid' || normalizedKivoraStatus === 'completed'
        ? 'completed'
        : normalizedKivoraStatus === 'failed' || normalizedKivoraStatus === 'cancelled'
        ? 'cancelled'
        : 'pending';

    // Persistir o pedido no MongoDB ANTES de responder para garantir que o polling encontre o kivoraPaymentId imediatamente
    if (result?.id) {
      try {
        const { connectDB } = await import('@/lib/mongodb');
        const OrderModel = (await import('@/lib/models/Order')).default;
        await connectDB();

        await OrderModel.findOneAndUpdate(
          {
            $or: [
              { id: orderId },
              { reference: paymentRef },
              { kivoraPaymentId: result.id },
            ],
          },
          {
            $set: {
              id: orderId,
              clientName: clientName || 'Cliente M-Pesa',
              clientEmail: clientEmail || 'cliente@mpesa.mz',
              clientPhone: msisdn,
              serviceName: serviceName || 'Pagamento M-Pesa',
              amount,
              paymentMethod: 'mpesa',
              kivoraPaymentId: result.id,
              reference: paymentRef,
              status: initialOrderStatus,
              ...(initialOrderStatus === 'completed'
                ? { valorFaturado: amount, valorPorFaturar: 0, paidAt: new Date().toISOString() }
                : {}),
            },
            $setOnInsert: {
              createdAt: new Date().toISOString(),
            },
          },
          { upsert: true, new: true }
        );
        console.log(`[M-PESA C2B] Pedido ${orderId} registado no MongoDB com kivoraPaymentId ${result.id} (${initialOrderStatus})`);
      } catch (dbErr) {
        console.error('[M-PESA C2B] Erro ao gravar pedido no MongoDB:', dbErr);
      }
    }

    return NextResponse.json({
      ...result,
      kivoraPaymentId: result?.id,
      reference: paymentRef,
      orderId,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Falha ao processar pagamento via M-Pesa';
    console.error('Erro na rota API M-Pesa C2B (via Kivora):', error);
    try {
      const { notifyAdminPaymentError } = await import('@/lib/paymentAlerts');
      await notifyAdminPaymentError({
        clientName: parsedBody?.clientName,
        clientEmail: parsedBody?.clientEmail,
        clientPhone: parsedBody?.msisdn,
        serviceName: parsedBody?.serviceName,
        paymentMethod: 'mpesa',
        amount: typeof parsedBody?.amount === 'number' ? parsedBody.amount : Number(parsedBody?.amount),
        reference: parsedBody?.reference || parsedBody?.thirdPartyReference,
        reason: errorMsg,
      });
    } catch (notifyErr) {
      console.error('[M-PESA C2B] Falha ao notificar admin sobre erro:', notifyErr);
    }
    return NextResponse.json(
      { error: errorMsg, adminNotified: true },
      { status: 500 }
    );
  }
}

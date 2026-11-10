import { NextResponse } from 'next/server';
import { addAdminNotification, dispatchMessage } from '@/lib/notifications';
import { connectDB } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';

export async function POST(req: Request) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rl = rateLimit(getRateLimitIdentifier(clientIp, 'mpesa_timeout'), 10, 60000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Muitas solicitações.' }, { status: 429 });
    }

    const body = await req.json();
    const { clientEmail, clientName, amount, orderRef } = body;

    if (!clientEmail || !orderRef) {
      return NextResponse.json({ error: 'clientEmail e orderRef são obrigatórios.' }, { status: 400 });
    }

    const cleanEmail = String(clientEmail).trim().toLowerCase();
    const cleanRef = String(orderRef).trim();

    await connectDB();
    const matchingOrder = await OrderModel.findOne({
      $and: [
        { $or: [{ id: cleanRef }, { reference: cleanRef }, { kivoraPaymentId: cleanRef }] },
        { $or: [{ clientEmail: cleanEmail }, { userEmail: cleanEmail }] }
      ]
    }).lean() as any;

    if (!matchingOrder) {
      return NextResponse.json({ error: 'Pedido correspondente não encontrado.' }, { status: 404 });
    }

    const verifiedEmail = String(matchingOrder.clientEmail || cleanEmail).trim().toLowerCase();
    const verifiedName = String(matchingOrder.clientName || clientName || 'Cliente');

    // 🔴 Notificar Administrador sobre tempo limite de pagamento M-Pesa
    addAdminNotification({
      title: `⏳ M-Pesa: Tempo Expirado / PIN Não Digitado`,
      message: `O cliente ${verifiedName} não introduziu o PIN a tempo ou cancelou no telemóvel. Ref: ${cleanRef}.`,
      type: 'payment_failed',
      userEmail: verifiedEmail,
      userName: verifiedName,
      link: '/admin?tab=orders'
    });

    // ✉️ Enviar e-mail automático ao cliente sobre o tempo expirado / falha no PIN
    const result = await dispatchMessage({
      recipientEmail: verifiedEmail,
      recipientName: verifiedName,
      templateId: 'payment-failed',
      variables: {
        numero_pedido: cleanRef,
        valor: typeof amount === 'number' ? `${amount.toLocaleString('pt-MZ')} MT` : (amount || 'N/A')
      },
      isAutomatic: true,
      eventType: 'mpesa_payment_timeout'
    });

    return NextResponse.json({ success: true, emailSent: result.success });
  } catch (error) {
    console.error('Erro no endpoint de timeout M-Pesa:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

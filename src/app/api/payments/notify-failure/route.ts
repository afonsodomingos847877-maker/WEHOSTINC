import { NextResponse } from 'next/server';
import { notifyAdminPaymentError } from '@/lib/notifications';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';

export async function POST(req: Request) {
  try {
    const clientIp =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rl = rateLimit(getRateLimitIdentifier(clientIp, 'payment_failure_alert'), 10, 60000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Muitas solicitações.' }, { status: 429 });
    }

    const body = await req.json();
    const {
      clientName,
      clientEmail,
      clientPhone,
      serviceName,
      paymentMethod,
      amount,
      reference,
      reason
    } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Motivo é obrigatório.' }, { status: 400 });
    }

    await notifyAdminPaymentError({
      clientName,
      clientEmail,
      clientPhone,
      serviceName,
      paymentMethod,
      amount: typeof amount === 'number' ? amount : Number(amount),
      reference,
      reason: String(reason)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PAYMENT NOTIFY FAILURE] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

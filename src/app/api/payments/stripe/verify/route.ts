import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: 'STRIPE_SECRET_KEY não configurado.' },
        { status: 500 }
      );
    }

    const sessionId = request.nextUrl.searchParams.get('sessionId')?.trim();
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId é obrigatório.' },
        { status: 400 }
      );
    }

    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: 'no-store',
    });

    const session = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: session?.error?.message || 'Sessão Stripe não encontrada.' },
        { status: res.status || 400 }
      );
    }

    const paid = session.payment_status === 'paid';
    return NextResponse.json({
      success: true,
      paid,
      paymentStatus: session.payment_status,
      status: session.status,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || session.customer_email,
      orderReference: session.client_reference_id || session.metadata?.orderReference,
      metadata: session.metadata || {},
    });
  } catch (error: any) {
    console.error('[Stripe Verify] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao verificar sessão Stripe.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_MZN_PER_USD = 63.9;

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: 'STRIPE_SECRET_KEY não configurado no servidor.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const amountMzn = Number(body.amountMzn || 0);
    const serviceName = String(body.serviceName || 'Serviço WEHOSTHERE').trim();
    const customerEmail = String(body.customerEmail || '').trim();
    const orderReference = String(body.orderReference || `WH-${Date.now()}`).trim();
    const successUrl = String(body.successUrl || '').trim();
    const cancelUrl = String(body.cancelUrl || '').trim();
    const metadata = (body.metadata && typeof body.metadata === 'object') ? body.metadata : {};

    if (!Number.isFinite(amountMzn) || amountMzn <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valor inválido para pagamento com cartão.' },
        { status: 400 }
      );
    }
    if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { success: false, error: 'URLs de retorno (successUrl / cancelUrl) são obrigatórias.' },
        { status: 400 }
      );
    }

    const currency = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
    const rate = Number(process.env.MZN_TO_USD_RATE || DEFAULT_MZN_PER_USD) || DEFAULT_MZN_PER_USD;
    const unitAmount =
      currency === 'mzn'
        ? Math.max(5000, Math.round(amountMzn * 100))
        : Math.max(50, Math.round((amountMzn / rate) * 100)); // Stripe minimum $0.50 USD

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('payment_method_types[]', 'card');
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('client_reference_id', orderReference);
    if (customerEmail && customerEmail.includes('@')) {
      params.append('customer_email', customerEmail);
    }

    params.append('line_items[0][quantity]', '1');
    params.append('line_items[0][price_data][currency]', currency);
    params.append('line_items[0][price_data][unit_amount]', String(unitAmount));
    params.append('line_items[0][price_data][product_data][name]', serviceName.slice(0, 120));
    params.append(
      'line_items[0][price_data][product_data][description]',
      `Ref: ${orderReference} • Valor original: ${amountMzn.toLocaleString('pt-MZ')} MT`
    );

    params.append('metadata[orderReference]', orderReference);
    params.append('metadata[amountMzn]', String(amountMzn));
    for (const [k, v] of Object.entries(metadata)) {
      if (v !== undefined && v !== null) {
        params.append(`metadata[${k}]`, String(v).slice(0, 200));
      }
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await stripeRes.json();
    if (!stripeRes.ok || !data?.url) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error?.message || 'Falha ao iniciar sessão Stripe Checkout.',
        },
        { status: stripeRes.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: data.id,
      url: data.url,
      unitAmount,
      currency,
    });
  } catch (error: any) {
    console.error('[Stripe Checkout] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro interno ao criar sessão Stripe.' },
      { status: 500 }
    );
  }
}

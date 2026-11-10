import { NextResponse } from 'next/server';
import { kivora } from '@/lib/kivora';
import { requireAdmin } from '@/lib/serverAuth';

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { phone, amount, reference } = body;

    if (!phone || !amount) {
      return NextResponse.json(
        { error: 'Parâmetros phone e amount são obrigatórios.' },
        { status: 400 }
      );
    }

    // Usar API Kivora para processar payout B2C
    const result = await kivora.createB2CPayout({
      phone,
      amount,
      currency: 'MZN',
      reference: reference || `PAYOUT-${Date.now()}`
    });

    console.log('[B2C PAYOUT VIA KIVORA RESPONSE]:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na rota API B2C (via Kivora):', error);
    return NextResponse.json(
      { error: 'Falha ao processar payout B2C' },
      { status: 500 }
    );
  }
}

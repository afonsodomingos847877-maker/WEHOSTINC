import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/serverAuth';
import Affiliate from '@/lib/models/Affiliate';
import UserModel from '@/lib/models/User';
import { getAffiliateSettings } from '@/lib/models/AffiliateSettings';
import { invalidateCacheOnChange } from '@/lib/affiliateCache';

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request).catch(() => null);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const amount = Number(body.amount);

    if (isNaN(amount) || amount < 50) {
      return NextResponse.json(
        { success: false, error: 'O valor mínimo para converter em crédito é de 50 MZN.' },
        { status: 400 }
      );
    }

    const settings = await getAffiliateSettings();
    if (!settings.allowBalanceCredit) {
      return NextResponse.json(
        { success: false, error: 'A conversão de saldo em crédito está temporariamente desativada.' },
        { status: 403 }
      );
    }

    // Débito atómico no saldo disponível do afiliado (evita corrida / saldo negativo)
    const updatedAffiliate = await Affiliate.findOneAndUpdate(
      {
        $or: [{ userId: sessionUser.id }, { userId: sessionUser.email.toLowerCase() }],
        status: 'active',
        availableBalance: { $gte: amount },
      },
      { $inc: { availableBalance: -amount } },
      { new: true }
    );

    if (!updatedAffiliate) {
      return NextResponse.json(
        { success: false, error: 'Saldo disponível insuficiente ou conta de afiliado inativa.' },
        { status: 400 }
      );
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { $or: [{ id: sessionUser.id }, { email: sessionUser.email.toLowerCase() }] },
      { $inc: { creditBalance: amount } },
      { new: true }
    ).select('creditBalance');

    invalidateCacheOnChange('affiliate', updatedAffiliate.userId);

    return NextResponse.json({
      success: true,
      availableBalance: updatedAffiliate.availableBalance,
      creditBalance: updatedUser?.creditBalance || amount,
      message: `${amount.toLocaleString('pt-MZ')} MZN convertidos em crédito WeHostHere com sucesso!`,
    });
  } catch (error) {
    console.error('[Affiliate Convert-Credit Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao converter saldo em crédito.' },
      { status: 500 }
    );
  }
}

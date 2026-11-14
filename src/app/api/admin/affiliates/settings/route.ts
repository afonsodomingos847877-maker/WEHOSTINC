import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import AffiliateSettings, { getAffiliateSettings } from '@/lib/models/AffiliateSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const settings = await getAffiliateSettings();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('[Affiliate Settings GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar configurações de afiliados.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const body = await request.json();

    const defaultCommissionRate = Number(body.defaultCommissionRate);
    const minPayoutAmount = Number(body.minPayoutAmount);
    const allowBalanceCredit = Boolean(body.allowBalanceCredit);
    const eligibleServices = Array.isArray(body.eligibleServices)
      ? body.eligibleServices.map((s: unknown) => String(s).trim()).filter(Boolean)
      : undefined;

    if (isNaN(defaultCommissionRate) || defaultCommissionRate < 1 || defaultCommissionRate > 90) {
      return NextResponse.json(
        { success: false, error: 'A percentagem de comissão deve estar entre 1% e 90%.' },
        { status: 400 }
      );
    }

    if (isNaN(minPayoutAmount) || minPayoutAmount < 50) {
      return NextResponse.json(
        { success: false, error: 'O valor mínimo de saque deve ser pelo menos 50 MZN.' },
        { status: 400 }
      );
    }

    const updateDoc: Record<string, any> = {
      defaultCommissionRate,
      minPayoutAmount,
      allowBalanceCredit,
      updatedBy: adminAuth.user?.email || 'admin',
      updatedAt: new Date().toISOString(),
    };

    if (eligibleServices) {
      updateDoc.eligibleServices = eligibleServices;
    }

    const settings = await AffiliateSettings.findOneAndUpdate(
      { key: 'global' },
      { $set: updateDoc },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      settings,
      message: 'Configurações de comissão atualizadas com sucesso!',
    });
  } catch (error) {
    console.error('[Affiliate Settings PUT Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar configurações.' },
      { status: 500 }
    );
  }
}

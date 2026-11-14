import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/serverAuth';
import Affiliate from '@/lib/models/Affiliate';
import Commission from '@/lib/models/Commission';
import User from '@/lib/models/User';
import { getAffiliateSettings } from '@/lib/models/AffiliateSettings';
import { dispatchMessage } from '@/lib/notifications';
import { invalidateCacheOnChange } from '@/lib/affiliateCache';

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request).catch(() => null);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { userId, payoutMethod, payoutDetails } = body;
    const typedPayoutMethod = payoutMethod as 'bank_transfer' | 'paypal' | 'mpesa';

    const isAdmin = sessionUser.role === 'admin' || sessionUser.role === 'super_admin';
    if (
      userId &&
      !isAdmin &&
      userId !== sessionUser.id &&
      String(userId).toLowerCase() !== sessionUser.email.toLowerCase()
    ) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const effectiveUserId = userId || sessionUser.id;

    if (!effectiveUserId || !payoutMethod || !payoutDetails) {
      return NextResponse.json(
        { success: false, error: 'User ID, método de pagamento e detalhes são obrigatórios' },
        { status: 400 }
      );
    }

    const affiliate = await Affiliate.findOne({
      $or: [{ userId: effectiveUserId }, { userId: String(effectiveUserId).toLowerCase() }],
    });

    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'Afiliado não encontrado' }, { status: 404 });
    }

    const settings = await getAffiliateSettings();
    const minPayout = settings.minPayoutAmount || 1000;

    if (affiliate.availableBalance < minPayout) {
      return NextResponse.json(
        {
          success: false,
          error: `Saldo mínimo para saque é de ${minPayout.toLocaleString('pt-MZ')} MZN`,
        },
        { status: 400 }
      );
    }

    if (typedPayoutMethod === 'bank_transfer') {
      if (!payoutDetails.bankName || !payoutDetails.accountNumber || !payoutDetails.accountHolder) {
        return NextResponse.json(
          {
            success: false,
            error: 'Para transferência bancária, informe: banco, número da conta e titular',
          },
          { status: 400 }
        );
      }
    } else if (typedPayoutMethod === 'paypal') {
      if (!payoutDetails.paypalEmail) {
        return NextResponse.json(
          { success: false, error: 'Para PayPal, informe o email PayPal' },
          { status: 400 }
        );
      }
    } else if (typedPayoutMethod === 'mpesa') {
      if (!payoutDetails.mpesaPhone) {
        return NextResponse.json(
          { success: false, error: 'Para M-Pesa, informe o número de telefone M-Pesa' },
          { status: 400 }
        );
      }
    }

    const payoutAmount = affiliate.availableBalance;

    affiliate.payoutMethod = typedPayoutMethod;
    affiliate.payoutDetails = payoutDetails;
    affiliate.payoutStatus = 'pending';
    affiliate.availableBalance = 0;
    affiliate.updatedAt = new Date().toISOString();
    await affiliate.save();

    invalidateCacheOnChange('affiliate', affiliate.userId);

    await Commission.updateMany(
      {
        affiliateId: affiliate.userId,
        status: 'approved',
      },
      {
        status: 'paid',
        paidAt: new Date().toISOString(),
        $push: {
          statusHistory: {
            status: 'paid',
            changedAt: new Date().toISOString(),
            changedBy: affiliate.userId,
            note: 'Saque solicitado pelo afiliado',
          },
        },
      }
    );

    const user = await User.findOne({ id: affiliate.userId });
    if (user) {
      const methodNames: Record<'bank_transfer' | 'paypal' | 'mpesa', string> = {
        bank_transfer: 'Transferência Bancária',
        paypal: 'PayPal',
        mpesa: 'M-Pesa',
      };

      await dispatchMessage({
        recipientEmail: user.email,
        recipientName: user.name,
        templateId: 'affiliate-payout-processed',
        variables: {
          nome_afiliado: user.name,
          valor_saque: payoutAmount.toFixed(2),
          metodo_pagamento: methodNames[typedPayoutMethod],
          data: new Date().toLocaleDateString('pt-MZ'),
        },
        isAutomatic: true,
        eventType: 'affiliate_payout_processed',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Saque solicitado com sucesso',
      affiliate,
    });
  } catch (error) {
    console.error('Erro ao solicitar saque:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao solicitar saque' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AffiliateClick from '@/lib/models/AffiliateClick';
import Affiliate from '@/lib/models/Affiliate';
import Commission from '@/lib/models/Commission';
import UserModel from '@/lib/models/User';
import { getAffiliateSettings } from '@/lib/models/AffiliateSettings';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { affiliateCode, orderId, amount, customerEmail, customerName, serviceType } = body;

    if (!affiliateCode || !orderId || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Código de afiliado, orderId e amount são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Evitar comissões duplicadas para o mesmo pedido
    const existingCommission = await Commission.findOne({ orderId });
    if (existingCommission) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: 'Comissão já registada anteriormente para este pedido.',
      });
    }

    // Ler regras comerciais configuradas no Admin
    const settings = await getAffiliateSettings();
    if (
      serviceType &&
      Array.isArray(settings.eligibleServices) &&
      settings.eligibleServices.length > 0 &&
      !settings.eligibleServices.includes(String(serviceType))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `O serviço "${serviceType}" não é elegível para comissão no momento.`,
        },
        { status: 200 }
      );
    }

    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // 1. Procurar clique recente pelo IP
    let recentClick = await AffiliateClick.findOne({
      affiliateCode,
      convertedToSale: false,
      ipAddress,
    }).sort({ clickedAt: -1 });

    // 2. Fallback caso o cliente tenha mudado de IP (ex: 4G -> Wi-Fi)
    let confirmedByReferral = false;
    if (!recentClick && customerEmail) {
      const referredUser = await UserModel.findOne({
        email: String(customerEmail).toLowerCase(),
        referredBy: affiliateCode,
      }).select('id');
      if (referredUser) {
        confirmedByReferral = true;
      }
    }

    if (!recentClick && !confirmedByReferral) {
      recentClick = await AffiliateClick.findOne({
        affiliateCode,
        convertedToSale: false,
      }).sort({ clickedAt: -1 });
    }

    if (!recentClick && !confirmedByReferral) {
      console.log(`[Affiliate] No recent click or referral found for affiliate ${affiliateCode}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhum clique recente encontrado para este afiliado',
        },
        { status: 404 }
      );
    }

    const affiliate = await Affiliate.findOne({ affiliateCode });
    if (!affiliate) {
      console.log(`[Affiliate] Affiliate not found for code ${affiliateCode}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Afiliado não encontrado',
        },
        { status: 404 }
      );
    }

    if (recentClick) {
      await AffiliateClick.findByIdAndUpdate(recentClick._id, {
        convertedToSale: true,
        conversionOrderId: orderId,
        conversionDate: new Date().toISOString(),
        abandonedCheckout: false,
      });
    }

    const ratePercent = settings.defaultCommissionRate || 30;
    const commissionAmount = Number(amount) * (ratePercent / 100);

    await Commission.create({
      affiliateId: affiliate.userId,
      orderId,
      orderAmount: amount,
      commissionRate: ratePercent,
      commissionAmount,
      status: 'pending',
      referredCustomerEmail: customerEmail || '',
      referredCustomerName: customerName || '',
      referredCustomerId: customerEmail || '',
      createdAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'pending',
          changedAt: new Date().toISOString(),
          changedBy: 'system',
          note: `Comissão criada automaticamente após conversão (${ratePercent}%)`,
        },
      ],
      validatedAt: new Date().toISOString(),
      isConsistent: true,
    });

    await Affiliate.findByIdAndUpdate(affiliate._id, {
      $inc: {
        totalEarnings: commissionAmount,
        availableBalance: commissionAmount,
        totalConversions: 1,
      },
    });

    console.log(
      `[Affiliate] Conversion tracked for affiliate ${affiliateCode}, order: ${orderId}, commission: ${commissionAmount} (${ratePercent}%)`
    );

    try {
      const affiliateUser = await UserModel.findOne({
        $or: [{ id: affiliate.userId }, { email: affiliate.userId }],
      });

      if (affiliateUser && affiliateUser.email) {
        const { sendAffiliateCommissionEmail } = await import('@/lib/affiliateEmails');
        sendAffiliateCommissionEmail(
          affiliateUser.email,
          affiliateUser.name || 'Parceiro Afiliado',
          amount,
          commissionAmount,
          customerName || customerEmail,
          orderId
        ).catch((err: any) => console.error('[Affiliate Commission Email] Erro:', err));
      }

      const targetIdentifier = affiliateUser?.email || affiliate.userId;
      if (targetIdentifier) {
        const { sendPushToUser } = await import('@/lib/pushService');
        await sendPushToUser(targetIdentifier, {
          title: '💸 Nova Comissão Recebida!',
          message: `Parabéns! Acabou de ganhar ${commissionAmount.toLocaleString('pt-MZ')} MZN de comissão por uma venda de ${amount.toLocaleString('pt-MZ')} MZN!`,
          url: '/dashboard/affiliates',
          tag: `affiliate-sale-${orderId}`,
        });
      }
    } catch (notifErr) {
      console.error('[Affiliate Conversion] Erro ao notificar afiliado da comissão:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Conversão rastreada com sucesso',
      commissionAmount,
      commissionRate: ratePercent,
    });
  } catch (error) {
    console.error('Erro ao rastrear conversão:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao rastrear conversão',
      },
      { status: 500 }
    );
  }
}

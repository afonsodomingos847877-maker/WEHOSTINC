import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/serverAuth';
import Affiliate from '@/lib/models/Affiliate';
import AffiliateClick from '@/lib/models/AffiliateClick';
import Commission from '@/lib/models/Commission';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    const period = searchParams.get('period') || '30';

    const internalAuth = request.headers.get('x-internal-auth');
    const sessionUser = await getSessionUser(request).catch(() => null);

    if (!internalAuth) {
      if (!sessionUser) {
        return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
      }
      const isAdmin = sessionUser.role === 'admin' || sessionUser.role === 'super_admin';
      if (!userId) {
        userId = sessionUser.id;
      } else if (
        !isAdmin &&
        userId !== sessionUser.id &&
        userId.toLowerCase() !== sessionUser.email.toLowerCase()
      ) {
        return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    const affiliate = await Affiliate.findOne({
      $or: [{ userId }, { userId: userId.toLowerCase() }],
    });

    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'Afiliado não encontrado' },
        { status: 404 }
      );
    }

    const days = parseInt(period, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const clicks = await AffiliateClick.find({
      affiliateId: affiliate.userId,
      clickedAt: { $gte: startDate.toISOString() },
    }).sort({ clickedAt: 1 });

    const clicksByDay: Record<string, number> = {};
    clicks.forEach((click) => {
      const date = new Date(click.clickedAt).toLocaleDateString('pt-MZ');
      clicksByDay[date] = (clicksByDay[date] || 0) + 1;
    });

    const commissions = await Commission.find({
      affiliateId: affiliate.userId,
      createdAt: { $gte: startDate.toISOString() },
    }).sort({ createdAt: 1 });

    const commissionsByMonth: Record<string, number> = {};
    commissions.forEach((commission) => {
      const date = new Date(commission.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      commissionsByMonth[monthKey] =
        (commissionsByMonth[monthKey] || 0) + commission.commissionAmount;
    });

    const totalClicks = clicks.length;
    const totalConversions = commissions.length;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        clicksByDay,
        commissionsByMonth,
        totalClicks,
        totalConversions,
        conversionRate,
        period: days,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dados de performance:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados de performance' },
      { status: 500 }
    );
  }
}

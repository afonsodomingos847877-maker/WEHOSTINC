import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import AffiliateClick from '@/lib/models/AffiliateClick';
import Commission from '@/lib/models/Commission';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('affiliateId');
    const period = searchParams.get('period') || 'all';

    const isAllTime = period === 'all' || period === '0';
    const days = isAllTime ? 0 : parseInt(period, 10) || 30;
    const startDate = new Date();
    if (!isAllTime) {
      startDate.setDate(startDate.getDate() - days);
    }
    const startDateIso = startDate.toISOString();

    if (affiliateId) {
      const affiliate = await Affiliate.findOne({ _id: affiliateId });
      if (!affiliate) {
        return NextResponse.json(
          { success: false, error: 'Afiliado não encontrado' },
          { status: 404 }
        );
      }

      const userDoc = await User.findOne({
        $or: [{ id: affiliate.userId }, { email: affiliate.userId }],
      }).lean();

      const clickQuery: any = {
        $or: [
          { affiliateId: affiliate.userId },
          { affiliateCode: affiliate.affiliateCode },
        ],
      };
      const commissionQuery: any = {
        $or: [
          { affiliateId: affiliate.userId },
          { affiliateCode: affiliate.affiliateCode },
        ],
      };
      const signupQuery: any = { referredBy: affiliate.affiliateCode };

      if (!isAllTime) {
        clickQuery.clickedAt = { $gte: startDateIso };
        commissionQuery.createdAt = { $gte: startDateIso };
        signupQuery.createdAt = { $gte: startDateIso };
      }

      const [clicks, commissions, signups] = await Promise.all([
        AffiliateClick.find(clickQuery).sort({ clickedAt: -1 }).lean(),
        Commission.find(commissionQuery).sort({ createdAt: -1 }).lean(),
        User.countDocuments(signupQuery),
      ]);

      const totalClicks = isAllTime
        ? Math.max(clicks.length, affiliate.totalClicks || 0)
        : clicks.length;
      const totalConversions = isAllTime
        ? Math.max(commissions.length, affiliate.totalConversions || 0)
        : commissions.length;
      const calcEarnings = commissions.reduce((sum, c: any) => sum + (c.commissionAmount || 0), 0);
      const totalEarnings = isAllTime
        ? Math.max(calcEarnings, affiliate.totalEarnings || 0)
        : calcEarnings;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      return NextResponse.json({
        success: true,
        data: {
          affiliate: {
            id: affiliate._id,
            userId: affiliate.userId,
            userName: (userDoc as any)?.name || affiliate.userId,
            userEmail: (userDoc as any)?.email || '',
            affiliateCode: affiliate.affiliateCode,
            status: affiliate.status,
            totalEarnings: affiliate.totalEarnings,
            availableBalance: affiliate.availableBalance,
          },
          metrics: {
            totalClicks,
            totalSignups: signups,
            totalConversions,
            totalEarnings,
            conversionRate,
            period: isAllTime ? 'all' : days,
          },
        },
      });
    }

    // Relatório agregado em tempo real de TODOS os afiliados
    const affiliates = await Affiliate.find({}).sort({ createdAt: -1 }).lean();

    const userIds = affiliates.map((a: any) => a.userId).filter(Boolean);
    const affiliateCodes = affiliates.map((a: any) => a.affiliateCode).filter(Boolean);

    const [usersDocs, allClicks, allCommissions, referredUsersDocs] = await Promise.all([
      User.find({
        $or: [{ id: { $in: userIds } }, { email: { $in: userIds } }],
      })
        .select('id name email phone')
        .lean(),
      AffiliateClick.find(
        isAllTime ? {} : { clickedAt: { $gte: startDateIso } }
      )
        .sort({ clickedAt: -1 })
        .lean(),
      Commission.find(
        isAllTime ? {} : { createdAt: { $gte: startDateIso } }
      )
        .sort({ createdAt: -1 })
        .lean(),
      User.find(
        isAllTime
          ? { referredBy: { $in: affiliateCodes } }
          : { referredBy: { $in: affiliateCodes }, createdAt: { $gte: startDateIso } }
      )
        .select('id name email referredBy createdAt status plan')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const userMap = new Map<string, any>();
    for (const u of usersDocs as any[]) {
      if (u.id) userMap.set(String(u.id), u);
      if (u.email) userMap.set(String(u.email).toLowerCase(), u);
    }

    const totalAffiliates = affiliates.length;
    const activeAffiliatesCount = affiliates.filter((a: any) => a.status === 'active').length;
    const pendingAffiliatesCount = affiliates.filter((a: any) => a.status !== 'active').length;

    let totalClicks = 0;
    let totalSignups = 0;
    let totalConversions = 0;
    let totalEarnings = 0;
    let totalAvailableBalance = 0;

    const affiliateReports = affiliates.map((affiliate: any) => {
      const userDoc =
        userMap.get(String(affiliate.userId)) ||
        userMap.get(String(affiliate.userId || '').toLowerCase());

      const affClicks = (allClicks as any[]).filter(
        (c) =>
          c.affiliateId === affiliate.userId ||
          c.affiliateCode === affiliate.affiliateCode
      );
      const affCommissions = (allCommissions as any[]).filter(
        (c) =>
          c.affiliateId === affiliate.userId ||
          c.affiliateCode === affiliate.affiliateCode
      );
      const affSignups = (referredUsersDocs as any[]).filter(
        (u) => u.referredBy === affiliate.affiliateCode
      );

      const affiliateClicks = isAllTime
        ? Math.max(affClicks.length, affiliate.totalClicks || 0)
        : affClicks.length;
      const affiliateSignups = affSignups.length;
      const affiliateConversions = isAllTime
        ? Math.max(affCommissions.length, affiliate.totalConversions || 0)
        : affCommissions.length;
      const calcEarnings = affCommissions.reduce(
        (sum, c) => sum + (Number(c.commissionAmount) || 0),
        0
      );
      const affiliateEarnings = isAllTime
        ? Math.max(calcEarnings, affiliate.totalEarnings || 0)
        : calcEarnings;
      const conversionRate =
        affiliateClicks > 0 ? (affiliateConversions / affiliateClicks) * 100 : 0;

      totalClicks += affiliateClicks;
      totalSignups += affiliateSignups;
      totalConversions += affiliateConversions;
      totalEarnings += affiliateEarnings;
      totalAvailableBalance += Number(affiliate.availableBalance) || 0;

      const lastClickAt = affClicks[0]?.clickedAt || null;

      return {
        affiliateId: affiliate._id,
        userId: affiliate.userId,
        userName: userDoc?.name || affiliate.payoutDetails?.accountName || affiliate.userId,
        userEmail: userDoc?.email || '',
        phone: affiliate.payoutDetails?.mpesaPhone || userDoc?.phone || '',
        affiliateCode: affiliate.affiliateCode,
        status: affiliate.status || 'pending',
        clicks: affiliateClicks,
        signups: affiliateSignups,
        conversions: affiliateConversions,
        earnings: affiliateEarnings,
        availableBalance: Number(affiliate.availableBalance) || 0,
        conversionRate,
        lastClickAt,
        createdAt: affiliate.createdAt,
      };
    });

    // Sort by clicks + conversions + signups desc so active performers appear at top
    affiliateReports.sort(
      (a, b) =>
        b.earnings - a.earnings ||
        b.conversions - a.conversions ||
        b.signups - a.signups ||
        b.clicks - a.clicks
    );

    const overallConversionRate =
      totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      data: {
        summary: {
          totalAffiliates,
          activeAffiliatesCount,
          pendingAffiliatesCount,
          totalClicks,
          totalSignups,
          totalConversions,
          totalEarnings,
          totalAvailableBalance,
          conversionRate: overallConversionRate,
          period: isAllTime ? 'all' : days,
        },
        affiliates: affiliateReports,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar relatórios de afiliados:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar relatórios de afiliados',
      },
      { status: 500 }
    );
  }
}

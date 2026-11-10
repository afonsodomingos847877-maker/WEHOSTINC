import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import AffiliateClick from '@/lib/models/AffiliateClick';
import Commission from '@/lib/models/Commission';

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('affiliateId');
    const period = searchParams.get('period') || '30'; // days

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    if (affiliateId) {
      // Relatório de um afiliado específico
      const affiliate = await Affiliate.findOne({ _id: affiliateId });
      if (!affiliate) {
        return NextResponse.json({ 
          success: false, 
          error: 'Afiliado não encontrado' 
        }, { status: 404 });
      }

      const clicks = await AffiliateClick.find({
        affiliateId: affiliate.userId,
        clickedAt: { $gte: startDate.toISOString() }
      });

      const commissions = await Commission.find({
        affiliateId: affiliate.userId,
        createdAt: { $gte: startDate.toISOString() }
      });

      const totalClicks = clicks.length;
      const totalConversions = commissions.length;
      const totalEarnings = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      return NextResponse.json({ 
        success: true, 
        data: {
          affiliate: {
            id: affiliate._id,
            userId: affiliate.userId,
            affiliateCode: affiliate.affiliateCode,
            status: affiliate.status,
            totalEarnings: affiliate.totalEarnings,
            availableBalance: affiliate.availableBalance,
          },
          metrics: {
            totalClicks,
            totalConversions,
            totalEarnings,
            conversionRate,
            period: days
          }
        }
      });
    } else {
      // Relatório agregado de todos os afiliados
      const affiliates = await Affiliate.find({ status: 'active' });
      
      const totalAffiliates = affiliates.length;
      let totalClicks = 0;
      let totalConversions = 0;
      let totalEarnings = 0;
      let totalAvailableBalance = 0;

      const affiliateReports = [];

      for (const affiliate of affiliates) {
        const clicks = await AffiliateClick.find({
          affiliateId: affiliate.userId,
          clickedAt: { $gte: startDate.toISOString() }
        });

        const commissions = await Commission.find({
          affiliateId: affiliate.userId,
          createdAt: { $gte: startDate.toISOString() }
        });

        const affiliateClicks = clicks.length;
        const affiliateConversions = commissions.length;
        const affiliateEarnings = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
        const conversionRate = affiliateClicks > 0 ? (affiliateConversions / affiliateClicks) * 100 : 0;

        totalClicks += affiliateClicks;
        totalConversions += affiliateConversions;
        totalEarnings += affiliateEarnings;
        totalAvailableBalance += affiliate.availableBalance;

        affiliateReports.push({
          affiliateId: affiliate._id,
          userId: affiliate.userId,
          affiliateCode: affiliate.affiliateCode,
          status: affiliate.status,
          clicks: affiliateClicks,
          conversions: affiliateConversions,
          earnings: affiliateEarnings,
          availableBalance: affiliate.availableBalance,
          conversionRate,
        });
      }

      const overallConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      return NextResponse.json({ 
        success: true, 
        data: {
          summary: {
            totalAffiliates,
            totalClicks,
            totalConversions,
            totalEarnings,
            totalAvailableBalance,
            conversionRate: overallConversionRate,
            period: days
          },
          affiliates: affiliateReports
        }
      });
    }

  } catch (error) {
    console.error('Erro ao buscar relatórios de afiliados:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar relatórios de afiliados' 
    }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import AnalyticsVisitModel from '@/lib/models/AnalyticsVisit';
import AnalyticsMilestoneModel from '@/lib/models/AnalyticsMilestone';
import { checkAndNotifyMilestones } from '@/lib/analyticsMilestones';
import { sendAnalyticsMilestoneEmail } from '@/lib/sendgrid';

export async function GET(req: Request) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();

    const [totalViews, distinctSessions, milestones] = await Promise.all([
      AnalyticsVisitModel.countDocuments(),
      AnalyticsVisitModel.distinct('sessionId'),
      AnalyticsMilestoneModel.find().lean()
    ]);

    const uniqueVisitors = Array.isArray(distinctSessions) ? distinctSessions.length : 0;
    const viewsRecord = milestones.find((m: any) => m.key === 'page_views');
    const uniqueRecord = milestones.find((m: any) => m.key === 'unique_visitors');

    const lastViewsMilestone = viewsRecord?.lastMilestone ?? Math.floor(totalViews / 100) * 100;
    const nextViewsMilestone = lastViewsMilestone + 100;
    const viewsProgress = Math.min(100, Math.max(0, Math.round(((totalViews - lastViewsMilestone) / 100) * 100)));

    const lastUniqueMilestone = uniqueRecord?.lastMilestone ?? Math.floor(uniqueVisitors / 10) * 10;
    const nextUniqueMilestone = lastUniqueMilestone + 10;
    const uniqueProgress = Math.min(100, Math.max(0, Math.round(((uniqueVisitors - lastUniqueMilestone) / 10) * 100)));

    return NextResponse.json({
      success: true,
      stats: {
        totalViews,
        uniqueVisitors,
      },
      pageViewsMilestone: {
        lastMilestone: lastViewsMilestone,
        nextMilestone: nextViewsMilestone,
        progressPercent: viewsProgress,
        viewsUntilNext: Math.max(0, nextViewsMilestone - totalViews),
        step: 100,
        lastNotifiedAt: viewsRecord?.lastNotifiedAt || null,
        history: viewsRecord?.history || []
      },
      uniqueVisitorsMilestone: {
        lastMilestone: lastUniqueMilestone,
        nextMilestone: nextUniqueMilestone,
        progressPercent: uniqueProgress,
        visitorsUntilNext: Math.max(0, nextUniqueMilestone - uniqueVisitors),
        step: 10,
        lastNotifiedAt: uniqueRecord?.lastNotifiedAt || null,
        history: uniqueRecord?.history || []
      }
    });
  } catch (error) {
    console.error('Erro ao buscar marcos de analytics:', error);
    return NextResponse.json({ error: 'Erro ao consultar marcos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'check'; // 'check' | 'test_email'

    await connectDB();

    if (action === 'test_email') {
      const type = body.type || 'page_views';
      const [totalViews, distinctSessions] = await Promise.all([
        AnalyticsVisitModel.countDocuments(),
        AnalyticsVisitModel.distinct('sessionId')
      ]);
      const uniqueVisitors = Array.isArray(distinctSessions) ? distinctSessions.length : 0;

      const recentVisits = await AnalyticsVisitModel.find().sort({ timestamp: -1 }).limit(500).lean();
      const counts = recentVisits.reduce((acc: Record<string, number>, v: any) => {
        if (v.page) acc[v.page] = (acc[v.page] || 0) + 1;
        return acc;
      }, {});
      const topPages = Object.entries(counts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 4)
        .map(([page, count]) => ({ page, count: count as number }));

      const res = await sendAnalyticsMilestoneEmail({
        type,
        milestone: type === 'page_views' ? (Math.floor(totalViews / 100) * 100 || 100) : (Math.floor(uniqueVisitors / 10) * 10 || 10),
        totalPageViews: totalViews,
        totalUniqueVisitors: uniqueVisitors,
        topPages
      });

      return NextResponse.json({ success: true, emailResult: res, message: 'E-mail de teste enviado com sucesso!' });
    }

    const result = await checkAndNotifyMilestones();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Erro ao executar acção de marcos:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

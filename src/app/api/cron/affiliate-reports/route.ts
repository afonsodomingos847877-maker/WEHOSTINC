import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireCronSecret } from '@/lib/serverAuth';
import { AffiliateReportPeriod, generateAndSendAffiliateReports } from '@/lib/affiliateReports';

export const dynamic = 'force-dynamic';

/**
 * Cron: Envio de relatórios automáticos (diário, semanal, mensal) aos afiliados ativos
 * - GET /api/cron/affiliate-reports?period=daily
 * - GET /api/cron/affiliate-reports?period=weekly
 * - GET /api/cron/affiliate-reports?period=monthly
 */
export async function GET(req: NextRequest) {
  const cronAuthError = requireCronSecret(req);
  if (cronAuthError) return cronAuthError;

  try {
    const rawPeriod = (req.nextUrl.searchParams.get('period') || 'daily').toLowerCase();
    if (!['daily', 'weekly', 'monthly'].includes(rawPeriod)) {
      return NextResponse.json(
        { success: false, error: 'Período inválido. Use daily, weekly ou monthly.' },
        { status: 400 }
      );
    }

    await connectDB();
    const result = await generateAndSendAffiliateReports(rawPeriod as AffiliateReportPeriod);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Cron Affiliate Reports] Erro:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao gerar relatórios de afiliados' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import { getSessionUser } from '@/lib/serverAuth';
import {
  AffiliateReportPeriod,
  computeAffiliatePeriodMetrics,
  generateAndSendAffiliateReports,
} from '@/lib/affiliateReports';

export const dynamic = 'force-dynamic';

async function getAuthenticatedAffiliate(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return null;
  const userIds = [sessionUser.id, (sessionUser as any)._id].filter(Boolean).map(String);
  const affiliate = await Affiliate.findOne({ userId: { $in: userIds } });
  return affiliate;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const affiliate = await getAuthenticatedAffiliate(req);
    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'Afiliado não autenticado ou não encontrado.' }, { status: 401 });
    }

    const [daily, weekly, monthly] = await Promise.all([
      computeAffiliatePeriodMetrics(affiliate, 'daily'),
      computeAffiliatePeriodMetrics(affiliate, 'weekly'),
      computeAffiliatePeriodMetrics(affiliate, 'monthly'),
    ]);

    const prefs = affiliate.reportPreferences || {};

    return NextResponse.json({
      success: true,
      reportPreferences: {
        daily: prefs.daily !== false,
        weekly: prefs.weekly !== false,
        monthly: prefs.monthly !== false,
      },
      summaries: { daily, weekly, monthly },
    });
  } catch (error: any) {
    console.error('[Affiliate Reports GET] Erro:', error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar relatórios.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const affiliate = await getAuthenticatedAffiliate(req);
    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'Afiliado não autenticado ou não encontrado.' }, { status: 401 });
    }

    const body = await req.json();
    const current = affiliate.reportPreferences || {};
    const updated = {
      daily: typeof body.daily === 'boolean' ? body.daily : current.daily !== false,
      weekly: typeof body.weekly === 'boolean' ? body.weekly : current.weekly !== false,
      monthly: typeof body.monthly === 'boolean' ? body.monthly : current.monthly !== false,
    };

    affiliate.reportPreferences = updated;
    affiliate.updatedAt = new Date().toISOString();
    await affiliate.save();

    return NextResponse.json({
      success: true,
      reportPreferences: updated,
    });
  } catch (error: any) {
    console.error('[Affiliate Reports PUT] Erro:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar preferências.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const affiliate = await getAuthenticatedAffiliate(req);
    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'Afiliado não autenticado ou não encontrado.' }, { status: 401 });
    }

    const body = await req.json();
    const period = String(body.period || 'daily').toLowerCase();
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json({ success: false, error: 'Período inválido.' }, { status: 400 });
    }

    const result = await generateAndSendAffiliateReports(period as AffiliateReportPeriod, {
      affiliateId: String(affiliate._id),
      forceSend: true,
    });

    if (result.sent === 0) {
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0] || 'Não foi possível enviar o relatório para o seu e-mail.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Relatório enviado para o seu e-mail com sucesso!',
      result,
    });
  } catch (error: any) {
    console.error('[Affiliate Reports POST] Erro:', error);
    return NextResponse.json({ success: false, error: 'Erro ao enviar relatório.' }, { status: 500 });
  }
}

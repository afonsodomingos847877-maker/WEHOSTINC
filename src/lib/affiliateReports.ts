import mongoose from 'mongoose';
import Affiliate, { IAffiliate } from '@/lib/models/Affiliate';
import AffiliateClick from '@/lib/models/AffiliateClick';
import AffiliateEvent from '@/lib/models/AffiliateEvent';
import Commission from '@/lib/models/Commission';
import UserModel from '@/lib/models/User';
import { sendEmail } from '@/lib/sendgrid';
import { SITE_URL } from '@/lib/siteConfig';

export type AffiliateReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface AffiliatePeriodMetrics {
  period: AffiliateReportPeriod;
  periodLabel: string;
  rangeLabel: string;
  clicks: number;
  prevClicks: number;
  uniqueSessions: number;
  productViews: number;
  signups: number;
  addToCarts: number;
  checkoutStarts: number;
  conversions: number;
  prevConversions: number;
  earnings: number;
  prevEarnings: number;
  availableBalance: number;
  totalEarnings: number;
}

const PERIOD_META: Record<AffiliateReportPeriod, { title: string; days: number; adjective: string }> = {
  daily: { title: 'Relatório Diário', days: 1, adjective: 'das últimas 24 horas' },
  weekly: { title: 'Relatório Semanal', days: 7, adjective: 'dos últimos 7 dias' },
  monthly: { title: 'Relatório Mensal', days: 30, adjective: 'dos últimos 30 dias' },
};

function calcGrowth(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function growthBadge(value: number): string {
  if (value > 0) {
    return `<span style="background:#dcfce7;color:#15803d;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;">+${value}%</span>`;
  }
  if (value < 0) {
    return `<span style="background:#fef2f2;color:#dc2626;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;">${value}%</span>`;
  }
  return `<span style="background:#f1f5f9;color:#64748b;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;">0%</span>`;
}

function toTimestamp(val: any): number {
  if (!val) return 0;
  const t = new Date(val).getTime();
  return Number.isFinite(t) ? t : 0;
}

export async function computeAffiliatePeriodMetrics(
  affiliate: IAffiliate,
  period: AffiliateReportPeriod
): Promise<AffiliatePeriodMetrics> {
  const meta = PERIOD_META[period];
  const now = new Date();
  const ms = meta.days * 24 * 60 * 60 * 1000;
  const currentStart = new Date(now.getTime() - ms);
  const prevStart = new Date(now.getTime() - ms * 2);

  const curStartMs = currentStart.getTime();
  const prevStartMs = prevStart.getTime();

  const [clicksDocs, commissionsDocs, eventsDocs] = await Promise.all([
    AffiliateClick.find({ affiliateId: affiliate._id }).select('timestamp createdAt').lean(),
    Commission.find({ affiliateId: affiliate._id }).select('amount status createdAt').lean(),
    AffiliateEvent.find({
      affiliateId: affiliate._id,
      createdAt: { $gte: currentStart },
    })
      .select('eventType sessionId')
      .lean(),
  ]);

  let clicks = 0;
  let prevClicks = 0;
  for (const c of clicksDocs as any[]) {
    const t = toTimestamp(c.timestamp || c.createdAt);
    if (t >= curStartMs) clicks++;
    else if (t >= prevStartMs) prevClicks++;
  }

  let conversions = 0;
  let prevConversions = 0;
  let earnings = 0;
  let prevEarnings = 0;
  for (const cm of commissionsDocs as any[]) {
    if (cm.status === 'cancelled') continue;
    const t = toTimestamp(cm.createdAt);
    const amt = Number(cm.amount || 0);
    if (t >= curStartMs) {
      conversions++;
      earnings += amt;
    } else if (t >= prevStartMs) {
      prevConversions++;
      prevEarnings += amt;
    }
  }

  const sessions = new Set<string>();
  let productViews = 0;
  let signups = 0;
  let addToCarts = 0;
  let checkoutStarts = 0;

  for (const ev of eventsDocs as any[]) {
    if (ev.sessionId) sessions.add(String(ev.sessionId));
    if (ev.eventType === 'product_view') productViews++;
    else if (ev.eventType === 'signup') signups++;
    else if (ev.eventType === 'add_to_cart') addToCarts++;
    else if (ev.eventType === 'checkout_start') checkoutStarts++;
  }

  const rangeLabel = `${currentStart.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' })} – ${now.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  return {
    period,
    periodLabel: meta.title,
    rangeLabel,
    clicks,
    prevClicks,
    uniqueSessions: sessions.size,
    productViews,
    signups,
    addToCarts,
    checkoutStarts,
    conversions,
    prevConversions,
    earnings,
    prevEarnings,
    availableBalance: Number(affiliate.availableBalance || 0),
    totalEarnings: Number(affiliate.totalEarnings || 0),
  };
}

export function buildAffiliateReportHtml(params: {
  affiliateName: string;
  affiliateCode: string;
  affiliateLink: string;
  metrics: AffiliatePeriodMetrics;
}): string {
  const { affiliateName, affiliateCode, affiliateLink, metrics } = params;
  const meta = PERIOD_META[metrics.period];

  const clicksGrowth = calcGrowth(metrics.clicks, metrics.prevClicks);
  const convGrowth = calcGrowth(metrics.conversions, metrics.prevConversions);
  const earnGrowth = calcGrowth(metrics.earnings, metrics.prevEarnings);

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:28px 24px;text-align:center;">
        <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE" style="width:140px;height:auto;display:block;margin:0 auto 12px;" />
        <h1 style="color:#ffffff;font-size:20px;font-weight:800;margin:0 0 4px;">${metrics.periodLabel} de Afiliado</h1>
        <p style="color:#93c5fd;font-size:13px;margin:0;">${metrics.rangeLabel}</p>
      </div>

      <div style="padding:24px;">
        <p style="margin:0 0 16px;font-size:14px;color:#334155;">
          Olá <strong>${affiliateName || 'Parceiro(a)'}</strong>, aqui está o resumo do desempenho do seu link de afiliado (<strong>${affiliateCode}</strong>) ${meta.adjective}.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:10px;margin:0 -10px 18px;">
          <tr>
            <td style="width:33%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Cliques</p>
              <p style="margin:0 0 6px;font-size:24px;font-weight:800;color:#0f172a;">${metrics.clicks}</p>
              ${growthBadge(clicksGrowth)}
            </td>
            <td style="width:33%;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:11px;color:#15803d;font-weight:700;text-transform:uppercase;">Conversões</p>
              <p style="margin:0 0 6px;font-size:24px;font-weight:800;color:#14532d;">${metrics.conversions}</p>
              ${growthBadge(convGrowth)}
            </td>
            <td style="width:33%;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:11px;color:#1d4ed8;font-weight:700;text-transform:uppercase;">Ganhos no Período</p>
              <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#1e3a8a;">${metrics.earnings.toLocaleString('pt-MZ')} MT</p>
              ${growthBadge(earnGrowth)}
            </td>
          </tr>
        </table>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:18px;">
          <h3 style="margin:0 0 10px;font-size:13px;font-weight:800;color:#0f172a;text-transform:uppercase;">Funil de Jornada (Anonimizado)</h3>
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size:13px;color:#334155;">
            <tr><td>Sessões únicas rastreadas</td><td align="right"><strong>${metrics.uniqueSessions}</strong></td></tr>
            <tr><td>Visualizações de produtos/serviços</td><td align="right"><strong>${metrics.productViews}</strong></td></tr>
            <tr><td>Contas criadas pelo seu link</td><td align="right"><strong>${metrics.signups}</strong></td></tr>
            <tr><td>Adições ao carrinho</td><td align="right"><strong>${metrics.addToCarts}</strong></td></tr>
            <tr><td>Inícios de checkout</td><td align="right"><strong>${metrics.checkoutStarts}</strong></td></tr>
          </table>
        </div>

        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#065f46;">
            <tr>
              <td>Saldo disponível para saque/crédito:</td>
              <td align="right"><strong style="font-size:16px;">${metrics.availableBalance.toLocaleString('pt-MZ')} MZN</strong></td>
            </tr>
            <tr>
              <td style="padding-top:4px;">Ganhos acumulados totais:</td>
              <td align="right" style="padding-top:4px;"><strong>${metrics.totalEarnings.toLocaleString('pt-MZ')} MZN</strong></td>
            </tr>
          </table>
        </div>

        <div style="text-align:center;margin:24px 0 10px;">
          <a href="${SITE_URL}/dashboard/affiliates" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;">
            Abrir Painel de Afiliados
          </a>
        </div>

        <p style="margin:16px 0 0;font-size:11px;color:#64748b;text-align:center;">
          Seu link de divulgação: <a href="${affiliateLink}" style="color:#2563eb;">${affiliateLink}</a>
        </p>
      </div>
    </div>
  `;
}

async function resolveAffiliateRecipient(userId: string): Promise<{ email: string; name: string } | null> {
  const orConditions: any[] = [{ id: userId }];
  if (mongoose.Types.ObjectId.isValid(userId)) {
    orConditions.push({ _id: new mongoose.Types.ObjectId(userId) });
  }
  const user = await UserModel.findOne({ $or: orConditions }).select('email name').lean() as any;
  if (!user?.email) return null;
  return { email: String(user.email), name: String(user.name || '') };
}

export async function generateAndSendAffiliateReports(
  period: AffiliateReportPeriod,
  options?: { affiliateId?: string; forceSend?: boolean }
) {
  const filter: any = { status: 'active' };
  if (options?.affiliateId) {
    filter._id = options.affiliateId;
  }

  const affiliates = await Affiliate.find(filter);
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const aff of affiliates) {
    try {
      const prefs = (aff as any).reportPreferences || {};
      const isEnabled = prefs[period] !== false;
      if (!options?.forceSend && !isEnabled) {
        skipped++;
        continue;
      }

      const recipient = await resolveAffiliateRecipient(aff.userId);
      if (!recipient) {
        skipped++;
        continue;
      }

      const metrics = await computeAffiliatePeriodMetrics(aff, period);
      const html = buildAffiliateReportHtml({
        affiliateName: recipient.name,
        affiliateCode: aff.affiliateCode,
        affiliateLink: aff.affiliateLink,
        metrics,
      });

      await sendEmail({
        to: recipient.email,
        subject: `📊 ${metrics.periodLabel} de Afiliado WEHOSTHERE — ${metrics.rangeLabel}`,
        html,
      });
      sent++;
    } catch (err: any) {
      errors.push(`${aff.affiliateCode}: ${err?.message || 'Erro desconhecido'}`);
    }
  }

  return { period, totalAffiliates: affiliates.length, sent, skipped, errors };
}

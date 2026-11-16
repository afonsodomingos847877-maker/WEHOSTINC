import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { sendEmail, WEHOSTHERE_EMAIL_BANNER } from '@/lib/sendgrid';
import { SITE_URL } from '@/lib/siteConfig';
import { requireCronSecret } from '@/lib/serverAuth';

/**
 * Cron: Relatório semanal de KPIs para o Administrador
 * Schedule: 0 8 * * 1 (toda segunda-feira às 8h)
 */
export async function GET(req: Request) {
  const cronAuthError = requireCronSecret(req);
  if (cronAuthError) return cronAuthError;

  try {

    await connectDB();

    const UserModel = (await import('@/lib/models/User')).default;
    const TicketModel = (await import('@/lib/models/Ticket')).default;
    const { SiteQuoteLead } = await import('@/models/SiteQuoteLead');
    const { DomainSearchLog } = await import('@/models/DomainSearchLog');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // ── Métricas da semana actual ──
    const [
      newUsersThisWeek,
      newUsersPrevWeek,
      newTicketsThisWeek,
      openTickets,
      newSiteLeadsThisWeek,
      newSiteLeadsPrevWeek,
      domainSearchesThisWeek,
      domainCheckoutsThisWeek,
      totalActiveUsers,
      totalSuspendedUsers
    ] = await Promise.all([
      UserModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      UserModel.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      TicketModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      TicketModel.countDocuments({ status: 'open' }),
      SiteQuoteLead.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      SiteQuoteLead.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      DomainSearchLog.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      DomainSearchLog.countDocuments({ checkoutStatus: { $in: ['pending', 'completed', 'bank_transfer_pending'] }, updatedAt: { $gte: sevenDaysAgo } }),
      UserModel.countDocuments({ status: 'active', role: { $ne: 'admin' } }),
      UserModel.countDocuments({ status: 'suspended' })
    ]);

    // Calcular variações percentuais
    const userGrowth = newUsersPrevWeek > 0 ? Math.round(((newUsersThisWeek - newUsersPrevWeek) / newUsersPrevWeek) * 100) : 0;
    const leadGrowth = newSiteLeadsPrevWeek > 0 ? Math.round(((newSiteLeadsThisWeek - newSiteLeadsPrevWeek) / newSiteLeadsPrevWeek) * 100) : 0;
    const domainConversionRate = domainSearchesThisWeek > 0 ? Math.round((domainCheckoutsThisWeek / domainSearchesThisWeek) * 100) : 0;

    const weekLabel = `${sevenDaysAgo.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' })} – ${now.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@wehosthere.com';

    const growthBadge = (value: number) => {
      if (value > 0) return `<span style="background:#f9fafb;color:#111827;font-size:11px;font-weight:700;padding:2px 7px;border-radius:8px;">↑ +${value}%</span>`;
      if (value < 0) return `<span style="background:#f9fafb;color:#111827;font-size:11px;font-weight:700;padding:2px 7px;border-radius:8px;">↓ ${value}%</span>`;
      return `<span style="background:#f9fafb;color:#6b7280;font-size:11px;font-weight:700;padding:2px 7px;border-radius:8px;">→ 0%</span>`;
    };

    await sendEmail({
      to: adminEmail,
      subject: `[WEHOSTHERE] Relatório Semanal - ${weekLabel}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:0 auto;color:#111;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          <!-- Header -->
          ${WEHOSTHERE_EMAIL_BANNER}
          <div style="background:#ffffff;border-bottom:1px solid #e5e7eb;padding:24px 28px;text-align:center;">

            <h1 style="color:#111827;font-size:20px;font-weight:800;margin:0 0 4px;">Relatório Semanal de Desempenho</h1>
            <p style="color:#4b5563;font-size:13px;margin:0;">${weekLabel}</p>
          </div>

          <div style="padding:28px;">
            <!-- KPI Grid -->
            <h3 style="color:#111827;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Destaques da Semana</h3>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
              <!-- Novos Utilizadores -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;">
                <p style="margin:0 0 4px;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;">Novos Utilizadores</p>
                <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
                  <span style="font-size:28px;font-weight:900;color:#111827;">${newUsersThisWeek}</span>
                  ${growthBadge(userGrowth)}
                </div>
                <p style="margin:0;font-size:11px;color:#6b7280;">${newUsersPrevWeek} na semana anterior</p>
              </div>

              <!-- Leads de Sites -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;">
                <p style="margin:0 0 4px;font-size:11px;color:#111827;font-weight:700;text-transform:uppercase;">Leads de Sites</p>
                <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
                  <span style="font-size:28px;font-weight:900;color:#111827;">${newSiteLeadsThisWeek}</span>
                  ${growthBadge(leadGrowth)}
                </div>
                <p style="margin:0;font-size:11px;color:#6b7280;">${newSiteLeadsPrevWeek} na semana anterior</p>
              </div>

              <!-- Pesquisas de Domínio -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;">
                <p style="margin:0 0 4px;font-size:11px;color:#6b21a8;font-weight:700;text-transform:uppercase;">Pesquisas de Domínio</p>
                <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
                  <span style="font-size:28px;font-weight:900;color:#111827;">${domainSearchesThisWeek}</span>
                </div>
                <p style="margin:0;font-size:11px;color:#6b7280;">${domainCheckoutsThisWeek} avançaram para checkout (${domainConversionRate}%)</p>
              </div>

              <!-- Tickets de Suporte -->
              <div style="background:${openTickets > 5 ? '#f9fafb' : '#f9fafb'};border:1px solid ${openTickets > 5 ? '#fecaca' : '#bbf7d0'};border-radius:12px;padding:16px;">
                <p style="margin:0 0 4px;font-size:11px;color:${openTickets > 5 ? '#dc2626' : '#15803d'};font-weight:700;text-transform:uppercase;">Tickets Abertos</p>
                <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
                  <span style="font-size:28px;font-weight:900;color:#111827;">${openTickets}</span>
                  ${openTickets > 5 ? '<span style="background:#f9fafb;color:#111827;font-size:11px;font-weight:700;padding:2px 7px;border-radius:8px;">⚠️ Atenção</span>' : '<span style="background:#f9fafb;color:#111827;font-size:11px;font-weight:700;padding:2px 7px;border-radius:8px;">✓ Normal</span>'}
                </div>
                <p style="margin:0;font-size:11px;color:#6b7280;">${newTicketsThisWeek} abertos esta semana</p>
              </div>
            </div>

            <!-- Saúde da Plataforma -->
            <h3 style="color:#111827;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">🏥 Saúde da Plataforma</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
              <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:10px 4px;color:#6b7280;">Utilizadores Activos</td>
                <td style="padding:10px 4px;font-weight:800;color:#111827;text-align:right;">${totalActiveUsers}</td>
              </tr>
              <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:10px 4px;color:#6b7280;">Contas Suspensas</td>
                <td style="padding:10px 4px;font-weight:700;color:${totalSuspendedUsers > 0 ? '#dc2626' : '#15803d'};text-align:right;">${totalSuspendedUsers}</td>
              </tr>
              <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:10px 4px;color:#6b7280;">Taxa de Conversão (Domínio)</td>
                <td style="padding:10px 4px;font-weight:700;color:#111827;text-align:right;">${domainConversionRate}%</td>
              </tr>
            </table>

            <!-- CTA -->
            <div style="text-align:center;margin:20px 0;">
              <a href="${SITE_URL}/admin" style="display:inline-block;min-width:240px;padding:13px 24px;background:#111827;color:#ffffff;border:1px solid #111827;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;text-align:center;box-sizing:border-box;">
                Abrir Painel Completo →
              </a>
            </div>
          </div>

          <div style="background:#f9fafb;padding:16px 28px;text-align:center;font-size:11px;color:#6b7280;border-top:1px solid #e5e7eb;">
            WEHOSTHERE - Relatório automático gerado toda segunda-feira às 8h
          </div>
        </div>
      `
    });

    console.log(`[Cron WeeklyKPI] Relatório semanal enviado para ${adminEmail}`);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      period: weekLabel,
      metrics: {
        newUsersThisWeek,
        newTicketsThisWeek,
        openTickets,
        newSiteLeadsThisWeek,
        domainSearchesThisWeek,
        domainCheckoutsThisWeek,
        domainConversionRate,
        totalActiveUsers,
        totalSuspendedUsers
      }
    });
  } catch (error: any) {
    console.error('[Cron WeeklyKPI] Erro:', error);
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
}

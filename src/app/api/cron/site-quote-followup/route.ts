import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SiteQuoteLead } from '@/models/SiteQuoteLead';
import { addAdminNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/sendgrid';
import { SITE_URL } from '@/lib/siteConfig';
import { requireCronSecret } from '@/lib/serverAuth';

/**
 * Cron: Follow-up automático de leads de sites sem resposta após 48h
 * Schedule: 0 10 * * * (diário às 10h)
 */
export async function GET(req: Request) {
  const cronAuthError = requireCronSecret(req);
  if (cronAuthError) return cronAuthError;

  try {

    await connectDB();

    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Leads com status 'new' criados há mais de 48h e menos de 7 dias
    const staleLeads = await SiteQuoteLead.find({
      status: 'new',
      createdAt: { $lte: fortyEightHoursAgo, $gte: sevenDaysAgo },
      followUpSentAt: { $exists: false }
    }).lean();

    console.log(`[Cron SiteQuoteFollowup] ${staleLeads.length} leads sem resposta encontrados.`);

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@wehosthere.com';
    let notified = 0;

    for (const lead of staleLeads) {
      try {
        const hoursElapsed = Math.round((now.getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60));
        const whatsappMsg = lead.userPhone
          ? `https://wa.me/${lead.userPhone.replace(/\D/g, '').replace(/^(?!258)(\d{9})$/, '258$1')}?text=${encodeURIComponent(`Olá ${lead.userName || ''}! Estamos a finalizar a proposta para o seu site "${lead.projectName}". Em que momento podemos conversar?`)}`
          : '';

        // Alerta ao admin
        addAdminNotification({
          title: `⏰ Follow-up: Lead "${lead.projectName}" sem resposta há ${hoursElapsed}h`,
          message: `${lead.userName || 'Lead anónimo'} (${lead.userEmail || 'sem email'}) pediu orçamento para "${lead.projectName}" há ${hoursElapsed} horas e ainda não foi contactado.`,
          type: 'system',
          userEmail: lead.userEmail || '',
          userName: lead.userName || '',
          link: '/admin/site-quotes'
        });

        // Email ao admin com o lead em detalhe
        await sendEmail({
          to: adminEmail,
          subject: `⏰ Follow-up Necessário: Lead "${lead.projectName}" há ${hoursElapsed}h sem contacto`,
          html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px 28px;text-align:center;">
                <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE" style="width:150px;height:auto;display:block;margin:0 auto 10px;" />
                <span style="background:rgba(255,255,255,0.2);color:#fff;font-size:11px;font-weight:800;letter-spacing:1px;padding:4px 12px;border-radius:20px;text-transform:uppercase;">⏰ Follow-up Automático</span>
              </div>
              <div style="padding:28px;">
                <h2 style="color:#92400e;margin:0 0 8px;">Lead sem resposta há ${hoursElapsed} horas!</h2>
                <p style="color:#64748b;font-size:14px;margin:0 0 20px;">Este lead ainda não foi contactado. Recomendamos entrar em contacto <strong>hoje</strong>.</p>
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px;margin-bottom:20px;">
                  <table style="width:100%;font-size:14px;border-collapse:collapse;">
                    <tr><td style="padding:6px 0;color:#92400e;font-weight:700;">Projeto:</td><td style="padding:6px 0;font-weight:800;color:#0f172a;">${lead.projectName}</td></tr>
                    <tr><td style="padding:6px 0;color:#92400e;font-weight:700;">Tipo:</td><td style="padding:6px 0;color:#475569;">${lead.projectType}</td></tr>
                    <tr><td style="padding:6px 0;color:#92400e;font-weight:700;">Orçamento:</td><td style="padding:6px 0;font-weight:700;color:#059669;">${lead.basePrice.toLocaleString('pt-MZ')} MT</td></tr>
                    <tr><td style="padding:6px 0;color:#92400e;font-weight:700;">Cliente:</td><td style="padding:6px 0;color:#0f172a;">${lead.userName || 'Não informado'}</td></tr>
                    <tr><td style="padding:6px 0;color:#92400e;font-weight:700;">E-mail:</td><td style="padding:6px 0;color:#2563eb;">${lead.userEmail || 'Não informado'}</td></tr>
                    <tr><td style="padding:6px 0;color:#92400e;font-weight:700;">Telefone:</td><td style="padding:6px 0;color:#059669;">${lead.userPhone || 'Não informado'}</td></tr>
                    <tr><td style="padding:6px 0;color:#92400e;font-weight:700;">Criado em:</td><td style="padding:6px 0;color:#64748b;font-size:12px;">${new Date(lead.createdAt).toLocaleString('pt-MZ')}</td></tr>
                  </table>
                </div>
                <div style="text-align:center;margin-top:20px;">
                  ${whatsappMsg ? `<a href="${whatsappMsg}" style="background:#22c55e;color:#fff;font-weight:800;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;display:inline-block;margin:4px;">💬 Contactar via WhatsApp →</a>` : ''}
                  <a href="${SITE_URL}/admin/site-quotes" style="background:#0f172a;color:#fff;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;display:inline-block;margin:4px;">Ver Todos os Leads →</a>
                </div>
              </div>
              <div style="background:#f8fafc;padding:16px 28px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;">
                WEHOSTHERE — Follow-up automático de leads de criação de sites
              </div>
            </div>
          `
        });

        // Marcar o lead como follow-up enviado
        await SiteQuoteLead.findByIdAndUpdate(lead._id, {
          $set: { followUpSentAt: now, status: 'contacted' }
        });

        notified++;
      } catch (err) {
        console.error(`[Cron SiteQuoteFollowup] Erro ao processar lead ${lead._id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      leadsChecked: staleLeads.length,
      followUpsSent: notified
    });
  } catch (error: any) {
    console.error('[Cron SiteQuoteFollowup] Erro:', error);
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { addAdminNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/sendgrid';
import { SITE_URL } from '@/lib/siteConfig';
import { requireCronSecret } from '@/lib/serverAuth';

/**
 * Cron: Alerta de tickets abertos há mais de 24h sem resposta
 * Schedule: 0 14 * * * (diário às 14h)
 */
export async function GET(req: Request) {
  const cronAuthError = requireCronSecret(req);
  if (cronAuthError) return cronAuthError;

  try {

    await connectDB();

    const TicketModel = (await import('@/lib/models/Ticket')).default;
    const CommunicationLog = (await import('@/lib/models/CommunicationLog')).default;

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Tickets com status 'open' actualizados há mais de 24h
    const stalledTickets = await TicketModel.find({
      status: 'open',
      updatedAt: { $lte: twentyFourHoursAgo }
    }).lean();

    console.log(`[Cron TicketAlert] ${stalledTickets.length} tickets sem resposta encontrados.`);

    if (stalledTickets.length === 0) {
      return NextResponse.json({ success: true, stalledTickets: 0, message: 'Sem tickets pendentes.' });
    }

    // Anti-duplicata: verificar se alerta já foi enviado hoje
    const alertAlreadySentToday = await CommunicationLog.exists({
      recipientEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'info@wehosthere.com',
      eventType: 'stalled_tickets_alert',
      sentAt: { $gte: startOfToday }
    });

    if (alertAlreadySentToday) {
      return NextResponse.json({ success: true, message: 'Alerta já enviado hoje.', stalledTickets: stalledTickets.length });
    }

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@wehosthere.com';

    // Notificação no painel
    addAdminNotification({
      title: `🎫 ${stalledTickets.length} Ticket(s) sem resposta há +24h`,
      message: `Há ${stalledTickets.length} ticket(s) de suporte abertos sem resposta há mais de 24 horas. Acção necessária.`,
      type: 'support_ticket',
      link: '/admin?tab=tickets'
    });

    // Construir tabela de tickets para o email
    const ticketRows = stalledTickets.slice(0, 15).map(ticket => {
      const hoursOpen = Math.round((now.getTime() - new Date(ticket.updatedAt || ticket.createdAt).getTime()) / (1000 * 60 * 60));
      const priorityColor = ticket.priority === 'high' ? '#dc2626' : ticket.priority === 'medium' ? '#f59e0b' : '#64748b';
      const priorityLabel = ticket.priority === 'high' ? '🔴 Alta' : ticket.priority === 'medium' ? '🟡 Média' : '🟢 Baixa';

      return `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 8px;font-family:monospace;font-size:12px;color:#4f46e5;font-weight:700;">${ticket.id || ticket._id?.toString().slice(-6)}</td>
          <td style="padding:10px 8px;color:#0f172a;font-size:13px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ticket.subject || 'Sem assunto'}</td>
          <td style="padding:10px 8px;color:#475569;font-size:12px;">${ticket.userName || ticket.userEmail || 'Desconhecido'}</td>
          <td style="padding:10px 8px;"><span style="color:${priorityColor};font-size:12px;font-weight:700;">${priorityLabel}</span></td>
          <td style="padding:10px 8px;"><span style="background:#fef2f2;color:#dc2626;font-size:11px;font-weight:700;padding:3px 8px;border-radius:10px;">${hoursOpen}h</span></td>
        </tr>
      `;
    }).join('');

    const hasMore = stalledTickets.length > 15;

    await sendEmail({
      to: adminEmail,
      subject: `⚠️ ${stalledTickets.length} Ticket(s) de Suporte sem resposta há +24h — WEHOSTHERE`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:0 auto;color:#111;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 28px;text-align:center;">
            <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE" style="width:150px;height:auto;display:block;margin:0 auto 10px;" />
            <span style="background:rgba(255,255,255,0.2);color:#fff;font-size:11px;font-weight:800;letter-spacing:1px;padding:4px 14px;border-radius:20px;text-transform:uppercase;">⚠️ Tickets Sem Resposta</span>
          </div>
          <div style="padding:28px;">
            <h2 style="color:#0f172a;margin:0 0 8px;">Atenção: ${stalledTickets.length} ticket(s) aguardam resposta</h2>
            <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Os seguintes tickets estão abertos há mais de 24 horas sem qualquer resposta. Por favor, reveja e responda com urgência.</p>
            
            <div style="overflow-x:auto;border-radius:10px;border:1px solid #e2e8f0;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:500px;">
                <thead>
                  <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                    <th style="padding:10px 8px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">ID</th>
                    <th style="padding:10px 8px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Assunto</th>
                    <th style="padding:10px 8px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Cliente</th>
                    <th style="padding:10px 8px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Prioridade</th>
                    <th style="padding:10px 8px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Espera</th>
                  </tr>
                </thead>
                <tbody>
                  ${ticketRows}
                </tbody>
              </table>
            </div>
            ${hasMore ? `<p style="color:#94a3b8;font-size:12px;margin:8px 0 0;text-align:center;">... e mais ${stalledTickets.length - 15} ticket(s). Ver painel para lista completa.</p>` : ''}
            
            <div style="text-align:center;margin:24px 0;">
              <a href="${SITE_URL}/admin?tab=tickets" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-weight:800;padding:14px 30px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 14px rgba(124,58,237,0.3);">
                Abrir Painel de Suporte →
              </a>
            </div>
          </div>
          <div style="background:#f8fafc;padding:16px 28px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;">
            WEHOSTHERE — Alerta automático de tickets de suporte pendentes
          </div>
        </div>
      `
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      stalledTickets: stalledTickets.length,
      alertSent: true
    });
  } catch (error: any) {
    console.error('[Cron TicketAlert] Erro:', error);
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
}

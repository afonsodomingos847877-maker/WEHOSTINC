import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { sendEmail } from '@/lib/sendgrid';
import { SITE_URL } from '@/lib/siteConfig';
import { requireCronSecret } from '@/lib/serverAuth';

/**
 * Cron: Upsell automático pós-compra de domínio — sugerir hospedagem 24h depois
 * Schedule: 0 11 * * * (diário às 11h)
 */
export async function GET(req: Request) {
  const cronAuthError = requireCronSecret(req);
  if (cronAuthError) return cronAuthError;

  try {

    await connectDB();

    const { DomainSearchLog } = await import('@/models/DomainSearchLog');
    const CommunicationLog = (await import('@/lib/models/CommunicationLog')).default;

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Domínios comprados (checkout completado) entre 24h e 48h atrás
    const recentDomainPurchases = await DomainSearchLog.find({
      checkoutStatus: 'completed',
      userEmail: { $exists: true, $ne: '' },
      updatedAt: { $gte: fortyEightHoursAgo, $lte: twentyFourHoursAgo }
    }).lean();

    console.log(`[Cron DomainUpsell] ${recentDomainPurchases.length} compras de domínio elegíveis para upsell.`);

    let upsellsSent = 0;

    for (const purchase of recentDomainPurchases) {
      if (!purchase.userEmail) continue;

      try {
        // Anti-duplicata por dia
        const alreadySent = await CommunicationLog.exists({
          recipientEmail: purchase.userEmail.toLowerCase().trim(),
          eventType: 'domain_upsell',
          sentAt: { $gte: startOfToday }
        });
        if (alreadySent) continue;

        const userName = purchase.userName || purchase.userEmail.split('@')[0];
        const domain = purchase.domain || 'o seu domínio';
        const siteQuoteUrl = `${SITE_URL}/site-quote?domain=${encodeURIComponent(domain)}`;
        const hostingUrl = `${SITE_URL}/#hospedagem`;

        await sendEmail({
          to: purchase.userEmail,
          subject: `🎉 O domínio ${domain} está registado! E o seu site?`,
          html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <div style="background:linear-gradient(135deg,#4f46e5,#2563eb);padding:32px 28px;text-align:center;">
                <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE" style="width:150px;height:auto;display:block;margin:0 auto 10px;" />
                <p style="color:#c7d2fe;font-size:13px;margin:6px 0 0;">Parabéns pelo seu domínio!</p>
              </div>
              <div style="padding:28px;">
                <h2 style="color:#0f172a;margin:0 0 12px;">Parabéns, ${userName}! 🎊</h2>
                <p style="color:#475569;font-size:15px;line-height:1.7;">
                  O domínio <strong style="color:#4f46e5;font-family:monospace;">${domain}</strong> está registado e pronto. 
                  O próximo passo natural é criar o seu site profissional!
                </p>
                
                <!-- Proposta de valor -->
                <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:20px;margin:20px 0;">
                  <p style="margin:0 0 12px;font-weight:800;color:#4f46e5;font-size:15px;">🚀 O que pode ter com a WEHOSTHERE:</p>
                  <div style="display:grid;gap:10px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <span style="background:#4f46e5;color:#fff;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">1</span>
                      <span style="color:#475569;font-size:14px;"><strong>Site Profissional</strong> desenvolvido à medida — Landing Page, E-commerce ou Portal</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                      <span style="background:#4f46e5;color:#fff;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">2</span>
                      <span style="color:#475569;font-size:14px;"><strong>Hospedagem Incluída</strong> — O seu site no ar com o domínio ${domain} já ligado</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                      <span style="background:#4f46e5;color:#fff;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">3</span>
                      <span style="color:#475569;font-size:14px;"><strong>Email Profissional</strong> — contacto@${domain} para a sua empresa</span>
                    </div>
                  </div>
                </div>

                <!-- Preços rápidos -->
                <div style="display:flex;gap:12px;margin:16px 0;flex-wrap:wrap;">
                  <div style="flex:1;min-width:150px;background:#fff;border:2px solid #4f46e5;border-radius:12px;padding:16px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Landing Page</p>
                    <p style="margin:0;font-size:22px;font-weight:900;color:#4f46e5;">2.500 MT</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Entrega em 5-7 dias</p>
                  </div>
                  <div style="flex:1;min-width:150px;background:#4f46e5;border-radius:12px;padding:16px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:11px;color:#c7d2fe;font-weight:700;text-transform:uppercase;">Site Completo</p>
                    <p style="margin:0;font-size:22px;font-weight:900;color:#fff;">7.500 MT</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#c7d2fe;">Com painel de gestão</p>
                  </div>
                </div>

                <div style="text-align:center;margin:24px 0;">
                  <a href="${siteQuoteUrl}" style="background:linear-gradient(135deg,#4f46e5,#2563eb);color:#fff;font-weight:800;padding:16px 32px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 14px rgba(79,70,229,0.35);margin-bottom:12px;">
                    Obter Orçamento Gratuito →
                  </a>
                  <br />
                  <a href="${hostingUrl}" style="color:#4f46e5;font-size:13px;text-decoration:underline;">Ver planos de hospedagem</a>
                </div>
                <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Fale connosco: info@wehosthere.com | +258 84 833 5618</p>
              </div>
              <div style="background:#f8fafc;padding:16px 28px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;">
                WEHOSTHERE — Email automático enviado 24h após registo de domínio
              </div>
            </div>
          `
        });

        upsellsSent++;
        console.log(`[Cron DomainUpsell] Email de upsell enviado para ${purchase.userEmail} (domínio: ${domain})`);

      } catch (err) {
        console.error(`[Cron DomainUpsell] Erro para ${purchase.userEmail}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      purchasesChecked: recentDomainPurchases.length,
      upsellEmailsSent: upsellsSent
    });
  } catch (error: any) {
    console.error('[Cron DomainUpsell] Erro:', error);
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
}

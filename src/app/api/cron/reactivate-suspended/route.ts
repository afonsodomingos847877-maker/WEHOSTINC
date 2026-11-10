import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { sendEmail } from '@/lib/sendgrid';
import { addAdminNotification } from '@/lib/notifications';
import { SITE_URL } from '@/lib/siteConfig';
import { requireCronSecret } from '@/lib/serverAuth';

/**
 * Cron: Reativação de clientes suspensos — sequência de 3 emails em 7 dias
 * Schedule: 0 9 * * * (diário às 9h)
 */
export async function GET(req: Request) {
  const cronAuthError = requireCronSecret(req);
  if (cronAuthError) return cronAuthError;

  try {

    await connectDB();

    // Import models dynamically to avoid issues
    const UserModel = (await import('@/lib/models/User')).default;
    const CommunicationLog = (await import('@/lib/models/CommunicationLog')).default;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Buscar utilizadores suspensos com plano pago
    const suspendedUsers = await UserModel.find({
      status: 'suspended',
      role: { $ne: 'admin' },
      plan: { $in: ['basic', 'pro', 'enterprise'] }
    }).lean();

    console.log(`[Cron Reactivate] ${suspendedUsers.length} utilizadores suspensos encontrados.`);

    const planPrices: Record<string, string> = {
      basic: '500 MT',
      pro: '1.500 MT',
      enterprise: '3.500 MT'
    };

    // Sequência: dia 1, dia 3, dia 7
    const followUpDays = [1, 3, 7];
    let emailsSent = 0;

    for (const user of suspendedUsers) {
      try {
        // Calcular dias desde suspensão (usar updatedAt como proxy)
        const u = user as any;
        const suspendedSince = u.updatedAt ? new Date(u.updatedAt) : u.createdAt ? new Date(u.createdAt) : new Date();
        const daysSuspended = Math.floor((now.getTime() - suspendedSince.getTime()) / (1000 * 60 * 60 * 24));

        // Verificar se hoje é dia 1, 3 ou 7 de suspensão
        if (!followUpDays.includes(daysSuspended)) continue;

        // Anti-duplicata: não enviar mais de 1 por dia ao mesmo utilizador
        const alreadySent = await CommunicationLog.exists({
          recipientEmail: user.email.toLowerCase().trim(),
          eventType: 'reactivation_reminder',
          sentAt: { $gte: startOfToday }
        });
        if (alreadySent) continue;

        const userName = user.name || user.email.split('@')[0];
        const valorPlano = planPrices[user.plan] || '500 MT';
        const paymentLink = `${SITE_URL}/dashboard/billing`;

        const sequenceLabel = daysSuspended === 1
          ? 'Primeiro Aviso'
          : daysSuspended === 3
            ? 'Segundo Aviso'
            : 'Aviso Final';

        const urgencyColor = daysSuspended === 1
          ? '#f59e0b'
          : daysSuspended === 3
            ? '#f97316'
            : '#dc2626';

        const urgencyGradient = daysSuspended === 1
          ? 'linear-gradient(135deg,#f59e0b,#d97706)'
          : daysSuspended === 3
            ? 'linear-gradient(135deg,#f97316,#ea580c)'
            : 'linear-gradient(135deg,#dc2626,#b91c1c)';

        const subject = daysSuspended === 7
          ? `🚨 ÚLTIMA OPORTUNIDADE: Reative a sua conta WEHOSTHERE`
          : `⚠️ ${sequenceLabel}: A sua conta WEHOSTHERE está suspensa`;

        await sendEmail({
          to: user.email,
          subject,
          html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <div style="background:${urgencyGradient};padding:32px 28px;text-align:center;">
                <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE" style="width:150px;height:auto;display:block;margin:0 auto 10px;" />
                <span style="background:rgba(255,255,255,0.2);color:#fff;font-size:11px;font-weight:800;letter-spacing:1px;padding:4px 12px;border-radius:20px;">${sequenceLabel} — Dia ${daysSuspended}</span>
              </div>
              <div style="padding:28px;">
                <h2 style="color:#0f172a;margin:0 0 12px;">Olá, ${userName}! A sua conta está suspensa.</h2>
                <p style="color:#64748b;font-size:15px;line-height:1.7;">
                  ${daysSuspended === 7
                    ? `Este é o nosso último aviso. A sua conta e todos os seus dados serão <strong style="color:#dc2626">permanentemente eliminados</strong> em breve caso o pagamento não seja regularizado.`
                    : `A sua conta foi suspensa por falta de pagamento da renovação do plano. Os seus serviços estão temporariamente indisponíveis.`
                  }
                </p>
                <div style="background:#fff7ed;border:2px solid ${urgencyColor};border-radius:12px;padding:18px;margin:20px 0;text-align:center;">
                  <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${urgencyColor};text-transform:uppercase;letter-spacing:1px;">Valor em Falta</p>
                  <p style="margin:0;font-size:28px;font-weight:900;color:#0f172a;">${valorPlano}</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Plano ${user.plan?.charAt(0).toUpperCase()}${user.plan?.slice(1)} — Renovação Mensal</p>
                </div>
                <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px;margin:16px 0;">
                  <p style="margin:0 0 8px;font-weight:700;color:#0369a1;font-size:13px;">✅ Ao regularizar o pagamento:</p>
                  <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
                    <li>A sua conta será reativada imediatamente</li>
                    <li>Todos os seus serviços voltam ao normal</li>
                    <li>Nenhum dado será perdido</li>
                  </ul>
                </div>
                <div style="text-align:center;margin:24px 0;">
                  <a href="${paymentLink}" style="background:${urgencyGradient};color:#fff;font-weight:800;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:16px;display:inline-block;box-shadow:0 4px 14px rgba(0,0,0,0.2);">
                    Regularizar Pagamento Agora →
                  </a>
                </div>
                <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Precisa de ajuda? Contacte-nos: info@wehosthere.com | +258 84 833 5618</p>
              </div>
              <div style="background:#f8fafc;padding:16px 28px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;">
                WEHOSTHERE — Notificação automática de reativação de conta
              </div>
            </div>
          `
        });

        // Notificar admin
        if (daysSuspended === 7) {
          addAdminNotification({
            title: `🚨 Último Aviso Enviado: ${userName} (${user.email})`,
            message: `Conta suspensa há 7 dias. Email final de reativação enviado. Considerar eliminar a conta se não houver pagamento.`,
            type: 'system',
            userEmail: user.email,
            userName,
            link: '/admin?tab=users'
          });
        }

        emailsSent++;
        console.log(`[Cron Reactivate] Email de reativação (dia ${daysSuspended}) enviado para ${user.email}`);

      } catch (err) {
        console.error(`[Cron Reactivate] Erro ao processar ${user.email}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      suspendedUsersChecked: suspendedUsers.length,
      reactivationEmailsSent: emailsSent
    });
  } catch (error: any) {
    console.error('[Cron Reactivate] Erro:', error);
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
}

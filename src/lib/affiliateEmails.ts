import { sendEmail } from '@/lib/sendgrid';
import { SITE_URL } from '@/lib/siteConfig';

/**
 * 1. Email disparado quando um novo Lead cria conta através do link do afiliado
 */
export async function sendAffiliateNewLeadEmail(
  affiliateEmail: string,
  affiliateName: string,
  leadName: string,
  leadEmail: string
) {
  const maskedEmail = leadEmail.replace(/(.{2})(.*)(?=@)/, (_gp1, h, t) => h + '*'.repeat(Math.max(1, t.length)));
  // Usar o primeiro nome do lead para personalizar o subject
  const leadFirstName = (leadName || 'Novo Utilizador').split(' ')[0];

  return sendEmail({
    to: affiliateEmail,
    subject: `🎉 ${leadFirstName} acabou de criar conta através do seu link! | WEHOSTHERE`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0;">🎉 ${leadFirstName} Criou Conta Pelo Seu Link!</h1>
          <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">Novo lead vinculado à sua conta de afiliado</p>
        </div>
        <div style="background:#f8fafc;padding:36px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="font-size:15px;color:#334155;line-height:1.6;">Olá <strong>${affiliateName}</strong>,</p>
          <p style="font-size:14px;color:#475569;line-height:1.6;">
            Excelente notícia! <strong>${leadName || 'Um novo utilizador'}</strong> acabou de criar conta na WEHOSTHERE usando o seu link de afiliado. Este cliente está agora vinculado a si!
          </p>

          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px;font-size:12px;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Dados do Lead Vinculado:</p>
            <p style="margin:4px 0;font-size:15px;color:#1e293b;font-weight:700;">👤 ${leadName || 'Novo Utilizador'}</p>
            <p style="margin:4px 0;font-size:13px;color:#64748b;font-family:monospace;">${maskedEmail}</p>
            <p style="margin:4px 0;font-size:13px;color:#64748b;">📅 ${new Date().toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <div style="margin-top:12px;padding-top:12px;border-top:1px dashed #cbd5e1;font-size:13px;color:#2563eb;font-weight:600;">
              ✨ Qualquer compra que <strong>${leadFirstName}</strong> realize nos próximos <strong>30 dias</strong> gera <strong>30% de comissão</strong> directa para si!
            </div>
          </div>

          <div style="text-align:center;margin:30px 0;">
            <a href="${SITE_URL}/dashboard/affiliates" style="background:#2563eb;color:#ffffff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(37,99,235,0.25);">
              Ver Contas Criadas no Painel →
            </a>
          </div>

          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">
            WEHOSTHERE - Programa de Parcerias &amp; Afiliados | info@wehosthere.com
          </p>
        </div>
      </div>`,
  });
}

/**
 * 1b. Email especial para o PRIMEIRO clique no link do afiliado
 */
export async function sendAffiliateFirstClickEmail(
  affiliateEmail: string,
  affiliateName: string
) {
  return sendEmail({
    to: affiliateEmail,
    subject: `🚀 O seu link de afiliado recebeu o PRIMEIRO clique! | WEHOSTHERE`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <h1 style="color:#ffffff;font-size:26px;font-weight:900;margin:0;">🚀 Primeiro Clique Registado!</h1>
          <p style="color:#fef3c7;margin:8px 0 0;font-size:14px;">O seu link de afiliado já está a funcionar</p>
        </div>
        <div style="background:#f8fafc;padding:36px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="font-size:15px;color:#334155;line-height:1.6;">Parabéns, <strong>${affiliateName}</strong>! 🎉</p>
          <p style="font-size:14px;color:#475569;line-height:1.6;">
            O seu link de afiliado acaba de receber o <strong>1º clique</strong>! Alguém viu a sua partilha e quis saber mais sobre a WEHOSTHERE.
          </p>

          <div style="background:linear-gradient(135deg,#fffbeb,#fff7ed);border:2px solid #fbbf24;border-radius:16px;padding:24px;margin:24px 0;text-align:center;">
            <div style="font-size:48px;margin-bottom:8px;">🎯</div>
            <p style="font-size:22px;font-weight:900;color:#92400e;margin:0;">1 Clique!</p>
            <p style="font-size:13px;color:#78350f;margin:8px 0 0;">O seu programa de afiliado está activo e a funcionar.</p>
          </div>

          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px;margin:20px 0;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#14532d;">💡 Dica para mais cliques:</p>
            <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
              Partilhe o seu link em grupos de WhatsApp, Facebook e TikTok com uma mensagem personalizada. Quanto mais pessoas virem, maior a probabilidade de criarem conta!
            </p>
          </div>

          <div style="text-align:center;margin:30px 0;">
            <a href="${SITE_URL}/dashboard/affiliates" style="background:#f59e0b;color:#ffffff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(245,158,11,0.3);">
              Ver Estatísticas do Meu Link →
            </a>
          </div>

          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">
            Equipa WEHOSTHERE - Programa de Afiliados
          </p>
        </div>
      </div>`,
  });
}



/**
 * 2. Email disparado quando uma nova Comissão de 30% é gerada
 */
export async function sendAffiliateCommissionEmail(
  affiliateEmail: string,
  affiliateName: string,
  orderAmount: number,
  commissionAmount: number,
  customerName?: string,
  orderId?: string
) {
  return sendEmail({
    to: affiliateEmail,
    subject: `💰 Parabéns! Ganhou ${commissionAmount.toLocaleString('pt-MZ')} MZN de Comissão | WEHOSTHERE`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#059669,#10b981);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <h1 style="color:#ffffff;font-size:26px;font-weight:900;margin:0;">💸 Nova Venda Realizada!</h1>
          <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">Comissão creditada com sucesso na sua conta</p>
        </div>
        <div style="background:#f8fafc;padding:36px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="font-size:15px;color:#334155;line-height:1.6;">Parabéns, <strong>${affiliateName}</strong>!</p>
          <p style="font-size:14px;color:#475569;line-height:1.6;">
            O seu trabalho de divulgação gerou uma nova conversão na plataforma.
          </p>

          <div style="background:#ffffff;border:2px solid #10b981;border-radius:16px;padding:24px;margin:24px 0;text-align:center;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
            <p style="margin:0;font-size:13px;color:#059669;font-weight:700;text-transform:uppercase;">Valor da Sua Comissão (30%)</p>
            <p style="margin:8px 0 0;font-size:36px;font-weight:900;color:#047857;">
              + ${commissionAmount.toLocaleString('pt-MZ')} MZN
            </p>
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid #f1f5f9;font-size:13px;color:#64748b;display:flex;justify-content:space-around;">
              <span>Valor da Compra: <strong>${orderAmount.toLocaleString('pt-MZ')} MZN</strong></span>
              ${orderId ? `<span>Ref: <strong>#${orderId.slice(-6).toUpperCase()}</strong></span>` : ''}
            </div>
          </div>

          <div style="text-align:center;margin:30px 0;">
            <a href="${SITE_URL}/dashboard/affiliates" style="background:#059669;color:#ffffff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(5,150,105,0.25);">
              Ver Saldo & Solicitar Saque →
            </a>
          </div>

          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">
            WEHOSTHERE - info@wehosthere.com | +258 84 833 5618
          </p>
        </div>
      </div>`,
  });
}

/**
 * 3. Email disparado em Marcos de Cliques (10, 20, 50, 100, 250, 500 cliques)
 */
export async function sendAffiliateMilestoneEmail(
  affiliateEmail: string,
  affiliateName: string,
  totalClicks: number
) {
  return sendEmail({
    to: affiliateEmail,
    subject: `🚀 Marco Atingido! O seu link alcançou ${totalClicks} cliques | WEHOSTHERE`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <h1 style="color:#ffffff;font-size:24px;font-weight:900;margin:0;">🎯 ${totalClicks} Visitantes Atraídos!</h1>
          <p style="color:#fef3c7;margin:8px 0 0;font-size:14px;">O seu link de afiliado está a gerar tráfego consistente</p>
        </div>
        <div style="background:#f8fafc;padding:36px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="font-size:15px;color:#334155;line-height:1.6;">Olá <strong>${affiliateName}</strong>,</p>
          <p style="font-size:14px;color:#475569;line-height:1.6;">
            O seu link de divulgação acabou de ultrapassar a impressionante marca de <strong>${totalClicks} cliques</strong>!
          </p>

          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400e;">💡 Dica para Multiplicar Suas Conversões:</p>
            <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">
              Aceda à aba <strong>"Materiais"</strong> no seu painel de afiliado para descarregar banners prontos e copys persuasivas para WhatsApp e redes sociais.
            </p>
          </div>

          <div style="text-align:center;margin:30px 0;">
            <a href="${SITE_URL}/dashboard/affiliates" style="background:#f59e0b;color:#ffffff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(245,158,11,0.25);">
              Aceder aos Materiais de Divulgação →
            </a>
          </div>

          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">
            Equipa WEHOSTHERE - Programa de Afiliados
          </p>
        </div>
      </div>`,
  });
}

/**
 * 4. Email disparado quando um Saque é aprovado/pago
 */
export async function sendAffiliatePayoutProcessedEmail(
  affiliateEmail: string,
  affiliateName: string,
  amount: number,
  payoutMethod: string,
  details?: string
) {
  const methodLabel = payoutMethod === 'mpesa' ? 'M-Pesa' : payoutMethod === 'paypal' ? 'PayPal' : 'Transferência Bancária';

  return sendEmail({
    to: affiliateEmail,
    subject: `✅ Pagamento Enviado: ${amount.toLocaleString('pt-MZ')} MZN | WEHOSTHERE Afiliados`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#059669,#047857);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <h1 style="color:#ffffff;font-size:24px;font-weight:900;margin:0;">💳 Saque Processado com Sucesso!</h1>
          <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">O valor solicitado foi transferido para a sua conta</p>
        </div>
        <div style="background:#f8fafc;padding:36px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="font-size:15px;color:#334155;line-height:1.6;">Olá <strong>${affiliateName}</strong>,</p>
          <p style="font-size:14px;color:#475569;line-height:1.6;">
            Confirmamos que a sua solicitação de saque de comissões foi processada e paga com sucesso.
          </p>

          <table style="width:100%;border-collapse:collapse;margin:24px 0;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr style="background:#f1f5f9;"><td style="padding:12px 16px;font-weight:700;color:#334155;font-size:13px;">Valor Transferido</td><td style="padding:12px 16px;font-weight:800;color:#059669;font-size:15px;">${amount.toLocaleString('pt-MZ')} MZN</td></tr>
            <tr><td style="padding:12px 16px;font-weight:700;color:#334155;font-size:13px;">Método de Pagamento</td><td style="padding:12px 16px;color:#1e293b;font-size:13px;">${methodLabel}</td></tr>
            ${details ? `<tr style="background:#f1f5f9;"><td style="padding:12px 16px;font-weight:700;color:#334155;font-size:13px;">Detalhes / Conta</td><td style="padding:12px 16px;color:#1e293b;font-size:13px;">${details}</td></tr>` : ''}
            <tr><td style="padding:12px 16px;font-weight:700;color:#334155;font-size:13px;">Data de Pagamento</td><td style="padding:12px 16px;color:#1e293b;font-size:13px;">${new Date().toLocaleDateString('pt-MZ')}</td></tr>
          </table>

          <p style="font-size:14px;color:#475569;line-height:1.6;">
            Agradecemos a sua parceria e dedicação. Continue divulgando o seu link para faturar ainda mais!
          </p>

          <div style="text-align:center;margin:30px 0;">
            <a href="${SITE_URL}/dashboard/affiliates" style="background:#059669;color:#ffffff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;display:inline-block;">
              Aceder ao Painel →
            </a>
          </div>

          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">
            WEHOSTHERE - info@wehosthere.com
          </p>
        </div>
      </div>`,
  });
}

import { SITE_URL } from '@/lib/siteConfig';

// Remetente padrão da plataforma
export const DEFAULT_FROM = process.env.EMAIL_USER || 'info@wehosthere.com';
export const DEFAULT_FROM_NAME = 'WEHOSTHERE';

export interface SendEmailOptions {
  to: string;
  fromEmail?: string;
  fromName?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: { filename: string; content: string }[];
}

/**
 * Envia um e-mail via Resend API (HTTP direct call).
 * Requer RESEND_API_KEY no .env.local / variáveis de ambiente.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY não configurado ou inválido. E-mail não enviado.');
    return { success: false, error: 'RESEND_API_KEY não configurado no servidor.' };
  }

  const fromName = opts.fromName || DEFAULT_FROM_NAME;
  const fromEmail = opts.fromEmail || DEFAULT_FROM;
  const fromFormatted = `${fromName} <${fromEmail}>`;

  try {
    const bodyHtml = opts.html || (opts.text ? opts.text.replace(/\n/g, '<br>') : '<p></p>');
    const bodyText = opts.text || '';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromFormatted,
        to: [opts.to],
        subject: opts.subject,
        html: bodyHtml,
        text: bodyText,
        ...(opts.attachments && opts.attachments.length > 0 ? { attachments: opts.attachments } : {})
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.message || data?.name || 'Erro ao enviar e-mail via Resend API';
      console.error('[Resend] ❌ Erro API Resend:', errorMsg, data);
      return { success: false, error: errorMsg };
    }

    console.log(`[Resend] ✅ E-mail enviado para: ${opts.to} | ID: ${data.id}`);
    return { success: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[Resend] ❌ Exceção ao enviar e-mail:', errMsg);
    return { success: false, error: errMsg };
  }
}

// ——————————————————————————————————————
// Templates de E-mails Transacionais
// ——————————————————————————————————————

/** E-mail de boas-vindas enviado após registo */
export async function sendWelcomeEmail(toEmail: string, userName: string, plan: string, confirmationCode?: string) {
  const planNames: Record<string, string> = {
    basic: 'Básico',
    pro: 'Profissional',
    enterprise: 'Empresarial',
  };

  console.log('[SendGrid] Enviando email de boas-vindas:', { 
    toEmail, 
    userName, 
    plan, 
    hasConfirmationCode: !!confirmationCode,
    codeLength: confirmationCode?.length 
  });

  const confirmPageLink = `${SITE_URL}/confirm-email?email=${encodeURIComponent(toEmail)}`;

  return sendEmail({
    to: toEmail,
    subject: `✅ Confirme sua conta WEHOSTHERE, ${userName}!`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">Plataforma de Hospedagem Profissional</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e3a8a;font-size:22px;margin-top:0;">👋 Bem-vindo, ${userName}!</h2>
          <p style="color:#475569;line-height:1.7;">A sua conta foi criada com sucesso. Plano: <strong>${planNames[plan] || plan}</strong>.</p>
          <p style="color:#475569;line-height:1.7;">Para ativar sua conta, insira o código de 6 dígitos abaixo na página de confirmação:</p>
          <div style="background:#1e3a8a;color:white;font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;padding:20px;border-radius:10px;margin:24px 0;">
            ${confirmationCode || '------'}
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${confirmPageLink}" style="background:#2563eb;color:white;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;">Ir para página de confirmação →</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">Este código expira em 24 horas. Equipa WEHOSTHERE — Hospedagem Profissional em Moçambique</p>
        </div>
      </div>`,
  });
}

/** Confirmação de pagamento / fatura */
export async function sendInvoiceEmail(toEmail: string, userName: string, invoiceRef: string, amount: string, plan: string) {
  return sendEmail({
    to: toEmail,
    subject: `🧾 Pagamento Confirmado — Fatura ${invoiceRef} | WEHOSTHERE`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#059669,#10b981);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#d1fae5;margin:8px 0 0;font-size:13px;">Fatura ${invoiceRef}</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p>Olá <strong>${userName}</strong>, o seu pagamento foi confirmado.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr style="background:#eff6ff;"><td style="padding:12px;font-weight:700;color:#1e3a8a;">Plano</td><td style="padding:12px;">${plan}</td></tr>
            <tr><td style="padding:12px;font-weight:700;color:#1e3a8a;">Valor</td><td style="padding:12px;">${amount}</td></tr>
            <tr style="background:#eff6ff;"><td style="padding:12px;font-weight:700;color:#1e3a8a;">Referência</td><td style="padding:12px;">${invoiceRef}</td></tr>
          </table>
          <div style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/dashboard/billing" style="background:#2563eb;color:white;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">Ver Faturamento →</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">WEHOSTHERE — info@wehosthere.com</p>
        </div>
      </div>`,
  });
}

/** E-mail enviado do Webmail corporativo */
export interface InvoiceEmailItem {
  service: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  subtotal: number;
}

export interface SendInvoiceIssuedEmailOptions {
  toEmail: string;
  customerName: string;
  invoiceNumber: string;
  issuedAt: string;
  dueDate?: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  status: string;
  paymentMethod?: string;
  items: InvoiceEmailItem[];
  subtotal: number;
  discount?: number;
  total: number;
  notes?: string;
}

/** E-mail oficial disparado quando uma fatura é emitida ou atualizada pela administração */
export async function sendInvoiceIssuedEmail(opts: SendInvoiceIssuedEmailOptions) {
  const isPaid = opts.status === 'paid' || opts.status === 'completed';
  const isPending = opts.status === 'pending' || opts.status === 'draft';
  const isOverdue = opts.status === 'overdue';

  const statusLabel = isPaid ? 'PAGO / LIQUIDADO' : isOverdue ? 'VENCIDO' : 'PAGAMENTO PENDENTE';
  const statusBg = isPaid ? '#ecfdf5' : isOverdue ? '#fef2f2' : '#fffbeb';
  const statusColor = isPaid ? '#047857' : isOverdue ? '#b91c1c' : '#b45309';
  const statusBorder = isPaid ? '#a7f3d0' : isOverdue ? '#fecaca' : '#fde68a';

  const methodLabel = {
    mpesa: 'M-Pesa Moçambique',
    emola: 'eMola Moçambique',
    card: 'Cartão de Crédito / Débito',
    bank_transfer: 'Transferência Bancária / Depósito',
    cash: 'Numerário / Caixa'
  }[opts.paymentMethod?.toLowerCase() || ''] || opts.paymentMethod || 'M-Pesa / eMola / Transferência';

  const formatDate = (val?: string) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return val;
    }
  };

  const formattedIssued = formatDate(opts.issuedAt);
  const formattedDue = opts.dueDate ? formatDate(opts.dueDate) : 'A pronto pagamento';
  const hasPeriod = opts.servicePeriodStart && opts.servicePeriodEnd;
  const formattedPeriod = hasPeriod
    ? `${formatDate(opts.servicePeriodStart)} a ${formatDate(opts.servicePeriodEnd)}`
    : null;

  const subject = isPaid
    ? `✅ Fatura Liquidada: ${opts.invoiceNumber} (${opts.total.toLocaleString('pt-MZ')} MT) — WEHOSTHERE`
    : `📄 Nova Fatura Emitida: ${opts.invoiceNumber} (${opts.total.toLocaleString('pt-MZ')} MT) — WEHOSTHERE`;

  const itemsHtml = opts.items && opts.items.length > 0
    ? opts.items.map((it, idx) => `
      <tr style="border-bottom:1px solid #e2e8f0;background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding:12px 14px;color:#0f172a;font-size:13px;line-height:1.4;">
          <div style="font-weight:700;">${it.service}</div>
          ${it.description ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${it.description}</div>` : ''}
        </td>
        <td align="center" style="padding:12px 14px;color:#334155;font-size:13px;font-weight:600;">
          ${it.quantity}
        </td>
        <td align="right" style="padding:12px 14px;color:#0f172a;font-size:13px;font-weight:700;">
          ${it.subtotal.toLocaleString('pt-MZ')} MT
        </td>
      </tr>
    `).join('')
    : `
      <tr style="border-bottom:1px solid #e2e8f0;background:#ffffff;">
        <td style="padding:12px 14px;color:#0f172a;font-size:13px;line-height:1.4;">
          <div style="font-weight:700;">Serviços de Hospedagem & Cloud</div>
        </td>
        <td align="center" style="padding:12px 14px;color:#334155;font-size:13px;font-weight:600;">1</td>
        <td align="right" style="padding:12px 14px;color:#0f172a;font-size:13px;font-weight:700;">
          ${opts.total.toLocaleString('pt-MZ')} MT
        </td>
      </tr>
    `;

  const billingDashboardUrl = `${SITE_URL}/dashboard/billing`;

  const html = `
    <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;max-width:620px;margin:0 auto;color:#0f172a;background:#ffffff;">
      <!-- Cabeçalho com Branding WEHOSTHERE -->
      <div style="background:linear-gradient(135deg,#0052cc 0%,#0065ff 50%,#003884 100%);padding:36px 32px 30px;border-radius:18px 18px 0 0;text-align:center;">
        <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:190px;height:auto;margin:0 auto 14px;display:block;" />
        <span style="display:inline-block;background:rgba(255,255,255,0.18);color:#ffffff;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:5px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.25);">
          Fatura Comercial Oficial
        </span>
        <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:12px 0 4px;letter-spacing:-0.5px;">
          ${opts.invoiceNumber}
        </h1>
        <p style="color:#dbeafe;margin:0;font-size:13px;">
          WEHOSTHERE Infraestruturas & Cloud Moçambique
        </p>
      </div>

      <!-- Corpo da Fatura -->
      <div style="background:#f8fafc;padding:32px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 18px 18px;">
        <!-- Saudação -->
        <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
          Prezado(a) <strong>${opts.customerName}</strong>,
        </p>
        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
          ${isPaid 
            ? 'Confirmamos a receção e quitação da sua fatura. Abaixo encontra os dados oficiais do documento emitido:' 
            : 'Informamos que foi gerada uma nova fatura referente aos seus serviços contratados. Seguem os detalhes para conferência e liquidação:'}
        </p>

        <!-- Metadados do Documento -->
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr>
              <td style="padding:6px 0;color:#64748b;font-weight:600;width:40%;">Data de Emissão:</td>
              <td style="padding:6px 0;color:#0f172a;font-weight:700;">${formattedIssued}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-weight:600;">Data de Vencimento:</td>
              <td style="padding:6px 0;color:#0f172a;font-weight:700;">${formattedDue}</td>
            </tr>
            ${formattedPeriod ? `
            <tr>
              <td style="padding:6px 0;color:#64748b;font-weight:600;">Período do Serviço:</td>
              <td style="padding:6px 0;color:#0f172a;font-weight:700;">${formattedPeriod}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding:6px 0;color:#64748b;font-weight:600;">Método Indicado:</td>
              <td style="padding:6px 0;color:#0f172a;font-weight:700;">${methodLabel}</td>
            </tr>
            <tr>
              <td style="padding:8px 0 2px;color:#64748b;font-weight:600;">Estado do Pagamento:</td>
              <td style="padding:8px 0 2px;">
                <span style="display:inline-block;background:${statusBg};color:${statusColor};border:1px solid ${statusBorder};font-size:11px;font-weight:800;padding:3px 10px;border-radius:12px;text-transform:uppercase;letter-spacing:0.5px;">
                  ${statusLabel}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Tabela de Itens -->
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;text-align:left;">
            <thead>
              <tr style="background:#f1f5f9;border-bottom:1px solid #e2e8f0;">
                <th style="padding:10px 14px;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Descrição</th>
                <th style="padding:10px 14px;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Qtd</th>
                <th style="padding:10px 14px;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totais -->
          <div style="background:#f8fafc;padding:16px;border-top:1px solid #e2e8f0;">
            <table style="width:100%;font-size:13px;border-collapse:collapse;">
              <tr>
                <td style="color:#64748b;padding:4px 0;">Subtotal (sem IVA):</td>
                <td align="right" style="color:#334155;font-weight:600;">${(opts.total * 0.84).toLocaleString('pt-MZ', { maximumFractionDigits: 2 })} MT</td>
              </tr>
              <tr>
                <td style="color:#64748b;padding:4px 0;">IVA (16% legal):</td>
                <td align="right" style="color:#334155;font-weight:600;">${(opts.total * 0.16).toLocaleString('pt-MZ', { maximumFractionDigits: 2 })} MT</td>
              </tr>
              <tr style="border-top:1px solid #cbd5e1;">
                <td style="padding:10px 0 2px;font-weight:800;font-size:15px;color:#0f172a;">
                  ${isPaid ? 'TOTAL PAGO:' : 'TOTAL A PAGAR:'}
                </td>
                <td align="right" style="padding:10px 0 2px;font-weight:900;font-size:18px;color:${isPaid ? '#047857' : '#0052cc'};">
                  ${opts.total.toLocaleString('pt-MZ')} MT
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Instruções de Pagamento (Se não estiver pago) -->
        ${!isPaid ? `
        <div style="background:#ffffff;border:1px solid #cbd5e1;border-left:4px solid #0052cc;border-radius:12px;padding:18px;margin-bottom:24px;">
          <h3 style="margin:0 0 10px;font-size:14px;font-weight:800;color:#0f172a;">
            💳 Coordenadas de Pagamento Rápidas:
          </h3>
          <ul style="margin:0;padding-left:18px;color:#334155;font-size:13px;line-height:1.8;">
            <li><strong>M-Pesa:</strong> +258 84 833 5618 (Titular: WEHOSTHERE / Afonso Domingos)</li>
            <li><strong>e-Mola:</strong> +258 86 833 5618 / +258 84 833 5618</li>
            <li><strong>Millennium BIM:</strong> NIB: <code>433372004293948</code></li>
          </ul>
          <p style="margin:10px 0 0;font-size:12px;color:#64748b;">
            Após efetuar o pagamento, o comprovativo pode ser enviado para <a href="mailto:info@wehosthere.com" style="color:#0052cc;">info@wehosthere.com</a> ou via WhatsApp para <strong>+258 84 833 5618</strong>.
          </p>
        </div>
        ` : ''}

        ${opts.notes ? `
        <div style="background:#f1f5f9;border-radius:10px;padding:12px 16px;margin-bottom:24px;font-size:12px;color:#475569;">
          <strong>Observações:</strong> ${opts.notes}
        </div>
        ` : ''}

        <!-- Botão de Ação -->
        <div style="text-align:center;margin:30px 0 16px;">
          <a href="${billingDashboardUrl}" style="background:linear-gradient(135deg,#0052cc,#0065ff);color:#ffffff;font-weight:800;padding:15px 36px;border-radius:12px;text-decoration:none;font-size:14px;display:inline-block;box-shadow:0 4px 14px rgba(0,82,204,0.35);letter-spacing:0.2px;">
            Aceder ao Painel & Ver Fatura / Recibo →
          </a>
        </div>

        <p style="text-align:center;color:#94a3b8;font-size:12px;margin:20px 0 0;">
          A fatura e recibo em formato PDF estão disponíveis a qualquer momento no seu painel em <strong>${billingDashboardUrl}</strong>.
        </p>
      </div>

      <!-- Rodapé Oficial -->
      <div style="padding:24px 20px;text-align:center;color:#94a3b8;font-size:11px;line-height:1.6;">
        <p style="margin:0 0 4px;font-weight:600;color:#64748b;">
          WEHOSTHERE Infraestruturas & Cloud Moçambique
        </p>
        <p style="margin:0 0 6px;">
          Maputo, Moçambique • <a href="mailto:info@wehosthere.com" style="color:#64748b;text-decoration:none;">info@wehosthere.com</a> • +258 84 833 5618
        </p>
        <p style="margin:0;font-size:10px;color:#cbd5e1;">
          Processado por computador ao abrigo do Código do IVA. Documento válido como comprovativo após boa cobrança.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: opts.toEmail,
    subject,
    html
  });
}

/** E-mail enviado do Webmail corporativo */
export async function sendWebmailMessage(fromEmail: string, toEmail: string, subject: string, body: string) {
  return sendEmail({
    to: toEmail,
    fromEmail: DEFAULT_FROM,
    fromName: `${fromEmail} via WEHOSTHERE Webmail`,
    subject,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:#1e3a8a;padding:24px;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:120px;height:auto;margin:0 auto;display:block;" />
        </div>
        <div style="padding:32px 24px;">
          <p style="margin:0 0 6px;color:#64748b;font-size:12px;"><strong>De:</strong> ${fromEmail}</p>
          <p style="margin:0 0 24px;color:#64748b;font-size:12px;"><strong>Para:</strong> ${toEmail}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin-bottom:24px;">
          <div style="white-space:pre-line;line-height:1.8;color:#1e293b;font-size:15px;">${body}</div>
        </div>
        <div style="background:#f1f5f9;padding:14px 24px;font-size:11px;color:#94a3b8;">
          Enviado via WEHOSTHERE Webmail Corporativo — ${SITE_URL.replace('https://', '')}
        </div>
      </div>`,
  });
}

/** Ticket de Suporte criado */
export async function sendSupportTicketEmail(toEmail: string, userName: string, ticketId: string, subject: string) {
  return sendEmail({
    to: toEmail,
    subject: `🎫 Ticket de Suporte Aberto — #${ticketId} | WEHOSTHERE`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#ede9fe;margin:8px 0 0;font-size:13px;">#${ticketId}</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p>Olá <strong>${userName}</strong>, o seu pedido foi registado:</p>
          <div style="background:#f3f0ff;border-left:4px solid #7c3aed;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;font-weight:700;color:#5b21b6;">${subject}</p>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/dashboard/tickets" style="background:#7c3aed;color:white;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">Ver Ticket →</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">WEHOSTHERE — info@wehosthere.com</p>
        </div>
      </div>`,
  });
}

/** Email de recuperação de senha */
export async function sendPasswordResetEmail(toEmail: string, userName: string, resetToken: string) {
  const resetUrl = `${SITE_URL}/reset-password?token=${resetToken}`;
  
  return sendEmail({
    to: toEmail,
    subject: '🔐 Recuperação de Senha — WEHOSTHERE',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#fef3c7;margin:8px 0 0;font-size:13px;">Recuperação de Senha</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#475569;line-height:1.7;">Olá <strong>${userName}</strong>,</p>
          <p style="color:#475569;line-height:1.7;">Recebemos um pedido para redefinir a sua senha. Se não fez este pedido, pode ignorar este email.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="background:#f59e0b;color:white;font-weight:700;padding:16px 40px;border-radius:10px;text-decoration:none;font-size:16px;display:inline-block;">Redefinir Senha →</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">Este link expira em 1 hora por segurança.</p>
          <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Equipa WEHOSTHERE — Hospedagem Profissional em Moçambique</p>
        </div>
      </div>`,
  });
}

/** Email de notificação de exclusão de conta */
export async function sendAccountDeletionEmail(toEmail: string, userName: string, reason?: string) {
  return sendEmail({
    to: toEmail,
    subject: '⚠️ Sua conta WEHOSTHERE foi eliminada',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#fecaca;margin:8px 0 0;font-size:13px;">Conta Eliminada</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#475569;line-height:1.7;">Olá <strong>${userName}</strong>,</p>
          <p style="color:#475569;line-height:1.7;">Informamos que a sua conta na plataforma WEHOSTHERE foi eliminada pela administração.</p>
          ${reason ? `
          <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;font-weight:700;color:#dc2626;">Motivo:</p>
            <p style="margin:8px 0 0;color:#475569;">${reason}</p>
          </div>
          ` : ''}
          <p style="color:#475569;line-height:1.7;">Todos os seus dados, serviços e informações associados a esta conta foram removidos permanentemente.</p>
          <p style="color:#475569;line-height:1.7;">Se acredita que esta ação foi um erro ou tem alguma dúvida, entre em contacto com o nosso suporte:</p>
          <div style="background:#eff6ff;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;color:#1e3a8a;font-weight:700;">Email:</p>
            <p style="margin:4px 0 0;color:#475569;">info@wehosthere.com</p>
            <p style="margin:8px 0 0;color:#1e3a8a;font-weight:700;">Telefone Principal:</p>
            <p style="margin:4px 0 0;color:#475569;">+258 84 833 5618</p>
            <p style="margin:8px 0 0;color:#1e3a8a;font-weight:700;">Telefone Secundário:</p>
            <p style="margin:4px 0 0;color:#475569;">+258 84 833 5618</p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Equipa WEHOSTHERE — Hospedagem Profissional em Moçambique</p>
        </div>
      </div>`,
  });
}

/** Email de confirmação de ativação de conta */
export async function sendAccountActivatedEmail(toEmail: string, userName: string) {
  const loginUrl = `${SITE_URL}/login`;
  
  return sendEmail({
    to: toEmail,
    subject: '✅ Sua conta WEHOSTHERE foi ativada com sucesso!',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#059669,#10b981);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#d1fae5;margin:8px 0 0;font-size:13px;">Conta Ativada</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#475569;line-height:1.7;">Parabéns, <strong>${userName}</strong>!</p>
          <p style="color:#475569;line-height:1.7;">A sua conta na plataforma WEHOSTHERE foi ativada com sucesso. Você já pode começar a utilizar todos os nossos serviços.</p>
          <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;font-weight:700;color:#059669;">O que você pode fazer agora:</p>
            <ul style="margin:8px 0 0;padding-left:20px;color:#475569;">
              <li style="margin:4px 0;">Fazer login na sua conta</li>
              <li style="margin:4px 0;">Acessar o painel de controlo</li>
              <li style="margin:4px 0;">Configurar o seu site</li>
              <li style="margin:4px 0;">Gerenciar seus serviços</li>
            </ul>
          </div>
          <div style="text-align:center;margin:32px 0;">
            <a href="${loginUrl}" style="background:#10b981;color:white;font-weight:700;padding:16px 40px;border-radius:10px;text-decoration:none;font-size:16px;display:inline-block;">Fazer Login Agora →</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">Se tiver alguma dúvida, entre em contacto com o nosso suporte.</p>
          <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Equipa WEHOSTHERE — Hospedagem Profissional em Moçambique</p>
        </div>
      </div>`,
  });
}

/** Email de notificação de login */
export async function sendLoginNotificationEmail(toEmail: string, userName: string, loginTime: string, ipAddress?: string, device?: string) {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  
  return sendEmail({
    to: toEmail,
    subject: '🔐 Nova sessão iniciada na sua conta WEHOSTHERE',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#bfdbfe;margin:8px 0 0;font-size:13px;">Notificação de Login</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#475569;line-height:1.7;">Olá, <strong>${userName}</strong>!</p>
          <p style="color:#475569;line-height:1.7;">Informamos que uma nova sessão foi iniciada na sua conta WEHOSTHERE.</p>
          
          <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;font-weight:700;color:#1d4ed8;">Detalhes do login:</p>
            <ul style="margin:8px 0 0;padding-left:20px;color:#475569;">
              <li style="margin:4px 0;"><strong>Data e hora:</strong> ${loginTime}</li>
              ${ipAddress ? `<li style="margin:4px 0;"><strong>Endereço IP:</strong> ${ipAddress}</li>` : ''}
              ${device ? `<li style="margin:4px 0;"><strong>Dispositivo:</strong> ${device}</li>` : ''}
            </ul>
          </div>
          
          <p style="color:#475569;line-height:1.7;margin-top:16px;">Se você reconhece esta atividade, não é necessário tomar nenhuma ação.</p>
          <p style="color:#dc2626;line-height:1.7;margin-top:8px;">Se você não reconhece este login, por favor altere a sua senha imediatamente e entre em contacto com o nosso suporte.</p>
          
          <div style="text-align:center;margin:32px 0;">
            <a href="${dashboardUrl}" style="background:#3b82f6;color:white;font-weight:700;padding:16px 40px;border-radius:10px;text-decoration:none;font-size:16px;display:inline-block;">Acessar Painel →</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">Se tiver alguma dúvida, entre em contacto com o nosso suporte.</p>
          <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Equipa WEHOSTHERE — Hospedagem Profissional em Moçambique</p>
        </div>
      </div>`,
  });
}

/** Email de newsletter */
export async function sendNewsletterEmail(toEmail: string, subject: string, content: string, unsubscribeUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: subject,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#8b5cf6,#6366f1);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#e9d5ff;margin:8px 0 0;font-size:13px;">Newsletter</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          ${content}
          
          <div style="text-align:center;margin:32px 0;padding-top:24px;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">
              Recebe este email porque subscreveu à newsletter WEHOSTHERE.
            </p>
            <a href="${unsubscribeUrl}" style="color:#64748b;font-size:12px;text-decoration:underline;margin-top:8px;display:inline-block;">
              Cancelar subscrição
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Equipa WEHOSTHERE — Hospedagem Profissional em Moçambique</p>
        </div>
      </div>`,
  });
}

/** Email de inscrição no curso (Boas-vindas à aula de introdução) */
export async function sendCourseEnrollmentEmail(toEmail: string, userName: string, courseTitle: string) {
  const academyUrl = `${SITE_URL}/dashboard/academy`;

  return sendEmail({
    to: toEmail,
    subject: `🎓 Bem-vindo ao curso: ${courseTitle}!`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#e0e7ff;margin:8px 0 0;font-size:14px;font-weight:600;">Academia Web WEHOSTHERE</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#334155;font-size:16px;line-height:1.7;">Olá, <strong>${userName}</strong>!</p>
          <p style="color:#334155;font-size:15px;line-height:1.7;">
            A sua inscrição no curso <strong>${courseTitle}</strong> foi confirmada com sucesso!
          </p>
          
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px;font-weight:800;color:#1d4ed8;font-size:15px;">🎁 O que está disponível para si agora:</p>
            <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
              <li>Acesso completo à <strong>Aula 1 (Introdução e Conceitos)</strong> gratuita.</li>
              <li>Estrutura passo a passo e visão geral dos 13 módulos.</li>
              <li>Acesso à comunidade e suporte da plataforma.</li>
            </ul>
          </div>
          
          <div style="text-align:center;margin:32px 0;">
            <a href="${academyUrl}" style="background:linear-gradient(135deg,#2563eb,#4f46e5);color:white;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(37,99,235,0.25);">Começar a Assistir Agora →</a>
          </div>
          
          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">Equipa WEHOSTHERE — Academia de Desenvolvimento Web</p>
        </div>
      </div>`,
  });
}

/** Email de confirmação de pagamento do curso completo */
export async function sendCoursePurchaseEmail(toEmail: string, userName: string, courseTitle: string, amount: number = 500, claimToken?: string) {
  const academyUrl = claimToken ? `${SITE_URL}/academy/claim?token=${claimToken}` : `${SITE_URL}/dashboard/academy`;

  return sendEmail({
    to: toEmail,
    subject: `🎉 Acesso Completo Liberado: ${courseTitle}!`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#059669,#10b981);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;font-weight:600;">Pagamento Confirmado</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#334155;font-size:16px;line-height:1.7;">Olá, <strong>${userName}</strong>!</p>
          <p style="color:#334155;font-size:15px;line-height:1.7;">
            Confirmamos a receção do seu pagamento de <strong>${amount} MT</strong> para o curso <strong>${courseTitle}</strong>.
          </p>
          
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px;font-weight:800;color:#15803d;font-size:15px;">✓ O seu curso completo está 100% desbloqueado:</p>
            <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.8;">
              <li>Acesso vitalício aos <strong>13 módulos práticos</strong>.</li>
              <li>Downloads de modelos de código e materiais em PDF.</li>
              <li>Direito à emissão do <strong>Certificado Oficial WEHOSTHERE</strong> ao concluir.</li>
            </ul>
          </div>
          
          <div style="text-align:center;margin:32px 0;">
            <a href="${academyUrl}" style="background:linear-gradient(135deg,#059669,#10b981);color:white;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(16,185,129,0.25);">${claimToken ? 'Ativar Acesso & Assistir Aulas →' : 'Acessar Todas as Aulas →'}</a>
          </div>
          
          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">Equipa WEHOSTHERE — Academia de Desenvolvimento Web</p>
        </div>
      </div>`,
  });
}

/** Email de conclusão de curso e emissão de certificado */
export async function sendCourseCompletionEmail(toEmail: string, userName: string, courseTitle: string, certificateNumber: string, verificationUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: `🏆 Parabéns! O seu Certificado de ${courseTitle} está pronto!`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:linear-gradient(135deg,#7c3aed,#9333ea);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#ede9fe;margin:8px 0 0;font-size:14px;font-weight:600;">Certificado Oficial de Conclusão</p>
        </div>
        <div style="background:#f8fafc;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="color:#334155;font-size:16px;line-height:1.7;">Parabéns, <strong>${userName}</strong>! 🎓</p>
          <p style="color:#334155;font-size:15px;line-height:1.7;">
            Você concluiu com distinção todas as lições e módulos do curso <strong>${courseTitle}</strong>.
          </p>
          
          <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
            <p style="margin:0;font-size:13px;color:#6b21a8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Código de Autenticidade do Certificado</p>
            <p style="margin:8px 0 0;font-family:monospace;font-size:22px;font-weight:900;color:#581c87;letter-spacing:2px;">${certificateNumber}</p>
          </div>
          
          <div style="text-align:center;margin:32px 0;">
            <a href="${verificationUrl}" style="background:linear-gradient(135deg,#7c3aed,#9333ea);color:white;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(124,58,237,0.25);">Visualizar e Imprimir Certificado →</a>
          </div>
          
          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:16px 0 0;">
            Pode adicionar este certificado ao seu currículo e perfil do LinkedIn através do link oficial de validação.
          </p>
          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">Equipa WEHOSTHERE — Academia de Desenvolvimento Web</p>
        </div>
      </div>`,
  });
}

/** Email de notificação de promoção ou despromoção de Administrador / Super Administrador */
export async function sendRoleChangeEmail(toEmail: string, userName: string, newRole: 'super_admin' | 'admin' | 'user') {
  const isSuperAdmin = newRole === 'super_admin';
  const isAdmin = newRole === 'admin';
  const isElevated = isSuperAdmin || isAdmin;
  const targetUrl = isElevated ? `${SITE_URL}/admin` : `${SITE_URL}/dashboard`;

  let subject = `ℹ️ Atualização de Permissões na sua conta WEHOSTHERE`;
  if (isSuperAdmin) {
    subject = `👑 Acesso Total Concedido: Promovido a Super Administrador da WEHOSTHERE!`;
  } else if (isAdmin) {
    subject = `🛡️ Acesso Concedido: Promovido a Administrador da WEHOSTHERE!`;
  }

  const gradientHeader = isSuperAdmin
    ? 'linear-gradient(135deg, #4c1d95, #6b21a8, #c026d3)' // Roxo Real Luxuoso
    : isAdmin
      ? 'linear-gradient(135deg, #1e40af, #3b82f6, #0284c7)' // Azul Índigo Operacional
      : 'linear-gradient(135deg, #475569, #334155)'; // Neutro

  return sendEmail({
    to: toEmail,
    subject,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:${gradientHeader};padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:180px;height:auto;margin:0 auto 16px;display:block;" />
          <p style="color:#ede9fe;margin:8px 0 0;font-size:14px;font-weight:700;letter-spacing:0.5px;">
            ${isSuperAdmin ? '👑 NÍVEL MÁXIMO DE ACESSO' : isAdmin ? '🛡️ GESTÃO OPERACIONAL' : '👤 ATUALIZAÇÃO DE PERFIL'}
          </p>
        </div>
        <div style="background:#ffffff;padding:40px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;">
          <p style="color:#334155;font-size:16px;line-height:1.7;">Olá, <strong>${userName}</strong>,</p>
          
          ${isSuperAdmin ? `
            <p style="color:#334155;font-size:15px;line-height:1.7;">
              Informamos com grande honra que a sua conta recebeu privilégios de <strong>Super Administrador da plataforma WEHOSTHERE 👑</strong>.
            </p>
            <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:22px;margin:24px 0;">
              <p style="margin:0 0 10px;font-weight:800;color:#581c87;font-size:15px;">Privilégios Totais Concedidos:</p>
              <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.9;">
                <li>Acesso irrestrito a todas as abas do <strong>Painel Administrativo (/admin)</strong>.</li>
                <li><strong>Gestão Financeira &amp; Payouts:</strong> Autorização e execução de transferências B2C.</li>
                <li><strong>Gestão de Administradores:</strong> Promover, delegar e revogar cargos de outros utilizadores.</li>
                <li><strong>Segurança &amp; Auditoria:</strong> Acesso a logs de segurança, presença e configurações de infraestrutura.</li>
              </ul>
            </div>
            <div style="text-align:center;margin:32px 0;">
              <a href="${targetUrl}" style="background:linear-gradient(135deg,#7e22ce,#4c1d95);color:white;font-weight:800;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 14px rgba(126,34,206,0.35);">Aceder como Super Admin →</a>
            </div>
          ` : isAdmin ? `
            <p style="color:#334155;font-size:15px;line-height:1.7;">
              Informamos que a sua conta foi promovida para <strong>Administrador da plataforma WEHOSTHERE 🛡️</strong>.
            </p>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:22px;margin:24px 0;">
              <p style="margin:0 0 10px;font-weight:800;color:#1e40af;font-size:15px;">Privilégios Operacionais Ativados:</p>
              <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.9;">
                <li>Acesso ao <strong>Painel Administrativo (/admin)</strong> para gestão diária.</li>
                <li>Gestão de clientes, encomendas de sites e serviços ativos.</li>
                <li>Atendimento e resposta a <strong>tickets de suporte</strong> técnico.</li>
                <li>Gestão de cursos, matrículas e certificados na <strong>Academia</strong>.</li>
              </ul>
            </div>
            <div style="text-align:center;margin:32px 0;">
              <a href="${targetUrl}" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(37,99,235,0.3);">Aceder ao Painel Administrativo →</a>
            </div>
          ` : `
            <p style="color:#334155;font-size:15px;line-height:1.7;">
              Informamos que as permissões administrativas da sua conta foram atualizadas. A sua conta funciona agora no modo de <strong>Utilizador / Cliente</strong>.
            </p>
            <p style="color:#64748b;font-size:14px;line-height:1.6;">
              Continua a ter acesso total a todos os seus sites, contas de e-mail, domínios, faturas e cursos na Academia.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${targetUrl}" style="background:#334155;color:white;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;">Aceder ao Dashboard do Cliente →</a>
            </div>
          `}
          
          <p style="color:#94a3b8;font-size:12px;margin:28px 0 0;text-align:center;border-top:1px solid #f1f5f9;padding-top:16px;">
            Equipa de Segurança &amp; Infraestrutura WEHOSTHERE
          </p>
        </div>
      </div>`,
  });
}

export interface DomainSearchAlertData {
  domain: string;
  sld: string;
  extension: string;
  isAvailable: boolean;
  price?: number;
  searchCount: number;
  ip: string;
  userAgent?: string;
  userEmail?: string;
  userName?: string;
  searchedAt: Date;
}

/**
 * Notificação por e-mail para Administrador quando um visitante pesquisa por um domínio
 */
export async function sendDomainSearchAlertEmail(toEmail: string, data: DomainSearchAlertData) {
  const adminUrl = `${SITE_URL}/admin/domain-search-logs`;
  const formattedDate = new Intl.DateTimeFormat('pt-MZ', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Africa/Maputo'
  }).format(data.searchedAt);

  const statusColor = data.isAvailable ? '#059669' : '#dc2626';
  const statusBg = data.isAvailable ? '#ecfdf5' : '#fef2f2';
  const statusBorder = data.isAvailable ? '#a7f3d0' : '#fecaca';
  const statusText = data.isAvailable ? '✓ DISPONÍVEL PARA REGISTO' : '✕ OCUPADO / JÁ REGISTADO';

  const userAgentShort = data.userAgent
    ? data.userAgent.includes('Mobile')
      ? '📱 Dispositivo Móvel'
      : '💻 Computador / Desktop'
    : 'Desconhecido';

  const subject = data.isAvailable
    ? `🎯 Oportunidade: Pesquisa de Domínio "${data.domain}" [DISPONÍVEL]`
    : `🔍 Alerta: Pesquisa de Domínio "${data.domain}" [OCUPADO]`;

  return sendEmail({
    to: toEmail,
    subject,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:0 auto;color:#111;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
        <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 28px;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:160px;height:auto;margin:0 auto 12px;display:block;" />
          <div style="display:inline-block;background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);padding:6px 14px;border-radius:20px;margin-top:6px;">
            <span style="color:#38bdf8;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">⚡ Alerta de Pesquisa em Tempo Real</span>
          </div>
        </div>

        <div style="padding:32px 28px;background:#ffffff;">
          <h2 style="color:#0f172a;font-size:20px;font-weight:800;margin:0 0 8px;text-align:center;">
            Alguém acabou de pesquisar um domínio!
          </h2>
          <p style="color:#64748b;font-size:14px;text-align:center;margin:0 0 24px;">
            Um visitante realizou uma consulta no verificador de domínios da plataforma.
          </p>

          <!-- Status Card -->
          <div style="background:${statusBg};border:2px solid ${statusBorder};border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <p style="font-size:12px;font-weight:700;color:${statusColor};text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">
              ${statusText}
            </p>
            <p style="font-family:monospace;font-size:26px;font-weight:900;color:#0f172a;margin:0 0 8px;letter-spacing:0.5px;">
              ${data.domain}
            </p>
            ${data.price ? `<p style="color:#059669;font-weight:700;font-size:15px;margin:0;">Preço Estimado: ${data.price.toLocaleString('pt-MZ')} MT/ano</p>` : ''}
          </div>

          <!-- Informações Detalhadas -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="color:#0f172a;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 14px;">
              📊 Detalhes da Consulta
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:8px 0;color:#64748b;font-weight:600;">Visitante:</td>
                <td style="padding:8px 0;color:#0f172a;text-align:right;font-weight:700;">
                  ${data.userEmail ? `${data.userName ? `${data.userName} (` : ''}${data.userEmail}${data.userName ? ')' : ''}` : '👤 Visitante Anónimo'}
                </td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:8px 0;color:#64748b;font-weight:600;">Endereço IP:</td>
                <td style="padding:8px 0;color:#0f172a;text-align:right;font-family:monospace;">${data.ip || 'Desconhecido'}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:8px 0;color:#64748b;font-weight:600;">Dispositivo:</td>
                <td style="padding:8px 0;color:#0f172a;text-align:right;">${userAgentShort}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:8px 0;color:#64748b;font-weight:600;">Total de Buscas deste Domínio:</td>
                <td style="padding:8px 0;color:#0f172a;text-align:right;font-weight:700;">
                  <span style="background:#e0e7ff;color:#3730a3;padding:2px 8px;border-radius:6px;">${data.searchCount}x</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;font-weight:600;">Data e Hora:</td>
                <td style="padding:8px 0;color:#0f172a;text-align:right;">${formattedDate}</td>
              </tr>
            </table>
          </div>

          <!-- Botão de Ação -->
          <div style="text-align:center;margin:32px 0 16px;">
            <a href="${adminUrl}" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;box-shadow:0 4px 14px rgba(37,99,235,0.35);">
              Abrir Painel de Pesquisas de Domínio →
            </a>
          </div>
        </div>

        <div style="background:#f8fafc;padding:20px 28px;text-align:center;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
          <p style="margin:0 0 4px;">WEHOSTHERE &mdash; Plataforma de Hospedagem Profissional em Moçambique</p>
          <p style="margin:0;">Notificação interna automática gerada pelo sistema de inteligência de domínios.</p>
        </div>
      </div>`,
  });
}

export interface DomainLeadAlertData {
  domain: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  checkoutStatus?: string;
  checkoutOrderId?: string;
  attemptedAt: Date;
}

/**
 * Notificação por e-mail para Administrador quando um cliente avança para checkout com um domínio (Lead Quente)
 */
export async function sendDomainLeadAlertEmail(toEmail: string, data: DomainLeadAlertData) {
  const adminUrl = `${SITE_URL}/admin/domain-search-logs?filter=checkout`;
  const formattedDate = new Intl.DateTimeFormat('pt-MZ', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Africa/Maputo'
  }).format(data.attemptedAt);

  // Formatação do telefone para WhatsApp (Moçambique +258)
  let whatsappUrl = '';
  if (data.userPhone) {
    const digits = data.userPhone.replace(/\D/g, '');
    const cleanPhone = digits.startsWith('258') ? digits : digits.length === 9 ? `258${digits}` : digits;
    const initialMsg = encodeURIComponent(
      `Olá ${data.userName || ''}! Notámos que iniciou o registo do domínio "${data.domain}" na WEHOSTHERE. Podemos ajudar a concluir a sua ativação?`
    );
    whatsappUrl = `https://wa.me/${cleanPhone}?text=${initialMsg}`;
  }

  const subject = `🔥 Lead Quente: Tentativa de Compra do Domínio "${data.domain}"`;

  return sendEmail({
    to: toEmail,
    subject,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:0 auto;color:#111;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
        <div style="background:linear-gradient(135deg,#7c2d12,#ea580c);padding:32px 28px;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:160px;height:auto;margin:0 auto 12px;display:block;" />
          <div style="display:inline-block;background:rgba(255,255,255,0.18);backdrop-filter:blur(8px);padding:6px 16px;border-radius:20px;margin-top:6px;">
            <span style="color:#ffffff;font-size:12px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;">🔥 NOVO LEAD QUENTE — TENTATIVA DE COMPRA</span>
          </div>
        </div>

        <div style="padding:32px 28px;background:#ffffff;">
          <h2 style="color:#0f172a;font-size:22px;font-weight:800;margin:0 0 8px;text-align:center;">
            Um cliente avançou para o checkout!
          </h2>
          <p style="color:#64748b;font-size:14px;text-align:center;margin:0 0 24px;">
            O cliente preencheu os dados de contacto e iniciou o processo de checkout para registar o domínio abaixo.
          </p>

          <!-- Card do Domínio -->
          <div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <p style="font-size:11px;font-weight:800;color:#c2410c;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">
              Domínio Solicitado
            </p>
            <p style="font-family:monospace;font-size:26px;font-weight:900;color:#0f172a;margin:0 0 6px;letter-spacing:0.5px;">
              ${data.domain}
            </p>
            ${data.checkoutOrderId ? `<p style="font-size:12px;color:#64748b;margin:0;">Ref. Pagamento: <strong style="color:#0f172a;">${data.checkoutOrderId}</strong></p>` : ''}
          </div>

          <!-- Informações de Contacto do Lead -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="color:#0f172a;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 14px;">
              👤 Dados de Contacto do Cliente
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 0;color:#64748b;font-weight:600;">Nome Completo:</td>
                <td style="padding:10px 0;color:#0f172a;text-align:right;font-weight:700;">
                  ${data.userName || '<span style="color:#94a3b8;font-weight:normal;">Não informado</span>'}
                </td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 0;color:#64748b;font-weight:600;">Telefone / Celular:</td>
                <td style="padding:10px 0;color:#0f172a;text-align:right;font-weight:700;">
                  ${data.userPhone ? `<a href="tel:${data.userPhone}" style="color:#2563eb;text-decoration:none;">${data.userPhone}</a>` : '<span style="color:#94a3b8;font-weight:normal;">Não informado</span>'}
                </td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 0;color:#64748b;font-weight:600;">E-mail:</td>
                <td style="padding:10px 0;color:#0f172a;text-align:right;font-weight:700;">
                  ${data.userEmail ? `<a href="mailto:${data.userEmail}" style="color:#2563eb;text-decoration:none;">${data.userEmail}</a>` : '<span style="color:#94a3b8;font-weight:normal;">Não informado</span>'}
                </td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px 0;color:#64748b;font-weight:600;">Status do Checkout:</td>
                <td style="padding:10px 0;color:#0f172a;text-align:right;">
                  <span style="background:#fef3c7;color:#92400e;font-weight:700;font-size:12px;padding:3px 10px;border-radius:6px;text-transform:uppercase;">
                    ${data.checkoutStatus || 'Pendente'}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#64748b;font-weight:600;">Data e Hora:</td>
                <td style="padding:10px 0;color:#0f172a;text-align:right;">${formattedDate}</td>
              </tr>
            </table>
          </div>

          <!-- Ações Rápidas de Fechamento -->
          <div style="margin:24px 0 16px;text-align:center;">
            ${whatsappUrl ? `
              <a href="${whatsappUrl}" target="_blank" style="background:#22c55e;color:#ffffff;font-weight:800;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;margin:6px 4px;box-shadow:0 4px 14px rgba(34,197,94,0.35);">
                💬 Falar com Cliente no WhatsApp →
              </a>
            ` : ''}
            <a href="${adminUrl}" style="background:#0f172a;color:#ffffff;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;margin:6px 4px;">
              Ver no Painel de Leads →
            </a>
          </div>
        </div>

        <div style="background:#f8fafc;padding:20px 28px;text-align:center;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
          <p style="margin:0 0 4px;">WEHOSTHERE &mdash; Gestão Inteligente de Vendas e Leads</p>
          <p style="margin:0;">Notificação gerada automaticamente para recuperação de carrinho e leads quentes.</p>
        </div>
      </div>
    `,
  });
}

export interface SiteQuoteAlertData {
  projectName: string;
  projectType: string;
  basePrice: number;
  domain?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  channel: 'whatsapp_quote' | 'checkout_started' | 'checkout_completed';
  createdAt: Date;
}

/**
 * Notificação por e-mail para Administrador quando um cliente solicita cotação ou inicia compra de desenvolvimento de site (Lead de Alto Valor)
 */
export async function sendSiteQuoteAlertEmail(toEmail: string, data: SiteQuoteAlertData) {
  const adminUrl = `${SITE_URL}/admin/site-quotes`;
  const formattedDate = new Intl.DateTimeFormat('pt-MZ', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Africa/Maputo',
  }).format(data.createdAt);

  const priceFormatted = data.basePrice >= 100000 ? 'Sob orçamento' : `${data.basePrice.toLocaleString('pt-MZ')} MT`;
  const channelLabel =
    data.channel === 'checkout_completed'
      ? '✅ Pagamento Confirmado no Checkout'
      : data.channel === 'checkout_started'
      ? '🛒 Iniciou Checkout de Criação de Site'
      : '💬 Solicitou Cotação pelo WhatsApp';

  let whatsappUrl = '';
  if (data.userPhone) {
    const digits = data.userPhone.replace(/\D/g, '');
    const cleanPhone = digits.startsWith('258') ? digits : digits.length === 9 ? `258${digits}` : digits;
    const initialMsg = encodeURIComponent(
      `Olá ${data.userName || ''}! Recebemos a sua solicitação de cotação para o projeto "${data.projectName}" na WEHOSTHERE. Podemos alinhar os detalhes e o cronograma do desenvolvimento?`
    );
    whatsappUrl = `https://wa.me/${cleanPhone}?text=${initialMsg}`;
  }

  const subject = `🚀 Novo Lead de Criação de Site: ${data.projectName} (${priceFormatted})`;

  return sendEmail({
    to: toEmail,
    subject,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:0 auto;color:#111;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
        <div style="background:linear-gradient(135deg,#1e1b4b,#4338ca);padding:32px 28px;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE Logo" style="width:160px;height:auto;margin:0 auto 12px;display:block;" />
          <div style="display:inline-block;background:rgba(255,255,255,0.18);backdrop-filter:blur(8px);padding:6px 16px;border-radius:20px;margin-top:6px;">
            <span style="color:#ffffff;font-size:12px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;">🚀 NOVO LEAD DE CRIAÇÃO DE SITE</span>
          </div>
        </div>

        <div style="padding:32px 28px;background:#ffffff;">
          <h2 style="color:#0f172a;font-size:22px;font-weight:800;margin:0 0 8px;text-align:center;">
            Interesse em Projeto de Alto Valor!
          </h2>
          <p style="color:#64748b;font-size:14px;text-align:center;margin:0 0 24px;">
            Um potencial cliente acabou de solicitar cotação ou avançar para contratação de desenvolvimento de website.
          </p>

          <!-- Card do Projeto -->
          <div style="background:#eef2ff;border:2px solid #c7d2fe;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <p style="font-size:11px;font-weight:800;color:#4338ca;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">
              Tipo de Projeto
            </p>
            <p style="font-size:24px;font-weight:900;color:#1e1b4b;margin:0 0 6px;">
              ${data.projectName}
            </p>
            <p style="font-size:18px;font-weight:800;color:#059669;margin:0 0 6px;">
              Investimento Estimado: ${priceFormatted}
            </p>
            ${data.domain ? `<p style="font-size:13px;color:#4f46e5;margin:0;font-family:monospace;font-weight:bold;">🌐 Domínio Atrelado: ${data.domain}</p>` : ''}
          </div>

          <!-- Informações de Contacto do Lead -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
            <h3 style="color:#334155;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 14px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">
              📋 Detalhes do Lead
            </h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:7px 0;color:#64748b;width:120px;">Cliente:</td>
                <td style="padding:7px 0;font-weight:700;color:#0f172a;">${data.userName || '<em style="color:#94a3b8;font-weight:normal;">Não informado (visitante anónimo)</em>'}</td>
              </tr>
              ${data.userEmail ? `
              <tr>
                <td style="padding:7px 0;color:#64748b;">E-mail:</td>
                <td style="padding:7px 0;font-weight:600;color:#2563eb;font-family:monospace;"><a href="mailto:${data.userEmail}" style="color:#2563eb;text-decoration:none;">${data.userEmail}</a></td>
              </tr>` : ''}
              ${data.userPhone ? `
              <tr>
                <td style="padding:7px 0;color:#64748b;">WhatsApp / Tel:</td>
                <td style="padding:7px 0;font-weight:700;color:#059669;font-family:monospace;"><a href="tel:${data.userPhone}" style="color:#059669;text-decoration:none;">${data.userPhone}</a></td>
              </tr>` : ''}
              <tr>
                <td style="padding:7px 0;color:#64748b;">Canal de Origem:</td>
                <td style="padding:7px 0;font-weight:700;color:#4338ca;">${channelLabel}</td>
              </tr>
              <tr>
                <td style="padding:7px 0;color:#64748b;">Data & Hora:</td>
                <td style="padding:7px 0;color:#64748b;font-size:12px;">${formattedDate}</td>
              </tr>
            </table>
          </div>

          <!-- Ações Rápidas -->
          <div style="margin:24px 0 16px;text-align:center;">
            ${whatsappUrl ? `
              <a href="${whatsappUrl}" target="_blank" style="background:#22c55e;color:#ffffff;font-weight:800;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;margin:6px 4px;box-shadow:0 4px 14px rgba(34,197,94,0.35);">
                💬 Falar com o Lead no WhatsApp →
              </a>
            ` : ''}
            <a href="${adminUrl}" style="background:#0f172a;color:#ffffff;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;margin:6px 4px;">
              Ver no Painel de Cotações →
            </a>
          </div>
        </div>

        <div style="background:#f8fafc;padding:20px 28px;text-align:center;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
          <p style="margin:0 0 4px;">WEHOSTHERE &mdash; Gestão Inteligente de Projetos e Vendas</p>
          <p style="margin:0;">Alerta gerado automaticamente ao cotar desenvolvimento de site.</p>
        </div>
      </div>
    `,
  });
}

export interface AnalyticsMilestoneEmailData {
  type: 'page_views' | 'unique_visitors';
  milestone: number;
  totalPageViews: number;
  totalUniqueVisitors: number;
  topPages?: Array<{ page: string; count: number }>;
}

/**
 * Envia um e-mail comemorativo automático ao Admin quando o site atinge um novo marco
 * de +100 visualizações ou +10 visitantes únicos.
 */
export async function sendAnalyticsMilestoneEmail(data: AnalyticsMilestoneEmailData) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'info@wehosthere.com';
  const adminUrl = `${SITE_URL}/admin`;

  const isViews = data.type === 'page_views';
  const formattedMilestone = new Intl.NumberFormat('pt-MZ').format(data.milestone);
  const formattedTotalViews = new Intl.NumberFormat('pt-MZ').format(data.totalPageViews);
  const formattedUniqueVisitors = new Intl.NumberFormat('pt-MZ').format(data.totalUniqueVisitors);

  const title = isViews
    ? `🎉 Marco de ${formattedMilestone} Visualizações Atingido!`
    : `🚀 Novo Marco: ${formattedMilestone} Visitantes Únicos!`;

  const subtitle = isViews
    ? `O seu site WEHOSTHERE acaba de ultrapassar a marca de <strong>${formattedMilestone} páginas vistas</strong> (+100 visualizações)!`
    : `O seu site acaba de receber a visita de <strong>${formattedMilestone} sessões/visitantes únicos</strong> (+10 novos visitantes)!`;

  const topPagesRows = (data.topPages || []).slice(0, 4).map((p, idx) => `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:8px 6px;color:#64748b;font-weight:700;width:28px;">#${idx + 1}</td>
      <td style="padding:8px 6px;color:#0f172a;font-family:monospace;font-size:13px;font-weight:600;">${p.page}</td>
      <td style="padding:8px 6px;color:#2563eb;text-align:right;font-weight:700;">${new Intl.NumberFormat('pt-MZ').format(p.count)} vistas</td>
    </tr>
  `).join('');

  return sendEmail({
    to: adminEmail,
    subject: isViews
      ? `📈 [Crescimento] Novo Marco: +100 Visualizações (${formattedMilestone} vistas no total)!`
      : `👥 [Audiência] Novo Marco: +10 Visitantes Únicos (${formattedMilestone} pessoas)!`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:0 auto;color:#0f172a;border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.08);border:1px solid #e2e8f0;background:#ffffff;">
        <!-- Cabeçalho -->
        <div style="background:linear-gradient(135deg, ${isViews ? '#2563eb, #1d4ed8, #0ea5e9' : '#059669, #10b981, #065f46'});padding:36px 30px;text-align:center;color:#ffffff;">
          <div style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.2);border-radius:999px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;backdrop-blur-sm:10px;">
            ${isViews ? '📊 Marco de Visualizações (+100)' : '👥 Marco de Audiência Única (+10)'}
          </div>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">
            ${title}
          </h1>
          <p style="margin:0;font-size:14px;color:${isViews ? '#bfdbfe' : '#a7f3d0'};line-height:1.5;">
            ${subtitle}
          </p>
        </div>

        <!-- Conteúdo Principal -->
        <div style="padding:32px 28px;">
          <!-- Cartão Central com o Grande Número -->
          <div style="background:linear-gradient(180deg,#f8fafc,#f1f5f9);border-radius:14px;padding:24px;text-align:center;border:1px solid #e2e8f0;margin-bottom:24px;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:700;margin-bottom:6px;">
              ${isViews ? 'Total de Páginas Vistas' : 'Total de Visitantes Únicos'}
            </div>
            <div style="font-size:46px;font-weight:900;color:${isViews ? '#1d4ed8' : '#059669'};line-height:1;margin-bottom:8px;letter-spacing:-1px;">
              ${formattedMilestone}
            </div>
            <div style="display:inline-block;background:${isViews ? '#dbeafe' : '#d1fae5'};color:${isViews ? '#1e40af' : '#065f46'};font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;">
              ${isViews ? '🔥 +100 páginas vistas acumuladas' : '🎯 +10 novos utilizadores distintos'}
            </div>
          </div>

          <!-- Grade de Comparação -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr>
              <td style="width:50%;padding:14px;background:#f8fafc;border-radius:12px 0 0 12px;border:1px solid #e2e8f0;border-right:none;text-align:center;">
                <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;">Visualizações Totais</div>
                <div style="font-size:22px;font-weight:800;color:#0f172a;margin-top:4px;">${formattedTotalViews}</div>
              </td>
              <td style="width:50%;padding:14px;background:#f8fafc;border-radius:0 12px 12px 0;border:1px solid #e2e8f0;text-align:center;">
                <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;">Visitantes Únicos</div>
                <div style="font-size:22px;font-weight:800;color:#059669;margin-top:4px;">${formattedUniqueVisitors}</div>
              </td>
            </tr>
          </table>

          ${topPagesRows ? `
            <!-- Top Páginas Acedidas -->
            <div style="margin-bottom:28px;">
              <h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;">
                🔥 Páginas Mais Acedidas
              </h3>
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                ${topPagesRows}
              </table>
            </div>
          ` : ''}

          <!-- Ação do Admin -->
          <div style="text-align:center;padding:12px 0 8px;">
            <a href="${adminUrl}" style="background:#0f172a;color:#ffffff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:14px;display:inline-block;box-shadow:0 4px 14px rgba(15,23,42,0.25);">
              📊 Abrir Painel de Visitantes em Tempo Real →
            </a>
          </div>
        </div>

        <!-- Rodapé -->
        <div style="background:#f8fafc;padding:20px 28px;text-align:center;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
          <p style="margin:0 0 4px;">WEHOSTHERE &mdash; Monitoramento Inteligente de Tráfego & Audiência</p>
          <p style="margin:0;">Notificação gerada automaticamente a cada marco de +100 visualizações e +10 visitantes únicos.</p>
        </div>
      </div>
    `,
  });
}

// ——————————————————————————————————————
// Revista "Codando Histórias" — Story Broadcast
// ——————————————————————————————————————

export interface StoryBroadcastOptions {
  toEmail: string;
  recipientName?: string;
  storyTitle: string;
  storySlug: string;
  storyExcerpt: string;
  authorName: string;
  coverImageUrl?: string;
  /** Category label e.g. "Empreendedorismo" */
  category?: string;
  /** Reading time e.g. "5 min" */
  readTime?: string;
  /** Unsubscribe link (required for newsletter subscribers) */
  unsubscribeUrl?: string;
}

/**
 * Envia o e-mail de nova história publicada na Revista "Codando Histórias"
 * para utilizadores da plataforma e subscritores da newsletter.
 */
export async function sendStoryBroadcastEmail(opts: StoryBroadcastOptions): Promise<{ success: boolean; error?: string }> {
  const storyUrl = `${SITE_URL}/revista/${opts.storySlug}`;
  const recipientLabel = opts.recipientName?.trim() || 'Leitor(a)';
  const categoryTag = opts.category ? opts.category.toUpperCase() : 'CODANDO HISTÓRIAS';
  const readTimeLabel = opts.readTime ? `${opts.readTime} de leitura` : '';

  const coverBlock = opts.coverImageUrl
    ? `<img src="${opts.coverImageUrl}" alt="${opts.storyTitle}" style="width:100%;height:220px;object-fit:cover;display:block;border-radius:12px 12px 0 0;" />`
    : `<div style="width:100%;height:180px;background:linear-gradient(135deg,#0f172a,#1e3a8a,#312e81);border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:48px;">📖</span>
       </div>`;

  const unsubscribeBlock = opts.unsubscribeUrl
    ? `<p style="color:#94a3b8;font-size:11px;margin:12px 0 0;text-align:center;">
        Recebe este email porque subscreveu à newsletter ou criou uma conta na WEHOSTHERE.&nbsp;
        <a href="${opts.unsubscribeUrl}" style="color:#64748b;text-decoration:underline;">Cancelar subscrição</a>
       </p>`
    : '';

  return sendEmail({
    to: opts.toEmail,
    subject: `📖 Nova história: ${opts.storyTitle} | Codando Histórias`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;background:#ffffff;">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#312e81 100%);padding:28px 32px 20px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE" style="width:140px;height:auto;margin:0 auto 14px;display:block;" />
          <div style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);padding:5px 14px;border-radius:20px;">
            <span style="color:#a5b4fc;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Codando Histórias · Nova Publicação</span>
          </div>
        </div>

        <!-- Cover / story card -->
        <div style="background:#f8fafc;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:24px 28px;">

          <!-- Category + read time pill -->
          <div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap;">
            <span style="background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;padding:4px 12px;border-radius:20px;">${categoryTag}</span>
            ${readTimeLabel ? `<span style="background:#f1f5f9;color:#64748b;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;">⏱ ${readTimeLabel}</span>` : ''}
          </div>

          <!-- Cover image (if available) -->
          <div style="border-radius:12px;overflow:hidden;margin-bottom:20px;">${coverBlock}</div>

          <!-- Greeting -->
          <p style="color:#475569;font-size:14px;margin:0 0 8px;">Olá, <strong>${recipientLabel}</strong>!</p>
          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
            Uma nova história foi publicada na <strong>Revista Codando Histórias</strong> — leituras sobre tech, empreendedorismo e inovação em Moçambique.
          </p>

          <!-- Story card -->
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <div style="padding:24px 22px;">
              <h2 style="color:#0f172a;font-size:20px;font-weight:800;margin:0 0 10px;line-height:1.3;">${opts.storyTitle}</h2>
              <p style="color:#64748b;font-size:13px;margin:0 0 6px;">✍️ Por <strong style="color:#334155;">${opts.authorName}</strong></p>
              <p style="color:#475569;font-size:14px;line-height:1.7;margin:14px 0 20px;">${opts.storyExcerpt.length > 220 ? opts.storyExcerpt.slice(0, 220) + '…' : opts.storyExcerpt}</p>
              <div style="text-align:center;">
                <a href="${storyUrl}" style="background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#ffffff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;display:inline-block;box-shadow:0 4px 12px rgba(29,78,216,0.3);">
                  Ler história completa →
                </a>
              </div>
            </div>
          </div>

          <!-- CTA secondary -->
          <div style="text-align:center;margin-bottom:8px;">
            <a href="${SITE_URL}/revista" style="color:#4f46e5;font-size:13px;font-weight:600;text-decoration:none;">
              📚 Ver todas as histórias na revista
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f1f5f9;padding:18px 28px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;text-align:center;">
          <p style="color:#64748b;font-size:12px;margin:0 0 4px;">
            WEHOSTHERE · Plataforma de Hospedagem Profissional em Moçambique
          </p>
          ${unsubscribeBlock}
        </div>

      </div>`,
  });
}

// ——————————————————————————————————————
// Felicitações de Aniversário (Birthday Greetings)
// ——————————————————————————————————————

export interface BirthdayEmailOptions {
  toEmail: string;
  userName: string;
  customMessage?: string;
  specialGiftText?: string;
}

/**
 * Envia o e-mail de felicitações de aniversário personalizado
 * com a imagem comemorativa oficial da WEHOSTHERE.
 */
export async function sendBirthdayEmail(opts: BirthdayEmailOptions): Promise<{ success: boolean; error?: string }> {
  const firstName = (opts.userName || 'Cliente').trim().split(' ')[0] || 'Cliente';
  const fullName = (opts.userName || 'Cliente').trim();
  const dashboardUrl = `${SITE_URL}/dashboard`;
  // Imagem oficial de felicitações localizada em public/wehosthere-aniversario.png
  const birthdayImageUrl = `${SITE_URL}/wehosthere-aniversario.png`;

  return sendEmail({
    to: opts.toEmail,
    subject: `🎂 Parabéns pelo seu Aniversário, ${firstName}! 🎉 | WEHOSTHERE`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:0 auto;color:#1e293b;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 8px 30px rgba(0,0,0,0.08);">

        <!-- Header Festivo com Gradiente Dourado / Roxo / Azul -->
        <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#d97706 100%);padding:36px 28px 28px;text-align:center;">
          <img src="${SITE_URL}/logo.png" alt="WEHOSTHERE" style="width:145px;height:auto;margin:0 auto 16px;display:block;" />
          <div style="display:inline-block;background:rgba(255,255,255,0.18);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.3);padding:6px 18px;border-radius:30px;">
            <span style="color:#ffffff;font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">🎂 DIA ESPECIAL · FELIZ ANIVERSÁRIO! 🎈</span>
          </div>
        </div>

        <!-- Corpo Principal -->
        <div style="padding:32px 28px;background:#ffffff;">

          <h1 style="color:#0f172a;font-size:24px;font-weight:900;margin:0 0 12px;text-align:center;line-height:1.3;">
            Parabéns, ${fullName}! 🥂🎉
          </h1>

          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;text-align:center;">
            Hoje é o seu dia! Em nome de toda a equipa e da família <strong>WEHOSTHERE</strong>, queremos desejar-lhe um <strong>Feliz Aniversário</strong> repleto de saúde, alegria, grandes realizações e muito sucesso em todos os seus projetos digitais e pessoais.
          </p>

          <!-- Imagem Oficial de Felicitações (Wehosthere Felicitacoes de Aniversário.png) -->
          <div style="text-align:center;margin:24px 0 28px;border-radius:16px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,0.1);border:1px solid #e2e8f0;">
            <img 
              src="${birthdayImageUrl}" 
              alt="Wehosthere Felicitações de Aniversário" 
              style="width:100%;max-width:564px;height:auto;display:block;margin:0 auto;" 
            />
          </div>

          <!-- Mensagem Personalizada / Destaque -->
          <div style="background:linear-gradient(135deg,#fdf4ff 0%,#f5f3ff 100%);border:1px solid #e9d5ff;border-radius:14px;padding:20px 22px;margin-bottom:28px;">
            <p style="margin:0 0 8px;font-weight:800;color:#6b21a8;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">
              🎁 Uma mensagem especial para si:
            </p>
            <p style="margin:0;color:#475569;font-size:14px;line-height:1.7;">
              ${opts.customMessage || 'É uma honra e um privilégio tê-lo(a) connosco na nossa plataforma. Que este novo ano de vida traga horizontes ainda maiores, prosperidade e novos marcos conquistados! Conte sempre connosco para apoiar a sua jornada.'}
            </p>
          </div>

          <!-- Botão de Ação -->
          <div style="text-align:center;margin:32px 0 16px;">
            <a 
              href="${dashboardUrl}" 
              style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;font-weight:800;font-size:15px;padding:15px 38px;border-radius:12px;text-decoration:none;display:inline-block;box-shadow:0 6px 18px rgba(124,58,237,0.35);"
            >
              Aceder ao meu Painel WEHOSTHERE →
            </a>
          </div>

        </div>

        <!-- Rodapé Corporativo -->
        <div style="background:#f8fafc;padding:22px 28px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="color:#0f172a;font-weight:700;font-size:13px;margin:0 0 4px;">
            Equipa WEHOSTHERE &mdash; Moçambique
          </p>
          <p style="color:#94a3b8;font-size:12px;margin:0 0 12px;">
            A apoiar a sua presença digital e os seus projetos todos os dias do ano.
          </p>
          <p style="color:#cbd5e1;font-size:11px;margin:0;">
            info@wehosthere.com &bull; +258 84 833 5618 &bull; www.wehosthere.com
          </p>
        </div>

      </div>`,
  });
}

// ——————————————————————————————————————
// Revista "Codando Histórias" — Submissões da Comunidade
// ——————————————————————————————————————

export interface StorySubmissionNotificationOpts {
  toEmail: string;
  authorName: string;
  storyTitle: string;
  category: string;
  storySlug: string;
}

/**
 * Envia e-mail de confirmação ao autor que submeteu uma história para a revista.
 */
export async function sendStorySubmissionReceivedEmail(opts: StorySubmissionNotificationOpts): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: opts.toEmail,
    subject: `📝 Recebemos a tua história: "${opts.storyTitle}" | Revista Codando Histórias`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#5A189A 0%,#7B2CBF 100%);padding:28px 32px;text-align:center;">
          <h2 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.02em;">Codando Histórias</h2>
          <p style="color:#E0AAFF;margin:6px 0 0;font-size:13px;font-weight:600;">Revista Digital WEHOSTHERE</p>
        </div>
        <div style="padding:32px 28px;">
          <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
            Olá, <strong>${opts.authorName}</strong>! 👋
          </p>
          <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 20px;">
            A tua história <strong>"${opts.storyTitle}"</strong> foi submetida com sucesso para análise editorial da nossa equipa.
          </p>
          <div style="background:#FAF5FF;border:1px solid #E0AAFF;border-radius:12px;padding:18px;margin-bottom:24px;">
            <p style="font-size:13px;color:#5A189A;font-weight:700;margin:0 0 6px;">O que acontece a seguir?</p>
            <ul style="margin:0;padding-left:18px;font-size:13px;color:#475569;line-height:1.6;">
              <li>A nossa equipa editorial irá rever a formatação e conteúdo.</li>
              <li>Podemos fazer pequenos ajustes de revisão ortográfica para manter o padrão da revista.</li>
              <li>Assim que for aprovada e publicada, receberás um e-mail com o link ao vivo para partilhares com a comunidade.</li>
            </ul>
          </div>
          <p style="font-size:13px;color:#64748b;margin:0;">
            Obrigado por enriqueceres o ecossistema tech de Moçambique com a tua jornada!
          </p>
        </div>
        <div style="background:#f8fafc;padding:18px 28px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            WEHOSTHERE &bull; Codando Histórias &bull; <a href="${SITE_URL}/revista" style="color:#7B2CBF;text-decoration:none;font-weight:600;">wehosthere.com/revista</a>
          </p>
        </div>
      </div>`,
  });
}

/**
 * Alerta o Administrador da WEHOSTHERE sobre uma nova submissão da comunidade.
 */
export async function sendAdminNewSubmissionEmail(opts: {
  authorName: string;
  authorEmail: string;
  storyTitle: string;
  category: string;
  storyId: string;
}): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'info@wehosthere.com';
  const adminReviewUrl = `${SITE_URL}/admin/revista/editar/${opts.storyId}`;

  return sendEmail({
    to: adminEmail,
    subject: `🔔 [Revista] Nova história submetida: "${opts.storyTitle}" por ${opts.authorName}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="background:#0f172a;padding:24px 32px;text-align:center;">
          <h2 style="color:#ffffff;margin:0;font-size:20px;">Nova Submissão na Revista</h2>
          <p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">Codando Histórias &bull; Painel de Moderação</p>
        </div>
        <div style="padding:28px;">
          <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 16px;">
            Um novo artigo foi submetido pela comunidade e aguarda aprovação:
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:14px;"><strong>Título:</strong> ${opts.storyTitle}</p>
            <p style="margin:0 0 8px;font-size:13px;"><strong>Autor:</strong> ${opts.authorName} (${opts.authorEmail})</p>
            <p style="margin:0;font-size:13px;"><strong>Categoria:</strong> ${opts.category}</p>
          </div>
          <div style="text-align:center;">
            <a href="${adminReviewUrl}" style="background:#7B2CBF;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
              Rever & Aprovar no Painel →
            </a>
          </div>
        </div>
      </div>`,
  });
}

/**
 * Envia e-mail de parabéns ao autor quando a sua história é APROVADA e PUBLICADA.
 */
export async function sendStoryApprovedEmail(opts: {
  toEmail: string;
  authorName: string;
  storyTitle: string;
  storySlug: string;
}): Promise<{ success: boolean; error?: string }> {
  const storyUrl = `${SITE_URL}/revista/${opts.storySlug}`;

  return sendEmail({
    to: opts.toEmail,
    subject: `🎉 Parabéns! A tua história foi publicada: "${opts.storyTitle}" | Codando Histórias`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:28px 32px;text-align:center;">
          <span style="font-size:36px;">🎉</span>
          <h2 style="color:#ffffff;margin:8px 0 0;font-size:22px;font-weight:800;">A tua história está no ar!</h2>
          <p style="color:#d1fae5;margin:4px 0 0;font-size:13px;">Revista Codando Histórias &bull; WEHOSTHERE</p>
        </div>
        <div style="padding:32px 28px;text-align:center;">
          <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
            Olá, <strong>${opts.authorName}</strong>! Temos excelentes notícias.
          </p>
          <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 24px;">
            A tua história <strong>"${opts.storyTitle}"</strong> foi aprovada pela equipa editorial e já está publicada e visível para toda a comunidade.
          </p>
          <div style="margin-bottom:28px;">
            <a href="${storyUrl}" style="background:#7B2CBF;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;display:inline-block;box-shadow:0 4px 12px rgba(123,44,191,0.25);">
              Ver a minha história ao vivo →
            </a>
          </div>
          <p style="font-size:13px;color:#64748b;margin:0;">
            Partilha com os teus colegas, no LinkedIn, Twitter ou grupos de desenvolvedores!
          </p>
        </div>
      </div>`,
  });
}

/**
 * Envia e-mail de convite VIP da equipa editorial para um criador/desenvolvedor contar a sua história.
 */
export async function sendRevistaInviteEmail(opts: {
  toEmail: string;
  inviteeName: string;
  proposedTopic?: string;
  customNote?: string;
  category?: string;
}): Promise<{ success: boolean; error?: string }> {
  const queryParams = new URLSearchParams({
    name: opts.inviteeName,
    email: opts.toEmail,
  });
  if (opts.proposedTopic) queryParams.set('topic', opts.proposedTopic);
  if (opts.category) queryParams.set('category', opts.category);

  const inviteUrl = `${SITE_URL}/revista/submeter?${queryParams.toString()}`;

  return sendEmail({
    to: opts.toEmail,
    subject: `🎙️ Convite Editorial: Partilha a tua jornada na Revista "Codando Histórias" | WEHOSTHERE`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;background:#ffffff;border:1px solid #E0AAFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(123,44,191,0.08);">
        <div style="background:linear-gradient(135deg,#7B2CBF 0%,#5A189A 100%);padding:36px 32px;text-align:center;">
          <div style="display:inline-block;background:rgba(255,255,255,0.15);padding:6px 14px;border-radius:9999px;color:#FAF5FF;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:12px;">
            ✨ Convite Especial da Redacção
          </div>
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;line-height:1.3;">
            Queremos destacar a tua história na Codando Histórias
          </h1>
          <p style="color:#FAF5FF;margin:8px 0 0;font-size:13px;">Revista Digital WEHOSTHERE &bull; Moçambique</p>
        </div>

        <div style="padding:32px 28px;">
          <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
            Olá, <strong>${opts.inviteeName}</strong>! 👋
          </p>
          <p style="font-size:14px;color:#334155;line-height:1.7;margin:0 0 18px;">
            A nossa equipa editorial tem acompanhado a tua trajectória e gostaríamos muito de te convidar a publicar uma história ou relato de experiência na <strong>Codando Histórias</strong>.
          </p>

          ${opts.proposedTopic ? `
          <div style="background:#FAF5FF;border-left:4px solid #7B2CBF;border-radius:0 10px 10px 0;padding:14px 18px;margin:20px 0;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:800;color:#7B2CBF;text-transform:uppercase;letter-spacing:0.05em;">
              💡 Pauta / Tema Sugerido pela Redacção:
            </p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">
              "${opts.proposedTopic}"
            </p>
          </div>` : ''}

          ${opts.customNote ? `
          <div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;padding:14px 18px;margin:18px 0;font-size:13px;color:#475569;line-height:1.6;">
            <strong>Mensagem do Editor:</strong><br>
            "${opts.customNote.replace(/\n/g, '<br>')}"
          </div>` : ''}

          <p style="font-size:14px;color:#334155;line-height:1.7;margin:0 0 24px;">
            Criámos um formulário simples com <strong>Copiloto IA integrado</strong> para te ajudar a estruturar e polir os parágrafos em minutos, sem perderes tempo com formatação técnica.
          </p>

          <div style="text-align:center;margin:30px 0;">
            <a href="${inviteUrl}" style="background:linear-gradient(135deg,#7B2CBF 0%,#5A189A 100%);color:#ffffff;font-weight:700;font-size:15px;padding:15px 36px;border-radius:12px;text-decoration:none;display:inline-block;box-shadow:0 4px 16px rgba(123,44,191,0.35);">
              Abrir Formulário Pré-Preenchido →
            </a>
            <p style="font-size:11px;color:#94a3b8;margin:8px 0 0;">O teu nome e e-mail já serão preenchidos automaticamente.</p>
          </div>

          <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;">

          <p style="font-size:12px;color:#64748b;line-height:1.6;margin:0;">
            Tens alguma dúvida ou preferes uma conversa prévia? Responde directamente a este e-mail.<br>
            <strong>Equipa Editorial &bull; WEHOSTHERE Codando Histórias</strong>
          </p>
        </div>
      </div>`,
  });
}


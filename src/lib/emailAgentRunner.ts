import { connectDB } from '@/lib/mongodb';
import { decryptPassword } from '@/lib/encryption';
import { generateSmartReply } from '@/lib/emailAssistantCore';
import { IncomingAgentMessage, migaduImapSmtp } from '@/lib/migaduImapSmtp';
import { sendEmail as sendViaResend } from '@/lib/sendgrid';
import {
  EmailAgentConfig,
  EmailAgentConfigDocument,
  EmailAgentLog,
} from '@/models/EmailAgentConfig';
import { sendPushToAdmins } from '@/lib/pushService';

export interface AgentActiveEvaluation {
  active: boolean;
  mode: 'manual' | 'scheduled' | 'off';
  reason: string;
}

function getMaputoDayAndMinutes(now: Date = new Date()): { dayOfWeek: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Maputo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
  const hourStr = parts.find((p) => p.type === 'hour')?.value || '00';
  const minStr = parts.find((p) => p.type === 'minute')?.value || '00';

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const hour = Number(hourStr) % 24;
  const min = Number(minStr) % 60;
  return {
    dayOfWeek: dayMap[weekdayStr] ?? now.getUTCDay(),
    minutes: hour * 60 + min,
  };
}

function parseHHMMToMinutes(hhmm: string, fallback: number): number {
  const match = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  const h = Math.min(23, Math.max(0, Number(match[1])));
  const m = Math.min(59, Math.max(0, Number(match[2])));
  return h * 60 + m;
}

export function evaluateAgentActiveStatus(
  config: Pick<EmailAgentConfigDocument, 'enabled' | 'scheduleEnabled' | 'scheduleDays' | 'scheduleStartHour' | 'scheduleEndHour'>,
  now: Date = new Date()
): AgentActiveEvaluation {
  if (config.enabled) {
    return { active: true, mode: 'manual', reason: 'Modo manual ligado' };
  }

  if (config.scheduleEnabled) {
    const { dayOfWeek, minutes } = getMaputoDayAndMinutes(now);
    const days = Array.isArray(config.scheduleDays) ? config.scheduleDays : [];
    const startMin = parseHHMMToMinutes(config.scheduleStartHour, 0);
    const endMin = parseHHMMToMinutes(config.scheduleEndHour, 23 * 60 + 59);

    let inWindow = false;
    if (startMin <= endMin) {
      inWindow = days.includes(dayOfWeek) && minutes >= startMin && minutes <= endMin;
    } else {
      const prevDay = (dayOfWeek + 6) % 7;
      inWindow =
        (days.includes(dayOfWeek) && minutes >= startMin) ||
        (days.includes(prevDay) && minutes <= endMin);
    }

    if (inWindow) {
      return { active: true, mode: 'scheduled', reason: 'Dentro do horário agendado' };
    }

    return { active: false, mode: 'off', reason: 'Agendado (fora do horário definido)' };
  }

  return { active: false, mode: 'off', reason: 'Desligado' };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function evaluateShouldSkipEmail(msg: IncomingAgentMessage, agentEmail: string): string | null {
  const targetEmail = (msg.replyTo || msg.from.address || '').toLowerCase().trim();
  const rawSender = (msg.from.address || '').toLowerCase().trim();

  if (!targetEmail || !targetEmail.includes('@')) {
    return 'Remetente inválido';
  }
  if (targetEmail === agentEmail || rawSender === agentEmail) {
    return 'E-mail próprio ignorado';
  }

  // Ignorar contas internas/sistema do mesmo domínio para nunca responder a si ou alertas internos
  const internalSystemAddresses = [
    'noreply@wehosthere.com',
    'no-reply@wehosthere.com',
    'admin@wehosthere.com',
    'postmaster@wehosthere.com',
    'suporte@wehosthere.com',
    'donotreply@wehosthere.com',
    'mailer-daemon@wehosthere.com',
  ];
  if (internalSystemAddresses.includes(rawSender) || internalSystemAddresses.includes(targetEmail)) {
    return 'Remetente interno/sistema WEHOSTHERE ignorado';
  }

  const automatedSenderPattern = /^(no-?reply|do-?not-?reply|noreply|mailer-daemon|postmaster|bounces?|notifications?|alerts?|updates?|newsletters?|marketing|robot|automated|system|daemon)@/i;
  if (automatedSenderPattern.test(rawSender) || automatedSenderPattern.test(targetEmail)) {
    return 'Endereço automático / no-reply ignorado';
  }

  const autoSubmitted = (msg.headers.autoSubmitted || '').trim().toLowerCase();
  if (autoSubmitted && autoSubmitted !== 'no') {
    return `Cabeçalho Auto-Submitted (${autoSubmitted}) ignorado`;
  }

  const precedence = (msg.headers.precedence || '').trim().toLowerCase();
  if (['bulk', 'junk', 'list', 'auto_reply'].includes(precedence)) {
    return `Cabeçalho Precedence (${precedence}) ignorado`;
  }

  if (msg.headers.listUnsubscribe) {
    return 'Newsletter / lista de distribuição ignorada';
  }

  if (msg.headers.xAutoResponseSuppress) {
    return 'Cabeçalho X-Auto-Response-Suppress ignorado';
  }

  const subj = (msg.subject || '').trim();
  const autoSubjectPattern = /^(automatic reply|auto[- ]?reply|out of office|resposta autom[aá]tica|undelivered mail|mail delivery|delivery status notification|\[auto\])/i;
  if (autoSubjectPattern.test(subj)) {
    return 'Assunto de auto-resposta/bounce ignorado';
  }

  const internalNotificationSubjectPattern = /^(🛒\s*Novo Pedido|💰\s*Novo Pagamento|⚠️\s*Pagamento Falhou|🔍\s*Pesquisa de Dom[ií]nio|🌐\s*Novo Lead|📊\s*Relat[óo]rio Semanal|⭐\s*Novo Feedback|🎉\s*Marco de|🚀\s*Novo Marco|🔔\s*\[Revista\]|📦\s*Novo Pedido|📬\s*Novo Pedido)/i;
  if (internalNotificationSubjectPattern.test(subj)) {
    return 'Notificação interna da plataforma ignorada';
  }

  const bodySample = `${msg.text || ''}`.slice(0, 2000);
  if (
    bodySample.includes('Assistente Automático WEHOSTHERE') ||
    bodySample.includes('WEHOSTHERE AI Assistant')
  ) {
    return 'Resposta de agente automático ignorada';
  }

  return null;
}

export interface RunAgentResult {
  email: string;
  checkedCount: number;
  repliedCount: number;
  skippedCount: number;
  errorCount: number;
  summary: string;
}

export async function runEmailAgentForMailbox(
  config: EmailAgentConfigDocument,
  options?: { explicitPassword?: string; forceRun?: boolean }
): Promise<RunAgentResult> {
  await connectDB();

  const agentEmail = config.email.toLowerCase().trim();
  const password = options?.explicitPassword?.trim() || (config.encryptedPassword ? decryptPassword(config.encryptedPassword) : '');

  if (!password) {
    const summary = 'Senha IMAP não configurada na conta do agente.';
    await EmailAgentConfig.updateOne(
      { _id: config._id },
      { lastRunAt: new Date(), lastRunStatus: 'error', lastRunSummary: summary }
    );
    return { email: agentEmail, checkedCount: 0, repliedCount: 0, skippedCount: 0, errorCount: 1, summary };
  }

  let unreadMessages: IncomingAgentMessage[] = [];
  try {
    unreadMessages = await migaduImapSmtp.listRecentUnreadForAgent(
      agentEmail,
      password,
      config.maxAgeHours || 24,
      20
    );
  } catch (imapErr: any) {
    const summary = `Falha ao ler caixa IMAP: ${imapErr?.message || 'Erro de ligação'}`;
    await EmailAgentConfig.updateOne(
      { _id: config._id },
      { lastRunAt: new Date(), lastRunStatus: 'error', lastRunSummary: summary }
    );
    return { email: agentEmail, checkedCount: 0, repliedCount: 0, skippedCount: 0, errorCount: 1, summary };
  }

  let repliedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const msg of unreadMessages) {
    const replyTarget = (msg.replyTo || msg.from.address || '').toLowerCase().trim();
    const messageId = msg.messageId || `uid:${msg.uid}`;

    const alreadyHandled = await EmailAgentLog.exists({
      agentEmail,
      incomingMessageId: messageId,
    });
    if (alreadyHandled) {
      continue;
    }

    const skipReason = evaluateShouldSkipEmail(msg, agentEmail);
    if (skipReason) {
      try {
        await EmailAgentLog.create({
          agentEmail,
          incomingMessageId: messageId,
          incomingUid: msg.uid,
          fromEmail: replyTarget || 'desconhecido@invalido',
          fromName: msg.from.name || '',
          subject: msg.subject || '(Sem assunto)',
          status: 'skipped',
          reason: skipReason,
        });
      } catch {}
      skippedCount++;
      continue;
    }

    // Verificar se é uma resposta numa conversa ativa (thread Reply)
    // Se o assunto começa com Re: e o cliente está a continuar a conversa,
    // o cooldown não deve bloquear — permitir resposta imediata ao thread.
    const isThreadReply = /^re:/i.test(msg.subject || '') || (msg.references && msg.references.length > 0);

    if (!isThreadReply) {
      // Cooldown apenas se NÃO for uma resposta a um thread existente
      const cooldownHours = Math.max(1, Number(config.cooldownHours || 12));
      const cooldownCutoff = new Date(Date.now() - cooldownHours * 3600 * 1000);
      const recentReplyToSameSender = await EmailAgentLog.exists({
        agentEmail,
        fromEmail: replyTarget,
        status: 'replied',
        createdAt: { $gte: cooldownCutoff },
      });

      if (recentReplyToSameSender) {
        try {
          await EmailAgentLog.create({
            agentEmail,
            incomingMessageId: messageId,
            incomingUid: msg.uid,
            fromEmail: replyTarget,
            fromName: msg.from.name || '',
            subject: msg.subject || '(Sem assunto)',
            status: 'skipped',
            reason: `Cooldown ativo (${cooldownHours}h) para ${replyTarget}`,
          });
        } catch {}
        skippedCount++;
        continue;
      }
    }

    try {
      const senderDisplayName =
        agentEmail === 'info@wehosthere.com'
          ? 'Afonso Domingos (WEHOSTHERE)'
          : `Equipa WEHOSTHERE (${agentEmail})`;

      // Para respostas de thread, indicar no prompt que é uma continuação de conversa
      const isThreadReply = /^re:/i.test(msg.subject || '') || (msg.references && msg.references.length > 0);
      const threadInstruction = isThreadReply
        ? 'Esta é uma RESPOSTA a uma conversa já em curso. O histórico da conversa está incluído no corpo do e-mail (linhas com ">" ou "----"). Leia o contexto completo da conversa e responda de forma coerente e natural à mensagem mais recente do cliente, como se fosse a continuação natural da conversa anterior.'
        : '';

      const generated = await generateSmartReply({
        content: msg.html || msg.text || msg.subject,
        subject: msg.subject,
        from: replyTarget,
        fromName: msg.from.name,
        senderName: senderDisplayName,
        tone: config.replyTone || 'professional',
        prompt: [config.customInstructions || '', threadInstruction].filter(Boolean).join('\n'),
        isAutomatedAgent: true,
      });

      const replySubject = /^re:/i.test(msg.subject || '')
        ? msg.subject
        : `Re: ${msg.subject || 'O seu contacto WEHOSTHERE'}`;

      const rawReplyText = generated.result.trim();
      const hasSignatureAlready = /Afonso Domingos/i.test(rawReplyText);
      const corporateSignatureText = hasSignatureAlready
        ? ''
        : `\n\n--\nAfonso Domingos\nWEHOSTHERE — Hospedagem & Soluções Web\nWhatsApp / Tel: +258 84 833 5618\nEmail: ${agentEmail} | Web: https://www.wehosthere.com`;

      const replyText = `${rawReplyText}${corporateSignatureText}`;

      const corporateSignatureHtml = `
<div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;font-family:'Segoe UI',Arial,sans-serif;color:#334155;font-size:13px;line-height:1.6;">
  <div style="font-size:14px;font-weight:700;color:#0f172a;">Afonso Domingos</div>
  <div style="color:#2563eb;font-weight:600;font-size:12px;margin-bottom:6px;">WEHOSTHERE — Hospedagem &amp; Soluções Web</div>
  <div style="color:#475569;font-size:12px;">📱 WhatsApp / Tel: <strong>+258 84 833 5618</strong></div>
  <div style="color:#475569;font-size:12px;">📧 Email: <a href="mailto:${agentEmail}" style="color:#2563eb;text-decoration:none;">${agentEmail}</a></div>
  <div style="color:#475569;font-size:12px;">🌐 Website: <a href="https://www.wehosthere.com" style="color:#2563eb;text-decoration:none;">www.wehosthere.com</a></div>
</div>`;

      const replyHtml = `<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;white-space:normal;">${escapeHtml(rawReplyText).replace(/\n/g, '<br/>')}${corporateSignatureHtml}</div>`;

      const referencesHeader = Array.from(
        new Set([...(msg.references || []), messageId].filter(Boolean))
      ).join(' ');

      const fromDisplayName =
        agentEmail === 'info@wehosthere.com'
          ? 'Afonso Domingos | WEHOSTHERE'
          : 'WEHOSTHERE Suporte';

      let sendChannel = 'resend';
      const resendRes = await sendViaResend({
        to: replyTarget,
        fromEmail: agentEmail,
        fromName: fromDisplayName,
        replyTo: agentEmail,
        subject: replySubject,
        text: replyText,
        html: replyHtml,
        headers: {
          ...(messageId && !messageId.startsWith('uid:') ? { 'In-Reply-To': messageId } : {}),
          ...(referencesHeader && !referencesHeader.startsWith('uid:') ? { References: referencesHeader } : {}),
          'Auto-Submitted': 'auto-replied',
          'X-Auto-Response-Suppress': 'All',
        },
      });

      if (resendRes.success) {
        if (config.saveCopyToSent !== false) {
          await migaduImapSmtp.appendSentMessage(
            {
              from: agentEmail,
              to: [replyTarget],
              subject: replySubject,
              text: replyText,
              html: replyHtml,
              inReplyTo: messageId && !messageId.startsWith('uid:') ? messageId : undefined,
              references: msg.references,
            },
            password
          );
        }
      } else {
        sendChannel = 'smtp';
        await migaduImapSmtp.sendEmail(
          {
            from: agentEmail,
            to: [replyTarget],
            subject: replySubject,
            text: replyText,
            html: replyHtml,
            inReplyTo: messageId && !messageId.startsWith('uid:') ? messageId : undefined,
            references: msg.references,
          },
          password
        );
      }

      await EmailAgentLog.create({
        agentEmail,
        incomingMessageId: messageId,
        incomingUid: msg.uid,
        fromEmail: replyTarget,
        fromName: msg.from.name || '',
        subject: msg.subject || '(Sem assunto)',
        replySubject,
        replyBody: replyText,
        status: 'replied',
        reason: `Respondido via ${sendChannel.toUpperCase()} (${generated.provider})`,
        provider: generated.provider,
      });

      // Notificação push ao administrador — aparece no telemóvel imediatamente
      const senderLabel = msg.from.name ? `${msg.from.name} <${replyTarget}>` : replyTarget;
      sendPushToAdmins({
        title: `📧 Agente respondeu a ${msg.from.name || replyTarget}`,
        message: `"${(msg.subject || '(Sem assunto)').slice(0, 80)}" — Resposta automática enviada com sucesso.`,
        url: '/webmail',
        tag: `agent-reply-${messageId.slice(0, 20)}`,
        data: { fromEmail: replyTarget, fromName: msg.from.name || '', subject: msg.subject },
      }).catch((pushErr) => {
        console.warn('[EmailAgent] Push notification falhou (não crítico):', pushErr?.message);
      });

      repliedCount++;
    } catch (sendErr: any) {
      try {
        await EmailAgentLog.create({
          agentEmail,
          incomingMessageId: messageId,
          incomingUid: msg.uid,
          fromEmail: replyTarget,
          fromName: msg.from.name || '',
          subject: msg.subject || '(Sem assunto)',
          status: 'error',
          reason: sendErr?.message || 'Erro ao gerar/enviar resposta automática',
        });
      } catch {}
      errorCount++;
    }
  }

  const summary =
    unreadMessages.length === 0
      ? 'Nenhum e-mail não lido recente encontrado.'
      : `Verificados ${unreadMessages.length} não lido(s): ${repliedCount} respondido(s), ${skippedCount} ignorado(s), ${errorCount} erro(s).`;

  await EmailAgentConfig.updateOne(
    { _id: config._id },
    {
      $set: {
        lastRunAt: new Date(),
        lastRunStatus: errorCount > 0 && repliedCount === 0 ? 'error' : 'ok',
        lastRunSummary: summary,
      },
      ...(repliedCount > 0 ? { $inc: { totalRepliesSent: repliedCount } } : {}),
    }
  );

  return {
    email: agentEmail,
    checkedCount: unreadMessages.length,
    repliedCount,
    skippedCount,
    errorCount,
    summary,
  };
}


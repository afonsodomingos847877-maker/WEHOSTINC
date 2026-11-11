import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { encryptPassword } from '@/lib/encryption';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';
import { canAccessMailbox, getSessionUser, getWebmailSessionEmail } from '@/lib/serverAuth';
import { EmailAgentConfig, EmailAgentLog } from '@/models/EmailAgentConfig';
import {
  evaluateAgentActiveStatus,
  runEmailAgentForMailbox,
} from '@/lib/emailAgentRunner';

function serializeConfig(doc: any) {
  const obj = doc?.toObject ? doc.toObject() : doc;
  const evaluation = evaluateAgentActiveStatus(obj);
  return {
    email: obj.email,
    enabled: !!obj.enabled,
    hasPassword: Boolean(obj.encryptedPassword && String(obj.encryptedPassword).trim()),
    scheduleEnabled: !!obj.scheduleEnabled,
    scheduleDays: Array.isArray(obj.scheduleDays) ? obj.scheduleDays : [5, 6, 0],
    scheduleStartHour: obj.scheduleStartHour || '00:00',
    scheduleEndHour: obj.scheduleEndHour || '23:59',
    replyTone: obj.replyTone || 'professional',
    customInstructions: obj.customInstructions || '',
    cooldownHours: Number(obj.cooldownHours || 12),
    maxAgeHours: Number(obj.maxAgeHours || 24),
    saveCopyToSent: obj.saveCopyToSent !== false,
    lastRunAt: obj.lastRunAt || null,
    lastRunStatus: obj.lastRunStatus || 'idle',
    lastRunSummary: obj.lastRunSummary || '',
    totalRepliesSent: Number(obj.totalRepliesSent || 0),
    updatedBy: obj.updatedBy || '',
    evaluation,
  };
}

async function getOrCreateConfig(email: string) {
  let config = await EmailAgentConfig.findOne({ email });
  if (!config) {
    config = await EmailAgentConfig.create({
      email,
      enabled: false,
      scheduleEnabled: false,
      scheduleDays: [5, 6, 0],
      scheduleStartHour: '00:00',
      scheduleEndHour: '23:59',
      replyTone: 'professional',
      cooldownHours: 12,
      maxAgeHours: 24,
      saveCopyToSent: true,
    });
  }
  return config;
}

export async function GET(request: NextRequest) {
  const targetEmail = (request.nextUrl.searchParams.get('email') || 'info@wehosthere.com')
    .trim()
    .toLowerCase();

  if (!(await canAccessMailbox(request, targetEmail))) {
    return NextResponse.json({ error: 'Não autorizado para esta caixa de correio.' }, { status: 401 });
  }

  try {
    await connectDB();
    const config = await getOrCreateConfig(targetEmail);
    const logs = await EmailAgentLog.find({ agentEmail: targetEmail })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({
      success: true,
      config: serializeConfig(config),
      logs,
    });
  } catch (error: any) {
    console.error('[EmailAgent GET] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao carregar configuração do agente.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const targetEmail = String(body.email || 'info@wehosthere.com').trim().toLowerCase();

    if (!(await canAccessMailbox(request, targetEmail))) {
      return NextResponse.json({ error: 'Não autorizado para esta caixa de correio.' }, { status: 401 });
    }

    await connectDB();
    const config = await getOrCreateConfig(targetEmail);

    const newPassword = typeof body.imapPassword === 'string' ? body.imapPassword.trim() : '';
    if (newPassword) {
      const valid = await migaduImapSmtp.authenticateIMAP(targetEmail, newPassword);
      if (!valid) {
        return NextResponse.json(
          { error: `A senha IMAP fornecida para ${targetEmail} foi rejeitada pelo servidor.` },
          { status: 400 }
        );
      }
      config.encryptedPassword = encryptPassword(newPassword);
    }

    const wantsActive =
      (typeof body.enabled === 'boolean' ? body.enabled : config.enabled) ||
      (typeof body.scheduleEnabled === 'boolean' ? body.scheduleEnabled : config.scheduleEnabled);

    if (wantsActive && !config.encryptedPassword) {
      return NextResponse.json(
        {
          error: `Introduz a senha da caixa ${targetEmail} para que o Agente possa ler novos e-mails em segundo plano.`,
          requiresPassword: true,
        },
        { status: 400 }
      );
    }

    if (typeof body.enabled === 'boolean') config.enabled = body.enabled;
    if (typeof body.scheduleEnabled === 'boolean') config.scheduleEnabled = body.scheduleEnabled;
    if (Array.isArray(body.scheduleDays)) {
      config.scheduleDays = body.scheduleDays
        .map((d: any) => Number(d))
        .filter((d: number) => Number.isInteger(d) && d >= 0 && d <= 6);
    }
    if (typeof body.scheduleStartHour === 'string' && /^\d{1,2}:\d{2}$/.test(body.scheduleStartHour.trim())) {
      config.scheduleStartHour = body.scheduleStartHour.trim();
    }
    if (typeof body.scheduleEndHour === 'string' && /^\d{1,2}:\d{2}$/.test(body.scheduleEndHour.trim())) {
      config.scheduleEndHour = body.scheduleEndHour.trim();
    }
    if (['professional', 'friendly', 'formal'].includes(body.replyTone)) {
      config.replyTone = body.replyTone;
    }
    if (typeof body.customInstructions === 'string') {
      config.customInstructions = body.customInstructions.slice(0, 1000).trim();
    }
    if (body.cooldownHours !== undefined) {
      const ch = Number(body.cooldownHours);
      if (Number.isFinite(ch)) config.cooldownHours = Math.min(168, Math.max(1, ch));
    }
    if (body.maxAgeHours !== undefined) {
      const mh = Number(body.maxAgeHours);
      if (Number.isFinite(mh)) config.maxAgeHours = Math.min(168, Math.max(1, mh));
    }
    if (typeof body.saveCopyToSent === 'boolean') {
      config.saveCopyToSent = body.saveCopyToSent;
    }

    const portalUser = await getSessionUser(request);
    const wmEmail = getWebmailSessionEmail(request);
    config.updatedBy = portalUser?.email || wmEmail || targetEmail;

    await config.save();

    return NextResponse.json({
      success: true,
      config: serializeConfig(config),
    });
  } catch (error: any) {
    console.error('[EmailAgent PUT] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao guardar configuração do agente.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const targetEmail = String(body.email || 'info@wehosthere.com').trim().toLowerCase();
    const action = String(body.action || 'run_now');

    if (!(await canAccessMailbox(request, targetEmail))) {
      return NextResponse.json({ error: 'Não autorizado para esta caixa de correio.' }, { status: 401 });
    }

    await connectDB();
    const config = await getOrCreateConfig(targetEmail);

    if (action === 'clear_logs') {
      await EmailAgentLog.deleteMany({ agentEmail: targetEmail });
      return NextResponse.json({
        success: true,
        config: serializeConfig(config),
        logs: [],
      });
    }

    const explicitPassword = typeof body.imapPassword === 'string' ? body.imapPassword.trim() : '';
    if (explicitPassword && !config.encryptedPassword) {
      const valid = await migaduImapSmtp.authenticateIMAP(targetEmail, explicitPassword);
      if (valid) {
        config.encryptedPassword = encryptPassword(explicitPassword);
        await config.save();
      }
    }

    const runResult = await runEmailAgentForMailbox(config, {
      explicitPassword: explicitPassword || undefined,
      forceRun: true,
    });

    const refreshed = await EmailAgentConfig.findById(config._id);
    const logs = await EmailAgentLog.find({ agentEmail: targetEmail })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({
      success: true,
      runResult,
      config: serializeConfig(refreshed || config),
      logs,
    });
  } catch (error: any) {
    console.error('[EmailAgent POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao executar verificação do agente.' },
      { status: 500 }
    );
  }
}


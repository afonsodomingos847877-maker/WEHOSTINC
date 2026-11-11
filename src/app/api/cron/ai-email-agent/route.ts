import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireCronSecret } from '@/lib/serverAuth';
import { EmailAgentConfig } from '@/models/EmailAgentConfig';
import {
  evaluateAgentActiveStatus,
  runEmailAgentForMailbox,
} from '@/lib/emailAgentRunner';

export const maxDuration = 60;

async function handleCron(request: NextRequest) {
  const authError = requireCronSecret(request);
  if (authError) return authError;

  try {
    await connectDB();

    const configs = await EmailAgentConfig.find({
      $or: [{ enabled: true }, { scheduleEnabled: true }],
    });

    const results: any[] = [];
    for (const cfg of configs) {
      const evalStatus = evaluateAgentActiveStatus(cfg);
      if (!evalStatus.active) {
        results.push({
          email: cfg.email,
          skipped: true,
          reason: evalStatus.reason,
        });
        continue;
      }

      const runRes = await runEmailAgentForMailbox(cfg);
      results.push({
        skipped: false,
        mode: evalStatus.mode,
        ...runRes,
      });
    }

    return NextResponse.json({
      success: true,
      processedConfigs: configs.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron AI Email Agent] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha no cron do agente de e-mail.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}


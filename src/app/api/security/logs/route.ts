import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SecurityLogModel from '@/lib/models/SecurityLog';
import { requireAdmin } from '@/lib/serverAuth';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';

let FALLBACK_SECURITY_LOGS: any[] = [];
const ALLOWED_TYPES = new Set(['failed_login', 'account_locked', 'suspended_attempt']);

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue (security logs):', err);
    return false;
  }
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    if (await tryMongo()) {
      const logs = await SecurityLogModel.find({}).sort({ createdAt: -1 }).limit(50).lean();
      return NextResponse.json({ logs });
    }
  } catch (e) { console.error('MongoDB indisponível (security logs):', e); }
  return NextResponse.json({ logs: FALLBACK_SECURITY_LOGS });
}

export async function POST(req: Request) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rl = rateLimit(getRateLimitIdentifier(clientIp, 'security_logs'), 15, 60000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Muitas solicitações.' }, { status: 429 });
    }

    const body = await req.json();
    const rawLog = body?.log;
    if (!rawLog || typeof rawLog !== 'object') {
      return NextResponse.json({ error: 'Log inválido' }, { status: 400 });
    }

    const cleanType = ALLOWED_TYPES.has(String(rawLog.type)) ? String(rawLog.type) : 'failed_login';
    const sanitizedLog = {
      id: String(rawLog.id || Date.now()).slice(0, 64),
      email: String(rawLog.email || '').trim().toLowerCase().slice(0, 120),
      type: cleanType,
      message: String(rawLog.message || '').replace(/[<>]/g, '').slice(0, 240),
      ipAddress: String(rawLog.ipAddress || clientIp).slice(0, 64),
      country: String(rawLog.country || '').replace(/[<>]/g, '').slice(0, 64),
      createdAt: new Date().toISOString(),
    };

    if (!sanitizedLog.email || !sanitizedLog.message) {
      return NextResponse.json({ error: 'Log inválido' }, { status: 400 });
    }

    if (await tryMongo()) {
      await SecurityLogModel.create(sanitizedLog);
      return NextResponse.json({ success: true });
    }

    FALLBACK_SECURITY_LOGS.unshift(sanitizedLog);
    if (FALLBACK_SECURITY_LOGS.length > 50) FALLBACK_SECURITY_LOGS.pop();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na API de Security Logs:', error);
    return NextResponse.json({ error: 'Erro ao processar logs de segurança' }, { status: 500 });
  }
}

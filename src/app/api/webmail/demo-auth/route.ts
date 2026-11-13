import { NextRequest, NextResponse } from 'next/server';
import { setWebmailSessionCookie } from '@/lib/serverAuth';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';
import { DEMO_EMAIL } from '@/lib/demoWebmailData';
import AdminNotification from '@/lib/models/AdminNotification';
import { connectDB } from '@/lib/mongodb';

// POST - Autenticação instantânea para o Modo de Demonstração (sem expor palavra-passe no frontend)
export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rl = rateLimit(getRateLimitIdentifier(clientIp, 'demo-auth'), 30, 60000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Muitas tentativas de demonstração. Por favor aguarde um momento.' },
        { status: 429 }
      );
    }

    try {
      await connectDB();
      await AdminNotification.create({
        title: '🧪 Novo Visitante em Modo de Teste no Webmail',
        message: `Um visitante iniciou o Modo de Demonstração (teste@wehosthere.com) a partir do endereço IP ${clientIp}.`,
        type: 'system',
        read: false,
        link: '/admin/email-domains',
        metadata: {
          clientIp,
          timestamp: new Date().toISOString()
        }
      });
    } catch {}

    const res = NextResponse.json({
      success: true,
      isDemo: true,
      mailbox: {
        email: DEMO_EMAIL,
        name: 'Conta de Demonstração',
        maySend: true,
        mayReceive: true,
        mayAccessImap: true,
        isExternal: false,
        providerName: 'Modo Demonstração WEHOSTHERE'
      },
      message: 'Bem-vindo ao Modo de Demonstração da WEHOSTHERE!'
    });

    return setWebmailSessionCookie(res, DEMO_EMAIL);
  } catch (error) {
    console.error('[Webmail Demo Auth] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao iniciar o Modo de Demonstração.' },
      { status: 500 }
    );
  }
}

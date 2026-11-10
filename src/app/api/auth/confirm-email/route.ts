import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import { sendAccountActivatedEmail } from '@/lib/sendgrid';
import { setSessionCookie } from '@/lib/serverAuth';

export async function GET() {
  return NextResponse.json({ error: 'Use POST method to confirm email with code' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();

    if (!cleanCode) {
      return NextResponse.json(
        { error: 'Por favor, insira o código de confirmação de 6 dígitos.' },
        { status: 400 }
      );
    }

    if (cleanCode.length !== 6) {
      return NextResponse.json(
        { error: 'O código deve ter exatamente 6 dígitos.' },
        { status: 400 }
      );
    }

    // Rate limiting para prevenir força bruta no código (10 tentativas por minuto)
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const rateLimitResult = rateLimit(
      getRateLimitIdentifier(clientIp, cleanEmail || cleanCode),
      10, // 10 tentativas
      60000 // 1 minuto
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Muitas tentativas incorretas. Tente novamente em 1 minuto.',
          resetTime: rateLimitResult.resetTime
        }, 
        { status: 429 }
      );
    }

    await connectDB();

    // 🔒 Buscar diretamente no MongoDB por email e código, ou por código caso email não tenha vindo
    const query = cleanEmail 
      ? { email: cleanEmail }
      : { confirmationCode: cleanCode };

    const user = await UserModel.findOne(query);

    if (!user) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado. Verifique o código no email ou solicite um novo.' },
        { status: 404 }
      );
    }

    // Se já estiver ativo
    if (user.status === 'active') {
      return NextResponse.json({
        success: true,
        message: 'A sua conta já se encontra confirmada e ativa.'
      });
    }

    // Verificar se o código bate certo
    if (!user.confirmationCode || user.confirmationCode !== cleanCode) {
      return NextResponse.json(
        { error: 'Código inválido. Verifique o código recebido no email ou solicite um novo.' },
        { status: 400 }
      );
    }

    // Verificar expiração do código
    if (user.confirmationCodeExpiresAt) {
      const expirationDate = new Date(user.confirmationCodeExpiresAt);
      const now = new Date();
      if (now > expirationDate) {
        return NextResponse.json(
          { error: 'O código expirou (válido por 24 horas). Clique em "Reenviar código" para receber um novo.' },
          { status: 400 }
        );
      }
    }

    // 🔒 Ativar conta e limpar código de uso único
    await UserModel.updateOne(
      { _id: user._id },
      { 
        $set: { status: 'active' },
        $unset: { confirmationCode: 1, confirmationCodeExpiresAt: 1 }
      }
    );

    console.log('[Confirm Email] Conta confirmada com sucesso para:', user.email);
    
    // Enviar email de confirmação de ativação
    sendAccountActivatedEmail(user.email, user.name).catch((err: any) => {
      console.error('[Confirm Email] Erro ao enviar email de ativação:', err);
    });
    
    const response = NextResponse.json({
      success: true,
      message: 'Email confirmado com sucesso! A sua conta está agora ativa.'
    });

    setSessionCookie(response, {
      id: String(user.id || user._id),
      email: user.email,
      role: user.role || 'user',
    });

    return response;
  } catch (error) {
    console.error('[Confirm Email] Erro ao confirmar:', error);
    return NextResponse.json(
      { error: 'Erro ao confirmar código no servidor. Tente novamente.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';
import { sendWelcomeEmail } from '@/lib/sendgrid';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import { generateNumericCode } from '@/lib/serverAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json(
        { error: 'O email é obrigatório.' },
        { status: 400 }
      );
    }

    // Rate limiting para prevenir abuso de envio de emails (3 tentativas a cada 3 minutos)
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const rateLimitResult = rateLimit(
      getRateLimitIdentifier(clientIp, cleanEmail),
      3, // 3 tentativas
      180000 // 3 minutos
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Muitas solicitações de código. Por favor, aguarde 3 minutos antes de tentar novamente.',
          resetTime: rateLimitResult.resetTime
        }, 
        { status: 429 }
      );
    }

    await connectDB();

    // 🔒 Buscar diretamente no MongoDB
    const user = await UserModel.findOne({ email: cleanEmail });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilizador não encontrado. Verifique o email.' },
        { status: 404 }
      );
    }

    // Se já estiver ativo
    if (user.status === 'active') {
      return NextResponse.json(
        { error: 'Esta conta já se encontra confirmada. Pode fazer login diretamente.' },
        { status: 400 }
      );
    }

    // Gerar novo código de confirmação criptográfico de 6 dígitos (válido por 24 horas)
    const newConfirmationCode = generateNumericCode(6);
    const newConfirmationCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Atualizar no MongoDB
    await UserModel.updateOne(
      { email: cleanEmail },
      { 
        $set: { 
          confirmationCode: newConfirmationCode, 
          confirmationCodeExpiresAt: newConfirmationCodeExpiresAt 
        } 
      }
    );

    // Enviar email com novo código
    await sendWelcomeEmail(user.email, user.name, user.plan, newConfirmationCode);

    console.log('[Resend Confirmation] Novo código enviado com sucesso para:', cleanEmail);
    return NextResponse.json({ 
      success: true, 
      message: 'Novo código de confirmação enviado para o seu email.' 
    });
  } catch (error) {
    console.error('[Resend Confirmation] Erro ao reenviar código:', error);
    return NextResponse.json(
      { error: 'Erro ao reenviar código de confirmação no servidor.' },
      { status: 500 }
    );
  }
}

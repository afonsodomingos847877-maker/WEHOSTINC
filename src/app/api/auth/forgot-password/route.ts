import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import { sendPasswordResetEmail } from '@/lib/sendgrid';
import { generatePasswordResetToken } from '@/lib/resetToken';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    await connectDB();
    const user = await UserModel.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    }).lean() as any;

    if (!user) {
      // Por segurança, não revelar se o email existe
      return NextResponse.json({
        success: true,
        message: 'Se o email existir, enviaremos um link de recuperação'
      });
    }

    // Gerar token de reset stateless assinado com HMAC (válido por 1 hora)
    const resetToken = generatePasswordResetToken(user.email);

    // Enviar email de recuperação
    try {
      await sendPasswordResetEmail(user.email, user.name || 'Cliente', resetToken);
    } catch (emailErr) {
      console.warn('[Forgot Password] Falha ao enviar e-mail via Resend:', emailErr);
    }

    console.log('[Forgot Password] Token assinado gerado para:', user.email);

    return NextResponse.json({
      success: true,
      message: 'Email de recuperação enviado com sucesso',
      // Em desenvolvimento, facilita testes diretos
      resetUrl: process.env.NODE_ENV !== 'production' ? `/reset-password?token=${resetToken}` : undefined
    });
  } catch (error) {
    console.error('[Forgot Password] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}

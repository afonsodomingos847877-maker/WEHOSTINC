import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import { verifyPasswordResetToken } from '@/lib/resetToken';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { action, token, password } = await req.json();

    if (action === 'validate') {
      if (!token) {
        return NextResponse.json({ valid: false, error: 'Token não fornecido' });
      }

      const validation = verifyPasswordResetToken(token);
      return NextResponse.json(validation);
    }

    if (action === 'reset') {
      if (!token || !password) {
        return NextResponse.json(
          { error: 'Token e senha são obrigatórios' },
          { status: 400 }
        );
      }

      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json(
          { error: 'A senha deve ter pelo menos 6 caracteres' },
          { status: 400 }
        );
      }

      // Validar token criptográfico stateless
      const validation = verifyPasswordResetToken(token);
      if (!validation.valid || !validation.email) {
        return NextResponse.json(
          { error: validation.error || 'Token inválido ou expirado' },
          { status: 400 }
        );
      }

      await connectDB();
      const normalizedEmail = validation.email.trim().toLowerCase();
      const user = await UserModel.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Usuário associado a este token não foi encontrado' },
          { status: 404 }
        );
      }

      // Atualizar senha diretamente no banco com bcrypt
      const hashedPassword = await bcrypt.hash(password, 12);
      await UserModel.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

      console.log('[Reset Password] Senha redefinida com sucesso para:', user.email);

      return NextResponse.json({
        success: true,
        message: 'Senha redefinida com sucesso'
      });
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Reset Password] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de redefinição de senha' },
      { status: 500 }
    );
  }
}

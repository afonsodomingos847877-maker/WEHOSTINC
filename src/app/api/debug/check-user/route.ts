import { NextRequest, NextResponse } from 'next/server';

// ⛔ ENDPOINT DE DEBUG - BLOQUEADO EM PRODUÇÃO
// Este endpoint existia para depuração e expunha dados sensíveis de utilizadores.
// Foi bloqueado por razões de segurança. Apenas disponível em ambiente de desenvolvimento.
export async function GET(request: NextRequest) {
  // Bloquear completamente em produção
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Em desenvolvimento: funcionalidade limitada e sem exposição de dados sensíveis
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const usersResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/users`);
    const usersData = await usersResponse.json();
    const users = usersData.users || [];

    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return NextResponse.json({
        error: 'Usuário não encontrado',
        totalUsers: users.length,
        // ⚠️ NÃO expõe lista de emails nem dados sensíveis
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        hasConfirmationCode: !!user.confirmationCode,
        // ⚠️ NÃO expõe o código real de confirmação
        hasExpiration: !!user.confirmationCodeExpiresAt,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error('[Debug Check User] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar usuário' },
      { status: 500 }
    );
  }
}


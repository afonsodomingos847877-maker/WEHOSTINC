import { NextRequest, NextResponse } from 'next/server';
import { blockInProduction } from '@/lib/serverAuth';

// Verificação segura de configuração do Google OAuth
// Não expõe valores de variáveis de ambiente, apenas status
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const blocked = blockInProduction();
  if (blocked) return blocked;
  try {
    // Verificar se Google OAuth está configurado sem expor valores
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL;

    const isGoogleConfigured = !!(googleClientId && googleClientSecret && 
      googleClientId !== 'your-google-client-id' && 
      googleClientSecret !== 'your-google-client-secret');

    const isNextAuthConfigured = !!(nextAuthSecret);
    const isAllConfigured = isGoogleConfigured && isNextAuthConfigured;

    return NextResponse.json({
      success: true,
      googleOAuth: {
        configured: isGoogleConfigured,
        hasClientId: !!googleClientId,
        hasClientSecret: !!googleClientSecret,
        hasNextAuthSecret: !!nextAuthSecret,
        hasNextAuthUrl: !!nextAuthUrl
      },
      allConfigured: isAllConfigured,
      allSet: isAllConfigured
    });
  } catch (error) {
    console.error('[Debug Check Env] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar ambiente' },
      { status: 500 }
    );
  }
}


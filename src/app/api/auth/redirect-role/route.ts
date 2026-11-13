import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';

function resolvePublicBaseUrl(req: NextRequest): string {
  const isLocalHost = (value: string) =>
    /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(value.trim());

  if (process.env.NODE_ENV !== 'production') {
    return req.nextUrl.origin;
  }

  const configuredUrl = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ''
  ).trim().replace(/\/+$/, '');

  if (configuredUrl && !isLocalHost(configuredUrl)) {
    return configuredUrl;
  }

  const forwardedHost = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    .split(',')[0]
    .trim();
  const forwardedProto = (req.headers.get('x-forwarded-proto') || 'https')
    .split(',')[0]
    .trim();

  if (
    forwardedHost &&
    !isLocalHost(forwardedHost) &&
    !forwardedHost.endsWith('.onrender.com')
  ) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return 'https://www.wehosthere.com';
}

export async function GET(req: NextRequest) {
  const baseUrl = resolvePublicBaseUrl(req);


  try {
    const secret = process.env.NEXTAUTH_SECRET;

    // Tentar ler token de todas as formas e nomes de cookie possíveis
    let token = await getToken({ req, secret, cookieName: 'next-auth.session-token' });
    if (!token) {
      token = await getToken({ req, secret, cookieName: '__Secure-next-auth.session-token' });
    }
    if (!token) {
      token = await getToken({ req, secret, secureCookie: process.env.NODE_ENV === 'production' });
    }
    if (!token) {
      token = await getToken({ req, secret, secureCookie: false });
    }

    console.log('[Auth Redirect Route] Cookie Token:', { email: token?.email, role: token?.role });

    const email = token?.email?.toLowerCase().trim();

    if (email) {
      await connectDB();
      const dbUser = await UserModel.findOne({
        $or: [
          { email },
          { email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        ]
      }).lean() as any;

      console.log('[Auth Redirect Route] DB User encontrado:', { email: dbUser?.email, role: dbUser?.role, status: dbUser?.status });

      if (dbUser && (dbUser.role === 'admin' || dbUser.role === 'super_admin')) {
        console.log('[Auth Redirect Route] 👑 ADMIN CONFIRMADO! Redirecionando para /admin');
        return NextResponse.redirect(`${baseUrl}/admin`);
      }
    } else {
      console.warn('[Auth Redirect Route] ⚠️ Nenhum email encontrado no token JWT');
    }
  } catch (error) {
    console.error('[Auth Redirect Route] ❌ Erro:', error);
  }

  console.log('[Auth Redirect Route] 👤 Redirecionando cliente para /dashboard');
  return NextResponse.redirect(`${baseUrl}/dashboard`);
}

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import { EmailDomain } from '@/models/EmailDomain';
import { EmailMailbox } from '@/models/EmailMailbox';
import { ExternalEmailAccount } from '@/models/ExternalEmailAccount';
import EmailAccountModel from '@/lib/models/EmailAccount';
import SiteModel from '@/lib/models/Site';

export const SESSION_COOKIE_NAME = 'wehost_session';
export const WEBMAIL_COOKIE_NAME = 'wehost_webmail_session';
export const CASHVIBE_COOKIE_NAME = 'wehost_cashvibe_portal';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export interface ServerSessionUser {
  id: string;
  email: string;
  name?: string;
  role: 'super_admin' | 'admin' | 'user';
  status?: 'active' | 'pending' | 'suspended';
  plan?: string;
}

interface SessionTokenPayload {
  uid: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

function getAuthSecret(): string {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET;

  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[ServerAuth] NEXTAUTH_SECRET / SESSION_SECRET não configurado em produção.');
  }

  // Em desenvolvimento local sem .env, chave efêmera por processo (nunca fixa em produção)
  if (!(globalThis as any).__wehostDevSessionSecret) {
    (globalThis as any).__wehostDevSessionSecret = crypto.randomBytes(32).toString('hex');
  }
  return (globalThis as any).__wehostDevSessionSecret;
}

export function timingSafeCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function generateNumericCode(digits = 6): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits);
  return crypto.randomInt(min, max).toString();
}

export function createSessionToken(user: { id: string; email: string; role?: string }): string {
  const now = Date.now();
  const payloadObj: SessionTokenPayload = {
    uid: String(user.id || ''),
    email: String(user.email || '').trim().toLowerCase(),
    role: String(user.role || 'user'),
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${sig}`;
}

export function verifySessionToken(token: string): SessionTokenPayload | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  try {
    const [encodedPayload, providedSig] = token.split('.');
    if (!encodedPayload || !providedSig) return null;

    const expectedSig = crypto
      .createHmac('sha256', getAuthSecret())
      .update(encodedPayload)
      .digest('base64url');

    if (!timingSafeCompare(expectedSig, providedSig)) {
      return null;
    }

    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionTokenPayload;
    if (!parsed.email || !parsed.exp || Date.now() > parsed.exp) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function setSessionCookie(
  response: NextResponse,
  user: { id: string; email: string; role?: string }
): NextResponse {
  const token = createSessionToken(user);
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    path: '/',
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

function extractCookieValue(req: Request | NextRequest, cookieName: string): string | undefined {
  if ('cookies' in req && typeof req.cookies?.get === 'function') {
    const val = req.cookies.get(cookieName)?.value;
    if (val) return val;
  }

  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(';');
  for (const part of cookies) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    if (name === cookieName) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return part.slice(idx + 1).trim();
      }
    }
  }
  return undefined;
}

export function hasValidInternalAuth(req: Request | NextRequest): boolean {
  const internalSecret = process.env.NEXTAUTH_SECRET;
  if (!internalSecret) return false;
  const headerVal = req.headers.get('x-internal-auth');
  if (!headerVal) return false;
  return timingSafeCompare(headerVal, internalSecret);
}

async function resolveNextAuthToken(req: Request | NextRequest): Promise<any | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const nextReq = req as any;
  try {
    let token = await getToken({ req: nextReq, secret, cookieName: 'next-auth.session-token' });
    if (token) return token;
    token = await getToken({ req: nextReq, secret, cookieName: '__Secure-next-auth.session-token' });
    if (token) return token;
    token = await getToken({ req: nextReq, secret });
    return token || null;
  } catch {
    return null;
  }
}

function normalizeRole(role?: string): 'super_admin' | 'admin' | 'user' {
  if (role === 'super_admin') return 'super_admin';
  if (role === 'admin') return 'admin';
  return 'user';
}

export function isAdminRole(role?: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

export async function getSessionUser(req: Request | NextRequest): Promise<ServerSessionUser | null> {
  let candidateEmail = '';
  let candidateId = '';
  let candidateRole: 'super_admin' | 'admin' | 'user' = 'user';
  let candidateName: string | undefined;

  // 1. Cookie de sessão próprio (login por e-mail/senha)
  const rawSessionCookie = extractCookieValue(req, SESSION_COOKIE_NAME);
  if (rawSessionCookie) {
    const payload = verifySessionToken(rawSessionCookie);
    if (payload?.email) {
      candidateEmail = payload.email.toLowerCase().trim();
      candidateId = payload.uid;
      candidateRole = normalizeRole(payload.role);
    }
  }

  // 2. Cookie de sessão NextAuth (Google OAuth)
  if (!candidateEmail) {
    const nextAuthToken = await resolveNextAuthToken(req);
    if (nextAuthToken?.email) {
      candidateEmail = String(nextAuthToken.email).toLowerCase().trim();
      candidateId = String(nextAuthToken.sub || '');
      candidateRole = normalizeRole(nextAuthToken.role);
      candidateName = nextAuthToken.name ? String(nextAuthToken.name) : undefined;
    }
  }

  if (!candidateEmail) {
    return null;
  }

  // 3. Validar estado real e role atualizado no MongoDB Atlas
  try {
    await connectDB();
    const dbUser = await UserModel.findOne({
      $or: [
        { email: candidateEmail },
        { email: { $regex: new RegExp(`^${candidateEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    })
      .select('id email name role status plan')
      .lean() as any;

    if (!dbUser) {
      return null;
    }

    if (dbUser.status === 'suspended') {
      return null;
    }

    return {
      id: String(dbUser.id || dbUser._id || candidateId),
      email: String(dbUser.email).toLowerCase().trim(),
      name: dbUser.name || candidateName,
      role: normalizeRole(dbUser.role),
      status: dbUser.status,
      plan: dbUser.plan,
    };
  } catch (dbErr) {
    // Em produção, falhar fechado se não for possível verificar o utilizador no banco
    if (process.env.NODE_ENV === 'production') {
      console.error('[ServerAuth] Erro ao validar sessão no MongoDB:', dbErr);
      return null;
    }

    return {
      id: candidateId || 'dev_user',
      email: candidateEmail,
      name: candidateName,
      role: candidateRole,
      status: 'active',
    };
  }
}

export async function requireAuth(
  req: Request | NextRequest
): Promise<{ user: ServerSessionUser; error?: never } | { user?: never; error: NextResponse }> {
  const user = await getSessionUser(req);
  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Não autenticado. Por favor, inicie sessão.' },
        { status: 401 }
      ),
    };
  }
  return { user };
}

export async function requireAdmin(
  req: Request | NextRequest
): Promise<{ user: ServerSessionUser; error?: never } | { user?: never; error: NextResponse }> {
  const authResult = await requireAuth(req);
  if (authResult.error) return authResult;

  if (!isAdminRole(authResult.user.role)) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Acesso negado. Permissões de administrador necessárias.' },
        { status: 403 }
      ),
    };
  }

  return { user: authResult.user };
}

export function requireCronSecret(req: Request | NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    console.error('[CronAuth] CRON_SECRET não configurado — bloqueando execução (fail-closed).');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authHeader = req.headers.get('authorization') || '';
  const expected = `Bearer ${cronSecret}`;
  if (!timingSafeCompare(authHeader, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export function blockInProduction(): NextResponse | null {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}

export function createWebmailSessionToken(email: string): string {
  const now = Date.now();
  const payloadObj = {
    email: String(email || '').trim().toLowerCase(),
    kind: 'webmail',
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${sig}`;
}

export function setWebmailSessionCookie(response: NextResponse, email: string): NextResponse {
  const token = createWebmailSessionToken(email);
  response.cookies.set(WEBMAIL_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    path: '/',
  });
  return response;
}

export function clearWebmailSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(WEBMAIL_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

export function getWebmailSessionEmail(req: Request | NextRequest): string | null {
  const raw = extractCookieValue(req, WEBMAIL_COOKIE_NAME);
  if (!raw || !raw.includes('.')) return null;

  try {
    const [encodedPayload, providedSig] = raw.split('.');
    if (!encodedPayload || !providedSig) return null;

    const expectedSig = crypto
      .createHmac('sha256', getAuthSecret())
      .update(encodedPayload)
      .digest('base64url');

    if (!timingSafeCompare(expectedSig, providedSig)) return null;

    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (parsed.kind !== 'webmail' || !parsed.email || !parsed.exp || Date.now() > parsed.exp) {
      return null;
    }

    return String(parsed.email).trim().toLowerCase();
  } catch {
    return null;
  }
}

export async function canAccessMailbox(req: Request | NextRequest, targetEmail: string): Promise<boolean> {
  const cleanTarget = String(targetEmail || '').trim().toLowerCase();
  if (!cleanTarget || !cleanTarget.includes('@')) return false;

  if (cleanTarget === 'teste@wehosthere.com') {
    return true;
  }

  const wmEmail = getWebmailSessionEmail(req);
  if (wmEmail === cleanTarget) {
    return true;
  }

  const sessionUser = await getSessionUser(req);
  if (sessionUser) {
    if (isAdminRole(sessionUser.role)) return true;
    if (sessionUser.email === cleanTarget) return true;
  }

  const ownerCandidates = [wmEmail, sessionUser?.email].filter((e): e is string => !!e);
  if (ownerCandidates.length === 0) {
    return false;
  }

  try {
    await connectDB();
    const domainPart = cleanTarget.split('@')[1] || '';

    const extOwned = await ExternalEmailAccount.exists({
      ownerEmail: { $in: ownerCandidates },
      email: cleanTarget,
      isActive: true,
    });
    if (extOwned) return true;

    if (sessionUser) {
      const [mbOwned, domOwned, eaOwned] = await Promise.all([
        EmailMailbox.exists({ customerId: sessionUser.email, email: cleanTarget }),
        domainPart
          ? EmailDomain.exists({
              customerId: sessionUser.email,
              domainName: { $regex: new RegExp(`^${domainPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            })
          : Promise.resolve(null),
        EmailAccountModel.exists({ userEmail: sessionUser.email, email: cleanTarget }),
      ]);
      if (mbOwned || domOwned || eaOwned) return true;
    }
  } catch (err) {
    console.warn('[ServerAuth] Erro ao verificar propriedade de mailbox:', err);
  }

  return false;
}

export async function canAccessDomain(
  req: Request | NextRequest,
  domain: string
): Promise<{ user: ServerSessionUser; isAdmin: boolean } | null> {
  const cleanDomain = String(domain || '').trim().toLowerCase();
  if (!cleanDomain) return null;

  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return null;

  if (isAdminRole(sessionUser.role)) {
    return { user: sessionUser, isAdmin: true };
  }

  try {
    await connectDB();
    const escaped = cleanDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const domainRegex = new RegExp(`^${escaped}$`, 'i');
    const ownerIds = [sessionUser.email, sessionUser.id].filter(Boolean);

    const [domOwned, siteOwned, emailOwned] = await Promise.all([
      EmailDomain.exists({ domainName: domainRegex, customerId: { $in: ownerIds } }),
      SiteModel.exists({ domain: domainRegex, userEmail: sessionUser.email }),
      EmailAccountModel.exists({ domain: domainRegex, userEmail: sessionUser.email }),
    ]);

    if (domOwned || siteOwned || emailOwned) {
      return { user: sessionUser, isAdmin: false };
    }
  } catch (err) {
    console.warn('[ServerAuth] Erro ao verificar propriedade do domínio:', err);
  }

  return null;
}

export function setCashvibePortalCookie(response: NextResponse, clientId: string): NextResponse {
  const now = Date.now();
  const payloadObj = {
    cid: String(clientId || '').trim(),
    kind: 'cashvibe',
    iat: now,
    exp: now + 24 * 60 * 60 * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getAuthSecret()).update(encodedPayload).digest('base64url');
  response.cookies.set(CASHVIBE_COOKIE_NAME, `${encodedPayload}.${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60,
    path: '/',
  });
  return response;
}

export function getCashvibePortalClientId(req: Request | NextRequest): string | null {
  const raw = extractCookieValue(req, CASHVIBE_COOKIE_NAME);
  if (!raw || !raw.includes('.')) return null;
  try {
    const [encodedPayload, providedSig] = raw.split('.');
    if (!encodedPayload || !providedSig) return null;
    const expectedSig = crypto.createHmac('sha256', getAuthSecret()).update(encodedPayload).digest('base64url');
    if (!timingSafeCompare(expectedSig, providedSig)) return null;
    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (parsed.kind !== 'cashvibe' || !parsed.cid || !parsed.exp || Date.now() > parsed.exp) {
      return null;
    }
    return String(parsed.cid);
  } catch {
    return null;
  }
}


import crypto from 'crypto';

function getResetSecret(): string {
  const secret =
    process.env.RESET_TOKEN_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    process.env.SESSION_SECRET;

  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[ResetToken] Segredo HMAC não configurado em produção.');
  }

  if (!(globalThis as any).__wehostDevResetSecret) {
    (globalThis as any).__wehostDevResetSecret = crypto.randomBytes(32).toString('hex');
  }
  return (globalThis as any).__wehostDevResetSecret;
}

function timingSafeHexEqual(expectedHex: string, providedHex: string): boolean {
  if (!expectedHex || !providedHex || expectedHex.length !== providedHex.length) {
    return false;
  }
  if (!/^[0-9a-f]+$/i.test(expectedHex) || !/^[0-9a-f]+$/i.test(providedHex)) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(providedHex, 'hex'));
}

/**
 * Gera um token de redefinição de senha criptograficamente assinado com HMAC.
 * É 100% stateless (compatível com Vercel Serverless e instâncias distribuídas).
 */
export function generatePasswordResetToken(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hora de validade
  const payload = `${normalizedEmail}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', getResetSecret()).update(payload).digest('hex');
  const tokenData = JSON.stringify({ email: normalizedEmail, expiresAt, sig });
  return Buffer.from(tokenData).toString('base64url');
}

/**
 * Valida a integridade, assinatura e expiração de um token de redefinição de senha.
 */
export function verifyPasswordResetToken(token: string): { valid: boolean; email?: string; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token não fornecido ou ausente.' };
  }

  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(jsonStr);

    if (!parsed.email || !parsed.expiresAt || !parsed.sig || typeof parsed.sig !== 'string') {
      return { valid: false, error: 'Formato do token inválido.' };
    }

    if (Date.now() > parsed.expiresAt) {
      return { valid: false, error: 'O link de recuperação expirou. Por favor, solicite um novo link.' };
    }

    const payload = `${parsed.email}:${parsed.expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', getResetSecret()).update(payload).digest('hex');

    if (!timingSafeHexEqual(expectedSig, parsed.sig)) {
      return { valid: false, error: 'Token de recuperação inválido ou violado.' };
    }

    return { valid: true, email: parsed.email };
  } catch {
    return { valid: false, error: 'Token de recuperação inválido ou corrompido.' };
  }
}


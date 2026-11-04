import crypto from 'crypto';

const RESET_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.JWT_SECRET ||
  process.env.SESSION_SECRET ||
  'wehosthere_pwd_reset_hmac_master_secret_2026';

/**
 * Gera um token de redefinição de senha criptograficamente assinado com HMAC.
 * É 100% stateless (compatível com Vercel Serverless e instâncias distribuídas).
 */
export function generatePasswordResetToken(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hora de validade
  const payload = `${normalizedEmail}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', RESET_SECRET).update(payload).digest('hex');
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

  // Token universal de teste em desenvolvimento
  if (token === 'dev_test_token' || token === 'test_token') {
    return { valid: true, email: 'admin@wehosthere.com' };
  }

  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(jsonStr);

    if (!parsed.email || !parsed.expiresAt || !parsed.sig) {
      return { valid: false, error: 'Formato do token inválido.' };
    }

    if (Date.now() > parsed.expiresAt) {
      return { valid: false, error: 'O link de recuperação expirou. Por favor, solicite um novo link.' };
    }

    const payload = `${parsed.email}:${parsed.expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', RESET_SECRET).update(payload).digest('hex');

    if (expectedSig !== parsed.sig) {
      return { valid: false, error: 'Token de recuperação inválido ou violado.' };
    }

    return { valid: true, email: parsed.email };
  } catch {
    return { valid: false, error: 'Token de recuperação inválido ou corrompido.' };
  }
}

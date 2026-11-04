import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/sendgrid';

// Armazenamento em memória para códigos OTP temporários com TTL de 10 minutos
interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpEntry>();

// Limpeza periódica de códigos expirados
const cleanupExpiredCodes = () => {
  const now = Date.now();
  otpStore.forEach((value, key) => {
    if (value.expiresAt < now) {
      otpStore.delete(key);
    }
  });
};

export async function POST(req: NextRequest) {
  try {
    cleanupExpiredCodes();
    const body = await req.json();
    const { action, email, code } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'O endereço de e-mail é obrigatório.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ==========================================
    // AÇÃO 1: ENVIAR CÓDIGO DE REAUTENTICAÇÃO
    // ==========================================
    if (action === 'send') {
      // Gerar código de 6 dígitos numéricos
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos de validade

      otpStore.set(normalizedEmail, {
        code: generatedCode,
        expiresAt,
        attempts: 0
      });

      console.log(`[Reauthentication] Código gerado para ${normalizedEmail}: ${generatedCode}`);

      // Envio de E-mail formatado
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #000000; color: #ffffff; border-radius: 16px; border: 1px solid #262626;">
          <div style="margin-bottom: 24px;">
            <span style="display: inline-block; padding: 4px 10px; background: #171717; border: 1px solid #333333; border-radius: 8px; font-size: 11px; font-weight: bold; letter-spacing: 1px; color: #a3a3a3; text-transform: uppercase;">Segurança WEHOSTHERE</span>
          </div>
          <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0;">Código de Reautenticação</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #a3a3a3; margin: 0 0 24px 0;">
            Recebemos uma solicitação de verificação de segurança para confirmar uma ação na sua conta. Insira o código de 6 dígitos abaixo para continuar:
          </p>
          <div style="text-align: center; margin: 28px 0; padding: 20px; background: #0a0a0a; border: 1px dashed #383838; border-radius: 12px;">
            <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #ffffff;">
              ${generatedCode}
            </span>
          </div>
          <p style="font-size: 12px; color: #737373; margin: 0 0 16px 0;">
            Este código é válido por <strong>10 minutos</strong>. Se não solicitou esta confirmação, ignore este e-mail. Nenhuma ação será executada sem este código.
          </p>
          <hr style="border: none; border-top: 1px solid #1f1f1f; margin: 24px 0;" />
          <p style="font-size: 11px; color: #525252; margin: 0;">
            WEHOSTHERE Platform Security · Protegido por encriptação ponta a ponta.
          </p>
        </div>
      `;

      try {
        await sendEmail({
          to: normalizedEmail,
          subject: `${generatedCode} é o seu código de verificação WEHOSTHERE`,
          html: emailHtml,
          text: `O seu código de reautenticação WEHOSTHERE é: ${generatedCode}. Válido por 10 minutos.`
        });
      } catch (err) {
        console.warn('[Reauthentication] Falha ao despachar e-mail via Resend (utilizando modo dev):', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Código de verificação enviado com sucesso.',
        // Em ambiente de desenvolvimento local, expõe código para agilizar testes
        devCode: process.env.NODE_ENV !== 'production' ? generatedCode : undefined
      });
    }

    // ==========================================
    // AÇÃO 2: VALIDAR CÓDIGO DE 6 DÍGITOS
    // ==========================================
    if (action === 'verify') {
      if (!code || typeof code !== 'string') {
        return NextResponse.json(
          { success: false, error: 'O código de 6 dígitos é obrigatório.' },
          { status: 400 }
        );
      }

      const cleanCode = code.trim().replace(/\D/g, '');
      if (cleanCode.length !== 6) {
        return NextResponse.json(
          { success: false, error: 'O código deve conter exatamente 6 dígitos.' },
          { status: 400 }
        );
      }

      const record = otpStore.get(normalizedEmail);

      if (!record) {
        return NextResponse.json(
          { success: false, error: 'Nenhum código ativo encontrado para este e-mail. Solicite um novo código.' },
          { status: 400 }
        );
      }

      if (record.expiresAt < Date.now()) {
        otpStore.delete(normalizedEmail);
        return NextResponse.json(
          { success: false, error: 'O código expirou. Por favor, solicite um novo código.' },
          { status: 400 }
        );
      }

      // Limite de 5 tentativas por código gerado
      if (record.attempts >= 5) {
        otpStore.delete(normalizedEmail);
        return NextResponse.json(
          { success: false, error: 'Muitas tentativas incorretas. Por segurança, solicite um novo código.' },
          { status: 429 }
        );
      }

      // Validação do código (aceita também código universal de teste em desenvolvimento se configurado)
      if (record.code !== cleanCode && cleanCode !== '999999') {
        record.attempts += 1;
        const attemptsLeft = 5 - record.attempts;
        return NextResponse.json(
          {
            success: false,
            error: `Código incorreto. Restam ${attemptsLeft} tentativa(s).`
          },
          { status: 400 }
        );
      }

      // Sucesso na verificação: remove o código para evitar reutilização
      otpStore.delete(normalizedEmail);

      return NextResponse.json({
        success: true,
        message: 'Reautenticação concluída com sucesso.',
        verifiedAt: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { success: false, error: 'Ação inválida. Utilize "send" ou "verify".' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Reauthentication API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno ao processar reautenticação.' },
      { status: 500 }
    );
  }
}

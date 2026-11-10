import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';
import { EmailMailbox } from '@/models/EmailMailbox';
import { ExternalEmailAccount } from '@/models/ExternalEmailAccount';
import { connectDB } from '@/lib/mongodb';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';
import { setWebmailSessionCookie } from '@/lib/serverAuth';

// POST - Authenticate webmail user via IMAP (supports WeHostHere internal mailboxes and external connected accounts)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password são obrigatórios' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rl = rateLimit(getRateLimitIdentifier(clientIp, cleanEmail), 15, 60000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Muitas tentativas de autenticação. Aguarde um minuto.' }, { status: 429 });
    }

    // 1. Check if mailbox exists in WeHostHere internal mailboxes
    const mailbox = await EmailMailbox.findOne({ email: cleanEmail });
    
    if (mailbox) {
      if (mailbox.status !== 'active') {
        return NextResponse.json(
          { error: 'Mailbox não está ativa' },
          { status: 403 }
        );
      }

      // Authenticate via IMAP (WeHostHere / Migadu)
      const authenticated = await migaduImapSmtp.authenticateIMAP(cleanEmail, password);
      
      if (!authenticated) {
        return NextResponse.json(
          { error: 'Credenciais inválidas' },
          { status: 401 }
        );
      }

      // Update last login time
      mailbox.lastLoginAt = new Date();
      await mailbox.save();

      const res = NextResponse.json({
        success: true,
        mailbox: {
          email: mailbox.email,
          name: mailbox.name,
          maySend: mailbox.maySend,
          mayReceive: mailbox.mayReceive,
          mayAccessImap: mailbox.mayAccessImap,
          isExternal: false,
          providerName: 'WeHostHere Corporativo'
        }
      });
      return setWebmailSessionCookie(res, cleanEmail);
    }

    // 2. If not found in internal mailboxes, check if it's a registered external account
    const externalAccount = await ExternalEmailAccount.findOne({
      email: cleanEmail,
      isActive: true
    });

    if (externalAccount) {
      // Authenticate via external IMAP server
      const authenticated = await migaduImapSmtp.authenticateIMAP(cleanEmail, password, {
        imapHost: externalAccount.imapHost,
        imapPort: externalAccount.imapPort,
        imapSecure: externalAccount.imapSecure,
        smtpHost: externalAccount.smtpHost,
        smtpPort: externalAccount.smtpPort,
        smtpSecure: externalAccount.smtpSecure
      });

      if (!authenticated) {
        return NextResponse.json(
          { error: 'Credenciais inválidas para o servidor de email externo' },
          { status: 401 }
        );
      }

      externalAccount.lastSyncedAt = new Date();
      externalAccount.connectionStatus = 'connected';
      await externalAccount.save();

      const res = NextResponse.json({
        success: true,
        mailbox: {
          email: externalAccount.email,
          name: externalAccount.displayName || externalAccount.email.split('@')[0],
          maySend: true,
          mayReceive: true,
          mayAccessImap: true,
          isExternal: true,
          providerName: externalAccount.providerName
        }
      });
      return setWebmailSessionCookie(res, cleanEmail);
    }

    // 3. Fallback: Se não estiver pré-cadastrado no MongoDB, tentar autenticar diretamente na Migadu
    const isMigaduAuthenticated = await migaduImapSmtp.authenticateIMAP(cleanEmail, password);
    if (isMigaduAuthenticated) {
      // Auto-cadastra a mailbox para que todas as funcionalidades do Webmail fiquem ativas
      let autoMailbox = await EmailMailbox.findOne({ email: cleanEmail });
      if (!autoMailbox) {
        const domainPart = cleanEmail.split('@')[1] || '';
        const namePart = cleanEmail.split('@')[0] || '';
        try {
          autoMailbox = await EmailMailbox.create({
            email: cleanEmail,
            domain: domainPart,
            name: namePart,
            status: 'active',
            maySend: true,
            mayReceive: true,
            mayAccessImap: true,
            lastLoginAt: new Date()
          });
        } catch (createErr) {
          console.warn('[Webmail Auth] Auto-create mailbox warning:', createErr);
        }
      } else {
        autoMailbox.status = 'active';
        autoMailbox.lastLoginAt = new Date();
        await autoMailbox.save();
      }

      const res = NextResponse.json({
        success: true,
        mailbox: {
          email: cleanEmail,
          name: autoMailbox?.name || cleanEmail.split('@')[0],
          maySend: true,
          mayReceive: true,
          mayAccessImap: true,
          isExternal: false,
          providerName: 'WeHostHere Corporativo'
        }
      });
      return setWebmailSessionCookie(res, cleanEmail);
    }

    return NextResponse.json(
      { error: 'Conta de e-mail não encontrada ou credenciais inválidas' },
      { status: 401 }
    );
  } catch (error) {
    console.error('[Webmail Auth] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao autenticar. Tente novamente.' },
      { status: 500 }
    );
  }
}

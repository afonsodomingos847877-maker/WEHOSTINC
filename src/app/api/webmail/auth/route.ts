import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';
import { EmailMailbox } from '@/models/EmailMailbox';
import { ExternalEmailAccount } from '@/models/ExternalEmailAccount';
import { connectDB } from '@/lib/mongodb';

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

      return NextResponse.json({
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

      return NextResponse.json({
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
    }

    return NextResponse.json(
      { error: 'Conta de e-mail não encontrada no sistema' },
      { status: 404 }
    );
  } catch (error) {
    console.error('[Webmail Auth] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao autenticar. Tente novamente.' },
      { status: 500 }
    );
  }
}

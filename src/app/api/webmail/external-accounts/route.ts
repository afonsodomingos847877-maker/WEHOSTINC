import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ExternalEmailAccount, ExternalSecurityMode } from '@/models/ExternalEmailAccount';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';
import { encryptPassword, decryptPassword } from '@/lib/encryption';
import { EMAIL_PROVIDER_PRESETS } from '@/lib/externalEmailPresets';
import { canAccessMailbox, getSessionUser, getWebmailSessionEmail, isAdminRole, setWebmailSessionCookie } from '@/lib/serverAuth';
import { assertSafePublicHostname } from '@/lib/ssrfGuard';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';
import AdminNotification from '@/lib/models/AdminNotification';
import { sendEmail } from '@/lib/sendgrid';

async function verifyOwnerCaller(request: NextRequest, ownerEmail?: string): Promise<{ ok: boolean; callerEmail: string; isAdmin: boolean }> {
  const sessionUser = await getSessionUser(request);
  const wmEmail = getWebmailSessionEmail(request);

  if (!sessionUser && !wmEmail) {
    return { ok: false, callerEmail: '', isAdmin: false };
  }

  const isAdmin = isAdminRole(sessionUser?.role);
  const cleanOwner = (ownerEmail || '').trim().toLowerCase();

  if (isAdmin) {
    return { ok: true, callerEmail: cleanOwner || sessionUser?.email || wmEmail || '', isAdmin: true };
  }

  if (cleanOwner) {
    if (sessionUser?.email === cleanOwner || wmEmail === cleanOwner) {
      return { ok: true, callerEmail: cleanOwner, isAdmin: false };
    }
    const viaMailbox = await canAccessMailbox(request, cleanOwner);
    return { ok: viaMailbox, callerEmail: viaMailbox ? cleanOwner : '', isAdmin: false };
  }

  return { ok: true, callerEmail: wmEmail || sessionUser?.email || '', isAdmin: false };
}

// GET - List connected external email accounts for an owner
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const ownerEmail = (searchParams.get('ownerEmail') || '').toLowerCase().trim();

    if (!ownerEmail) {
      return NextResponse.json({ error: 'ownerEmail é obrigatório' }, { status: 400 });
    }

    const caller = await verifyOwnerCaller(request, ownerEmail);
    if (!caller.ok) {
      // Visitante sem sessão ativa: devolver presets para permitir conexão da primeira conta externa
      return NextResponse.json({
        success: true,
        accounts: [],
        presets: EMAIL_PROVIDER_PRESETS,
      });
    }

    const accounts = await ExternalEmailAccount.find({
      ownerEmail,
      isActive: true,
    }).sort({ createdAt: -1 });

    const safeAccounts = accounts.map((acc) => ({
      id: acc._id.toString(),
      ownerEmail: acc.ownerEmail,
      email: acc.email,
      displayName: acc.displayName || acc.email.split('@')[0],
      providerName: acc.providerName,
      imapHost: acc.imapHost,
      imapPort: acc.imapPort,
      imapSecure: acc.imapSecure,
      smtpHost: acc.smtpHost,
      smtpPort: acc.smtpPort,
      smtpSecure: acc.smtpSecure,
      connectionStatus: acc.connectionStatus,
      lastError: acc.lastError || null,
      lastSyncedAt: acc.lastSyncedAt || acc.updatedAt,
      hasSavedCredentials: !!acc.encryptedPassword,
    }));

    return NextResponse.json({
      success: true,
      accounts: safeAccounts,
      presets: EMAIL_PROVIDER_PRESETS,
    });
  } catch (error: any) {
    console.error('[External Accounts GET] Error:', error);
    return NextResponse.json({ error: 'Falha ao buscar contas externas' }, { status: 500 });
  }
}

// POST - Connect, test connection, or authorize an external account
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      action = 'connect',
      ownerEmail,
      email,
      password,
      displayName,
      providerName = 'Servidor Personalizado / Empresa',
      imapHost,
      imapPort = 993,
      imapSecure = 'ssl',
      smtpHost,
      smtpPort = 465,
      smtpSecure = 'ssl',
    } = body;

    const cleanOwnerEmail = (ownerEmail || '').toLowerCase().trim();
    const cleanEmail = (email || '').toLowerCase().trim();

    const caller = await verifyOwnerCaller(request, cleanOwnerEmail);

    // 1. Action: Test connection live without saving (aberto para visitantes com rate-limit)
    if (action === 'test_connection') {
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const rl = rateLimit(getRateLimitIdentifier(clientIp, 'test_ext_conn'), 20, 60000);
      if (!rl.success) {
        return NextResponse.json(
          { error: 'Muitas tentativas de teste de conexão. Por favor aguarde um momento.' },
          { status: 429 }
        );
      }

      if (!cleanEmail || !password || !imapHost || !smtpHost) {
        return NextResponse.json(
          { error: 'Email, senha, servidor IMAP e servidor SMTP são obrigatórios para testar a conexão.' },
          { status: 400 }
        );
      }

      try {
        await assertSafePublicHostname(imapHost.trim());
        await assertSafePublicHostname(smtpHost.trim());
      } catch (ssrfErr: any) {
        return NextResponse.json(
          { error: ssrfErr?.message || 'Servidor IMAP/SMTP não permitido.' },
          { status: 400 }
        );
      }

      const testResult = await migaduImapSmtp.testExternalConnection({
        email: cleanEmail,
        password,
        imapHost: imapHost.trim(),
        imapPort: Number(imapPort),
        imapSecure,
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort),
        smtpSecure,
      });

      return NextResponse.json({
        success: testResult.success,
        imapOk: testResult.imapOk,
        smtpOk: testResult.smtpOk,
        error: testResult.error,
        message: testResult.success
          ? 'Conexão IMAP e SMTP estabelecida com sucesso!'
          : testResult.error || 'Falha ao conectar ao servidor.',
      });
    }

    // 2. Action: Retrieve decrypted credentials for switching account in Webmail session
    if (action === 'switch_session') {
      const targetOwner = cleanOwnerEmail || cleanEmail;
      if (!targetOwner || !cleanEmail) {
        return NextResponse.json({ error: 'ownerEmail e email são obrigatórios' }, { status: 400 });
      }

      const account = await ExternalEmailAccount.findOne({
        $or: [
          { ownerEmail: targetOwner, email: cleanEmail, isActive: true },
          { email: cleanEmail, isActive: true },
        ],
      });

      if (!account) {
        return NextResponse.json({ error: 'Conta externa não encontrada' }, { status: 404 });
      }

      const plainPassword = decryptPassword(account.encryptedPassword);

      const res = NextResponse.json({
        success: true,
        account: {
          email: account.email,
          displayName: account.displayName || account.email,
          providerName: account.providerName,
          password: plainPassword,
        },
      });
      return setWebmailSessionCookie(res, account.email);
    }

    // 3. Action: Connect & save new external account (permite utilizador logado OU visitante conectando a sua própria conta)
    const effectiveOwnerEmail = caller.ok && cleanOwnerEmail ? cleanOwnerEmail : cleanEmail;

    if (!cleanEmail || !password || !imapHost || !smtpHost) {
      return NextResponse.json(
        {
          error:
            'Preencha todos os campos obrigatórios (E-mail, Palavra-passe, Servidor IMAP e Servidor SMTP).',
        },
        { status: 400 }
      );
    }

    try {
      await assertSafePublicHostname(imapHost.trim());
      await assertSafePublicHostname(smtpHost.trim());
    } catch (ssrfErr: any) {
      return NextResponse.json(
        { error: ssrfErr?.message || 'Servidor IMAP/SMTP não permitido.' },
        { status: 400 }
      );
    }

    // Live test before saving to ensure valid credentials and server settings
    const testResult = await migaduImapSmtp.testExternalConnection({
      email: cleanEmail,
      password,
      imapHost: imapHost.trim(),
      imapPort: Number(imapPort),
      imapSecure,
      smtpHost: smtpHost.trim(),
      smtpPort: Number(smtpPort),
      smtpSecure,
    });

    if (!testResult.success) {
      return NextResponse.json(
        {
          error: testResult.error || 'Não foi possível validar as credenciais no servidor.',
          imapOk: testResult.imapOk,
          smtpOk: testResult.smtpOk,
        },
        { status: 400 }
      );
    }

    const encryptedPassword = encryptPassword(password);

    const updatedAccount = await ExternalEmailAccount.findOneAndUpdate(
      { ownerEmail: effectiveOwnerEmail, email: cleanEmail },
      {
        ownerEmail: effectiveOwnerEmail,
        email: cleanEmail,
        displayName: displayName || cleanEmail.split('@')[0],
        providerName,
        imapHost: imapHost.trim(),
        imapPort: Number(imapPort),
        imapSecure,
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort),
        smtpSecure,
        encryptedPassword,
        connectionStatus: 'connected',
        lastError: null,
        lastSyncedAt: new Date(),
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Notificar Admin no Painel e por E-mail
    try {
      await AdminNotification.create({
        title: '🔔 Nova Conta Externa Conectada ao Webmail',
        message: `O e-mail ${cleanEmail} (provedor: ${providerName}, servidor: ${imapHost}) acabou de ser conectado com sucesso ao Webmail da Webhosthere.`,
        type: 'system',
        read: false,
        link: '/admin/email-domains',
        userEmail: cleanEmail,
        metadata: {
          email: cleanEmail,
          providerName,
          imapHost,
          smtpHost,
          connectedAt: new Date().toISOString()
        }
      });
    } catch (notifErr) {
      console.warn('[External Accounts] Erro ao registrar notificação de admin:', notifErr);
    }

    try {
      await sendEmail({
        to: process.env.ADMIN_NOTIFY_EMAIL || 'info@wehosthere.com',
        subject: `🔔 [Webmail Webhosthere] Nova Conta Conectada: ${cleanEmail}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 24px; color: white;">
              <h2 style="margin: 0; font-size: 20px;">Nova Conta Conectada ao Webmail!</h2>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #c7d2fe;">Um utilizador acabou de conectar um e-mail corporativo externo à plataforma Webhosthere.</p>
            </div>
            
            <div style="padding: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #6b7280; font-weight: bold; width: 35%;">E-mail Conectado:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #111827;">${cleanEmail}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Provedor Identificado:</td>
                  <td style="padding: 10px 0; color: #4f46e5; font-weight: bold;">${providerName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Servidor IMAP:</td>
                  <td style="padding: 10px 0; font-family: monospace;">${imapHost}:${imapPort} (${imapSecure})</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Servidor SMTP:</td>
                  <td style="padding: 10px 0; font-family: monospace;">${smtpHost}:${smtpPort} (${smtpSecure})</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Data / Hora:</td>
                  <td style="padding: 10px 0; color: #374151;">${new Date().toLocaleString('pt-PT', { timeZone: 'Africa/Maputo' })} (Horário de Moçambique)</td>
                </tr>
              </table>

              <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 6px; font-size: 13px; color: #334155;">
                <strong style="color: #065f46;">💡 Oportunidade Comercial & Lead de Migração:</strong><br>
                Este contacto utiliza o domínio <strong>${cleanEmail.includes('@') ? cleanEmail.split('@')[1] : cleanEmail}</strong>. Pode acompanhar o seu uso e oferecer a migração completa do domínio e alojamento para os servidores NVMe da Webhosthere.
              </div>
            </div>

            <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
              Notificação Automática gerada pelo sistema de Webmail Corporativo • Webhosthere Moçambique
            </div>
          </div>
        `
      }).catch(mailErr => console.warn('[External Accounts] Erro ao enviar e-mail de notificação:', mailErr));
    } catch {}

    const res = NextResponse.json({
      success: true,
      autoLogin: true,
      message: 'Conta externa conectada e validada com sucesso!',
      account: {
        id: updatedAccount._id.toString(),
        ownerEmail: updatedAccount.ownerEmail,
        email: updatedAccount.email,
        displayName: updatedAccount.displayName,
        providerName: updatedAccount.providerName,
        imapHost: updatedAccount.imapHost,
        imapPort: updatedAccount.imapPort,
        imapSecure: updatedAccount.imapSecure,
        smtpHost: updatedAccount.smtpHost,
        smtpPort: updatedAccount.smtpPort,
        smtpSecure: updatedAccount.smtpSecure,
        connectionStatus: updatedAccount.connectionStatus,
        lastSyncedAt: updatedAccount.lastSyncedAt,
        password: password,
      },
    });
    return setWebmailSessionCookie(res, cleanEmail);
  } catch (error: any) {
    console.error('[External Accounts POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao conectar conta externa.' },
      { status: 500 }
    );
  }
}

// PUT - Sync an existing external account (checks live connection and updates timestamp)
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, ownerEmail, email } = body;

    const query: any = {};
    if (id) {
      query._id = id;
    } else if (ownerEmail && email) {
      query.ownerEmail = ownerEmail.toLowerCase().trim();
      query.email = email.toLowerCase().trim();
    } else {
      return NextResponse.json({ error: 'id ou (ownerEmail + email) é necessário.' }, { status: 400 });
    }

    const account = await ExternalEmailAccount.findOne(query);
    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 });
    }

    const caller = await verifyOwnerCaller(request, account.ownerEmail);
    if (!caller.ok) {
      return NextResponse.json({ error: 'Não autorizado a sincronizar esta conta externa.' }, { status: 403 });
    }

    const plainPassword = decryptPassword(account.encryptedPassword);
    if (!plainPassword) {
      account.connectionStatus = 'error';
      account.lastError = 'Palavra-passe não configurada ou inválida.';
      await account.save();
      return NextResponse.json(
        { error: 'Credencial não pôde ser recuperada. Por favor, reconecte a conta.' },
        { status: 400 }
      );
    }

    // Test live connection
    const testResult = await migaduImapSmtp.testExternalConnection({
      email: account.email,
      password: plainPassword,
      imapHost: account.imapHost,
      imapPort: account.imapPort,
      imapSecure: account.imapSecure,
      smtpHost: account.smtpHost,
      smtpPort: account.smtpPort,
      smtpSecure: account.smtpSecure,
    });

    if (testResult.success) {
      account.connectionStatus = 'connected';
      account.lastError = undefined;
      account.lastSyncedAt = new Date();
    } else {
      account.connectionStatus = 'error';
      account.lastError = testResult.error || 'Falha ao sincronizar com servidor.';
    }

    await account.save();

    return NextResponse.json({
      success: testResult.success,
      account: {
        id: account._id.toString(),
        email: account.email,
        displayName: account.displayName,
        providerName: account.providerName,
        connectionStatus: account.connectionStatus,
        lastError: account.lastError || null,
        lastSyncedAt: account.lastSyncedAt,
      },
      message: testResult.success
        ? 'Conta sincronizada com sucesso!'
        : `Erro na sincronização: ${account.lastError}`,
    });
  } catch (error: any) {
    console.error('[External Accounts PUT] Error:', error);
    return NextResponse.json({ error: 'Falha ao sincronizar conta externa.' }, { status: 500 });
  }
}

// DELETE - Remove / disconnect an external account
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ownerEmail = (searchParams.get('ownerEmail') || '').toLowerCase().trim();
    const email = (searchParams.get('email') || '').toLowerCase().trim();

    if (id) {
      const existing = await ExternalEmailAccount.findById(id);
      if (!existing) {
        return NextResponse.json({ error: 'Conta externa não encontrada.' }, { status: 404 });
      }
      const caller = await verifyOwnerCaller(request, existing.ownerEmail);
      if (!caller.ok) {
        return NextResponse.json({ error: 'Não autorizado a remover esta conta externa.' }, { status: 403 });
      }
      await ExternalEmailAccount.findByIdAndDelete(id);
    } else if (ownerEmail && email) {
      const caller = await verifyOwnerCaller(request, ownerEmail);
      if (!caller.ok) {
        return NextResponse.json({ error: 'Não autorizado a remover esta conta externa.' }, { status: 403 });
      }
      await ExternalEmailAccount.findOneAndDelete({ ownerEmail, email });
    } else {
      return NextResponse.json(
        { error: 'Parâmetro id ou (ownerEmail + email) é necessário para remover.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conta externa removida com sucesso.',
    });
  } catch (error: any) {
    console.error('[External Accounts DELETE] Error:', error);
    return NextResponse.json({ error: 'Erro ao remover conta externa.' }, { status: 500 });
  }
}

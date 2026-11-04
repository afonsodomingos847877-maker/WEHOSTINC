import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ExternalEmailAccount, ExternalSecurityMode } from '@/models/ExternalEmailAccount';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';
import { encryptPassword, decryptPassword } from '@/lib/encryption';
import { EMAIL_PROVIDER_PRESETS } from '@/lib/externalEmailPresets';

// GET - List connected external email accounts for an owner
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const ownerEmail = (searchParams.get('ownerEmail') || '').toLowerCase().trim();

    if (!ownerEmail) {
      return NextResponse.json({ error: 'ownerEmail é obrigatório' }, { status: 400 });
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

    // 1. Action: Test connection live without saving
    if (action === 'test_connection') {
      if (!cleanEmail || !password || !imapHost || !smtpHost) {
        return NextResponse.json(
          { error: 'Email, senha, servidor IMAP e servidor SMTP são obrigatórios para testar a conexão.' },
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
      if (!cleanOwnerEmail || !cleanEmail) {
        return NextResponse.json({ error: 'ownerEmail e email são obrigatórios' }, { status: 400 });
      }

      const account = await ExternalEmailAccount.findOne({
        ownerEmail: cleanOwnerEmail,
        email: cleanEmail,
        isActive: true,
      });

      if (!account) {
        return NextResponse.json({ error: 'Conta externa não encontrada' }, { status: 404 });
      }

      const plainPassword = decryptPassword(account.encryptedPassword);

      return NextResponse.json({
        success: true,
        account: {
          email: account.email,
          displayName: account.displayName || account.email,
          providerName: account.providerName,
          password: plainPassword,
        },
      });
    }

    // 3. Action: Connect & save new external account
    if (!cleanOwnerEmail || !cleanEmail || !password || !imapHost || !smtpHost) {
      return NextResponse.json(
        {
          error:
            'Preencha todos os campos obrigatórios (E-mail, Palavra-passe, Servidor IMAP e Servidor SMTP).',
        },
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
      { ownerEmail: cleanOwnerEmail, email: cleanEmail },
      {
        ownerEmail: cleanOwnerEmail,
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

    return NextResponse.json({
      success: true,
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
      },
    });
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
      await ExternalEmailAccount.findByIdAndDelete(id);
    } else if (ownerEmail && email) {
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

import { NextRequest, NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { connectDB } from '@/lib/mongodb';
import { EmailMigration } from '@/models/EmailMigration';
import { canAccessMailbox, getSessionUser } from '@/lib/serverAuth';
import { assertSafePublicHostname } from '@/lib/ssrfGuard';

// POST - Test connection or start IMAP-to-IMAP email migration
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { 
      action = 'test',
      domain,
      sourceHost,
      sourcePort = 993,
      sourceSecure = true,
      sourceEmail,
      sourcePassword,
      targetEmail,
      targetPassword,
      targetHost = 'imap.migadu.com',
      targetPort = 993,
      targetSecure = true
    } = body;

    const portalUser = await getSessionUser(request);
    const hasMailboxSession = targetEmail
      ? await canAccessMailbox(request, targetEmail)
      : sourceEmail
      ? await canAccessMailbox(request, sourceEmail)
      : false;
    if (!portalUser && !hasMailboxSession) {
      return NextResponse.json({ error: 'Não autorizado. Inicie sessão primeiro.' }, { status: 401 });
    }

    if (!sourceHost || !sourceEmail || !sourcePassword) {
      return NextResponse.json(
        { error: 'Servidor antigo, e-mail e senha de origem são obrigatórios' },
        { status: 400 }
      );
    }

    try {
      await assertSafePublicHostname(String(sourceHost));
      if (targetHost) await assertSafePublicHostname(String(targetHost));
    } catch (ssrfErr: any) {
      return NextResponse.json(
        { error: ssrfErr?.message || 'Host de servidor IMAP não permitido.' },
        { status: 400 }
      );
    }

    // 1. Test Connection Mode
    if (action === 'test') {
      const sourceClient = new ImapFlow({
        host: sourceHost,
        port: Number(sourcePort),
        secure: Boolean(sourceSecure),
        auth: {
          user: sourceEmail,
          pass: sourcePassword
        },
        logger: false,
        tls: { rejectUnauthorized: false }
      });

      try {
        await sourceClient.connect();
        const list = await sourceClient.list();
        const folders = list.map(f => f.path);
        
        let totalEstimated = 0;
        try {
          const status = await sourceClient.status('INBOX', { messages: true });
          totalEstimated = status.messages || 0;
        } catch {}

        await sourceClient.logout();

        return NextResponse.json({
          success: true,
          message: 'Conexão com o servidor antigo realizada com sucesso!',
          folders,
          inboxMessages: totalEstimated
        });
      } catch (connErr: any) {
        return NextResponse.json({
          success: false,
          error: `Falha ao conectar ao servidor antigo: ${connErr.message || 'Verifique host, porta e credenciais'}`
        }, { status: 422 });
      }
    }

    // 2. Start Migration Mode
    if (action === 'start') {
      if (!targetEmail || !targetPassword) {
        return NextResponse.json(
          { error: 'E-mail e senha de destino são obrigatórios para migrar' },
          { status: 400 }
        );
      }

      // Create migration record in DB
      const migration = await EmailMigration.create({
        domain: domain || targetEmail.split('@')[1],
        sourceHost,
        sourcePort: Number(sourcePort),
        sourceSecure: Boolean(sourceSecure),
        sourceEmail,
        targetEmail,
        status: 'running',
        totalFolders: 0,
        totalMessages: 0,
        migratedMessages: 0,
        failedMessages: 0,
        logs: [`Iniciando migração de ${sourceEmail} para ${targetEmail}...`]
      });

      // Run migration asynchronously in background
      (async () => {
        const sourceClient = new ImapFlow({
          host: sourceHost,
          port: Number(sourcePort),
          secure: Boolean(sourceSecure),
          auth: { user: sourceEmail, pass: sourcePassword },
          logger: false,
          tls: { rejectUnauthorized: false }
        });

        const targetClient = new ImapFlow({
          host: targetHost,
          port: Number(targetPort),
          secure: Boolean(targetSecure),
          auth: { user: targetEmail, pass: targetPassword },
          logger: false,
          tls: { rejectUnauthorized: false }
        });

        try {
          await sourceClient.connect();
          await targetClient.connect();

          const folders = await sourceClient.list();
          migration.totalFolders = folders.length;
          migration.logs.push(`Pastas encontradas: ${folders.map(f => f.path).join(', ')}`);
          await migration.save();

          for (const folder of folders) {
            const folderPath = folder.path;
            migration.currentFolder = folderPath;
            await migration.save();

            // Ensure folder exists on target
            try {
              if (folderPath.toUpperCase() !== 'INBOX') {
                await targetClient.mailboxOpen(folderPath).catch(async () => {
                  await targetClient.mailboxCreate(folderPath).catch(() => {});
                });
              }
            } catch {}

            try {
              const lock = await sourceClient.getMailboxLock(folderPath);
              try {
                const mailboxStatus = sourceClient.mailbox;
                const count = (mailboxStatus && typeof mailboxStatus === 'object' && 'exists' in mailboxStatus) 
                  ? Number((mailboxStatus as any).exists) 
                  : 0;

                migration.totalMessages += count;
                migration.logs.push(`Migrando pasta "${folderPath}" (${count} mensagens)...`);
                await migration.save();

                if (count > 0) {
                  // Iterate through all messages
                  for await (const message of sourceClient.fetch('1:*', { source: true, flags: true, internalDate: true })) {
                    try {
                      if (message.source) {
                        const targetPath = folderPath.toUpperCase() === 'INBOX' ? 'INBOX' : folderPath;
                        await targetClient.append(targetPath, message.source, Array.from(message.flags || []), message.internalDate || new Date());
                        migration.migratedMessages += 1;
                      }
                    } catch (msgErr: any) {
                      migration.failedMessages += 1;
                      migration.logs.push(`Erro ao migrar mensagem #${message.seq}: ${msgErr.message}`);
                    }

                    // Periodically save progress
                    if (migration.migratedMessages % 10 === 0) {
                      await migration.save();
                    }
                  }
                }
              } finally {
                lock.release();
              }
            } catch (folderErr: any) {
              migration.logs.push(`Aviso na pasta ${folderPath}: ${folderErr.message}`);
            }
          }

          migration.status = 'completed';
          migration.logs.push(`Migração finalizada com sucesso! ${migration.migratedMessages} mensagens transferidas.`);
          await migration.save();

          await sourceClient.logout();
          await targetClient.logout();
        } catch (err: any) {
          console.error('[IMAP Migration] Fatal error:', err);
          migration.status = 'failed';
          migration.errorMessage = err.message || 'Erro fatal durante a migração';
          migration.logs.push(`Erro fatal: ${err.message}`);
          await migration.save();
          try { await sourceClient.logout(); } catch {}
          try { await targetClient.logout(); } catch {}
        }
      })();

      return NextResponse.json({
        success: true,
        message: 'Migração iniciada em segundo plano!',
        migrationId: migration._id
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('[IMAP Migration POST] Error:', error);
    return NextResponse.json(
      { error: `Falha ao processar migração: ${error.message || 'Erro interno'}` },
      { status: 500 }
    );
  }
}

// GET - Check migration status by ID or domain
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const domain = searchParams.get('domain');

    if (id) {
      const migration = await EmailMigration.findById(id);
      if (!migration) return NextResponse.json({ error: 'Migração não encontrada' }, { status: 404 });
      return NextResponse.json({ success: true, migration });
    }

    if (domain) {
      const migrations = await EmailMigration.find({ domain: new RegExp(`^${domain}$`, 'i') })
        .sort({ createdAt: -1 })
        .limit(10);
      return NextResponse.json({ success: true, migrations });
    }

    const recentMigrations = await EmailMigration.find().sort({ createdAt: -1 }).limit(10);
    return NextResponse.json({ success: true, migrations: recentMigrations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao consultar migração' }, { status: 500 });
  }
}

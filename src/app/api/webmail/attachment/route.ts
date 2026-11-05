import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';
import { connectDB } from '@/lib/mongodb';
import { ExternalEmailAccount } from '@/models/ExternalEmailAccount';
import { decryptPassword } from '@/lib/encryption';

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') || '').trim().toLowerCase();
    let password = searchParams.get('password') || '';
    const folder = searchParams.get('folder') || 'INBOX';
    const uid = parseInt(searchParams.get('uid') || '0', 10);
    const part = parseInt(searchParams.get('part') || '0', 10);
    const filename = searchParams.get('filename') || 'anexo';

    if (!email || !uid) {
      return NextResponse.json({ error: 'Email e UID são obrigatórios' }, { status: 400 });
    }

    // Se senha não fornecida na query string, tentar encontrar em ExternalEmailAccount
    if (!password) {
      try {
        await connectDB();
        const ext = await ExternalEmailAccount.findOne({
          email: email,
          isActive: true
        });
        if (ext && ext.encryptedPassword) {
          password = decryptPassword(ext.encryptedPassword);
        }
      } catch (dbErr) {
        console.warn('[Webmail Attachment] Failed to lookup external account:', dbErr);
      }
    }

    if (!password) {
      return NextResponse.json({ error: 'Credenciais necessárias para descarregar o anexo' }, { status: 401 });
    }

    const message = await migaduImapSmtp.getMessage(email, password, uid, folder);
    if (!message || !message.attachments || !message.attachments[part]) {
      return NextResponse.json({ error: 'Anexo não encontrado' }, { status: 404 });
    }

    const targetAtt = message.attachments[part];
    let fileBuffer: Buffer | null = null;

    if (targetAtt.url && targetAtt.url.startsWith('data:')) {
      const base64Data = targetAtt.url.split(',')[1];
      if (base64Data) {
        fileBuffer = Buffer.from(base64Data, 'base64');
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: 'Falha ao extrair o conteúdo do anexo' }, { status: 500 });
    }

    const safeFilename = encodeURIComponent(targetAtt.filename || filename);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': targetAtt.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${targetAtt.filename || filename}"; filename*=UTF-8''${safeFilename}`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch (error: any) {
    console.error('[Webmail Attachment] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao descarregar o anexo' },
      { status: 500 }
    );
  }
}

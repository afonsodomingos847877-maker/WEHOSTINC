import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';
import { connectDB } from '@/lib/mongodb';
import { ExternalEmailAccount } from '@/models/ExternalEmailAccount';
import { decryptPassword } from '@/lib/encryption';

// GET - List messages from IMAP
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') || '').trim();
    let password = searchParams.get('password') || '';
    const folder = searchParams.get('folder') || 'INBOX';

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // If password was not passed via query string, try resolving from ExternalEmailAccount
    if (!password) {
      try {
        await connectDB();
        const ext = await ExternalEmailAccount.findOne({
          email: email.toLowerCase(),
          isActive: true
        });
        if (ext && ext.encryptedPassword) {
          password = decryptPassword(ext.encryptedPassword);
        }
      } catch (dbErr) {
        console.warn('[Webmail Messages] Failed to lookup external account:', dbErr);
      }
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const imapMessages = await migaduImapSmtp.listMessages(email, password, folder);
    
    // Convert to WebmailMessage format
    const messages = imapMessages.map(msg => ({
      id: msg.id,
      uid: msg.uid,
      accountEmail: email,
      fromName: msg.from.name || msg.from.address.split('@')[0],
      fromEmail: msg.from.address,
      toEmail: msg.to[0]?.address || '',
      subject: msg.subject || '(Sem assunto)',
      body: msg.body,
      textPreview: msg.textPreview,
      date: msg.date.toISOString(),
      isRead: msg.isRead,
      starred: msg.starred,
      folder: folder.toLowerCase(),
      avatarColor: 'bg-primary-600',
      attachments: msg.attachments?.map(att => ({
        url: att.url || '',
        name: att.filename,
        size: att.size,
        type: att.contentType,
        cid: att.cid,
        related: att.related
      }))
    }));

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('[Webmail Messages] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

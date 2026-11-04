import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';
import { connectDB } from '@/lib/mongodb';
import { ExternalEmailAccount } from '@/models/ExternalEmailAccount';
import { decryptPassword } from '@/lib/encryption';

export const maxDuration = 60;

async function resolveAttachmentToBuffer(att: any): Promise<{
  filename: string;
  content: Buffer;
  contentType?: string;
} | null> {
  if (!att || !att.url || typeof att.url !== 'string') return null;

  // 1. Data URL (data:mime;base64,...)
  if (att.url.startsWith('data:')) {
    const base64Data = att.url.split(',')[1];
    if (!base64Data) return null;
    return {
      filename: att.name || 'anexo',
      content: Buffer.from(base64Data, 'base64'),
      contentType: att.type || 'application/octet-stream',
    };
  }

  // 2. Remote URL (Cloudinary CDN https://res.cloudinary.com/...)
  if (att.url.startsWith('http://') || att.url.startsWith('https://')) {
    try {
      const res = await fetch(att.url);
      if (!res.ok) {
        console.error(`[Webmail Send] Falha ao baixar anexo Cloudinary (${res.status}):`, att.url);
        return null;
      }
      const arrayBuffer = await res.arrayBuffer();
      const contentType = att.type && att.type.includes('/')
        ? att.type
        : res.headers.get('content-type') || 'application/octet-stream';
      return {
        filename: att.name || 'anexo',
        content: Buffer.from(arrayBuffer),
        contentType,
      };
    } catch (err) {
      console.error('[Webmail Send] Erro ao buscar anexo remoto:', err);
      return null;
    }
  }

  return null;
}

// POST - Send email via SMTP (supports WeHostHere Migadu mailboxes and external connected accounts)
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let email = '';
    let password = '';
    let to: any = '';
    let cc: any = '';
    let bcc: any = '';
    let subject = '';
    let emailBody = '';
    let priority: 'high' | 'normal' | 'low' = 'normal';
    let processedAttachments: Array<{
      filename: string;
      content: Buffer;
      contentType?: string;
    }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      email = String(formData.get('email') || '');
      password = String(formData.get('password') || '');
      to = String(formData.get('to') || '');
      cc = String(formData.get('cc') || '');
      bcc = String(formData.get('bcc') || '');
      subject = String(formData.get('subject') || '');
      emailBody = String(formData.get('body') || '');
      priority = (String(formData.get('priority') || 'normal') as 'high' | 'normal' | 'low');

      const files = formData.getAll('files');
      for (const item of files) {
        if (item && typeof (item as any).arrayBuffer === 'function') {
          const fileObj = item as File;
          const arrayBuffer = await fileObj.arrayBuffer();
          processedAttachments.push({
            filename: fileObj.name || 'anexo',
            content: Buffer.from(arrayBuffer),
            contentType: fileObj.type || 'application/octet-stream',
          });
        }
      }

      const remoteAttachmentsRaw = formData.get('remoteAttachments');
      if (remoteAttachmentsRaw && typeof remoteAttachmentsRaw === 'string') {
        try {
          const parsedRemote = JSON.parse(remoteAttachmentsRaw);
          if (Array.isArray(parsedRemote)) {
            const resolved = await Promise.all(parsedRemote.map(resolveAttachmentToBuffer));
            for (const item of resolved) {
              if (item) processedAttachments.push(item);
            }
          }
        } catch {}
      }
    } else {
      const body = await request.json();
      email = body.email;
      password = body.password;
      to = body.to;
      cc = body.cc;
      bcc = body.bcc;
      subject = body.subject;
      emailBody = body.body;
      priority = body.priority || 'normal';

      if (Array.isArray(body.attachments) && body.attachments.length > 0) {
        const resolved = await Promise.all(body.attachments.map(resolveAttachmentToBuffer));
        processedAttachments = resolved.filter((a): a is NonNullable<typeof a> => a !== null);
      }
    }

    const cleanEmail = (email || '').trim().toLowerCase();

    // If password not passed in payload, look up external account credentials
    if (!password && cleanEmail) {
      try {
        await connectDB();
        const ext = await ExternalEmailAccount.findOne({
          email: cleanEmail,
          isActive: true
        });
        if (ext && ext.encryptedPassword) {
          password = decryptPassword(ext.encryptedPassword);
        }
      } catch (dbErr) {
        console.warn('[Webmail Send] Failed to lookup external account:', dbErr);
      }
    }

    if (!cleanEmail || !password || !to || (!emailBody && processedAttachments.length === 0)) {
      return NextResponse.json(
        { error: 'E-mail, palavra-passe, destinatário e conteúdo são obrigatórios.' },
        { status: 400 }
      );
    }

    const parseRecipients = (val: any): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val.filter(Boolean);
      if (typeof val === 'string') return val.split(',').map((s: string) => s.trim()).filter(Boolean);
      return [];
    };

    const plainText = typeof emailBody === 'string'
      ? emailBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      : '';

    await migaduImapSmtp.sendEmail({
      from: cleanEmail,
      to: parseRecipients(to),
      cc: parseRecipients(cc),
      bcc: parseRecipients(bcc),
      subject: subject || '(Sem assunto)',
      text: plainText || emailBody || '(Anexo enviado)',
      html: emailBody || `<p>${plainText || '(Anexo enviado)'}</p>`,
      priority: priority || 'normal',
      attachments: processedAttachments.length > 0 ? processedAttachments : undefined,
    }, password);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Webmail Send] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao enviar e-mail pelo servidor SMTP.' },
      { status: 500 }
    );
  }
}

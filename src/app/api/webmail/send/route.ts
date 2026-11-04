import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';

export const maxDuration = 60;

// POST - Send email via SMTP (supports both multipart/form-data binary attachments and application/json)
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

      if (Array.isArray(body.attachments)) {
        processedAttachments = body.attachments
          .map((att: any) => {
            if (att?.url && typeof att.url === 'string' && att.url.startsWith('data:')) {
              const base64Data = att.url.split(',')[1];
              if (!base64Data) return null;
              return {
                filename: att.name || 'anexo',
                content: Buffer.from(base64Data, 'base64'),
                contentType: att.type || 'application/octet-stream',
              };
            }
            return null;
          })
          .filter((a: any): a is NonNullable<typeof a> => a !== null);
      }
    }

    if (!email || !password || !to || (!emailBody && processedAttachments.length === 0)) {
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
      from: email.trim(),
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

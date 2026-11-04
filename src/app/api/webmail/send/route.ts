import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';

// POST - Send email via SMTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, to, cc, bcc, subject, body: emailBody, attachments, priority } = body;

    if (!email || !password || !to || !emailBody) {
      return NextResponse.json(
        { error: 'Email, password, to, and body are required' },
        { status: 400 }
      );
    }

    // Process attachments
    const processedAttachments = attachments?.map((att: any) => {
      if (att.url && att.url.startsWith('data:')) {
        const base64Data = att.url.split(',')[1];
        return {
          filename: att.name,
          content: Buffer.from(base64Data, 'base64'),
          contentType: att.type
        };
      }
      return null;
    }).filter((a: any) => a !== null);

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
      text: plainText || emailBody,
      html: emailBody,
      priority: priority || 'normal',
      attachments: processedAttachments
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

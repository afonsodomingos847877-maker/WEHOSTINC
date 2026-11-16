import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';
import { isDemoAccount } from '@/lib/demoWebmailData';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, to, cc, bcc, subject, body: htmlBody, previousUid } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    if (isDemoAccount(email)) {
      return NextResponse.json({ success: true, isDemo: true, uid: null });
    }

    if (!password) {
      return NextResponse.json({ error: 'Palavra-passe é obrigatória' }, { status: 400 });
    }

    const parseList = (v: unknown): string[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
      return String(v)
        .split(/[,;\s]+/)
        .map((x) => x.trim())
        .filter((x) => x.includes('@'));
    };

    const rawHtml = String(htmlBody || '');
    const plainText = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const uid = await migaduImapSmtp.saveDraftMessage(
      {
        from: String(email).trim(),
        to: parseList(to),
        cc: parseList(cc),
        bcc: parseList(bcc),
        subject: String(subject || ''),
        text: plainText,
        html: rawHtml,
      },
      String(password),
      previousUid ? Number(previousUid) : undefined
    );

    return NextResponse.json({ success: true, uid });
  } catch (error) {
    console.error('[Webmail Draft] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao guardar rascunho no servidor' },
      { status: 500 }
    );
  }
}

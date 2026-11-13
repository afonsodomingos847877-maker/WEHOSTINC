import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';

// POST - Delete message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, uid, folder } = body;

    if (email && email.toLowerCase().trim() === 'teste@wehosthere.com') {
      return NextResponse.json({ success: true, isDemo: true });
    }

    const numericUid = Number(uid);
    if (!email || !password || isNaN(numericUid) || !folder) {
      return NextResponse.json(
        { error: 'Email, password, valid numeric uid, and folder are required' },
        { status: 400 }
      );
    }

    await migaduImapSmtp.deleteMessage(email, password, numericUid, folder);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webmail Delete] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete message' },
      { status: 500 }
    );
  }
}

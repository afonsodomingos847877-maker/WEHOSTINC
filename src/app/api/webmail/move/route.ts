import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';

// POST - Move message to folder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, uid, fromFolder, toFolder } = body;

    if (email && email.toLowerCase().trim() === 'teste@wehosthere.com') {
      return NextResponse.json({ success: true, isDemo: true });
    }

    const numericUid = Number(uid);
    if (!email || !password || isNaN(numericUid) || !fromFolder || !toFolder) {
      return NextResponse.json(
        { error: 'Email, password, valid numeric uid, fromFolder, and toFolder are required' },
        { status: 400 }
      );
    }

    await migaduImapSmtp.moveMessage(email, password, numericUid, fromFolder, toFolder);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webmail Move] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to move message' },
      { status: 500 }
    );
  }
}

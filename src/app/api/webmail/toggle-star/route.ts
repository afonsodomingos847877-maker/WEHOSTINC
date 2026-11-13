import { NextRequest, NextResponse } from 'next/server';
import { migaduImapSmtp } from '@/lib/migaduImapSmtp';

// POST - Toggle star on message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, uid, folder, starred } = body;

    if (email && email.toLowerCase().trim() === 'teste@wehosthere.com') {
      return NextResponse.json({ success: true, isDemo: true });
    }

    const numericUid = Number(uid);
    if (!email || !password || isNaN(numericUid)) {
      return NextResponse.json(
        { error: 'Email, password, and valid numeric uid are required' },
        { status: 400 }
      );
    }

    await migaduImapSmtp.toggleStar(email, password, numericUid, starred !== false, folder || 'INBOX');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webmail Toggle Star] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle star' },
      { status: 500 }
    );
  }
}

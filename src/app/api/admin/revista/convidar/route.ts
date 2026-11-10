import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { sendRevistaInviteEmail } from '@/lib/sendgrid';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    const body = await req.json();
    const { toEmail, inviteeName, proposedTopic, customNote, category } = body;

    if (!toEmail || !toEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Por favor, forneça um endereço de e-mail válido.' },
        { status: 400 }
      );
    }

    if (!inviteeName || !inviteeName.trim()) {
      return NextResponse.json(
        { error: 'Por favor, indique o nome do convidado.' },
        { status: 400 }
      );
    }

    const emailRes = await sendRevistaInviteEmail({
      toEmail: toEmail.trim(),
      inviteeName: inviteeName.trim(),
      proposedTopic: proposedTopic?.trim() || undefined,
      customNote: customNote?.trim() || undefined,
      category: category?.trim() || undefined,
    });

    if (!emailRes.success) {
      return NextResponse.json(
        { error: emailRes.error || 'Erro ao disparar e-mail de convite.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Convite enviado com sucesso para ${inviteeName} (${toEmail})!`,
    });
  } catch (err: any) {
    console.error('[Revista Convidar POST]', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao processar convite.' },
      { status: 500 }
    );
  }
}

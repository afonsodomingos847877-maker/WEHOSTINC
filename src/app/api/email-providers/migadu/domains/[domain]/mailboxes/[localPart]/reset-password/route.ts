import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailMailbox } from '@/models/EmailMailbox';
import { connectDB } from '@/lib/mongodb';
import { canAccessDomain } from '@/lib/serverAuth';

// POST - Reset mailbox password
export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string; localPart: string } }
) {
  try {
    const access = await canAccessDomain(request, params.domain);
    if (!access) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { domain, localPart } = params;
    const body = await request.json();
    const { newPassword } = body;
    const email = `${localPart}@${domain}`;

    const mailbox = await EmailMailbox.findOne({ email });
    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 });
    }

    // 🔒 Verify ownership: customer can only reset their own domain/mailbox
    if (!access.isAdmin && mailbox.customerId !== access.user.id && mailbox.customerId !== access.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const provider = getEmailProvider();
    const password = await provider.resetMailboxPassword(domain, localPart, newPassword);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      // 🔒 NÃO retornar a password real
      password: 'Password foi alterada com sucesso'
    });
  } catch (error) {
    console.error('[Migadu Mailbox Reset Password POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

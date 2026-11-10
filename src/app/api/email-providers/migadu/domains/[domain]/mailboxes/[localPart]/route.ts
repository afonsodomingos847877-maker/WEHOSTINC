import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailMailbox } from '@/models/EmailMailbox';
import EmailAccountModel from '@/lib/models/EmailAccount';
import { connectDB } from '@/lib/mongodb';
import { canAccessDomain, canAccessMailbox } from '@/lib/serverAuth';

// GET - Get mailbox details
export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string; localPart: string } }
) {
  try {
    const { domain, localPart } = params;
    const email = `${localPart}@${domain}`;
    if (!(await canAccessMailbox(request, email))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    await connectDB();

    let mailbox: any = await EmailMailbox.findOne({ email: new RegExp(`^${email}$`, 'i') });
    
    // If not in DB, try to fetch directly from Migadu provider
    if (!mailbox) {
      try {
        const provider = getEmailProvider();
        if (provider.isConfigured()) {
          const provMailbox = await provider.getMailbox(domain, localPart);
          if (provMailbox) {
            mailbox = provMailbox;
          }
        }
      } catch (e) {
        // Mailbox not found on provider
      }
    }

    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 });
    }

    const mailboxData = mailbox.toObject ? mailbox.toObject() : mailbox;
    if (mailboxData.password) delete mailboxData.password;

    return NextResponse.json({
      success: true,
      mailbox: mailboxData
    });
  } catch (error) {
    console.error('[Migadu Mailbox GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get mailbox' },
      { status: 500 }
    );
  }
}

// PUT - Update mailbox (e.g. suspend, activate, change password, rename)
export async function PUT(
  request: NextRequest,
  { params }: { params: { domain: string; localPart: string } }
) {
  try {
    await connectDB();
    const { domain, localPart } = params;
    const rawBody = await request.json();
    const email = `${localPart}@${domain}`;

    const domainAccess = await canAccessDomain(request, domain);
    const mailboxAccess = domainAccess ? true : await canAccessMailbox(request, email);
    if (!mailboxAccess) {
      return NextResponse.json({ error: 'Não autorizado a alterar esta caixa de correio' }, { status: 401 });
    }

    // Se o utilizador apenas tem acesso à própria caixa via Webmail (não é dono do domínio nem admin), só pode alterar a própria password
    const body = domainAccess ? rawBody : (rawBody.password ? { password: rawBody.password } : null);
    if (!body) {
      return NextResponse.json({ error: 'Permissões insuficientes para alterar definições administrativas da caixa.' }, { status: 403 });
    }

    const provider = getEmailProvider();
    let updatedProvMailbox: any = null;

    if (provider.isConfigured()) {
      try {
        updatedProvMailbox = await provider.updateMailbox(domain, localPart, body);
      } catch (provErr: any) {
        console.error('[Migadu Mailbox PUT] Provider update error:', provErr);
        if (body.password) {
          return NextResponse.json(
            { error: provErr?.message || 'Falha ao atualizar a senha no servidor Migadu' },
            { status: 500 }
          );
        }
      }
    }

    const isSuspended = body.status === 'suspended' || 
      body.maySend === false || 
      body.mayReceive === false || 
      body.is_disabled === true;

    const newStatus = isSuspended ? 'suspended' : 'active';

    // Update in EmailMailbox
    const updatedMailbox = await EmailMailbox.findOneAndUpdate(
      { email: new RegExp(`^${email}$`, 'i') },
      {
        $set: {
          status: newStatus,
          maySend: !isSuspended,
          mayReceive: !isSuspended,
          name: body.name || undefined,
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );

    // Also update in EmailAccountModel
    await EmailAccountModel.updateMany(
      { email: new RegExp(`^${email}$`, 'i') },
      {
        $set: {
          status: newStatus,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      mailbox: updatedProvMailbox || updatedMailbox,
      message: isSuspended ? 'Conta suspensa com sucesso' : 'Conta ativada com sucesso'
    });
  } catch (error) {
    console.error('[Migadu Mailbox PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update mailbox' },
      { status: 500 }
    );
  }
}

// DELETE - Delete mailbox
export async function DELETE(
  request: NextRequest,
  { params }: { params: { domain: string; localPart: string } }
) {
  try {
    const { domain, localPart } = params;
    const access = await canAccessDomain(request, domain);
    if (!access) {
      return NextResponse.json({ error: 'Não autorizado a eliminar caixas de correio deste domínio' }, { status: 401 });
    }
    await connectDB();
    const email = `${localPart}@${domain}`;

    const provider = getEmailProvider();
    try {
      if (provider.isConfigured()) {
        await provider.deleteMailbox(domain, localPart);
      }
    } catch (provErr) {
      console.warn('[Migadu Mailbox DELETE] Provider delete warning:', provErr);
    }

    // Delete from both EmailMailbox and EmailAccountModel
    await Promise.all([
      EmailMailbox.deleteMany({ email: new RegExp(`^${email}$`, 'i') }),
      EmailAccountModel.deleteMany({ email: new RegExp(`^${email}$`, 'i') })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Mailbox deleted successfully'
    });
  } catch (error) {
    console.error('[Migadu Mailbox DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete mailbox' },
      { status: 500 }
    );
  }
}


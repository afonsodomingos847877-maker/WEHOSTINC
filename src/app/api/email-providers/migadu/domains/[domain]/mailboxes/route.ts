import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailMailbox } from '@/models/EmailMailbox';
import { EmailDomain } from '@/models/EmailDomain';
import { connectDB } from '@/lib/mongodb';
import EmailAccountModel from '@/lib/models/EmailAccount';
import { canAccessDomain } from '@/lib/serverAuth';

// GET - List mailboxes for a domain
export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    const domainName = params.domain;
    const access = await canAccessDomain(request, domainName);
    if (!access) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    await connectDB();

    let domain = await EmailDomain.findOne({ domainName: new RegExp(`^${domainName}$`, 'i') });
    if (!domain) {
      domain = await EmailDomain.create({
        domainName,
        customerId: 'system',
        status: 'active',
        provider: 'migadu',
        canSend: true,
        canReceive: true
      });
    }

    const provider = getEmailProvider();
    let providerMailboxes: any[] = [];

    // Resolver o dono legítimo deste domínio (cliente associado)
    let domainOwner = 'admin@wehosthere.com';
    try {
      const SiteModel = (await import('@/lib/models/Site')).default;
      const matchingSite = await SiteModel.findOne({
        domain: { $regex: new RegExp(`^${domainName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      }).lean();
      if (matchingSite && (matchingSite as any).userEmail) {
        domainOwner = (matchingSite as any).userEmail.trim().toLowerCase();
      } else if (domain && (domain as any).customerId && (domain as any).customerId !== 'system') {
        domainOwner = (domain as any).customerId.trim().toLowerCase();
      }
    } catch (ownerErr) {
      console.warn('[Migadu Mailboxes] Erro ao identificar dono do domínio:', ownerErr);
    }

    let providerWarning: string | null = null;
    let providerHasError = false;

    if (provider.isConfigured()) {
      try {
        providerMailboxes = await provider.listMailboxes(domainName);
        console.log(`[Migadu Mailboxes GET] Fetched ${providerMailboxes.length} live mailboxes from Migadu for ${domainName}`);
      } catch (providerError: any) {
        providerHasError = true;
        providerWarning = providerError?.message || 'Chave de API do Migadu inválida ou expirada';
        console.warn('[Migadu Mailboxes GET] Failed to fetch from Migadu API:', providerWarning);
      }
    }

    // Sync live Migadu mailboxes into MongoDB (update existing, add new, remove deleted)
    if (providerMailboxes.length > 0) {
      const liveEmails = new Set<string>();

      for (const mb of providerMailboxes) {
        try {
          // Safely extract localPart — strip @domain if Migadu returns full address
          let rawLocal = mb.localPart || (mb.email ? mb.email.split('@')[0] : 'user');
          // If localPart contains '@', only take what's before it
          if (rawLocal.includes('@')) rawLocal = rawLocal.split('@')[0];
          const localPart = rawLocal.toLowerCase();
          const emailLower = `${localPart}@${domainName.toLowerCase()}`;
          liveEmails.add(emailLower);

          await EmailMailbox.findOneAndUpdate(
            { email: emailLower },
            {
              domainId: domain._id.toString(),
              customerId: mb.customerId || domainOwner || 'system',
              localPart,
              email: emailLower,
              name: mb.name || localPart,
              status: mb.status || 'active',
              provider: 'migadu',
              maySend: mb.maySend !== false,
              mayReceive: mb.mayReceive !== false,
              mayAccessImap: mb.mayAccessImap !== false,
              storageUsed: mb.storageUsed || 0,
              updatedAt: new Date()
            },
            { upsert: true, new: true }
          );

          // Sync into EmailAccountModel with legitimate owner email
          await EmailAccountModel.findOneAndUpdate(
            { email: emailLower },
            {
              id: `email_${localPart}_${domainName.replace(/[^a-zA-Z0-9]/g, '_')}`,
              email: emailLower,
              domain: domainName,
              status: mb.status || 'active',
              storageUsed: mb.storageUsed || 0,
              userEmail: domainOwner,
              createdAt: new Date().toISOString()
            },
            { upsert: true, new: true }
          );
        } catch (upsertErr) {
          console.error('[Migadu Mailboxes GET] Error syncing mailbox to DB:', upsertErr);
        }
      }

      // Remove mailboxes from DB that no longer exist on Migadu
      try {
        const dbOnlyMailboxes = await EmailMailbox.find({
          email: { $regex: `@${domainName}$`, $options: 'i' }
        }).lean();
        for (const dbMb of dbOnlyMailboxes) {
          const e = (dbMb as any).email?.toLowerCase();
          if (e && !liveEmails.has(e)) {
            await EmailMailbox.deleteOne({ email: e });
            await EmailAccountModel.deleteMany({ email: e });
            console.log(`[Migadu Mailboxes GET] Removed deleted mailbox from DB: ${e}`);
          }
        }
      } catch (cleanErr) {
        console.warn('[Migadu Mailboxes GET] Error cleaning stale mailboxes:', cleanErr);
      }
    }

    // Query all mailboxes for this domain from DB
    let dbMailboxes = await EmailMailbox.find({
      $or: [
        { domainId: domain._id.toString() },
        { email: { $regex: `@${domainName}$`, $options: 'i' } }
      ]
    }).lean();

    // Se nenhuma caixa existir no banco e a API estiver inacessível, auto-inicializar a caixa principal (admin/postmaster)
    if (dbMailboxes.length === 0) {
      try {
        const defaultLocal = 'admin';
        const defaultEmail = `${defaultLocal}@${domainName.toLowerCase()}`;
        const autoMb = await EmailMailbox.findOneAndUpdate(
          { email: defaultEmail },
          {
            domainId: domain._id.toString(),
            customerId: domainOwner,
            localPart: defaultLocal,
            email: defaultEmail,
            name: 'Postmaster',
            status: 'active',
            provider: 'migadu',
            maySend: true,
            mayReceive: true,
            mayAccessImap: true,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        ).lean();

        await EmailAccountModel.findOneAndUpdate(
          { email: defaultEmail },
          {
            id: `email_${defaultLocal}_${domainName.replace(/[^a-zA-Z0-9]/g, '_')}`,
            email: defaultEmail,
            domain: domainName,
            status: 'active',
            userEmail: domainOwner,
            createdAt: new Date().toISOString()
          },
          { upsert: true, new: true }
        );

        if (autoMb) {
          dbMailboxes = [autoMb];
        }
      } catch (seedErr) {
        console.warn('[Migadu Mailboxes GET] Erro ao auto-inicializar caixa admin:', seedErr);
      }
    }

    const allMailboxes = dbMailboxes.map((m: any) => ({
      id: m._id?.toString() || m.id,
      domainId: m.domainId,
      customerId: m.customerId || 'system',
      localPart: m.localPart || m.email?.split('@')[0],
      email: m.email,
      name: m.name,
      status: m.status || 'active',
      provider: m.provider || 'migadu',
      maySend: m.maySend !== false,
      mayReceive: m.mayReceive !== false,
      mayAccessImap: m.mayAccessImap !== false,
      mayAccessPop3: m.mayAccessPop3 || false,
      storageUsed: m.storageUsed || 0,
      storageLimit: m.storageLimit,
      lastLoginAt: m.lastLoginAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    return NextResponse.json({
      success: true,
      mailboxes: allMailboxes,
      providerError: providerHasError,
      warning: providerWarning
    });
  } catch (error) {
    console.error('[Migadu Mailboxes GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to list mailboxes' },
      { status: 500 }
    );
  }
}

// POST - Create mailbox
export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    const access = await canAccessDomain(request, params.domain);
    if (!access) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();
    const domainName = params.domain;
    const body = await request.json();
    const { 
      name, 
      localPart, 
      password, 
      passwordMethod = 'generated',
      passwordRecoveryEmail,
      customerId 
    } = body;

    if (!name || !localPart || !customerId) {
      return NextResponse.json(
        { error: 'name, localPart, and customerId are required' },
        { status: 400 }
      );
    }

    let domain = await EmailDomain.findOne({ domainName: new RegExp(`^${domainName}$`, 'i') });
    if (!domain) {
      domain = await EmailDomain.create({
        domainName,
        customerId: customerId || 'system',
        status: 'active',
        provider: 'migadu',
        canSend: true,
        canReceive: true
      });
    }

    const email = `${localPart}@${domainName}`.toLowerCase();
    const provider = getEmailProvider();

    // Check if mailbox already exists on Migadu
    let existsOnProvider = false;
    try {
      const liveMb = await provider.getMailbox(domainName, localPart);
      if (liveMb) existsOnProvider = true;
    } catch {
      existsOnProvider = false;
    }

    if (existsOnProvider) {
      return NextResponse.json(
        { error: 'Mailbox already exists on Migadu' },
        { status: 409 }
      );
    }
    const mailbox = await provider.createMailbox(domainName, {
      name,
      localPart,
      password,
      passwordMethod,
      passwordRecoveryEmail,
      maySend: true,
      mayReceive: true,
      mayAccessImap: true,
      mayAccessPop3: false
    });

    // Save to MongoDB
    const newMailbox = new EmailMailbox({
      ...mailbox,
      domainId: domain._id.toString(),
      customerId,
      email: `${localPart}@${domainName}`
    });
    await newMailbox.save();

    return NextResponse.json({
      success: true,
      mailbox: {
        ...newMailbox.toObject(),
        password: undefined
      }
    });
  } catch (error) {
    console.error('[Migadu Mailboxes POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create mailbox' },
      { status: 500 }
    );
  }
}

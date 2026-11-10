import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { EmailMailbox } from '@/models/EmailMailbox';
import { connectDB } from '@/lib/mongodb';
import { canAccessDomain, requireAdmin } from '@/lib/serverAuth';

// GET - Get domain details
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
    
    // First check our database (case-insensitive)
    let domain: any = await EmailDomain.findOne({ domainName: new RegExp(`^${domainName}$`, 'i') });
    
    const provider = getEmailProvider();
    let dnsRecords: any[] = [];

    if (provider.isConfigured()) {
      try {
        const providerDomain = await provider.getDomain(domainName);
        if (providerDomain) {
          if (!domain) {
            domain = await EmailDomain.create({
              domainName,
              customerId: 'system',
              status: providerDomain.status || 'pending_dns',
              provider: 'migadu',
              canSend: providerDomain.canSend || false,
              canReceive: providerDomain.canReceive || false,
            });
          } else {
            const preservedCustomerId = domain.customerId;
            domain.status = providerDomain.status || domain.status;
            domain.provider = providerDomain.provider || domain.provider;
            domain.canSend = providerDomain.canSend ?? domain.canSend;
            domain.canReceive = providerDomain.canReceive ?? domain.canReceive;
            if (providerDomain.activatedAt) domain.activatedAt = providerDomain.activatedAt;
            if (preservedCustomerId && preservedCustomerId !== 'system') {
              domain.customerId = preservedCustomerId;
            } else if (providerDomain.customerId && providerDomain.customerId !== 'system') {
              domain.customerId = providerDomain.customerId;
            }
            await domain.save();
          }
        }
      } catch (provErr) {
        console.warn('[Migadu Domain GET] Provider fetch warning:', provErr);
      }

      try {
        dnsRecords = await provider.getDNSRecords(domainName);
      } catch (dnsErr) {
        console.warn('[Migadu Domain GET] DNS records fetch warning:', dnsErr);
      }
    }

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const domainData = domain.toObject ? domain.toObject() : domain;
    if (dnsRecords && dnsRecords.length > 0) {
      domainData.dnsRecords = dnsRecords;
    }

    return NextResponse.json({
      success: true,
      domain: domainData
    });
  } catch (error) {
    console.error('[Migadu Domain GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get domain' },
      { status: 500 }
    );
  }
}

// PUT - Update domain
export async function PUT(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const domainName = params.domain;
    const body = await request.json();

    let domain: any = await EmailDomain.findOne({ domainName: new RegExp(`^${domainName}$`, 'i') });
    
    const provider = getEmailProvider();
    let updatedDomain: any = null;

    if (provider.isConfigured()) {
      try {
        updatedDomain = await provider.updateDomain(domainName, body);
      } catch (provErr) {
        console.warn('[Migadu Domain PUT] Provider update warning:', provErr);
      }
    }

    if (domain) {
      Object.assign(domain, updatedDomain || body);
      await domain.save();
    }

    return NextResponse.json({
      success: true,
      domain: updatedDomain || domain
    });
  } catch (error) {
    console.error('[Migadu Domain PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    );
  }
}

import SiteModel from '@/lib/models/Site';
import EmailAccountModel from '@/lib/models/EmailAccount';

// DELETE - Delete domain
export async function DELETE(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const domainName = params.domain;
    
    console.log('[Migadu Domain DELETE] Starting deletion for domain:', domainName);

    const domain = await EmailDomain.findOne({ domainName });
    console.log('[Migadu Domain DELETE] Domain found in DB:', !!domain);

    const provider = getEmailProvider();
    try {
      if (provider.isConfigured()) {
        console.log('[Migadu Domain DELETE] Deleting from provider...');
        await provider.deleteDomain(domainName);
        console.log('[Migadu Domain DELETE] Provider deletion successful');
      }
    } catch (provErr) {
      console.warn('[Migadu Domain DELETE] Provider delete warning (may already be removed on provider):', provErr);
    }

    // Cascaded removal from all MongoDB collections
    console.log('[Migadu Domain DELETE] Starting cascaded MongoDB deletion...');
    const results = await Promise.all([
      EmailDomain.deleteMany({ domainName: new RegExp(`^${domainName}$`, 'i') }),
      SiteModel.deleteMany({ domain: new RegExp(`^${domainName}$`, 'i') }),
      EmailMailbox.deleteMany({ 
        $or: [
          { email: { $regex: `@${domainName}$`, $options: 'i' } },
          ...(domain ? [{ domainId: domain._id.toString() }] : [])
        ] 
      }),
      EmailAccountModel.deleteMany({
        $or: [
          { domain: new RegExp(`^${domainName}$`, 'i') },
          { email: { $regex: `@${domainName}$`, $options: 'i' } }
        ]
      })
    ]);
    
    console.log('[Migadu Domain DELETE] MongoDB deletion results:', results);

    return NextResponse.json({
      success: true,
      message: `Domain ${domainName} and all associated mailboxes deleted successfully`
    });
  } catch (error) {
    console.error('[Migadu Domain DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}

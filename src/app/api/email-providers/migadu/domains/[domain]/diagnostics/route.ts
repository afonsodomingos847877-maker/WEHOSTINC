import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { connectDB } from '@/lib/mongodb';
import { canAccessDomain, requireAdmin } from '@/lib/serverAuth';

// GET - Run DNS diagnostics for a domain
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

    let domain = await EmailDomain.findOne({ domainName });

    const provider = getEmailProvider();

    let diagnostics: any = null;
    let activatedDomain: any = null;

    if (provider.isConfigured()) {
      try {
        // Run DNS diagnostics via Migadu API
        diagnostics = await provider.runDNSDiagnostics(domainName);
      } catch (err) {
        console.warn('[Diagnostics] Could not run DNS diagnostics from provider:', err);
      }

      // If DNS passed, also try to activate via Migadu
      if (diagnostics && (diagnostics.overall === 'passed' || diagnostics.overall === 'ok')) {
        try {
          activatedDomain = await provider.activateDomain(domainName);
        } catch (err) {
          console.warn('[Diagnostics] Could not auto-activate domain via provider:', err);
        }
      }
    }

    // Update or create the domain record in MongoDB
    const statusFromDiagnostics = 
      diagnostics?.overall === 'passed' || diagnostics?.overall === 'ok' 
        ? 'active' 
        : (domain?.status || 'pending_dns');

    if (domain) {
      domain.diagnostics = diagnostics;
      if (statusFromDiagnostics === 'active') {
        domain.status = 'active';
        domain.canSend = true;
        domain.canReceive = true;
        domain.activatedAt = domain.activatedAt || new Date();
      }
      await domain.save();
    } else {
      // Domain only registered in Migadu, create a local record
      domain = await EmailDomain.create({
        domainName,
        customerId: 'system',
        status: statusFromDiagnostics,
        provider: 'migadu',
        canSend: statusFromDiagnostics === 'active',
        canReceive: statusFromDiagnostics === 'active',
        diagnostics,
        activatedAt: statusFromDiagnostics === 'active' ? new Date() : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      diagnostics,
      domain: {
        domainName: domain.domainName,
        status: domain.status,
        canSend: domain.canSend,
        canReceive: domain.canReceive,
        activatedAt: domain.activatedAt,
      }
    });
  } catch (error) {
    console.error('[Migadu DNS Diagnostics GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to run DNS diagnostics' },
      { status: 500 }
    );
  }
}

// POST - Force-mark domain as active (admin override)
export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const domainName = params.domain;
    const body = await request.json().catch(() => ({}));
    const { forceActive } = body;

    let domain: any = await EmailDomain.findOne({ domainName: new RegExp(`^${domainName}$`, 'i') });

    if (!domain) {
      domain = await EmailDomain.create({
        domainName,
        customerId: 'system',
        status: 'active',
        provider: 'migadu',
        canSend: true,
        canReceive: true,
        activatedAt: new Date(),
      });
    } else {
      domain.status = 'active';
      domain.canSend = true;
      domain.canReceive = true;
      domain.activatedAt = domain.activatedAt || new Date();
      await domain.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Domain marked as active',
      domain: {
        domainName: domain.domainName,
        status: domain.status,
        canSend: domain.canSend,
        canReceive: domain.canReceive,
        activatedAt: domain.activatedAt,
      }
    });
  } catch (error) {
    console.error('[Migadu DNS Diagnostics POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to force-activate domain' },
      { status: 500 }
    );
  }
}

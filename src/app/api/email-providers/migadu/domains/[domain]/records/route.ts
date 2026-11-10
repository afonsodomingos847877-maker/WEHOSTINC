import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { connectDB } from '@/lib/mongodb';
import { canAccessDomain } from '@/lib/serverAuth';

// GET - Get DNS records for a domain
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

    let domain: any = await EmailDomain.findOne({ domainName: new RegExp(`^${domainName}$`, 'i') });
    const provider = getEmailProvider();
    let dnsRecords: any[] = [];

    if (provider.isConfigured()) {
      try {
        dnsRecords = await provider.getDNSRecords(domainName);
      } catch (err) {
        console.warn('[Migadu DNS Records GET] Provider error:', err);
      }
    }

    if (domain && dnsRecords.length > 0) {
      domain.dnsRecords = dnsRecords;
      await domain.save();
    }

    return NextResponse.json({
      success: true,
      dnsRecords
    });
  } catch (error) {
    console.error('[Migadu DNS Records GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get DNS records' },
      { status: 500 }
    );
  }
}

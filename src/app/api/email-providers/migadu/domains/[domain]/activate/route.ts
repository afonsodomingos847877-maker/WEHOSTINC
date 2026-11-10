import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { connectDB } from '@/lib/mongodb';
import { canAccessDomain } from '@/lib/serverAuth';

// POST - Activate a domain (with graceful fallback if Migadu DNS not yet propagated)
export async function POST(
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
    if (!domain) {
      domain = await EmailDomain.create({
        domainName,
        customerId: 'system',
        status: 'pending_dns',
        provider: 'migadu',
        canSend: false,
        canReceive: false,
      });
    }

    const provider = getEmailProvider();
    let activatedSuccessfully = false;
    let providerError = '';

    if (provider.isConfigured()) {
      try {
        const activatedDomain = await provider.activateDomain(domainName);
        if (activatedDomain) {
          Object.assign(domain, activatedDomain);
          activatedSuccessfully = true;
        }
      } catch (provErr: any) {
        // Migadu rejected activation because DNS isn't ready yet — that's OK
        providerError = provErr?.message || 'DNS not yet propagated on Migadu';
        console.warn('[Activate] Migadu activation deferred (DNS pending):', providerError);
      }
    }

    if (activatedSuccessfully) {
      domain.status = 'active';
      domain.canSend = true;
      domain.canReceive = true;
      domain.activatedAt = domain.activatedAt || new Date();
    } else {
      // Keep as pending — don't force active when DNS isn't verified
      domain.status = 'pending_dns';
    }

    await domain.save();

    return NextResponse.json({
      success: true,
      activated: activatedSuccessfully,
      domain: {
        domainName: domain.domainName,
        status: domain.status,
        canSend: domain.canSend,
        canReceive: domain.canReceive,
      },
      message: activatedSuccessfully
        ? 'Domínio ativado com sucesso!'
        : `DNS ainda não propagado. Verifique os registos na TurboHost e tente novamente em 5-10 minutos. (${providerError})`
    });
  } catch (error: any) {
    console.error('[Migadu Domain Activate POST] Error:', error);
    return NextResponse.json(
      { error: `Falha ao processar ativação: ${error?.message || 'Erro interno'}` },
      { status: 500 }
    );
  }
}

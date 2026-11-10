import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailAlias } from '@/models/EmailAlias';
import { connectDB } from '@/lib/mongodb';
import { canAccessDomain } from '@/lib/serverAuth';

// GET - List aliases for a domain
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

    const provider = getEmailProvider();
    let providerAliases: any[] = [];

    if (provider.isConfigured()) {
      try {
        providerAliases = await provider.listAliases(domainName);
      } catch (err) {
        console.warn('[Aliases GET] Provider fetch warning:', err);
      }
    }

    // Sync live provider aliases into MongoDB
    for (const a of providerAliases) {
      try {
        await EmailAlias.findOneAndUpdate(
          { domain: domainName.toLowerCase(), alias: (a.alias || a.address || '').toLowerCase(), destination: (a.destination || a.destinations?.[0] || '').toLowerCase() },
          {
            domain: domainName.toLowerCase(),
            alias: (a.alias || a.address || '').toLowerCase(),
            destination: (a.destination || a.destinations?.[0] || '').toLowerCase(),
            type: 'alias',
            status: 'active',
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
      } catch {}
    }

    let aliases = await EmailAlias.find({
      domain: new RegExp(`^${domainName}$`, 'i')
    }).sort({ createdAt: -1 });

    if (aliases.length === 0) {
      try {
        const seedAlias = await EmailAlias.findOneAndUpdate(
          { domain: domainName.toLowerCase(), alias: 'postmaster' },
          {
            domain: domainName.toLowerCase(),
            alias: 'postmaster',
            destination: `admin@${domainName.toLowerCase()}`,
            type: 'alias',
            status: 'active',
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
        if (seedAlias) {
          aliases = [seedAlias];
        }
      } catch (aliasErr) {
        console.warn('[Aliases GET] Erro ao auto-inicializar alias postmaster:', aliasErr);
      }
    }

    return NextResponse.json({
      success: true,
      aliases
    });
  } catch (error: any) {
    console.error('[Aliases GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Falha ao listar pseudónimos' }, { status: 500 });
  }
}

// POST - Create alias
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
    const body = await request.json();
    const { alias, destination } = body;

    if (!alias || !destination) {
      return NextResponse.json(
        { error: 'Nome do alias e e-mail de destino são obrigatórios' },
        { status: 400 }
      );
    }

    const cleanAlias = alias.replace(/@.*/, '').toLowerCase().trim();
    const cleanDest = destination.toLowerCase().trim();

    // Call Migadu provider
    const provider = getEmailProvider();
    if (provider.isConfigured()) {
      try {
        await provider.createAlias(domainName, cleanAlias, cleanDest);
      } catch (provErr: any) {
        console.warn('[Aliases POST] Provider creation warning:', provErr);
      }
    }

    // Save to DB
    const newAlias = await EmailAlias.findOneAndUpdate(
      { domain: domainName.toLowerCase(), alias: cleanAlias, destination: cleanDest },
      {
        domain: domainName.toLowerCase(),
        alias: cleanAlias,
        destination: cleanDest,
        type: 'alias',
        status: 'active',
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      alias: newAlias,
      message: 'Pseudónimo criado com sucesso!'
    });
  } catch (error: any) {
    console.error('[Aliases POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Falha ao criar pseudónimo' }, { status: 500 });
  }
}

// DELETE - Remove alias
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const alias = searchParams.get('alias');
    const destination = searchParams.get('destination');

    if (!alias) {
      return NextResponse.json({ error: 'Alias é obrigatório' }, { status: 400 });
    }

    const cleanAlias = alias.replace(/@.*/, '').toLowerCase().trim();

    const provider = getEmailProvider();
    if (provider.isConfigured()) {
      try {
        await provider.deleteAlias(domainName, cleanAlias);
      } catch (provErr: any) {
        console.warn('[Aliases DELETE] Provider delete warning:', provErr);
      }
    }

    const query: any = { domain: new RegExp(`^${domainName}$`, 'i'), alias: cleanAlias };
    if (destination) query.destination = destination.toLowerCase().trim();

    await EmailAlias.deleteMany(query);

    return NextResponse.json({
      success: true,
      message: 'Pseudónimo removido com sucesso'
    });
  } catch (error: any) {
    console.error('[Aliases DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Falha ao remover pseudónimo' }, { status: 500 });
  }
}

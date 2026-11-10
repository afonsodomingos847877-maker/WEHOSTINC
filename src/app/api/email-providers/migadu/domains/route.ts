import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { connectDB } from '@/lib/mongodb';
import SiteModel from '@/lib/models/Site';
import EmailAccountModel from '@/lib/models/EmailAccount';
import { isAdminRole, requireAdmin, requireAuth } from '@/lib/serverAuth';

// GET - List domains
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const user = authResult.user;
    const isAdmin = isAdminRole(user.role);

    const { searchParams } = new URL(request.url);
    const requestedCustomerId = searchParams.get('customerId');
    const customerId = isAdmin ? requestedCustomerId : user.email;

    console.log('[Migadu Domains GET] Fetching domains, customerId:', customerId);

    const provider = getEmailProvider();
    console.log('[Migadu Domains GET] Provider configured:', provider.isConfigured());
    console.log('[Migadu Domains GET] EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER);
    console.log('[Migadu Domains GET] MIGADU_USERNAME set:', !!process.env.MIGADU_USERNAME);
    console.log('[Migadu Domains GET] MIGADU_API_KEY set:', !!process.env.MIGADU_API_KEY);
    
    let allDomains: any[] = [];
    if (provider.isConfigured()) {
      try {
        allDomains = await provider.listDomains(customerId || undefined);
        console.log('[Migadu Domains GET] Domains fetched from provider:', allDomains.length);
      } catch (providerError) {
        console.warn('[Migadu Domains GET] Failed to fetch from provider, falling back to database:', providerError);
      }
    }

    // Merge with platform registered domains from MongoDB
    try {
      await connectDB();
      const existingDomainNames = new Set(allDomains.map(d => (d.domainName || d.name || '').toLowerCase()));

      const [sites, emailAccounts, dbDomains] = await Promise.all([
        SiteModel.find({}).lean(),
        EmailAccountModel.find({}).lean(),
        EmailDomain.find({}).lean()
      ]);

      // 1. Sync or add domains stored in EmailDomain
      dbDomains.forEach((dbDom: any) => {
        const dName = (dbDom.domainName || '').toLowerCase().trim();
        if (!dName) return;

        const existing = allDomains.find(d => (d.domainName || '').toLowerCase().trim() === dName);
        if (existing) {
          if (dbDom.customerId) existing.customerId = dbDom.customerId;
          if (dbDom.status === 'active' || dName === 'wehosthere.com') {
            existing.status = 'active';
            existing.canSend = true;
            existing.canReceive = true;
          }
          if (dbDom.diagnostics) existing.diagnostics = dbDom.diagnostics;
        } else {
          existingDomainNames.add(dName);
          allDomains.push({
            _id: dbDom._id?.toString() || dbDom.id,
            domainName: dbDom.domainName,
            customerId: dbDom.customerId || 'system',
            status: (dbDom.status === 'active' || dName === 'wehosthere.com') ? 'active' : (dbDom.status || 'pending_dns'),
            provider: dbDom.provider || 'migadu',
            canSend: dbDom.status === 'active' || dName === 'wehosthere.com' || !!dbDom.canSend,
            canReceive: dbDom.status === 'active' || dName === 'wehosthere.com' || !!dbDom.canReceive,
            diagnostics: dbDom.diagnostics,
            createdAt: dbDom.createdAt || new Date().toISOString(),
            updatedAt: dbDom.updatedAt || new Date().toISOString()
          });
        }
      });

      // 2. Add domains from SiteModel
      sites.forEach((site: any) => {
        const dName = (site.domain || '').trim().toLowerCase();
        if (dName && !existingDomainNames.has(dName)) {
          existingDomainNames.add(dName);
          allDomains.push({
            _id: site.id || site._id?.toString(),
            domainName: site.domain,
            customerId: site.userEmail || 'cliente',
            status: site.status === 'active' ? 'active' : 'pending_dns',
            provider: 'platform',
            canSend: site.status === 'active',
            canReceive: site.status === 'active',
            createdAt: site.createdAt || new Date().toISOString(),
            updatedAt: site.createdAt || new Date().toISOString()
          });
        }
      });

      // 3. Add domains extracted from EmailAccountModel (e.g. user@domain.com)
      emailAccounts.forEach((acc: any) => {
        let dName = (acc.domain || '').trim().toLowerCase();
        if (!dName && acc.email && acc.email.includes('@')) {
          dName = acc.email.split('@')[1].trim().toLowerCase();
        }
        if (dName && !existingDomainNames.has(dName)) {
          existingDomainNames.add(dName);
          allDomains.push({
            _id: acc.id || acc._id?.toString(),
            domainName: dName,
            customerId: acc.userEmail || 'cliente',
            status: acc.status === 'active' ? 'active' : 'pending_dns',
            provider: 'platform',
            canSend: acc.status === 'active',
            canReceive: acc.status === 'active',
            createdAt: acc.createdAt || new Date().toISOString(),
            updatedAt: acc.createdAt || new Date().toISOString()
          });
        }
      });
    } catch (dbError) {
      console.error('[Migadu Domains GET] Error fetching platform domains from DB:', dbError);
    }
    
    const reqEmail = (customerId || searchParams.get('userEmail') || '').trim().toLowerCase();
    
    // 🔒 ISOLAMENTO RIGOROSO DE TENANT:
    // Se a requisição vem de um cliente específico (não é o Super Admin global),
    // NUNCA retornar domínios que pertençam a outros clientes ou sem dono associado!
    if (reqEmail && reqEmail !== 'admin@wehosthere.com') {
      let userSiteDomains = new Set<string>();
      try {
        const userSiteDocs = await SiteModel.find({ userEmail: reqEmail }).lean();
        userSiteDomains = new Set(userSiteDocs.map((s: any) => (s.domain || '').toLowerCase().trim()));
      } catch {}

      const userDomains = allDomains.filter(domain => {
        const dName = (domain.domainName || domain.name || '').toLowerCase().trim();
        const cId = (domain.customerId || '').toLowerCase().trim();
        return (cId === reqEmail) || userSiteDomains.has(dName);
      });

      return NextResponse.json({
        success: true,
        domains: userDomains
      });
    }

    // Apenas Super Administrador sem filtro de cliente vê todos os domínios
    return NextResponse.json({
      success: true,
      domains: allDomains
    });
  } catch (error) {
    console.error('[Migadu Domains GET] Error:', error);
    console.error('[Migadu Domains GET] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { error: 'Failed to list domains', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Create domain
export async function POST(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const { domainName, customerId = 'system', createDefaultAddresses = false } = body;

    if (!domainName || typeof domainName !== 'string' || !domainName.trim()) {
      console.warn('[Migadu Domains POST] [NORMAL_ERROR] Rejected: domainName is missing or empty.');
      return NextResponse.json(
        { 
          success: false,
          error: 'O nome do domínio é obrigatório.',
          errorType: 'MISSING_DOMAIN_NAME',
          isNormalError: true
        },
        { status: 400 }
      );
    }

    const cleanDomainName = domainName.trim().toLowerCase();

    // Validação de formato de domínio
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
    if (!domainRegex.test(cleanDomainName)) {
      console.warn(`[Migadu Domains POST] [NORMAL_ERROR] Invalid domain format submitted: "${domainName}"`);
      return NextResponse.json(
        { 
          success: false,
          error: `Formato de domínio inválido: "${domainName}". Exemplo: empresa.co.mz ou meudominio.com`,
          errorType: 'INVALID_DOMAIN_FORMAT',
          isNormalError: true
        },
        { status: 400 }
      );
    }

    const effectiveCustomerId = customerId || 'system';

    // Check if domain already exists in our MongoDB database
    await connectDB();
    const existingDomain = await EmailDomain.findOne({ domainName: new RegExp(`^${cleanDomainName}$`, 'i') });
    if (existingDomain) {
      console.warn(`[Migadu Domains POST] [NORMAL_ERROR] Domain "${cleanDomainName}" already exists in local database.`);
      return NextResponse.json(
        { 
          success: false,
          error: `O domínio "${cleanDomainName}" já se encontra cadastrado no sistema.`,
          errorType: 'DOMAIN_ALREADY_EXISTS_DB',
          isNormalError: true,
          details: 'Este domínio já se encontra registado na base de dados.'
        },
        { status: 409 }
      );
    }

    console.log(`[Migadu Domains POST] Initiating domain creation: "${cleanDomainName}" for customer: "${effectiveCustomerId}"`);
    
    const provider = getEmailProvider();
    const isConfigured = provider.isConfigured();
    console.log('[Migadu Domains POST] Provider configured status:', isConfigured);
    
    if (!isConfigured) {
      console.error('[Migadu Domains POST] [SYSTEM_ERROR] Email provider not configured. MIGADU_USERNAME or MIGADU_API_KEY is missing.');
      return NextResponse.json(
        { 
          success: false,
          error: 'Provedor de e-mail não configurado no servidor. Verifique as credenciais da Migadu (MIGADU_USERNAME / MIGADU_API_KEY).',
          errorType: 'PROVIDER_NOT_CONFIGURED',
          isNormalError: false,
          details: 'MIGADU_USERNAME ou MIGADU_API_KEY não estão definidas.'
        },
        { status: 500 }
      );
    }

    let domain: any = null;
    let isExistingAdopted = false;

    try {
      domain = await provider.createDomain({
        domainName: cleanDomainName,
        createDefaultAddresses,
        hostedDns: false
      });
      console.log(`[Migadu Domains POST] Domain "${cleanDomainName}" successfully created on Migadu.`);
    } catch (migaduErr: any) {
      console.warn(`[Migadu Domains POST] Migadu createDomain failed for "${cleanDomainName}":`, migaduErr);

      const statusCode = migaduErr.statusCode || 500;
      const rawMessage = (migaduErr.message || '').toString();
      const rawDetails = (typeof migaduErr.details === 'string' ? migaduErr.details : JSON.stringify(migaduErr.details || ''));

      // Verifica se o erro é de domínio já existente na Migadu
      const isAlreadyExists = 
        statusCode === 409 || 
        statusCode === 422 || 
        /already|exists|taken|regist/i.test(rawMessage) || 
        /already|exists|taken|regist/i.test(rawDetails);

      if (isAlreadyExists) {
        // Tenta buscar o domínio existente na nossa conta Migadu para reaproveitar
        try {
          console.log(`[Migadu Domains POST] [NORMAL_CHECK] Domain might already exist in our Migadu account. Fetching details for "${cleanDomainName}"...`);
          const existingMigaduDomain = await provider.getDomain(cleanDomainName);
          if (existingMigaduDomain) {
            console.log(`[Migadu Domains POST] [NORMAL_INFO] Domain "${cleanDomainName}" verified in Migadu account! Adopting and syncing to database.`);
            domain = existingMigaduDomain;
            isExistingAdopted = true;
          }
        } catch (fetchErr) {
          console.warn(`[Migadu Domains POST] Domain exists in Migadu, but cannot be fetched directly (might belong to another Migadu account):`, fetchErr);
        }
      }

      // Se não conseguimos adotar nem criar, categorizamos o erro de forma clara
      if (!domain) {
        let errorType = 'UNKNOWN_PROVIDER_ERROR';
        let isNormalError = false;
        let userMessage = rawMessage || 'Erro ao processar criação de domínio na Migadu.';

        if (statusCode === 409 || isAlreadyExists) {
          errorType = 'DOMAIN_ALREADY_EXISTS_ON_MIGADU';
          isNormalError = true;
          userMessage = `O domínio "${cleanDomainName}" já se encontra registado na Migadu ou pertence a outra conta.`;
        } else if (statusCode === 400 || statusCode === 422) {
          errorType = 'INVALID_DOMAIN_ON_MIGADU';
          isNormalError = true;
          userMessage = `O domínio "${cleanDomainName}" foi rejeitado pela Migadu (formato inválido ou restrito).`;
        } else if (statusCode === 401 || migaduErr.code === 'AUTHENTICATION_ERROR') {
          errorType = 'AUTHENTICATION_ERROR';
          isNormalError = false;
          userMessage = `Erro de autenticação com a API da Migadu: ${migaduErr.message || rawMessage || 'Token inválido ou expirado'}`;
        } else if (statusCode === 429 || migaduErr.code === 'RATE_LIMIT_ERROR') {
          errorType = 'RATE_LIMIT_ERROR';
          isNormalError = false;
          userMessage = 'Limite de requisições excedido na Migadu. Tente novamente em instantes.';
        } else if (statusCode === 503 || statusCode >= 500 || migaduErr.code === 'PROVIDER_UNAVAILABLE') {
          errorType = 'PROVIDER_UNAVAILABLE';
          isNormalError = false;
          userMessage = 'Serviço da Migadu temporariamente indisponível. Tente novamente mais tarde.';
        }

        const diagnostic = {
          rawMigaduError: migaduErr.details?.rawBody || migaduErr.details?.rawText || rawMessage,
          migaduErrDetails: migaduErr.details,
          usernameUsed: process.env.MIGADU_USERNAME ? `${process.env.MIGADU_USERNAME.slice(0, 4)}***${process.env.MIGADU_USERNAME.slice(-10)}` : 'NÃO_DEFINIDO',
          apiKeyLength: process.env.MIGADU_API_KEY?.length || 0,
          apiKeyPrefix: process.env.MIGADU_API_KEY ? `${process.env.MIGADU_API_KEY.slice(0, 6)}...` : 'NÃO_DEFINIDO'
        };

        if (isNormalError) {
          console.warn(`[Migadu Domains POST] [NORMAL_ERROR] Type: ${errorType} | Domain: "${cleanDomainName}" | HTTP Status: ${statusCode} | Message: ${userMessage}`, diagnostic);
        } else {
          console.error(`[Migadu Domains POST] [SYSTEM_ERROR] Type: ${errorType} | Domain: "${cleanDomainName}" | HTTP Status: ${statusCode} | Error:`, migaduErr, diagnostic);
        }

        return NextResponse.json(
          {
            success: false,
            error: userMessage,
            errorType,
            isNormalError,
            statusCode,
            details: rawMessage || migaduErr.message,
            diagnostic
          },
          { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
        );
      }
    }

    // Grava ou atualiza no MongoDB de forma resiliente
    const savedDomain = await EmailDomain.findOneAndUpdate(
      { domainName: cleanDomainName },
      {
        $set: {
          domainName: cleanDomainName,
          customerId: effectiveCustomerId,
          status: domain.status || 'pending_dns',
          provider: 'migadu',
          providerDomainId: domain.providerDomainId || domain.id,
          canSend: !!domain.canSend,
          canReceive: !!domain.canReceive,
          activatedAt: domain.activatedAt,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    // Se associado a um cliente com e-mail, sincroniza com SiteModel para visualização nos sites
    if (effectiveCustomerId && effectiveCustomerId !== 'system' && effectiveCustomerId.includes('@')) {
      await SiteModel.findOneAndUpdate(
        { domain: new RegExp(`^${cleanDomainName}$`, 'i') },
        {
          $set: {
            domain: cleanDomainName,
            name: cleanDomainName,
            userEmail: effectiveCustomerId.toLowerCase().trim(),
            status: savedDomain.status === 'active' ? 'active' : 'pending',
            storage: 10,
            bandwidth: 100,
            updatedAt: new Date().toISOString()
          },
          $setOnInsert: {
            id: `site_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            createdAt: new Date().toISOString()
          }
        },
        { upsert: true, new: true }
      ).catch((err) => {
        console.warn('[Migadu Domains POST] Non-critical warning updating SiteModel:', err);
      });
    }

    console.log(`[Migadu Domains POST] [SUCCESS] Domain "${cleanDomainName}" saved in MongoDB: ${savedDomain._id} | Adopted: ${isExistingAdopted}`);

    return NextResponse.json({
      success: true,
      domain: savedDomain,
      isExistingAdopted,
      message: isExistingAdopted 
        ? `O domínio "${cleanDomainName}" já existia na sua conta Migadu e foi vinculado com sucesso!` 
        : `Domínio "${cleanDomainName}" criado com sucesso!`
    });
  } catch (error) {
    console.error('[Migadu Domains POST] [CRITICAL_UNCAUGHT_ERROR]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false,
        error: `Erro interno no servidor ao criar domínio: ${errorMessage}`,
        errorType: 'INTERNAL_SERVER_ERROR',
        isNormalError: false,
        details: String(error)
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns/promises';
import { DOMAIN_PRICES, sanitizeDomainName, getDomainPrice, generateSmartDomainSuggestions } from '@/lib/domains';
import { connectDB } from '@/lib/mongodb';
import { DomainSearchLog } from '@/models/DomainSearchLog';

/**
 * Verifica se um domínio possui registros DNS ativos na internet.
 * Tenta resolver Name Servers (NS), registros de IP (A) ou registros de Email (MX).
 */
async function isDomainTakenViaDNS(domain: string): Promise<boolean> {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {}

  // 1. Tentar resolução de IP (A Record)
  try {
    const resolvePromise = dns.resolve4(domain);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DNS Timeout')), 2500)
    );
    const records = await Promise.race([resolvePromise, timeoutPromise]);
    if (Array.isArray(records) && records.length > 0) {
      return true; // Possui registros de IP ativos -> Ocupado!
    }
  } catch (error: any) {
    if (error.code === 'ENODATA' || error.code === 'ESERVFAIL') {
      return true; // Registrado no servidor DNS pai -> Ocupado!
    }
  }

  // 2. Tentar consulta de servidores de nomes (NameServers / NS)
  try {
    const nsPromise = dns.resolveNs(domain);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DNS Timeout')), 2500)
    );
    const nsRecords = await Promise.race([nsPromise, timeoutPromise]);
    if (Array.isArray(nsRecords) && nsRecords.length > 0) {
      return true; // Possui NameServers registrados -> Ocupado!
    }
  } catch (error: any) {
    if (error.code === 'ENODATA' || error.code === 'ESERVFAIL') {
      return true; // Ocupado!
    }
  }

  // 3. Tentar resolução de IP genérica (dns.lookup)
  try {
    const lookupPromise = dns.lookup(domain);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DNS Timeout')), 2500)
    );
    const res = await Promise.race([lookupPromise, timeoutPromise]);
    if (res && res.address) {
      return true; // Ocupado!
    }
  } catch (error: any) {
    if (error.code === 'ENODATA' || error.code === 'ESERVFAIL') {
      return true; // Ocupado!
    }
  }

  return false; // Domínio 100% Livre para registro!
}

import { sendDomainSearchAlertEmail } from '@/lib/sendgrid';
import { addAdminNotification } from '@/lib/notifications';

/**
 * Persiste o log de pesquisa no MongoDB — SEMPRE aguardado antes de responder.
 * Retorna o searchCount actualizado.
 */
async function saveSearchLogToDB(
  fullDomain: string,
  sld: string,
  extension: string,
  isAvailable: boolean,
  ip: string,
  userAgent: string,
  userId?: string,
  userEmail?: string
): Promise<number> {
  await connectDB();

  const existing = await DomainSearchLog.findOne({ domain: fullDomain });
  let searchCount = 1;

  if (existing) {
    existing.searchCount += 1;
    existing.lastSearchedAt = new Date();
    existing.isAvailable = isAvailable;
    existing.ip = ip;
    existing.userAgent = userAgent;
    if (userId) { existing.userId = userId; existing.userEmail = userEmail; }
    await existing.save();
    searchCount = existing.searchCount;
  } else {
    await DomainSearchLog.create({
      domain: fullDomain,
      sld,
      extension,
      isAvailable,
      searchCount: 1,
      ip,
      userAgent,
      userId: userId || undefined,
      userEmail: userEmail || undefined,
      firstSearchedAt: new Date(),
      lastSearchedAt: new Date(),
    });
  }

  return searchCount;
}

/**
 * Dispara notificações (email + painel admin) em background sem bloquear.
 */
async function fireNotificationsAsync(
  fullDomain: string,
  sld: string,
  extension: string,
  isAvailable: boolean,
  price: number | undefined,
  searchCount: number,
  ip: string,
  userAgent: string,
  userEmail?: string
) {
  try {
      // Notificação interna no painel admin
      try {
        addAdminNotification({
          title: `🔍 Pesquisa: ${fullDomain} [${isAvailable ? 'Disponível' : 'Ocupado'}]`,
          message: `${userEmail ? `Utilizador (${userEmail})` : `Visitante anónimo (IP: ${ip})`} pesquisou pelo domínio "${fullDomain}".`,
          type: 'system',
          link: '/admin/domain-search-logs',
          userEmail: userEmail || undefined,
          metadata: { domain: fullDomain, isAvailable, ip, searchCount }
        });
      } catch (notifErr) {
        console.warn('[DomainSearchLog] Falha na notificação admin:', notifErr);
      }

      // 🔔 Push para telemóvel do admin (apenas se domínio disponível = intenção de compra)
      if (isAvailable) {
        try {
          const { sendPushToAdmins } = await import('@/lib/pushService');
          await sendPushToAdmins({
            title: `🔍 Domínio Pesquisado: ${fullDomain}`,
            message: `${userEmail ? userEmail : `Visitante (${ip})`} pesquisou "${fullDomain}" — DOMÍNIO DISPONÍVEL por ${price ? `${price.toLocaleString('pt-MZ')} MT/ano` : 'preço a definir'}.`,
            url: '/admin/domain-search-logs',
            tag: `domain-search-${fullDomain}`
          });
        } catch (pushErr) {
          console.warn('[DomainSearchLog] Falha não impeditiva ao disparar push:', pushErr);
        }
      }

      // E-mail de alerta aos administradores
      const recipientEmails = new Set<string>();
      try {
        const UserModel = (await import('@/lib/models/User')).default;
        const adminUsers = await UserModel.find(
          { role: { $in: ['admin', 'super_admin'] }, status: { $ne: 'suspended' } },
          { email: 1 }
        ).lean();
        adminUsers.forEach((u: any) => {
          if (u.email && typeof u.email === 'string') {
            recipientEmails.add(u.email.toLowerCase().trim());
          }
        });
      } catch {}

      if (process.env.ADMIN_NOTIFICATION_EMAIL) recipientEmails.add(process.env.ADMIN_NOTIFICATION_EMAIL.toLowerCase().trim());
      if (process.env.ADMIN_EMAIL) recipientEmails.add(process.env.ADMIN_EMAIL.toLowerCase().trim());
      if (recipientEmails.size === 0) recipientEmails.add('info@wehosthere.com');

      await Promise.allSettled(
        Array.from(recipientEmails).map(adminEmail =>
          sendDomainSearchAlertEmail(adminEmail, {
            domain: fullDomain, sld, extension, isAvailable, price,
            searchCount, ip, userAgent, userEmail, searchedAt: new Date()
          })
        )
      );
    } catch (notifErr) {
      console.warn('[DomainSearchLog] Falha nas notificações de domínio:', notifErr);
    }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawDomain = searchParams.get('domain');

  if (!rawDomain) {
    return NextResponse.json({ error: 'Parâmetro domain é obrigatório.' }, { status: 400 });
  }

  const { sld, extension } = sanitizeDomainName(rawDomain);
  const cleanSld = sld.replace(/[^a-z0-9-]/g, '');

  if (!cleanSld || cleanSld.length < 2) {
    return NextResponse.json({ error: 'Nome de domínio inválido.' }, { status: 400 });
  }

  const fullDomain = `${cleanSld}${extension}`;
  const price = getDomainPrice(extension);

  // Lista de reservas estáticas de demonstração para termos proteção extra
  const reservedWords = ['google', 'facebook', 'microsoft', 'wehosthere', 'apple', 'gov', 'co.mz', 'com'];
  let isTaken = reservedWords.includes(cleanSld);

  if (!isTaken) {
    isTaken = await isDomainTakenViaDNS(fullDomain);
  }

  const isAvailable = !isTaken;

  // Extrair IP e user-agent do pedido
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = req.headers.get('user-agent') || '';

  // Extrair utilizador autenticado dos headers (se o middleware de sessão os adicionar)
  const userId = req.headers.get('x-user-id') || undefined;
  const userEmail = req.headers.get('x-user-email') || undefined;

  // Consultar disponibilidade das alternativas e persistir log no MongoDB em paralelo.
  // O await garante que a função serverless (Vercel) aguarda a gravação no MongoDB antes de terminar.
  const altTLDs = DOMAIN_PRICES.filter(tld => tld.extension !== extension);

  const alternativesPromise = Promise.all(
    altTLDs.map(async (tld) => {
      const altFullDomain = `${cleanSld}${tld.extension}`;
      let altTaken = reservedWords.includes(cleanSld);
      if (!altTaken) {
        altTaken = await isDomainTakenViaDNS(altFullDomain);
      }
      return {
        extension: tld.extension,
        fullDomain: altFullDomain,
        price: tld.price,
        isAvailable: !altTaken,
      };
    })
  );

  // 1. Aguardar gravação no MongoDB + consulta de alternativas em PARALELO
  // saveSearchLogToDB é awaited — garante persistência mesmo em serverless/Vercel
  let searchCount = 1;
  const [savedCount, alternatives] = await Promise.all([
    saveSearchLogToDB(fullDomain, cleanSld, extension, isAvailable, ip, userAgent, userId, userEmail).catch((err) => {
      console.error('[DomainSearchLog] Falha CRÍTICA ao guardar no MongoDB:', err);
      return 1;
    }),
    alternativesPromise,
  ]);
  searchCount = savedCount as number;

  // 2. Notificações aguardadas para assegurar entrega no serverless/Vercel
  await fireNotificationsAsync(fullDomain, cleanSld, extension, isAvailable, price, searchCount, ip, userAgent, userEmail);


  const smartSuggestions = generateSmartDomainSuggestions(cleanSld, extension);

  return NextResponse.json({
    fullDomain,
    sld: cleanSld,
    extension,
    isAvailable,
    price,
    alternatives,
    smartSuggestions,
  });
}

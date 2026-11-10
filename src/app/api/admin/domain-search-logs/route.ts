import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { DomainSearchLog } from '@/models/DomainSearchLog';
import { requireAdmin } from '@/lib/serverAuth';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
    const filter = searchParams.get('filter') || 'all'; // all | available | taken | checkout | completed | searches_only
    const sortBy = searchParams.get('sortBy') || 'lastSearchedAt'; // lastSearchedAt | searchCount | domain
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const isExport = searchParams.get('export') === 'true';

    const baseCondition: any = {
      domain: { $regex: '^[a-z0-9]', $options: 'i' },
    };

    const query: any = { ...baseCondition };

    if (filter === 'available') query.isAvailable = true;
    if (filter === 'taken') query.isAvailable = false;
    if (filter === 'checkout') query.hasCheckoutAttempt = true;
    if (filter === 'completed') query.checkoutStatus = 'completed';
    if (filter === 'searches_only') query.hasCheckoutAttempt = { $ne: true };
    if (q) {
      const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { domain: { $regex: escapedQ, $options: 'i' } },
        { userEmail: { $regex: escapedQ, $options: 'i' } },
        { userName: { $regex: escapedQ, $options: 'i' } },
        { userPhone: { $regex: escapedQ, $options: 'i' } },
        { ip: { $regex: escapedQ, $options: 'i' } },
      ];
    }

    const sortOrder: any = { [sortBy]: -1 };
    const effectiveLimit = isExport ? 2000 : limit;
    const skip = isExport ? 0 : (page - 1) * limit;

    const [logs, total] = await Promise.all([
      DomainSearchLog.find(query)
        .sort(sortOrder)
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),
      DomainSearchLog.countDocuments(query),
    ]);

    // Estatísticas gerais
    const [totalSearches, totalAvailable, totalTaken, totalCheckoutLeads, totalCompleted, topSearched] = await Promise.all([
      DomainSearchLog.countDocuments(baseCondition),
      DomainSearchLog.countDocuments({ ...baseCondition, isAvailable: true }),
      DomainSearchLog.countDocuments({ ...baseCondition, isAvailable: false }),
      DomainSearchLog.countDocuments({ ...baseCondition, hasCheckoutAttempt: true }),
      DomainSearchLog.countDocuments({ ...baseCondition, checkoutStatus: 'completed' }),
      DomainSearchLog.find(baseCondition)
        .sort({ searchCount: -1 })
        .limit(5)
        .lean(),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page: isExport ? 1 : page,
        limit: effectiveLimit,
        total,
        totalPages: Math.ceil(total / effectiveLimit),
      },
      stats: {
        totalSearches,
        totalAvailable,
        totalTaken,
        totalCheckoutLeads,
        totalCompleted,
        topSearched,
      },
    });
  } catch (err: any) {
    console.error('[AdminDomainSearchLogs] Erro:', err);
    return NextResponse.json({ error: 'Erro ao carregar logs de pesquisa.' }, { status: 500 });
  }
}

import { addAdminNotification } from '@/lib/notifications';
import { sendDomainLeadAlertEmail, DomainLeadAlertData } from '@/lib/sendgrid';

/**
 * Dispara notificações (email + painel admin) para lead de checkout em background
 */
function fireLeadNotificationsAsync(data: DomainLeadAlertData) {
  (async () => {
    try {
      // 1. Notificação no painel administrativo
      try {
        await addAdminNotification({
          title: `🔥 Lead Quente: Tentativa de Compra (${data.domain})`,
          message: `${data.userName || 'Cliente'} (${data.userPhone || data.userEmail || 'Contacto não informado'}) iniciou o checkout do domínio "${data.domain}".`,
          type: 'order_new',
          link: '/admin/domain-search-logs?filter=checkout',
          userEmail: data.userEmail || undefined,
          metadata: {
            domain: data.domain,
            userName: data.userName,
            userPhone: data.userPhone,
            checkoutOrderId: data.checkoutOrderId,
            checkoutStatus: data.checkoutStatus,
          },
        });
      } catch (notifErr) {
        console.warn('[DomainLead] Falha na notificação admin interna:', notifErr);
      }

      // 2. Coletar emails dos administradores
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

      if (process.env.ADMIN_EMAIL) recipientEmails.add(process.env.ADMIN_EMAIL.toLowerCase().trim());
      if (process.env.EMAIL_USER?.includes('@')) recipientEmails.add(process.env.EMAIL_USER.toLowerCase().trim());
      if (recipientEmails.size === 0) recipientEmails.add('info@wehosthere.com');

      // 3. Enviar e-mail de alerta de lead
      await Promise.allSettled(
        Array.from(recipientEmails).map(adminEmail =>
          sendDomainLeadAlertEmail(adminEmail, data)
        )
      );
    } catch (err) {
      console.warn('[DomainLead] Falha ao enviar notificações de lead:', err);
    }
  })();
}

/**
 * POST — Registrar ou atualizar tentativa de checkout para um domínio pesquisado
 */
export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rl = rateLimit(getRateLimitIdentifier(clientIp, 'domain_lead_log'), 20, 60000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Muitas solicitações.' }, { status: 429 });
    }

    await connectDB();
    const body = await req.json();
    const { domain, userName, userEmail, userPhone, checkoutStatus, checkoutOrderId } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domínio é obrigatório.' }, { status: 400 });
    }

    const cleanDomain = String(domain).trim().toLowerCase();
    const parts = cleanDomain.split('.');
    const sld = parts[0];
    const extension = '.' + parts.slice(1).join('.');

    const updated = await DomainSearchLog.findOneAndUpdate(
      { domain: cleanDomain },
      {
        $set: {
          userName: userName ? String(userName).trim() : undefined,
          userEmail: userEmail ? String(userEmail).trim().toLowerCase() : undefined,
          userPhone: userPhone ? String(userPhone).trim() : undefined,
          hasCheckoutAttempt: true,
          checkoutStatus: checkoutStatus || 'pending',
          checkoutOrderId: checkoutOrderId || undefined,
          lastSearchedAt: new Date(),
        },
        $setOnInsert: {
          domain: cleanDomain,
          sld,
          extension,
          isAvailable: true,
          searchCount: 1,
          firstSearchedAt: new Date(),
        }
      },
      { new: true, upsert: true }
    );

    // Disparar notificações de lead apenas quando for tentativa inicial/pendente
    if (checkoutStatus !== 'completed') {
      fireLeadNotificationsAsync({
        domain: cleanDomain,
        userName: userName ? String(userName).trim() : undefined,
        userEmail: userEmail ? String(userEmail).trim().toLowerCase() : undefined,
        userPhone: userPhone ? String(userPhone).trim() : undefined,
        checkoutStatus: checkoutStatus || 'pending',
        checkoutOrderId: checkoutOrderId || undefined,
        attemptedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, log: updated });
  } catch (err: any) {
    console.error('[AdminDomainSearchLogs] Erro ao registrar lead de checkout:', err);
    return NextResponse.json({ error: 'Erro interno ao registrar lead.' }, { status: 500 });
  }
}

/**
 * DELETE — Limpar logs (por id, por domain ou todos)
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');
    const id = searchParams.get('id');

    if (id) {
      const result = await DomainSearchLog.deleteOne({ _id: id });
      return NextResponse.json({ deleted: result.deletedCount });
    }

    if (domain) {
      const result = await DomainSearchLog.deleteOne({ domain: domain.trim().toLowerCase() });
      return NextResponse.json({ deleted: result.deletedCount });
    }

    const result = await DomainSearchLog.deleteMany({});
    return NextResponse.json({ deleted: result.deletedCount });
  } catch (err: any) {
    console.error('[AdminDomainSearchLogs] Erro ao apagar logs:', err);
    return NextResponse.json({ error: 'Erro ao apagar logs.' }, { status: 500 });
  }
}

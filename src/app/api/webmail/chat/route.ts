import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { WebmailChatMessage, WebmailPresence } from '@/models/WebmailChat';
import { EmailMailbox } from '@/models/EmailMailbox';
import EmailAccountModel from '@/lib/models/EmailAccount';
import { getEmailProvider } from '@/lib/emailProviders/base';

function buildDmChannel(emailA: string, emailB: string): string {
  const sorted = [emailA.trim().toLowerCase(), emailB.trim().toLowerCase()].sort();
  return `dm:${sorted[0]}:${sorted[1]}`;
}

function formatDisplayName(email: string, rawName?: string): string {
  if (rawName && rawName.trim() && !rawName.includes('@')) {
    return rawName.trim();
  }
  const local = (email.split('@')[0] || 'Utilizador')
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return local;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') || '').trim().toLowerCase();
    const peerEmail = (searchParams.get('with') || '').trim().toLowerCase();
    const userNameParam = (searchParams.get('name') || '').trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail válido é obrigatório' }, { status: 400 });
    }

    const domain = email.split('@')[1].toLowerCase();
    const callerName = formatDisplayName(email, userNameParam);

    // 1. Atualizar presença em tempo real do utilizador atual
    await WebmailPresence.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          domain,
          name: callerName,
          lastSeenAt: new Date(),
        },
        $setOnInsert: {
          status: 'online',
        },
      },
      { upsert: true, new: true }
    );

    // 2. Descobrir todos os colegas do mesmo domínio (@domain)
    const domainRegex = new RegExp(`@${domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const [dbMailboxes, dbAccounts, presences] = await Promise.all([
      EmailMailbox.find({ email: { $regex: domainRegex } }).lean(),
      EmailAccountModel.find({
        $or: [{ domain: new RegExp(`^${domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, { email: { $regex: domainRegex } }],
      }).lean(),
      WebmailPresence.find({ domain }).lean(),
    ]);

    const colleaguesMap = new Map<
      string,
      {
        email: string;
        name: string;
        status: 'online' | 'busy' | 'away' | 'offline';
        isOnline: boolean;
        lastSeenAt?: string;
        unreadCount: number;
      }
    >();

    // Se ainda houver poucas caixas sincronizadas no banco para este domínio, tentar consultar o provedor Migadu de forma leve
    if (dbMailboxes.length === 0 && dbAccounts.length <= 1) {
      try {
        const provider = getEmailProvider();
        if (provider.isConfigured()) {
          const liveBoxes = await provider.listMailboxes(domain);
          for (const mb of liveBoxes) {
            let localPart = (mb.localPart || (mb.email ? mb.email.split('@')[0] : '')).toLowerCase();
            if (localPart.includes('@')) localPart = localPart.split('@')[0];
            if (!localPart) continue;
            const fullAddr = `${localPart}@${domain}`;
            colleaguesMap.set(fullAddr, {
              email: fullAddr,
              name: formatDisplayName(fullAddr, mb.name),
              status: 'offline',
              isOnline: false,
              unreadCount: 0,
            });
          }
        }
      } catch {
        // Ignorar silenciosamente se a API externa demorar ou falhar
      }
    }

    for (const mb of dbMailboxes as any[]) {
      const addr = (mb.email || '').trim().toLowerCase();
      if (!addr || !addr.endsWith(`@${domain}`)) continue;
      colleaguesMap.set(addr, {
        email: addr,
        name: formatDisplayName(addr, mb.name),
        status: 'offline',
        isOnline: false,
        unreadCount: 0,
      });
    }

    for (const acc of dbAccounts as any[]) {
      const addr = (acc.email || '').trim().toLowerCase();
      if (!addr || !addr.endsWith(`@${domain}`)) continue;
      if (!colleaguesMap.has(addr)) {
        colleaguesMap.set(addr, {
          email: addr,
          name: formatDisplayName(addr, acc.name),
          status: 'offline',
          isOnline: false,
          unreadCount: 0,
        });
      }
    }

    const nowMs = Date.now();
    for (const p of presences as any[]) {
      const addr = (p.email || '').trim().toLowerCase();
      if (!addr || !addr.endsWith(`@${domain}`)) continue;
      const seenMs = p.lastSeenAt ? new Date(p.lastSeenAt).getTime() : 0;
      const isOnline = nowMs - seenMs < 2 * 60 * 1000; // Online nos últimos 2 minutos
      const existing = colleaguesMap.get(addr);
      colleaguesMap.set(addr, {
        email: addr,
        name: formatDisplayName(addr, p.name || existing?.name),
        status: isOnline ? p.status || 'online' : 'offline',
        isOnline,
        lastSeenAt: p.lastSeenAt ? new Date(p.lastSeenAt).toISOString() : undefined,
        unreadCount: 0,
      });
    }

    // 3. Determinar canal ativo ('general' ou conversa direta 1-a-1)
    const activeChannel =
      peerEmail && peerEmail !== 'general' && peerEmail.endsWith(`@${domain}`)
        ? buildDmChannel(email, peerEmail)
        : 'general';

    // Marcar mensagens do canal ativo como lidas pelo utilizador atual
    await WebmailChatMessage.updateMany(
      {
        domain,
        channel: activeChannel,
        fromEmail: { $ne: email },
        readBy: { $ne: email },
      },
      {
        $addToSet: { readBy: email },
      }
    );

    // 4. Calcular mensagens não lidas em todos os canais deste domínio para este utilizador
    const unreadDocs = await WebmailChatMessage.find({
      domain,
      fromEmail: { $ne: email },
      readBy: { $ne: email },
      $or: [{ channel: 'general' }, { toEmail: email }],
    })
      .select('channel fromEmail toEmail')
      .lean();

    let generalUnreadCount = 0;
    for (const doc of unreadDocs as any[]) {
      if (doc.channel === 'general') {
        generalUnreadCount++;
      } else if (doc.fromEmail) {
        const sender = String(doc.fromEmail).toLowerCase();
        const col = colleaguesMap.get(sender);
        if (col) {
          col.unreadCount = (col.unreadCount || 0) + 1;
        } else if (sender.endsWith(`@${domain}`)) {
          colleaguesMap.set(sender, {
            email: sender,
            name: formatDisplayName(sender),
            status: 'offline',
            isOnline: false,
            unreadCount: 1,
          });
        }
      }
    }

    // 5. Buscar últimas 80 mensagens do canal ativo
    const rawMessages = await WebmailChatMessage.find({
      domain,
      channel: activeChannel,
    })
      .sort({ createdAt: -1 })
      .limit(80)
      .lean();

    const messages = rawMessages.reverse().map((m: any) => ({
      id: m._id.toString(),
      domain: m.domain,
      channel: m.channel,
      fromEmail: m.fromEmail,
      fromName: m.fromName,
      toEmail: m.toEmail,
      text: m.text,
      attachmentUrl: m.attachmentUrl,
      attachmentName: m.attachmentName,
      attachmentType: m.attachmentType,
      readBy: m.readBy || [],
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
    }));

    const selfPresence = colleaguesMap.get(email);
    colleaguesMap.delete(email); // Remover o próprio utilizador da lista de colegas

    const colleagues = Array.from(colleaguesMap.values()).sort((a, b) => {
      if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return a.name.localeCompare(b.name);
    });

    const totalUnread =
      generalUnreadCount + colleagues.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

    return NextResponse.json({
      success: true,
      domain,
      selfStatus: selfPresence?.status === 'offline' ? 'online' : selfPresence?.status || 'online',
      activeChannel,
      generalUnreadCount,
      totalUnread,
      colleagues,
      messages,
    });
  } catch (error: any) {
    console.error('[Webmail Chat GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar o chat interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      action = 'send',
      fromEmail: rawFrom,
      fromName: rawFromName,
      toEmail: rawTo,
      text = '',
      attachmentUrl,
      attachmentName,
      attachmentType,
      status,
    } = body;

    const fromEmail = (rawFrom || '').trim().toLowerCase();
    if (!fromEmail || !fromEmail.includes('@')) {
      return NextResponse.json({ error: 'Remetente inválido' }, { status: 400 });
    }

    const domain = fromEmail.split('@')[1].toLowerCase();
    const fromName = formatDisplayName(fromEmail, rawFromName);

    // Atualização rápida de estado (online / busy / away)
    if (action === 'status') {
      const validStatus = ['online', 'busy', 'away'].includes(status) ? status : 'online';
      await WebmailPresence.findOneAndUpdate(
        { email: fromEmail },
        {
          email: fromEmail,
          domain,
          name: fromName,
          status: validStatus,
          lastSeenAt: new Date(),
        },
        { upsert: true, new: true }
      );
      return NextResponse.json({ success: true, status: validStatus });
    }

    const cleanText = String(text || '').trim();
    if (!cleanText && !attachmentUrl) {
      return NextResponse.json({ error: 'Escreva uma mensagem ou anexe um ficheiro' }, { status: 400 });
    }

    const toEmail = (rawTo || 'all').trim().toLowerCase();
    let channel = 'general';

    if (toEmail !== 'all' && toEmail !== 'general') {
      if (!toEmail.endsWith(`@${domain}`)) {
        return NextResponse.json(
          { error: `O chat interno é exclusivo para membros do domínio @${domain}.` },
          { status: 403 }
        );
      }
      channel = buildDmChannel(fromEmail, toEmail);
    }

    const newMsg = await WebmailChatMessage.create({
      domain,
      channel,
      fromEmail,
      fromName,
      toEmail: channel === 'general' ? 'all' : toEmail,
      text: cleanText,
      attachmentUrl,
      attachmentName,
      attachmentType,
      readBy: [fromEmail],
      createdAt: new Date(),
    });

    await WebmailPresence.findOneAndUpdate(
      { email: fromEmail },
      {
        email: fromEmail,
        domain,
        name: fromName,
        lastSeenAt: new Date(),
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: {
        id: newMsg._id.toString(),
        domain: newMsg.domain,
        channel: newMsg.channel,
        fromEmail: newMsg.fromEmail,
        fromName: newMsg.fromName,
        toEmail: newMsg.toEmail,
        text: newMsg.text,
        attachmentUrl: newMsg.attachmentUrl,
        attachmentName: newMsg.attachmentName,
        attachmentType: newMsg.attachmentType,
        readBy: newMsg.readBy,
        createdAt: newMsg.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Webmail Chat POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Não foi possível enviar a mensagem no chat interno' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserPresenceModel from '@/lib/models/UserPresence';
import AnalyticsVisitModel from '@/lib/models/AnalyticsVisit';
import UserModel from '@/lib/models/User';

let FALLBACK_PRESENCE: any[] = [];
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutos = "online"

async function tryMongo() {
  try { await connectDB(); return true; }
  catch { return false; }
}

// GET /api/analytics/presence — lista quem está online agora em tempo real com fotos dos utilizadores registados
export async function GET() {
  const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();

  try {
    if (await tryMongo()) {
      // 1. Obter presenças activas com lastSeen >= cutoff (últimos 5 minutos)
      const activePresence = await UserPresenceModel.find({
        lastSeen: { $gte: cutoff }
      }).sort({ lastSeen: -1 }).lean();

      // 2. Obter visitas directas recentes nos últimos 5 minutos de AnalyticsVisitModel
      const recentVisits = await AnalyticsVisitModel.find({
        timestamp: { $gte: cutoff }
      }).sort({ timestamp: -1 }).limit(100).lean();

      // Mapa para unificar utilizadores únicos por e-mail ou sessionId
      const onlineMap = new Map<string, any>();

      // Inserir da base de UserPresence
      for (const p of activePresence) {
        const key = p.userEmail || p.sessionId;
        if (key) {
          onlineMap.set(key, {
            userEmail: p.userEmail,
            userName: p.userName || (p.isGuest ? 'Visitante' : p.userEmail),
            userAvatar: (p as any).userAvatar || '',
            role: (p as any).role || 'user',
            currentPage: p.currentPage || '/',
            lastSeen: p.lastSeen,
            sessionId: p.sessionId,
            isGuest: !!p.isGuest,
            isOnline: true,
          });
        }
      }

      // Adicionar visitas recentes de AnalyticsVisit se ainda não estiverem no mapa
      for (const v of recentVisits) {
        const rawEmail = (v.userEmail as string | undefined) || '';
        const hasEmail = rawEmail.trim().length > 0;
        const key = hasEmail ? rawEmail.toLowerCase().trim() : `visitante_${(v.sessionId || 'anon').slice(-8)}@guest.local`;
        
        if (!onlineMap.has(key)) {
          const isGuest = !hasEmail;
          onlineMap.set(key, {
            userEmail: key,
            userName: isGuest ? `Visitante #${(v.sessionId || 'anon').slice(-4).toUpperCase()}` : v.userEmail,
            userAvatar: '',
            role: 'user',
            currentPage: v.page || '/',
            lastSeen: v.timestamp,
            sessionId: v.sessionId || '',
            isGuest,
            isOnline: true,
          });
        }
      }

      // 3. Cruzar com UserModel para garantir fotos de perfil dos utilizadores registados
      const registeredEmails = Array.from(onlineMap.values())
        .filter(u => !u.isGuest && u.userEmail && !u.userEmail.includes('@guest.local'))
        .map(u => u.userEmail.toLowerCase());

      if (registeredEmails.length > 0) {
        try {
          const dbUsers = await UserModel.find({ email: { $in: registeredEmails } })
            .select('email avatar name role')
            .lean();
          const userDbMap = new Map(dbUsers.map(u => [u.email.toLowerCase(), u]));

          Array.from(onlineMap.values()).forEach(item => {
            if (!item.isGuest && item.userEmail) {
              const dbUser = userDbMap.get(item.userEmail.toLowerCase());
              if (dbUser) {
                if (dbUser.avatar && !item.userAvatar) item.userAvatar = dbUser.avatar;
                if (dbUser.name && (!item.userName || item.userName === item.userEmail)) item.userName = dbUser.name;
                if (dbUser.role) item.role = dbUser.role;
              }
            }
          });
        } catch (_) {}
      }

      const online = Array.from(onlineMap.values()).sort((a, b) => (b.lastSeen > a.lastSeen ? 1 : -1));

      // Histórico de utilizadores vistos recentemente (últimas 30 sessões distintas)
      const allPresence = await UserPresenceModel.find({}).sort({ lastSeen: -1 }).limit(40).lean();
      
      const recentRegisteredEmails = allPresence
        .filter(p => !p.isGuest && p.userEmail && !p.userEmail.includes('@guest.local'))
        .map(p => p.userEmail.toLowerCase());

      let recentUserDbMap = new Map<string, any>();
      if (recentRegisteredEmails.length > 0) {
        try {
          const dbUsers = await UserModel.find({ email: { $in: recentRegisteredEmails } })
            .select('email avatar name role')
            .lean();
          recentUserDbMap = new Map(dbUsers.map(u => [u.email.toLowerCase(), u]));
        } catch (_) {}
      }

      const recent = allPresence.map((p: any) => {
        const dbUser = !p.isGuest ? recentUserDbMap.get(p.userEmail?.toLowerCase()) : null;
        return {
          userEmail: p.userEmail,
          userName: dbUser?.name || p.userName || (p.isGuest ? 'Visitante' : p.userEmail),
          userAvatar: dbUser?.avatar || p.userAvatar || '',
          role: dbUser?.role || p.role || 'user',
          currentPage: p.currentPage || '/',
          lastSeen: p.lastSeen,
          sessionId: p.sessionId,
          isGuest: !!p.isGuest,
        };
      });

      return NextResponse.json({
        online,
        recent,
        onlineCount: online.length
      });
    }
  } catch (e) {
    console.error('MongoDB error (analytics/presence):', e);
  }

  const online = FALLBACK_PRESENCE.filter(p => p.lastSeen >= cutoff);
  return NextResponse.json({
    online,
    recent: FALLBACK_PRESENCE.slice(0, 30),
    onlineCount: online.length
  });
}

// POST /api/analytics/presence — actualizar presença de utilizador ou visitante
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, userName, userAvatar, currentPage, sessionId, isAdmin } = body;

    // Não registar o próprio administrador como cliente online
    if (isAdmin) {
      return NextResponse.json({ success: true, admin: true });
    }

    const isGuest = !userEmail || !userEmail.trim();
    const cleanSession = sessionId || 'anon';
    const effectiveEmail = isGuest
      ? `visitante_${cleanSession.slice(-8)}@guest.local`
      : userEmail.toLowerCase().trim();

    let resolvedAvatar = userAvatar || '';
    let resolvedRole = 'user';
    let effectiveName = isGuest
      ? (userName && userName.trim() ? userName.trim() : `Visitante #${cleanSession.slice(-4).toUpperCase()}`)
      : (userName && userName.trim() ? userName.trim() : effectiveEmail);

    // Se é um utilizador registado, buscar foto do UserModel caso não venha no body
    if (!isGuest && await tryMongo()) {
      try {
        const dbUser = await UserModel.findOne({ email: effectiveEmail }).select('avatar name role').lean();
        if (dbUser) {
          if (!resolvedAvatar && dbUser.avatar) resolvedAvatar = dbUser.avatar;
          if (dbUser.name && (!userName || userName === effectiveEmail)) effectiveName = dbUser.name;
          if (dbUser.role) resolvedRole = dbUser.role;
        }
      } catch (err) {}
    }

    const now = new Date().toISOString();
    const presenceData = {
      userEmail: effectiveEmail,
      userName: effectiveName,
      userAvatar: resolvedAvatar,
      role: resolvedRole,
      lastSeen: now,
      currentPage: currentPage || '/',
      sessionId: cleanSession,
      isOnline: true,
      isGuest,
    };

    if (await tryMongo()) {
      try {
        await UserPresenceModel.findOneAndUpdate(
          { userEmail: effectiveEmail },
          presenceData,
          { upsert: true, new: true }
        );
        return NextResponse.json({ success: true });
      } catch (err) {
        console.warn('Presence MongoDB update warning:', err);
      }
    }

    // Fallback em memória
    const idx = FALLBACK_PRESENCE.findIndex(p => p.userEmail === effectiveEmail);
    if (idx >= 0) {
      FALLBACK_PRESENCE[idx] = presenceData;
    } else {
      FALLBACK_PRESENCE.unshift(presenceData);
    }
    if (FALLBACK_PRESENCE.length > 200) FALLBACK_PRESENCE = FALLBACK_PRESENCE.slice(0, 200);

    return NextResponse.json({ success: true });

  } catch (e) {
    return NextResponse.json({ success: true, fallback: true });
  }
}

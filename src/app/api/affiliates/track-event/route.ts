import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/serverAuth';
import Affiliate from '@/lib/models/Affiliate';
import AffiliateEvent, {
  AffiliateEventType,
  buildAnonymizedVisitorLabel,
  sanitizeEventMetadata,
} from '@/lib/models/AffiliateEvent';

export const dynamic = 'force-dynamic';

const VALID_EVENT_TYPES = new Set<AffiliateEventType>([
  'link_click',
  'page_view',
  'product_view',
  'signup',
  'add_to_cart',
  'checkout_start',
  'purchase_completed',
  'other',
]);

function deriveStageLabel(events: { eventType: AffiliateEventType }[]): {
  stage: string;
  stageKey: AffiliateEventType;
} {
  const types = new Set(events.map((e) => e.eventType));
  if (types.has('purchase_completed')) return { stage: 'Compra Concluída', stageKey: 'purchase_completed' };
  if (types.has('checkout_start')) return { stage: 'No Checkout', stageKey: 'checkout_start' };
  if (types.has('add_to_cart')) return { stage: 'Adicionou ao Carrinho', stageKey: 'add_to_cart' };
  if (types.has('signup')) return { stage: 'Criou Conta', stageKey: 'signup' };
  if (types.has('product_view')) return { stage: 'Viu Produto/Serviço', stageKey: 'product_view' };
  if (types.has('page_view')) return { stage: 'Navegando na Plataforma', stageKey: 'page_view' };
  return { stage: 'Clicou no Link', stageKey: 'link_click' };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const affiliateCode =
      request.cookies.get('affiliate_code')?.value ||
      (typeof body.affiliateCode === 'string' ? body.affiliateCode.trim() : '');

    if (!affiliateCode) {
      return NextResponse.json({ success: true, tracked: false });
    }

    const rawType = String(body.eventType || 'page_view') as AffiliateEventType;
    const eventType: AffiliateEventType = VALID_EVENT_TYPES.has(rawType) ? rawType : 'other';
    const sessionId =
      typeof body.sessionId === 'string' && body.sessionId.trim()
        ? body.sessionId.trim().slice(0, 64)
        : request.cookies.get('wh_aff_sid')?.value || 'anon';

    const page = typeof body.page === 'string' ? body.page.slice(0, 200) : '/';
    const productName = typeof body.productName === 'string' ? body.productName.slice(0, 120) : '';
    const metadata = sanitizeEventMetadata(body.metadata);

    await connectDB();

    const affiliate = await Affiliate.findOne({ affiliateCode, status: 'active' }).select('userId affiliateCode');
    if (!affiliate) {
      return NextResponse.json({ success: true, tracked: false });
    }

    const event = await AffiliateEvent.create({
      affiliateId: affiliate.userId,
      affiliateCode: affiliate.affiliateCode,
      sessionId,
      visitorLabel: buildAnonymizedVisitorLabel(sessionId),
      eventType,
      page,
      productName,
      metadata,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      tracked: true,
      eventId: event._id,
    });
  } catch (error) {
    console.error('[Affiliate Track-Event POST Error]:', error);
    return NextResponse.json({ success: false, tracked: false }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request).catch(() => null);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const eventTypeFilter = searchParams.get('eventType');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '150', 10) || 150, 10), 300);

    const isAdmin = sessionUser.role === 'admin' || sessionUser.role === 'super_admin';
    if (
      requestedUserId &&
      !isAdmin &&
      requestedUserId !== sessionUser.id &&
      requestedUserId.toLowerCase() !== sessionUser.email.toLowerCase()
    ) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const effectiveUserId = requestedUserId || sessionUser.id;
    const affiliate = await Affiliate.findOne({
      $or: [{ userId: effectiveUserId }, { userId: effectiveUserId.toLowerCase() }],
    }).select('userId affiliateCode');

    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'Afiliado não encontrado' }, { status: 404 });
    }

    const query: Record<string, any> = { affiliateId: affiliate.userId };
    if (eventTypeFilter && VALID_EVENT_TYPES.has(eventTypeFilter as AffiliateEventType)) {
      query.eventType = eventTypeFilter;
    }

    const events = await AffiliateEvent.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Agrupar por sessionId para mostrar a jornada completa de cada utilizador anonimizado
    const journeyMap = new Map<string, any[]>();
    for (const ev of events as any[]) {
      const sid = ev.sessionId || 'anon';
      if (!journeyMap.has(sid)) journeyMap.set(sid, []);
      journeyMap.get(sid)!.push(ev);
    }

    const journeys = Array.from(journeyMap.entries()).map(([sessionId, sessionEvents]) => {
      // Ordenar cronologicamente dentro da jornada
      const chronological = [...sessionEvents].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const { stage, stageKey } = deriveStageLabel(chronological);
      const lastEvent = chronological[chronological.length - 1];
      return {
        sessionId,
        visitorLabel: chronological[0]?.visitorLabel || buildAnonymizedVisitorLabel(sessionId),
        currentStage: stage,
        stageKey,
        eventsCount: chronological.length,
        firstSeenAt: chronological[0]?.createdAt,
        lastActivityAt: lastEvent?.createdAt,
        lastPage: lastEvent?.page || '/',
        events: chronological,
      };
    });

    // Resumo por tipo de evento
    const summary = {
      totalEvents: events.length,
      uniqueSessions: journeys.length,
      linkClicks: events.filter((e: any) => e.eventType === 'link_click').length,
      productViews: events.filter((e: any) => e.eventType === 'product_view').length,
      signups: events.filter((e: any) => e.eventType === 'signup').length,
      addToCarts: events.filter((e: any) => e.eventType === 'add_to_cart').length,
      checkoutStarts: events.filter((e: any) => e.eventType === 'checkout_start').length,
      purchases: events.filter((e: any) => e.eventType === 'purchase_completed').length,
    };

    return NextResponse.json({
      success: true,
      summary,
      journeys,
      events,
    });
  } catch (error) {
    console.error('[Affiliate Track-Event GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar eventos de monitorização.' },
      { status: 500 }
    );
  }
}

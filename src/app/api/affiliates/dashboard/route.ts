import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSessionUser } from '@/lib/serverAuth';
import Affiliate from '@/lib/models/Affiliate';
import Commission from '@/lib/models/Commission';
import AffiliateClick from '@/lib/models/AffiliateClick';
import { withCache, CacheKeys, invalidateCacheOnChange } from '@/lib/affiliateCache';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    const bypassCache = searchParams.get('bypassCache') === 'true';

    // Segurança: validar sessão e impedir acesso ao painel de outro afiliado
    const internalAuthHeader = request.headers.get('x-internal-auth');
    const sessionUser = await getSessionUser(request).catch(() => null);

    if (!internalAuthHeader) {
      if (!sessionUser) {
        return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
      }
      const isAdmin = sessionUser.role === 'admin' || sessionUser.role === 'super_admin';
      if (!userId) {
        userId = sessionUser.id;
      } else if (
        !isAdmin &&
        userId !== sessionUser.id &&
        userId.toLowerCase() !== sessionUser.email.toLowerCase()
      ) {
        return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
      }
    }

    console.log('[Affiliate Dashboard] Request received with userId:', userId);

    // Se não tiver userId, tentar obter do header de autenticação interna
    if (!userId) {
      const internalAuth = request.headers.get('x-internal-auth');
      if (!internalAuth) {
        console.log('[Affiliate Dashboard] No userId and no internal auth header');
        return NextResponse.json({ success: false, error: 'Afiliado não encontrado' }, { status: 404 });
      }
      
      // REMOVIDO: Fallback perigoso que selecionava o primeiro usuário ativo
      // Isso violava o isolamento de dados. Agora exige userId explícito.
      console.log('[Affiliate Dashboard] userId required - no fallback allowed');
      return NextResponse.json({ success: false, error: 'userId é obrigatório' }, { status: 400 });
    }

    const cacheKey = CacheKeys.AFFILIATE_DASHBOARD(userId);

    // Função para buscar dados do banco
    const fetchFromDatabase = async () => {
      // Get affiliate data - try by userId first, then by email as fallback
      console.log('[Affiliate Dashboard] Searching for affiliate with userId:', userId);
      let affiliate = await Affiliate.findOne({ userId });
      console.log('[Affiliate Dashboard] Affiliate found by userId:', affiliate);
      
      if (!affiliate && userId.includes('@')) {
        // Fallback: try to find by email if userId looks like an email
        console.log('[Affiliate Dashboard] Trying to find by email:', userId);
        affiliate = await Affiliate.findOne({ userId: userId.toLowerCase() });
        console.log('[Affiliate Dashboard] Affiliate found by email:', affiliate);
      }
      
      if (!affiliate) {
        console.log('[Affiliate Dashboard] Affiliate not found in database');
        throw new Error('NOT_FOUND');
      }

      console.log('[Affiliate Dashboard] Affiliate found successfully:', affiliate.affiliateCode);

      // Get commissions
      const commissions = await Commission.find({ affiliateId: affiliate.userId })
        .sort({ createdAt: -1 })
        .limit(50);

      // Get recent clicks (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentClicks = await AffiliateClick.find({
        affiliateId: affiliate.userId,
        clickedAt: { $gte: thirtyDaysAgo.toISOString() }
      }).sort({ clickedAt: -1 }).limit(100);

      // 🎯 Buscar utilizadores cadastrados pelo link deste afiliado (Leads)
      const UserModel = (await import('@/lib/models/User')).default;
      const referredUsersDocs = await UserModel.find({
        referredBy: affiliate.affiliateCode
      }).sort({ createdAt: -1 }).limit(100).lean();

      const referredUsers = referredUsersDocs.map((u: any) => {
        const userHasConverted = commissions.some(
          c => c.referredCustomerEmail?.toLowerCase() === u.email?.toLowerCase() ||
               c.referredCustomerId === u.id
        );

        return {
          id: u.id,
          name: u.name || 'Utilizador',
          email: u.email,
          createdAt: u.createdAt,
          status: u.status || 'active',
          plan: u.plan || 'none',
          hasConverted: userHasConverted
        };
      });

      // Calculate stats
      const pendingCommissions = commissions.filter(c => c.status === 'pending');
      const approvedCommissions = commissions.filter(c => c.status === 'approved');
      const paidCommissions = commissions.filter(c => c.status === 'paid');

      const stats = {
        totalClicks: affiliate.totalClicks,
        totalConversions: affiliate.totalConversions,
        totalReferredUsers: referredUsers.length,
        conversionRate: affiliate.conversionRate,
        totalEarnings: affiliate.totalEarnings,
        availableBalance: affiliate.availableBalance,
        pendingAmount: pendingCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
        approvedAmount: approvedCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
        paidAmount: paidCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
      };

      return {
        affiliate,
        commissions,
        referredUsers,
        recentClicks,
        stats
      };
    };

    // Usar cache se não estiver solicitando bypass
    if (!bypassCache) {
      try {
        const cachedData = await withCache(cacheKey, fetchFromDatabase, 5 * 60 * 1000); // 5 minutos
        return NextResponse.json({ 
          success: true, 
          ...cachedData,
          cached: true
        });
      } catch (error) {
        if ((error as Error).message === 'NOT_FOUND') {
          return NextResponse.json({ success: false, error: 'Afiliado não encontrado' }, { status: 404 });
        }
        throw error;
      }
    }

    // Se bypass cache, buscar diretamente do banco
    const data = await fetchFromDatabase();
    return NextResponse.json({ 
      success: true, 
      ...data,
      cached: false
    });

  } catch (error) {
    console.error('Erro ao buscar dashboard de afiliado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar dashboard de afiliado' 
    }, { status: 500 });
  }
}

import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import AffiliateClick from '@/lib/models/AffiliateClick';
import AffiliateEvent, { buildAnonymizedVisitorLabel } from '@/lib/models/AffiliateEvent';
import { cookies } from 'next/headers';

// SEO FIX: Esta página anteriormente redirecionava para /api/affiliates/[code]
// gerando uma cadeia de 2 redirects: /ref → /api → /
// Agora processa o rastreamento diretamente e faz um único redirect para /
export default async function ReferralPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams?: { to?: string };
}) {
  const { code } = params;
  const rawTo = searchParams?.to || '/';
  const targetPath = rawTo.startsWith('/') && !rawTo.startsWith('//') ? rawTo : '/';

  try {
    await connectDB();

    const affiliate = await Affiliate.findOne({ affiliateCode: code });

    if (affiliate && affiliate.status === 'active') {
      // Identificador de sessão anonimizado para monitorização de jornada
      const cookieStore = cookies();
      const existingSid = cookieStore.get('wh_aff_sid')?.value;
      const sessionId =
        existingSid ||
        Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

      // Registar o clique de forma assíncrona (sem bloquear o redirect)
      try {
        await AffiliateClick.create({
          affiliateId: affiliate.userId,
          affiliateCode: code,
          clickedAt: new Date().toISOString(),
          ipAddress: 'unknown',
          userAgent: 'unknown',
          referrer: 'unknown',
          convertedToSale: false,
          landingPage: targetPath,
        });

        await Affiliate.findByIdAndUpdate(
          affiliate._id,
          { $inc: { totalClicks: 1 } }
        );

        await AffiliateEvent.create({
          affiliateId: affiliate.userId,
          affiliateCode: code,
          sessionId,
          visitorLabel: buildAnonymizedVisitorLabel(sessionId),
          eventType: 'link_click',
          page: targetPath,
          metadata: { source: 'referral_link' },
          createdAt: new Date().toISOString(),
        });
      } catch (trackErr) {
        console.error('[Ref] Erro ao registar clique:', trackErr);
      }

      // Definir cookies de afiliado (30 dias)
      cookieStore.set('affiliate_code', code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 dias
        path: '/',
      });
      cookieStore.set('wh_aff_sid', sessionId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });
      cookieStore.set('wh_has_ref', '1', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });
    }
  } catch (err) {
    console.error('[Ref] Erro ao processar referral:', err);
  }

  // Redirect único direto para o destino — sem cadeia intermédia
  redirect(targetPath);
}

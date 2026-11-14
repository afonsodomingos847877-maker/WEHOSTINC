import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import AffiliateClick from '@/lib/models/AffiliateClick';
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
      } catch (trackErr) {
        console.error('[Ref] Erro ao registar clique:', trackErr);
      }

      // Definir cookie de afiliado (será persistido pelo middleware/Next.js)
      cookies().set('affiliate_code', code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 dias
        path: '/',
      });
    }
  } catch (err) {
    console.error('[Ref] Erro ao processar referral:', err);
  }

  // Redirect único direto para o destino — sem cadeia intermédia
  redirect(targetPath);
}

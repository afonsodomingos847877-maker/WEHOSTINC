import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AiSiteModel from '@/lib/models/AiSite';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;
    if (!slug) {
      return new Response('Slug inválido', { status: 400 });
    }

    await connectDB();
    const cleanIdentifier = slug.toLowerCase();
    const site = await AiSiteModel.findOneAndUpdate(
      {
        $or: [
          { slug: cleanIdentifier },
          { subdomain: cleanIdentifier },
          { customDomain: cleanIdentifier }
        ]
      },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();

    if (!site || !site.htmlContent) {
      return new Response(
        `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Site Não Encontrado - WEHOSTHERE</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6 text-center font-sans">
  <div class="max-w-md">
    <div class="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-500 mx-auto flex items-center justify-center text-3xl font-black mb-6">?</div>
    <h1 class="text-2xl font-bold mb-3">Site Não Encontrado</h1>
    <p class="text-slate-400 text-sm mb-6">Este endereço não existe ou ainda não foi publicado na plataforma WEHOSTHERE.</p>
    <a href="https://www.wehosthere.com" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition">Ir para WEHOSTHERE</a>
  </div>
</body>
</html>`,
        {
          status: 404,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        }
      );
    }

    const isPublished = site.status === 'published';
    let html = site.htmlContent;

    // Se não tiver canonical, injeta a URL primária para evitar conteúdo duplicado entre subdomínio e /site/[slug]
    const canonicalDomain = site.customDomain 
      ? `https://${site.customDomain}` 
      : `https://${site.subdomain || site.slug}.wehosthere.com`;

    if (!html.includes('rel="canonical"') && !html.includes("rel='canonical'")) {
      const canonicalTag = `<link rel="canonical" href="${canonicalDomain}" />`;
      if (html.includes('</head>')) {
        html = html.replace('</head>', `  ${canonicalTag}\n</head>`);
      }
    }

    // Retorna o HTML puro com cabeçalhos otimizados para motores de busca
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': isPublished ? 'public, max-age=60, s-maxage=300' : 'no-store, no-cache',
        'X-Robots-Tag': isPublished ? 'index, follow' : 'noindex, nofollow',
        'X-Powered-By': 'WEHOSTHERE AI Cloud',
      },
    });
  } catch (err: any) {
    console.error('Erro ao servir site público:', err);
    return new Response('Erro interno do servidor', { status: 500 });
  }
}

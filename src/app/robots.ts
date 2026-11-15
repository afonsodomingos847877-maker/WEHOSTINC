import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
      {
        userAgent: 'Google-AdSense',
        allow: '/',
      },
      {
        userAgent: '*',
        allow: [
          '/', 
          '/login', 
          '/register', 
          '/site-quote', 
          '/webmail', 
          '/blog', 
          '/blog/*', 
          '/revista',
          '/revista/*',
          '/terms', 
          '/privacy', 
          '/systems', 
          '/ads.txt',
          '/dominios',
          '/dominio-co-mz',
          '/hospedagem',
          '/hospedagem-wordpress',
          '/vps',
          '/email-profissional',
          '/email-corporativo',
          '/criar-site',
          '/loja-online',
          '/vendas-online',
          '/dropshipping',
          '/produtos-digitais',
          '/plr',
          '/inteligencia-artificial',
          '/ai-website-builder',
          '/pagamentos-online',
          '/scalepay',
          '/sistema-erp',
        ],
        // SEO FIX: Adicionado /ref/ ao disallow - são links de afiliados que apenas
        // redirecionam e não têm conteúdo indexável. Mantê-los no crawl do Google
        // gerava cadeias de redirecionamento no Search Console.
        disallow: ['/dashboard/', '/admin/', '/api/', '/ref/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

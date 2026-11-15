import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orçamento de Site Profissional | WEHOSTHERE',
  description: 'Solicite um orçamento personalizado para criação do seu site profissional, loja online ou sistema web em Moçambique. Resposta rápida e preço justo.',
  keywords: ['orçamento site', 'criar site Moçambique', 'preço site', 'cotação website', 'orçamento loja online', 'desenvolvimento web preço'],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Orçamento de Site Profissional | WEHOSTHERE',
    description: 'Peça um orçamento para o seu site ou loja online em Moçambique. Resposta em 24h.',
    url: 'https://www.wehosthere.com/site-quote',
    siteName: 'WEHOSTHERE',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Orçamento de Site Profissional em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orçamento de Site | WEHOSTHERE',
    description: 'Peça um orçamento para o seu site ou loja online em Moçambique.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
  alternates: {
    canonical: 'https://www.wehosthere.com/site-quote',
  },
};

export default function SiteQuoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

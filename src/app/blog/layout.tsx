import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Blog - WEHOSTHERE | Dicas de Hospedagem, Domínios e Tecnologia',
    template: '%s | WEHOSTHERE Blog',
  },
  description: 'Artigos, tutoriais e notícias sobre hospedagem de sites, registo de domínios, email corporativo, IA e tecnologia web.',
  keywords: [
    'blog hospedagem',
    'tutoriais web',
    'dicas domínios',
    'hospedagem sites dicas',
    'tecnologia web',
    'WEHOSTHERE blog',
    'notícias hosting',
    'email corporativo tutorial',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: 'https://www.wehosthere.com/blog',
    siteName: 'WEHOSTHERE',
    title: 'Blog - WEHOSTHERE | Hospedagem & Tecnologia',
    description: 'Artigos e tutoriais sobre hospedagem de sites, domínios e tecnologia web.',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - WEHOSTHERE',
    description: 'Artigos e tutoriais sobre hospedagem e tecnologia web.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}

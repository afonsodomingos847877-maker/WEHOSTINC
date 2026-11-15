import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Catálogo de Softwares e Sistemas Web Prontos | WEHOSTHERE',
  description: 'Explore o catálogo de softwares e sistemas web prontos da WEHOSTHERE para empresas em Moçambique: gestão escolar, ERP, imobiliário, clínicas e muito mais.',
  alternates: { canonical: `${SITE_URL}/systems` },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: `${SITE_URL}/systems`,
    title: 'Catálogo de Softwares e Sistemas Web Prontos | WEHOSTHERE',
    description: 'Explore o catálogo de softwares e sistemas web prontos da WEHOSTHERE para empresas em Moçambique.',
    images: [
      {
        url: `${SITE_URL}/servidores-banner.png`,
        secureUrl: `${SITE_URL}/servidores-banner.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Catálogo de Sistemas Web',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catálogo de Softwares e Sistemas Web | WEHOSTHERE',
    description: 'Softwares e sistemas web prontos para a sua empresa.',
    images: [`${SITE_URL}/servidores-banner.png`],
  },
};

export default function SystemsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

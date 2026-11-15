import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'WEHOSTHERE - Hospedagem de Sites & Domínios em Moçambique',
  description: 'Hospedagem rápida e segura, email corporativo e registo de domínios em Moçambique. Crie a sua presença online com a WEHOSTHERE.',
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: SITE_URL,
    title: 'WEHOSTHERE - Hospedagem de Sites & Domínios em Moçambique',
    description: 'Hospedagem rápida e segura, email corporativo e registo de domínios em Moçambique.',
    images: [
      {
        url: `${SITE_URL}/servidores-banner.png`,
        secureUrl: `${SITE_URL}/servidores-banner.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WEHOSTHERE - Hospedagem de Sites & Domínios em Moçambique',
    description: 'Hospedagem rápida e segura, email corporativo e registo de domínios em Moçambique.',
    images: [`${SITE_URL}/servidores-banner.png`],
  },
};

export default function RefLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

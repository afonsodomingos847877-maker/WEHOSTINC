import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Criar Conta Gratuita | WEHOSTHERE',
  description:
    'Crie a sua conta WEHOSTHERE gratuitamente e comece a hospedar o seu site, configurar emails corporativos e registar domínios em Moçambique.',
  alternates: { canonical: `${SITE_URL}/register` },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Criar Conta Gratuita - WEHOSTHERE',
    description: 'Registe-se gratuitamente e comece a hospedar o seu site em Moçambique.',
    url: `${SITE_URL}/register`,
    siteName: 'WEHOSTHERE',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Criar Conta de Hospedagem em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Criar Conta Gratuita | WEHOSTHERE',
    description: 'Registe-se e comece a hospedar o seu site em Moçambique.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

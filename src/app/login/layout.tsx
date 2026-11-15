import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Entrar na Minha Conta | WEHOSTHERE',
  description:
    'Aceda ao seu painel WEHOSTHERE para gerir os seus sites, emails, domínios e faturas.',
  alternates: { canonical: `${SITE_URL}/login` },
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Entrar na Conta | WEHOSTHERE',
    description: 'Aceda ao seu painel de gestão de hospedagem, domínios e email.',
    url: `${SITE_URL}/login`,
    siteName: 'WEHOSTHERE',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Painel de Gestão de Hospedagem',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Entrar na Conta | WEHOSTHERE',
    description: 'Aceda ao painel de gestão de hospedagem, domínios e email.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

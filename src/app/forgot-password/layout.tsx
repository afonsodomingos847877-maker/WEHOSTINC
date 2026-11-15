import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

// SEO: Pagina de recuperacao de password - nao deve ser indexada.
export const metadata: Metadata = {
  title: 'Recuperar Senha | WEHOSTHERE',
  description: 'Recupere o acesso à sua conta WEHOSTHERE.',
  alternates: { canonical: `${SITE_URL}/forgot-password` },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: `${SITE_URL}/forgot-password`,
    title: 'Recuperar Senha | WEHOSTHERE',
    description: 'Recupere o acesso à sua conta WEHOSTHERE.',
    images: [
      {
        url: `${SITE_URL}/servidores-banner.png`,
        secureUrl: `${SITE_URL}/servidores-banner.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Recuperar Senha',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recuperar Senha | WEHOSTHERE',
    description: 'Recupere o acesso à sua conta WEHOSTHERE.',
    images: [`${SITE_URL}/servidores-banner.png`],
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

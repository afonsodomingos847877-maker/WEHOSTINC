import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Webmail Corporativo | WEHOSTHERE',
  description: 'Aceda à sua caixa de entrada de email corporativo WEHOSTHERE. Envie e receba emails profissionais com total segurança e rapidez.',
  manifest: '/manifest-webmail.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Webmail',
  },
  alternates: { canonical: `${SITE_URL}/webmail` },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: `${SITE_URL}/webmail`,
    title: 'Webmail Corporativo | WEHOSTHERE',
    description: 'Aceda à sua caixa de correio eletrónico profissional WEHOSTHERE.',
    images: [
      {
        url: `${SITE_URL}/servidores-banner.png`,
        secureUrl: `${SITE_URL}/servidores-banner.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE — Webmail Corporativo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Webmail Corporativo | WEHOSTHERE',
    description: 'Aceda ao seu email corporativo WEHOSTHERE.',
    images: [`${SITE_URL}/servidores-banner.png`],
  },
};

export default function WebmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

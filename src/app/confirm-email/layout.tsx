import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

// SEO: Pagina de confirmacao de email - nao deve ser indexada.
export const metadata: Metadata = {
  title: 'Confirmar Email | WEHOSTHERE',
  description: 'Verifique o seu email para confirmar o registo na WEHOSTHERE.',
  alternates: { canonical: `${SITE_URL}/confirm-email` },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: `${SITE_URL}/confirm-email`,
    title: 'Confirmar Email | WEHOSTHERE',
    description: 'Verifique o seu email para confirmar o registo na WEHOSTHERE.',
    images: [
      {
        url: `${SITE_URL}/servidores-banner.png`,
        secureUrl: `${SITE_URL}/servidores-banner.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Confirmar Email',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Confirmar Email | WEHOSTHERE',
    description: 'Verifique o seu email para confirmar o registo na WEHOSTHERE.',
    images: [`${SITE_URL}/servidores-banner.png`],
  },
};

export default function ConfirmEmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

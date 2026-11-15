import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Redefinir Senha | WEHOSTHERE',
  description: 'Defina uma nova senha para aceder à sua conta WEHOSTHERE.',
  alternates: { canonical: `${SITE_URL}/reset-password` },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: `${SITE_URL}/reset-password`,
    title: 'Redefinir Senha | WEHOSTHERE',
    description: 'Defina uma nova senha para aceder à sua conta WEHOSTHERE.',
    images: [
      {
        url: `${SITE_URL}/servidores-banner.png`,
        secureUrl: `${SITE_URL}/servidores-banner.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Redefinir Senha',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Redefinir Senha | WEHOSTHERE',
    description: 'Defina uma nova senha para aceder à sua conta WEHOSTHERE.',
    images: [`${SITE_URL}/servidores-banner.png`],
  },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

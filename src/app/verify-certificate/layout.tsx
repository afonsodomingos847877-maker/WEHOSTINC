import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Verificar Autenticidade de Certificado | WEHOSTHERE Academy',
  description: 'Consulte e verifique a autenticidade de certificados emitidos pelos cursos e formações da WEHOSTHERE Academy.',
  alternates: { canonical: `${SITE_URL}/verify-certificate` },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: `${SITE_URL}/verify-certificate`,
    title: 'Verificar Autenticidade de Certificado | WEHOSTHERE Academy',
    description: 'Consulte e verifique a autenticidade de certificados emitidos pela WEHOSTHERE Academy.',
    images: [
      {
        url: `${SITE_URL}/servidores-banner.png`,
        secureUrl: `${SITE_URL}/servidores-banner.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE Academy - Verificação de Certificados',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verificar Certificado | WEHOSTHERE Academy',
    description: 'Verificação online de certificados da WEHOSTHERE Academy.',
    images: [`${SITE_URL}/servidores-banner.png`],
  },
};

export default function VerifyCertificateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

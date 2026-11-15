import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Academia WEHOSTHERE - Cursos Práticos de Tecnologia e IA em Moçambique',
  description:
    'Aprende a criar, escalar e monetizar na era digital com os cursos práticos da Academia WEHOSTHERE em Moçambique. Certificado oficial e pagamento via M-Pesa.',
  keywords: [
    'cursos online Moçambique',
    'Academia WEHOSTHERE',
    'curso inteligência artificial Moçambique',
    'curso desenvolvimento web Maputo',
    'formação tecnológica Moçambique',
    'certificado oficial curso online',
  ],
  alternates: {
    canonical: `${SITE_URL}/academy`,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: `${SITE_URL}/academy`,
    title: 'Academia WEHOSTHERE - Cursos Práticos de Tecnologia e IA em Moçambique',
    description:
      'Formação prática para o mercado real com especialistas, certificado oficial e pagamento em Meticais.',
    images: [
      {
        url: `${SITE_URL}/servidores-banner.png`,
        width: 1200,
        height: 630,
        alt: 'Academia WEHOSTHERE Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Academia WEHOSTHERE - Cursos Práticos em Moçambique',
    description: 'Cursos diretos ao ponto com especialistas e certificado oficial.',
    images: [`${SITE_URL}/servidores-banner.png`],
  },
};

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

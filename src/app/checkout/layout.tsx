import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

// SEO: A pagina de checkout nao deve ser indexada pelo Google.
// E uma pagina dinamica de compra que nao tem valor de pesquisa organica.
export const metadata: Metadata = {
  title: 'Checkout - Finalizar Compra | WEHOSTHERE',
  description: 'Finalize a sua compra de serviços WEHOSTHERE. Hospedagem, domínios, email corporativo e muito mais.',
  alternates: { canonical: `${SITE_URL}/checkout` },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    title: 'Finalizar Compra | WEHOSTHERE',
    description: 'Complete a sua encomenda de serviços de hospedagem, domínios e email profissional.',
    url: `${SITE_URL}/checkout`,
    siteName: 'WEHOSTHERE',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        secureUrl: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE - Checkout de Serviços de Hospedagem',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Finalizar Compra | WEHOSTHERE',
    description: 'Complete a sua encomenda de serviços WEHOSTHERE.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

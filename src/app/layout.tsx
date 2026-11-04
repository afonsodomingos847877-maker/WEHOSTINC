import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import SocialProofToast from "@/components/SocialProofToast";
import FeedbackWidget from "@/components/FeedbackWidget";
import AdminAiTopBar from "@/components/AdminAiTopBar";
import SmartThemeSuggestion from "@/components/SmartThemeSuggestion";
import { ThemeProvider } from "@/context/ThemeContext";
import { SITE_URL } from "@/lib/siteConfig";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: '--font-poppins'
});

const BASE_URL = 'https://www.wehosthere.com';
const OG_IMAGE_URL = `${BASE_URL}/servidores-banner.png`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'WEHOSTHERE — Hospedagem de Sites & Email Profissional em Moçambique',
    template: '%s | WEHOSTHERE',
  },
  description:
    'Hospedagem de sites rápida e segura, email corporativo, registo de domínios e criação de sites profissionais em Moçambique. Suporte local 24/7. A partir de 550 MT/mês.',
  keywords: [
    'hospedagem de sites Moçambique',
    'hosting Moçambique',
    'email corporativo Moçambique',
    'registo de domínios .co.mz',
    'criação de sites Maputo',
    'servidor VPS Moçambique',
    'web hosting barato Moçambique',
    'WEHOSTHERE',
    'alojamento web',
    'domínios Moçambique',
  ],
  authors: [{ name: 'WEHOSTHERE', url: BASE_URL }],
  creator: 'WEHOSTHERE',
  publisher: 'WEHOSTHERE Infraestruturas & Cloud Moçambique',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: BASE_URL,
    siteName: 'WEHOSTHERE',
    title: 'WEHOSTHERE — Hospedagem de Sites & Email Profissional em Moçambique',
    description:
      'Hospedagem de sites rápida e segura, email corporativo, registo de domínios e criação de sites profissionais em Moçambique. A partir de 550 MT/mês.',
    images: [
      {
        url: OG_IMAGE_URL,
        secureUrl: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'WEHOSTHERE — Hospedagem Profissional em Moçambique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WEHOSTHERE — Hospedagem de Sites & Email em Moçambique',
    description:
      'Hospedagem de sites, email corporativo e registo de domínios em Moçambique. A partir de 550 MT/mês.',
    images: [OG_IMAGE_URL],
    creator: '@wehosthere',
  },
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/mascote-transparent.png', sizes: 'any', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/mascote-transparent.png',
    apple: [
      { url: '/mascote-transparent.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: [
      '-WIDb6-E1CZzvXz2qkam2i118tdjPuEsgdnpbTpA7_0',
      'qv9KkmeWVR-rCTkCP4KxWRkN0E1IJKDkrjsv40nDZ1w',
    ],
    other: {
      'msvalidate.01': 'D4BB59AFE8DE80471DF0E7FC4E0A9B87',
    },
  },
  other: {
    'google-adsense-account': 'ca-pub-5452584470581302',
    'msvalidate.01': 'D4BB59AFE8DE80471DF0E7FC4E0A9B87',
  },
  category: 'technology',
};

import { LanguageProvider } from "@/context/LanguageContext";
import OfflineDetector from "@/components/OfflineDetector";
import MaintenanceGate from "@/components/MaintenanceGate";
import Providers from "@/components/Providers";
import ScrollUpCards from "@/components/ScrollUpCards";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-MZ">
      <head>
        {/* Google Site Verification — Múltiplas Contas Search Console */}
        <meta name="google-site-verification" content="-WIDb6-E1CZzvXz2qkam2i118tdjPuEsgdnpbTpA7_0" />
        <meta name="google-site-verification" content="qv9KkmeWVR-rCTkCP4KxWRkN0E1IJKDkrjsv40nDZ1w" />
        {/* Bing Webmaster Tools Verification */}
        <meta name="msvalidate.01" content="D4BB59AFE8DE80471DF0E7FC4E0A9B87" />
        {/* Google AdSense — lido pelo Mediapartners-Google como script estático no <head> */}
        <meta name="google-adsense-account" content="ca-pub-5452584470581302" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5452584470581302"
          crossOrigin="anonymous"
        />
        {/* GEO: Organization — identidade de entidade rica para LLMs */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": "https://www.wehosthere.com/#organization",
              "name": "WEHOSTHERE",
              "alternateName": ["WeHostHere", "WeHost", "WEHOSTHERE Moçambique"],
              "url": "https://www.wehosthere.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://www.wehosthere.com/logo.png",
                "width": 300,
                "height": 60
              },
              "description": "WEHOSTHERE é o principal provedor de hospedagem web, registo de domínios e serviços digitais de Moçambique. Oferecemos hosting partilhado, VPS, email corporativo, construtor de sites com IA e soluções de e-commerce para empresas em Moçambique, África e no mundo.",
              "foundingDate": "2026",
              "foundingLocation": {
                "@type": "Place",
                "name": "Maputo, Moçambique"
              },
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "MZ",
                "addressLocality": "Maputo",
                "addressRegion": "Maputo"
              },
              "contactPoint": [
                {
                  "@type": "ContactPoint",
                  "telephone": "+258-84-438-4702",
                  "contactType": "customer support",
                  "availableLanguage": ["Portuguese", "English"],
                  "areaServed": ["MZ", "AO", "PT", "BR", "Worldwide"],
                  "hoursAvailable": "Mo-Su 00:00-24:00"
                },
                {
                  "@type": "ContactPoint",
                  "contactType": "sales",
                  "email": "suporte@wehosthere.com",
                  "availableLanguage": ["Portuguese", "English"]
                }
              ],
              "sameAs": [
                "https://www.wikidata.org/wiki/Q141798199",
                "https://www.facebook.com/wehosthere",
                "https://www.instagram.com/wehosthere"
              ],
              "knowsAbout": [
                "Web Hosting",
                "Domain Registration",
                "VPS Servers",
                "Business Email",
                "WordPress Hosting",
                "E-commerce Solutions",
                "AI Website Builder",
                "Mozambique Tech Ecosystem",
                "M-Pesa Integration",
                "Digital Marketing Africa"
              ],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "WEHOSTHERE Hosting & Digital Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Hospedagem de Sites",
                      "url": "https://www.wehosthere.com/hospedagem",
                      "description": "Planos de alojamento web a partir de 550 MT/mês com SSD, SSL e suporte 24/7"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "VPS Server",
                      "url": "https://www.wehosthere.com/vps",
                      "description": "Servidores virtuais privados com acesso root, SSD NVMe e IP dedicado"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Registo de Domínio .co.mz",
                      "url": "https://www.wehosthere.com/dominio-co-mz",
                      "description": "Registo oficial de domínios .co.mz — o TLD nacional de Moçambique"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Email Corporativo",
                      "url": "https://www.wehosthere.com/email-corporativo",
                      "description": "Email profissional com domínio próprio, webmail e proteção anti-spam"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "SoftwareApplication",
                      "name": "AI Website Builder",
                      "url": "https://www.wehosthere.com/ai-website-builder",
                      "description": "Construtor de sites com inteligência artificial — cria um site profissional em minutos",
                      "applicationCategory": "WebApplication"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Desenvolvimento de Sistemas e Plataformas",
                      "url": "https://www.wehosthere.com/systems",
                      "description": "Criação e aluguer de sistemas de gestão, ERP, POS e software empresarial em Moçambique"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Criação de Sites Profissionais",
                      "url": "https://www.wehosthere.com/criar-site",
                      "description": "Desenvolvimento de websites modernos e responsivos com cotação online imediata"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Lojas Virtuais e Pagamentos M-Pesa",
                      "url": "https://www.wehosthere.com/loja-online",
                      "description": "Soluções de e-commerce com integração automática de pagamentos M-Pesa e e-Mola"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Periodical",
                      "name": "Revista Codando Histórias",
                      "url": "https://www.wehosthere.com/revista",
                      "description": "Revista digital moçambicana sobre tecnologia, programação, startups e inovação"
                    }
                  }
                ]
              }
            })
          }}
        />
        {/* GEO: WebSite + SearchAction — habilita Sitelinks Search Box e sinais para AI search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": "https://www.wehosthere.com/#website",
              "url": "https://www.wehosthere.com",
              "name": "WEHOSTHERE",
              "description": "Hospedagem de sites, registo de domínios, email corporativo e AI Website Builder para empresas em Moçambique e no mundo.",
              "publisher": {
                "@id": "https://www.wehosthere.com/#organization"
              },
              "inLanguage": ["pt", "en"],
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://www.wehosthere.com/dominios?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        {/* GEO: FAQPage — respostas directas a perguntas comuns para AI Overviews e LLMs */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Qual é o hosting mais barato em Moçambique?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A WEHOSTHERE oferece hospedagem de sites a partir de 550 MT/mês, sendo uma das opções mais acessíveis em Moçambique com SSD, SSL incluído e suporte 24/7 em português."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Como registar um domínio .co.mz?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Para registar um domínio .co.mz, acede a wehosthere.com/dominio-co-mz, pesquisa o nome pretendido e conclui o registo online. A WEHOSTHERE é um registador acreditado de domínios .co.mz em Moçambique."
                  }
                },
                {
                  "@type": "Question",
                  "name": "A WEHOSTHERE aceita M-Pesa?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sim. A WEHOSTHERE aceita M-Pesa, e-Mola, Visa e Mastercard para pagamento de todos os planos de hosting, domínios e serviços digitais."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Posso criar um site sem saber programar?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sim. O AI Website Builder da WEHOSTHERE permite criar um site profissional usando inteligência artificial, sem qualquer conhecimento de programação. Basta descrever o teu negócio e o AI cria o site automaticamente."
                  }
                },
                {
                  "@type": "Question",
                  "name": "A WEHOSTHERE tem suporte em português?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sim. Todo o suporte da WEHOSTHERE é prestado em português, 24/7, via WhatsApp (+258 84 438 4702) e email (suporte@wehosthere.com)."
                  }
                },
                {
                  "@type": "Question",
                  "name": "O que é a Codando Histórias?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Codando Histórias é a revista digital de tecnologia e empreendedorismo da WEHOSTHERE, publicada em português. Aborda programação, desenvolvimento web, IA, marketing digital e o ecossistema tech de Moçambique."
                  }
                },
                {
                  "@type": "Question",
                  "name": "A WEHOSTHERE tem programa de afiliados?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sim. O programa de afiliados da WEHOSTHERE paga comissões por cada cliente indicado. Regista-te em wehosthere.com/ref para obteres o teu link exclusivo."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Qual é a diferença entre hosting partilhado e VPS?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No hosting partilhado, o servidor é partilhado entre vários clientes, sendo ideal para sites de pequenas empresas e blogs. O VPS (Servidor Virtual Privado) oferece recursos dedicados, acesso root e maior desempenho, sendo recomendado para aplicações com alto tráfego ou necessidades técnicas avançadas."
                  }
                }
              ]
            })
          }}
        />
        <meta property="og:image" content="https://www.wehosthere.com/servidores-banner.png" />
        <meta property="og:image:secure_url" content="https://www.wehosthere.com/servidores-banner.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content="https://www.wehosthere.com/servidores-banner.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body className={poppins.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TVTSMB2P"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-TVTSMB2P');`}
        </Script>
        {/* End Google Tag Manager */}
        {/* Google Analytics (GA4) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-H17B21ZCY8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-H17B21ZCY8');
          `}
        </Script>
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1468106138155619');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img height="1" width="1" style={{display:'none'}} src="https://www.facebook.com/tr?id=1468106138155619&ev=PageView&noscript=1" alt=""/>
        </noscript>
        <Script id="service-worker" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('Service Worker registrado com sucesso:', registration);
                  })
                  .catch((error) => {
                    console.log('Erro ao registrar Service Worker:', error);
                  });
              });
            }
          `}
        </Script>
        <Providers>
          <ThemeProvider>
          <LanguageProvider>
            <MaintenanceGate>
              {children}
            </MaintenanceGate>
            <OfflineDetector />
            <ScrollToTop />
            <AnalyticsTracker />
            <SocialProofToast />
            <ScrollUpCards />
            <FeedbackWidget />
            <AdminAiTopBar isGlobalRoot={true} />
            <SmartThemeSuggestion />
          </LanguageProvider>
        </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}

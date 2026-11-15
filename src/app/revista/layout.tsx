import type { Metadata } from 'next';
import Link from 'next/link';
import { Instagram, Linkedin, Twitter, Code2 } from 'lucide-react';

export const metadata: Metadata = {
  title: {
    default: 'Codando Histórias - Revista Digital WEHOSTHERE',
    template: '%s | Codando Histórias',
  },
  description:
    'A revista digital da WEHOSTHERE. Histórias reais de código, startups, design e carreiras tech em Moçambique. Que história vamos codar agora?',
  keywords: [
    'revista tech Moçambique',
    'histórias de programação',
    'startups Moçambique',
    'desenvolvimento web Africa',
    'carreira tech Mozambique',
    'WEHOSTHERE revista',
    'codando histórias',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_MZ',
    url: 'https://www.wehosthere.com/revista',
    siteName: 'WEHOSTHERE - Codando Histórias',
    title: 'Codando Histórias | Revista Digital WEHOSTHERE',
    description: 'Histórias reais de código, startups, design e carreira tech em Moçambique.',
    images: [
      {
        url: 'https://www.wehosthere.com/servidores-banner.png',
        width: 1200,
        height: 630,
        alt: 'Codando Histórias - WEHOSTHERE',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codando Histórias | Revista Digital WEHOSTHERE',
    description: 'Histórias reais de código, startups, design e carreira tech em Moçambique.',
    images: ['https://www.wehosthere.com/servidores-banner.png'],
  },
};

function RevistaFooter() {
  return (
    <footer className="revista-footer">
      <style>{`
        .revista-footer {
          background: #9D4EDD;
          padding: 3.5rem 0 2rem;
          margin-top: 0;
          font-family: 'Poppins', sans-serif;
        }
        .revista-footer .footer-inner {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        .revista-footer .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .revista-footer .footer-brand-name {
          font-size: 1.4rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
        }
        .revista-footer .footer-brand-name span {
          display: inline-block;
          background: rgba(255,255,255,0.22);
          border-radius: 4px;
          padding: 0 5px;
        }
        .revista-footer .footer-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.75rem;
        }
        .revista-footer .footer-slogan {
          color: rgba(255,255,255,0.92);
          font-size: 0.86rem;
          margin: 0;
          font-style: italic;
        }
        .revista-footer .footer-subtle-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.4rem 0.95rem;
          border-radius: 9999px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .revista-footer .footer-subtle-btn:hover {
          background: rgba(255, 255, 255, 0.28);
          border-color: rgba(255, 255, 255, 0.55);
          transform: translateY(-1px);
        }
        .revista-footer .footer-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 2rem;
          border-top: 1px solid rgba(255,255,255,0.22);
          padding-top: 1.75rem;
        }
        .revista-footer .footer-links {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .revista-footer .footer-links a {
          color: rgba(255,255,255,0.92);
          text-decoration: none;
          font-size: 0.84rem;
          font-weight: 500;
          border-bottom: 1px solid transparent;
          transition: all 0.2s;
        }
        .revista-footer .footer-links a:hover {
          color: #fff;
          border-bottom-color: rgba(255,255,255,0.7);
        }
        .revista-footer .footer-socials {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        .revista-footer .footer-socials a {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          color: #fff;
          transition: background 0.2s, transform 0.2s;
          border: 1px solid rgba(255,255,255,0.3);
        }
        .revista-footer .footer-socials a:hover {
          background: rgba(255,255,255,0.35);
          transform: translateY(-2px);
        }
        .revista-footer .footer-copy {
          color: rgba(255,255,255,0.75);
          font-size: 0.78rem;
          margin-top: 1.5rem;
          text-align: center;
        }
        @media (max-width: 640px) {
          .revista-footer .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="footer-inner">
        <div className="footer-top-row">
          <div>
            <div className="footer-brand">
              <Code2 size={22} color="#fff" />
              <span className="footer-brand-name">
                codando <span>histórias</span>
              </span>
            </div>
            <p className="footer-slogan">Que história vamos codar agora?</p>
          </div>

          <Link href="/revista/submeter" className="footer-subtle-btn">
            <span>✍️ Submeter uma história</span>
            <span style={{ opacity: 0.75, fontSize: '0.85rem' }}>→</span>
          </Link>
        </div>

        <div className="footer-grid">
          <div className="footer-links">
            <Link href="/revista">Início</Link>
            <Link href="/revista/submeter">Submeter História</Link>
            <Link href="/">WEHOSTHERE</Link>
            <Link href="/privacy">Privacidade</Link>
            <Link href="/terms">Termos</Link>
          </div>
          <div className="footer-socials">
            <a href="https://instagram.com/wehosthere" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram size={16} />
            </a>
            <a href="https://linkedin.com/company/wehosthere" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin size={16} />
            </a>
            <a href="https://twitter.com/wehosthere" target="_blank" rel="noopener noreferrer" aria-label="Twitter/X">
              <Twitter size={16} />
            </a>
          </div>
        </div>
        <p className="footer-copy">
          wehosthere.com/revista © {new Date().getFullYear()} - Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}

export default function RevistaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, background: '#f8fafc' }}>
        {children}
      </main>
      <RevistaFooter />
    </div>
  );
}

import Link from 'next/link';
import { ShieldCheck, Lock, Mail, Phone } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function AcademyFooter() {
  return (
    <footer className="bg-white text-gray-600 border-t border-gray-200 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-gray-100">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="inline-block">
              <BrandLogo />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              A plataforma de formação tecnológica prática da WEHOSTHERE. Aprende competências reais de programação, infraestrutura cloud e negócios digitais adaptadas ao mercado de Moçambique.
            </p>
            <div className="flex items-center gap-2 text-xs text-primary-700 font-semibold bg-sky-50 px-2.5 py-1.5 rounded-xl border border-sky-100 w-fit">
              <ShieldCheck className="w-4 h-4 text-primary-600 shrink-0" />
              <span>Garantia de Qualidade & Certificação</span>
            </div>
          </div>

          {/* Cursos Populares */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Cursos em Destaque</h4>
            <ul className="space-y-2 text-xs text-gray-600">
              <li>
                <Link href="/academy" className="hover:text-primary-600 transition">
                  Criação de Páginas de Vendas de Alta Conversão
                </Link>
              </li>
              <li>
                <Link href="/academy" className="hover:text-primary-600 transition">
                  Hospedagem & Infraestrutura Cloud com cPanel
                </Link>
              </li>
              <li>
                <Link href="/academy" className="hover:text-primary-600 transition">
                  Negócios Digitais & E-commerce em Moçambique
                </Link>
              </li>
              <li>
                <Link href="/academy" className="hover:text-primary-600 transition">
                  Segurança Web, SSL & Domínios .co.mz
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Rápidos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Navegação</h4>
            <ul className="space-y-2 text-xs text-gray-600">
              <li>
                <Link href="/academy" className="hover:text-primary-600 transition">
                  Catálogo Completo
                </Link>
              </li>
              <li>
                <Link href="/login?redirect=/dashboard/academy" className="hover:text-primary-600 transition">
                  Área do Aluno (Login)
                </Link>
              </li>
              <li>
                <Link href="/verify-certificate" className="hover:text-primary-600 transition">
                  Validar Certificado por Código
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary-600 transition">
                  Termos de Utilização & Reembolso
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary-600 transition">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Suporte & Pagamentos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Pagamentos & Suporte</h4>
            <p className="text-xs text-gray-500">
              Libertação automática imediata via:
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 rounded-lg">M-Pesa PUSH</span>
              <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg">e-Mola</span>
              <span className="px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-700 rounded-lg">BIM / BCI</span>
            </div>
            <div className="pt-2 text-xs text-gray-600 space-y-1.5">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <a href="mailto:suporte@wehosthere.com" className="hover:text-primary-600 transition">suporte@wehosthere.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>Maputo, Moçambique</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} WEHOSTHERE ACADEMY. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
              <Lock className="w-3.5 h-3.5" />
              Checkout Seguro 256-bit SSL
            </span>
            <Link href="/" className="hover:text-primary-600 transition font-medium">
              WEHOSTHERE Hosting & Cloud →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


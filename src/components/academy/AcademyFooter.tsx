import Link from 'next/link';
import { ShieldCheck, Award, Lock, HelpCircle, Mail, MessageCircle, Phone, ArrowUpRight } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function AcademyFooter() {
  return (
    <footer className="bg-slate-950 text-gray-300 border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="bg-white/10 p-2 rounded-xl inline-block">
              <BrandLogo />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              A plataforma de formação tecnológica prática da WEHOSTHERE. Aprende competências reais de programação, infraestrutura cloud e negócios digitais adaptadas ao mercado de Moçambique.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Garantia de Qualidade & Certificação</span>
            </div>
          </div>

          {/* Cursos Populares */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Cursos em Destaque</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link href="/academy" className="hover:text-emerald-400 transition">
                  Criação de Páginas de Vendas de Alta Conversão
                </Link>
              </li>
              <li>
                <Link href="/academy" className="hover:text-emerald-400 transition">
                  Hospedagem & Infraestrutura Cloud com cPanel
                </Link>
              </li>
              <li>
                <Link href="/academy" className="hover:text-emerald-400 transition">
                  Negócios Digitais & E-commerce em Moçambique
                </Link>
              </li>
              <li>
                <Link href="/academy" className="hover:text-emerald-400 transition">
                  Segurança Web, SSL & Domínios .co.mz
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Rápidos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Navegação</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link href="/academy" className="hover:text-white transition">
                  Catálogo Completo
                </Link>
              </li>
              <li>
                <Link href="/login?redirect=/dashboard/academy" className="hover:text-white transition">
                  Área do Aluno (Login)
                </Link>
              </li>
              <li>
                <Link href="/verify-certificate" className="hover:text-white transition">
                  Validar Certificado por Código
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  Termos de Utilização & Reembolso
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Suporte & Pagamentos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Pagamentos & Suporte</h4>
            <p className="text-xs text-gray-400">
              Libertação automática imediata via:
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="px-2.5 py-1 bg-red-950/60 border border-red-500/40 text-red-300 rounded-lg">M-Pesa PUSH</span>
              <span className="px-2.5 py-1 bg-amber-950/60 border border-amber-500/40 text-amber-300 rounded-lg">e-Mola</span>
              <span className="px-2.5 py-1 bg-blue-950/60 border border-blue-500/40 text-blue-300 rounded-lg">BIM / BCI</span>
            </div>
            <div className="pt-2 text-xs text-gray-400 space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                <a href="mailto:suporte@wehosthere.com" className="hover:text-white">suporte@wehosthere.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                <span>Maputo, Moçambique</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} WEHOSTHERE ACADEMY. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              Checkout Seguro 256-bit SSL
            </span>
            <Link href="/" className="hover:text-gray-300 transition">
              WEHOSTHERE Hosting & Cloud →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


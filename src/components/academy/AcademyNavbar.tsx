'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { GraduationCap, BookOpen, Sparkles, User, ArrowRight, Menu, X, ShieldCheck } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function AcademyNavbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-xs">
      {/* Top micro-bar for confidence — Azul Claro Oficial do Site WEHOSTHERE */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#0284c7] text-white text-[11px] sm:text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-xs">
        <span className="flex h-2 w-2 rounded-full bg-white animate-pulse"></span>
        <span className="text-white font-medium">
          Formação Tecnológica Prática em Moçambique • <strong className="text-white font-bold underline underline-offset-2">Certificação Oficial Incluída</strong>
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Tag */}
          <div className="flex items-center gap-3">
            <Link href="/" className="shrink-0">
              <BrandLogo />
            </Link>
            <div className="h-5 w-px bg-gray-200 hidden sm:block"></div>
            <Link href="/academy" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200/60 hover:bg-emerald-100 transition">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Academia</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
            <Link href="/academy" className="hover:text-primary-600 transition">
              Catálogo
            </Link>
            <a href="#beneficios" className="hover:text-primary-600 transition">
              Vantagens
            </a>
            <a href="#certificacao" className="hover:text-primary-600 transition">
              Certificação
            </a>
            <a href="#faq" className="hover:text-primary-600 transition">
              Perguntas Frequentes
            </a>
          </nav>

          {/* Right Action / Login */}
          <div className="hidden sm:flex items-center gap-3">
            {session?.user ? (
              <Link
                href="/dashboard/academy"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-xs sm:text-sm font-semibold hover:bg-primary-700 shadow-sm transition"
              >
                <BookOpen className="w-4 h-4" />
                <span>Minha Área de Aluno</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login?redirect=/dashboard/academy"
                  className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-primary-600 px-3 py-2 transition"
                >
                  Já tens conta? <span className="text-primary-600 underline">Entrar</span>
                </Link>
                <a
                  href="#cursos"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ver Cursos</span>
                </a>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            {session?.user ? (
              <Link
                href="/dashboard/academy"
                className="p-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold"
              >
                Área do Aluno
              </Link>
            ) : (
              <Link
                href="/login?redirect=/dashboard/academy"
                className="text-xs font-semibold text-primary-600 px-2 py-1"
              >
                Entrar
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/academy"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-800 py-1.5"
          >
            Catálogo de Cursos
          </Link>
          <a
            href="#beneficios"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-800 py-1.5"
          >
            Vantagens & Metodologia
          </a>
          <a
            href="#certificacao"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-800 py-1.5"
          >
            Certificado Oficial
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-800 py-1.5"
          >
            Perguntas Frequentes
          </a>
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            {session?.user ? (
              <Link
                href="/dashboard/academy"
                className="w-full text-center py-2.5 rounded-xl bg-primary-600 text-white text-xs font-bold"
              >
                Aceder ao Meu Painel
              </Link>
            ) : (
              <>
                <Link
                  href="/login?redirect=/dashboard/academy"
                  className="w-full text-center py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700"
                >
                  Já tens conta? Iniciar Sessão
                </Link>
                <a
                  href="#cursos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  Explorar Cursos Disponíveis
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}


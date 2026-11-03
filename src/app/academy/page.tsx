'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, BookOpen, Clock, Award, ShieldCheck, CheckCircle2, 
  Sparkles, ArrowRight, Star, Users, Play, ChevronRight, Lock, 
  Smartphone, Zap, HelpCircle, Search, Laptop, Layers, Loader2
} from 'lucide-react';
import AcademyNavbar from '@/components/academy/AcademyNavbar';
import AcademyFooter from '@/components/academy/AcademyFooter';

interface Course {
  id: string;
  title: string;
  slug?: string;
  description: string;
  shortDescription: string;
  duration: string;
  outcome: string;
  thumbnail?: string;
  accessType: 'free' | 'paid' | 'preview';
  price?: number;
  originalPrice?: number;
  currency?: string;
  category?: string;
  level?: string;
  freeLessonsCount?: number;
  instructorName?: string;
  instructorTitle?: string;
  rating?: number;
  studentsCount?: number;
  active: boolean;
}

export default function PublicAcademyPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const res = await fetch('/api/courses');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.courses)) {
            // Filtrar apenas cursos ativos criados na base de dados
            const activeCourses = data.courses.filter((c: any) => c.active !== false);
            setCourses(activeCourses);
          }
        }
      } catch (err) {
        console.warn('Erro ao buscar cursos da base de dados:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const categories = useMemo(() => {
    const list = ['Todos'];
    courses.forEach(c => {
      if (c.category && !list.includes(c.category)) {
        list.push(c.category);
      }
    });
    return list;
  }, [courses]);

  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'Todos' || (course.category || '').toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery.trim() || 
      (course.title && course.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course.category && course.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AcademyNavbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-primary-950 text-white pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Glow ambient background circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary-600/20 blur-[130px] rounded-full pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-[350px] h-[350px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Micro pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6 animate-in fade-in duration-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Formação Prática para o Mercado Real</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Aprende a Criar, Escalar e Monetizar na <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Era Digital</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Cursos diretos ao ponto com especialistas.
          </p>

          {/* Quick Trust Highlights */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Acesso Vitalício Imediato</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Pagamento M-Pesa & e-Mola</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Certificado Oficial com QR Code</span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>1ª Aula Grátis em Todos os Cursos</span>
            </div>
          </div>

          {/* Search bar & filter pills */}
          <div className="mt-10 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar curso ou tecnologia..."
                className="w-full pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              />
            </div>
          </div>
        </div>
      </section>

      {/* DISCREET LOGIN CALLOUT FOR EXISTING STUDENTS */}
      <section className="bg-emerald-500/10 border-y border-emerald-500/20 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-emerald-900 font-medium">
            <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Já és aluno? Continua as tuas aulas de onde paraste.</span>
          </div>
          <Link
            href="/login?redirect=/dashboard/academy"
            className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-4"
          >
            <span>Entrar na Área do Aluno</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* COURSE CATALOG SECTION */}
      <section id="cursos" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">
              <BookOpen className="w-4 h-4" />
              <span>Catálogo Disponível</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
              Escolhe a Tua Próxima Formação
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-lg">
              Aprende com projetos reais e aplica imediatamente na tua carreira ou empresa.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* COURSES GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-3xl border border-gray-200/80 p-5 animate-pulse space-y-4 shadow-xs">
                <div className="h-48 bg-gray-100 rounded-2xl w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                <div className="h-6 bg-gray-100 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-11 bg-gray-100 rounded-xl w-full mt-4"></div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 max-w-md mx-auto shadow-xs">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">Nenhum curso disponível</h3>
            <p className="text-xs text-gray-500 mt-1">
              {searchQuery || selectedCategory !== 'Todos'
                ? 'Nenhum curso corresponde à pesquisa ou categoria selecionada.'
                : 'Os cursos da base de dados aparecerão aqui assim que forem ativados no painel.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => {
              const checkoutUrl = `/checkout?service=course&courseId=${course.id}&name=${encodeURIComponent(course.title)}&amount=${course.price || 199}`;
              const courseDetailsUrl = `/academy/courses/${course.slug || course.id}`;

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-3xl border border-gray-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1"
                >
                  {/* Thumbnail / Header */}
                  <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
                    <img
                      src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                        {course.category || 'Tecnologia'}
                      </span>
                      {course.freeLessonsCount && course.freeLessonsCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
                          <Play className="w-3 h-3 fill-current" />
                          <span>1 Aula Grátis</span>
                        </span>
                      )}
                    </div>

                    {/* Rating badge bottom right */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-amber-300 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{course.rating || 4.9}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta info row */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {course.duration}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          Certificado Oficial
                        </span>
                        <span>•</span>
                        <span className="text-gray-500 font-medium">
                          {course.level || 'Todos os Níveis'}
                        </span>
                      </div>

                      {/* Course Title */}
                      <Link href={courseDetailsUrl}>
                        <h3 className="text-lg font-black text-gray-950 group-hover:text-primary-600 transition leading-snug line-clamp-2">
                          {course.title}
                        </h3>
                      </Link>

                      {/* Short Description */}
                      <p className="mt-2 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {course.shortDescription || course.description}
                      </p>

                      {/* Instructor info */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 p-0.5 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                          <img
                            src="/icon-192.png"
                            alt="WEHOSTHERE"
                            className="w-full h-full object-contain rounded-full"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{course.instructorName || 'Equipa WEHOSTHERE'}</p>
                          <p className="text-[10px] text-gray-500 truncate">{course.instructorTitle || 'Especialista em Engenharia & Cloud'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Investimento</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-gray-950">
                              {(course.price || 199).toLocaleString('pt-MZ')} <span className="text-sm font-bold text-emerald-600">MT</span>
                            </span>
                            {course.originalPrice && course.originalPrice > (course.price || 0) && (
                              <span className="text-xs text-gray-400 line-through">
                                {course.originalPrice.toLocaleString('pt-MZ')} MT
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                          Acesso Imediato
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={courseDetailsUrl}
                          className="py-2.5 px-3 rounded-xl border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-bold text-center transition flex items-center justify-center gap-1"
                        >
                          <span>Ver Programa</span>
                        </Link>
                        <Link
                          href={checkoutUrl}
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black text-center shadow-sm hover:shadow transition flex items-center justify-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>Comprar Já</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* HOW IT WORKS: ZERO-BARRIER GUEST PURCHASE */}
      <section className="bg-slate-900 text-white py-16 sm:py-20 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Simplicidade & Respeito Pelo Teu Tempo</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">
              Como Funciona a Compra Sem Barreiras
            </h2>
            <p className="mt-2 text-slate-400 text-xs sm:text-sm">
              Sem cadastros longos. Adquire qualquer formação em menos de 1 minuto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-800/60 border border-slate-700/80 p-6 rounded-2xl relative">
              <div className="w-10 h-10 rounded-xl bg-primary-600 text-white font-black text-lg flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-bold text-base text-white mb-2">Escolhe o Teu Curso</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Consulta o programa completo e assiste à 1ª aula grátis.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 p-6 rounded-2xl relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-bold text-base text-white mb-2">Dados Mínimos</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Apenas nome, e-mail e telemóvel para o pagamento.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 p-6 rounded-2xl relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-black text-lg flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-bold text-base text-white mb-2">M-Pesa / e-Mola</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Recebe o PUSH, digita o teu PIN e confirma em segundos.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 p-6 rounded-2xl relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white font-black text-lg flex items-center justify-center mb-4">
                4
              </div>
              <h3 className="font-bold text-base text-white mb-2">Acesso & Vinculação</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acesso imediato. Cria a tua senha num clique ou associa à tua conta.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CERTIFICATION PREVIEW — Azul Oficial Branding WEHOSTHERE */}
      <section id="certificacao" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#075985] via-[#0369a1] to-[#0c4a6e] text-white rounded-3xl p-8 sm:p-12 border border-sky-400/30 shadow-[0_20px_60px_-15px_rgba(2,132,199,0.35)] flex flex-col lg:flex-row items-center gap-10 relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 flex-1 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-sky-200 border border-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4 text-sky-300" />
              Certificado Oficial WEHOSTHERE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Valoriza o Teu Currículo com Certificação Autêntica
            </h2>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
              Ao concluir o curso, recebes o teu <strong>Certificado Oficial em PDF</strong> autenticado:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-sky-50">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                <span>Código único de autenticidade rastreável</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                <span>Validação online instantânea por QR Code</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                <span>Carga horária e competências descritas</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/verify-certificate"
                className="inline-flex items-center gap-2 text-xs font-bold text-sky-200 hover:text-white underline underline-offset-4 transition"
              >
                <span>Testar Validador Público de Certificados →</span>
              </Link>
            </div>
          </div>

          {/* Certificate mock preview */}
          <div className="w-full lg:w-96 shrink-0 bg-white text-slate-900 rounded-2xl p-6 shadow-2xl border-4 border-amber-400/40 transform rotate-1 hover:rotate-0 transition duration-300 relative z-10">
            <div className="border border-slate-200 p-4 rounded-xl text-center">
              <div className="text-[10px] tracking-widest text-slate-400 uppercase font-black">WEHOSTHERE ACADEMY</div>
              <h4 className="text-base font-black text-primary-950 mt-1">CERTIFICADO DE CONCLUSÃO</h4>
              <p className="text-[11px] text-slate-600 mt-2">Certificamos com distinção que</p>
              <p className="text-sm font-black text-slate-900 border-b border-slate-200 pb-1 mt-1 font-serif">Afonso Domingos</p>
              <p className="text-[10px] text-slate-500 mt-2">concluiu com êxito a formação em</p>
              <p className="text-xs font-extrabold text-primary-700">Criação de Páginas de Vendas Profissionais</p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                <span>Cod: WH-2026-9915</span>
                <span className="text-primary-700 font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">100% VÁLIDO</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-16 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-10">
          <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Tira as Tuas Dúvidas</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 mt-1">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary-600 shrink-0" />
              Preciso de ter conta antes de comprar um curso?
            </h3>
            <p className="mt-1.5 text-xs text-gray-600 leading-relaxed pl-6">
              <strong>Não.</strong> Podes comprar diretamente como visitante. Após o pagamento aprovado, defines a tua senha num clique ou vinculas à tua conta existente.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary-600 shrink-0" />
              E se eu fechar o navegador após pagar via M-Pesa?
            </h3>
            <p className="mt-1.5 text-xs text-gray-600 leading-relaxed pl-6">
              Não perdes nada. A compra fica salva e recebes um e-mail com um <strong>link seguro de resgate</strong> para acederes quando quiseres.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary-600 shrink-0" />
              Por quanto tempo terei acesso ao curso?
            </h3>
            <p className="mt-1.5 text-xs text-gray-600 leading-relaxed pl-6">
              O acesso é <strong>vitalício</strong>. Estuda no teu próprio ritmo e revê as aulas sempre que precisares.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary-600 shrink-0" />
              Quais métodos de pagamento são aceites?
            </h3>
            <p className="mt-1.5 text-xs text-gray-600 leading-relaxed pl-6">
              <strong>M-Pesa</strong> (Vodacom), <strong>e-Mola</strong> (Movitel) e <strong>Transferência Bancária</strong> (BIM, BCI e Standard Bank).
            </p>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA BANNER — Azul Oficial Branding WEHOSTHERE */}
      <section className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white py-14 px-4 sm:px-6 lg:px-8 text-center mt-auto relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-sky-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Pronto para Elevar as Tuas Habilidades Digitais?</h2>
          <p className="text-xs sm:text-sm text-sky-100 max-w-lg mx-auto leading-relaxed">
            Junta-te a profissionais e empreendedores em Moçambique que já estão a evoluir com as nossas formações práticas.
          </p>
          <div className="pt-2">
            <a
              href="#cursos"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-primary-900 font-extrabold rounded-2xl shadow-xl hover:bg-sky-50 hover:shadow-2xl hover:scale-[1.02] transition duration-200 text-sm"
            >
              <span>Ver Cursos Disponíveis</span>
              <ArrowRight className="w-4 h-4 text-primary-600" />
            </a>
          </div>
        </div>
      </section>

      <AcademyFooter />
    </div>
  );
}


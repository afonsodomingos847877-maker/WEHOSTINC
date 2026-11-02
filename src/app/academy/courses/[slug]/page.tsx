'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, Clock, Award, ShieldCheck, CheckCircle2, Play, Sparkles, 
  Lock, Star, Users, ArrowRight, ArrowLeft, ChevronDown, 
  ChevronUp, Zap, HelpCircle, FileText, Video, Smartphone
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
  videoPreviewUrl?: string;
  accessType: 'free' | 'paid' | 'preview';
  price?: number;
  originalPrice?: number;
  currency?: string;
  category?: string;
  level?: string;
  freeLessonsCount?: number;
  instructorName?: string;
  instructorTitle?: string;
  instructorBio?: string;
  skills?: string[];
  requirements?: string[];
  targetAudience?: string[];
  rating?: number;
  studentsCount?: number;
}

interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  objective: string;
  order: number;
}

interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  hasVideo: boolean;
  videoUrl?: string;
  order: number;
}

const DEFAULT_COURSE: Course = {
  id: 'course-landing-page',
  title: 'Criação de Página de Vendas Profissional',
  slug: 'criacao-pagina-vendas-profissional',
  description: 'Aprenda do zero a conceber, estruturar, programar e publicar páginas de alta conversão para o mercado moçambicano e internacional. Do design ao código com integração direta a meios de pagamento como M-Pesa.',
  shortDescription: 'Cria páginas de alta conversão com design moderno, integração M-Pesa e velocidade máxima.',
  duration: '4h 30m',
  outcome: 'Construir landing pages profissionais completas prontas para capturar clientes e gerar vendas.',
  thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
  videoPreviewUrl: '',
  accessType: 'paid',
  price: 199,
  originalPrice: 500,
  currency: 'MZN',
  category: 'Desenvolvimento Web',
  level: 'Iniciante a Intermédio',
  freeLessonsCount: 1,
  instructorName: 'Afonso Domingos',
  instructorTitle: 'Engenheiro de Software & Fundador WEHOSTHERE',
  instructorBio: 'Mais de 8 anos de experiência em desenvolvimento web, sistemas de pagamentos distribuídos e infraestrutura de datacenter em Moçambique.',
  skills: [
    'Design de interfaces de alta conversão para dispositivos móveis',
    'HTML5, TailwindCSS e arquitetura de componentes rápidos',
    'Integração de pagamentos instantâneos M-Pesa e e-Mola',
    'Otimização de velocidade, SEO e taxas de conversão (CRO)',
    'Publicação em servidores de produção com SSL grátis'
  ],
  requirements: [
    'Nenhum conhecimento prévio avançado de programação é obrigatório',
    'Computador ou tablet com acesso à internet',
    'Vontade de aprender e praticar com projetos reais'
  ],
  targetAudience: [
    'Empreendedores que querem vender os seus produtos e serviços na internet',
    'Designers e criadores de conteúdo que querem oferecer páginas completas a clientes',
    'Desenvolvedores iniciantes à procura de projetos comerciais práticos'
  ],
  rating: 4.9,
  studentsCount: 184
};

const DEFAULT_MODULES: Module[] = [
  {
    id: 'mod-1',
    courseId: 'course-landing-page',
    title: 'Módulo 1: Fundamentos de Páginas que Vendem',
    description: 'Compreender a psicologia do comprador, hierarquia visual e copywriting voltado ao mercado moçambicano.',
    objective: 'Definir a estrutura que converte antes de escrever a primeira linha de código.',
    order: 1
  },
  {
    id: 'mod-2',
    courseId: 'course-landing-page',
    title: 'Módulo 2: Estrutura, Design e Responsividade Mobile',
    description: 'Criação da Hero Section, blocos de benefícios, prova social e prova de autoridade.',
    objective: 'Construir um layout impecável que carrega em menos de 1 segundo.',
    order: 2
  },
  {
    id: 'mod-3',
    courseId: 'course-landing-page',
    title: 'Módulo 3: Integração de Checkout & M-Pesa PUSH',
    description: 'Configurar botões de compra direta e formulários sem atrito para pagamento móvel.',
    objective: 'Eliminar qualquer obstáculo entre o cliente e o pagamento final.',
    order: 3
  },
  {
    id: 'mod-4',
    courseId: 'course-landing-page',
    title: 'Módulo 4: Publicação no Domínio .co.mz & Certificação',
    description: 'Hospedagem no cPanel da WEHOSTHERE, apontamento DNS, SSL e emissão do certificado.',
    objective: 'Lançar a página publicamente na internet.',
    order: 4
  }
];

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slugOrId = params.slug as string;

  const [course, setCourse] = useState<Course>(DEFAULT_COURSE);
  const [modules, setModules] = useState<Module[]>(DEFAULT_MODULES);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({ 'mod-1': true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourseDetails() {
      try {
        const [cRes, mRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/modules')
        ]);

        if (cRes.ok) {
          const cData = await cRes.json();
          const found = (cData.courses || []).find((c: any) => 
            c.id === slugOrId || c.slug === slugOrId || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(slugOrId.toLowerCase())
          );

          if (found) {
            setCourse({
              ...DEFAULT_COURSE,
              ...found,
              price: found.price || 199,
              originalPrice: found.originalPrice || 500
            });

            if (mRes.ok) {
              const mData = await mRes.json();
              const courseModules = (mData.modules || []).filter((m: any) => m.courseId === found.id);
              if (courseModules.length > 0) {
                setModules(courseModules.sort((a: any, b: any) => a.order - b.order));
              }
            }
          }
        }
      } catch (err) {
        console.warn('Usando dados de curso locais:', err);
      } finally {
        setLoading(false);
      }
    }

    if (slugOrId) {
      fetchCourseDetails();
    }
  }, [slugOrId]);

  const toggleModule = (modId: string) => {
    setOpenModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const checkoutUrl = `/checkout?service=course&courseId=${course.id}&name=${encodeURIComponent(course.title)}&amount=${course.price || 199}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AcademyNavbar />

      {/* BREADCRUMB */}
      <div className="bg-slate-900 text-slate-300 border-b border-slate-800 text-xs py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Link href="/academy" className="hover:text-emerald-400 transition">
            Academia
          </Link>
          <span>/</span>
          <span className="text-slate-400">{course.category || 'Cursos'}</span>
          <span>/</span>
          <span className="text-white font-medium truncate max-w-xs sm:max-w-none">{course.title}</span>
        </div>
      </div>

      {/* COURSE HERO */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 text-white pt-10 pb-16 sm:pb-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            
            {/* Left 2 Cols: Content info */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  {course.category || 'Desenvolvimento Web'}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                  {course.level || 'Todos os Níveis'}
                </span>
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
                  1 Aula Gratuita Disponível
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                {course.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {course.description}
              </p>

              {/* Stats badges */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{course.rating || 4.9}</span>
                  <span className="text-slate-400 font-normal">({course.studentsCount || 184} alunos)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>{course.duration} de conteúdo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Certificado Oficial</span>
                </div>
              </div>

              {/* Instructor snippet */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-black text-sm flex items-center justify-center shrink-0">
                  {(course.instructorName || 'A').charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-slate-400">Criado e lecionado por:</p>
                  <p className="text-sm font-bold text-white">{course.instructorName}</p>
                </div>
              </div>
            </div>

            {/* Right Col: Sticky Purchase Card */}
            <div className="lg:col-span-1 bg-white text-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-200 sticky top-24">
              {/* Media Preview Box */}
              <div className="relative h-44 rounded-2xl overflow-hidden mb-5 bg-slate-900 group">
                <img
                  src={course.thumbnail || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-white/90 bg-black/60 backdrop-blur-xs py-1 rounded-lg">
                  Aula 1 Liberada Gratuitamente
                </div>
              </div>

              {/* Price Row */}
              <div className="mb-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Preço Promocional</span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-black text-slate-950">
                    {(course.price || 199).toLocaleString('pt-MZ')} <span className="text-base font-bold text-emerald-600">MT</span>
                  </span>
                  {course.originalPrice && (
                    <span className="text-sm text-slate-400 line-through">
                      {course.originalPrice.toLocaleString('pt-MZ')} MT
                    </span>
                  )}
                  <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    -60% OFF
                  </span>
                </div>
              </div>

              {/* Primary CTA: Buy Now without login */}
              <div className="space-y-3">
                <Link
                  href={checkoutUrl}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Comprar Curso por {(course.price || 199).toLocaleString('pt-MZ')} MT</span>
                </Link>

                <p className="text-[11px] text-center text-slate-500">
                  ⚡ <strong>Sem formulários complexos.</strong> Pagas e começas a assistir em seguida.
                </p>
              </div>

              {/* Guarantee bullets */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Acesso vitalício com atualizações</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Certificado oficial reconhecido</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>M-Pesa PUSH & e-Mola automático</span>
                </div>
              </div>

              {/* Discreet login suggestion */}
              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <Link
                  href={`/login?redirect=/dashboard/academy/course/${course.id}`}
                  className="text-xs text-slate-600 hover:text-primary-600 font-semibold transition"
                >
                  Já és aluno deste curso? <span className="text-primary-600 underline">Inicia sessão aqui</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CURRICULUM & DETAILS SECTION */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <div className="lg:col-span-2 space-y-12">
            {/* O QUE VAIS APRENDER */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>O Que Vais Aprender Neste Curso</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(course.skills || DEFAULT_COURSE.skills || []).map((skill, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CURRÍCULO DO CURSO */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                    <span>Programa Curricular Completo</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {modules.length} Módulos Práticos • Acesso Sequencial Estruturado
                  </p>
                </div>
              </div>

              {/* Modules Accordion */}
              <div className="space-y-3">
                {modules.map((mod, idx) => {
                  const isOpen = !!openModules[mod.id];
                  return (
                    <div
                      key={mod.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden transition"
                    >
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className="w-full p-4 sm:p-5 text-left bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between gap-4 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-800 text-xs font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900">{mod.title}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{mod.objective || mod.description}</p>
                          </div>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      {isOpen && (
                        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                          <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            {mod.description}
                          </p>

                          {/* Mock lesson items */}
                          <div className="space-y-2">
                            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-emerald-950 font-medium">
                                <Play className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                                <span>Aula 1: Introdução Prática & Visão Geral</span>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                                Grátis
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-slate-500">
                              <div className="flex items-center gap-2">
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Aula 2: Desenvolvimento do Projeto Passo a Passo</span>
                              </div>
                              <span className="text-[10px] text-slate-400">Conteúdo do Curso</span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-slate-500">
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span>Materiais de Apoio & Ficheiros de Código</span>
                              </div>
                              <span className="text-[10px] text-slate-400">Download</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FORMADOR */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                <span>Sobre o Formador</span>
              </h2>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-primary-700 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
                  {(course.instructorName || 'A').charAt(0)}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-slate-900">{course.instructorName}</h3>
                  <p className="text-xs font-semibold text-emerald-600">{course.instructorTitle}</p>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                    {course.instructorBio || DEFAULT_COURSE.instructorBio}
                  </p>
                </div>
              </div>
            </div>

            {/* REQUISITOS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-4">Requisitos</h2>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                {(course.requirements || DEFAULT_COURSE.requirements || []).map((req, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0"></span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl">
              <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Garantia de Satisfação</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Se após assistir às aulas sentires que o curso não entregou o valor prometido, o nosso suporte está disponível para te ajudar e garantir a tua total satisfação.
              </p>
              <div className="text-xs text-emerald-400 font-bold">
                ✓ Suporte dedicado em Moçambique
              </div>
            </div>
          </div>

        </div>
      </section>

      <AcademyFooter />
    </div>
  );
}


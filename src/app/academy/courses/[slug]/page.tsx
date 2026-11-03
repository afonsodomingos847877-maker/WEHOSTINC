'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatVideoEmbedUrl } from '@/lib/videoEmbed';
import Link from 'next/link';
import { 
  BookOpen, Clock, Award, Maximize2, Camera, X, ShieldCheck, CheckCircle2, Play, Sparkles, 
  Lock, Star, Users, ArrowRight, ArrowLeft, ChevronDown, 
  ChevronUp, Zap, HelpCircle, FileText, Video, Smartphone, Tag, Ticket, ExternalLink
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
  instructorAvatar?: string;
  instructorGallery?: string[];
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
  hasVideo?: boolean;
  videoUrl?: string;
  videoTitle?: string;
  videoDescription?: string;
  hasMaterial?: boolean;
  materialUrl?: string;
  materialTitle?: string;
  isFree?: boolean;
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

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slugOrId = params.slug as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Cupom de Desconto na Página do Curso
  const [couponCode, setCouponCode] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [videoPreviewModal, setVideoPreviewModal] = useState<{
    isOpen: boolean;
    videoUrl: string;
    title: string;
    description?: string;
  } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const [paymentPlan, setPaymentPlan] = useState<'full' | 'installments_2x'>('full');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);

  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxImage) return;
      if (e.key === 'Escape') {
        setLightboxImage(null);
        setVideoPreviewModal(null);
      } else if (e.key === 'ArrowLeft' && course?.instructorGallery && course.instructorGallery.length > 1) {
        const total = course.instructorGallery.length;
        const prevIdx = (lightboxIndex - 1 + total) % total;
        setLightboxIndex(prevIdx);
        setLightboxImage(course.instructorGallery[prevIdx]);
      } else if (e.key === 'ArrowRight' && course?.instructorGallery && course.instructorGallery.length > 1) {
        const total = course.instructorGallery.length;
        const nextIdx = (lightboxIndex + 1) % total;
        setLightboxIndex(nextIdx);
        setLightboxImage(course.instructorGallery[nextIdx]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, lightboxIndex, course]);

  const handleApplyCourseCoupon = async () => {
    if (!couponCode.trim() || !course) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const coursePrice = course.price || 199;
      const res = await fetch(`/api/academy/coupons?code=${encodeURIComponent(couponCode.trim().toUpperCase())}&amount=${coursePrice}&courseId=${encodeURIComponent(course.id)}`);
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount
        });
        setCouponError('');
      } else {
        setCouponError(data.message || 'Cupom inválido ou expirado.');
      }
    } catch (e: any) {
      setCouponError('Erro ao validar cupom.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  useEffect(() => {
    async function fetchCourseDetails() {
      try {
        setLoading(true);
        const [cRes, mRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/modules')
        ]);

        if (cRes.ok) {
          const cData = await cRes.json();
          const found = (cData.courses || []).find((c: any) => 
            c.id === slugOrId || 
            c.slug === slugOrId || 
            (c.title && c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(slugOrId.toLowerCase()))
          );

          if (found) {
            setCourse(found);
            if (mRes.ok) {
              const mData = await mRes.json();
              const courseModules = (mData.modules || []).filter((m: any) => m.courseId === found.id);
              setModules(courseModules.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
              if (courseModules.length > 0) {
                setOpenModules({ [courseModules[0].id]: true });
              }
            }
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.warn('Erro ao carregar curso:', err);
        setNotFound(true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <AcademyNavbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-semibold">A carregar curso da base de dados...</p>
          </div>
        </div>
        <AcademyFooter />
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <AcademyNavbar />
        <div className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 text-center shadow-xs">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-black text-slate-900">Curso Não Encontrado</h2>
            <p className="text-xs text-slate-500 mt-1">
              O curso que procura não está disponível ou foi desativado no painel.
            </p>
            <Link
              href="/academy"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              ← Voltar ao Catálogo de Cursos
            </Link>
          </div>
        </div>
        <AcademyFooter />
      </div>
    );
  }

  // Procurar aula gratuita com vídeo: prioridade para isFree marcado, ou módulo 1, ou vídeo preview
  const freeLessonWithVideo = modules.find(m => m.isFree && m.hasVideo && m.videoUrl)
    || modules.find(m => m.hasVideo && m.videoUrl)
    || (course?.videoPreviewUrl ? { title: course.title, videoUrl: course.videoPreviewUrl, description: course.shortDescription, isFree: true, id: 'preview' } : null);

  const currentPrice = appliedCoupon ? appliedCoupon.finalAmount : (course?.price || 199);
  const allowInstallments = (course as any)?.allowInstallments !== false && currentPrice > 0;
  const installmentPrice = Math.ceil(currentPrice / 2);
  const selectedAmount = paymentPlan === 'installments_2x' ? installmentPrice : currentPrice;
  const checkoutUrl = course 
    ? `/checkout?service=course&courseId=${course.id}&name=${encodeURIComponent(course.title)}&amount=${selectedAmount}&totalPrice=${currentPrice}&installments=${paymentPlan === 'installments_2x' ? '2' : '1'}&installmentNumber=1${appliedCoupon ? `&coupon=${appliedCoupon.code}` : ''}`
    : '#';

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
                {freeLessonWithVideo ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (freeLessonWithVideo?.videoUrl) {
                        setVideoPreviewModal({
                          isOpen: true,
                          videoUrl: freeLessonWithVideo.videoUrl,
                          title: freeLessonWithVideo.title || course.title,
                          description: (freeLessonWithVideo as any).videoDescription || (freeLessonWithVideo as any).description
                        });
                      }
                    }}
                    className="px-3 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Clique para assistir à aula gratuita agora"
                  >
                    <Play className="w-3 h-3 fill-current text-emerald-400" />
                    <span>Aula Grátis Disponível • Assistir</span>
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
                    100% Prático
                  </span>
                )}
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
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 p-1 overflow-hidden flex items-center justify-center shrink-0 shadow-sm backdrop-blur-xs">
                  <img
                    src={course.instructorAvatar || "/icon-192.png"}
                    alt={course.instructorName || "WEHOSTHERE"}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Criado e lecionado por:</p>
                  <p className="text-sm font-bold text-white">{course.instructorName || 'Equipa WEHOSTHERE'}</p>
                </div>
              </div>
            </div>

            {/* Right Col: Sticky Purchase Card (Compacto & Cores da Marca) */}
            <div className="lg:col-span-1 bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-200 sticky top-20 space-y-3">
              {/* Media Preview Box Compacto - Clicável para abrir o vídeo da aula grátis */}
              <div 
                onClick={() => {
                  if (freeLessonWithVideo?.videoUrl) {
                    setVideoPreviewModal({
                      isOpen: true,
                      videoUrl: freeLessonWithVideo.videoUrl,
                      title: freeLessonWithVideo.title || course.title,
                      description: (freeLessonWithVideo as any).videoDescription || (freeLessonWithVideo as any).description
                    });
                  }
                }}
                className={`relative h-32 sm:h-36 rounded-xl overflow-hidden bg-slate-950 group transition duration-300 ring-2 ring-transparent hover:ring-primary-500 shadow-lg ${freeLessonWithVideo?.videoUrl ? 'cursor-pointer' : 'cursor-default'}`}
                title={freeLessonWithVideo?.videoUrl ? "Clique para assistir ao vídeo da aula gratuita agora!" : course.title}
              >
                <img
                  src={course.thumbnail || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80 group-hover:opacity-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-2xl transform group-hover:scale-115 transition duration-300 ring-4 ring-white/30 group-hover:bg-primary-500">
                    <Play className="w-5 h-5 fill-current ml-0.5 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-1.5 left-2 right-2 text-center text-[10px] text-white bg-black/80 backdrop-blur-md py-1 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 border border-white/10 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span className="truncate">
                    {freeLessonWithVideo?.title 
                      ? `Aula Grátis: ${freeLessonWithVideo.title}`
                      : 'Aula 1 Liberada Gratuitamente'}
                  </span>
                </div>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                {appliedCoupon ? (
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-black text-slate-950">
                      {appliedCoupon.finalAmount.toLocaleString('pt-MZ')} <span className="text-xs font-bold text-primary-600">MT</span>
                    </span>
                    <span className="text-xs text-slate-400 line-through font-semibold">
                      {(course.price || 199).toLocaleString('pt-MZ')} MT
                    </span>
                    <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                      Cupom -{appliedCoupon.discountAmount} MT
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline justify-between w-full">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-slate-950">
                        {(course.price || 199).toLocaleString('pt-MZ')}
                      </span>
                      <span className="text-xs font-bold text-primary-600">MT</span>
                      {course.originalPrice && (
                        <span className="text-xs text-slate-400 line-through ml-1 font-semibold">
                          {course.originalPrice.toLocaleString('pt-MZ')} MT
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                      -60% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Cupom de Desconto Interativo */}
              <div>
                {!appliedCoupon ? (
                  <div>
                    {!showCouponInput ? (
                      <button
                        type="button"
                        onClick={() => setShowCouponInput(true)}
                        className="text-[11px] font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <Tag className="w-3 h-3" />
                        <span>Tem cupom de desconto? Inserir aqui</span>
                      </button>
                    ) : (
                      <div className="flex gap-1.5 animate-in fade-in duration-150">
                        <input
                          type="text"
                          placeholder="CÓDIGO (EX: IA2026)"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''));
                            setCouponError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCourseCoupon();
                            }
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-primary-500 rounded-lg text-xs font-mono font-bold uppercase outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCourseCoupon}
                          disabled={validatingCoupon || !couponCode.trim()}
                          className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition cursor-pointer shrink-0"
                        >
                          {validatingCoupon ? '...' : 'Aplicar'}
                        </button>
                      </div>
                    )}
                    {couponError && (
                      <p className="text-[10px] text-rose-600 font-semibold mt-1">{couponError}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-1.5 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                      <span className="font-bold text-primary-950 font-mono text-[11px]">{appliedCoupon.code}</span>
                      <span className="text-primary-700 font-semibold text-[10px]">(-{appliedCoupon.discountAmount} MT)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode('');
                        setCouponError('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-rose-600 font-bold transition cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>

              {/* Opções de Pagamento Compactas: À Vista ou em 2 Parcelas */}
              {allowInstallments && (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentPlan('full')}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        paymentPlan === 'full'
                          ? 'border-primary-500 bg-primary-50/70 ring-2 ring-primary-500/20 text-slate-900 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">À Vista (1x)</span>
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${paymentPlan === 'full' ? 'border-primary-600 bg-primary-600' : 'border-slate-300'}`}>
                          {paymentPlan === 'full' && <span className="w-1 h-1 bg-white rounded-full"></span>}
                        </div>
                      </div>
                      <div className="mt-0.5">
                        <span className="text-xs sm:text-sm font-black text-slate-900">{currentPrice.toLocaleString('pt-MZ')} MT</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentPlan('installments_2x')}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        paymentPlan === 'installments_2x'
                          ? 'border-primary-500 bg-primary-50/70 ring-2 ring-primary-500/20 text-slate-900 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary-800">2x Parcelas</span>
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${paymentPlan === 'installments_2x' ? 'border-primary-600 bg-primary-600' : 'border-slate-300'}`}>
                          {paymentPlan === 'installments_2x' && <span className="w-1 h-1 bg-white rounded-full"></span>}
                        </div>
                      </div>
                      <div className="mt-0.5">
                        <span className="text-xs sm:text-sm font-black text-primary-700">{installmentPrice.toLocaleString('pt-MZ')} MT</span>
                      </div>
                    </button>
                  </div>

                  {paymentPlan === 'installments_2x' && (
                    <div className="p-1.5 rounded-lg bg-primary-50/80 border border-primary-200/80 text-[10px] text-primary-950 flex items-center justify-between font-semibold animate-in fade-in duration-150">
                      <span>1ª Parcela hoje: {installmentPrice.toLocaleString('pt-MZ')} MT</span>
                      <span className="text-primary-700 text-[9px]">2ª só na conclusão</span>
                    </div>
                  )}
                </div>
              )}

              {/* Botão de Compra em Destaque */}
              <div>
                <Link
                  href={checkoutUrl}
                  className="w-full py-2.5 sm:py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl shadow-md shadow-primary-600/20 transition flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    {paymentPlan === 'installments_2x' 
                      ? `Pagar 1ª Parcela (${installmentPrice.toLocaleString('pt-MZ')} MT)`
                      : `Comprar Curso por ${currentPrice.toLocaleString('pt-MZ')} MT`}
                  </span>
                </Link>
              </div>

              {/* Garantias em Linha Compacta */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-primary-600" />
                  Vitalício
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-primary-600" />
                  Certificado
                </span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-primary-600" />
                  M-Pesa / e-Mola
                </span>
              </div>

              {/* Link Direto de Login */}
              <div className="text-center pt-0.5">
                <Link
                  href={`/login?redirect=/dashboard/academy/course/${course.id}`}
                  className="text-[10px] text-slate-500 hover:text-primary-600 font-medium transition"
                >
                  Já és aluno deste curso? <span className="text-primary-600 font-bold underline">Entrar aqui</span>
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
                {(course.skills && course.skills.length > 0 ? course.skills : [
                  'Conteúdo prático estruturado passo a passo',
                  'Acesso a materiais de apoio e ficheiros do curso',
                  'Certificado oficial de conclusão emitido pela WEHOSTHERE',
                  'Acesso vitalício aos módulos e atualizações'
                ]).map((skill: string, idx: number) => (
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

                          {/* Detalhes e Aulas do Módulo */}
                          <div className="space-y-2.5">
                            {/* Card de Vídeo/Aula deste Módulo */}
                            {(mod.isFree || idx === 0) ? (
                              <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between flex-wrap gap-2 shadow-xs">
                                <div className="flex items-center gap-2.5 text-emerald-950 font-semibold text-xs sm:text-sm">
                                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                    <Play className="w-3 h-3 fill-current ml-0.5" />
                                  </div>
                                  <span>{mod.videoTitle || mod.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-300 shadow-xs">
                                    🎁 Aula Grátis
                                  </span>
                                  {mod.hasVideo && mod.videoUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setVideoPreviewModal({
                                        isOpen: true,
                                        videoUrl: mod.videoUrl!,
                                        title: mod.title,
                                        description: mod.videoDescription || mod.description
                                      })}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                      <span>Assistir Agora</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-slate-600 text-xs">
                                <div className="flex items-center gap-2.5">
                                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span className="font-medium">{mod.title}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                                  Exclusivo para Alunos
                                </span>
                              </div>
                            )}

                            {mod.hasMaterial && (
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-slate-500 text-xs">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5 text-primary-600" />
                                  <span>Material de Apoio e Recursos</span>
                                </div>
                                <span className="text-[10px] text-slate-400">Download Incluso</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FORMADOR COM GALERIA DE PROVA SOCIAL */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  <span>Sobre o Formador</span>
                </h2>
                {course.instructorGallery && course.instructorGallery.length > 0 && (
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                    <span>Prova Social & Atuação em Campo</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Coluna da Esquerda: Bio e Perfil do Formador */}
                <div className={`${course.instructorGallery && course.instructorGallery.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
                  <div className="flex items-start sm:items-center gap-4">
                    <div 
                      onClick={() => {
                        if (course.instructorAvatar) {
                          setLightboxImage(course.instructorAvatar);
                          setLightboxIndex(0);
                        }
                      }}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden cursor-pointer group relative"
                      title="Clique para ampliar em tela cheia"
                    >
                      <img
                        src={course.instructorAvatar || "/icon-192.png"}
                        alt={course.instructorName || "Formador"}
                        className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">{course.instructorName || 'Equipa WEHOSTHERE'}</h3>
                      <p className="text-xs font-bold text-primary-600">{course.instructorTitle || 'Especialistas em Engenharia & Cloud'}</p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {course.instructorBio || 'Formação prática desenvolvida pelos especialistas de tecnologia e infraestrutura da WEHOSTHERE.'}
                  </p>
                </div>

                {/* Coluna da Direita: Galeria de Fotos (Prova Social) */}
                {course.instructorGallery && course.instructorGallery.length > 0 && (
                  <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-primary-600" />
                        <span>Galeria & Atuação</span>
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Clica para selecionar
                      </span>
                    </div>

                    {/* Pré-visualização Inline para Mobile (aparece em ecrãs pequenos) */}
                    <div className="block lg:hidden">
                      <div 
                        onClick={() => {
                          const activeImg = course.instructorGallery![activePreviewIndex] || course.instructorGallery![0];
                          setLightboxImage(activeImg);
                          setLightboxIndex(activePreviewIndex);
                        }}
                        className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs cursor-pointer group mb-2"
                      >
                        <img
                          src={course.instructorGallery[activePreviewIndex] || course.instructorGallery[0]}
                          alt={`Foto ${activePreviewIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Maximize2 className="w-3 h-3" />
                          <span>Ver em Tela Cheia</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {course.instructorGallery.map((imgUrl, idx) => {
                        const isSelected = activePreviewIndex === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setActivePreviewIndex(idx);
                            }}
                            className={`relative aspect-4/3 rounded-xl overflow-hidden border cursor-pointer transition duration-200 ${
                              isSelected 
                                ? 'ring-3 ring-primary-500 border-primary-500 scale-[1.03] shadow-md z-10' 
                                : 'border-slate-200 bg-slate-900/10 hover:border-slate-400 opacity-75 hover:opacity-100 hover:scale-[1.02]'
                            }`}
                            title="Clique para pré-visualizar ao lado"
                          >
                            <img
                              src={imgUrl}
                              alt={`Formador em ação ${idx + 1}`}
                              className="w-full h-full object-cover transition duration-300"
                            />
                            
                            {/* Distintivo de Selecionada */}
                            {isSelected && (
                              <div className="absolute top-1.5 left-1.5 bg-primary-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                <span>A ver</span>
                              </div>
                            )}

                            {/* Botão de Ampliação Rápida */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePreviewIndex(idx);
                                setLightboxImage(imgUrl);
                                setLightboxIndex(idx);
                              }}
                              className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-md bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition"
                              title="Ver em tela cheia imediatamente"
                            >
                              <Maximize2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* REQUISITOS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-4">Requisitos</h2>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                {(course.requirements && course.requirements.length > 0 ? course.requirements : [
                  'Computador, tablet ou telemóvel com ligação à internet',
                  'Vontade de aprender e colocar os ensinamentos em prática'
                ]).map((req: string, idx: number) => (
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
            {/* PRÉ-VISUALIZAÇÃO DA GALERIA DO FORMADOR (Preenche o espaço lateral vazio) */}
            {course.instructorGallery && course.instructorGallery.length > 0 && (
              <div className="sticky top-24 bg-white rounded-3xl p-5 border border-primary-200/90 shadow-lg space-y-3.5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-primary-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Pré-visualização
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-primary-700 bg-primary-50 border border-primary-200 px-2.5 py-0.5 rounded-full">
                    Foto {activePreviewIndex + 1} de {course.instructorGallery.length}
                  </span>
                </div>

                {/* Imagem em Destaque */}
                <div 
                  onClick={() => {
                    const activeImg = course.instructorGallery![activePreviewIndex] || course.instructorGallery![0];
                    setLightboxImage(activeImg);
                    setLightboxIndex(activePreviewIndex);
                  }}
                  className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-xs cursor-pointer group"
                  title="Clique para ver em tela cheia"
                >
                  <img
                    src={course.instructorGallery[activePreviewIndex] || course.instructorGallery[0]}
                    alt={`Foto de Atuação ${activePreviewIndex + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md flex items-center gap-1.5 text-xs font-bold shadow-lg">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Ver em Tela Cheia</span>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" />
                    <span>Tela Cheia</span>
                  </div>
                </div>

                {/* Controlos de Navegação */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const total = course.instructorGallery!.length;
                      const prevIdx = (activePreviewIndex - 1 + total) % total;
                      setActivePreviewIndex(prevIdx);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Foto anterior"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const total = course.instructorGallery!.length;
                      const nextIdx = (activePreviewIndex + 1) % total;
                      setActivePreviewIndex(nextIdx);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Próxima foto"
                  >
                    <span>Seguinte</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Botão de Tela Cheia */}
                <button
                  type="button"
                  onClick={() => {
                    const activeImg = course.instructorGallery![activePreviewIndex] || course.instructorGallery![0];
                    setLightboxImage(activeImg);
                    setLightboxIndex(activePreviewIndex);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Ver Foto em Tela Cheia</span>
                </button>
                
                <p className="text-[10px] text-center text-slate-400">
                  Clica em qualquer foto da galeria ao lado para alternar a pré-visualização.
                </p>
              </div>
            )}

            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl">
              <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-400" />
                <span>Garantia de Satisfação</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Se após assistir às aulas sentires que o curso não entregou o valor prometido, o nosso suporte está disponível para te ajudar e garantir a tua total satisfação.
              </p>
              <div className="text-xs text-primary-400 font-bold">
                ✓ Suporte dedicado em Moçambique
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* MODAL DE TELA CHEIA (LIGHTBOX) PARA FOTOS DO FORMADOR */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          {/* Botão Fechar */}
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shadow-lg"
            title="Fechar (ESC)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navegação Foto Anterior */}
          {course && course.instructorGallery && course.instructorGallery.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const total = course.instructorGallery!.length;
                const prevIdx = (lightboxIndex - 1 + total) % total;
                setLightboxIndex(prevIdx);
                setActivePreviewIndex(prevIdx);
                setLightboxImage(course.instructorGallery![prevIdx]);
              }}
              className="absolute left-3 sm:left-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition cursor-pointer shadow-xl backdrop-blur-xs"
              title="Foto anterior (Seta para a esquerda)"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}

          {/* Imagem em Destaque Centralizada */}
          <div 
            className="max-w-5xl max-h-[85vh] relative flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="Foto do Formador em Tela Cheia"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10 select-none animate-in zoom-in-95 duration-200"
            />
            {course && course.instructorGallery && course.instructorGallery.length > 1 && (
              <p className="text-xs text-white/70 mt-3 font-medium tracking-wide">
                Foto {lightboxIndex + 1} de {course.instructorGallery.length} • Use as setas ou clique fora para fechar
              </p>
            )}
          </div>

          {/* Navegação Próxima Foto */}
          {course && course.instructorGallery && course.instructorGallery.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const total = course.instructorGallery!.length;
                const nextIdx = (lightboxIndex + 1) % total;
                setLightboxIndex(nextIdx);
                setActivePreviewIndex(nextIdx);
                setLightboxImage(course.instructorGallery![nextIdx]);
              }}
              className="absolute right-3 sm:right-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition cursor-pointer shadow-xl backdrop-blur-xs"
              title="Próxima foto (Seta para a direita)"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

            {/* MODAL CINEMA DE VÍDEO DA AULA GRATUITA */}
      {videoPreviewModal?.isOpen && (() => {
        const videoEmbed = formatVideoEmbedUrl(videoPreviewModal.videoUrl);
        return (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300"
            onClick={() => setVideoPreviewModal(null)}
          >
            <div 
              className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header do Modal */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/70">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                    Aula Grátis Liberada
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {videoPreviewModal.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {videoEmbed.originalWatchUrl && (
                    <a
                      href={videoEmbed.originalWatchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                      title="Abrir diretamente no YouTube"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir no YouTube</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setVideoPreviewModal(null)}
                    className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Fechar Vídeo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Player de Vídeo Seguro */}
              <div className="relative aspect-video w-full bg-black">
                {videoEmbed.type === 'video' ? (
                  <video
                    controls
                    autoPlay
                    className="w-full h-full"
                    src={videoEmbed.embedUrl}
                  />
                ) : (
                  <iframe
                    key={videoEmbed.embedUrl}
                    src={videoEmbed.embedUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    title={videoPreviewModal.title}
                  />
                )}
              </div>

              {/* Rodapé do Modal com Informações e CTA de Matrícula */}
              <div className="p-4 sm:p-5 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800">
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-400">
                    Estás a assistir à aula degustação de: <strong className="text-slate-200">{course.title}</strong>
                  </p>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    ✓ Garante acesso completo com aulas práticas, mentoria e certificado oficial WEHOSTHERE.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setVideoPreviewModal(null);
                      const purchaseCard = document.querySelector('.lg\\:col-span-1');
                      if (purchaseCard) {
                        purchaseCard.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Quero o Curso Completo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <AcademyFooter />
    </div>
  );
}


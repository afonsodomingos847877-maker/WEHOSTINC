'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, Clock, Award, Maximize2, Camera, X, ShieldCheck, CheckCircle2, Play, Sparkles, 
  Lock, Star, Users, ArrowRight, ArrowLeft, ChevronDown, 
  ChevronUp, Zap, HelpCircle, FileText, Video, Smartphone, Tag, Ticket
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
              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Preço Promocional</span>
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  {appliedCoupon ? (
                    <>
                      <span className="text-3xl font-black text-emerald-600">
                        {appliedCoupon.finalAmount.toLocaleString('pt-MZ')} <span className="text-base font-bold">MT</span>
                      </span>
                      <span className="text-sm text-slate-400 line-through font-bold">
                        {(course.price || 199).toLocaleString('pt-MZ')} MT
                      </span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        Cupom -{appliedCoupon.discountAmount} MT
                      </span>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>

              {/* Cupom de Desconto Interativo no Card do Curso */}
              <div className="mb-4 pt-3 border-t border-slate-100">
                {!appliedCoupon ? (
                  <div>
                    {!showCouponInput ? (
                      <button
                        type="button"
                        onClick={() => setShowCouponInput(true)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Tem um cupom de desconto? Inserir aqui</span>
                      </button>
                    ) : (
                      <div className="space-y-1.5 animate-in fade-in duration-150">
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Código (ex: IA2026)"
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
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-mono font-bold uppercase tracking-wider outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCourseCoupon}
                            disabled={validatingCoupon || !couponCode.trim()}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                          >
                            {validatingCoupon ? 'A validar...' : 'Aplicar'}
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-[11px] text-rose-600 font-semibold">{couponError}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs animate-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-950 font-mono">{appliedCoupon.code}</span>
                        <span className="text-emerald-700 font-semibold ml-1.5">(-{appliedCoupon.discountAmount} MT)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode('');
                        setCouponError('');
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-600 font-bold transition cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>

              {/* Opções de Pagamento: Integral ou em 2 Parcelas */}
              {allowInstallments && (
                <div className="space-y-2 pt-1 pb-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 px-0.5">
                    <span>Opção de Pagamento:</span>
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                      {paymentPlan === 'installments_2x' ? '2x Parcelas' : '1x Integral'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentPlan('full')}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        paymentPlan === 'full'
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 text-slate-900 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">À Vista (1x)</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentPlan === 'full' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                          {paymentPlan === 'full' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className="text-sm font-black text-slate-900">{currentPrice.toLocaleString('pt-MZ')} MT</span>
                        <span className="block text-[9px] text-emerald-700 font-semibold">Acesso vitalício</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentPlan('installments_2x')}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        paymentPlan === 'installments_2x'
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 text-slate-900 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">2x Parcelas</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentPlan === 'installments_2x' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                          {paymentPlan === 'installments_2x' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className="text-sm font-black text-emerald-700">{installmentPrice.toLocaleString('pt-MZ')} MT</span>
                        <span className="block text-[9px] text-emerald-600 font-semibold">1ª parcela hoje</span>
                      </div>
                    </button>
                  </div>

                  {paymentPlan === 'installments_2x' && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-950 space-y-1 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between font-bold">
                        <span>1ª Parcela a pagar hoje:</span>
                        <span className="text-emerald-700 font-black">{installmentPrice.toLocaleString('pt-MZ')} MT</span>
                      </div>
                      <p className="text-[10px] text-emerald-800 leading-tight">
                        ⚡ Dá acesso imediato ao curso e às aulas práticas. A 2ª parcela ({installmentPrice.toLocaleString('pt-MZ')} MT) só é necessária para emissão do certificado e conclusão.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Primary CTA: Buy Now with dynamic discounted price */}
              <div className="space-y-3">
                <Link
                  href={checkoutUrl}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    {paymentPlan === 'installments_2x' 
                      ? `Pagar 1ª Parcela de ${installmentPrice.toLocaleString('pt-MZ')} MT`
                      : `Comprar Curso por ${currentPrice.toLocaleString('pt-MZ')} MT`}
                  </span>
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

      <AcademyFooter />
    </div>
  );
}


'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import Image from "next/image";
import { Server, Mail, Shield, ShieldCheck, Activity, Smartphone, Zap, Globe, Users, Search, Sparkles, CheckCircle, Facebook, Phone, Linkedin, Star, ArrowRight, Play, Calendar, Eye, Instagram, ChevronLeft, ChevronRight, LayoutTemplate, Code, GraduationCap, Award, BookOpen, CheckCircle2 } from "lucide-react";
import { websiteTypes } from '@/lib/data';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useLanguage } from '@/context/LanguageContext';

import Navbar from '@/components/Navbar';
import DomainSearch from '@/components/DomainSearch';
import VirtualAssistant from '@/components/VirtualAssistant';
import InteractiveSteps from '@/components/InteractiveSteps';
import PartnersSection from '@/components/PartnersSection';
import NewsletterForm from '@/components/NewsletterForm';
import NewsletterPopup from '@/components/NewsletterPopup';
import { soundEffects } from '@/lib/soundEffects';

export default function Home() {
  const { t, language } = useLanguage();
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [activePricingPlan, setActivePricingPlan] = useState<'basic' | 'pro' | 'enterprise'>('pro');
  const [isPricingInteracted, setIsPricingInteracted] = useState(false);
  const [isPricingHovered, setIsPricingHovered] = useState(false);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Alternância dinâmica automática de períodos e cartões de planos (Opção 3 Combo)
  useEffect(() => {
    if (isPricingInteracted || isPricingHovered) return;

    const steps: Array<{ months: number; plan: 'basic' | 'pro' | 'enterprise' }> = [
      { months: 1, plan: 'basic' },
      { months: 3, plan: 'pro' },
      { months: 6, plan: 'pro' },
      { months: 12, plan: 'pro' },
      { months: 12, plan: 'enterprise' },
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setDurationMonths(steps[stepIndex].months);
      setActivePricingPlan(steps[stepIndex].plan);
    }, 3200);

    return () => clearInterval(interval);
  }, [isPricingInteracted, isPricingHovered]);

  // Ticker animado pelos tipos de sites e seus preços
  const tickerTypes = websiteTypes.filter(t => t.basePrice < 100000);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIndex(prev => (prev + 1) % tickerTypes.length);
        setTickerVisible(true);
      }, 350);
    }, 2500);
    return () => clearInterval(interval);
  }, [tickerTypes.length]);

  // Buscar posts do blog
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setBlogLoading(true);
        const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
        const response = await fetch(`/api/blog/posts?status=published&limit=3${categoryParam}`);
        const data = await response.json();
        
        if (data.success) {
          setBlogPosts(data.posts);
        } else {
          console.error('[Home] Erro na API:', data.error);
        }
      } catch (error) {
        console.error('[Home] Erro ao buscar posts do blog:', error);
      } finally {
        setBlogLoading(false);
      }
    };

    fetchBlogPosts();
  }, [selectedCategory]);

  // Carousel auto-slide
  useEffect(() => {
    if (blogPosts.length <= (isMobile ? 1 : 3) || isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(blogPosts.length / (isMobile ? 1 : 3)));
    }, 5000); // 5 segundos por slide

    return () => clearInterval(interval);
  }, [blogPosts.length, isPaused, isMobile]);

  // Detect mobile vs desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(blogPosts.length / (isMobile ? 1 : 3)));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(blogPosts.length / (isMobile ? 1 : 3))) % Math.ceil(blogPosts.length / (isMobile ? 1 : 3)));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Refs para scroll reveal das outras seções
  const featuresRef = useScrollAnimation<HTMLDivElement>();
  const builderPromoRef = useScrollAnimation<HTMLDivElement>();
  const pricingRef = useScrollAnimation<HTMLDivElement>();
  const siteCreationRef = useScrollAnimation<HTMLDivElement>();
  const systemsRentRef = useScrollAnimation<HTMLDivElement>();
  const academyPromoRef = useScrollAnimation<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navbar Responsivo */}
      <Navbar />

      {/* Hero + Banner — two-column on desktop, stacked on mobile */}
      <section id="infraestrutura" className="relative min-h-[600px] sm:min-h-[700px] px-4 bg-slate-950 text-white overflow-hidden shadow-2xl w-full flex items-center justify-center pb-0">
        {/* Imagem de Fundo estática */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
          style={{ backgroundImage: "url('/datacenter-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/70 to-slate-950" />

        {/* Keyframes globais do mascote */}
        <style>{`
          @keyframes mascoteFloat {
            0%, 100% { transform: translateY(0px) rotate(-1deg); }
            50% { transform: translateY(-18px) rotate(1deg); }
          }
          @keyframes mascoteFloatMini {
            0%, 100% { transform: translateY(0px) rotate(-1deg); }
            50% { transform: translateY(-10px) rotate(1deg); }
          }
          .mascote-glow { filter: drop-shadow(0 20px 40px rgba(37, 99, 235, 0.35)); }
        `}</style>

        {/* Layout principal — flex para transição suave entre 2-col e 1-col */}
        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-0 lg:gap-8 items-center pt-16 sm:pt-20 pb-8 sm:pb-10">

          {/* Coluna Esquerda — expande para 100% quando mascote sai */}
          <div
            className={`w-full flex flex-col transition-all duration-500 ${
              isSearchFocused
                ? 'items-center text-center'
                : 'items-center lg:items-start text-center lg:text-left'
            }`}
            style={{
              flex: isSearchFocused ? '1 1 100%' : '1 1 60%',
              transition: 'flex 0.5s cubic-bezier(0.4,0,0.2,1)',
            }}
          >

            {/* Título principal */}
            <h1
              className={`text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight leading-tight drop-shadow-lg transition-all duration-500 ${
                isSearchFocused ? 'text-center mx-auto max-w-4xl' : ''
              }`}
            >
              {t('hero.title_full')}
            </h1>

            {/* Domain Search */}
            <div className={`px-2 lg:px-0 w-full transition-all duration-500 ${
              isSearchFocused ? 'max-w-4xl mx-auto' : ''
            }`}>
              <DomainSearch onFocusChange={setIsSearchFocused} />
            </div>
          </div>

          {/* Coluna Direita — Mascote desktop: desliza para fora quando pesquisa */}
          <div
            className="hidden lg:flex items-end justify-center relative"
            style={{
              flex: isSearchFocused ? '0 0 0%' : '0 0 40%',
              opacity: isSearchFocused ? 0 : 1,
              transform: isSearchFocused ? 'translateX(60px) scale(0.8)' : 'translateX(0px) scale(1)',
              transition: 'flex 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease, transform 0.5s cubic-bezier(0.4,0,0.2,1)',
              pointerEvents: isSearchFocused ? 'none' : 'auto',
            }}
          >
            {/* Glow de fundo atrás do mascote */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-48 bg-sky-400/15 rounded-full blur-2xl" />

            {/* Mascote flutuante */}
            <div
              className="relative mascote-glow"
              style={{ animation: 'mascoteFloat 4s ease-in-out infinite' }}
            >
              <Image
                src="/mascote-transparent.png"
                alt="Mascote WEHOSTHERE"
                width={440}
                height={440}
                priority
                className="w-52 xl:w-72 h-auto object-contain select-none"
                draggable={false}
              />
            </div>
          </div>

          {/* Mascote mini no mobile — some quando foca */}
          <div
            className="lg:hidden flex justify-center mt-2 overflow-hidden"
            style={{
              maxHeight: isSearchFocused ? '0px' : '200px',
              opacity: isSearchFocused ? 0 : 1,
              transform: isSearchFocused ? 'scale(0.7) translateY(20px)' : 'scale(1) translateY(0px)',
              transition: 'max-height 0.45s ease, opacity 0.35s ease, transform 0.4s ease',
            }}
          >
            <div style={{ animation: 'mascoteFloatMini 4s ease-in-out infinite' }}>
              <Image
                src="/mascote-transparent.png"
                alt="Mascote WEHOSTHERE"
                width={200}
                height={200}
                priority
                className="w-32 sm:w-44 h-auto object-contain select-none"
                style={{ filter: 'drop-shadow(0 12px 24px rgba(37, 99, 235, 0.4))' }}
                draggable={false}
              />
            </div>
          </div>

        </div>
      </section>

      {/* Features - Mobile First */}
      <section id="recursos" ref={featuresRef} className="anim-fade-up py-6 sm:py-14 px-3 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-center text-gray-900 mb-4 sm:mb-10">
            {t('features.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            <div className="text-center p-4 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-100 hover:shadow-lg hover:scale-105 hover:bg-gradient-to-br hover:from-primary-50 hover:to-blue-50 transition-all duration-300 cursor-pointer group">
              <div className="flex justify-center mb-2">
                <Zap className="h-6 w-6 sm:h-10 sm:w-10 text-primary-600 group-hover:scale-110 group-hover:text-primary-700 transition-transform duration-300" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">{t('features.fast_title')}</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">{t('features.fast_desc')}</p>
            </div>

            <div className="text-center p-4 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-100 hover:shadow-lg hover:scale-105 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-50 transition-all duration-300 cursor-pointer group">
              <div className="flex justify-center mb-2">
                <Shield className="h-6 w-6 sm:h-10 sm:w-10 text-primary-600 group-hover:scale-110 group-hover:text-emerald-600 transition-transform duration-300" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors">{t('features.secure_title')}</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">{t('features.secure_desc')}</p>
            </div>

            <div className="text-center p-4 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-100 hover:shadow-lg hover:scale-105 hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50 transition-all duration-300 cursor-pointer group">
              <div className="flex justify-center mb-2">
                <Users className="h-6 w-6 sm:h-10 sm:w-10 text-primary-600 group-hover:scale-110 group-hover:text-purple-600 transition-transform duration-300" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">{t('features.support_title')}</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">{t('features.support_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 AI Builder Promo Section — Meta Style */}
      <section id="construtor-ia" ref={builderPromoRef} className="anim-fade-up py-10 sm:py-20 px-3 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-slate-50 to-blue-50/40 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* Left Column — Immersive Visual Showcase (Meta Style with bulder ai.jpg) */}
            <div className="lg:col-span-7 relative">
              {/* Outer Glow / Ambient Lighting */}
              <div className="absolute -inset-3 bg-gradient-to-r from-blue-600/20 via-sky-500/20 to-indigo-600/20 rounded-[36px] blur-2xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10" />

              {/* Main Showcase Card */}
              <div className="relative rounded-2xl sm:rounded-3xl lg:rounded-[32px] overflow-hidden bg-white shadow-2xl shadow-blue-950/10 group">
                
                {/* Robot Builder Banner Image */}
                <div className="relative w-full h-[320px] sm:h-[440px] lg:h-[500px] overflow-hidden">
                  <Image
                    src="/bulder ai.png"
                    alt="WEHOSTHERE Construtor de Sites IA"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 720px"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    priority
                  />
                </div>

              </div>
            </div>

            {/* Right Column — Clean Bold Typography & Call to Action (Meta Style) */}
            <div className="lg:col-span-5 flex flex-col items-start text-left">
              
              {/* Headline */}
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-5">
                {t('builder_promo.title')}
              </h2>

              {/* Description */}
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8 font-normal">
                {t('builder_promo.desc')}
              </p>

              {/* CTA Button */}
              <Link
                href="/dashboard/builder"
                className="inline-flex items-center justify-center gap-2.5 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white font-bold text-sm sm:text-base px-8 py-3.5 sm:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                <span>{t('builder_promo.btn')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

            </div>

          </div>
        </div>
      </section>

      {/* 🕶️ Dual Card Showcase — Meta Style (bulderai2.jpg & bulderai03.jpg) */}
      <section className="py-4 sm:py-8 px-3 sm:px-6 lg:px-8 bg-transparent overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">

            {/* Card 1: bulderai2.jpg (Inteligência Artificial & Visão) */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden h-[260px] sm:h-[340px] lg:h-[400px] shadow-xl group bg-transparent">
              <Image
                src="/bulderai2.jpg"
                alt="Construtor IA WEHOSTHERE"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                priority
              />
              {/* Subtle Bottom Gradient ONLY behind the action buttons/text */}
              <div className="absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

              {/* Overlaid Content at Bottom */}
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 flex flex-col items-center text-center z-10">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-200 mb-0.5 tracking-wide drop-shadow">
                  Inteligência Artificial Nativa
                </span>
                <h3 className="text-sm sm:text-lg lg:text-xl font-extrabold text-white mb-2 sm:mb-2.5 tracking-tight max-w-sm drop-shadow-md">
                  Criação Inteligente em Tempo Real
                </h3>

                {/* Meta-style Action Buttons */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <Link
                    href="/dashboard/builder"
                    className="bg-[#0064e0] hover:bg-blue-600 text-white font-bold text-[11px] sm:text-xs px-4 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-lg transition active:scale-95"
                  >
                    Criar com IA
                  </Link>
                  <Link
                    href="#construtor-ia"
                    className="bg-[#f5d0c5]/95 hover:bg-[#f5d0c5] text-slate-900 font-bold text-[11px] sm:text-xs px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-md transition active:scale-95 backdrop-blur-sm"
                  >
                    Saber mais
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: bulderai03.jpg (Estúdio Web & Código) */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden h-[260px] sm:h-[340px] lg:h-[400px] shadow-xl group bg-transparent">
              <Image
                src="/bulderai03.jpg"
                alt="Estúdio Web WEHOSTHERE"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                priority
              />
              {/* Subtle Bottom Gradient ONLY behind the action buttons/text */}
              <div className="absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

              {/* Overlaid Content at Bottom */}
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 flex flex-col items-center text-center z-10">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-200 mb-0.5 tracking-wide drop-shadow">
                  Estúdio Visual & Código
                </span>
                <h3 className="text-sm sm:text-lg lg:text-xl font-extrabold text-white mb-2 sm:mb-2.5 tracking-tight max-w-sm drop-shadow-md">
                  O Seu Estúdio Web Sem Limites
                </h3>

                {/* Meta-style Action Buttons */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <Link
                    href="/dashboard/builder"
                    className="bg-[#0064e0] hover:bg-blue-600 text-white font-bold text-[11px] sm:text-xs px-4 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-lg transition active:scale-95"
                  >
                    Explorar Studio
                  </Link>
                  <Link
                    href="#construtor-ia"
                    className="bg-[#f5d0c5]/95 hover:bg-[#f5d0c5] text-slate-900 font-bold text-[11px] sm:text-xs px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-md transition active:scale-95 backdrop-blur-sm"
                  >
                    Saber mais
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="planos"
        ref={pricingRef}
        onMouseEnter={() => setIsPricingHovered(true)}
        onMouseLeave={() => setIsPricingHovered(false)}
        className="anim-fade-up py-12 sm:py-20 px-3 sm:px-4 bg-blue-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto mb-4 sm:mb-6 px-2">
              {t('pricing.subtitle')}
            </p>

            {/* Seleção de Duração / Período da Hospedagem */}
            <div className="inline-flex flex-wrap items-center justify-center bg-gray-200 p-1.5 rounded-2xl border border-gray-300 shadow-inner gap-1 max-w-full">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClickSound();
                  setIsPricingInteracted(true);
                  setDurationMonths(1);
                }}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 ${
                  durationMonths === 1 ? 'bg-white text-gray-900 shadow-md scale-105' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('pricing.1month')}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClickSound();
                  setIsPricingInteracted(true);
                  setDurationMonths(3);
                }}
                className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs sm:text-sm font-bold transition-all duration-300 flex items-center space-x-0.5 sm:space-x-1 cursor-pointer hover:scale-105 active:scale-95 ${
                  durationMonths === 3 ? 'bg-blue-600 text-white shadow-md scale-105' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{t('pricing.3months')}</span>
                <span className="bg-blue-200 text-blue-900 text-[8px] sm:text-[10px] font-extrabold px-1 sm:px-1.5 py-0.2 rounded-full hidden sm:inline">
                  -5% {t('pricing.off')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClickSound();
                  setIsPricingInteracted(true);
                  setDurationMonths(6);
                }}
                className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs sm:text-sm font-bold transition-all duration-300 flex items-center space-x-0.5 sm:space-x-1 cursor-pointer hover:scale-105 active:scale-95 ${
                  durationMonths === 6 ? 'bg-purple-600 text-white shadow-md scale-105' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{t('pricing.6months')}</span>
                <span className="bg-purple-200 text-purple-900 text-[8px] sm:text-[10px] font-extrabold px-1 sm:px-1.5 py-0.2 rounded-full hidden sm:inline">
                  -10% {t('pricing.off')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClickSound();
                  setIsPricingInteracted(true);
                  setDurationMonths(12);
                }}
                className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs sm:text-sm font-bold transition-all duration-300 flex items-center space-x-0.5 sm:space-x-1.5 cursor-pointer hover:scale-105 active:scale-95 ${
                  durationMonths === 12 ? 'bg-primary-600 text-white shadow-md scale-105' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{t('pricing.1year')}</span>
                <span className="bg-amber-400 text-gray-900 text-[8px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline">
                  {t('pricing.2months_free')}
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-8 items-stretch">
            {/* Basic Plan */}
            <div
              onClick={() => {
                soundEffects.playClickSound();
                setIsPricingInteracted(true);
                setActivePricingPlan('basic');
              }}
              className={`rounded-2xl p-5 sm:p-8 flex flex-col justify-between transition-all duration-500 cursor-pointer group ${
                activePricingPlan === 'basic'
                  ? 'bg-white border-2 border-primary-500 shadow-2xl -translate-y-3 ring-4 ring-primary-500/20'
                  : 'bg-white border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2'
              }`}
            >
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{t('pricing.basic_name')}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">{t('pricing.basic_desc')}</p>
                <div className="mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-4xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {durationMonths === 12
                      ? '5.500 MT'
                      : durationMonths === 6
                      ? '2.970 MT'
                      : durationMonths === 3
                      ? '1.568 MT'
                      : '550 MT'}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    {durationMonths === 12 ? ` ${t('pricing.per_year')}` : ` /${durationMonths}M`}
                  </span>
                  {durationMonths > 1 && (
                    <div className="text-[10px] sm:text-xs font-semibold text-emerald-600 mt-1">
                      {durationMonths === 12
                        ? `${t('pricing.save')} 1.100 MT (${t('pricing.2months_free')})`
                        : durationMonths === 6
                        ? `${t('pricing.save')} 330 MT (10% ${t('pricing.discount')})`
                        : `${t('pricing.save')} 82 MT (5% ${t('pricing.discount')})`}
                    </div>
                  )}
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-8">
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Server className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {t('pricing.basic_f1')}
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {t('pricing.basic_f2')}
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {t('pricing.basic_f3')}
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {t('pricing.basic_f4')}
                  </li>
                </ul>
              </div>
              <Link
                href={`/checkout?plan=basic&billingCycle=${durationMonths === 12 ? 'annual' : 'monthly'}`}
                className={`block w-full py-2.5 sm:py-3 text-center border-2 border-primary-600 font-bold rounded-xl hover:scale-105 active:scale-95 transition-all duration-300 text-xs sm:text-sm ${
                  activePricingPlan === 'basic'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-primary-600 hover:bg-primary-50'
                }`}
              >
                {t('pricing.btn_subscribe')}
              </Link>
            </div>

            {/* Pro Plan */}
            <div
              onClick={() => {
                soundEffects.playClickSound();
                setIsPricingInteracted(true);
                setActivePricingPlan('pro');
              }}
              className={`rounded-2xl p-5 sm:p-8 text-white flex flex-col justify-between relative transform transition-all duration-500 cursor-pointer group ${
                activePricingPlan === 'pro'
                  ? 'bg-primary-600 lg:-translate-y-4 shadow-2xl border-2 border-amber-300 ring-4 ring-amber-400/30 scale-[1.02]'
                  : 'bg-primary-600 lg:-translate-y-2 border border-primary-500 shadow-xl hover:shadow-2xl hover:-translate-y-4'
              }`}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-400 text-gray-900 text-[10px] sm:text-xs font-black px-3 sm:px-4 py-1 rounded-full uppercase tracking-wider shadow group-hover:scale-110 transition-transform">
                {t('pricing.most_popular')}
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-2 pt-2 group-hover:text-blue-100 transition-colors">{t('pricing.pro_name')}</h3>
                <p className="text-sm sm:text-base text-blue-100 mb-4">{t('pricing.pro_desc')}</p>
                <div className="mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-4xl font-bold text-white group-hover:text-blue-100 transition-colors">
                    {durationMonths === 12
                      ? '25.000 MT'
                      : durationMonths === 6
                      ? '13.500 MT'
                      : durationMonths === 3
                      ? '7.125 MT'
                      : '2.500 MT'}
                  </span>
                  <span className="text-xs sm:text-sm text-blue-100 font-medium">
                    {durationMonths === 12 ? ` ${t('pricing.per_year')}` : ` /${durationMonths}M`}
                  </span>
                  {durationMonths > 1 && (
                    <div className="text-[10px] sm:text-xs font-semibold text-amber-300 mt-1">
                      {durationMonths === 12
                        ? `${t('pricing.save')} 5.000 MT (${t('pricing.2months_free')})`
                        : durationMonths === 6
                        ? `${t('pricing.save')} 1.500 MT (10% ${t('pricing.discount')})`
                        : `${t('pricing.save')} 375 MT (5% ${t('pricing.discount')})`}
                    </div>
                  )}
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-8">
                  <li className="flex items-center text-xs sm:text-sm text-white group-hover:text-blue-100 transition-colors">
                    <Server className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {t('pricing.pro_f1')}
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-white group-hover:text-blue-100 transition-colors">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {t('pricing.pro_f2')}
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-white group-hover:text-blue-100 transition-colors">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {t('pricing.pro_f3')}
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-white group-hover:text-blue-100 transition-colors">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {t('pricing.pro_f4')}
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-white group-hover:text-blue-100 transition-colors">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {t('pricing.pro_f5')}
                  </li>
                </ul>
              </div>
              <Link
                href={`/checkout?plan=pro&billingCycle=${durationMonths === 12 ? 'annual' : 'monthly'}`}
                className="block w-full py-2.5 sm:py-3.5 text-center bg-white text-primary-700 rounded-xl hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all duration-300 font-bold shadow-md text-xs sm:text-sm"
              >
                {t('pricing.btn_pro')}
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div
              onClick={() => {
                soundEffects.playClickSound();
                setIsPricingInteracted(true);
                setActivePricingPlan('enterprise');
              }}
              className={`rounded-2xl p-5 sm:p-8 flex flex-col justify-between transition-all duration-500 cursor-pointer group ${
                activePricingPlan === 'enterprise'
                  ? 'bg-white border-2 border-primary-500 shadow-2xl -translate-y-3 ring-4 ring-primary-500/20'
                  : 'bg-white border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2'
              }`}
            >
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{t('pricing.enterprise_name')}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">{t('pricing.enterprise_desc')}</p>
                <div className="mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-4xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {durationMonths === 12
                      ? '62.000 MT'
                      : durationMonths === 6
                      ? '33.480 MT'
                      : durationMonths === 3
                      ? '17.670 MT'
                      : '6.200 MT'}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    {durationMonths === 12 ? ` ${t('pricing.per_year')}` : ` /${durationMonths}M`}
                  </span>
                  {durationMonths > 1 && (
                    <div className="text-[10px] sm:text-xs font-semibold text-emerald-600 mt-1">
                      {durationMonths === 12
                        ? `${t('pricing.save')} 12.400 MT (${t('pricing.2months_free')})`
                        : durationMonths === 6
                        ? `${t('pricing.save')} 3.720 MT (10% ${t('pricing.discount')})`
                        : `${t('pricing.save')} 930 MT (5% ${t('pricing.discount')})`}
                    </div>
                  )}
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-8">
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Server className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {t('pricing.enterprise_f1')}
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {t('pricing.enterprise_f2')}
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {t('pricing.enterprise_f3')}
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {t('pricing.enterprise_f4')}
                  </li>
                  <li className="flex items-center text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {t('pricing.enterprise_f5')}
                  </li>
                </ul>
              </div>
              <Link
                href={`/checkout?plan=enterprise&billingCycle=${durationMonths === 12 ? 'annual' : 'monthly'}`}
                className={`block w-full py-2.5 sm:py-3 text-center border-2 border-primary-600 font-bold rounded-xl hover:scale-105 active:scale-95 transition-all duration-300 text-xs sm:text-sm ${
                  activePricingPlan === 'enterprise'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-primary-600 hover:bg-primary-50'
                }`}
              >
                {t('pricing.btn_enterprise')}
              </Link>
            </div>
          </div>

          {/* Website Creation Service Banner */}
          <div id="criacao-sites" ref={siteCreationRef} className="anim-fade-up mt-6 sm:mt-10 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-200 relative overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 relative z-10">
              <div className="flex-1">
                <div className="inline-flex items-center space-x-1 sm:space-x-1.5 bg-primary-50 text-primary-800 border border-primary-200 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 sm:mb-2.5 hover:bg-primary-100 transition-colors cursor-default">
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span>{t('sites.badge')}</span>
                </div>
                <h3 className="text-lg sm:text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1.5 sm:mb-2 group-hover:text-primary-600 transition-colors">
                  {t('sites.title')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed max-w-2xl">
                  {t('sites.desc')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-700">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 group cursor-default">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-emerald-700 transition-colors">{t('sites.feat_responsive')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 group cursor-default">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-emerald-700 transition-colors">{t('sites.feat_domain')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 group cursor-default">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-emerald-700 transition-colors">{t('sites.feat_social')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 group cursor-default">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-emerald-700 transition-colors">{t('sites.feat_emails')}</span>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-72 bg-gradient-to-b from-gray-50 to-primary-50/40 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-200 text-center flex flex-col justify-between shrink-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div>
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold text-gray-500 tracking-wider block mb-1.5 sm:mb-2">{t('sites.investment_title')}</span>

                  {/* Ticker animado */}
                  <div className="min-h-[60px] sm:min-h-[80px] flex flex-col items-center justify-center">
                    <div
                      style={{
                        opacity: tickerVisible ? 1 : 0,
                        transform: tickerVisible ? 'translateY(0)' : 'translateY(8px)',
                        transition: 'opacity 0.35s ease, transform 0.35s ease'
                      }}
                    >
                      <div className="flex items-center justify-center space-x-1 sm:space-x-1.5 mb-0.5 sm:mb-1">
                        <span className="text-sm sm:text-lg">{tickerTypes[tickerIndex]?.emoji}</span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 truncate max-w-[120px] sm:max-w-[160px]">
                          {tickerTypes[tickerIndex]?.name}
                        </span>
                      </div>
                      <div className="text-xl sm:text-3xl sm:text-4xl font-black text-primary-700">
                        {tickerTypes[tickerIndex]?.basePrice.toLocaleString('pt-MZ')} MT
                      </div>
                    </div>
                  </div>

                  {/* Dots indicadores */}
                  <div className="flex justify-center gap-0.5 sm:gap-1 mt-1.5 sm:mt-2 mb-2 sm:mb-3">
                    {tickerTypes.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setTickerVisible(false); setTimeout(() => { setTickerIndex(i); setTickerVisible(true); }, 300); }}
                        className={`rounded-full transition-all duration-300 cursor-pointer hover:scale-125 ${i === tickerIndex ? 'w-3 h-1 sm:w-4 sm:h-1.5 bg-primary-600' : 'w-1.5 h-1 sm:w-1.5 sm:h-1.5 bg-gray-300'}`}
                      />
                    ))}
                  </div>

                  <p className="text-[9px] sm:text-[10px] text-gray-400 mb-2 sm:mb-4 font-medium">{t('sites.investment_note')}</p>
                </div>

                <Link
                  href="/site-quote"
                  className="w-full py-2 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-[10px] sm:text-xs sm:text-sm rounded-xl shadow transition duration-200 block text-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  {t('sites.btn_quote')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Systems for Rent Section */}
      <section id="sistemas-aluguer" ref={systemsRentRef} className="anim-fade-up py-10 sm:py-16 px-3 sm:px-6 bg-gradient-to-b from-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <div className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-purple-100 text-purple-800 border border-purple-200 px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3 sm:mb-4">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
              <span>{t('systems.badge')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 mb-2 sm:mb-3">
              {t('systems.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mb-4 sm:mb-6 px-2">
              {t('systems.desc')}
            </p>
          </div>

          {/* Como Funciona */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-200 mb-6 sm:mb-10">
            <InteractiveSteps />
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/systems"
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span>{t('systems.btn_view')}</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3">
              {t('systems.subtext')}
            </p>
          </div>
        </div>
      </section>

      {/* 🎓 Academia WeHostHere Section — Formação Prática com Certificação */}
      <section id="academia" ref={academyPromoRef} className="anim-fade-up py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50/40 via-white to-blue-50/30 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* Coluna da Imagem — academiaweb.jpg com Ambient Glow */}
            <div className="lg:col-span-7 relative order-2 lg:order-1">
              <div className="absolute -inset-3 bg-gradient-to-tr from-primary-600/20 via-sky-500/20 to-indigo-600/20 rounded-[36px] blur-2xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10" />

              <div className="relative rounded-2xl sm:rounded-3xl lg:rounded-[32px] overflow-hidden bg-white shadow-2xl shadow-blue-950/10 border border-slate-200/80 group">
                <div className="relative w-full h-[320px] sm:h-[420px] lg:h-[480px] overflow-hidden">
                  <Image
                    src="/academiaweb.jpeg"
                    alt="Academia WEHOSTHERE — Cursos de Tecnologia e Programação em Moçambique"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 720px"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Floating Badges sobre a Imagem */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-950/70 text-white backdrop-blur-md border border-white/20 shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                    <span>Cursos 100% Práticos</span>
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 flex items-center justify-between text-white/95 text-xs bg-black/60 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="font-bold text-[11px] sm:text-xs">4.9/5 Avaliação</span>
                  </div>
                  <span className="text-[11px] font-semibold text-primary-300">
                    Certificado Oficial Emitido
                  </span>
                </div>
              </div>
            </div>

            {/* Coluna de Texto & Conteúdo */}
            <div className="lg:col-span-5 flex flex-col items-start text-left order-1 lg:order-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-200 mb-3 shadow-xs">
                <GraduationCap className="w-4 h-4 text-primary-600" />
                <span>Academia WEHOSTHERE</span>
              </span>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-4">
                Aprende Tecnologia na Prática com Projetos Reais
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 font-normal">
                Desenvolve competências reais em Inteligência Artificial, Engenharia Cloud, Desenvolvimento Web e Automações com os especialistas que operam a infraestrutura da WEHOSTHERE em Moçambique.
              </p>

              {/* 3 Pontos Chave */}
              <div className="space-y-3 mb-8 w-full">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Code className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">Código Real & Projetos do Início ao Fim</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Sem teorias cansativas. Constrói soluções funcionais prontas para o mercado.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">Certificado Oficial Reconhecido</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Certificação com autenticidade verificada para enriquecer o teu currículo.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">Pagamento em 2x via M-Pesa & e-Mola</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Opção flexível em 2 parcelas ou à vista com aprovação automática em segundos.</p>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href="/academy"
                  className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white font-black text-xs sm:text-sm px-6 sm:px-8 py-3.5 sm:py-4 rounded-full shadow-lg shadow-primary-600/25 hover:shadow-xl transition-all duration-200 group"
                >
                  <span>Explorar Cursos da Academia</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/dashboard/academy"
                  className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm px-5 sm:px-6 py-3.5 sm:py-4 rounded-full transition-all duration-200"
                >
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <span>Área de Aluno</span>
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Blog/News Section */}
      <section className="py-10 sm:py-16 px-3 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <Link
                href="/"
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                {t('blog.back_home')}
              </Link>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 mb-2 sm:mb-3">
              {t('blog.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              {t('blog.desc')}
            </p>
          </div>

          {/* Menu de Categorias */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
            {[
              { id: 'all', label: t('blog.cat_all') },
              { id: 'news', label: t('blog.cat_news') },
              { id: 'tutorial', label: t('blog.cat_tutorial') },
              { id: 'announcement', label: t('blog.cat_announcement') },
              { id: 'update', label: t('blog.cat_update') },
              { id: 'feature', label: t('blog.cat_feature') }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {blogLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : blogPosts.length > 0 ? (
            <div 
              className="relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Navigation Arrows */}
              {blogPosts.length > (isMobile ? 1 : 3) && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 sm:-translate-x-4 z-10 bg-white/90 hover:bg-white text-gray-800 p-2 sm:p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 sm:translate-x-4 z-10 bg-white/90 hover:bg-white text-gray-800 p-2 sm:p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </>
              )}

              {/* Carousel Container - Shows 3 cards at once on desktop, 1 on mobile */}
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * (isMobile ? 100 : 33.333)}%)` }}
                >
                  {blogPosts.map((post) => (
                    <div key={post.id} className="w-full md:w-1/3 flex-shrink-0 px-2 sm:px-4">
                      <Link 
                        href={`/blog/${post.slug}`}
                        className="group bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 block"
                      >
                        {post.coverImage && (
                          <div className="relative h-48 sm:h-56 overflow-hidden">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-3 left-3">
                              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                {post.category}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="p-4 sm:p-6">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-3">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(post.publishedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'pt-PT', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <span className="text-blue-600 font-semibold group-hover:underline">
                              {t('blog.read_more')}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dots Indicators - One dot per group of cards */}
              {blogPosts.length > (isMobile ? 1 : 3) && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: Math.ceil(blogPosts.length / (isMobile ? 1 : 3)) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentSlide === index 
                          ? 'w-8 bg-blue-600' 
                          : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}
          
          {!blogLoading && blogPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('blog.no_posts')}</p>
            </div>
          )}

          <div className="text-center mt-8 sm:mt-10">
            <Link
              href="/blog"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span>{t('blog.btn_all_posts')}</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Revista "Codando Histórias" CTA Section ── */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden bg-slate-950">
        {/* Animated gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-indigo-600/20 blur-[100px] animate-pulse" />
          <div className="absolute -bottom-32 -right-32 w-[380px] h-[380px] rounded-full bg-violet-600/20 blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-blue-700/10 blur-[120px]" />
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-400/30 rounded-full px-4 py-1.5 mb-6">
            <span className="text-indigo-400 text-xs font-mono font-bold tracking-tight">&lt;/&gt;</span>
            <span className="text-indigo-300 text-xs sm:text-sm font-semibold tracking-widest uppercase">Revista Digital · Codando Histórias</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5">
            Histórias que inspiram<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent"> o futuro digital </span>
            de Moçambique
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto mb-10">
            Artigos e histórias sobre tecnologia e inovação em Moçambique.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {[
              'Empreendedorismo',
              'Tecnologia & IA',
              'Negócios Digitais',
              'Inovação Local',
              'Casos de Sucesso',
            ].map((label) => (
              <span
                key={label}
                className="inline-flex items-center bg-white/5 border border-white/10 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-white/10 hover:border-indigo-400/40 transition-all duration-200"
              >
                {label}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/revista"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base sm:text-lg px-8 py-4 rounded-2xl shadow-2xl shadow-indigo-900/50 hover:shadow-indigo-700/60 transition-all duration-300 hover:-translate-y-0.5"
            >
              Ler a Revista
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link
              href="/revista#latest"
              className="inline-flex items-center gap-2 border border-slate-600 hover:border-indigo-400/60 text-slate-300 hover:text-white font-semibold text-sm sm:text-base px-6 py-4 rounded-2xl transition-all duration-300 hover:bg-white/5"
            >
              Última Edição →
            </Link>
          </div>

          {/* Decorative bottom stat bar */}
          <div className="mt-14 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto border-t border-slate-800 pt-10">
            {[
              { value: '100%', label: 'Gratuito' },
              { value: 'PDF', label: 'Download Disponível' },
              { value: '🇲🇿', label: 'Feito em Moçambique' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl sm:text-2xl font-extrabold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Partners Section */}
      <PartnersSection />

      {/* Footer */}
      <footer id="contacto" className="relative bg-slate-950 text-white py-10 sm:py-16 px-3 sm:px-4 overflow-hidden border-t border-slate-800">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-65"
          style={{ backgroundImage: "url('/footer-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/75 to-slate-950/80" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-3 sm:mb-4 group cursor-default">
                <Server className="h-6 w-6 sm:h-8 sm:w-8 text-primary-400 group-hover:scale-110 group-hover:text-primary-300 transition-all duration-300" />
                <span className="text-xl sm:text-2xl font-bold tracking-tight group-hover:text-primary-300 transition-colors">WEHOSTHERE</span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
                {t('footer.about')}
              </p>
              
              {/* Links das Redes Sociais */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <a
                  href="https://www.facebook.com/profile.php?id=61592497206566&locale=pt_BR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition shadow-md group hover:scale-105 active:scale-95 hover:shadow-lg"
                >
                  <Facebook className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current group-hover:scale-110 transition-transform" />
                  <span>Facebook</span>
                </a>
                <a
                  href="https://www.linkedin.com/company/wehosthere"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition shadow-md group hover:scale-105 active:scale-95 hover:shadow-lg"
                >
                  <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current group-hover:scale-110 transition-transform" />
                  <span>LinkedIn</span>
                </a>
                <a
                  href="https://x.com/wehosthere"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-black hover:bg-gray-900 text-white font-bold text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition shadow-md group hover:scale-105 active:scale-95 hover:shadow-lg"
                >
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>X</span>
                </a>
                <a
                  href="https://www.instagram.com/wehosthere"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-bold text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition shadow-md group hover:scale-105 active:scale-95 hover:shadow-lg"
                >
                  <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current group-hover:scale-110 transition-transform" />
                  <span>Instagram</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 sm:mb-4 uppercase tracking-wider text-[10px] sm:text-xs">{t('footer.products_title')}</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-slate-400 text-[10px] sm:text-sm">
                <li><Link href="/hospedagem" className="hover:text-primary-300 transition hover:translate-x-1 duration-300 block">{t('footer.prod_hosting')}</Link></li>
                <li><Link href="/email-corporativo" className="hover:text-primary-300 transition hover:translate-x-1 duration-300 block">{t('footer.prod_email')}</Link></li>
                <li><Link href="/vps" className="hover:text-primary-300 transition hover:translate-x-1 duration-300 block">{t('footer.prod_vps')}</Link></li>
                <li><Link href="/dominios" className="hover:text-primary-300 transition hover:translate-x-1 duration-300 block">{t('footer.prod_domains')}</Link></li>
                <li><Link href="/hospedagem-wordpress" className="hover:text-primary-300 transition hover:translate-x-1 duration-300 block">WordPress</Link></li>
                <li><Link href="/email-profissional" className="hover:text-primary-300 transition hover:translate-x-1 duration-300 block">Email Profissional</Link></li>
                <li><Link href="/loja-online" className="hover:text-primary-300 transition hover:translate-x-1 duration-300 block">Loja Online</Link></li>
                <li><Link href="/inteligencia-artificial" className="hover:text-primary-300 transition hover:translate-x-1 duration-300 block">Inteligência Artificial</Link></li>
                <li><Link href="/pagamentos-online" className="hover:text-primary-300 transition hover:translate-x-1 duration-300 block">Pagamentos Online</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 sm:mb-4 uppercase tracking-wider text-[10px] sm:text-xs">{t('footer.support_title')}</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-slate-400 text-[10px] sm:text-sm">
                <li className="transition flex items-center space-x-1.5 font-bold text-slate-200">
                  <a
                    href="https://wa.me/258848335618?text=Olá%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20WEHOSTHERE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 hover:text-emerald-400 transition group"
                  >
                    <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                    <span>+258 84 833 5618</span>
                  </a>
                </li>
                <li className="transition flex items-center space-x-1.5 font-bold text-slate-200">
                  <a
                    href="https://wa.me/258848335618?text=Olá%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20WEHOSTHERE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 hover:text-emerald-400 transition group"
                  >
                    <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                    <span>+258 84 833 5618</span>
                  </a>
                </li>
                <li className="hover:text-primary-300 transition">
                  <a href="mailto:info@wehosthere.com" className="flex items-center space-x-1.5 text-primary-300 hover:text-primary-200 font-semibold group">
                    <span>info@wehosthere.com</span>
                  </a>
                </li>
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 duration-300">{t('footer.help_center')}</li>
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 duration-300">{t('footer.tutorials')}</li>
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 duration-300">{t('footer.status')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 sm:mb-4 uppercase tracking-wider text-[10px] sm:text-xs">{t('newsletter.title')}</h4>
              <p className="text-slate-400 text-[10px] sm:text-xs mb-3 sm:mb-4">
                {t('newsletter.desc')}
              </p>
              <NewsletterForm />
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 sm:mb-4 uppercase tracking-wider text-[10px] sm:text-xs">{t('footer.legal_title')}</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-slate-400 text-[10px] sm:text-sm">
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 duration-300">
                  <Link href="/terms" className="hover:text-primary-300">{t('footer.terms')}</Link>
                </li>
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 duration-300">
                  <Link href="/privacy" className="hover:text-primary-300">{t('footer.privacy')}</Link>
                </li>
                <li className="hover:text-primary-300 transition cursor-pointer hover:translate-x-1 duration-300">{t('footer.sla')}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800/80 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-slate-400 text-[10px] sm:text-xs font-medium">
            <p className="hover:text-slate-300 transition-colors cursor-default">&copy; {new Date().getFullYear()} {t('footer.copyright')}</p>
          </div>
        </div>
      </footer>

      {/* Virtual Assistant */}
      <VirtualAssistant />

      {/* Newsletter Popup */}
      <NewsletterPopup />
    </div>
  );
}

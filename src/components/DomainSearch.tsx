'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle2, XCircle, Globe, ArrowRight, Sparkles, Loader2, Rocket, Flame, WifiOff, Wifi, AlertTriangle, X, ShoppingCart, ChevronDown } from 'lucide-react';
import { DOMAIN_PRICES, checkDomainRealAsync, DomainCheckResult } from '@/lib/domains';
import { hostingPlans } from '@/lib/data';
import { soundEffects } from '@/lib/soundEffects';
import { useLanguage } from '@/context/LanguageContext';

// Timeout de conexão lenta em ms
const SLOW_CONNECTION_TIMEOUT = 8000;

interface DomainSearchProps {
  onFocusChange?: (isFocused: boolean) => void;
}

export default function DomainSearch({ onFocusChange }: DomainSearchProps = {}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState('.co.mz');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<DomainCheckResult | null>(null);
  const [showFullOptions, setShowFullOptions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedHostingPlan, setSelectedHostingPlan] = useState<'basic' | 'pro' | 'enterprise'>('basic');
  const [hostingCycle, setHostingCycle] = useState<'annual' | 'monthly'>('monthly');

  // Estados de conexão
  const [isOffline, setIsOffline] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const slowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Efeito dinâmico de digitação no placeholder e alternância automática de cartões
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
  const [isTypingActive, setIsTypingActive] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    // Se o utilizador já interagiu, começou a escrever ou tem foco no campo, desativa a animação
    if (hasUserInteracted || isFocused || query) {
      setIsTypingActive(false);
      setAnimatedPlaceholder('');
      return;
    }

    const demoItems = [
      { name: 'suaempresa', tld: '.co.mz' },
      { name: 'suaempresa', tld: '.com' },
      { name: 'minhaempresa', tld: '.org.mz' },
      { name: 'startup', tld: '.net' },
    ];

    let itemIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout | null = null;

    // Iniciar logo no primeiro instante (350ms para estabilidade de hidratação)
    const startTimeout = setTimeout(() => {
      setIsTypingActive(true);

      const typeLoop = () => {
        const currentItem = demoItems[itemIndex];
        // Sincroniza o cartão e o select automaticamente
        setSelectedTld(currentItem.tld);

        if (!isDeleting) {
          // Digitando caractere a caractere
          charIndex++;
          setAnimatedPlaceholder(currentItem.name.slice(0, charIndex));

          if (charIndex === currentItem.name.length) {
            // Palavra completa: pausa para leitura confortável
            isDeleting = true;
            timeoutId = setTimeout(typeLoop, 2400);
            return;
          }
          // Velocidade de digitação natural (~90ms)
          timeoutId = setTimeout(typeLoop, 90);
        } else {
          // Apagando caractere a caractere
          charIndex--;
          setAnimatedPlaceholder(currentItem.name.slice(0, charIndex));

          if (charIndex === 0) {
            // Palavra completamente apagada: passa para o próximo item
            isDeleting = false;
            itemIndex = (itemIndex + 1) % demoItems.length;
            timeoutId = setTimeout(typeLoop, 450);
            return;
          }
          // Velocidade de apagar rápida (~35ms)
          timeoutId = setTimeout(typeLoop, 35);
        }
      };

      typeLoop();
    }, 350);

    return () => {
      clearTimeout(startTimeout);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hasUserInteracted, isFocused, query]);

  // Notificar o componente pai (page.tsx) para manter o banner expandido e o mascote fora
  // enquanto houver foco, pesquisa em andamento ou resultado de pesquisa ativo
  useEffect(() => {
    const isExpanded = isFocused || isSearching || !!result;
    onFocusChange?.(isExpanded);
  }, [isFocused, isSearching, result, onFocusChange]);

  const handleContainerFocus = () => {
    setIsFocused(true);
    setHasUserInteracted(true);
  };

  const handleContainerBlur = (e: React.FocusEvent) => {
    if (searchContainerRef.current && searchContainerRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsFocused(false);
  };

  const handleClearSearch = () => {
    soundEffects.playClickSound();
    setQuery('');
    setResult(null);
    setShowFullOptions(false);
    setIsSearching(false);
    setIsFocused(false);
    setShowSuggestions(false);
    setNetworkError(null);
    if (document.activeElement instanceof HTMLElement && searchContainerRef.current?.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  };

  // Detectar mudanças de estado de rede em tempo real
  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setIsSlowConnection(false);
    };
    const handleOnline = () => {
      setIsOffline(false);
      setIsSlowConnection(false);
      setNetworkError(null);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    // Verificar estado inicial
    if (!navigator.onLine) setIsOffline(true);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const currentHostingPlan = hostingPlans.find(p => p.id === selectedHostingPlan) || hostingPlans[0];
  const hostingPrice = hostingCycle === 'annual' ? currentHostingPlan.priceAnnual : currentHostingPlan.price;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    soundEffects.playClickSound();

    // Verificar conexão antes de pesquisar
    if (!navigator.onLine) {
      soundEffects.playErrorSound();
      setIsOffline(true);
      setNetworkError('Sem ligação à internet. Verifique a sua conexão e tente novamente.');
      return;
    }

    setIsOffline(false);
    setIsSlowConnection(false);
    setNetworkError(null);
    setIsSearching(true);
    setShowSuggestions(false);
    setShowFullOptions(false);
    setResult(null);

    let fullQuery = query.trim();
    if (!fullQuery.includes('.')) {
      fullQuery = fullQuery + selectedTld;
    }

    // Iniciar temporizador de conexão lenta
    slowTimeoutRef.current = setTimeout(() => {
      setIsSlowConnection(true);
    }, SLOW_CONNECTION_TIMEOUT);

    try {
      console.log(`[DomainSearch] Iniciando pesquisa: ${fullQuery}`);
      const searchResult = await checkDomainRealAsync(fullQuery);
      console.log(`[DomainSearch] Resultado:`, searchResult);
      setResult(searchResult);
      // 📊 Evento GTM / GA4 - pesquisa de domínio
      if (typeof window !== 'undefined' && Array.isArray((window as any).dataLayer)) {
        (window as any).dataLayer.push({
          event: 'domain_search',
          domain_name: fullQuery,
          domain_available: searchResult?.isAvailable ?? null,
        });
      }
      if (searchResult?.isAvailable) {
        soundEffects.playSuccessSound();
      } else {
        soundEffects.playErrorSound();
      }
      setIsSlowConnection(false);
      setNetworkError(null);
    } catch (err: any) {
      soundEffects.playErrorSound();
      console.error('Erro na busca de domínio:', err);
      // Distinguir erro de rede de outros erros
      if (!navigator.onLine) {
        setIsOffline(true);
        setNetworkError('Ligação perdida durante a pesquisa. Verifique o Wi-Fi ou dados móveis.');
      } else if (err?.name === 'AbortError' || err?.message?.includes('timeout')) {
        setNetworkError('A pesquisa demorou demasiado. A sua conexão pode estar lenta.');
      } else {
        setNetworkError('Erro ao verificar o domínio. Tente novamente.');
      }
    } finally {
      if (slowTimeoutRef.current) clearTimeout(slowTimeoutRef.current);
      setIsSlowConnection(false);
      setIsSearching(false);
    }
  };

  const handleRegisterOnly = (domain: string, price: number) => {
    soundEffects.playDomainRegisteredSound();
    // 📊 Evento GTM - início de checkout
    if (typeof window !== 'undefined' && Array.isArray((window as any).dataLayer)) {
      (window as any).dataLayer.push({
        event: 'begin_checkout',
        domain_name: domain,
        value: price,
        currency: 'MZN',
        checkout_type: 'domain_only',
      });
    }
    router.push(`/checkout?plan=none&domain=${encodeURIComponent(domain)}&domainPrice=${price}`);
  };

  const handleRegisterWithHosting = (domain: string, price: number, planId: string = selectedHostingPlan, cycle: string = hostingCycle) => {
    soundEffects.playDomainRegisteredSound();
    // 📊 Evento GTM - início de checkout com hospedagem
    if (typeof window !== 'undefined' && Array.isArray((window as any).dataLayer)) {
      (window as any).dataLayer.push({
        event: 'begin_checkout',
        domain_name: domain,
        value: price,
        currency: 'MZN',
        checkout_type: 'domain_with_hosting',
        hosting_plan: planId,
      });
    }
    router.push(`/checkout?plan=${planId}&billingCycle=${cycle}&domain=${encodeURIComponent(domain)}&domainPrice=${price}`);
  };

  const handleRegisterWithWebsite = (domain: string, price: number) => {
    soundEffects.playDomainRegisteredSound();
    router.push(`/site-quote?domain=${encodeURIComponent(domain)}&domainPrice=${price}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 sm:mb-12">

      {/* Banner de Estado de Rede */}
      {isOffline && (
        <div className="flex items-center space-x-2 sm:space-x-3 bg-red-900/80 backdrop-blur border border-red-500/60 text-red-100 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 shadow-lg animate-pulse">
          <WifiOff className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 shrink-0" />
          <div className="text-left">
            <p className="text-xs sm:text-sm font-bold">{t('domain.offline_title')}</p>
            <p className="text-[10px] sm:text-xs text-red-300">{networkError || t('domain.offline_desc')}</p>
          </div>
        </div>
      )}

      {isSlowConnection && !isOffline && (
        <div className="flex items-center space-x-2 sm:space-x-3 bg-amber-900/80 backdrop-blur border border-amber-500/60 text-amber-100 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 shadow-lg">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 shrink-0" />
          <div className="text-left">
            <p className="text-xs sm:text-sm font-bold">{t('domain.slow_conn')}</p>
          </div>
        </div>
      )}

      {/* Box de Pesquisa Principal */}
      <div 
        ref={searchContainerRef}
        onFocus={handleContainerFocus}
        onBlur={handleContainerBlur}
        className="bg-white p-2.5 sm:p-3 md:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/80 w-full overflow-hidden"
      >
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full">
          
          {/* Input do nome de domínio */}
          <div className="relative flex-1 w-full min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setHasUserInteracted(true);
                setQuery(val);
                if (!val.trim() && result) {
                  setResult(null);
                }
              }}
              onFocus={handleContainerFocus}
              placeholder={
                isTypingActive
                  ? (animatedPlaceholder || ' ')
                  : t('hero.search_placeholder')
              }
              className="w-full pl-9 sm:pl-10 pr-8 sm:pr-9 py-2.5 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 font-medium text-gray-900 text-xs sm:text-sm md:text-base placeholder-gray-400"
              required
            />
            {(query || result) && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 sm:right-2.5 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 rounded-full transition cursor-pointer"
                title="Limpar pesquisa"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Seletor de Extensão TLD + Botão Pesquisar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
            <select
              value={selectedTld}
              onChange={(e) => {
                setSelectedTld(e.target.value);
                setHasUserInteracted(true);
              }}
              className="w-full sm:w-auto px-2.5 sm:px-3.5 py-2.5 sm:py-3.5 bg-gray-100 border border-gray-200 rounded-xl sm:rounded-2xl font-bold text-gray-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-center sm:text-left shrink-0"
            >
              {DOMAIN_PRICES.map((tld) => (
                <option key={tld.extension} value={tld.extension}>
                  {tld.extension} ({tld.price.toLocaleString('pt-MZ')} MT)
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition text-xs sm:text-sm md:text-base flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer shrink-0"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span>{t('hero.searching')}</span>
                </>
              ) : (
                <>
                  <span>{t('hero.search_btn')}</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Tabela/Badges de Preços de Domínio */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-gray-100">
          {DOMAIN_PRICES.map((tld) => (
            <button
              key={tld.extension}
              type="button"
              onClick={() => {
                soundEffects.playClickSound();
                setHasUserInteracted(true);
                setSelectedTld(tld.extension);
                if (query.trim()) {
                  let cleaned = query.trim();
                  if (cleaned.includes('.')) {
                    cleaned = cleaned.split('.')[0];
                  }
                  setQuery(cleaned + tld.extension);
                }
              }}
              className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl border text-center transition-all duration-300 flex flex-col items-center justify-center cursor-pointer ${
                selectedTld === tld.extension
                  ? 'bg-primary-50 border-primary-400 ring-2 ring-primary-500/30 shadow-md scale-[1.03]'
                  : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span className={`text-[10px] sm:text-xs font-bold transition-colors ${
                selectedTld === tld.extension ? 'text-primary-800 font-extrabold' : 'text-gray-900'
              }`}>
                {tld.extension}
              </span>
              <span className="text-[10px] sm:text-xs font-extrabold text-primary-600 mt-0.5">
                {tld.price.toLocaleString('pt-MZ')} MT<span className="text-[9px] sm:text-[10px] font-normal text-gray-500">/ano</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Card de Resultado da Pesquisa */}
      {result && (
        <div className="mt-4 sm:mt-6 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-xl border border-gray-200 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Cabeçalho do Domínio Consultado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-gray-50 to-blue-50/40 border border-gray-200 text-left">
            <div className="flex items-center space-x-2.5 sm:space-x-3 text-left min-w-0">
              {result.isAvailable ? (
                <div className="p-2 sm:p-2.5 bg-emerald-500 text-white rounded-lg sm:rounded-xl flex-shrink-0 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              ) : (
                <div className="p-2 sm:p-2.5 bg-red-500 text-white rounded-lg sm:rounded-xl flex-shrink-0 shadow-sm">
                  <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              )}

              <div className="text-left min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-1 sm:gap-1.5 text-left">
                  <span className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight break-all sm:break-normal">
                    {result.fullDomain}
                  </span>
                  {result.isAvailable ? (
                    <span className="inline-flex items-center bg-emerald-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap shrink-0">
                      {t('domain.available')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap shrink-0">
                      {t('domain.unavailable')}
                    </span>
                  )}
                  {result.searchCount && result.searchCount > 1 && (
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] sm:text-xs font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full shadow-xs flex items-center space-x-0.5 sm:space-x-1 animate-pulse whitespace-nowrap shrink-0">
                      <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-white" />
                      <span>{result.searchCount}x buscas</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 font-medium text-left block">
                  {result.isAvailable 
                    ? t('domain.available_desc')
                    : t('domain.unavailable_desc')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 justify-between sm:justify-end shrink-0 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-200/60">
              {result.isAvailable && (
                <>
                  <div className="h-11 bg-white px-3 sm:px-4 rounded-xl border border-gray-200 shadow-xs flex flex-col items-start sm:items-end justify-center shrink-0">
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">{t('domain.pkg_domain_only')}</span>
                    <span className="text-sm sm:text-base font-black text-primary-600 leading-none">
                      {result.price.toLocaleString('pt-MZ')} MT <span className="text-[10px] text-gray-500 font-normal">{t('pricing.per_year')}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRegisterOnly(result.fullDomain, result.price)}
                    className="h-11 flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 sm:px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg hover:shadow-emerald-600/20 transition-all duration-200 cursor-pointer hover:scale-[1.02] shrink-0"
                    title="Comprar e registar este domínio agora"
                  >
                    <ShoppingCart className="h-4 w-4 shrink-0" />
                    <span>{t('domain.btn_buy_now')}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleClearSearch}
                className="h-11 inline-flex items-center justify-center space-x-1.5 px-3 sm:px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-xs sm:text-sm font-semibold transition cursor-pointer border border-gray-200 shadow-xs shrink-0"
                title="Limpar pesquisa e fechar resultados"
              >
                <X className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            </div>
          </div>

          {/* Botão de Expansão/Colapso para manter a tela limpa */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClickSound();
                setShowFullOptions(prev => !prev);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold text-gray-700 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-800 border border-gray-200/90 hover:border-emerald-300 shadow-xs transition-all duration-200 cursor-pointer group select-none hover:shadow-sm"
              aria-expanded={showFullOptions}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>
                {showFullOptions 
                  ? 'Ocultar opções e alternativas' 
                  : (result.isAvailable 
                      ? 'Ver pacotes com hospedagem, criação de site & outras extensões' 
                      : 'Ver sugestões e outras extensões disponíveis')}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-emerald-700 transition-transform duration-300 ${showFullOptions ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Conteúdo Expansível (Opções de Contratação, Sugestões IA e Alternativas) */}
          {showFullOptions && (
            <div className="mt-4 sm:mt-5 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300 space-y-4 sm:space-y-6">
              {/* Opções de Contratação com Preços Transparentes */}
              {result.isAvailable && (
            <div className="mt-4 sm:mt-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3.5">
                {/* Opção 1: Apenas Domínio */}
                <div className="flex flex-col justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-gray-200 hover:border-primary-400 bg-white transition shadow-sm group">
                  <div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 text-gray-700 mb-1.5 sm:mb-2">
                      <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 group-hover:text-primary-600 transition" />
                      <span className="font-bold text-xs sm:text-sm text-gray-900">{t('domain.pkg_domain_only')}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-3 sm:mb-4 leading-relaxed">
                      <strong className="text-gray-800">{result.fullDomain}</strong>
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between pt-2 sm:pt-3 border-t border-gray-100 mb-2 sm:mb-3">
                      <span className="text-[10px] sm:text-xs text-gray-400 font-medium">Total:</span>
                      <span className="text-base sm:text-lg font-extrabold text-gray-900">
                        {result.price.toLocaleString('pt-MZ')} MT <span className="text-[10px] sm:text-xs font-normal text-gray-500">{t('pricing.per_year')}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRegisterOnly(result.fullDomain, result.price)}
                      className="w-full py-2 sm:py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] sm:text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md transition flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer hover:scale-[1.01]"
                    >
                      <span>{t('domain.btn_register')} ({result.price.toLocaleString('pt-MZ')} MT)</span>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>

                {/* Opção 2: Domínio + Hospedagem */}
                <div className="flex flex-col justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-emerald-500 bg-emerald-50/30 transition shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-3 py-0.5 rounded-bl-lg sm:rounded-bl-xl tracking-wider">
                    {t('pricing.most_popular')}
                  </div>

                  <div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 text-emerald-800 mb-1.5 sm:mb-2">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                      <span className="font-bold text-xs sm:text-sm text-emerald-950">{t('domain.pkg_with_hosting')}</span>
                    </div>

                    {/* Seletor de Plano de Hospedagem */}
                    <div className="mb-2 sm:mb-3 space-y-1.5 sm:space-y-2">
                      <div>
                        <select
                          value={selectedHostingPlan}
                          onChange={(e) => setSelectedHostingPlan(e.target.value as 'basic' | 'pro' | 'enterprise')}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-emerald-300 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                        >
                          <option value="basic">{t('pricing.basic_name')} ({hostingCycle === 'annual' ? '5.500 MT/ano' : '550 MT/mês'})</option>
                          <option value="pro">{t('pricing.pro_name')} ({hostingCycle === 'annual' ? '25.000 MT/ano' : '2.500 MT/mês'})</option>
                          <option value="enterprise">{t('pricing.enterprise_name')} ({hostingCycle === 'annual' ? '62.000 MT/ano' : '6.200 MT/mês'})</option>
                        </select>
                      </div>

                      {/* Alternador Mensal / Anual */}
                      <div className="flex bg-emerald-100/70 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-emerald-200 text-[10px] sm:text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playClickSound();
                            setHostingCycle('annual');
                          }}
                          className={`flex-1 py-0.5 sm:py-1 px-1.5 sm:px-2 rounded-md sm:rounded-lg font-bold transition text-[10px] sm:text-[11px] cursor-pointer ${
                            hostingCycle === 'annual'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-emerald-900 hover:bg-emerald-200/60'
                          }`}
                        >
                          {t('pricing.1year')} ({t('pricing.2months_free')})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playClickSound();
                            setHostingCycle('monthly');
                          }}
                          className={`flex-1 py-0.5 sm:py-1 px-1.5 sm:px-2 rounded-md sm:rounded-lg font-bold transition text-[10px] sm:text-[11px] cursor-pointer ${
                            hostingCycle === 'monthly'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-emerald-900 hover:bg-emerald-200/60'
                          }`}
                        >
                          {t('pricing.1month')}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between pt-2 sm:pt-3 border-t border-emerald-200/60 mb-2 sm:mb-3">
                      <span className="text-[10px] sm:text-xs text-emerald-800 font-medium">Total:</span>
                      <div className="text-right">
                        <span className="text-base sm:text-lg font-black text-emerald-700">
                          {(result.price + hostingPrice).toLocaleString('pt-MZ')} MT <span className="text-[10px] sm:text-xs font-normal text-gray-600">{hostingCycle === 'annual' ? t('pricing.per_year') : t('pricing.per_month')}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRegisterWithHosting(result.fullDomain, result.price, selectedHostingPlan, hostingCycle)}
                      className="w-full py-2.5 sm:py-3.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] sm:text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer hover:scale-[1.02]"
                    >
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span>{t('domain.btn_register')} ({(result.price + hostingPrice).toLocaleString('pt-MZ')} MT)</span>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Opção 3: Domínio + Criação de Site (Investimento Único) */}
                <div className="flex flex-col justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-primary-500 bg-primary-50/30 transition shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-primary-600 text-white text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-3 py-0.5 rounded-bl-lg sm:rounded-bl-xl tracking-wider">
                    {t('sites.investment_title')}
                  </div>

                  <div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 text-primary-900 mb-1.5 sm:mb-2">
                      <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                      <span className="font-bold text-xs sm:text-sm text-primary-950">{t('domain.pkg_with_site')}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                      {t('sites.desc')}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between pt-2 sm:pt-3 border-t border-primary-200/60 mb-2 sm:mb-3">
                      <span className="text-[10px] sm:text-xs text-primary-800 font-medium">Total:</span>
                      <div className="text-right">
                        <span className="text-base sm:text-lg font-black text-primary-700">
                          {(result.price + 25000).toLocaleString('pt-MZ')} MT
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRegisterWithWebsite(result.fullDomain, result.price)}
                      className="w-full py-2 sm:py-3 px-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-extrabold text-[10px] sm:text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md transition flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer hover:scale-[1.01]"
                    >
                      <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300 shrink-0" />
                      <span>{t('domain.btn_register')} &amp; {t('sites.title')}</span>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sugestões Inteligentes de Nomes Alternativos (Gerador IA) */}
          {result.smartSuggestions && result.smartSuggestions.length > 0 && (
            <div className="mt-4 sm:mt-6 border border-purple-200/80 bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-blue-50/30 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClickSound();
                  setShowSuggestions(prev => !prev);
                }}
                className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-purple-100/40 transition cursor-pointer select-none group"
                aria-expanded={showSuggestions}
              >
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-200">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <h4 className="text-xs sm:text-sm font-extrabold text-purple-950">
                        {t('domain.smart_suggestions')}
                      </h4>
                      <span className="text-[10px] bg-purple-200/90 text-purple-900 font-extrabold px-2 py-0.5 rounded-full shrink-0">
                        {result.smartSuggestions.length} opções • {t('domain.all_available')}
                      </span>
                    </div>
                    {!showSuggestions && (
                      <p className="text-[11px] text-purple-700/80 font-medium truncate mt-0.5">
                        Clique para ver alternativas criativas para <strong>{result.sld}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 ml-2 text-purple-700 font-bold text-xs bg-white/80 hover:bg-white px-2.5 py-1.5 rounded-xl border border-purple-200 shadow-xs transition">
                  <span>{showSuggestions ? 'Ocultar' : 'Ver sugestões'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showSuggestions ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {showSuggestions && (
                <div className="px-3 sm:px-5 pb-3.5 sm:pb-5 pt-1 border-t border-purple-200/60">
                  <p className="text-[10px] sm:text-xs text-purple-800 mb-3 pt-2">
                    {t('domain.suggestions_desc')} <strong>{result.sld}</strong>:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                    {result.smartSuggestions.map((sug) => (
                      <div
                        key={sug.fullDomain}
                        className="p-3 bg-white rounded-xl border border-purple-200/90 shadow-sm hover:shadow-md hover:border-purple-400 transition flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                              {sug.badge}
                            </span>
                            <span className="text-xs font-black text-emerald-600">
                              {sug.price.toLocaleString('pt-MZ')} MT
                            </span>
                          </div>
                          <span className="font-extrabold text-gray-900 text-xs sm:text-sm block group-hover:text-purple-700 transition-colors">
                            {sug.fullDomain}
                          </span>
                          <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{sug.reason}</p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRegisterOnly(sug.fullDomain, sug.price)}
                            className="flex-1 py-1.5 px-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] sm:text-xs rounded-lg transition shadow-xs flex items-center justify-center space-x-1 cursor-pointer active:scale-95"
                          >
                            <span>{t('domain.btn_register_this')}</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRegisterWithWebsite(sug.fullDomain, sug.price)}
                            className="py-1.5 px-2 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-[10px] rounded-lg transition cursor-pointer"
                            title="Registrar com Criação de Site"
                          >
                            + Site
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Alternativas de Extensões */}
          {result.alternatives.length > 0 && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-100">
              <h4 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">
                {t('domain.other_extensions')} {result.sld}:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {result.alternatives.map((alt) => (
                  <div 
                    key={alt.extension} 
                    className="p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border border-gray-200 bg-white hover:border-primary-300 transition flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-gray-900 text-xs sm:text-sm block">{alt.fullDomain}</span>
                      <span className="text-[10px] sm:text-xs text-primary-600 font-extrabold">{alt.price.toLocaleString('pt-MZ')} MT{t('pricing.per_year')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRegisterOnly(alt.fullDomain, alt.price)}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white rounded-lg text-[10px] sm:text-xs font-bold transition cursor-pointer"
                    >
                      {t('domain.btn_register')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { MousePointerClick, FileText, CheckCircle2, Rocket, ArrowRight, Play, Pause } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface StepConfig {
  id: number;
  step: string;
  titleKey: string;
  descKey: string;
  detailKey: string;
  icon: any;
  color: {
    text: string;
    bg: string;
    ring: string;
    shadow: string;
    gradient: string;
    lightBg: string;
  };
}

const stepsConfig: StepConfig[] = [
  {
    id: 1,
    step: '1',
    titleKey: 'steps.step1_title',
    descKey: 'steps.step1_desc',
    detailKey: 'steps.step1_detail',
    icon: MousePointerClick,
    color: {
      text: 'text-blue-600',
      bg: 'bg-blue-600',
      ring: 'ring-blue-400',
      shadow: 'shadow-blue-500/40',
      gradient: 'from-blue-500 to-cyan-500',
      lightBg: 'bg-blue-50 border-blue-200'
    }
  },
  {
    id: 2,
    step: '2',
    titleKey: 'steps.step2_title',
    descKey: 'steps.step2_desc',
    detailKey: 'steps.step2_detail',
    icon: FileText,
    color: {
      text: 'text-emerald-600',
      bg: 'bg-emerald-600',
      ring: 'ring-emerald-400',
      shadow: 'shadow-emerald-500/40',
      gradient: 'from-emerald-500 to-teal-500',
      lightBg: 'bg-emerald-50 border-emerald-200'
    }
  },
  {
    id: 3,
    step: '3',
    titleKey: 'steps.step3_title',
    descKey: 'steps.step3_desc',
    detailKey: 'steps.step3_detail',
    icon: CheckCircle2,
    color: {
      text: 'text-amber-600',
      bg: 'bg-amber-500',
      ring: 'ring-amber-400',
      shadow: 'shadow-amber-500/40',
      gradient: 'from-amber-500 to-orange-500',
      lightBg: 'bg-amber-50 border-amber-200'
    }
  },
  {
    id: 4,
    step: '4',
    titleKey: 'steps.step4_title',
    descKey: 'steps.step4_desc',
    detailKey: 'steps.step4_detail',
    icon: Rocket,
    color: {
      text: 'text-purple-600',
      bg: 'bg-purple-600',
      ring: 'ring-purple-400',
      shadow: 'shadow-purple-500/40',
      gradient: 'from-purple-500 to-indigo-500',
      lightBg: 'bg-purple-50 border-purple-200'
    }
  }
];

export default function InteractiveSteps() {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setActiveStep((prev) => (prev % 4) + 1);
      }, 3000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const currentStepObj = stepsConfig.find((s) => s.id === activeStep) || stepsConfig[0];
  const IconComponent = currentStepObj.icon;

  // Percentual para a barra de progresso horizontal
  const progressPercent = ((activeStep - 1) / 3) * 100;

  return (
    <div
      className="relative w-full max-w-4xl mx-auto py-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Cabeçalho Responsivo: Título, Badge e Botão de Auto-Play */}
      <div className="flex flex-col gap-2 mb-4 sm:mb-6">
        {/* Linha Principal: Título + Botão de Controle */}
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold sm:font-extrabold text-gray-900 tracking-tight leading-snug">
            {t('steps.title_section')}
          </h3>

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full transition-all shrink-0 cursor-pointer border ${
              !isPaused
                ? 'bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-100 shadow-sm'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
            title={isPaused ? t('steps.play') : t('steps.pause')}
          >
            {!isPaused ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-600"></span>
                </span>
                <Pause className="w-3 h-3 text-purple-700" />
                <span className="hidden sm:inline">{t('steps.pause')}</span>
                <span className="sm:hidden">Auto</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-gray-600 fill-gray-600" />
                <span className="hidden sm:inline">{t('steps.play')}</span>
                <span className="sm:hidden">Pausado</span>
              </>
            )}
          </button>
        </div>

        {/* Subtítulo / Badge de Processo Rápido */}
        <div className="flex items-center">
          <span className="inline-flex items-center text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 sm:bg-purple-100 text-purple-700 border border-purple-200/60 sm:border-transparent">
            {t('steps.subtitle_section')}
          </span>
        </div>
      </div>

      {/* Container dos Passos */}
      <div className="relative">
        {/* Linha de Conexão no Fundo (apenas desktop/tablet) */}
        <div className="hidden sm:block absolute top-7 left-12 right-12 h-1.5 bg-gray-200 rounded-full z-0 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 via-amber-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 4 Círculos dos Passos */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 relative z-10">
          {stepsConfig.map((item) => {
            const isActive = activeStep === item.id;
            const isCompleted = item.id < activeStep;
            const ItemIcon = item.icon;

            return (
              <div
                key={item.id}
                onClick={() => {
                  setActiveStep(item.id);
                  setIsPaused(true);
                }}
                className="flex flex-col items-center text-center cursor-pointer group select-none"
              >
                {/* Círculo com Número e Animação */}
                <div className="relative mb-2 sm:mb-3">
                  <div
                    className={`w-11 h-11 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-extrabold text-base sm:text-2xl transition-all duration-500 ease-out ${
                      isActive
                        ? `bg-gradient-to-br ${item.color.gradient} text-white scale-110 sm:scale-125 shadow-xl ${item.color.shadow} ring-4 ${item.color.ring} ring-offset-2`
                        : isCompleted
                        ? `${item.color.bg} text-white scale-100 shadow-md`
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:scale-105'
                    }`}
                  >
                    {item.step}
                  </div>

                  {/* Ícone flutuante em miniatura quando ativo */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 bg-white text-gray-900 p-1 rounded-full shadow border border-gray-100 animate-bounce">
                      <ItemIcon className={`w-3.5 h-3.5 ${item.color.text}`} />
                    </div>
                  )}
                </div>

                {/* Título & Descrição */}
                <h4
                  className={`text-xs sm:text-base font-bold transition-colors duration-300 ${
                    isActive ? item.color.text : 'text-gray-800 group-hover:text-gray-900'
                  }`}
                >
                  {t(item.titleKey)}
                </h4>
                <p className="text-[10px] sm:text-xs text-gray-500 max-w-[120px] hidden sm:block mt-0.5 line-clamp-2">
                  {t(item.descKey)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card de Destaque Dinâmico com Detalhes do Passo Ativo */}
      <div className="mt-6 sm:mt-8">
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-500 ease-in-out shadow-md ${currentStepObj.color.lightBg}`}
        >
          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl bg-gradient-to-br ${currentStepObj.color.gradient} text-white shadow-md flex-shrink-0`}
              >
                <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-500">
                  {t('steps.step_badge')} {currentStepObj.step} de 4
                </span>
                <h5 className={`text-sm sm:text-base font-bold ${currentStepObj.color.text}`}>
                  {t(currentStepObj.titleKey)} - {t(currentStepObj.descKey)}
                </h5>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                  {t(currentStepObj.detailKey)}
                </p>
              </div>
            </div>

            {/* Navegação Manual com Botões */}
            <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
              {stepsConfig.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveStep(s.id);
                    setIsPaused(true);
                  }}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeStep === s.id
                      ? `w-7 bg-gradient-to-r ${s.color.gradient}`
                      : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir para o passo ${s.id}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

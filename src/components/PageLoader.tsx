'use client';

import BrandLogo from './BrandLogo';

interface PageLoaderProps {
  text?: string;
  message?: string;
}

export default function PageLoader({ text, message }: PageLoaderProps) {
  const labelText = message || text || 'A carregar os seus dados...';
  try {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4 sm:space-y-6 animate-in fade-in zoom-in-95 duration-300">

          {/* Logo no Centro em Fundo Branco com Aura de Processamento */}
          <div className="relative flex items-center justify-center p-3 sm:p-4 bg-white rounded-2xl sm:rounded-3xl shadow-md border border-gray-100">
            <div className="absolute inset-0 bg-primary-500/10 rounded-2xl sm:rounded-3xl animate-ping opacity-30 pointer-events-none" />
            <BrandLogo href="" logoHeightClass="h-8 sm:h-10 md:h-12" showIcon={false} />
          </div>

          {/* Indicador de Processamento Animado */}
          <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 border border-gray-200/80 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-xs">
            <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 border-2 border-primary-600 border-t-transparent shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold text-gray-700 tracking-tight">{labelText}</span>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error('Erro no PageLoader:', err);
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-600">{labelText}</p>
      </div>
    );
  }
}

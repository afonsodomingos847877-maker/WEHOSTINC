'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function NewsletterPopup() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAffiliatePromoOpen, setIsAffiliatePromoOpen] = useState(false);

  // Nunca exibir a Newsletter quando a barra promocional principal estiver visível
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.body.hasAttribute('data-affiliate-promo-open')) {
      setIsAffiliatePromoOpen(true);
    }
    const handleAffiliatePromoState = (e: Event) => {
      const open = !!(e as CustomEvent<{ open: boolean }>).detail?.open;
      setIsAffiliatePromoOpen(open);
    };
    window.addEventListener('wehost:affiliate-promo-state', handleAffiliatePromoState);
    return () => {
      window.removeEventListener('wehost:affiliate-promo-state', handleAffiliatePromoState);
    };
  }, []);

  useEffect(() => {
    // Verificar se o usuário já fechou o popup anteriormente
    const dismissed = localStorage.getItem('newsletter_popup_dismissed');
    if (dismissed) return;

    // Mostrar popup após 10 segundos
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('newsletter_popup_dismissed', 'true');
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage('Por favor, insira um email válido.');
      setStatus('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setStatus('idle');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'popup' })
      });

      const data = await response.json();

      if (response.ok || data.success) {
        setMessage(data.message || 'Subscrito com sucesso!');
        setStatus('success');
        setEmail('');
        setTimeout(() => {
          setIsVisible(false);
          localStorage.setItem('newsletter_popup_dismissed', 'true');
        }, 2000);
      } else {
        setMessage(data.error || 'Erro ao subscrever. Tente novamente.');
        setStatus('error');
      }
    } catch (err) {
      setMessage('Erro ao conectar. Tente novamente.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible || isSubscribed || isAffiliatePromoOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
        {/* Primeira linha: Texto e botão de fechar */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Texto de incentivo */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-gray-900 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-full flex-shrink-0">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs sm:text-sm sm:text-base truncate">
                📰 {t('newsletter.title')}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-600 hidden sm:block">
                {t('newsletter.desc')}
              </p>
            </div>
          </div>

          {/* Botão de fechar */}
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0 cursor-pointer"
            title={t('common.close')}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Formulário de subscrição - layout responsivo */}
        {status !== 'success' && (
          <div className="mt-3 sm:mt-4">
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('newsletter.placeholder')}
                className="w-full px-3 sm:px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-xs sm:text-sm"
                disabled={loading}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 sm:space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    <span className="hidden sm:inline">...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>{t('newsletter.btn_subscribe')}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Mensagem de sucesso */}
        {status === 'success' && (
          <div className="mt-3 sm:mt-4 flex items-center space-x-2 text-emerald-600">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-semibold text-xs sm:text-sm">{t('newsletter.success')}</span>
          </div>
        )}

        {message && status !== 'idle' && (
          <p className={`text-[10px] sm:text-xs mt-2 text-center ${
            status === 'success' ? 'text-emerald-600' : status === 'error' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { X, Mail, MessageCircle, Download, BookOpen, DollarSign, Sparkles, CheckCircle, Loader2, Bell, UserPlus, Share2, Box, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSession } from 'next-auth/react';

interface CardConfig {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText: string;
  actionUrl?: string;
  actionType: 'link' | 'whatsapp' | 'pwa' | 'newsletter' | 'push' | 'signup' | 'social' | 'systems' | 'assistant';
  bgColor: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  buttonText: string;
}

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/profile.php?id=61592497206566&locale=pt_BR',
    color: 'bg-blue-600',
    borderColor: 'border-blue-300',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/company/wehosthere',
    color: 'bg-blue-700',
    borderColor: 'border-blue-300',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700'
  },
  {
    name: 'X (Twitter)',
    url: 'https://x.com/wehosthere',
    color: 'bg-black',
    borderColor: 'border-gray-300',
    iconBg: 'bg-gray-100',
    iconColor: 'text-black'
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/wehosthere',
    color: 'bg-gradient-to-r from-purple-600 to-pink-600',
    borderColor: 'border-pink-300',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600'
  }
];

const WHATSAPP_NUMBERS = [
  { number: '258848335618', display: '+258 84 833 5618' },
  { number: '258848335618', display: '+258 84 833 5618' }
];

export default function ScrollUpCards() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollUpCount, setScrollUpCount] = useState(0);
  const [socialIndex, setSocialIndex] = useState(0);
  const [whatsappIndex, setWhatsappIndex] = useState(0);
  const [isAffiliatePromoOpen, setIsAffiliatePromoOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.body.hasAttribute('data-affiliate-promo-open')) {
      setIsAffiliatePromoOpen(true);
    }

    const handlePromoState = (e: Event) => {
      const open = !!(e as CustomEvent<{ open: boolean }>).detail?.open;
      setIsAffiliatePromoOpen(open);
      if (open) {
        setIsVisible(false);
      }
    };

    window.addEventListener('wehost:affiliate-promo-state', handlePromoState);
    return () => {
      window.removeEventListener('wehost:affiliate-promo-state', handlePromoState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isVisible) {
      document.body.setAttribute('data-scroll-card-open', 'true');
    } else {
      document.body.removeAttribute('data-scroll-card-open');
    }
    window.dispatchEvent(
      new CustomEvent('wehost:scroll-card-state', { detail: { open: isVisible } })
    );
    return () => {
      document.body.removeAttribute('data-scroll-card-open');
      window.dispatchEvent(
        new CustomEvent('wehost:scroll-card-state', { detail: { open: false } })
      );
    };
  }, [isVisible]);
  
  const { isInstallable, promptInstall } = usePWAInstall();
  const { subscription, permission, requestPermission, isSupported } = usePushNotifications();
  const { data: session } = useSession();
  const user = session?.user;

  const CARDS: CardConfig[] = useMemo(() => [
    {
      id: 'signup',
      icon: <UserPlus className="h-5 w-5" />,
      title: 'Crie sua conta grátis',
      description: 'Comece a hospedar seus sites hoje mesmo',
      actionText: 'Criar Conta',
      actionUrl: '/register',
      actionType: 'signup',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-300',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      buttonText: 'Criar Conta'
    },
    {
      id: 'push',
      icon: <Bell className="h-5 w-5" />,
      title: 'Ative as Notificações Push',
      description: 'Receba alertas importantes sobre seus sites e pagamentos',
      actionText: 'Ativar Agora',
      actionType: 'push',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonText: 'Ativar'
    },
    {
      id: 'whatsapp',
      icon: <MessageCircle className="h-5 w-5" />,
      title: 'Precisa de ajuda?',
      description: `Fale com o nosso suporte por WhatsApp (${WHATSAPP_NUMBERS[whatsappIndex].display})`,
      actionText: 'Falar no WhatsApp',
      actionType: 'whatsapp',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonText: 'WhatsApp'
    },
    {
      id: 'pwa',
      icon: (
        <img 
          src="/mascote-transparent.png" 
          alt="WEHOSTHERE App" 
          className="w-5 h-5 object-contain" 
        />
      ),
      title: 'Instale a WEHOSTHERE App',
      description: 'Acesso rápido, notificações e uso offline',
      actionText: 'Instalar Agora',
      actionType: 'pwa',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      buttonText: 'Instalar'
    },
    {
      id: 'social',
      icon: <Share2 className="h-5 w-5" />,
      title: 'Siga-nos nas redes sociais',
      description: `Fique por dentro das novidades e promoções (${SOCIAL_LINKS[socialIndex].name})`,
      actionText: 'Seguir Redes',
      actionType: 'social',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-300',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      buttonText: 'Seguir'
    },
    {
      id: 'systems',
      icon: <Box className="h-5 w-5" />,
      title: 'Sistemas prontos para aluguer',
      description: 'E-commerce, ERP, CRM e muito mais',
      actionText: 'Ver Sistemas',
      actionType: 'systems',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-300',
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
      buttonText: 'Ver Sistemas'
    },
    {
      id: 'assistant',
      icon: <HelpCircle className="h-5 w-5" />,
      title: 'Saiba mais sobre nossos serviços',
      description: 'Converse com nosso assistente virtual',
      actionText: 'Falar com Assistente',
      actionType: 'assistant',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-300',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      buttonText: 'Saiba Mais'
    },
    {
      id: 'blog',
      icon: <BookOpen className="h-5 w-5" />,
      title: 'Novidades no Blog',
      description: 'Artigos sobre hospedagem, SEO e tecnologia',
      actionText: 'Ler Artigos',
      actionUrl: '/blog',
      actionType: 'link',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonText: 'Blog'
    },
    {
      id: 'pricing',
      icon: <DollarSign className="h-5 w-5" />,
      title: 'Sistemas Prontos',
      description: 'Veja os preços dos nossos sistemas para aluguer',
      actionText: 'Ver Preços',
      actionUrl: '/systems',
      actionType: 'link',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      buttonText: 'Preços'
    },
    {
      id: 'newsletter',
      icon: <Mail className="h-5 w-5" />,
      title: '📰 Mantenha-se atualizado!',
      description: 'Receba novidades e atualizações da WEHOSTHERE',
      actionText: 'Subscrever',
      actionType: 'newsletter',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      buttonText: 'Subscrever'
    }
  ], [whatsappIndex, socialIndex]);

  useEffect(() => {
    // Verificar se o usuário já fechou todos os cards
    const dismissedCards = JSON.parse(localStorage.getItem('dismissed_scroll_cards') || '[]');
    if (dismissedCards.length >= CARDS.length) return;

    let lastScroll = 0;
    let scrollUpThreshold = 0;
    const SCROLL_UP_THRESHOLD = 100; // pixels de scroll para cima

    const handleScroll = () => {
      if (isAffiliatePromoOpen || document.body.hasAttribute('data-affiliate-promo-open')) {
        lastScroll = window.scrollY;
        return;
      }
      const currentScrollY = window.scrollY;
      const scrollDelta = lastScroll - currentScrollY;

      // Detectar scroll para cima significativo
      if (scrollDelta > SCROLL_UP_THRESHOLD && currentScrollY > 200) {
        scrollUpThreshold++;
        
        // Mostrar card a cada 3 scrolls para cima
        if (scrollUpThreshold >= 3) {
          // Encontrar o próximo card não dispensado e aplicável
          const nextCardIndex = CARDS.findIndex((card, index) => {
            // Skip signup card if user is logged in
            if (card.id === 'signup' && user) {
              return false;
            }
            // Skip push card if already activated or not supported
            if (card.id === 'push') {
              if (!isSupported || subscription || permission === 'granted') {
                return false;
              }
            }
            // PWA card always shows (with instructions if not installable)
            return !dismissedCards.includes(card.id) && index >= currentCardIndex;
          });
          
          if (nextCardIndex !== -1) {
            setCurrentCardIndex(nextCardIndex);
            setIsVisible(true);
            scrollUpThreshold = 0;
          }
        }
      }

      lastScroll = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCardIndex, isSupported, subscription, permission, user, CARDS, isAffiliatePromoOpen]);

  // Não mostrar incentivos se não estiver na página inicial
  if (pathname !== '/') return null;

  const handleClose = () => {
    const currentCard = CARDS[currentCardIndex];
    const dismissedCards = JSON.parse(localStorage.getItem('dismissed_scroll_cards') || '[]');
    
    if (!dismissedCards.includes(currentCard.id)) {
      dismissedCards.push(currentCard.id);
      localStorage.setItem('dismissed_scroll_cards', JSON.stringify(dismissedCards));
    }
    
    setIsVisible(false);
    
    // Avançar para o próximo card
    const nextCardIndex = CARDS.findIndex((card, index) => 
      !dismissedCards.includes(card.id) && index > currentCardIndex
    );
    if (nextCardIndex !== -1) {
      setCurrentCardIndex(nextCardIndex);
    }
  };

  const handleAction = async () => {
    const currentCard = CARDS[currentCardIndex];
    
    if (currentCard.actionType === 'link' && currentCard.actionUrl) {
      window.location.href = currentCard.actionUrl;
      handleClose();
    } else if (currentCard.actionType === 'whatsapp') {
      // Rotate between WhatsApp numbers
      const currentNumber = WHATSAPP_NUMBERS[whatsappIndex];
      const whatsappUrl = `https://wa.me/${currentNumber.number}?text=Olá, preciso de ajuda com a WEHOSTHERE`;
      window.open(whatsappUrl, '_blank');
      setWhatsappIndex((prev) => (prev + 1) % WHATSAPP_NUMBERS.length);
      handleClose();
    } else if (currentCard.actionType === 'pwa') {
      if (isInstallable) {
        const success = await promptInstall();
        if (success) {
          handleClose();
        }
      } else {
        // Mostrar instruções manuais detalhadas se prompt nativo não disponível
        const userAgent = navigator.userAgent.toLowerCase();
        let browserName = '';
        let instructions = '';
        let icon = '';
        
        if (userAgent.includes('chrome') || userAgent.includes('edge')) {
          browserName = userAgent.includes('edge') ? 'Microsoft Edge' : 'Google Chrome';
          instructions = `
📱 Como instalar no ${browserName}:

1. Clique no menu (⋮) no canto superior direito
2. Procure por "Instalar WEHOSTHERE" ou "Instalar aplicativo"
3. Clique na opção de instalação
4. Confirme a instalação

✅ Pronto! A WEHOSTHERE estará instalada no seu dispositivo.
          `;
          icon = '🌐';
        } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
          browserName = 'Safari';
          instructions = `
📱 Como instalar no Safari:

1. Clique no botão "Compartilhar" (⎙) na barra inferior
2. Role para baixo e selecione "Adicionar ao Ecrã Inicial"
3. Clique em "Adicionar" no canto superior direito
4. A WEHOSTHERE aparecerá no seu ecrã inicial

✅ Pronto! A WEHOSTHERE estará instalada no seu dispositivo.
          `;
          icon = '🧭';
        } else if (userAgent.includes('firefox')) {
          browserName = 'Firefox';
          instructions = `
📱 Como instalar no Firefox:

1. Clique no menu (⋮) no canto superior direito
2. Procure por "Instalar" ou "Adicionar à página inicial"
3. Siga as instruções na tela
4. Confirme a instalação

✅ Pronto! A WEHOSTHERE estará instalada no seu dispositivo.
          `;
          icon = '🦊';
        } else {
          browserName = 'Navegador';
          instructions = `
📱 Como instalar:

1. Procure pelo menu do seu navegador
2. Busque por opções de "Instalar" ou "Adicionar ao ecrã inicial"
3. Siga as instruções específicas do seu navegador
4. Confirme a instalação

💡 Dica: Se precisar de ajuda, entre em contato pelo WhatsApp!
          `;
          icon = '🔍';
        }
        
        // Criar modal com instruções detalhadas
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4';
        modal.innerHTML = `
          <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2.5">
                <img src="/mascote-transparent.png" class="w-8 h-8 object-contain drop-shadow" alt="WEHOSTHERE" />
                <h3 class="text-lg font-bold text-gray-900">Instalar WEHOSTHERE</h3>
              </div>
              <button id="close-modal" class="text-gray-400 hover:text-gray-600 transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <p class="text-sm text-gray-600 mb-4">Detectado: <span class="font-semibold text-gray-900">${browserName}</span></p>
            <pre class="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl whitespace-pre-wrap leading-relaxed font-sans">${instructions}</pre>
            <button id="close-modal-btn" class="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition">
              Entendi
            </button>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        const closeModal = () => {
          modal.remove();
          handleClose();
        };
        
        document.getElementById('close-modal')?.addEventListener('click', closeModal);
        document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal();
        });
      }
    } else if (currentCard.actionType === 'push') {
      const success = await requestPermission();
      if (success) {
        handleClose();
      }
    } else if (currentCard.actionType === 'signup' && currentCard.actionUrl) {
      window.location.href = currentCard.actionUrl;
      handleClose();
    } else if (currentCard.actionType === 'social') {
      // Rotate between social links
      const currentSocial = SOCIAL_LINKS[socialIndex];
      window.open(currentSocial.url, '_blank');
      setSocialIndex((prev) => (prev + 1) % SOCIAL_LINKS.length);
      handleClose();
    } else if (currentCard.actionType === 'systems') {
      // Redirecionar baseado no estado de login
      if (user) {
        // Usuário logado: vai para dashboard/systems
        window.location.href = '/dashboard/systems';
      } else {
        // Usuário não logado: vai para página pública de sistemas
        window.location.href = '/systems';
      }
      handleClose();
    } else if (currentCard.actionType === 'assistant') {
      // Abrir assistente virtual usando evento customizado
      const event = new CustomEvent('openVirtualAssistant');
      window.dispatchEvent(event);
      handleClose();
    } else if (currentCard.actionType === 'link' && currentCard.actionUrl) {
      // Para cards de link (como sites), verificar se é um link especial
      if (currentCard.id === 'pricing' || currentCard.id === 'blog') {
        // Links normais, redirecionam diretamente
        window.location.href = currentCard.actionUrl;
        handleClose();
      } else {
        // Para outros links, verificar estado de login
        if (user) {
          window.location.href = currentCard.actionUrl;
          handleClose();
        } else {
          // Se não estiver logado e for um link de dashboard, redirecionar para página pública
          if (currentCard.actionUrl.includes('/dashboard/')) {
            // Extrair o tipo de página e redirecionar para versão pública
            if (currentCard.actionUrl.includes('/dashboard/sites')) {
              window.location.href = '/site-quote';
            } else if (currentCard.actionUrl.includes('/dashboard/systems')) {
              window.location.href = '/systems';
            } else {
              window.location.href = currentCard.actionUrl;
            }
          } else {
            window.location.href = currentCard.actionUrl;
          }
          handleClose();
        }
      }
    } else if (currentCard.actionType === 'newsletter') {
      // Mostrar formulário de newsletter
      // O formulário já está visível no card
    }
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
        body: JSON.stringify({ email, source: 'scroll_card' })
      });

      const data = await response.json();

      if (response.ok || data.success) {
        setMessage(data.message || 'Subscrito com sucesso!');
        setStatus('success');
        setEmail('');
        setTimeout(() => {
          handleClose();
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

  if (!isVisible || isAffiliatePromoOpen) return null;

  const currentCard = CARDS[currentCardIndex];
  const isNewsletterCard = currentCard.actionType === 'newsletter';

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${currentCard.bgColor} border-t ${currentCard.borderColor} shadow-2xl animate-in slide-in-from-bottom-10 duration-500`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-3">
        {/* Primeira linha: Texto e botão de fechar */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Texto de incentivo */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-gray-900 flex-1 min-w-0">
            <div className={`p-1 sm:p-1.5 ${currentCard.iconBg} rounded-full flex-shrink-0`}>
              <div className={currentCard.iconColor}>
                {currentCard.icon}
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs sm:text-sm truncate">
                {currentCard.title}
              </p>
              <p className="text-[10px] text-gray-600 hidden sm:block">
                {currentCard.description}
              </p>
            </div>
          </div>

          {/* Botão de fechar */}
          <button
            onClick={handleClose}
            className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
            title="Fechar"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>

        {/* Formulário de subscrição (apenas para newsletter) */}
        {isNewsletterCard && status !== 'success' && (
          <div className="mt-2 sm:mt-3">
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu email"
                className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-xs sm:text-sm"
                disabled={loading}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 sm:space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                    <span className="hidden sm:inline">...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span>Subscrever</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Botão de ação (para não-newsletter) */}
        {!isNewsletterCard && (
          <div className="mt-2 sm:mt-3">
            <button
              onClick={handleAction}
              className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{currentCard.buttonText}</span>
            </button>
          </div>
        )}

        {/* Mensagem de sucesso */}
        {isNewsletterCard && status === 'success' && (
          <div className="mt-2 sm:mt-3 flex items-center space-x-2 text-emerald-600">
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="font-semibold text-xs sm:text-sm">Subscrito com sucesso!</span>
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

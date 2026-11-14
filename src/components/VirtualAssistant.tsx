'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, ChevronRight, Phone, Search, Globe, Mail, Server, Layout, Loader2, CheckCircle, User, Crown, Star } from 'lucide-react';
import Image from 'next/image';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const faqData: FAQItem[] = [
  // Domínio
  {
    id: 'domain-1',
    category: 'Domínio',
    question: 'Como registar um domínio .co.mz?',
    answer: 'O registo de domínio .co.mz é feito através do nosso formulário de registo. O processo demora entre 24-48 horas e inclui configuração DNS completa.',
    icon: <Globe className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'domain-2',
    category: 'Domínio',
    question: 'Quanto custa um domínio .co.mz?',
    answer: 'O domínio .co.mz custa 3.000 MT por ano. Inclui renovação automática e suporte DNS gratuito.',
    icon: <Globe className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'domain-3',
    category: 'Domínio',
    question: 'Posso transferir o meu domínio?',
    answer: 'Sim, transferimos domínios de outros registadores gratuitamente. O processo leva até 5 dias úteis.',
    icon: <Globe className="w-5 h-5 text-primary-600" />
  },
  
  // Hospedagem
  {
    id: 'hosting-1',
    category: 'Hospedagem',
    question: 'Qual plano devo escolher?',
    answer: 'Básico (550 MT/mês): 1 site, 5 emails, 10GB. Profissional (2.500 MT/mês): 5 sites, 20 emails, 50GB. Empresarial (6.200 MT/mês): sites ilimitados, email ilimitado, 200GB.',
    icon: <Server className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'hosting-2',
    category: 'Hospedagem',
    question: 'Quanto custa a hospedagem?',
    answer: 'Básico: 550 MT/mês ou 5.500 MT/ano. Profissional: 2.500 MT/mês ou 25.000 MT/ano. Empresarial: 6.200 MT/mês ou 62.000 MT/ano. Pagamentos anuais têm 2 meses grátis.',
    icon: <Server className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'hosting-3',
    category: 'Hospedagem',
    question: 'O que acontece se ultrapassar o limite?',
    answer: 'Enviamos um aviso quando atingir 80% do limite. Pode atualizar o plano a qualquer momento sem interrupção.',
    icon: <Server className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'hosting-4',
    category: 'Hospedagem',
    question: 'Têm backup automático?',
    answer: 'Sim, fazemos backup diário automático com retenção de 30 dias. Também oferecemos backup manual sob demanda.',
    icon: <Server className="w-5 h-5 text-primary-600" />
  },
  
  // Email
  {
    id: 'email-1',
    category: 'Email',
    question: 'Como criar contas de email?',
    answer: 'Aceda ao painel de controle > Email > Criar Conta. Pode criar até 5 contas no Básico, 20 no Profissional e ilimitadas no Empresarial.',
    icon: <Mail className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'email-2',
    category: 'Email',
    question: 'Como configurar no meu dispositivo?',
    answer: 'Usamos IMAP/SMTP. As configurações são enviadas automaticamente por email após criar a conta. Suportamos Outlook, Gmail, Apple Mail.',
    icon: <Mail className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'email-3',
    category: 'Email',
    question: 'Qual o limite de armazenamento?',
    answer: 'Cada conta tem 10GB no plano Básico, 25GB no Profissional e ilimitado no Empresarial.',
    icon: <Mail className="w-5 h-5 text-primary-600" />
  },
  
  // Site
  {
    id: 'site-1',
    category: 'Site',
    question: 'Como funciona a criação de site?',
    answer: 'Desenvolvemos sites personalizados em 7-14 dias. Inclui design responsivo, SEO básico e integração com redes sociais. Preços variam por tipo de site.',
    icon: <Layout className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'site-2',
    category: 'Site',
    question: 'Posso fazer alterações depois?',
    answer: 'Sim, fornecemos painel de administração para fazer alterações básicas. Para alterações complexas, oferecemos manutenção mensal.',
    icon: <Layout className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'site-3',
    category: 'Site',
    question: 'Inclui domínio e hospedagem?',
    answer: 'Sim, o pacote inclui 1 domínio .co.mz e 1 ano de hospedagem gratuita. Após o primeiro ano, paga apenas renovação.',
    icon: <Layout className="w-5 h-5 text-primary-600" />
  },
  
  // Sistemas
  {
    id: 'systems-1',
    category: 'Sistemas',
    question: 'Como funciona o aluguel de sistemas?',
    answer: 'Escolha um sistema disponível na página /systems, faça o pedido de aluguer, após pagamento aprovamos e enviamos as credenciais de acesso por email.',
    icon: <Star className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'systems-2',
    category: 'Sistemas',
    question: 'Quais sistemas estão disponíveis?',
    answer: 'Temos ERP, CRM, Gestão de Stocks, Sistemas de Facturação, e muito mais. Visite /systems para ver todos os sistemas disponíveis.',
    icon: <Star className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'systems-3',
    category: 'Sistemas',
    question: 'Qual o custo do aluguel?',
    answer: 'Os preços variam por sistema e ciclo de pagamento (mensal ou anual). Cada sistema tem o seu preço listado na página /systems.',
    icon: <Star className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'systems-4',
    category: 'Sistemas',
    question: 'Posso cancelar o aluguel?',
    answer: 'Sim, pode cancelar a qualquer momento. O acesso permanece ativo até o fim do ciclo pago (mensal ou anual).',
    icon: <Star className="w-5 h-5 text-primary-600" />
  },
  {
    id: 'systems-5',
    category: 'Sistemas',
    question: 'Inclui suporte técnico?',
    answer: 'Sim, todos os sistemas incluem suporte técnico para ajudar com dúvidas e problemas de utilização.',
    icon: <Star className="w-5 h-5 text-primary-600" />
  }
];

const categories = ['Todas', 'Domínio', 'Hospedagem', 'Email', 'Site', 'Sistemas'];

export default function VirtualAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedFAQ, setSelectedFAQ] = useState<FAQItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isAffiliatePromoOpen, setIsAffiliatePromoOpen] = useState(false);

  // Check if user is logged in and get plan info
  useEffect(() => {
    const authData = localStorage.getItem('wehosthere_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setIsLoggedIn(true);
        setUserPlan(parsed.user?.plan || null);
      } catch (e) {
        console.error('Error parsing auth data:', e);
      }
    }

    // Listen for custom event to open assistant
    const handleOpenAssistant = () => {
      setIsOpen(true);
    };

    const handleFeedbackState = (e: Event) => {
      const customEvent = e as CustomEvent<{ open: boolean }>;
      setIsFeedbackOpen(!!customEvent.detail?.open);
    };

    window.addEventListener('openVirtualAssistant', handleOpenAssistant);
    window.addEventListener('wehost:feedback-state', handleFeedbackState);
    const handleAffiliatePromoState = (e: Event) => {
      const customEvent = e as CustomEvent<{ open: boolean }>;
      setIsAffiliatePromoOpen(!!customEvent.detail?.open);
    };
    window.addEventListener('wehost:affiliate-promo-state', handleAffiliatePromoState);

    return () => {
      window.removeEventListener('openVirtualAssistant', handleOpenAssistant);
      window.removeEventListener('wehost:feedback-state', handleFeedbackState);
      window.removeEventListener('wehost:affiliate-promo-state', handleAffiliatePromoState);
    };
  }, []);

  const handleToggleOpen = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wehost:assistant-state', { detail: { open: nextOpen } }));
    }
  };

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'Todas' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleWhatsAppSupport = () => {
    let message = 'Olá, gostaria de suporte sobre os serviços WEHOSTHERE.';
    
    if (selectedFAQ) {
      message = `Olá, tenho uma dúvida sobre: ${selectedFAQ.question}\n\nCategoria: ${selectedFAQ.category}\n\nGostaria de mais informações sobre isto.`;
    } else if (searchQuery) {
      message = `Olá, pesquisei sobre: "${searchQuery}" no assistente virtual e gostaria de mais informações.`;
    } else {
      const models = [
        'Quero saber sobre registo de domínio',
        'Preciso de ajuda com hospedagem',
        'Tenho dúvidas sobre email corporativo',
        'Quero informações sobre criação de sites'
      ];
      message = `Olá, gostaria de suporte. ${models[Math.floor(Math.random() * models.length)]}.`;
    }
    
    window.open(`https://wa.me/258848335618?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleActionClick = (category: string) => {
    const sectionMap: Record<string, string> = {
      'Domínio': 'infraestrutura',
      'Hospedagem': 'planos',
      'Email': 'planos',
      'Site': 'criacao-sites'
    };

    const section = sectionMap[category];
    if (section) {
      setIsScrolling(true);
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsOpen(false);
        
        // Show toast notification
        setToastMessage(`Navegando para ${category}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
      setTimeout(() => setIsScrolling(false), 1000);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 300);
  };

  return (
    <>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
      {/* Floating Button com Avatar do Assistente */}
      {!isOpen && !isFeedbackOpen && !isAffiliatePromoOpen && (
        <button
          onClick={() => handleToggleOpen(true)}
          className="fixed bottom-4 sm:bottom-5 left-4 sm:left-5 z-50 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group flex items-center justify-center cursor-pointer overflow-hidden border-0 outline-none p-0"
          title="Assistente Virtual WEHOSTHERE"
        >
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white relative">
            <Image
              src="/avatar.png"
              alt="Assistente Virtual"
              width={32}
              height={32}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:bottom-6 sm:left-4 sm:left-6 z-50 w-full sm:w-[calc(100vw-2rem)] sm:max-w-sm bg-white rounded-none sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-2.5 sm:p-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center overflow-hidden p-0.5 shadow-md border-2 border-white/60">
                  <Image
                    src="/avatar.png"
                    alt="WEHOSTHERE Assistente"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-[10px] sm:text-xs">WEHOSTHERE</h3>
                  <p className="text-[9px] sm:text-[10px] text-primary-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Assistente Virtual
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {isLoggedIn && userPlan && (
                  <div className="flex items-center space-x-0.5 sm:space-x-1 bg-white/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">
                    <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300" />
                    <span className="text-[8px] sm:text-[10px] font-semibold">{userPlan}</span>
                  </div>
                )}
                <button
                  onClick={() => handleToggleOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 max-h-[calc(100vh-120px)] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
            {!selectedFAQ ? (
              <>
                {/* Search */}
                <div className="p-2.5 sm:p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] sm:text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-600 animate-spin" />
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div className="p-2.5 sm:p-3 border-b border-gray-100">
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-semibold transition ${
                          selectedCategory === category
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FAQ List */}
                <div className="p-2.5 sm:p-3 space-y-1 sm:space-y-1.5">
                  {filteredFAQs.length === 0 ? (
                    <p className="text-center text-gray-500 text-[10px] sm:text-xs py-3 sm:py-4">
                      Nenhuma pergunta encontrada.
                    </p>
                  ) : (
                    filteredFAQs.map(faq => (
                      <button
                        key={faq.id}
                        onClick={() => setSelectedFAQ(faq)}
                        className="w-full text-left p-2 sm:p-2.5 bg-gray-50 hover:bg-primary-50 rounded-lg border border-gray-200 hover:border-primary-200 transition-all duration-200 group"
                      >
                        <div className="flex items-start space-x-1.5 sm:space-x-2">
                          <div className="flex-shrink-0 mt-0.5">
                            {faq.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-xs font-semibold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-2">
                              {faq.question}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">{faq.category}</p>
                          </div>
                          <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0" />
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* WhatsApp Support */}
                <div className="p-2.5 sm:p-3 border-t border-gray-100">
                  <button
                    onClick={handleWhatsAppSupport}
                    className="w-full flex items-center justify-center space-x-1 sm:space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white py-2 sm:py-2.5 rounded-lg font-semibold text-[10px] sm:text-xs transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Falar no WhatsApp</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* FAQ Detail */}
                <div className="p-2.5 sm:p-3">
                  <button
                    onClick={() => setSelectedFAQ(null)}
                    className="flex items-center space-x-1 sm:space-x-1.5 text-[10px] sm:text-xs text-gray-600 hover:text-primary-600 mb-2 sm:mb-3 transition"
                  >
                    <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 rotate-180" />
                    <span>Voltar</span>
                  </button>
                  
                  <div className="flex items-start space-x-1.5 sm:space-x-2 mb-2 sm:mb-3">
                    <div className="flex-shrink-0">
                      {selectedFAQ.icon}
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-primary-600 uppercase tracking-wider">
                        {selectedFAQ.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 mt-1">
                        {selectedFAQ.question}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200 mb-2 sm:mb-3">
                    <p className="text-[10px] sm:text-xs text-gray-700 leading-relaxed">
                      {selectedFAQ.answer}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1.5 sm:gap-2">
                    <button
                      onClick={() => handleActionClick(selectedFAQ.category)}
                      disabled={isScrolling}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-xs transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                    >
                      {isScrolling ? (
                        <>
                          <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                          <span>Navegando...</span>
                        </>
                      ) : (
                        <>
                          <span>Ver {selectedFAQ.category}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleWhatsAppSupport}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-xs transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-1"
                    >
                      <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-50 bg-gray-900 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg flex items-center space-x-1.5 sm:space-x-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </>
  );
}

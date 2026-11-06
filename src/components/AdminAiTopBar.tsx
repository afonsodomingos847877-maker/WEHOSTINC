'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { auth } from '@/lib/auth';
import { 
  Mic, MicOff, Send, Sparkles, X, ArrowRight, 
  Copy, Check, RefreshCw, BarChart3, Users, ShoppingBag, 
  CreditCard, LifeBuoy, Handshake, Globe, Mail,
  Server, EyeOff, BookOpen
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AdminAiTopBarProps {
  isGlobalRoot?: boolean;
}

export default function AdminAiTopBar({ isGlobalRoot = false }: AdminAiTopBarProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { data: session } = useSession();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showOnPublicPages, setShowOnPublicPages] = useState(true);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const handleSendRef = useRef<(text?: string) => Promise<void>>(async () => {});

  const isOnAdminRoute = pathname.startsWith('/admin');
  const isExpanded = isOpen || isFocused;

  // Verificar se utilizador atual tem privilégios de administrador ou sessão de cliente
  useEffect(() => {
    const syncAuthState = () => {
      // 1. Verificar sessão NextAuth
      if (session?.user) {
        const email = session.user.email?.toLowerCase();
        setUserEmail(email || null);
        const role = (session.user as any)?.role;
        if (role === 'admin' || role === 'super_admin' || email === 'info@wehosthere.com' || email === 'admin@wehosthere.com') {
          setIsAdminUser(true);
          return;
        }
      }

      // 2. Verificar autenticação em localStorage
      try {
        const localUser = auth.getCurrentUser();
        if (localUser) {
          setUserEmail(localUser.email?.toLowerCase() || null);
          if (localUser.role === 'admin' || localUser.role === 'super_admin' || localUser.email === 'info@wehosthere.com' || localUser.email === 'admin@wehosthere.com') {
            setIsAdminUser(true);
            return;
          }
        }
      } catch (_) {}

      setUserEmail(null);
      setIsAdminUser(false);
    };

    syncAuthState();

    const handleAuthChange = () => syncAuthState();
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('wehost_auth_change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('wehost_auth_change', handleAuthChange);
    };
  }, [session]);

  // Carregar preferências de páginas públicas do localStorage
  useEffect(() => {
    try {
      const savedPublic = localStorage.getItem('wehost_ai_show_public');
      if (savedPublic !== null) {
        setShowOnPublicPages(savedPublic === 'true');
      }
    } catch (_) {}
  }, []);

  const togglePublicVisibility = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowOnPublicPages(prev => {
      const next = !prev;
      try {
        localStorage.setItem('wehost_ai_show_public', String(next));
      } catch (_) {}
      return next;
    });
    setIsOpen(false);
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || query).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsOpen(true);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/admin-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          history: messages.slice(-4).map(m => ({ role: m.role, content: m.content })),
          userRole: (isOnAdminRoute && isAdminUser) ? 'admin' : (userEmail ? 'client' : 'guest'),
          userEmail: userEmail || undefined
        })
      });

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'Não consegui obter uma resposta para este comando.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('[AI Top Bar] Erro:', err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Ocorreu um erro ao comunicar com o Copilot. Por favor, tente novamente.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  // Inicializar SpeechRecognition do navegador (voz)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'pt-PT';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript);
          setIsListening(false);
          if (handleSendRef.current) {
            handleSendRef.current(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('[Speech Recognition] Erro:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Fechar painel ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('O seu navegador não suporta reconhecimento de voz direto. Pode digitar a sua pergunta!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setIsOpen(true);
        setIsFocused(true);
      } catch (e) {
        console.error('Erro ao iniciar microfone:', e);
        setIsListening(false);
      }
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sugestões Rápidas: Separadas com rigor entre Administrador (apenas no /admin) e Clientes/Visitantes
  const adminQuickPrompts = [
    { label: 'Visão Geral do Sistema', icon: BarChart3, prompt: 'Resuma o status geral de utilizadores, vendas e métricas hoje' },
    { label: 'Utilizadores Recentes', icon: Users, prompt: 'Quem são os últimos utilizadores registados no sistema?' },
    { label: 'Pedidos & Vendas', icon: ShoppingBag, prompt: 'Mostre a lista dos últimos pedidos e vendas realizadas' },
    { label: 'Faturas Pendentes', icon: CreditCard, prompt: 'Quais faturas ou clientes têm pagamentos pendentes?' },
    { label: 'Revista & Histórias', icon: BookOpen, prompt: 'Como gerir e publicar histórias na revista Codando Histórias?' },
    { label: 'Tickets de Suporte', icon: LifeBuoy, prompt: 'Temos algum chamado de suporte ou ticket em aberto?' },
    { label: 'Comissões de Afiliados', icon: Handshake, prompt: 'Qual o valor total de comissões pendentes de afiliados?' },
    { label: 'Configuração DNS', icon: Globe, prompt: 'Como configurar os registos DNS do email Migadu?' },
  ];

  const clientQuickPrompts = [
    { label: 'Planos de Hospedagem', icon: Server, prompt: 'Quais são os planos de hospedagem disponíveis e os preços?' },
    { label: 'Registo de Domínio .co.mz', icon: Globe, prompt: 'Como registar e qual o preço de um domínio .co.mz?' },
    { label: 'Email Profissional', icon: Mail, prompt: 'Como funciona e como configurar o email corporativo Migadu?' },
    { label: 'Criação de Sites', icon: Sparkles, prompt: 'Como pedir um orçamento para criação de site ou loja online?' },
    { label: 'Histórias da Revista', icon: BookOpen, prompt: 'Quais são as histórias publicadas na revista Codando Histórias?' },
    { label: 'Formas de Pagamento', icon: CreditCard, prompt: 'Quais são os métodos de pagamento aceites em Moçambique?' },
    { label: 'Suporte Técnico', icon: LifeBuoy, prompt: 'Como abrir um ticket de suporte técnico?' },
    { label: 'Comissões de Afiliados', icon: Handshake, prompt: 'Como funciona o programa de afiliados e comissões da WEHOSTHERE?' },
  ];

  // Sugestões contextuais exclusivas para quando o visitante está na secção da Revista
  const revistaQuickPrompts = [
    { label: 'Histórias em Destaque', icon: BookOpen, prompt: 'Quais são as principais histórias publicadas na revista Codando Histórias?' },
    { label: 'Descarregar Edição em PDF', icon: BookOpen, prompt: 'Como descarregar a nova edição da revista Codando Histórias em PDF?' },
    { label: 'Planos de Hospedagem', icon: Server, prompt: 'Quais são os planos de hospedagem disponíveis e os preços?' },
    { label: 'Registo de Domínio .co.mz', icon: Globe, prompt: 'Como registar e qual o preço de um domínio .co.mz?' },
    { label: 'Criação de Sites', icon: Sparkles, prompt: 'Como pedir um orçamento para criação de site ou loja online?' },
    { label: 'Suporte Técnico', icon: LifeBuoy, prompt: 'Como entrar em contacto com o suporte da WEHOSTHERE?' },
  ];

  // 🔒 REGRA ESTRITA: Perguntas de administração APENAS aparecem se for administrador E estiver dentro da rota /admin
  const showAdminPrompts = isOnAdminRoute && isAdminUser;
  const isRevistaRoute = pathname.startsWith('/revista');
  const activeQuickPrompts = showAdminPrompts 
    ? adminQuickPrompts 
    : isRevistaRoute 
      ? revistaQuickPrompts 
      : clientQuickPrompts;

  const formatContent = (rawText: string) => {
    const cleanText = (rawText || '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/g, '');

    const parts = cleanText.split(/(\[[^\]]+\]\([^)]+\))/g);

    return parts.map((part, index) => {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        const [, linkText, href] = match;
        const isDownload = href.includes('download') || href.endsWith('.pdf');

        if (isDownload) {
          return (
            <a
              key={index}
              href={href}
              download="Codando-Historias-Edicao-01.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-primary-600 hover:from-purple-700 hover:to-primary-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs hover:shadow-md mx-1 my-1 transition-all cursor-pointer transform active:scale-95 no-underline"
              title="Descarregar arquivo PDF agora"
            >
              <span>📥</span>
              <span>{linkText}</span>
              <span>→</span>
            </a>
          );
        }

        return (
          <button
            key={index}
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsFocused(false);
              router.push(href);
            }}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-bold underline underline-offset-2 mx-1 transition cursor-pointer"
          >
            {linkText}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Render do Painel de Mensagens / Respostas (Glassmorphism)
  const renderResponsePanel = () => {
    if (!isOpen) return null;
    return (
      <div
        ref={panelRef}
        className={`${
          isGlobalRoot
            ? 'absolute top-full right-0 mt-3 w-[92vw] sm:w-[480px]'
            : 'absolute top-full inset-x-0 mt-3 w-full'
        } bg-white/45 backdrop-blur-2xl border border-white/70 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.6)_inset] ring-1 ring-black/5 rounded-3xl p-5 text-gray-900 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-3 max-h-[520px] flex flex-col z-50`}
      >
        {/* Cabeçalho do Painel */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-200/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-white/80 flex items-center justify-center overflow-hidden p-0.5">
              <img src="/avatar.png" alt="WEHOSTHERE AI" className="w-full h-full object-cover rounded-full" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                WEHOSTHERE AI Copilot
              </span>
              <span className="text-[10px] text-gray-600 font-medium block">
                {showAdminPrompts ? 'Assistente Operacional Inteligente' : 'Assistente de Atendimento & Suporte'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {isGlobalRoot && (
              <button
                onClick={togglePublicVisibility}
                className="p-1.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-white/50 transition cursor-pointer"
                title="Ocultar botão flutuante"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            )}

            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition px-2.5 py-1 rounded-lg hover:bg-white/50 cursor-pointer"
              >
                Limpar
              </button>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                setIsFocused(false);
              }}
              className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white/50 transition cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sugestões Rápidas (Chips) quando o chat estiver vazio */}
        {messages.length === 0 && (
          <div className="py-4 space-y-3">
            <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Perguntas Rápidas:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeQuickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  className="flex items-center text-left text-xs bg-white/40 hover:bg-white/75 border border-white/60 hover:border-primary-400 p-3 rounded-2xl transition-all text-gray-800 hover:text-primary-700 shadow-2xs hover:shadow-xs group cursor-pointer backdrop-blur-md"
                >
                  <item.icon className="w-4 h-4 text-primary-600 mr-2.5 shrink-0 transition-transform group-hover:scale-110" />
                  <span className="font-semibold truncate">{item.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-gray-400 group-hover:text-primary-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Mensagens */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 text-sm custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs sm:text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-br-xs shadow-md'
                      : 'bg-white/50 border border-white/70 text-gray-900 rounded-bl-xs shadow-xs backdrop-blur-md ring-1 ring-black/5'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {formatContent(msg.content)}
                  </div>

                  {msg.role === 'assistant' && (
                    <div className="mt-2.5 pt-2 border-t border-gray-200/40 flex items-center justify-between text-[11px] text-gray-600 font-medium">
                      <span className="flex items-center gap-1.5 font-bold text-gray-700">
                        <div className="w-4 h-4 rounded-full overflow-hidden bg-white border border-gray-200 shadow-2xs shrink-0">
                          <img src="/avatar.png" alt="WEHOSTHERE AI" className="w-full h-full object-cover rounded-full" />
                        </div>
                        WEHOSTHERE AI
                      </span>
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="flex items-center space-x-1 hover:text-gray-900 px-2 py-0.5 rounded-md hover:bg-white/60 transition cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs font-bold text-primary-600 py-3 px-3 bg-white/50 backdrop-blur-md rounded-xl border border-white/70 shadow-xs w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-600" />
                <span>A consultar informações e processar resposta...</span>
              </div>
            )}
          </div>
        )}

        {/* Campo de Input no Painel para o Modo Flutuante */}
        {isGlobalRoot && (
          <div className="pt-3 mt-auto border-t border-gray-200/50 flex items-center space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isListening ? 'A ouvir voz...' : 'Digite a sua pergunta ao Copilot...'}
              className="flex-1 bg-white/80 border border-gray-200/80 rounded-full px-3.5 py-2 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 font-medium shadow-2xs"
            />
            {query.trim() && (
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading}
                className="p-2 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition cursor-pointer"
                title="Enviar"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-2 rounded-full transition cursor-pointer ${
                isListening ? 'bg-red-500/20 text-red-600 animate-bounce' : 'bg-white/80 text-gray-600 hover:text-gray-900 border border-gray-200/60'
              }`}
              title={isListening ? 'Parar voz' : 'Falar por voz'}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5 text-red-600" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    );
  };

  // 🔹 No Webmail o AI Copilot não deve aparecer
  if (pathname.startsWith('/webmail')) {
    return null;
  }

  // 🔹 MODO GLOBAL ROOT (Para páginas públicas e dashboard)
  if (isGlobalRoot) {
    if (isOnAdminRoute) {
      return null;
    }

    const isRevista = pathname?.startsWith('/revista');
    const isAcademy = pathname?.startsWith('/academy');
    // Na revista e na academia o header sticky inclui barra superior + navbar (~104px a ~112px).
    // Usamos top-[118px] sm:top-[124px] para ficar perfeitamente limpo abaixo da nav, E z-[100] para estar SEMPRE por cima!
    const topPos = isRevista || isAcademy ? 'top-[118px] sm:top-[124px]' : 'top-20 sm:top-24';

    // Se estiver oculto pelo utilizador: exibir mini aba discreta na lateral para reabrir
    if (!showOnPublicPages) {
      return (
        <div 
          onClick={togglePublicVisibility}
          className={`fixed ${topPos} right-0 z-[100] bg-gradient-to-l from-[#075985] to-[#0284c7] text-white py-1.5 px-2 rounded-l-2xl shadow-xl cursor-pointer hover:px-3 transition-all duration-300 flex items-center space-x-1.5 opacity-80 hover:opacity-100 group border-y border-l border-white/30`}
          title="Exibir WEHOSTHERE AI Copilot"
        >
          <div className="w-5 h-5 rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden">
            <img src="/avatar.png" alt="AI" className="w-full h-full object-cover rounded-full" />
          </div>
          <span className="text-[10px] font-black tracking-wider uppercase hidden group-hover:inline transition-all">AI</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      );
    }

    return (
      <div className={`fixed ${topPos} right-4 sm:right-6 z-[100] flex flex-col items-end`}>
        {/* Botão Launcher Flutuante com Aurora Glow */}
        <div className="relative group">
          <div 
            className={`absolute -inset-1 rounded-full blur-md transition-all duration-500 ${
              isListening
                ? 'opacity-100 animate-pulse bg-gradient-to-r from-red-500 via-pink-500 to-amber-500'
                : 'opacity-85 group-hover:opacity-100 bg-gradient-to-r from-sky-400 via-primary-500 to-amber-400'
            }`}
          />

          <div
            onClick={() => {
              setIsOpen(prev => !prev);
              setIsFocused(true);
            }}
            className="relative flex items-center space-x-2 bg-gradient-to-r from-[#075985] via-[#0369a1] to-[#0284c7] hover:from-[#0369a1] hover:to-[#0284c7] text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-2xl border border-white/30 cursor-pointer transition-all duration-300 transform active:scale-95"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white p-0.5 border border-white/40 shadow-xs flex items-center justify-center overflow-hidden">
              <img src="/avatar.png" alt="AI Copilot" className="w-full h-full object-cover rounded-full" />
            </div>
            <span className="text-xs font-black tracking-wide hidden sm:inline">AI Copilot</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

            {/* Botão de Voz */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleVoice();
              }}
              className="p-1 rounded-full hover:bg-white/20 transition text-sky-100 cursor-pointer"
              title="Falar por voz"
            >
              {isListening ? <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 animate-bounce" /> : <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Botão para Fechar / Ocultar Flutuante */}
            <button
              type="button"
              onClick={togglePublicVisibility}
              className="p-1 rounded-full hover:bg-white/20 transition text-sky-200 hover:text-white cursor-pointer"
              title="Ocultar botão flutuante"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {renderResponsePanel()}
      </div>
    );
  }

  // 🔹 MODO INLINE NO TOPO DO ADMIN (Sempre visível diretamente com o campo de texto)
  return (
    <div className="relative w-full max-w-2xl mx-auto px-4 z-40">
      <div className="relative group">
        {/* Glow Multicolorido Aurora */}
        <div 
          className={`absolute -inset-[1.5px] rounded-full blur-[2.5px] transition-all duration-500 ${
            isListening 
              ? 'opacity-100 animate-pulse bg-gradient-to-r from-red-500 via-pink-500 to-amber-500' 
              : isExpanded
                ? 'opacity-100 bg-gradient-to-r from-primary-500 via-sky-400 via-indigo-500 to-amber-400'
                : 'opacity-85 group-hover:opacity-100 bg-gradient-to-r from-sky-400 via-primary-500 via-cyan-300 via-emerald-400 to-amber-400'
          }`}
        />

        {/* Linha Fina Brilhante no Topo */}
        <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-sky-200 via-cyan-200 to-transparent opacity-90 rounded-full" />

        {/* Estrutura da Cápsula — Muda para Branco ao Clicar / Focar */}
        <div 
          onClick={() => {
            setIsFocused(true);
            if (messages.length > 0 || !isOpen) setIsOpen(true);
            inputRef.current?.focus();
          }}
          className={`relative flex items-center rounded-full px-4 py-2 shadow-md transition-all duration-300 cursor-text ${
            isExpanded
              ? 'bg-white/95 backdrop-blur-xl border border-primary-300 shadow-primary-500/10 ring-2 ring-primary-500/15'
              : 'bg-gradient-to-r from-[#075985] via-[#0369a1] to-[#0284c7] backdrop-blur-xl border border-white/20 hover:border-white/35 shadow-primary-900/20'
          }`}
        >
          
          {/* Avatar WEHOSTHERE AI */}
          <div className={`flex items-center justify-center w-7 h-7 rounded-full mr-2.5 shrink-0 overflow-hidden p-0.5 transition-all duration-300 ${
            isExpanded 
              ? 'bg-white border border-primary-200 shadow-2xs' 
              : 'bg-white border border-white/30 shadow-xs'
          }`}>
            <img 
              src="/avatar.png" 
              alt="WEHOSTHERE AI" 
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>

          {/* Campo de Texto */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isListening ? 'A ouvir a sua voz...' : 'Digite o seu comando...'}
            className={`w-full bg-transparent text-sm md:text-base focus:outline-none font-medium tracking-wide transition-colors duration-300 ${
              isExpanded
                ? 'text-gray-900 placeholder-gray-400'
                : 'text-white placeholder-sky-100/75'
            }`}
          />

          {/* Botões de Ação (Voz e Envio) */}
          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
            {query.trim() && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSend();
                }}
                disabled={loading}
                className={`p-1.5 rounded-full font-bold transition-all transform active:scale-95 shadow-md cursor-pointer ${
                  isExpanded
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'bg-white hover:bg-sky-50 text-primary-700'
                }`}
                title="Enviar comando"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleVoice();
              }}
              className={`p-2 rounded-full transition-all duration-300 cursor-pointer ${
                isListening
                  ? 'bg-red-500/30 text-red-500 animate-bounce'
                  : isExpanded
                    ? 'text-gray-400 hover:text-gray-800 hover:bg-gray-100'
                    : 'text-sky-100 hover:text-white hover:bg-white/15'
              }`}
              title={isListening ? 'Parar de ouvir' : 'Falar com a IA por voz'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-red-500" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {renderResponsePanel()}
    </div>
  );
}

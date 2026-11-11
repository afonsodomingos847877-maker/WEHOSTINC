'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, BarChart2, DollarSign, Send, CreditCard, Star, Users, 
  ShoppingBag, Mail, LifeBuoy, Globe, ShieldCheck, Tag, ArrowUp, 
  ChevronLeft, ChevronRight, Menu, X, RefreshCw, Eye, EyeOff, 
  Wallet, Handshake, FileText, GraduationCap, MessageSquare, 
  BookOpen, Settings, Compass, Search, Bot
} from 'lucide-react';

export interface AdminSidebarProps {
  pendingOrdersCount?: number;
  openTicketsCount?: number;
  pendingEmailsCount?: number;
  pendingDomainsCount?: number;
  totalUsersCount?: number;
  onlineUsersCount?: number;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  hideSensitive?: boolean;
  onToggleSensitive?: () => void;
}

interface NavSection {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  group: 'page' | 'modules';
  href?: string;
}

export default function AdminSidebar({
  pendingOrdersCount = 0,
  openTicketsCount = 0,
  pendingEmailsCount = 0,
  pendingDomainsCount = 0,
  totalUsersCount = 0,
  onlineUsersCount = 0,
  isRefreshing = false,
  onRefresh,
  hideSensitive = false,
  onToggleSensitive
}: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('sec-online-analytics');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Persistência do estado recolhido no desktop
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wehost_admin_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // Ignorar caso localStorage não esteja acessível
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('wehost_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Scrollspy: deteta a secção atualmente visível na tela
  useEffect(() => {
    const sectionIds = [
      'sec-online-analytics',
      'sec-kpis',
      'sec-faturamento',
      'sec-payouts',
      'sec-assinaturas',
      'sec-provas-sociais',
      'sec-usuarios',
      'sec-pedidos',
      'sec-emails-aprovacao',
      'sec-tickets',
      'sec-dominios',
      'sec-agente-email',
      'sec-emails-global',
      'sec-auditoria',
      'sec-distribuicao'
    ];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180; // offset do cabeçalho fixo

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sectionIds[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
    setIsMobileOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileOpen(false);
  };

  const sections: NavSection[] = [
    {
      id: 'sec-online-analytics',
      label: 'Online & Visitantes',
      shortLabel: 'Online',
      icon: Activity,
      badge: onlineUsersCount > 0 ? onlineUsersCount : undefined,
      badgeColor: 'bg-emerald-500 text-white',
      group: 'page'
    },
    {
      id: 'sec-kpis',
      label: 'Resumo Geral (KPIs)',
      shortLabel: 'KPIs',
      icon: BarChart2,
      group: 'page'
    },
    {
      id: 'sec-faturamento',
      label: 'Faturamento & Métricas',
      shortLabel: 'Finanças',
      icon: DollarSign,
      group: 'page'
    },
    {
      id: 'sec-pedidos',
      label: 'Pedidos & Serviços',
      shortLabel: 'Pedidos',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} pend.` : undefined,
      badgeColor: 'bg-amber-500 text-white animate-pulse',
      group: 'page'
    },
    {
      id: 'sec-usuarios',
      label: 'Usuários Cadastrados',
      shortLabel: 'Usuários',
      icon: Users,
      badge: totalUsersCount > 0 ? totalUsersCount : undefined,
      badgeColor: 'bg-blue-100 text-blue-700 font-bold',
      group: 'page'
    },
    {
      id: 'sec-tickets',
      label: 'Tickets de Suporte',
      shortLabel: 'Suporte',
      icon: LifeBuoy,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined,
      badgeColor: 'bg-red-500 text-white font-bold',
      group: 'page'
    },
    {
      id: 'sec-dominios',
      label: 'Domínios e Sites',
      shortLabel: 'Domínios',
      icon: Globe,
      badge: pendingDomainsCount > 0 ? `${pendingDomainsCount} pend.` : undefined,
      badgeColor: 'bg-amber-500 text-white',
      group: 'page'
    },
    {
      id: 'sec-emails-aprovacao',
      label: 'Aprovação de E-mails',
      shortLabel: 'E-mails',
      icon: Mail,
      badge: pendingEmailsCount > 0 ? `${pendingEmailsCount} pend.` : undefined,
      badgeColor: 'bg-amber-500 text-white',
      group: 'page'
    },
    {
      id: 'sec-agente-email',
      label: 'Agente IA (E-mail)',
      shortLabel: 'Agente IA',
      icon: Bot,
      group: 'page'
    },
    {
      id: 'sec-payouts',
      label: 'Payouts B2C (Saques)',
      shortLabel: 'Payouts',
      icon: Send,
      group: 'page'
    },
    {
      id: 'sec-assinaturas',
      label: 'Assinaturas Recorrentes',
      shortLabel: 'Assinaturas',
      icon: CreditCard,
      group: 'page'
    },
    {
      id: 'sec-provas-sociais',
      label: 'Provas Sociais (Toast)',
      shortLabel: 'Provas',
      icon: Star,
      group: 'page'
    },
    {
      id: 'sec-auditoria',
      label: 'Atividade Recente',
      shortLabel: 'Atividade',
      icon: ShieldCheck,
      group: 'page'
    },
    {
      id: 'sec-distribuicao',
      label: 'Distribuição de Planos',
      shortLabel: 'Planos',
      icon: Tag,
      group: 'page'
    }
  ];

  const adminModules = [
    { label: 'Cashvibe (Crédito)', href: '/admin/cashvibe', icon: Wallet, color: 'text-emerald-600' },
    { label: 'Afiliados & Ganhos', href: '/admin/affiliates', icon: Handshake, color: 'text-blue-600' },
    { label: 'Faturas Emitidas', href: '/admin/faturas', icon: FileText, color: 'text-orange-600' },
    { label: 'Academy / Cursos', href: '/admin/academy', icon: GraduationCap, color: 'text-indigo-600' },
    { label: 'Comunicação / SMS', href: '/admin/comunicacao', icon: MessageSquare, color: 'text-sky-600' },
    { label: 'Blog & Notícias', href: '/admin/blog', icon: BookOpen, color: 'text-green-600' },
    { label: 'Configurações', href: '/admin/settings', icon: Settings, color: 'text-purple-600' }
  ];

  const filteredSections = searchTerm
    ? sections.filter(s => s.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : sections;

  return (
    <>
      {/* ───── BOTÃO FLUTUANTE MOBILE / TABLET ───── */}
      <div className="lg:hidden fixed bottom-5 left-5 z-40">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-gray-900 to-indigo-950 text-white rounded-full shadow-xl hover:shadow-2xl border border-white/20 transition-all active:scale-95 cursor-pointer backdrop-blur-md"
          aria-label="Abrir menu de navegação de secções"
        >
          <Compass className="w-4 h-4 text-primary-400 animate-spin-slow" />
          <span className="text-xs font-bold tracking-wide">Secções do Painel</span>
          {(pendingOrdersCount > 0 || openTicketsCount > 0) && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* ───── DRAWER / MENU LATERAL MOBILE ───── */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Header Drawer */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  WH
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Navegador do Painel</h3>
                  <p className="text-[10px] text-gray-500">Saltar rapidamente para secção</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Busca Rápida no Drawer */}
            <div className="p-3 border-b border-gray-100 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar secção..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Lista com Scroll */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 divide-y divide-gray-100">
              {/* Secções da Página */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 block mb-1.5">
                  Nesta Página ({filteredSections.length})
                </span>
                <div className="space-y-0.5">
                  {filteredSections.map((sec) => {
                    const Icon = sec.icon;
                    const isActive = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs font-medium transition cursor-pointer ${
                          isActive
                            ? 'bg-primary-50 text-primary-700 font-bold border-l-3 border-primary-600 shadow-2xs'
                            : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                          <span className="truncate">{sec.label}</span>
                        </div>
                        {sec.badge && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1.5 shrink-0 ${sec.badgeColor || 'bg-gray-200 text-gray-700'}`}>
                            {sec.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Módulos Externos */}
              <div className="pt-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 block mb-1.5">
                  Outras Páginas do Admin
                </span>
                <div className="space-y-0.5">
                  {adminModules.map((mod) => {
                    const Icon = mod.icon;
                    return (
                      <Link
                        key={mod.href}
                        href={mod.href}
                        onClick={() => setIsMobileOpen(false)}
                        className="flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs text-gray-700 hover:bg-gray-100/80 transition"
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${mod.color}`} />
                        <span>{mod.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer do Drawer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={scrollToTop}
                className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 transition shadow-2xs"
              >
                <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
                <span>Voltar ao Topo</span>
              </button>
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 transition shadow-2xs"
                  title="Atualizar dados"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary-600' : 'text-gray-600'}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───── SIDEBAR DESKTOP FIXA / STICKY ───── */}
      <aside
        className={`hidden lg:flex flex-col bg-white border border-gray-200/90 rounded-2xl shadow-xs transition-all duration-300 sticky top-24 shrink-0 overflow-hidden ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
        style={{ maxHeight: 'calc(100vh - 7rem)' }}
      >
        {/* Topo da Sidebar */}
        <div className={`p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/60 ${isCollapsed ? 'flex-col gap-2' : ''}`}>
          {!isCollapsed ? (
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-gray-900 truncate">Menu de Secções</h4>
                <p className="text-[10px] text-gray-400 truncate">Navegação rápida</p>
              </div>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
          )}

          {/* Botão de Recolher/Expandir */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-md transition cursor-pointer"
            title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Campo de Busca Rápida (quando expandida) */}
        {!isCollapsed && (
          <div className="p-2 border-b border-gray-100 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
              <input
                type="text"
                placeholder="Filtrar secção..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white transition"
              />
            </div>
          </div>
        )}

        {/* Lista de Secções com Scroll Suave */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-3">
          {/* Secções da Página Principal */}
          <div>
            {!isCollapsed && (
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-2 block mb-1">
                Nesta Página
              </span>
            )}
            <div className="space-y-0.5">
              {filteredSections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full flex items-center rounded-lg text-left transition cursor-pointer group ${
                      isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                    } ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-bold border-l-2 border-primary-600 shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                    }`}
                    title={isCollapsed ? sec.label : undefined}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <Icon className={`shrink-0 ${isCollapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      {!isCollapsed && (
                        <span className="text-[11px] truncate">{sec.label}</span>
                      )}
                    </div>

                    {!isCollapsed && sec.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-1 shrink-0 ${sec.badgeColor || 'bg-gray-200 text-gray-700'}`}>
                        {sec.badge}
                      </span>
                    )}

                    {isCollapsed && sec.badge && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Módulos do Admin */}
          <div className="pt-2 border-t border-gray-100">
            {!isCollapsed && (
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-2 block mb-1">
                Módulos do Sistema
              </span>
            )}
            <div className="space-y-0.5">
              {adminModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link
                    key={mod.href}
                    href={mod.href}
                    className={`flex items-center rounded-lg text-left transition text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 group ${
                      isCollapsed ? 'justify-center p-2' : 'space-x-2 px-2.5 py-1.5'
                    }`}
                    title={isCollapsed ? mod.label : undefined}
                  >
                    <Icon className={`shrink-0 ${isCollapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${mod.color}`} />
                    {!isCollapsed && (
                      <span className="text-[11px] truncate">{mod.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rodapé da Sidebar (Ferramentas Rápidas) */}
        <div className={`p-2 border-t border-gray-100 bg-gray-50/80 flex items-center ${isCollapsed ? 'flex-col gap-1.5' : 'justify-between gap-1'}`}>
          <button
            type="button"
            onClick={scrollToTop}
            className={`flex items-center justify-center p-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition shadow-2xs cursor-pointer ${
              isCollapsed ? 'w-full' : 'px-2 space-x-1 text-[10px] font-semibold flex-1'
            }`}
            title="Voltar ao início da página"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            {!isCollapsed && <span>Topo</span>}
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="Atualizar dados em tempo real"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary-600' : ''}`} />
            </button>
          )}

          {onToggleSensitive && (
            <button
              type="button"
              onClick={onToggleSensitive}
              className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition shadow-2xs cursor-pointer"
              title={hideSensitive ? 'Mostrar valores monetários' : 'Ocultar valores monetários'}
            >
              {hideSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}


'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Globe, Plus, Copy, CheckCircle, Clock, XCircle,
  ExternalLink, ShieldCheck, AlertTriangle, RefreshCw,
  Server, ArrowRight, Info, Trash2, Search, Sparkles
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, Site } from '@/lib/data';
import DashboardNav from '@/components/DashboardNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageLoader from '@/components/PageLoader';
import StatusBadge from '@/components/StatusBadge';
import ApprovalCelebration from '@/components/ApprovalCelebration';
import ConfirmModal from '@/components/ConfirmModal';
import ReauthenticationModal from '@/components/ReauthenticationModal';
import Toast from '@/components/Toast';
import DomainSearch from '@/components/DomainSearch';
import { soundEffects } from '@/lib/soundEffects';

const NS1 = 'ns1.wehosthere.com';
const NS2 = 'ns2.wehosthere.com';

export default function DomainsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Celebration state (when admin approves domain/site)
  const [celebration, setCelebration] = useState<{ show: boolean; name: string } | null>(null);
  const prevSiteStatusRef = useRef<Record<string, string>>({});

  useEffect(() => {
    // Aguardar NextAuth carregar
    if (status === 'loading') return;
    
    let currentUser: User | null = null;
    
    // Tentar NextAuth primeiro
    if (status === 'authenticated' && session?.user) {
      currentUser = {
        id: (session.user as any)?.id || session.user.email || '',
        name: session.user.name || '',
        email: session.user.email || '',
        plan: (session.user as any)?.plan || 'none',
        status: (session.user as any)?.status || 'active',
        role: (session.user as any)?.role || 'user',
        avatar: session.user.image || undefined,
        dueDate: (session.user as any)?.dueDate,
        createdAt: (session.user as any)?.createdAt || new Date().toISOString()
      };
    }
    
    // Fallback para sistema customizado (se NextAuth falhar ou não estiver autenticado)
    if (!currentUser) {
      currentUser = auth.getCurrentUser();
    }
    
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (auth.isAdminUser(currentUser) && !auth.isClientViewActive()) {
      router.push('/admin');
      return;
    }
    setUser(currentUser);

    const refreshSites = (newSites?: Site[]) => {
      const loaded = (newSites || dataManager.getSites(currentUser.email)).filter(
        s => !s.userEmail || s.userEmail.toLowerCase() === currentUser.email.toLowerCase()
      );
      // Detect pending → active transitions to trigger celebration
      loaded.forEach(site => {
        const prevStatus = prevSiteStatusRef.current[site.id || site.domain];
        if (prevStatus === 'pending' && site.status === 'active') {
          soundEffects.playCertificateSound();
          setCelebration({ show: true, name: site.domain });
        }
        prevSiteStatusRef.current[site.id || site.domain] = site.status;
      });
      setSites(loaded);
    };

    refreshSites(dataManager.getSites(currentUser.email));
    setLoading(false);

    dataManager.fetchSitesAsync(currentUser.email).then(sites => refreshSites(sites));

    const interval = setInterval(() => {
      dataManager.fetchSitesAsync(currentUser.email).then(sites => refreshSites(sites));
    }, 30000);

    return () => clearInterval(interval);
  }, [router, session, status]);

  const handleLogout = () => { auth.logout(); router.push('/'); };

  // Modal de eliminação de domínio
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; domain: string } | null>(null);
  const [showReauthDeleteDomain, setShowReauthDeleteDomain] = useState(false);
  const [pendingDeleteSite, setPendingDeleteSite] = useState<{ id: string; domain: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ title?: string; message: string; type: 'success' | 'error' } | null>(null);

  const confirmDeleteDomain = () => {
    if (!deleteConfirm) return;
    setPendingDeleteSite({ id: deleteConfirm.id, domain: deleteConfirm.domain });
    setDeleteConfirm(null);
    setShowReauthDeleteDomain(true);
  };

  const executeDeleteDomain = () => {
    if (!pendingDeleteSite) return;
    try {
      const { id, domain } = pendingDeleteSite;
      dataManager.deleteSite(id, domain);
      soundEffects.playDeleteEmailSound();
      setSites(prev => prev.filter(s => s.id !== id && s.domain !== domain));
      setPendingDeleteSite(null);
      setToastMsg({ title: 'Domínio Removido', message: `O domínio ${domain} foi permanentemente eliminado.`, type: 'success' });
    } catch (err) {
      console.error('Erro ao eliminar domínio:', err);
      soundEffects.playErrorSound();
      setToastMsg({ title: 'Erro ao Eliminar', message: 'Ocorreu uma falha ao tentar eliminar o domínio. Tente novamente.', type: 'error' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    soundEffects.playCopySound();
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const getStatusBadge = (status: Site['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3 w-3" /><span>Ativo</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600 animate-pulse" /><span>Em Processamento</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            <XCircle className="h-3 w-3" /><span>Suspenso</span>
          </span>
        );
    }
  };

  if (loading) return <PageLoader text="A carregar os seus domínios..." />;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Celebration effect when domain gets approved */}
      {celebration && (
        <ApprovalCelebration
          show={celebration.show}
          type="domain"
          name={celebration.name}
          onDone={() => setCelebration(null)}
        />
      )}

      <DashboardNav userName={user.name} userAvatar={user.avatar} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">

            {/* Módulo Oficial de Pesquisa e Compra de Domínio (idêntico à Landing Page) */}
            <div className="bg-slate-900 rounded-3xl shadow-2xl p-5 sm:p-8 text-white relative overflow-hidden border border-slate-800">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center space-x-2 bg-primary-500/20 text-primary-300 border border-primary-500/30 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Pesquisador Oficial de Domínios WEHOSTHERE</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                    Pesquisar &amp; Registar Novo Domínio
                  </h1>
                  <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                    Verifique em tempo real a disponibilidade de extensões (.co.mz, .com, .org, .net...) e registe o seu domínio com ativação imediata.
                  </p>
                </div>

                <div className="pt-2">
                  <DomainSearch />
                </div>
              </div>
            </div>

            {/* Cabeçalho da Lista de Domínios Registados */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-primary-600" />
                  <span>Meus Domínios Configurados</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Lista de domínios activos, NameServers e estado de aprovação
                </p>
              </div>
              <Link
                href="/dashboard/sites"
                className="inline-flex items-center justify-center space-x-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-3 sm:px-4 py-2.5 rounded-xl transition shadow-sm whitespace-nowrap"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">+ Apontar Domínio Existente</span>
                <span className="inline sm:hidden">+ Apontar Domínio</span>
              </Link>
            </div>

            {/* Lista de Domínios */}
            {sites.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
                <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-500 mb-1">Nenhum domínio registado</h3>
                <p className="text-xs text-gray-400 mb-4">Adicione um site para começar a gerir o seu domínio</p>
                <Link
                  href="/dashboard/sites"
                  className="inline-flex items-center space-x-2 bg-primary-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-primary-700 transition"
                >
                  <Plus className="h-4 w-4" /><span>Adicionar Primeiro Site</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {sites.map((site) => (
                  <div key={site.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Header do domínio */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-100">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-center shrink-0">
                          <Globe className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-1">
                            <span className="font-extrabold text-gray-900 text-sm sm:text-base truncate">{site.domain}</span>
                            <StatusBadge status={site.status} />
                          </div>
                          <p className="text-xs text-gray-400 truncate">{site.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <a
                          href={`https://${site.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-primary-600 hover:text-primary-800 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 transition"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Visitar</span>
                        </a>
                        <Link
                          href="/dashboard/email"
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-gray-600 hover:text-primary-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 transition"
                        >
                          <span>Email</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ isOpen: true, id: site.id, domain: site.domain })}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-gray-200 cursor-pointer"
                          title="Eliminar Domínio"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Aviso se o domínio estiver em processamento / aguardando aprovação */}
                    {site.status === 'pending' && (
                      <div className="mx-4 sm:mx-5 mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong className="block font-bold text-amber-950">Domínio em Processamento (Aguardando Aprovação do Administrador):</strong>
                          <span>A nossa equipa técnica está a validar os registos e apontamentos deste domínio. Assim que for aprovado pelo administrador, o estado mudará para Ativo e os serviços ficarão totalmente operacionais.</span>
                        </div>
                      </div>
                    )}

                    {/* Nameservers */}
                    <div className="p-4 sm:p-5 bg-slate-50/60">
                      <div className="flex items-center space-x-2 mb-3">
                        <Server className="h-4 w-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Servidores de Nome (Nameservers)</span>
                        {site.status === 'active' ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle className="h-3 w-3" /><span>Propagado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <RefreshCw className="h-3 w-3 animate-spin" /><span>A propagar...</span>
                          </span>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {[NS1, NS2].map((ns, i) => (
                          <div key={ns} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2">
                            <div>
                              <span className="text-[10px] text-gray-400 font-semibold block">NS{i + 1}</span>
                              <span className="text-xs font-mono font-bold text-gray-800">{ns}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(ns)}
                              className="text-xs text-primary-600 hover:text-primary-800 font-bold flex items-center space-x-1 shrink-0 ml-2 cursor-pointer"
                            >
                              {copiedText === ns ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{copiedText === ns ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2 flex items-center space-x-1">
                        <Info className="h-3 w-3 shrink-0" />
                        <span>Configure estes nameservers no seu registador de domínio. A propagação pode demorar até 48h.</span>
                      </p>
                    </div>

                    {/* Info adicional */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 sm:p-5 text-xs text-gray-600 border-t border-gray-100">
                      <div>
                        <span className="text-gray-400 block font-medium">Registado em</span>
                        <span className="font-bold text-gray-900">{new Date(site.createdAt).toLocaleDateString('pt-MZ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Armazenamento</span>
                        <span className="font-bold text-gray-900">{site.storage} GB</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">SSL</span>
                        <span className={`font-bold ${site.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {site.status === 'active' ? '✓ Activo' : '⏳ Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Caixa informativa DNS */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center space-x-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
                <h3 className="font-bold text-blue-900 text-sm">Como apontar o seu domínio para a WEHOSTHERE</h3>
              </div>
              <ol className="space-y-1.5 text-xs text-blue-800 list-decimal list-inside">
                <li>Aceda ao painel do seu registador de domínio (ex: GoDaddy, Namecheap, Joker.com)</li>
                <li>Vá a <strong>DNS / Nameservers</strong> e escolha <strong>&quot;Usar nameservers personalizados&quot;</strong></li>
                <li>Substitua pelos nossos: <code className="bg-blue-100 px-1 rounded font-mono">ns1.wehosthere.com</code> e <code className="bg-blue-100 px-1 rounded font-mono">ns2.wehosthere.com</code></li>
                <li>Guarde e aguarde até <strong>48 horas</strong> para a propagação completa</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm?.isOpen}
        title="Eliminar Domínio"
        message={`Tem certeza que deseja ELIMINAR permanentemente o domínio "${deleteConfirm?.domain}"? Todos os serviços associados serão interrompidos.`}
        confirmText="Sim, Eliminar Domínio"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDeleteDomain}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <Toast
          type={toastMsg.type}
          title={toastMsg.title}
          message={toastMsg.message}
          onClose={() => setToastMsg(null)}
        />
      )}
      {/* Modal de Reautenticação para Exclusão de Domínio */}
      <ReauthenticationModal
        isOpen={showReauthDeleteDomain}
        onClose={() => { setShowReauthDeleteDomain(false); setPendingDeleteSite(null); }}
        userEmail={user?.email || session?.user?.email || ''}
        onSuccess={executeDeleteDomain}
        title="Reauthenticate"
        actionDescription={`Para confirmar a eliminação definitiva do domínio ${pendingDeleteSite?.domain || ''} e interrupção do DNS, insira o código enviado para `}
        lang="pt"
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Globe, Plus, Trash2, Settings, CheckCircle, Clock, XCircle,
  LayoutDashboard, Mail, Database, Settings as SettingsIcon, LogOut, Server, Sparkles, ArrowRight, Search, X, ShoppingBag, Layers
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, Site } from '@/lib/data';
import DashboardNav from '@/components/DashboardNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageLoader from '@/components/PageLoader';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { soundEffects } from '@/lib/soundEffects';

export default function SitesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteDomain, setNewSiteDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    setSites(dataManager.getSites(currentUser.email));
    setLoading(false);

    // Busca assíncrona inicial dos dados do servidor
    dataManager.fetchSitesAsync(currentUser.email).then((fetched) => {
      setSites(fetched);
    });

    // Polling a cada 60s em foco para sincronizar alterações de status do Admin em tempo real
    const refreshSites = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (currentUser?.email) {
        dataManager.fetchSitesAsync(currentUser.email).then((fetched) => {
          setSites(fetched);
        });
      }
    };

    const interval = setInterval(refreshSites, 60000);
    window.addEventListener('focus', refreshSites);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshSites);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router]);

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName || !newSiteDomain) return;

    try {
      const newSite = dataManager.addSite({
        name: newSiteName,
        domain: newSiteDomain,
        status: 'pending',
        storage: 0,
        bandwidth: 0,
        userEmail: user?.email
      });

      soundEffects.playToggleSiteSound(true);
      setSites([...sites, newSite]);
      setShowModal(false);
      setNewSiteName('');
      setNewSiteDomain('');
      setToastMsg({
        title: 'Solicitação de Domínio Enviada',
        message: `O domínio ${newSiteDomain} foi adicionado e encontra-se em processamento pela equipa WEHOSTHERE.`,
        type: 'success'
      });
    } catch (err: any) {
      setToastMsg({
        title: 'Domínio Já Registado',
        message: err?.message || `O domínio "${newSiteDomain}" já se encontra registado na plataforma por outro cliente.`,
        type: 'error'
      });
    }
  };

  // State de confirmação de exclusão customizado
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; domain?: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ title?: string; message: string; type: 'success' | 'error' } | null>(null);

  const confirmDeleteSite = () => {
    if (!deleteConfirm) return;
    try {
      const { id, domain } = deleteConfirm;
      soundEffects.playToggleSiteSound(false);
      dataManager.deleteSite(id, domain);
      setSites(prev => prev.filter(s => s.id !== id && s.domain !== domain));
      setDeleteConfirm(null);
      setToastMsg({ title: 'Site Removido', message: `O site ${domain || ''} foi permanentemente eliminado.`, type: 'success' });
    } catch (err) {
      console.error('Erro ao eliminar site:', err);
      setToastMsg({ title: 'Erro ao Eliminar', message: 'Ocorreu uma falha ao tentar eliminar o site. Tente novamente.', type: 'error' });
    }
  };

  const [copiedNS, setCopiedNS] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedNS(text);
      setTimeout(() => setCopiedNS(null), 2500);
    }
  };

  const getStatusIcon = (status: Site['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'suspended':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Em Processamento';
      case 'suspended':
        return 'Suspenso';
      default:
        return status;
    }
  };

  if (loading) {
    return <PageLoader text="A carregar os seus sites..." />;
  }

  if (isLoggingOut) {
    return <PageLoader text="A encerrar a sua sessão com segurança..." />;
  }

  if (!user) return null;

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      auth.logout();
      signOut({ callbackUrl: '/' });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Responsivo */}
      <DashboardNav userName={user.name} userAvatar={user.avatar} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Banner de Promoção */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-xl shadow-md p-4 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="inline-flex items-center space-x-1.5 bg-amber-900/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-amber-100">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span>Criação de Sites Chave na Mão</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-extrabold text-white leading-tight">Precisa de um site profissional para o seu negócio?</h2>
                <p className="text-amber-100 text-xs sm:text-sm">Escolha entre 18 categorias (Landing Page, Loja Virtual, ERP, SaaS, etc.) a partir de 12.000 MT.</p>
              </div>
              <Link
                href="/site-quote"
                className="flex items-center space-x-2 bg-white text-gray-900 hover:bg-gray-100 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow transition whitespace-nowrap cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <span>Consultar &amp; Solicitar</span>
                <ArrowRight className="h-4 w-4 text-amber-600" />
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meus Domínios &amp; Sites Hospedados</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Gerencie os domínios da sua empresa, aponte NameServers ou solicite um novo site profissional</p>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                  <Link
                    href="/site-quote"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-3 sm:px-3.5 py-2.5 rounded-xl transition whitespace-nowrap"
                  >
                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Solicitar Criação</span>
                  </Link>
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 bg-primary-600 text-white font-bold text-xs px-3 sm:px-4 py-2.5 rounded-xl hover:bg-primary-700 transition cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">+ Registar / Apontar Domínio</span>
                    <span className="inline sm:hidden">+ Apontar Domínio</span>
                  </button>
                </div>
              </div>

              {sites.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum domínio ou site configurado</h3>
                  <p className="text-gray-600 mb-4 text-sm max-w-md mx-auto">Registe um novo domínio, aponte um domínio que já comprou ou solicite a criação de um site profissional chave na mão.</p>
                  <div className="flex items-center justify-center space-x-3">
                    <Link
                      href="/dashboard/domains"
                      className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow transition text-sm"
                    >
                      <Search className="h-4 w-4" />
                      <span>Comprar / Registar Domínio</span>
                    </Link>
                    <button
                      onClick={() => setShowModal(true)}
                      className="flex items-center space-x-2 bg-primary-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-primary-700 transition text-sm cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Apontar Domínio Existente</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sites.map((site) => (
                    <div key={site.id} className="border border-gray-200 rounded-2xl p-4 sm:p-5 hover:bg-gray-50/50 transition bg-white shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <div className="bg-primary-50 border border-primary-100 p-2.5 sm:p-3 rounded-xl shrink-0">
                            <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base truncate">{site.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 font-mono truncate">{site.domain}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                          <StatusBadge status={site.status} />
                          <div className="flex items-center space-x-1 shrink-0">
                            <Link
                              href={`/dashboard/visual-builder?slug=${site.domain}`}
                              className="p-2 text-gray-500 hover:text-blue-600 transition hover:bg-blue-50 rounded-lg cursor-pointer"
                              title="Editar no Editor Visual Pro"
                            >
                              <Layers className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                            </Link>
                            <button className="p-2 text-gray-500 hover:text-primary-600 transition hover:bg-gray-100 rounded-lg cursor-pointer" title="Configurações">
                              <Settings className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ isOpen: true, id: site.id, domain: site.domain })}
                              className="p-2 text-gray-500 hover:text-red-600 transition hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Eliminar Site e Domínio"
                            >
                              <Trash2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Armazenamento</p>
                          <p className="font-semibold text-gray-900">{site.storage} GB</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tráfego</p>
                          <p className="font-semibold text-gray-900">{site.bandwidth} GB</p>
                        </div>
                      </div>

                      {site.status === 'pending' && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-amber-600 flex-shrink-0 animate-pulse" />
                          <span>
                            <strong>Registo de Domínio em Processamento:</strong> A equipe WEHOSTHERE está a configurar os servidores de nomes para activar este domínio.
                          </span>
                        </div>
                      )}

                      {/* Caixa de Apontamento DNS / Name Servers */}
                      <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50/80 p-3 rounded-xl border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1">
                            <Server className="h-3.5 w-3.5 text-primary-600" />
                            <span>Servidores de Nomes da WEHOSTHERE (DNS Pointers)</span>
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">Use na CIUEM ou Namecheap</span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-mono">
                            <span className="text-gray-800 font-bold">ns1.wehosthere.com</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('ns1.wehosthere.com')}
                              className="text-primary-600 hover:text-primary-700 font-sans text-[11px] font-bold px-2 py-0.5 rounded bg-primary-50 hover:bg-primary-100 transition cursor-pointer"
                            >
                              {copiedNS === 'ns1.wehosthere.com' ? 'Copiado ✓' : 'Copiar'}
                            </button>
                          </div>
                          <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-mono">
                            <span className="text-gray-800 font-bold">ns2.wehosthere.com</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('ns2.wehosthere.com')}
                              className="text-primary-600 hover:text-primary-700 font-sans text-[11px] font-bold px-2 py-0.5 rounded bg-primary-50 hover:bg-primary-100 transition cursor-pointer"
                            >
                              {copiedNS === 'ns2.wehosthere.com' ? 'Copiado ✓' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Adicionar / Apontar Domínio */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Configurar Domínio &amp; Hospedagem</h2>
                <p className="text-xs text-gray-500 mt-0.5">Adicione um domínio que já comprou ou registe um novo domínio oficial</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Opção 1: Comprar Domínio */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl mb-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">Ainda não comprou o domínio?</span>
                <p className="text-xs text-emerald-900 mt-0.5">Pesquise e registe extensões .co.mz, .com, .org directamente.</p>
              </div>
              <Link
                href="/dashboard/domains"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition whitespace-nowrap cursor-pointer shadow-xs shrink-0"
              >
                Comprar Domínio →
              </Link>
            </div>

            <form onSubmit={handleAddSite} className="space-y-4">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Apontar Domínio Existente</span>
                <p className="text-[11px] text-gray-500">Se já comprou o seu domínio noutro fornecedor, insira-o abaixo e aponte os NameServers para <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-900 font-bold">ns1.wehosthere.com</code> e <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-900 font-bold">ns2.wehosthere.com</code>.</p>
              </div>

              <div>
                <label htmlFor="siteName" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Nome da Empresa / Projeto
                </label>
                <input
                  id="siteName"
                  type="text"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                  placeholder="ex: Minha Empresa LDA"
                  required
                />
              </div>

              <div>
                <label htmlFor="siteDomain" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Endereço do Domínio (FQDN)
                </label>
                <input
                  id="siteDomain"
                  type="text"
                  value={newSiteDomain}
                  onChange={(e) => setNewSiteDomain(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-mono font-bold text-primary-700"
                  placeholder="ex: minhaempresa.co.mz"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold text-sm rounded-2xl hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-2xl transition cursor-pointer shadow-md"
                >
                  Confirmar &amp; Apontar Domínio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm?.isOpen}
        title="Eliminar Site e Domínio"
        message={`Tem certeza que deseja ELIMINAR permanentemente o site "${deleteConfirm?.domain}"? Todos os e-mails e ficheiros associados serão removidos.`}
        confirmText="Sim, Eliminar Site"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDeleteSite}
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
    </div>
  );
}

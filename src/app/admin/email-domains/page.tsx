'use client';
import { useState, useEffect } from 'react';

import { 
  ArrowLeft,
  ChevronRight,
  Plus, 
  Search, 
  MoreVertical, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Settings, 
  Mail, 
  Globe, 
  Zap, 
  CloudDownload, 
  Rocket, 
  Trash2, 
  ExternalLink, 
  Inbox, 
  Lock 
} from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { dataManager, EmailAccount } from '@/lib/data';
import { soundEffects } from '@/lib/soundEffects';

interface EmailDomain {
  _id: string;
  domainName: string;
  customerId: string;
  status: 'active' | 'pending_dns' | 'provisioning' | 'provisioning_failed' | 'suspended' | 'cancelled';
  provider: string;
  canSend: boolean;
  canReceive: boolean;
  activatedAt?: string;
  createdAt: string;
  updatedAt: string;
  diagnostics?: {
    overall: 'passed' | 'failed' | 'pending';
    checkedAt: string;
  };
}

export default function EmailDomainsPage() {
  const [domains, setDomains] = useState<EmailDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newCustomerId, setNewCustomerId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Quick Create State
  const [quickCreateData, setQuickCreateData] = useState({
    domainName: '',
    mailboxName: '', // e.g., info, suporte
    mailboxPassword: '',
    mailboxFullName: ''
  });
  const [isQuickCreating, setIsQuickCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [emailSearchTerm, setEmailSearchTerm] = useState('');
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (e) {
      console.warn('Erro ao carregar utilizadores:', e);
    }
  };

  useEffect(() => {
    fetchDomains();
    fetchEmailAccounts();
    fetchUsers();
    
    // Auto-initialize wehosthere.com for admin if it doesn't exist
    const autoInitialize = async () => {
      const user = auth.getCurrentUser();
      if (user && auth.isAdminUser(user)) {
        // Check if wehosthere.com already exists
        try {
          const response = await fetch('/api/email-providers/migadu/domains');
          const data = await response.json();
          if (data.success && data.domains) {
            const hasWehosthere = data.domains.some((d: any) => d.domainName === 'wehosthere.com');
            if (!hasWehosthere) {
              console.log('[Auto-init] wehosthere.com not found, initializing...');
              await handleInitializeDefault();
            }
          }
        } catch (error) {
          console.error('[Auto-init] Error checking for wehosthere.com:', error);
        }
      }
    };
    
    // Delay auto-init to avoid conflicts with initial fetch
    setTimeout(autoInitialize, 2000);

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchDomains();
      fetchEmailAccounts();
    }, 60000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmailAccounts = async () => {
    try {
      const res = await fetch('/api/emails');
      if (res.ok) {
        const data = await res.json();
        if (data.emails && Array.isArray(data.emails)) {
          setEmailAccounts(data.emails);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar contas de email:', e);
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleApproveEmail = async (emailAcc: EmailAccount) => {
    try {
      soundEffects.playApproveAccountSound();
      dataManager.updateEmailStatus(emailAcc.id, 'active');
      setEmailAccounts(prev => prev.map(e => e.id === emailAcc.id ? { ...e, status: 'active' } : e));
      setToast({ type: 'success', message: `E-mail ${emailAcc.email} ativado com sucesso!` });
    } catch (err) {
      soundEffects.playRejectAccountSound();
      setToast({ type: 'error', message: 'Erro ao ativar e-mail.' });
    }
  };

  const handleToggleEmailStatus = (emailAcc: EmailAccount) => {
    const newStatus = emailAcc.status === 'active' ? 'pending' : 'active';
    if (newStatus === 'active') {
      soundEffects.playApproveAccountSound();
    } else {
      soundEffects.playRejectAccountSound();
    }
    dataManager.updateEmailStatus(emailAcc.id, newStatus);
    setEmailAccounts(prev => prev.map(e => e.id === emailAcc.id ? { ...e, status: newStatus } : e));
    setToast({ type: 'success', message: `Status de ${emailAcc.email} atualizado para ${newStatus}.` });
  };

  const handleDeleteEmailAccount = (emailAcc: EmailAccount) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar a conta de e-mail ${emailAcc.email}?`)) return;
    soundEffects.playRejectAccountSound();
    dataManager.deleteEmail(emailAcc.id, emailAcc.userEmail, emailAcc.email);
    setEmailAccounts(prev => prev.filter(e => e.id !== emailAcc.id));
    setToast({ type: 'success', message: `Conta ${emailAcc.email} eliminada.` });
  };

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/email-providers/migadu/domains');
      const data = await response.json();
      if (data.success) {
        setDomains(data.domains);
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      setToast({ type: 'error', message: 'Failed to load domains' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName.trim()) {
      setToast({ type: 'error', message: 'Por favor, insira o nome do domínio.' });
      return;
    }

    setIsCreating(true);

    try {
      console.log('[Admin Email Domains] Iniciando criação de domínio:', newDomainName.trim());
      const response = await fetch('/api/email-providers/migadu/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: newDomainName.trim().toLowerCase(),
          customerId: newCustomerId || 'system',
          createDefaultAddresses: false
        })
      });

      const data = await response.json().catch(() => ({ error: 'Resposta inválida do servidor' }));
      
      if (response.ok && data.success) {
        console.log('[Admin Email Domains] [SUCESSO] Domínio processado:', data);
        setToast({ 
          type: 'success', 
          message: data.message || 'Domínio adicionado com sucesso!' 
        });
        setShowCreateModal(false);
        setNewDomainName('');
        setNewCustomerId('system');
        fetchDomains();
      } else {
        // Log estruturado informando se é erro normal ou falha de sistema
        if (data.isNormalError) {
          console.warn('[Admin Email Domains] [ERRO_NORMAL] Erro esperado de validação/duplicação:', {
            errorType: data.errorType,
            message: data.error,
            details: data.details,
            httpStatus: response.status
          });
        } else {
          console.error('[Admin Email Domains] [ERRO_SISTEMA] Falha técnica/servidor:', {
            errorType: data.errorType,
            message: data.error,
            details: data.details,
            httpStatus: response.status
          });
        }

        setToast({ 
          type: 'error', 
          message: data.error || `Erro (${response.status}): Falha ao criar domínio` 
        });
      }
    } catch (error) {
      console.error('[Admin Email Domains] [ERRO_REDE] Erro ao comunicar com a API:', error);
      setToast({ type: 'error', message: 'Erro de comunicação ao criar domínio. Verifique a rede.' });
    } finally {
      setIsCreating(false);
    }
  };

  // Generate automatic customer ID
  const generateCustomerId = (domainName: string) => {
    const cleanDomain = domainName.replace(/\./g, '-').toLowerCase();
    const timestamp = Date.now().toString(36);
    return `${cleanDomain}-${timestamp}`;
  };

  const handleSyncFromMigadu = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/email-providers/migadu/sync-all', { method: 'POST' });
      const data = await res.json();
      await fetchDomains();
      await fetchEmailAccounts();
      if (data.success) {
        setToast({ 
          type: 'success', 
          message: data.message || 'Todos os domínios e caixas foram sincronizados com a Migadu!' 
        });
      } else {
        setToast({ type: 'error', message: data.error || 'Erro ao sincronizar com a Migadu.' });
      }
    } catch (error) {
      console.error('Sync error:', error);
      setToast({ type: 'error', message: 'Erro ao sincronizar domínios com a Migadu.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteDomain = async (domainName: string) => {
    if (!window.confirm(`Tem a certeza que deseja apagar o domínio ${domainName}? Esta ação é irreversível e apagará todas as caixas de correio associadas.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setToast({ type: 'success', message: 'Domínio apagado com sucesso.' });
        fetchDomains();
      } else {
        setToast({ type: 'error', message: data.error || 'Erro ao apagar o domínio.' });
      }
    } catch (error) {
      console.error('Delete domain error:', error);
      setToast({ type: 'error', message: 'Erro ao apagar o domínio.' });
    }
  };

  const handleInitializeDefault = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch('/api/email-providers/migadu/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: 'wehosthere.com',
          createDefaultEmails: true
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setToast({ 
          type: 'success', 
          message: `Domínio wehosthere.com inicializado com sucesso! ${data.emails.length} emails criados.` 
        });
        fetchDomains();
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to initialize' });
      }
    } catch (error) {
      console.error('Initialize error:', error);
      setToast({ type: 'error', message: 'Erro ao inicializar domínio padrão.' });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsQuickCreating(true);

    try {
      // Use user's ID as customerId if user is logged in
      const currentUser = auth.getCurrentUser();
      const customerId = currentUser?.id || generateCustomerId(quickCreateData.domainName);
      
      // Step 1: Check if domain already exists in our database
      const checkDomainResponse = await fetch('/api/email-providers/migadu/domains');
      const checkDomainData = await checkDomainResponse.json();
      
      if (checkDomainData.success && checkDomainData.domains) {
        const existingDomain = checkDomainData.domains.find((d: any) => d.domainName === quickCreateData.domainName);
        if (existingDomain) {
          // Domain exists, try to create mailbox directly
          const mailboxResponse = await fetch(
            `/api/email-providers/migadu/domains/${quickCreateData.domainName}/mailboxes`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                localPart: quickCreateData.mailboxName,
                password: quickCreateData.mailboxPassword,
                name: quickCreateData.mailboxFullName,
                customerId: existingDomain.customerId,
                passwordMethod: 'generated'
              })
            }
          );

          const mailboxData = await mailboxResponse.json();
          
          if (mailboxData.success) {
            setToast({ 
              type: 'success', 
              message: `Mailbox ${quickCreateData.mailboxName}@${quickCreateData.domainName} created successfully! (Domain already existed)` 
            });
            setShowQuickCreateModal(false);
            setQuickCreateData({
              domainName: '',
              mailboxName: '',
              mailboxPassword: '',
              mailboxFullName: ''
            });
            fetchDomains();
          } else if (mailboxData.error && mailboxData.error.includes('already exists')) {
            setToast({ 
              type: 'error', 
              message: `O email ${quickCreateData.mailboxName}@${quickCreateData.domainName} já existe na Migadu. Por favor, escolha outro nome.` 
            });
          } else {
            setToast({ type: 'error', message: mailboxData.error || 'Failed to create mailbox' });
          }
          setIsQuickCreating(false);
          return;
        }
      }

      // Step 2: Create Domain (if doesn't exist)
      const domainResponse = await fetch('/api/email-providers/migadu/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: quickCreateData.domainName,
          customerId,
          createDefaultAddresses: false
        })
      });

      const domainData = await domainResponse.json();
      
      if (!domainData.success) {
        if (domainData.error && domainData.error.includes('already exists')) {
          setToast({ 
            type: 'error', 
            message: `O domínio ${quickCreateData.domainName} já existe na Migadu mas não está sincronizado. Por favor, contacte o suporte.` 
          });
        } else {
          setToast({ type: 'error', message: domainData.error || 'Failed to create domain' });
        }
        setIsQuickCreating(false);
        return;
      }

      // Step 3: Create Mailbox
      const mailboxResponse = await fetch(
        `/api/email-providers/migadu/domains/${quickCreateData.domainName}/mailboxes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            localPart: quickCreateData.mailboxName,
            password: quickCreateData.mailboxPassword,
            name: quickCreateData.mailboxFullName,
            customerId,
            passwordMethod: 'generated'
          })
        }
      );

      const mailboxData = await mailboxResponse.json();
      
      if (mailboxData.success) {
        setToast({ 
          type: 'success', 
          message: `Domain ${quickCreateData.domainName} e mailbox ${quickCreateData.mailboxName}@${quickCreateData.domainName} criados com sucesso!` 
        });
        setShowQuickCreateModal(false);
        setQuickCreateData({
          domainName: '',
          mailboxName: '',
          mailboxPassword: '',
          mailboxFullName: ''
        });
        fetchDomains();
      } else if (mailboxData.error && mailboxData.error.includes('already exists')) {
        setToast({ 
          type: 'error', 
          message: `O email ${quickCreateData.mailboxName}@${quickCreateData.domainName} já existe. Por favor, escolha outro nome.` 
        });
      } else {
        setToast({ type: 'error', message: mailboxData.error || 'Failed to create mailbox' });
      }
    } catch (error) {
      console.error('Quick Create error:', error);
      setToast({ type: 'error', message: 'Erro ao criar domínio e mailbox. Por favor, tente novamente.' });
    } finally {
      setIsQuickCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'pending_dns':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'provisioning':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'provisioning_failed':
      case 'suspended':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      active: { text: 'Active', className: 'bg-emerald-100 text-emerald-800' },
      pending_dns: { text: 'Pending DNS', className: 'bg-amber-100 text-amber-800' },
      provisioning: { text: 'Provisioning', className: 'bg-blue-100 text-blue-800' },
      provisioning_failed: { text: 'Failed', className: 'bg-red-100 text-red-800' },
      suspended: { text: 'Suspended', className: 'bg-red-100 text-red-800' },
      cancelled: { text: 'Cancelled', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusMap[status] || statusMap.cancelled;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const filteredDomains = domains.filter(domain => {
    const matchesSearch = domain.domainName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || domain.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50/70">
      {/* Header com Navegação Fácil e Botões Compactos */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
          {/* Barra Superior de Navegação / Voltar */}
          <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2 text-xs">
              <Link
                href="/admin"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-xl font-bold transition cursor-pointer"
                title="Voltar ao Painel Geral de Administração"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Painel</span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-500 font-medium">Gestão de E-mails</span>
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-900 font-bold">Domínios</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black border border-indigo-100">
                <Globe className="h-3.5 w-3.5" />
                <span>{domains.length} Domínios Registados</span>
              </span>
            </div>
          </div>

          {/* Linha Principal: Título & Ações Compactas */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
                <span>Domínios de E-mail</span>
                <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2.5 py-0.5 rounded-full">
                  Admin
                </span>
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Gestão e atribuição de domínios corporativos a clientes, DNS e sincronização com o provedor.
              </p>
            </div>

            {/* Ações Compactas e Proporcionais */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleInitializeDefault}
                disabled={isInitializing}
                title="Inicializar domínio padrão do sistema wehosthere.com"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <Rocket className={`h-3.5 w-3.5 ${isInitializing ? 'animate-pulse text-emerald-600' : 'text-emerald-700'}`} />
                <span>{isInitializing ? 'A inicializar...' : 'wehosthere.com'}</span>
              </button>

              <button
                onClick={handleSyncFromMigadu}
                disabled={isSyncing}
                title="Provisionar e sincronizar todos os domínios da plataforma diretamente na Migadu"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <CloudDownload className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-sky-600' : 'text-sky-700'}`} />
                <span>{isSyncing ? 'A sincronizar...' : 'Sincronizar Migadu'}</span>
              </button>

              <button
                onClick={() => setShowQuickCreateModal(true)}
                title="Criar domínio e caixa de e-mail num único passo"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Criação Rápida</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                title="Adicionar um novo domínio de e-mail"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Adicionar Domínio</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros e Pesquisa */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome de domínio ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50/50"
                />
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-gray-50/50 outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="active">✅ Ativo (Active)</option>
                <option value="pending_dns">⏳ Pendente DNS</option>
                <option value="provisioning">⚡ Aprovisionando</option>
                <option value="provisioning_failed">❌ Falha</option>
                <option value="suspended">🔒 Suspenso</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Domínios */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-gray-200 shadow-2xs space-y-3">
            <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
            <p className="text-xs font-bold text-gray-500">A carregar domínios e configurações...</p>
          </div>
        ) : filteredDomains.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xs border border-gray-200/80 p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Globe className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Nenhum domínio encontrado</h3>
              <p className="text-xs text-gray-500 mt-1">Comece por adicionar o seu primeiro domínio corporativo ou ajuste a pesquisa.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Domínio Agora</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xs border border-gray-200/80 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider">
                    Domínio &amp; Cliente Vinculado
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider">
                    Diagnóstico DNS
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider">
                    Data de Criação
                  </th>
                  <th className="px-6 py-3.5 text-right text-[11px] font-black text-gray-500 uppercase tracking-wider">
                    Ações Rápidas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDomains.map((domain) => (
                  <tr key={domain._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const assignedUser = users.find(u => 
                          (u.email && u.email.toLowerCase() === domain.customerId?.toLowerCase()) ||
                          u.id === domain.customerId ||
                          u._id === domain.customerId
                        );
                        return (
                          <div className="flex items-center">
                            <Globe className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                            <div>
                              <div className="text-sm font-bold text-gray-900">{domain.domainName}</div>
                              {domain.customerId && domain.customerId !== 'system' ? (
                                <div className="inline-flex items-center space-x-1 mt-0.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-bold">
                                  <span>👤</span>
                                  <span className="truncate max-w-[220px]">
                                    {assignedUser?.name ? `${assignedUser.name} (${assignedUser.email})` : domain.customerId}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-[11px] text-gray-400 font-medium mt-0.5 flex items-center space-x-1">
                                  <span>⚙️ Sistema / Não Vinculado</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(domain.status)}
                        <span className="ml-2">{getStatusBadge(domain.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {domain.diagnostics ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          domain.diagnostics.overall === 'passed' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : domain.diagnostics.overall === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {domain.diagnostics.overall.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Not checked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(domain.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/email-domains/${domain.domainName}/mailboxes`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold border border-purple-200 transition"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Caixas ({emailAccounts.filter(e => e.email.toLowerCase().endsWith(`@${domain.domainName.toLowerCase()}`)).length})</span>
                      </Link>
                      <Link
                        href={`/admin/email-domains/${domain.domainName}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold border border-gray-200 transition"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        <span>DNS & Config</span>
                      </Link>
                      <button 
                        onClick={() => handleDeleteDomain(domain.domainName)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar Domínio"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ───── TABELA COMPLETA DE CAIXAS DE E-MAIL (ADMIN & CLIENTES) ───── */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Inbox className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Todas as Contas de E-mail Criadas</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Acesse o Webmail, altere senhas, aprove ou suspenda contas de e-mail de todos os domínios
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar e-mail..."
                  value={emailSearchTerm}
                  onChange={(e) => setEmailSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white placeholder:text-gray-400 font-medium"
                />
              </div>
              <button
                onClick={() => setShowQuickCreateModal(true)}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:from-purple-700 hover:to-indigo-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Nova Caixa</span>
              </button>
            </div>
          </div>

          {loadingEmails ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 text-primary-600 animate-spin" />
            </div>
          ) : emailAccounts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-700">Nenhuma conta de e-mail criada ainda.</p>
              <p className="text-xs text-gray-400 mt-1">Use o botão &quot;Quick Create&quot; para criar o primeiro e-mail corporativo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Endereço de E-mail
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dono / Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Espaço Usado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações Rápidas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emailAccounts
                    .filter(e => !emailSearchTerm || e.email.toLowerCase().includes(emailSearchTerm.toLowerCase()) || (e.userEmail && e.userEmail.toLowerCase().includes(emailSearchTerm.toLowerCase())))
                    .map((acc) => {
                      const isPending = acc.status === 'pending' || !acc.status;
                      const isAdminEmail = acc.email.toLowerCase().includes('wehosthere.com');
                      return (
                        <tr key={acc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className={`p-1.5 rounded-lg ${isAdminEmail ? 'bg-amber-100 text-amber-800' : 'bg-primary-50 text-primary-600'}`}>
                                <Mail className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-mono font-bold text-gray-900 text-sm">{acc.email}</span>
                                {isAdminEmail && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {acc.userEmail || (isAdminEmail ? 'Administrador' : 'Cliente Plataforma')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                            {(acc as any).usedGB ? `${(acc as any).usedGB} GB Usado` : (acc as any).storageUsed ? `${(((acc as any).storageUsed) / (1024 * 1024)).toFixed(1)} MB Usado` : '0.0 MB Usado'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                              acc.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : acc.status === 'suspended'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {acc.status === 'active' ? '✓ Ativo' : acc.status === 'suspended' ? '🛑 Suspenso' : '⏰ Pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            {isPending && (
                              <button
                                onClick={() => handleApproveEmail(acc)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Aprovar</span>
                              </button>
                            )}
                            <a
                              href={`/webmail?email=${encodeURIComponent(acc.email)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 transition"
                              title="Abrir Webmail Oficial"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Webmail</span>
                            </a>
                            <button
                              onClick={() => handleToggleEmailStatus(acc)}
                              className="px-2 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition"
                            >
                              {acc.status === 'active' ? 'Suspender' : 'Ativar'}
                            </button>
                            <button
                              onClick={() => handleDeleteEmailAccount(acc)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Eliminar Conta de E-mail"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Domain Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden"
            style={{ colorScheme: 'light', color: '#111827' }}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ color: '#111827' }}>Add New Domain</h2>
              <form onSubmit={handleCreateDomain}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ color: '#374151' }}>
                    Domain Name
                  </label>
                  <input
                    type="text"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    placeholder="exemplo.co.mz"
                    required
                    style={{
                      color: '#000000',
                      WebkitTextFillColor: '#000000',
                      backgroundColor: '#ffffff',
                      colorScheme: 'light'
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-black bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-medium text-sm outline-none transition"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ color: '#374151' }}>
                    Cliente / Proprietário (Opcional)
                  </label>
                  <select
                    value={newCustomerId}
                    onChange={(e) => setNewCustomerId(e.target.value)}
                    style={{
                      color: '#000000',
                      WebkitTextFillColor: '#000000',
                      backgroundColor: '#ffffff',
                      colorScheme: 'light'
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-medium text-sm outline-none transition"
                  >
                    <option 
                      value="system" 
                      style={{ color: '#000000', WebkitTextFillColor: '#000000', backgroundColor: '#ffffff' }}
                    >
                      ⚙️ Sistema (Não Atribuído a Cliente)
                    </option>
                    {users.map((u) => (
                      <option 
                        key={u.id || u.email} 
                        value={u.email} 
                        style={{ color: '#000000', WebkitTextFillColor: '#000000', backgroundColor: '#ffffff' }}
                      >
                        👤 {u.name ? `${u.name} (${u.email})` : u.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-[12px] text-gray-500 mt-1.5" style={{ color: '#6b7280' }}>
                    Selecione o cliente que terá este domínio no seu painel ou deixe como Sistema.
                  </p>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      color: '#374151',
                      WebkitTextFillColor: '#374151',
                      backgroundColor: '#ffffff'
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 transition font-semibold text-sm shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    style={{
                      color: '#ffffff',
                      WebkitTextFillColor: '#ffffff'
                    }}
                    className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-sm shadow-xs disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Domain'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Modal */}
      {showQuickCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-100 overflow-hidden"
            style={{ colorScheme: 'light', color: '#111827' }}
          >
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900" style={{ color: '#111827' }}>Quick Create Email</h2>
                  <p className="text-sm text-gray-500" style={{ color: '#6b7280' }}>Create domain + mailbox in one step</p>
                </div>
              </div>
              <form onSubmit={handleQuickCreate}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ color: '#374151' }}>
                    Domain Name
                  </label>
                  <input
                    type="text"
                    value={quickCreateData.domainName}
                    onChange={(e) => setQuickCreateData({...quickCreateData, domainName: e.target.value})}
                    placeholder="empresa.co.mz"
                    required
                    style={{
                      color: '#000000',
                      WebkitTextFillColor: '#000000',
                      backgroundColor: '#ffffff',
                      colorScheme: 'light'
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-black bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium text-sm outline-none transition"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ color: '#374151' }}>
                    Mailbox Name (e.g., info, suporte, admin)
                  </label>
                  <input
                    type="text"
                    value={quickCreateData.mailboxName}
                    onChange={(e) => setQuickCreateData({...quickCreateData, mailboxName: e.target.value})}
                    placeholder="info"
                    required
                    style={{
                      color: '#000000',
                      WebkitTextFillColor: '#000000',
                      backgroundColor: '#ffffff',
                      colorScheme: 'light'
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-black bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium text-sm outline-none transition"
                  />
                  <p className="text-xs text-gray-500 mt-1" style={{ color: '#6b7280' }}>Email will be: {quickCreateData.mailboxName}@{quickCreateData.domainName || 'dominio.com'}</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ color: '#374151' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={quickCreateData.mailboxFullName}
                    onChange={(e) => setQuickCreateData({...quickCreateData, mailboxFullName: e.target.value})}
                    placeholder="João Silva"
                    required
                    style={{
                      color: '#000000',
                      WebkitTextFillColor: '#000000',
                      backgroundColor: '#ffffff',
                      colorScheme: 'light'
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-black bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium text-sm outline-none transition"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ color: '#374151' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={quickCreateData.mailboxPassword}
                    onChange={(e) => setQuickCreateData({...quickCreateData, mailboxPassword: e.target.value})}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    style={{
                      color: '#000000',
                      WebkitTextFillColor: '#000000',
                      backgroundColor: '#ffffff',
                      colorScheme: 'light'
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-black bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium text-sm outline-none transition"
                  />
                  <p className="text-xs text-gray-500 mt-1" style={{ color: '#6b7280' }}>Minimum 8 characters</p>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickCreateModal(false)}
                    style={{
                      color: '#374151',
                      WebkitTextFillColor: '#374151',
                      backgroundColor: '#ffffff'
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 transition font-semibold text-sm shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isQuickCreating}
                    style={{
                      color: '#ffffff',
                      WebkitTextFillColor: '#ffffff'
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 font-semibold text-sm shadow-md"
                  >
                    {isQuickCreating ? 'Creating...' : 'Create Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

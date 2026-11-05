'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Mail, 
  User, 
  Key, 
  ExternalLink, 
  Trash2,
  Smartphone,
  Laptop,
  Copy,
  Check,
  Server,
  Send,
  Inbox,
  Info,
  Sparkles,
  Settings,
  Download,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface EmailMailbox {
  _id: string;
  domainId: string;
  customerId: string;
  localPart: string;
  email: string;
  name: string;
  status: 'active' | 'suspended' | 'cancelled';
  provider: string;
  maySend: boolean;
  mayReceive: boolean;
  mayAccessImap: boolean;
  mayAccessPop3: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  storageUsed?: number;
  storageLimit?: number;
}

export default function DomainMailboxesPage() {
  const params = useParams();
  const domainName = params.domain as string;
  
  const [mailboxes, setMailboxes] = useState<EmailMailbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedMailboxForConfig, setSelectedMailboxForConfig] = useState<EmailMailbox | null>(null);
  const [activeClientTab, setActiveClientTab] = useState<'general' | 'outlook' | 'apple' | 'gmail' | 'thunderbird'>('general');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [newMailboxData, setNewMailboxData] = useState({
    name: '',
    localPart: '',
    password: '',
    passwordMethod: 'generated' as 'generated' | 'invitation',
    passwordRecoveryEmail: '',
    customerId: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchMailboxes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainName]);

  const fetchMailboxes = async () => {
    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}/mailboxes`);
      const data = await response.json();
      if (data.success) {
        setMailboxes(data.mailboxes);
      }
    } catch (error) {
      console.error('Failed to fetch mailboxes:', error);
      setToast({ type: 'error', message: 'Falha ao carregar caixas de e-mail' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleOpenConfigModal = (mailbox?: EmailMailbox) => {
    if (mailbox) {
      setSelectedMailboxForConfig(mailbox);
    } else if (mailboxes.length > 0) {
      setSelectedMailboxForConfig(mailboxes[0]);
    } else {
      setSelectedMailboxForConfig(null);
    }
    setShowConfigModal(true);
  };

  const handleCreateMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}/mailboxes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMailboxData)
      });

      const data = await response.json();
      
      if (data.success) {
        setToast({ type: 'success', message: 'Caixa de e-mail criada com sucesso!' });
        setShowCreateModal(false);
        setNewMailboxData({
          name: '',
          localPart: '',
          password: '',
          passwordMethod: 'generated',
          passwordRecoveryEmail: '',
          customerId: ''
        });
        fetchMailboxes();
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao criar caixa de e-mail' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Falha ao criar caixa de e-mail' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async (localPart: string) => {
    if (!confirm('Tem a certeza que deseja redefinir a senha desta caixa de correio?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/email-providers/migadu/domains/${domainName}/mailboxes/${localPart}/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setToast({ type: 'success', message: 'Instruções de redefinição enviadas com sucesso!' });
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao redefinir senha' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Falha ao redefinir senha' });
    }
  };

  const handleSuspendMailbox = async (localPart: string) => {
    if (!confirm('Tem a certeza que deseja suspender esta caixa de correio?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/email-providers/migadu/domains/${domainName}/mailboxes/${localPart}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maySend: false, mayReceive: false, status: 'suspended', is_disabled: true })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setToast({ type: 'success', message: 'Caixa de correio suspensa com sucesso!' });
        fetchMailboxes();
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao suspender caixa de correio' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Erro ao suspender caixa de correio' });
    }
  };

  const handleActivateMailbox = async (localPart: string) => {
    try {
      const response = await fetch(
        `/api/email-providers/migadu/domains/${domainName}/mailboxes/${localPart}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maySend: true, mayReceive: true, status: 'active', is_disabled: false })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setToast({ type: 'success', message: 'Caixa de correio reativada com sucesso!' });
        fetchMailboxes();
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao ativar caixa de correio' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Erro ao ativar caixa de correio' });
    }
  };

  const handleDeleteMailbox = async (localPart: string) => {
    if (!confirm(`Tem a certeza que deseja eliminar ${localPart}@${domainName}? Esta ação é irreversível.`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/email-providers/migadu/domains/${domainName}/mailboxes/${localPart}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setToast({ type: 'success', message: 'Caixa de e-mail eliminada com sucesso!' });
        fetchMailboxes();
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao eliminar caixa de e-mail' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Falha ao eliminar caixa de e-mail' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'suspended':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      active: { text: 'Ativo', className: 'bg-emerald-100 text-emerald-800' },
      suspended: { text: 'Suspenso', className: 'bg-red-100 text-red-800' },
      cancelled: { text: 'Cancelado', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusMap[status] || statusMap.cancelled;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const filteredMailboxes = mailboxes.filter(mailbox => {
    const matchesSearch = 
      mailbox.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mailbox.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || mailbox.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const currentEmailDisplay = selectedMailboxForConfig?.email || `seu-email@${domainName}`;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Link
                href={`/admin/email-domains/${domainName}`}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-xl text-xs font-bold transition shadow-2xs w-fit cursor-pointer"
                title="Voltar à configuração do domínio"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Domínio</span>
              </Link>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-gray-900">Caixas de E-mail</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 border border-primary-200">
                    {mailboxes.length} {mailboxes.length === 1 ? 'caixa' : 'caixas'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{domainName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => handleOpenConfigModal()}
                className="flex items-center space-x-1.5 bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-400 transition shadow-xs"
              >
                <Smartphone className="h-4 w-4 text-primary-600" />
                <span>Configurar Outlook &amp; Apps</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 transition shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Caixa</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Outlook & Mobile Connection Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-primary-900 text-white rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                <span>Compatível com Todos os Aplicativos</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Como conectar o e-mail no Outlook, Thunderbird ou Telemóvel?
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                Use os servidores seguros <strong>IMAP</strong> (entrada) e <strong>SMTP</strong> (saída) para sincronizar seus e-mails em tempo real no computador, iPhone ou Android.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setActiveClientTab('outlook');
                  handleOpenConfigModal();
                }}
                className="flex items-center space-x-2 bg-white text-gray-900 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-50 transition shadow-md"
              >
                <Laptop className="h-4 w-4 text-blue-600" />
                <span>Guia Microsoft Outlook</span>
              </button>

              <button
                onClick={() => {
                  setActiveClientTab('general');
                  handleOpenConfigModal();
                }}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition backdrop-blur-md"
              >
                <Server className="h-4 w-4" />
                <span>Ver Todos os Dados IMAP/SMTP</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Connection Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* IMAP Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-blue-300 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Inbox className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Servidor de Entrada (IMAP)</h3>
                  <p className="text-[11px] text-gray-500">Recomendado para sincronização</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                SSL / TLS
              </span>
            </div>

            <div className="space-y-2 bg-gray-50 rounded-xl p-3 text-xs border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Host:</span>
                <div className="flex items-center space-x-1.5 font-mono font-bold text-gray-800">
                  <span>imap.migadu.com</span>
                  <button
                    onClick={() => copyToClipboard('imap.migadu.com', 'quick_imap_host')}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-800 transition"
                    title="Copiar Host"
                  >
                    {copiedKey === 'quick_imap_host' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Porta:</span>
                <span className="font-mono font-bold text-gray-800">993</span>
              </div>
            </div>
          </div>

          {/* SMTP Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-emerald-300 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Servidor de Saída (SMTP)</h3>
                  <p className="text-[11px] text-gray-500">Envio de e-mails autenticado</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                SSL / TLS
              </span>
            </div>

            <div className="space-y-2 bg-gray-50 rounded-xl p-3 text-xs border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Host:</span>
                <div className="flex items-center space-x-1.5 font-mono font-bold text-gray-800">
                  <span>smtp.migadu.com</span>
                  <button
                    onClick={() => copyToClipboard('smtp.migadu.com', 'quick_smtp_host')}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-800 transition"
                    title="Copiar Host"
                  >
                    {copiedKey === 'quick_smtp_host' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Porta:</span>
                <span className="font-mono font-bold text-gray-800">465 (ou 587 STARTTLS)</span>
              </div>
            </div>
          </div>

          {/* Username / Login Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-amber-300 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Autenticação &amp; Login</h3>
                  <p className="text-[11px] text-gray-500">Regra de ouro para conectar</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                Obrigatório
              </span>
            </div>

            <div className="space-y-2 bg-gray-50 rounded-xl p-3 text-xs border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Utilizador:</span>
                <span className="font-semibold text-gray-800 text-[11px]">E-mail completo (com @)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Autenticação SMTP:</span>
                <span className="font-bold text-emerald-700">Sim (Mesma senha)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por e-mail ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-700"
            >
              <option value="all">Todos os Estados</option>
              <option value="active">Apenas Ativos</option>
              <option value="suspended">Apenas Suspensos</option>
            </select>
          </div>
        </div>

        {/* Mailboxes Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200">
            <RefreshCw className="h-8 w-8 text-primary-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-500">Carregando caixas de e-mail...</p>
          </div>
        ) : filteredMailboxes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-12 text-center space-y-4">
            <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
              <Mail className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Nenhuma caixa de e-mail encontrada</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Crie a primeira caixa de e-mail (ex: <code>info@{domainName}</code>) para começar a enviar e receber mensagens.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-700 transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Nova Caixa</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/75 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Caixa de Correio</th>
                    <th className="px-6 py-3.5 text-left">Estado</th>
                    <th className="px-6 py-3.5 text-left">Armazenamento</th>
                    <th className="px-6 py-3.5 text-left">Último Acesso</th>
                    <th className="px-6 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredMailboxes.map((mailbox) => (
                    <tr key={mailbox._id} className="hover:bg-blue-50/30 transition">
                      {/* Email & Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="h-9 w-9 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-sm border border-primary-100">
                            {mailbox.localPart.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                              <span>{mailbox.email}</span>
                              <button
                                onClick={() => copyToClipboard(mailbox.email, `table_email_${mailbox._id}`)}
                                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition"
                                title="Copiar endereço de e-mail"
                              >
                                {copiedKey === `table_email_${mailbox._id}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="text-xs text-gray-500 font-medium">{mailbox.name || mailbox.localPart}</div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(mailbox.status)}
                          {getStatusBadge(mailbox.status)}
                        </div>
                      </td>

                      {/* Storage */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {(() => {
                          const limitMB = (mailbox.storageLimit || 1) * 1024;
                          const rawStorage = mailbox.storageUsed || 0;
                          const usedMB = typeof rawStorage === 'number'
                            ? (rawStorage > 1024 * 1024 ? Math.round(rawStorage / (1024 * 1024)) : Math.round(rawStorage))
                            : 0;
                          const percentage = Math.min(100, Math.round((usedMB / limitMB) * 100));
                          const isCritical = percentage >= 90;
                          const isNearLimit = percentage >= 80 && percentage < 90;

                          return (
                            <div className="w-36">
                              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                <span className="text-gray-800">{usedMB} MB</span>
                                <span className="text-gray-400">/ {limitMB / 1024} GB</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isCritical ? 'bg-rose-500 animate-pulse' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.max(5, percentage)}%` }}
                                />
                              </div>
                              {isCritical && (
                                <span className="text-[10px] font-bold text-rose-600 block mt-0.5">🚨 Crítico ({percentage}%)</span>
                              )}
                              {isNearLimit && (
                                <span className="text-[10px] font-bold text-amber-600 block mt-0.5">⚠️ Alerta ({percentage}%)</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Last Login */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {mailbox.lastLoginAt 
                          ? new Date(mailbox.lastLoginAt).toLocaleDateString('pt-PT')
                          : 'Nunca acedeu'
                        }
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Config Outlook/App button */}
                          <button
                            onClick={() => handleOpenConfigModal(mailbox)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition border border-gray-200"
                            title="Ver dados de conexão para Outlook, iPhone ou Android"
                          >
                            <Smartphone className="h-3.5 w-3.5 text-primary-600" />
                            <span>Outlook &amp; Apps</span>
                          </button>

                          {/* Open Webmail */}
                          <a
                            href={`/webmail?email=${encodeURIComponent(mailbox.email)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
                            title="Abrir Webmail no navegador"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Webmail</span>
                          </a>

                          {/* Password Reset */}
                          <button
                            onClick={() => handleResetPassword(mailbox.localPart)}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                            title="Redefinir Senha"
                          >
                            <Key className="h-4 w-4" />
                          </button>

                          {/* Suspend / Activate */}
                          {mailbox.status === 'active' ? (
                            <button
                              onClick={() => handleSuspendMailbox(mailbox.localPart)}
                              className="px-2.5 py-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-semibold transition"
                              title="Suspender Caixa"
                            >
                              Suspender
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateMailbox(mailbox.localPart)}
                              className="px-2.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold transition"
                              title="Ativar Caixa"
                            >
                              Ativar
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteMailbox(mailbox.localPart)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                            title="Eliminar Caixa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: GUIA COMPLETO DE CONFIGURAÇÃO DE E-MAIL (OUTLOOK, IPHONE, ANDROID, THUNDERBIRD) */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-900 via-primary-950 to-gray-900 text-white p-6 relative flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-md">
                  <Settings className="h-3 w-3" />
                  <span>Manual de Conexão</span>
                </div>
                <h2 className="text-xl font-bold">Configurar E-mail em Aplicativos</h2>
                <p className="text-xs text-gray-300">
                  {selectedMailboxForConfig ? (
                    <span>Configurando a conta: <strong className="text-white font-mono">{selectedMailboxForConfig.email}</strong></span>
                  ) : (
                    <span>Guia universal para contas <strong>@{domainName}</strong></span>
                  )}
                </p>
              </div>

              <button
                onClick={() => setShowConfigModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50/80 px-6 pt-3 overflow-x-auto gap-2">
              <button
                onClick={() => setActiveClientTab('general')}
                className={`pb-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center space-x-1.5 ${
                  activeClientTab === 'general'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Server className="h-4 w-4" />
                <span>Dados do Servidor</span>
              </button>

              <button
                onClick={() => setActiveClientTab('outlook')}
                className={`pb-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center space-x-1.5 ${
                  activeClientTab === 'outlook'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Laptop className="h-4 w-4" />
                <span>MS Outlook</span>
              </button>

              <button
                onClick={() => setActiveClientTab('apple')}
                className={`pb-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center space-x-1.5 ${
                  activeClientTab === 'apple'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span>iPhone / Apple Mail</span>
              </button>

              <button
                onClick={() => setActiveClientTab('gmail')}
                className={`pb-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center space-x-1.5 ${
                  activeClientTab === 'gmail'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span>Android / Gmail App</span>
              </button>

              <button
                onClick={() => setActiveClientTab('thunderbird')}
                className={`pb-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center space-x-1.5 ${
                  activeClientTab === 'thunderbird'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Mail className="h-4 w-4" />
                <span>Thunderbird</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">

              {/* TAB 1: DADOS GERAIS DO SERVIDOR */}
              {activeClientTab === 'general' && (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3">
                    <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 leading-relaxed">
                      <strong>Atenção ao Nome de Utilizador:</strong> O nome de utilizador é <u>sempre o endereço de e-mail completo</u> (ex: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{currentEmailDisplay}</code>), e não apenas o primeiro nome!
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* IMAP SETTINGS */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-primary-700 font-bold">
                          <Inbox className="h-4 w-4" />
                          <span>Entrada de E-mail (IMAP)</span>
                        </div>
                        <span className="text-[10px] bg-primary-100 text-primary-800 font-bold px-2 py-0.5 rounded-full">Recomendado</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-200">
                          <span className="text-gray-500 font-medium">Servidor Host:</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-gray-900">imap.migadu.com</span>
                            <button
                              onClick={() => copyToClipboard('imap.migadu.com', 'modal_imap')}
                              className="p-1 hover:bg-gray-100 rounded text-gray-500"
                            >
                              {copiedKey === 'modal_imap' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-200">
                          <span className="text-gray-500 font-medium">Porta:</span>
                          <span className="font-mono font-bold text-gray-900">993</span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-200">
                          <span className="text-gray-500 font-medium">Segurança / SSL:</span>
                          <span className="font-bold text-emerald-600">SSL / TLS</span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-200">
                          <span className="text-gray-500 font-medium">Nome de Usuário:</span>
                          <span className="font-mono text-gray-900 font-bold text-[11px] truncate max-w-[140px]">{currentEmailDisplay}</span>
                        </div>
                      </div>
                    </div>

                    {/* SMTP SETTINGS */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-emerald-700 font-bold">
                          <Send className="h-4 w-4" />
                          <span>Envio de E-mail (SMTP)</span>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Autenticado</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-200">
                          <span className="text-gray-500 font-medium">Servidor Host:</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-gray-900">smtp.migadu.com</span>
                            <button
                              onClick={() => copyToClipboard('smtp.migadu.com', 'modal_smtp')}
                              className="p-1 hover:bg-gray-100 rounded text-gray-500"
                            >
                              {copiedKey === 'modal_smtp' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-200">
                          <span className="text-gray-500 font-medium">Porta:</span>
                          <span className="font-mono font-bold text-gray-900">465 (ou 587 STARTTLS)</span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-200">
                          <span className="text-gray-500 font-medium">Segurança / SSL:</span>
                          <span className="font-bold text-emerald-600">SSL / TLS</span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-200">
                          <span className="text-gray-500 font-medium">Autenticação:</span>
                          <span className="font-bold text-gray-900">Sim (Mesma senha do IMAP)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* POP3 Settings (Optional) */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="font-medium">Servidor alternativo POP3 (Download local sem sincronizar pastas):</span>
                      <span className="font-mono font-bold text-gray-800">pop.migadu.com (Porta 995 SSL/TLS)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MICROSOFT OUTLOOK */}
              {activeClientTab === 'outlook' && (
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-600 pl-4 py-1">
                    <h3 className="font-bold text-gray-900 text-base">Passo a Passo: Microsoft Outlook (Windows / Mac)</h3>
                    <p className="text-xs text-gray-500">Siga estes passos exatos no seu programa Outlook para conectar:</p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3 rounded-2xl flex items-center space-x-2.5">
                    <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                    <div className="text-[11px] text-blue-900 leading-tight">
                      <strong>Configuração Automática (Autodiscover):</strong> No Outlook moderno, basta digitar o e-mail completo e a senha. As portas e servidores são detetados automaticamente!
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                        <span>Abrir o assistente de nova conta</span>
                      </div>
                      <p className="text-gray-600 pl-7">
                        No Outlook, clique em <strong>Arquivo</strong> (File) no canto superior esquerdo &gt; <strong>Adicionar Conta</strong> (Add Account).
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                        <span>Configuração Manual</span>
                      </div>
                      <p className="text-gray-600 pl-7">
                        Digite seu e-mail completo (<code className="bg-white px-1.5 py-0.5 rounded border border-gray-300 font-mono text-blue-700 font-bold">{currentEmailDisplay}</code>), marque a opção <strong>&quot;Opções avançadas&quot;</strong> &gt; <strong>&quot;Configurar minha conta manualmente&quot;</strong> e clique em Conectar.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                        <span>Escolher o tipo de conta: IMAP</span>
                      </div>
                      <p className="text-gray-600 pl-7">
                        Na tela de opções de tipo de conta, selecione o ícone <strong>IMAP</strong>.
                      </p>
                    </div>

                    <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200 space-y-2">
                      <div className="font-bold text-blue-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">4</span>
                        <span>Preencher os Servidores (IMPORTANTE)</span>
                      </div>
                      <div className="pl-7 space-y-1.5 text-blue-950 font-medium">
                        <div>• <strong>Email de entrada:</strong> Servidor: <code className="bg-white px-1 rounded font-bold font-mono">imap.migadu.com</code> | Porta: <code className="bg-white px-1 rounded font-bold font-mono">993</code> | Criptografia: <strong className="text-blue-700">SSL/TLS</strong></div>
                        <div>• <strong>Email de saída:</strong> Servidor: <code className="bg-white px-1 rounded font-bold font-mono">smtp.migadu.com</code> | Porta: <code className="bg-white px-1 rounded font-bold font-mono">465</code> | Criptografia: <strong className="text-blue-700">SSL/TLS</strong></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">5</span>
                        <span>Digitar a Senha e Finalizar</span>
                      </div>
                      <p className="text-gray-600 pl-7">
                        Introduza a senha que definiu ao criar esta caixa de e-mail e clique em <strong>Conectar</strong>. O Outlook testará a conexão e adicionará a conta com sucesso!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: APPLE MAIL / IPHONE */}
              {activeClientTab === 'apple' && (
                <div className="space-y-4">
                  <div className="border-l-4 border-gray-900 pl-4 py-1">
                    <h3 className="font-bold text-gray-900 text-base">Passo a Passo: iPhone &amp; iPad (Apple Mail)</h3>
                    <p className="text-xs text-gray-500">Configuração direta no aplicativo Mail nativo do iOS:</p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <strong className="block text-xs font-bold text-blue-900">Instalação em 1-Clique (Apple Mail iOS &amp; Mac)</strong>
                      <span className="text-[11px] text-blue-700">Descarregue o perfil para configurar o iPhone sem digitar servidores.</span>
                    </div>
                    <a
                      href={`/api/emails/mobileconfig?email=${encodeURIComponent(currentEmailDisplay)}`}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition shadow-xs whitespace-nowrap self-start sm:self-auto"
                    >
                      <Download className="h-3 w-3" />
                      <span>Perfil Apple (.mobileconfig)</span>
                    </a>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px]">1</span>
                        <span>Acessar Ajustes do iPhone</span>
                      </div>
                      <p className="text-gray-600 pl-7">
                        Abra <strong>Ajustes</strong> (Settings) &gt; <strong>Mail</strong> &gt; <strong>Contas</strong> &gt; <strong>Adicionar Conta</strong>.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px]">2</span>
                        <span>Selecionar &quot;Outra&quot;</span>
                      </div>
                      <p className="text-gray-600 pl-7">
                        Toque em <strong>Outra</strong> &gt; <strong>Adicionar Conta de E-mail</strong>.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px]">3</span>
                        <span>Preencher Nome, E-mail e Senha</span>
                      </div>
                      <p className="text-gray-600 pl-7">
                        Digite seu Nome, o e-mail completo (<code className="bg-white px-1 rounded font-mono font-bold text-gray-900">{currentEmailDisplay}</code>) e a senha. Toque em <strong>Seguinte</strong>.
                      </p>
                    </div>

                    <div className="bg-gray-900 text-white rounded-2xl p-4 space-y-2">
                      <div className="font-bold flex items-center space-x-2 text-white">
                        <span className="h-5 w-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[10px]">4</span>
                        <span>Preencher Servidores de Entrada e Saída</span>
                      </div>
                      <div className="pl-7 space-y-2 text-gray-200 text-xs">
                        <div>
                          <strong className="text-primary-300">Servidor de Entrada:</strong>
                          <br />• Nome do Host: <code className="text-white font-bold font-mono">imap.migadu.com</code>
                          <br />• Nome de Usuário: seu e-mail completo
                          <br />• Senha: sua senha
                        </div>
                        <div>
                          <strong className="text-emerald-300">Servidor de Saída:</strong>
                          <br />• Nome do Host: <code className="text-white font-bold font-mono">smtp.migadu.com</code>
                          <br />• Nome de Usuário: seu e-mail completo <em>(Obrigatório preencher, não deixe em branco!)</em>
                          <br />• Senha: sua senha <em>(Obrigatório preencher)</em>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px]">5</span>
                        <span>Salvar</span>
                      </div>
                      <p className="text-gray-600 pl-7">
                        Toque em <strong>Salvar</strong>. Os e-mails começarão a sincronizar instantaneamente no aplicativo Mail do seu iPhone.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ANDROID / GMAIL APP */}
              {activeClientTab === 'gmail' && (
                <div className="space-y-4">
                  <div className="border-l-4 border-red-500 pl-4 py-1">
                    <h3 className="font-bold text-gray-900 text-base">Passo a Passo: Android &amp; App Gmail</h3>
                    <p className="text-xs text-gray-500">Como conectar no aplicativo Gmail oficial para Android:</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">1</span>
                        <span>Abrir o Gmail no Telemóvel</span>
                      </div>
                      <p className="text-gray-600 pl-7">
                        Abra o app Gmail &gt; Toque na foto do seu perfil no canto superior direito &gt; <strong>Adicionar outra conta</strong>.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">2</span>
                        <span>Selecionar &quot;Outra&quot; e Configuração Manual</span>
                      </div>
                      <p className="text-gray-600 pl-7">
                        Escolha <strong>Outra</strong> &gt; Digite seu e-mail (<code className="bg-white px-1 rounded font-mono font-bold">{currentEmailDisplay}</code>) &gt; Toque em <strong>Configuração Manual</strong> no canto inferior &gt; Escolha <strong>Pessoal (IMAP)</strong>.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">3</span>
                        <span>Configurações do Servidor de Entrada</span>
                      </div>
                      <div className="pl-7 space-y-1 text-gray-700">
                        <div>• Servidor: <code className="bg-white font-mono font-bold px-1 rounded border">imap.migadu.com</code></div>
                        <div>• Porta: <code className="bg-white font-mono font-bold px-1 rounded border">993</code> | Segurança: <strong>SSL/TLS</strong></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">4</span>
                        <span>Configurações do Servidor de Saída (SMTP)</span>
                      </div>
                      <div className="pl-7 space-y-1 text-gray-700">
                        <div>• Servidor SMTP: <code className="bg-white font-mono font-bold px-1 rounded border">smtp.migadu.com</code></div>
                        <div>• Porta: <code className="bg-white font-mono font-bold px-1 rounded border">465</code> | Segurança: <strong>SSL/TLS</strong></div>
                        <div>• <strong>Exigir login:</strong> Marcado / Ativado (com seu e-mail e senha)</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">5</span>
                        <span>Finalizar</span>
                      </div>
                      <p className="text-gray-600 pl-7">
                        Defina a frequência de sincronização como <strong>Automática (Push)</strong> e toque em Concluir.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: MOZILLA THUNDERBIRD */}
              {activeClientTab === 'thunderbird' && (
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 py-1">
                    <h3 className="font-bold text-gray-900 text-base">Passo a Passo: Mozilla Thunderbird</h3>
                    <p className="text-xs text-gray-500">Configuração no cliente gratuito Thunderbird:</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                        <span>Adicionar Conta de E-mail</span>
                      </div>
                      <p className="text-gray-600 pl-7">
                        Abra o Thunderbird &gt; Clique no menu &gt; <strong>Configurações de Conta</strong> &gt; <strong>Ações de Conta</strong> &gt; <strong>Adicionar Conta de E-mail</strong>.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                        <span>Configurar Manualmente</span>
                      </div>
                      <p className="text-gray-600 pl-7">
                        Preencha seu Nome, E-mail (<code className="bg-white px-1 font-mono font-bold">{currentEmailDisplay}</code>) e Senha. Clique no botão <strong>Configurar Manualmente</strong>.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                        <span>Parâmetros de Conexão</span>
                      </div>
                      <div className="pl-7 space-y-1.5 text-gray-700">
                        <div>• <strong>Entrada (IMAP):</strong> Host: <code className="font-mono font-bold bg-white px-1 rounded">imap.migadu.com</code> | Porta: <code className="font-mono font-bold bg-white px-1 rounded">993</code> | SSL: <strong>SSL/TLS</strong> | Autenticação: <strong>Senha normal</strong></div>
                        <div>• <strong>Saída (SMTP):</strong> Host: <code className="font-mono font-bold bg-white px-1 rounded">smtp.migadu.com</code> | Porta: <code className="font-mono font-bold bg-white px-1 rounded">465</code> | SSL: <strong>SSL/TLS</strong> | Autenticação: <strong>Senha normal</strong></div>
                        <div>• <strong>Nome de Usuário:</strong> O endereço de e-mail completo</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5">
                      <div className="font-bold text-gray-900 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">4</span>
                        <span>Testar e Concluir</span>
                      </div>
                      <p className="text-gray-600 pl-7">
                        Clique no botão <strong>Retestar</strong> e depois em <strong>Concluir</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 px-6 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Precisa de ajuda rápida? Use o <strong>Webmail online</strong> no botão verde da lista.
              </span>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2 bg-gray-900 text-white font-bold rounded-xl text-xs hover:bg-black transition shadow-xs"
              >
                Fechar Manual
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE MAILBOX MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-primary-900 to-gray-900 text-white p-6 relative flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Criar Caixa de E-mail</h2>
                <p className="text-xs text-primary-200 mt-1">Domínio: <strong>@{domainName}</strong></p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMailbox} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nome do Utilizador / Empresa
                </label>
                <input
                  type="text"
                  value={newMailboxData.name}
                  onChange={(e) => setNewMailboxData({ ...newMailboxData, name: e.target.value })}
                  placeholder="Ex: Geral, Suporte ou Nome da Pessoa"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Endereço de E-mail
                </label>
                <div className="flex rounded-xl overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
                  <input
                    type="text"
                    value={newMailboxData.localPart}
                    onChange={(e) => setNewMailboxData({ ...newMailboxData, localPart: e.target.value.replace(/@.*/, '').toLowerCase() })}
                    placeholder="info"
                    required
                    className="flex-1 px-3.5 py-2.5 text-sm focus:outline-none"
                  />
                  <span className="px-3.5 py-2.5 bg-gray-100 text-gray-600 text-sm font-semibold border-l border-gray-300 flex items-center">
                    @{domainName}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Digite apenas o nome da caixa (ex: <code>info</code>, <code>contacto</code>, <code>comercial</code>)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Método de Senha
                </label>
                <select
                  value={newMailboxData.passwordMethod}
                  onChange={(e) => setNewMailboxData({ ...newMailboxData, passwordMethod: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium"
                >
                  <option value="generated">Definir senha manualmente ou gerar</option>
                  <option value="invitation">Enviar convite por e-mail</option>
                </select>
              </div>

              {newMailboxData.passwordMethod === 'generated' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Senha da Caixa
                  </label>
                  <input
                    type="password"
                    value={newMailboxData.password}
                    onChange={(e) => setNewMailboxData({ ...newMailboxData, password: e.target.value })}
                    placeholder="Deixe em branco para gerar automaticamente"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    E-mail de Recuperação para Enviar Convite
                  </label>
                  <input
                    type="email"
                    value={newMailboxData.passwordRecoveryEmail}
                    onChange={(e) => setNewMailboxData({ ...newMailboxData, passwordRecoveryEmail: e.target.value })}
                    placeholder="usuario@gmail.com"
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  ID do Cliente / Referência
                </label>
                <input
                  type="text"
                  value={newMailboxData.customerId}
                  onChange={(e) => setNewMailboxData({ ...newMailboxData, customerId: e.target.value })}
                  placeholder="system"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 font-semibold text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 bg-primary-600 text-white font-bold rounded-xl text-xs hover:bg-primary-700 transition disabled:opacity-50 shadow-sm"
                >
                  {isCreating ? 'Criando...' : 'Criar Caixa de E-mail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl font-medium text-sm flex items-center space-x-2 ${
          toast.type === 'success' ? 'bg-gray-900 text-white border border-gray-800' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-white" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

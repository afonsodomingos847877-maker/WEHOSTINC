'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Settings,
  Mail,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Zap,
  ShieldCheck,
  HelpCircle,
  Server,
  KeyRound,
  FileCheck,
  Smartphone,
  Laptop,
  DownloadCloud,
  Shuffle,
  UserCheck,
  UserPlus,
  UserX,
  User,
  Send,
  Share2,
  Link2,
  Users,
  Trash2,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  priority?: number;
  ttl?: number;
  status: 'correct' | 'incorrect' | 'pending' | 'missing';
}

interface DNSDiagnostics {
  mx: { status: string; message: string };
  spf: { status: string; message: string };
  dkim: { status: string; message: string };
  dmarc: { status: string; message: string };
  overall: 'passed' | 'failed' | 'pending';
  checkedAt: string;
}

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
  dnsRecords?: DNSRecord[];
  diagnostics?: DNSDiagnostics;
}

export default function EmailDomainDetailPage() {
  const params = useParams();
  const domainName = params.domain as string;
  
  const [domain, setDomain] = useState<EmailDomain | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingDNS, setIsCheckingDNS] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isForcingActive, setIsForcingActive] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // User Assignment State
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Invitation State
  const [invitedEmail, setInvitedEmail] = useState('');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  useEffect(() => {
    fetchDomain();
    fetchUsers();
    fetchInvitations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainName]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (e) {
      console.warn('Erro ao carregar lista de utilizadores:', e);
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await fetch(`/api/email-domains/${domainName}/invite`);
      const data = await res.json();
      if (data.success && data.invitations) {
        setInvitations(data.invitations);
      }
    } catch (e) {
      console.warn('Erro ao carregar convites:', e);
    }
  };

  const handleAssignDomain = async () => {
    if (!selectedUserEmail || !selectedUserEmail.includes('@')) {
      setToast({ type: 'error', message: 'Selecione ou insira um utilizador válido' });
      return;
    }

    setIsAssigning(true);
    try {
      const res = await fetch(`/api/email-domains/${domainName}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserEmail: selectedUserEmail.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: `✅ ${data.message}` });
        fetchDomain();
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao atribuir domínio' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao conectar ao servidor' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignDomain = async () => {
    if (!window.confirm(`Tem a certeza que deseja desvincular o domínio ${domainName} do cliente atual e torná-lo do sistema?`)) {
      return;
    }

    setIsAssigning(true);
    try {
      const res = await fetch(`/api/email-domains/${domainName}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unassign', targetUserEmail: 'system' })
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: '✅ Domínio desvinculado com sucesso' });
        fetchDomain();
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao desvincular domínio' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao conectar ao servidor' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitedEmail || !invitedEmail.includes('@')) {
      setToast({ type: 'error', message: 'Insira um email válido para convidar' });
      return;
    }

    setIsGeneratingInvite(true);
    try {
      const res = await fetch(`/api/email-domains/${domainName}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitedEmail: invitedEmail.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedInviteLink(data.inviteLink);
        setToast({ type: 'success', message: 'Convite criado com sucesso!' });
        setInvitedEmail('');
        fetchInvitations();
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao criar convite' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao criar convite' });
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/email-domains/${domainName}/invite?id=${inviteId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: 'Convite revogado' });
        fetchInvitations();
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao revogar convite' });
    }
  };

  const fetchDomain = async () => {
    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}`);
      const data = await response.json();
      if (data.success) {
        setDomain(data.domain);
      }
    } catch (error) {
      console.error('Failed to fetch domain:', error);
      setToast({ type: 'error', message: 'Falha ao carregar detalhes do domínio' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCheckDNS = async () => {
    setIsCheckingDNS(true);
    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}/diagnostics`);
      const data = await response.json();
      if (data.success) {
        setToast({ type: 'success', message: 'Verificação DNS concluída com sucesso!' });
        fetchDomain();
      } else {
        setToast({ type: 'error', message: 'Verificação DNS falhou ou registos ainda não propagados' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Falha ao conectar com o verificador DNS' });
    } finally {
      setIsCheckingDNS(false);
    }
  };

  const handleActivateDomain = async () => {
    setIsActivating(true);
    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}/activate`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        if (data.activated) {
          setToast({ type: 'success', message: '✅ Domínio ativado com sucesso! Já pode criar caixas de e-mail.' });
        } else {
          setToast({ type: 'error', message: `⏳ ${data.message || 'DNS ainda não propagado. Aguarde 5-15 min e tente novamente.'}` });
        }
        fetchDomain();
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao ativar domínio' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Falha na requisição de ativação' });
    } finally {
      setIsActivating(false);
    }
  };

  const handleForceActive = async () => {
    if (!confirm(`Tem certeza que quer marcar ${domainName} como ATIVO sem verificação DNS? Use apenas se você já confirmou que o DNS está correto no seu provedor.`)) return;
    setIsForcingActive(true);
    try {
      const response = await fetch(`/api/email-providers/migadu/domains/${domainName}/diagnostics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceActive: true })
      });
      const data = await response.json();
      if (data.success) {
        setToast({ type: 'success', message: `${domainName} marcado como ATIVO com sucesso!` });
        fetchDomain();
      } else {
        setToast({ type: 'error', message: data.error || 'Falha ao ativar' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Erro ao forçar ativação' });
    } finally {
      setIsForcingActive(false);
    }
  };

  const getDNSStatusBadge = (status?: string) => {
    switch (status) {
      case 'correct':
      case 'passed':
      case 'ok':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Configurado</span>
          </span>
        );
      case 'incorrect':
      case 'missing':
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="h-3.5 w-3.5" />
            <span>Pendente</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            <span>Aguardando</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Domínio não encontrado</h2>
          <p className="text-gray-500 text-sm mb-6">Não foi possível carregar as informações do domínio {domainName}.</p>
          <Link
            href="/admin/email-domains"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium transition"
          >
            Voltar aos Domínios
          </Link>
        </div>
      </div>
    );
  }

  // Extract verification record if present in dnsRecords
  const foundVerifyRecord = domain.dnsRecords?.find(r => r.value && r.value.includes('hosted-email-verify'));
  const verifyRecord = {
    type: 'TXT',
    name: '@',
    value: foundVerifyRecord ? foundVerifyRecord.value : (domainName === 'abnafrobiznetwork.com' ? 'hosted-email-verify=rjmjxiun' : 'hosted-email-verify=...')
  };

  // Pre-formatted records if API returns generic or empty
  const mxRecords = [
    { type: 'MX', name: '@', priority: 10, value: 'aspmx1.migadu.com.' },
    { type: 'MX', name: '@', priority: 20, value: 'aspmx2.migadu.com.' },
  ];

  const spfRecord = {
    type: 'TXT',
    name: '@',
    value: 'v=spf1 include:spf.migadu.com ~all'
  };

  const dmarcRecord = {
    type: 'TXT',
    name: '_dmarc',
    value: 'v=DMARC1; p=none;'
  };

  const dkimRecords = [
    { type: 'CNAME', name: 'key1._domainkey', value: `key1.${domainName}._domainkey.migadu.com.` },
    { type: 'CNAME', name: 'key2._domainkey', value: `key2.${domainName}._domainkey.migadu.com.` },
    { type: 'CNAME', name: 'key3._domainkey', value: `key3.${domainName}._domainkey.migadu.com.` },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Link
                href="/admin/email-domains"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-xl text-xs font-bold transition shadow-2xs w-fit"
                title="Voltar à lista de domínios"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar aos Domínios</span>
              </Link>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">{domain.domainName}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    domain.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {domain.status === 'active' ? 'Ativo / Active' : 'Pendente DNS'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  Configuração de DNS e Autenticação de E-mail
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <button
                onClick={handleCheckDNS}
                disabled={isCheckingDNS}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 text-primary-600 ${isCheckingDNS ? 'animate-spin' : ''}`} />
                <span>{isCheckingDNS ? 'A verificar DNS...' : 'Verificar DNS'}</span>
              </button>
              
              {domain.status !== 'active' && (
                <>
                  <button
                    onClick={handleActivateDomain}
                    disabled={isActivating}
                    className="flex items-center space-x-2 bg-emerald-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{isActivating ? 'A ativar...' : 'Ativar Domínio'}</span>
                  </button>
                  <button
                    onClick={handleForceActive}
                    disabled={isForcingActive}
                    title="Forçar ativação manual caso o DNS já esteja correto no provedor"
                    className="flex items-center space-x-1.5 bg-amber-500 text-white font-semibold text-sm px-3.5 py-2.5 rounded-xl hover:bg-amber-600 transition shadow-xs disabled:opacity-50"
                  >
                    <Zap className="h-4 w-4" />
                    <span>{isForcingActive ? '...' : 'Forçar Ativo'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Banner Didático de Instruções */}
        <div className="bg-gradient-to-r from-primary-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
              <HelpCircle className="h-3.5 w-3.5 text-primary-200" />
              <span>Instruções Passo a Passo para Leigos</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Como configurar o DNS do seu domínio em 4 passos simples
            </h2>
            <p className="text-primary-100 text-sm leading-relaxed">
              Aceda ao painel onde comprou o domínio (ex: <strong>TurboHost</strong>, <strong>cPanel</strong>, <strong>Cloudflare</strong> ou <strong>Namecheap</strong>), vá até a seção <strong>Zona DNS / Editor DNS</strong> e copie exatamente os valores abaixo em sequência:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* DNS Steps (Col 1 & 2) */}
          <div className="lg:col-span-2 space-y-6">

            {/* ───── VÍNCULO & ATRIBUIÇÃO DE PROPRIETÁRIO (ACESSO DO CLIENTE) ───── */}
            <div className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 rounded-3xl shadow-sm border border-indigo-200/80 p-6 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 flex items-center space-x-2">
                      <span>Propriedade &amp; Acesso do Cliente</span>
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        Gestão de Acesso
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Defina quem é o utilizador que terá acesso a este domínio e aos seus e-mails no painel.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {domain.customerId && domain.customerId !== 'system' ? (
                    <div className="flex items-center space-x-2 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                      <span className="text-[11px] text-emerald-800 font-bold">Vinculado a Cliente</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 bg-gray-100 px-3.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-gray-400 shrink-0"></span>
                      <span className="text-[11px] text-gray-600 font-semibold">Sistema (Não Vinculado)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card de Destaque do Proprietário Atual */}
              {domain.customerId && domain.customerId !== 'system' ? (
                (() => {
                  const assignedUser = users.find(u => 
                    (u.email && u.email.toLowerCase() === domain.customerId?.toLowerCase()) ||
                    u.id === domain.customerId ||
                    u._id === domain.customerId
                  );
                  return (
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-indigo-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                          {assignedUser?.name ? assignedUser.name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 mb-0.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Cliente Vinculado</span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.2 rounded-full">
                              Ativo no Painel
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
                            {assignedUser?.name || 'Cliente Registado'}
                          </h4>
                          <p className="text-xs font-mono text-indigo-700 font-semibold truncate">
                            {assignedUser?.email || domain.customerId}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleUnassignDomain}
                        disabled={isAssigning}
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition cursor-pointer flex items-center justify-center space-x-1.5 self-start sm:self-auto shrink-0 disabled:opacity-50"
                        title="Desvincular domínio e retornar para o sistema"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        <span>Desvincular Domínio</span>
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="bg-amber-50/90 rounded-2xl p-4 border border-amber-200/90 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg shrink-0">
                      ⚠️
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wide">
                        Domínio Pertencente ao Sistema
                      </h4>
                      <p className="text-xs text-amber-800">
                        Este domínio não está associado a nenhum cliente. Selecione um utilizador abaixo para vinculá-lo.
                      </p>
                    </div>
                  </div>
                  <span className="bg-white text-amber-800 border border-amber-200 text-[11px] font-bold px-3 py-1 rounded-full shrink-0">
                    Livre
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Atribuir a Utilizador Existente */}
                <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-xs space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                      <UserCheck className="h-4 w-4 text-indigo-600" />
                      <span>1. Vincular a Utilizador Existente</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Se o cliente já tem conta criada no WEHOSTHERE, selecione-o abaixo para transferir o domínio e todas as caixas.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <select
                      value={selectedUserEmail}
                      onChange={(e) => setSelectedUserEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">Selecione um utilizador registado...</option>
                      {users.map((u) => (
                        <option key={u.id || u.email} value={u.email}>
                          {u.name ? `${u.name} (${u.email})` : u.email}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAssignDomain}
                      disabled={!selectedUserEmail || isAssigning}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>{isAssigning ? 'A vincular...' : (domain.customerId && domain.customerId !== 'system' ? 'Atualizar / Transferir Vínculo' : 'Atribuir Domínio e E-mails')}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Convidar Novo Cliente (Pré-provisionamento) */}
                <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-extrabold text-purple-950 uppercase tracking-wider">
                      <UserPlus className="h-4 w-4 text-purple-600" />
                      <span>2. Convidar Novo Utilizador (Link)</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Crie o domínio antes do cliente ter conta. Gere um link de convite exclusivo para ele se registar já com o domínio vinculado.
                    </p>
                  </div>

                  <form onSubmit={handleCreateInvite} className="space-y-2.5">
                    <input
                      type="email"
                      placeholder="email.do.cliente@empresa.com"
                      value={invitedEmail}
                      onChange={(e) => setInvitedEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
                    />

                    <button
                      type="submit"
                      disabled={!invitedEmail || isGeneratingInvite}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>{isGeneratingInvite ? 'A gerar...' : 'Gerar Link de Convite'}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Link de Convite Gerado Recentemente */}
              {generatedInviteLink && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span className="flex items-center space-x-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>Link de Convite Criado com Sucesso!</span>
                    </span>
                    <span className="text-[10px] text-emerald-700">Válido por 7 dias</span>
                  </div>
                  <div className="flex items-center justify-between bg-white border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-mono text-gray-800">
                    <span className="truncate mr-2 text-[11px]">{generatedInviteLink}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedInviteLink, 'invite_link_direct')}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex items-center space-x-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'invite_link_direct' ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Tabela / Lista de Convites Ativos */}
              {invitations.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                    <Link2 className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Convites Registados para este Domínio ({invitations.length})</span>
                  </span>

                  <div className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-200 overflow-hidden text-xs">
                    {invitations.map((inv) => {
                      const isPending = inv.status === 'pending';
                      const link = `https://wehosthere.com/register?inviteToken=${inv.token}&email=${encodeURIComponent(inv.invitedEmail)}`;
                      return (
                        <div key={inv._id} className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-gray-900">{inv.invitedEmail}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'accepted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : inv.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {inv.status === 'accepted' ? '✓ Resgatado' : inv.status === 'pending' ? '⏳ Aguardando Registo' : inv.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400">
                              Criado em {new Date(inv.createdAt).toLocaleDateString('pt-MZ')}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 self-end sm:self-center">
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleCopy(link, `inv_table_${inv._id}`)}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                              >
                                {copiedKey === `inv_table_${inv._id}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>Copiar Link</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRevokeInvite(inv._id)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                              title="Remover / Revogar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* PASSO 0: REGISTO DE VERIFICAÇÃO */}
            <div className="bg-white rounded-2xl shadow-xs border border-blue-200 p-6 space-y-4 ring-2 ring-blue-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm">
                    ★
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                      <span>Passo Essencial: Registo de Verificação TXT</span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Vincula este domínio à sua conta Migadu para autorizar a ativação.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-blue-700 text-white text-[11px] font-bold rounded-md">
                    {verifyRecord.type}
                  </span>
                  <span className="text-xs font-bold text-blue-900">
                    Obrigatório para Ativação
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="sm:col-span-1">
                    <span className="text-gray-400 block font-medium mb-1">Nome / Host:</span>
                    <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                      <span>{verifyRecord.name}</span>
                      <button
                        onClick={() => handleCopy(verifyRecord.name, 'verify_name')}
                        className="text-gray-400 hover:text-gray-700"
                        title="Copiar Nome"
                      >
                        {copiedKey === 'verify_name' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-400 block font-medium mb-1">Valor / Conteúdo TXT:</span>
                    <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                      <span className="truncate mr-2 font-bold text-blue-900">{verifyRecord.value}</span>
                      <button
                        onClick={() => handleCopy(verifyRecord.value, 'verify_val')}
                        className="text-gray-400 hover:text-gray-700 shrink-0"
                        title="Copiar Valor"
                      >
                        {copiedKey === 'verify_val' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PASSO 1: REGISTOS MX */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-primary-100 text-primary-700 font-black flex items-center justify-center text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                      <span>Passo 1: Registos MX (Recebimento de E-mails)</span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Diz para onde os e-mails enviados para <strong>@{domainName}</strong> devem ser entregues.
                    </p>
                  </div>
                </div>
                {getDNSStatusBadge(domain.diagnostics?.mx?.status)}
              </div>

              <div className="space-y-3">
                {mxRecords.map((rec, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-primary-700 text-white text-[11px] font-bold rounded-md">
                          {rec.type}
                        </span>
                        <span className="text-xs font-semibold text-gray-700">
                          Prioridade: <strong className="text-primary-600">{rec.priority}</strong>
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 block font-medium mb-1">Nome / Host:</span>
                        <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                          <span>{rec.name}</span>
                          <button
                            onClick={() => handleCopy(rec.name, `mx_name_${idx}`)}
                            className="text-gray-400 hover:text-gray-700"
                            title="Copiar Nome"
                          >
                            {copiedKey === `mx_name_${idx}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium mb-1">Valor / Destino:</span>
                        <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                          <span className="truncate mr-2">{rec.value}</span>
                          <button
                            onClick={() => handleCopy(rec.value, `mx_val_${idx}`)}
                            className="text-gray-400 hover:text-gray-700 shrink-0"
                            title="Copiar Valor"
                          >
                            {copiedKey === `mx_val_${idx}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PASSO 2: REGISTO SPF */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Passo 2: Registo SPF (Autorização de Envio TXT)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Autoriza o envio de e-mails em nome do seu domínio para evitar cair no SPAM.
                    </p>
                  </div>
                </div>
                {getDNSStatusBadge(domain.diagnostics?.spf?.status)}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[11px] font-bold rounded-md">
                    {spfRecord.type}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="sm:col-span-1">
                    <span className="text-gray-400 block font-medium mb-1">Nome / Host:</span>
                    <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                      <span>{spfRecord.name}</span>
                      <button
                        onClick={() => handleCopy(spfRecord.name, 'spf_name')}
                        className="text-gray-400 hover:text-gray-700"
                        title="Copiar Nome"
                      >
                        {copiedKey === 'spf_name' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-400 block font-medium mb-1">Valor / Conteúdo TXT:</span>
                    <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                      <span className="truncate mr-2">{spfRecord.value}</span>
                      <button
                        onClick={() => handleCopy(spfRecord.value, 'spf_val')}
                        className="text-gray-400 hover:text-gray-700 shrink-0"
                        title="Copiar Valor"
                      >
                        {copiedKey === 'spf_val' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PASSO 3: REGISTO DMARC */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-purple-100 text-purple-700 font-black flex items-center justify-center text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Passo 3: Registo DMARC (Proteção Anti-Fraude TXT)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Protege o domínio contra golpistas tentando falsificar o seu e-mail.
                    </p>
                  </div>
                </div>
                {getDNSStatusBadge(domain.diagnostics?.dmarc?.status)}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-[11px] font-bold rounded-md">
                    {dmarcRecord.type}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="sm:col-span-1">
                    <span className="text-gray-400 block font-medium mb-1">Nome / Host:</span>
                    <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                      <span>{dmarcRecord.name}</span>
                      <button
                        onClick={() => handleCopy(dmarcRecord.name, 'dmarc_name')}
                        className="text-gray-400 hover:text-gray-700"
                        title="Copiar Nome"
                      >
                        {copiedKey === 'dmarc_name' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-400 block font-medium mb-1">Valor / Conteúdo TXT:</span>
                    <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                      <span className="truncate mr-2">{dmarcRecord.value}</span>
                      <button
                        onClick={() => handleCopy(dmarcRecord.value, 'dmarc_val')}
                        className="text-gray-400 hover:text-gray-700 shrink-0"
                        title="Copiar Valor"
                      >
                        {copiedKey === 'dmarc_val' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PASSO 4: REGISTOS DKIM */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Passo 4: Registos DKIM (Assinaturas Criptográficas)
                    </h3>
                    <p className="text-xs text-gray-500">
                      3 Chaves CNAME para garantir que o e-mail não foi adulterado no caminho.
                    </p>
                  </div>
                </div>
                {getDNSStatusBadge(domain.diagnostics?.dkim?.status)}
              </div>

              <div className="space-y-3">
                {dkimRecords.map((rec, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-amber-600 text-white text-[11px] font-bold rounded-md">
                        {rec.type}
                      </span>
                      <span className="text-xs font-semibold text-gray-700">
                        Chave {idx + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="sm:col-span-1">
                        <span className="text-gray-400 block font-medium mb-1">Nome / Host:</span>
                        <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                          <span className="truncate mr-2">{rec.name}</span>
                          <button
                            onClick={() => handleCopy(rec.name, `dkim_name_${idx}`)}
                            className="text-gray-400 hover:text-gray-700 shrink-0"
                            title="Copiar Nome"
                          >
                            {copiedKey === `dkim_name_${idx}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-gray-400 block font-medium mb-1">Valor / Destino CNAME:</span>
                        <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                          <span className="truncate mr-2">{rec.value}</span>
                          <button
                            onClick={() => handleCopy(rec.value, `dkim_val_${idx}`)}
                            className="text-gray-400 hover:text-gray-700 shrink-0"
                            title="Copiar Valor"
                          >
                            {copiedKey === `dkim_val_${idx}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PASSO 5: AUTODISCOVER & AUTOCONFIG (DESCOBERTA AUTOMÁTICA) */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-cyan-100 text-cyan-800 font-black flex items-center justify-center text-sm">
                    5
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                      <span>Passo 5: Descoberta Automática (Outlook & Thunderbird)</span>
                      <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2 py-0.5 rounded-full uppercase">Zero-Config</span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Permite que o Outlook, Android e Thunderbird configurem a conta sozinhos só com o e-mail e senha.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Opcional / Recomendado
                </span>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-cyan-600 text-white text-[11px] font-bold rounded-md">CNAME</span>
                    <span className="text-xs font-semibold text-gray-700">Microsoft Outlook & Celular (Autodiscover)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="sm:col-span-1">
                      <span className="text-gray-400 block font-medium mb-1">Nome / Host:</span>
                      <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                        <span>autodiscover</span>
                        <button
                          onClick={() => handleCopy('autodiscover', 'auto_disc_name')}
                          className="text-gray-400 hover:text-gray-700"
                          title="Copiar Nome"
                        >
                          {copiedKey === 'auto_disc_name' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-400 block font-medium mb-1">Valor / Destino CNAME:</span>
                      <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                        <span className="truncate mr-2">wehosthere.com</span>
                        <button
                          onClick={() => handleCopy('wehosthere.com', 'auto_disc_val')}
                          className="text-gray-400 hover:text-gray-700 shrink-0"
                          title="Copiar Valor"
                        >
                          {copiedKey === 'auto_disc_val' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-cyan-600 text-white text-[11px] font-bold rounded-md">CNAME</span>
                    <span className="text-xs font-semibold text-gray-700">Mozilla Thunderbird & K-9 Mail (Autoconfig)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="sm:col-span-1">
                      <span className="text-gray-400 block font-medium mb-1">Nome / Host:</span>
                      <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                        <span>autoconfig</span>
                        <button
                          onClick={() => handleCopy('autoconfig', 'auto_cfg_name')}
                          className="text-gray-400 hover:text-gray-700"
                          title="Copiar Nome"
                        >
                          {copiedKey === 'auto_cfg_name' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-400 block font-medium mb-1">Valor / Destino CNAME:</span>
                      <div className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg font-mono text-gray-800">
                        <span className="truncate mr-2">wehosthere.com</span>
                        <button
                          onClick={() => handleCopy('wehosthere.com', 'auto_cfg_val')}
                          className="text-gray-400 hover:text-gray-700 shrink-0"
                          title="Copiar Valor"
                        >
                          {copiedKey === 'auto_cfg_val' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PASSO 6: SERVIDORES DE ENTRADA & SAÍDA (OUTLOOK / CLIENTES DE E-MAIL) */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm">
                    6
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Passo 6: Servidores de Entrada & Saída (Configuração de Clientes)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Dados que o cliente ou suporte técnico insere no Outlook ou telemóvel.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Compatibilidade Total
                </span>
              </div>

              {/* Opção Oficial Migadu */}
              <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span>Opção 1: Configuração Oficial Migadu (Recomendada)</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Sem risco de certificado
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
                    <p className="font-bold text-gray-700 mb-1">Servidor IMAP (Entrada):</p>
                    <p className="font-mono text-gray-900 font-bold">imap.migadu.com</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">Porta: <strong className="text-gray-800">993</strong> • SSL/TLS</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
                    <p className="font-bold text-gray-700 mb-1">Servidor SMTP (Saída):</p>
                    <p className="font-mono text-gray-900 font-bold">smtp.migadu.com</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">Porta: <strong className="text-gray-800">465</strong> (SSL/TLS) ou 587 (STARTTLS)</p>
                  </div>
                </div>
              </div>

              {/* Opção Hostnames Próprios */}
              <div className="border border-gray-200 bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary-500"></span>
                    <span>Opção 2: Hostnames Próprios (mail.{domainName} & smtp.{domainName})</span>
                  </span>
                  <span className="text-[11px] font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full">
                    Via Proxy WeHostHere
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Para os clientes que preferem ver o próprio domínio no Outlook sem aviso de certificado SSL, as ligações são roteadas via gateway TCP dedicado:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="font-bold text-gray-700 mb-1">IMAP Personalizado:</p>
                    <p className="font-mono text-primary-700 font-bold">mail.{domainName}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">Porta: <strong className="text-gray-800">993</strong> • SSL/TLS</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="font-bold text-gray-700 mb-1">SMTP Personalizado:</p>
                    <p className="font-mono text-primary-700 font-bold">smtp.{domainName}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">Porta: <strong className="text-gray-800">465</strong> • SSL/TLS</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar (Col 3) */}
          <div className="space-y-6">

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-3">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                Ações Rápidas
              </h3>
              <div className="space-y-2">
                <Link
                  href={`/admin/email-domains/${domainName}/mailboxes`}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-primary-50 hover:text-primary-700 text-gray-700 font-semibold text-sm transition border border-gray-200 hover:border-primary-200"
                >
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-primary-600" />
                    <span>Gerenciar Caixas de E-mail</span>
                  </div>
                  <span className="text-xs bg-white px-2 py-0.5 rounded-md border border-gray-200 font-bold">
                    Abrir
                  </span>
                </Link>

                <Link
                  href={`/admin/email-domains/${domainName}/migration`}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-900 text-emerald-800 font-semibold text-sm transition border border-emerald-200"
                >
                  <div className="flex items-center space-x-3">
                    <DownloadCloud className="h-5 w-5 text-emerald-600" />
                    <span>Importar E-mails Antigos</span>
                  </div>
                  <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold">
                    Migrar
                  </span>
                </Link>

                <Link
                  href={`/admin/email-domains/${domainName}/aliases`}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-purple-50/70 hover:bg-purple-100 hover:text-purple-900 text-purple-800 font-semibold text-sm transition border border-purple-200"
                >
                  <div className="flex items-center space-x-3">
                    <Shuffle className="h-5 w-5 text-purple-600" />
                    <span>Pseudónimos &amp; Aliases</span>
                  </div>
                  <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-md font-bold">
                    Novo
                  </span>
                </Link>

                <Link
                  href={`/admin/email-domains/${domainName}/mailboxes`}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/70 hover:bg-blue-100 hover:text-blue-900 text-blue-800 font-semibold text-sm transition border border-blue-200"
                >
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                    <span>Conectar Outlook &amp; Apps</span>
                  </div>
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold">
                    Guia
                  </span>
                </Link>

                <a
                  href="https://migadu.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-sm transition border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <ExternalLink className="h-5 w-5 text-gray-500" />
                    <span>Painel Migadu</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                Status do Domínio
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Estado DNS:</span>
                  <span className="font-bold text-gray-900 capitalize">{domain.status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Pode Enviar:</span>
                  <span className={`font-bold ${domain.canSend ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {domain.canSend ? 'Sim (Ativado)' : 'Pendente DNS'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Pode Receber:</span>
                  <span className={`font-bold ${domain.canReceive ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {domain.canReceive ? 'Sim (Ativado)' : 'Pendente DNS'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 font-medium">Provedor:</span>
                  <span className="font-bold text-primary-600 uppercase">Migadu Cloud</span>
                </div>
              </div>
            </div>

            {/* Dica TurboHost */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-2 text-xs text-amber-900">
              <div className="flex items-center space-x-2 font-bold text-amber-900">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                <span>Dica para a TurboHost</span>
              </div>
              <p className="leading-relaxed text-amber-800">
                Se já existirem registos <strong>MX</strong> antigos apontando para outro servidor, apague-os antes de salvar para evitar conflitos na entrega de mensagens.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl ${
          toast.type === 'success' ? 'bg-gray-900 text-white border border-gray-800' : 'bg-red-600 text-white'
        } text-sm font-semibold flex items-center space-x-2 animate-bounce`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

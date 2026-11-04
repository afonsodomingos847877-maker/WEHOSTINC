'use client';

import { useState, useEffect } from 'react';
import {
  Server, Mail, Plus, RefreshCw, Trash2, CheckCircle2, AlertCircle,
  ShieldCheck, Eye, EyeOff, Loader2, ArrowRight, ExternalLink, X, Globe,
  Check, Lock, ChevronDown
} from 'lucide-react';
import { EMAIL_PROVIDER_PRESETS } from '@/app/api/webmail/external-accounts/route';

export interface ExternalAccountItem {
  id: string;
  ownerEmail: string;
  email: string;
  displayName: string;
  providerName: string;
  imapHost: string;
  imapPort: number;
  imapSecure: 'ssl' | 'starttls' | 'none';
  smtpHost: string;
  smtpPort: number;
  smtpSecure: 'ssl' | 'starttls' | 'none';
  connectionStatus: 'connected' | 'error' | 'syncing';
  lastError: string | null;
  lastSyncedAt: string;
}

interface ExternalAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerEmail: string;
  onSwitchAccount?: (externalEmail: string) => void;
}

export default function ExternalAccountsModal({
  isOpen,
  onClose,
  ownerEmail,
  onSwitchAccount,
}: ExternalAccountsModalProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [accounts, setAccounts] = useState<ExternalAccountItem[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State for Adding an External Account
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('custom');
  const [email, setEmail] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [providerName, setProviderName] = useState<string>('Servidor Personalizado / Empresa');
  const [imapHost, setImapHost] = useState<string>('');
  const [imapPort, setImapPort] = useState<number>(993);
  const [imapSecure, setImapSecure] = useState<'ssl' | 'starttls' | 'none'>('ssl');
  const [smtpHost, setSmtpHost] = useState<string>('');
  const [smtpPort, setSmtpPort] = useState<number>(465);
  const [smtpSecure, setSmtpSecure] = useState<'ssl' | 'starttls' | 'none'>('ssl');

  // Test and Submit states
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');

  // Fetch accounts on modal open
  useEffect(() => {
    if (isOpen && ownerEmail) {
      fetchAccounts();
    }
  }, [isOpen, ownerEmail]);

  const fetchAccounts = async () => {
    if (!ownerEmail) return;
    setLoadingAccounts(true);
    try {
      const res = await fetch(
        `/api/webmail/external-accounts?ownerEmail=${encodeURIComponent(ownerEmail)}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
      }
    } catch (err) {
      console.error('[ExternalAccountsModal] Failed to fetch accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // When a preset is chosen, fill in default host/port suggestions
  const handlePresetSelect = (presetKey: string) => {
    setSelectedPresetKey(presetKey);
    const preset = EMAIL_PROVIDER_PRESETS[presetKey];
    if (preset) {
      setProviderName(preset.name);
      setImapHost(preset.imapHost);
      setImapPort(preset.imapPort);
      setImapSecure(preset.imapSecure);
      setSmtpHost(preset.smtpHost);
      setSmtpPort(preset.smtpPort);
      setSmtpSecure(preset.smtpSecure);
    }
    setTestResult(null);
    setFormError('');
  };

  // When email changes, auto-suggest domain hostnames for cPanel / custom
  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    if (newEmail.includes('@') && (selectedPresetKey === 'custom' || selectedPresetKey === 'cpanel')) {
      const domain = newEmail.split('@')[1];
      if (domain && domain.includes('.')) {
        if (!imapHost || imapHost.startsWith('mail.')) {
          setImapHost(`mail.${domain}`);
        }
        if (!smtpHost || smtpHost.startsWith('mail.')) {
          setSmtpHost(`mail.${domain}`);
        }
      }
    }
  };

  // Test connection live
  const handleTestConnection = async () => {
    setFormError('');
    setFormSuccess('');
    if (!email || !password || !imapHost || !smtpHost) {
      setFormError('Preencha o e-mail, palavra-passe, endereço IMAP e endereço SMTP para testar.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/webmail/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          ownerEmail,
          email,
          password,
          imapHost,
          imapPort,
          imapSecure,
          smtpHost,
          smtpPort,
          smtpSecure,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          tested: true,
          success: true,
          message: '✓ Conexão IMAP e SMTP autenticadas com sucesso!',
        });
      } else {
        setTestResult({
          tested: true,
          success: false,
          message: data.error || 'Falha ao conectar com o servidor informado.',
        });
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: err?.message || 'Erro de rede ao testar conexão.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Connect & Save Account
  const handleConnectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!email || !password || !imapHost || !smtpHost) {
      setFormError('Todos os campos obrigatórios devem ser preenchidos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/webmail/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          ownerEmail,
          email,
          displayName: displayName || email.split('@')[0],
          password,
          providerName,
          imapHost,
          imapPort,
          imapSecure,
          smtpHost,
          smtpPort,
          smtpSecure,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Não foi possível conectar a conta externa.');
        setIsSubmitting(false);
        return;
      }

      setFormSuccess('Conta externa conectada com sucesso!');
      // Reset form
      setEmail('');
      setPassword('');
      setDisplayName('');
      setTestResult(null);
      // Refresh list
      await fetchAccounts();
      setTimeout(() => {
        setActiveTab('list');
        setFormSuccess('');
      }, 1000);
    } catch (err: any) {
      setFormError(err?.message || 'Erro inesperado ao salvar conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync Account
  const handleSyncAccount = async (account: ExternalAccountItem) => {
    setSyncingId(account.id);
    try {
      const res = await fetch('/api/webmail/external-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: account.id }),
      });
      const data = await res.json();
      if (data.success && data.account) {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === account.id
              ? {
                  ...acc,
                  connectionStatus: data.account.connectionStatus,
                  lastError: data.account.lastError,
                  lastSyncedAt: data.account.lastSyncedAt,
                }
              : acc
          )
        );
      } else {
        alert(data.error || 'Falha ao sincronizar a conta externa.');
      }
    } catch (err) {
      console.error('Failed to sync account:', err);
    } finally {
      setSyncingId(null);
    }
  };

  // Remove Account
  const handleRemoveAccount = async (account: ExternalAccountItem) => {
    if (!confirm(`Tem a certeza que deseja remover a conta externa ${account.email}?`)) {
      return;
    }

    setDeletingId(account.id);
    try {
      const res = await fetch(`/api/webmail/external-accounts?id=${account.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) => prev.filter((acc) => acc.id !== account.id));
      } else {
        alert(data.error || 'Falha ao remover conta.');
      }
    } catch (err) {
      console.error('Failed to delete account:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatLastSync = (dateStr: string) => {
    if (!dateStr) return 'Nunca';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-neutral-200 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100 shadow-2xs">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 tracking-tight flex items-center space-x-2">
                <span>Contas de E-mail Externas</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 border border-primary-200">
                  IMAP / SMTP
                </span>
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                Conecte caixas corporativas de outros provedores e envie/receba e-mails no SmartMail
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-xl transition cursor-pointer"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-100 px-6 pt-3 bg-white space-x-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab('list');
              setFormError('');
              setFormSuccess('');
            }}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center space-x-2 cursor-pointer ${
              activeTab === 'list'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Contas Conectadas</span>
            <span
              className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                activeTab === 'list'
                  ? 'bg-primary-50 text-primary-700'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {accounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('add');
              setFormError('');
              setFormSuccess('');
            }}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center space-x-2 cursor-pointer ${
              activeTab === 'add'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Conta Externa</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: LIST CONNECTED ACCOUNTS */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {loadingAccounts ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3 text-neutral-400">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                  <span className="text-xs font-medium">A carregar contas externas...</span>
                </div>
              ) : accounts.length === 0 ? (
                <div className="py-12 px-6 text-center border-2 border-dashed border-neutral-200 rounded-3xl space-y-3 bg-neutral-50/50">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-800">
                    Nenhuma conta externa conectada
                  </h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Pode conectar emails de empresas parceiras, cPanel, Zoho, Google Workspace ou
                    qualquer servidor IMAP/SMTP personalizado.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('add')}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Conectar Outro Provedor</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((acc) => {
                    const isConnected = acc.connectionStatus === 'connected';
                    const isSyncing = syncingId === acc.id;
                    const isDeleting = deletingId === acc.id;

                    return (
                      <div
                        key={acc.id}
                        className="p-4 rounded-2xl border border-neutral-200 hover:border-neutral-300 bg-white hover:shadow-xs transition space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold text-sm shrink-0 border border-neutral-200">
                              {acc.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-bold text-neutral-900">{acc.email}</h4>
                                {isConnected ? (
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    <span>Conectado</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                    <AlertCircle className="h-3 w-3 text-rose-600" />
                                    <span>Erro de Conexão</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-500 font-medium">
                                {acc.displayName && acc.displayName !== acc.email
                                  ? `${acc.displayName} • `
                                  : ''}
                                {acc.providerName}
                              </p>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center space-x-1">
                            {/* Sync Button */}
                            <button
                              type="button"
                              onClick={() => handleSyncAccount(acc)}
                              disabled={isSyncing}
                              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
                              title="Sincronizar e verificar conexão"
                            >
                              <RefreshCw
                                className={`h-4 w-4 ${isSyncing ? 'animate-spin text-primary-600' : ''}`}
                              />
                            </button>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveAccount(acc)}
                              disabled={isDeleting}
                              className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Remover conta externa"
                            >
                              {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Error Warning if connection failed */}
                        {acc.lastError && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                            <span className="truncate">{acc.lastError}</span>
                          </div>
                        )}

                        {/* Details Footer & Switch Button */}
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px] text-neutral-500">
                          <div className="flex items-center space-x-3">
                            <span>
                              Servidor IMAP: <strong className="text-neutral-700 font-mono">{acc.imapHost}:{acc.imapPort}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Última sincronização: <strong className="text-neutral-700">{formatLastSync(acc.lastSyncedAt)}</strong>
                            </span>
                          </div>

                          {onSwitchAccount && (
                            <button
                              type="button"
                              onClick={() => {
                                onSwitchAccount(acc.email);
                                onClose();
                              }}
                              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer active:scale-95"
                            >
                              <span>Abrir Caixa</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD EXTERNAL ACCOUNT */}
          {activeTab === 'add' && (
            <form onSubmit={handleConnectAccount} className="space-y-5">
              {/* Preset Provider Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">
                  Provedor de E-mail
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(EMAIL_PROVIDER_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePresetSelect(key)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex flex-col justify-between ${
                        selectedPresetKey === key
                          ? 'border-primary-600 bg-primary-50/60 font-bold text-primary-950 shadow-2xs'
                          : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      <span className="truncate">{preset.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono truncate">
                        {preset.imapHost || 'Personalizado'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Account Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Endereço de E-mail <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="comercial@empresa.com"
                    required
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nome de Exibição (Opcional)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ex: Comercial Empresa"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Palavra-passe da Caixa de E-mail <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Palavra-passe do e-mail no provedor de origem"
                    required
                    className="w-full pl-3.5 pr-11 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* IMAP Server Settings */}
              <div className="p-3.5 bg-neutral-50/80 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-neutral-800">
                  <Server className="h-3.5 w-3.5 text-primary-600" />
                  <span>Servidor de Recepção (IMAP)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Endereço IMAP
                    </label>
                    <input
                      type="text"
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                      placeholder="mail.empresa.com"
                      required
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900 outline-none focus:border-neutral-900 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Porta IMAP
                    </label>
                    <input
                      type="number"
                      value={imapPort}
                      onChange={(e) => setImapPort(Number(e.target.value))}
                      placeholder="993"
                      required
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900 outline-none focus:border-neutral-900 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Segurança SSL/TLS
                    </label>
                    <select
                      value={imapSecure}
                      onChange={(e) => setImapSecure(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 outline-none focus:border-neutral-900 transition"
                    >
                      <option value="ssl">SSL / TLS (Padrão: 993)</option>
                      <option value="starttls">STARTTLS (Porta 143)</option>
                      <option value="none">Nenhuma / Aberta</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SMTP Server Settings */}
              <div className="p-3.5 bg-neutral-50/80 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-neutral-800">
                  <Server className="h-3.5 w-3.5 text-primary-600" />
                  <span>Servidor de Envio (SMTP)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Endereço SMTP
                    </label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="mail.empresa.com"
                      required
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900 outline-none focus:border-neutral-900 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Porta SMTP
                    </label>
                    <input
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      placeholder="465"
                      required
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900 outline-none focus:border-neutral-900 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Segurança SSL/TLS
                    </label>
                    <select
                      value={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 outline-none focus:border-neutral-900 transition"
                    >
                      <option value="ssl">SSL / TLS (Padrão: 465)</option>
                      <option value="starttls">STARTTLS (Porta 587)</option>
                      <option value="none">Nenhuma / Porta 25</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status / Error Alerts */}
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || isSubmitting}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-2 disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>A testar servidores...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-neutral-600" />
                      <span>Testar Conexão</span>
                    </>
                  )}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-4 py-2.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || isTesting}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center space-x-2 cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>A conectar...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Conectar Conta</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

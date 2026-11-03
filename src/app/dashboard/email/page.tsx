'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Mail, Plus, Trash2, Settings, CheckCircle, Clock, XCircle,
  LayoutDashboard, Globe, Database, Settings as SettingsIcon, LogOut, Server, ExternalLink,
  Key, ShieldCheck, Copy, Sparkles, AlertCircle, X, Check, Lock, ArrowRight,
  Shuffle, RefreshCw, AlertTriangle, HardDrive, ShieldAlert, CheckCircle2, ChevronRight,
  Send, Inbox, HelpCircle
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, EmailAccount, Site } from '@/lib/data';

import DashboardNav from '@/components/DashboardNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageLoader from '@/components/PageLoader';
import StatusBadge from '@/components/StatusBadge';
import ApprovalCelebration from '@/components/ApprovalCelebration';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { getCached, setCached } from '@/lib/pageCache';
import { soundEffects } from '@/lib/soundEffects';

interface EmailAliasItem {
  _id: string;
  domain: string;
  alias: string;
  destination: string;
  type: string;
  status: string;
  createdAt: string;
}

interface DNSDiagnostics {
  mx?: { status: string; message: string };
  spf?: { status: string; message: string };
  dkim?: { status: string; message: string };
  dmarc?: { status: string; message: string };
  overall?: 'passed' | 'failed' | 'pending' | 'ok';
  checkedAt?: string;
}

export default function EmailPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [emails, setEmails] = useState<EmailAccount[]>(() => getCached<EmailAccount[]>('email:accounts') || []);
  const [sites, setSites] = useState<Site[]>(() => getCached<Site[]>('email:sites') || []);
  const [userDomains, setUserDomains] = useState<string[]>([]);
  const [migaduDomains, setMigaduDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(() => !getCached('email:accounts'));
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Tab State: 'mailboxes' | 'aliases' | 'dns'
  const [activeTab, setActiveTab] = useState<'mailboxes' | 'aliases' | 'dns'>('mailboxes');

  // Modal para Criar Nova Conta de E-mail
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmailPrefix, setNewEmailPrefix] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newStorage, setNewStorage] = useState(1);

  // Modal para Editar / Alterar Senha
  const [editEmailAccount, setEditEmailAccount] = useState<EmailAccount | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editStorage, setEditStorage] = useState(1);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Aliases State
  const [aliases, setAliases] = useState<EmailAliasItem[]>([]);
  const [loadingAliases, setLoadingAliases] = useState(false);
  const [showCreateAliasModal, setShowCreateAliasModal] = useState(false);
  const [newAliasPrefix, setNewAliasPrefix] = useState('');
  const [newAliasDestination, setNewAliasDestination] = useState('');
  const [isCreatingAlias, setIsCreatingAlias] = useState(false);
  const [deleteAliasConfirm, setDeleteAliasConfirm] = useState<{ isOpen: boolean; id: string; aliasStr?: string } | null>(null);

  // DNS Diagnostics State
  const [diagnostics, setDiagnostics] = useState<DNSDiagnostics | null>(null);
  const [isCheckingDNS, setIsCheckingDNS] = useState(false);
  const [dnsCheckedDomain, setDnsCheckedDomain] = useState<string>('');

  // Feedback de cópia de texto
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Celebration state
  const [celebration, setCelebration] = useState<{ show: boolean; name: string } | null>(null);
  const prevEmailStatusRef = useRef<Record<string, string>>({});

  // Toast State
  const [toastMsg, setToastMsg] = useState<{ title?: string; message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState<{ isOpen: boolean; id: string; emailStr?: string } | null>(null);
  const [isSyncingMigadu, setIsSyncingMigadu] = useState(false);

  const refreshData = useCallback((newEmails?: EmailAccount[], overrideUserEmail?: string) => {
    const userEmailFilter = (overrideUserEmail || user?.email || auth.getCurrentUser()?.email || '').trim().toLowerCase();
    if (!userEmailFilter) return;

    // 🔒 ISOLAMENTO RIGOROSO: Apenas sites comprovadamente pertencentes a este cliente
    const loadedSites = dataManager.getSites().filter(s =>
      s.userEmail && s.userEmail.trim().toLowerCase() === userEmailFilter
    );
    setSites(loadedSites);

    const siteDomains = loadedSites.map(s => (s.domain || '').trim().toLowerCase()).filter(Boolean);
    const userEmailDomain = userEmailFilter.includes('@') ? userEmailFilter.split('@')[1].trim().toLowerCase() : '';
    const myStrictDomains = Array.from(new Set([...siteDomains, ...(userEmailDomain ? [userEmailDomain] : [])]));

    setUserDomains(myStrictDomains);
    if (myStrictDomains.length > 0) {
      setSelectedDomain(prev => myStrictDomains.includes(prev) ? prev : myStrictDomains[0]);
    }

    // Filtrar emails: APENAS emails cujos domínios pertencem comprovadamente a este utilizador
    const rawEmails = newEmails || dataManager.getEmails(userEmailFilter);
    const loadedEmails = rawEmails
      .filter(email => {
        const d = (email.domain || email.email.split('@')[1] || '').trim().toLowerCase();
        return myStrictDomains.includes(d);
      })
      .map(email => ({
        ...email,
        storage: email.storage || 1,
        storageUsed: email.storageUsed || 0
      }));

    loadedEmails.forEach(email => {
      const prevStatus = prevEmailStatusRef.current[email.email];
      if (prevStatus === 'pending' && email.status === 'active') {
        setCelebration({ show: true, name: email.email });
      }
      prevEmailStatusRef.current[email.email] = email.status;
    });

    setEmails(loadedEmails);
  }, [user?.email]);

  const fetchMigaduDomains = useCallback(async (overrideUserEmail?: string) => {
    const userEmailFilter = (overrideUserEmail || user?.email || auth.getCurrentUser()?.email || '').trim().toLowerCase();
    if (!userEmailFilter) return;

    // 1. Obter ESTRITAMENTE os domínios pertencentes ao cliente a partir de Meus Sites
    const userSiteDomains = dataManager.getSites().filter(s =>
      s.userEmail && s.userEmail.trim().toLowerCase() === userEmailFilter
    ).map(s => (s.domain || '').trim().toLowerCase()).filter(Boolean);

    let migaduDomainNames: string[] = [];

    try {
      const response = await fetch(`/api/email-providers/migadu/domains?customerId=${encodeURIComponent(userEmailFilter)}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.domains)) {
        setMigaduDomains(data.domains);
        // Filtrar estritamente: apenas aceitar domínios que o utilizador possui
        migaduDomainNames = data.domains
          .map((d: any) => (d.domainName || d.name || '').trim().toLowerCase())
          .filter((d: string) => d && (userSiteDomains.includes(d) || d === userEmailFilter.split('@')[1]));
      }
    } catch (error) {
      console.error('Failed to fetch Migadu domains:', error);
    }

    // Unir unicamente os domínios comprovadamente legítimos deste utilizador
    const allActiveDomains = Array.from(new Set([...migaduDomainNames, ...userSiteDomains]));
    if (allActiveDomains.length > 0) {
      setUserDomains(allActiveDomains);
      setSelectedDomain(prev => allActiveDomains.includes(prev) ? prev : allActiveDomains[0]);
    }

    // Sincronizar ao vivo as caixas de correio do Migadu APENAS para os domínios do cliente
    let hadWarning: string | null = null;
    for (const dName of allActiveDomains) {
      try {
        const mbRes = await fetch(`/api/email-providers/migadu/domains/${dName}/mailboxes`);
        const mbData = await mbRes.json();
        if (mbData.providerError && mbData.warning) {
          hadWarning = mbData.warning;
        }
        const mailboxes = mbData.mailboxes || mbData || [];
        if (Array.isArray(mailboxes) && mailboxes.length > 0) {
          const currentLocal = dataManager.getEmails(userEmailFilter);
          for (const mb of mailboxes) {
            const fullEmail = (mb.email || `${mb.localPart || mb.local_part}@${dName}`).toLowerCase().trim();
            if (fullEmail && !currentLocal.some(e => e.email.toLowerCase() === fullEmail)) {
              const newAcc: EmailAccount = {
                id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                email: fullEmail,
                domain: dName,
                storage: 1,
                storageUsed: mb.storageUsed || 0,
                status: 'active',
                userEmail: userEmailFilter,
                createdAt: new Date().toISOString()
              };
              try {
                dataManager.addEmail(newAcc);
              } catch {
                // Se já estiver em cache compartilhado, prosseguir
              }
            } else if (fullEmail && mb.storageUsed !== undefined) {
              const existing = currentLocal.find(e => e.email.toLowerCase() === fullEmail);
              if (existing && existing.storageUsed !== mb.storageUsed) {
                existing.storageUsed = mb.storageUsed;
                try {
                  dataManager.updateEmail(existing.id, { storageUsed: mb.storageUsed });
                } catch {}
              }
            }
          }
        }
      } catch (syncErr) {
        console.warn(`[Email Sync] Erro ao sincronizar caixas de ${dName}:`, syncErr);
      }
    }

    try {
      await dataManager.fetchEmailsAsync(userEmailFilter);
    } catch {}
    refreshData(undefined, userEmailFilter);
    return hadWarning;
  }, [user?.email, refreshData]);

  useEffect(() => {
    if (status === 'loading') return;
    
    let currentUser: User | null = null;
    
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
    const userEmailFilter = currentUser.email;

    dataManager.initUserEmails(userEmailFilter);

    refreshData(undefined, userEmailFilter);
    const initialSites = dataManager.getSites().filter(s =>
      s.userEmail && s.userEmail.toLowerCase().trim() === userEmailFilter.toLowerCase().trim()
    );
    if (initialSites.length > 0 && initialSites[0].domain) {
      setSelectedDomain(initialSites[0].domain);
    }
    setLoading(false);

    setCached('email:accounts', dataManager.getEmails(userEmailFilter));
    setCached('email:sites', initialSites);

    fetchMigaduDomains(userEmailFilter);

    dataManager.fetchEmailsAsync(userEmailFilter).then(emails => refreshData(emails, userEmailFilter));
    dataManager.fetchSitesAsync().then(() => refreshData(undefined, userEmailFilter));

    const syncAllData = () => {
      dataManager.fetchEmailsAsync(userEmailFilter).then(emails => refreshData(emails, userEmailFilter));
      dataManager.fetchSitesAsync().then(() => refreshData(undefined, userEmailFilter));
      fetchMigaduDomains(userEmailFilter);
    };

    const interval = setInterval(syncAllData, 10000);
    window.addEventListener('focus', syncAllData);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', syncAllData);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, fetchMigaduDomains, refreshData]);

  // Carregar Aliases do domínio atual quando alternar para a aba de aliases ou mudar domínio
  const currentActiveDomain: string = (selectedDomain || userDomains[0] || (emails.length > 0 ? (emails[0].domain || '') : '')) || '';

  useEffect(() => {
    if (activeTab === 'aliases' && currentActiveDomain) {
      fetchAliases(currentActiveDomain);
    }
    if (activeTab === 'dns' && currentActiveDomain && dnsCheckedDomain !== currentActiveDomain) {
      runDNSCheck(currentActiveDomain, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentActiveDomain]);

  const fetchAliases = async (dom?: string) => {
    if (!dom) return;
    setLoadingAliases(true);
    try {
      const res = await fetch(`/api/email-providers/migadu/domains/${dom}/aliases`);
      const data = await res.json();
      if (data.success) {
        setAliases(data.aliases || []);
      }
    } catch (err) {
      console.warn('Erro ao buscar aliases:', err);
    } finally {
      setLoadingAliases(false);
    }
  };

  const handleCreateAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAliasPrefix || !newAliasDestination || !currentActiveDomain) return;

    const fullAlias = newAliasPrefix.includes('@') 
      ? newAliasPrefix.trim().toLowerCase() 
      : `${newAliasPrefix.trim().toLowerCase()}@${currentActiveDomain.toLowerCase()}`;

    setIsCreatingAlias(true);
    try {
      const res = await fetch(`/api/email-providers/migadu/domains/${currentActiveDomain}/aliases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias: fullAlias,
          destination: newAliasDestination.trim().toLowerCase()
        })
      });

      const data = await res.json();
      if (data.success) {
        soundEffects.playSuccessSound();
        setToastMsg({ type: 'success', message: `Pseudónimo ${fullAlias} configurado com sucesso!` });
        setShowCreateAliasModal(false);
        setNewAliasPrefix('');
        setNewAliasDestination('');
        fetchAliases(currentActiveDomain);
      } else {
        soundEffects.playErrorSound();
        setToastMsg({ type: 'error', message: data.error || 'Falha ao criar alias de e-mail.' });
      }
    } catch (err) {
      soundEffects.playErrorSound();
      setToastMsg({ type: 'error', message: 'Erro de comunicação ao criar alias.' });
    } finally {
      setIsCreatingAlias(false);
    }
  };

  const confirmDeleteAlias = async () => {
    if (!deleteAliasConfirm || !currentActiveDomain) return;
    try {
      const res = await fetch(`/api/email-providers/migadu/domains/${currentActiveDomain}/aliases/${deleteAliasConfirm.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        soundEffects.playDeleteEmailSound();
        setToastMsg({ type: 'success', message: 'Alias removido com sucesso.' });
        setAliases(prev => prev.filter(a => a._id !== deleteAliasConfirm.id));
      } else {
        setToastMsg({ type: 'error', message: data.error || 'Erro ao remover alias.' });
      }
    } catch (e) {
      setToastMsg({ type: 'error', message: 'Erro ao remover alias.' });
    } finally {
      setDeleteAliasConfirm(null);
    }
  };

  const runDNSCheck = async (dom?: string, showToast = true) => {
    if (!dom) return;
    setIsCheckingDNS(true);
    try {
      const res = await fetch(`/api/email-providers/migadu/domains/${dom}/diagnostics`);
      const data = await res.json();
      if (data.success && data.diagnostics) {
        setDiagnostics(data.diagnostics);
        setDnsCheckedDomain(dom);
        if (showToast) {
          const isOk = data.diagnostics.overall === 'passed' || data.diagnostics.overall === 'ok';
          soundEffects.playSuccessSound();
          setToastMsg({
            type: isOk ? 'success' : 'warning',
            title: isOk ? 'DNS 100% Configurado' : 'Atenção aos Registos DNS',
            message: isOk 
              ? `Todos os registos SPF, DKIM, MX e DMARC para "${dom}" estão devidamente apontados e protegidos.` 
              : `Foram detetados registos pendentes para "${dom}". Verifique os valores abaixo.`
          });
        }
      }
    } catch (err) {
      console.warn('Erro ao verificar diagnóstico DNS:', err);
      if (showToast) {
        setToastMsg({ type: 'error', message: 'Não foi possível verificar os registos DNS em tempo real.' });
      }
    } finally {
      setIsCheckingDNS(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      soundEffects.playCopySound();
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2500);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$&';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleSyncMigaduBidirectional = async () => {
    setIsSyncingMigadu(true);
    let syncErrors: string[] = [];
    try {
      const currentList = emails.length > 0 ? emails : (user?.email ? dataManager.getEmails(user.email) : []);
      try {
        const syncRes = await fetch('/api/email-providers/migadu/sync-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accounts: currentList })
        });
        const syncData = await syncRes.json();
        if (syncData.error) {
          syncErrors.push(syncData.error);
        }
        if (syncData.results?.errors && syncData.results.errors.length > 0) {
          syncErrors.push(...syncData.results.errors);
        }
        if (syncData.results?.mailboxesProvisioned?.length > 0) {
          console.log('[Sync Migadu] Caixas provisionadas:', syncData.results.mailboxesProvisioned);
        }
      } catch (syncErr: any) {
        console.warn('[Sync-All Migadu Error]', syncErr);
        syncErrors.push(syncErr?.message || 'Erro ao comunicar com o servidor');
      }

      const warningMsg = await fetchMigaduDomains();
      if (user?.email) {
        await dataManager.fetchEmailsAsync(user.email);
      }
      refreshData();

      if (syncErrors.length > 0 || warningMsg) {
        soundEffects.playErrorSound();
        const primaryError = syncErrors[0] || warningMsg || 'Chave de API do Migadu inválida ou expirada';
        setToastMsg({
          type: 'error',
          title: 'Erro na API da Migadu',
          message: `${primaryError}. Verifique a API Key nas definições da Migadu.`
        });
      } else {
        soundEffects.playSuccessSound();
        setToastMsg({
          type: 'success',
          title: 'Sincronização Concluída',
          message: 'As caixas de correio foram provisionadas e sincronizadas com a Migadu!'
        });
      }
    } catch {
      soundEffects.playErrorSound();
      setToastMsg({ type: 'error', message: 'Erro ao sincronizar em tempo real com a Migadu.' });
    } finally {
      setIsSyncingMigadu(false);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailPrefix || !newPassword) return;

    const fullEmail = newEmailPrefix.includes('@')
      ? newEmailPrefix.trim().toLowerCase()
      : `${newEmailPrefix.trim().toLowerCase()}@${selectedDomain.toLowerCase()}`;

    const existing = emails.find(e => e.email.trim().toLowerCase() === fullEmail);
    if (existing) {
      soundEffects.playErrorSound();
      setToastMsg({
        type: 'error',
        title: 'E-mail Já Existente',
        message: `A conta de e-mail "${fullEmail}" já se encontra registada no sistema. Escolha outro prefixo.`
      });
      return;
    }

    const localPart = newEmailPrefix.includes('@')
      ? newEmailPrefix.split('@')[0].trim().toLowerCase()
      : newEmailPrefix.trim().toLowerCase();

    const domainToUse = selectedDomain.toLowerCase().trim();

    try {
      // 1. Provisionar a caixa de correio diretamente na API da Migadu
      try {
        const migaduRes = await fetch(`/api/email-providers/migadu/domains/${domainToUse}/mailboxes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: localPart,
            localPart,
            password: newPassword,
            passwordMethod: 'generated',
            customerId: user?.email || 'cliente'
          })
        });

        const migaduData = await migaduRes.json();
        if (!migaduRes.ok && migaduData.error && !migaduData.error.toLowerCase().includes('already exists')) {
          throw new Error(migaduData.error || 'Falha ao criar caixa de correio no servidor Migadu.');
        }
      } catch (migaduErr: any) {
        console.warn('[Migadu Provision]', migaduErr);
        if (migaduErr.message && !migaduErr.message.toLowerCase().includes('already exists')) {
          throw migaduErr;
        }
      }

      const initialStatus: EmailAccount['status'] = 'active';

      const newEmailAccount = await dataManager.addEmailAsync({
        email: fullEmail,
        domain: selectedDomain,
        status: initialStatus,
        storage: newStorage,
        userEmail: user?.email
      });

      soundEffects.playSendEmailSound();
      setEmails([...emails, newEmailAccount]);
      setShowCreateModal(false);
      setNewEmailPrefix('');
      setNewPassword('');
      setToastMsg({
        type: 'success',
        title: 'Conta Criada na Migadu!',
        message: `A conta ${fullEmail} foi criada e ativada com sucesso no servidor Migadu.`
      });
      if (user?.email) {
        fetchMigaduDomains(user.email);
      }
    } catch (err: any) {
      soundEffects.playErrorSound();
      setToastMsg({
        type: 'error',
        title: 'Erro ao Criar E-mail',
        message: err?.message || `Não foi possível criar a conta de e-mail "${fullEmail}".`
      });
    }
  };

  const handleOpenEditModal = (email: EmailAccount) => {
    soundEffects.playClickSound();
    setEditEmailAccount(email);
    setEditPassword('');
    setConfirmPassword('');
    setEditStorage(email.storage || 1);
    setEditSuccessMsg('');
    setEditErrorMsg('');
  };

  const handleSaveEditEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmailAccount) return;

    if (editPassword && editPassword !== confirmPassword) {
      soundEffects.playErrorSound();
      setEditErrorMsg('As senhas não coincidem. Por favor verifique.');
      return;
    }

    if (editPassword && editPassword.length < 6) {
      soundEffects.playErrorSound();
      setEditErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsUpdatingEmail(true);
    setEditErrorMsg('');

    try {
      const emailStr = editEmailAccount.email;
      const [localPart, domain] = emailStr.split('@');

      // Se o cliente definiu uma nova senha, atualizar diretamente no Migadu
      if (editPassword && domain && localPart) {
        try {
          const res = await fetch(`/api/email-providers/migadu/domains/${domain}/mailboxes/${localPart}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              password: editPassword,
              name: (editEmailAccount as any).name || localPart
            })
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.warn('[EditEmail] Migadu provider update warning:', errData);
          }
        } catch (provErr) {
          console.warn('[EditEmail] Error sending password to provider:', provErr);
        }
      }

      const updates: Partial<EmailAccount> = {
        storage: editStorage
      };

      dataManager.updateEmail(editEmailAccount.id, updates);
      setEmails(emails.map(e => e.id === editEmailAccount.id ? { ...e, ...updates } : e));

      soundEffects.playSuccessSound();
      setEditSuccessMsg(editPassword ? 'Senha e configurações da caixa atualizadas com sucesso!' : 'Configurações atualizadas com sucesso!');
      setToastMsg({
        type: 'success',
        title: 'Conta Atualizada',
        message: editPassword ? `A senha da conta ${editEmailAccount.email} foi alterada com sucesso!` : 'Configurações da conta atualizadas.'
      });

      setTimeout(() => {
        setEditEmailAccount(null);
        setEditSuccessMsg('');
      }, 1600);
    } catch (err: any) {
      console.error('Erro ao atualizar conta de e-mail:', err);
      soundEffects.playErrorSound();
      setEditErrorMsg('Erro ao atualizar senha no servidor. Tente novamente.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const confirmDeleteEmail = () => {
    if (!deleteEmailConfirm) return;
    try {
      const { id, emailStr } = deleteEmailConfirm;
      const userEmailFilter = user?.email;
      dataManager.deleteEmail(id, userEmailFilter, emailStr);
      soundEffects.playDeleteEmailSound();
      setEmails(prev => prev.filter(e => e.id !== id && e.email !== emailStr));
      setDeleteEmailConfirm(null);
      setToastMsg({ title: 'E-mail Removido', message: `A conta de e-mail ${emailStr || ''} foi eliminada com sucesso.`, type: 'success' });
    } catch (err) {
      console.error('Erro ao eliminar e-mail:', err);
      soundEffects.playErrorSound();
      setToastMsg({ title: 'Erro ao Eliminar', message: 'Não foi possível eliminar o e-mail. Tente novamente.', type: 'error' });
    }
  };

  // Cálculo de Cota por E-mail (Armazenamento Real Utilizado)
  const getMailboxStorageStats = (emailAcc: EmailAccount, _index?: number) => {
    const limitGB = emailAcc.storage || 1;
    const limitMB = limitGB * 1024;
    // Obter armazenamento real em MB retornado pelo servidor/caixa (0 para contas vazias/não utilizadas)
    const rawUsage = (emailAcc as any).storageUsed ?? (emailAcc as any).usedMB ?? 0;
    const parsedMB = typeof rawUsage === 'number' 
      ? (rawUsage > 1024 * 1024 ? Math.round(rawUsage / (1024 * 1024)) : Math.round(rawUsage))
      : 0;
    const usedMB = Math.min(parsedMB, limitMB);
    const percentage = limitMB > 0 ? Math.min(100, Math.round((usedMB / limitMB) * 100)) : 0;
    
    return {
      usedMB,
      limitMB,
      limitGB,
      percentage,
      isNearLimit: percentage >= 80 && percentage < 90,
      isCritical: percentage >= 90
    };
  };

  if (loading) {
    return <PageLoader text="A carregar as suas contas de email..." />;
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

  // Emails filtrados pelo domínio ativo selecionado (ou todos os domínios comprovados do utilizador)
  const displayEmails = emails.filter(email => {
    if (!selectedDomain) return true;
    const d = (email.domain || email.email.split('@')[1] || '').trim().toLowerCase();
    return d === selectedDomain.trim().toLowerCase();
  });

  // Métricas Globais
  const totalEmailsCount = displayEmails.length;
  const totalStorageAllocatedGB = displayEmails.reduce((acc, curr) => acc + (curr.storage || 1), 0);
  const totalStorageUsedMB = displayEmails.reduce((acc, curr, idx) => acc + getMailboxStorageStats(curr, idx).usedMB, 0);
  const totalStoragePercent = totalStorageAllocatedGB > 0 
    ? Math.min(100, Math.round((totalStorageUsedMB / (totalStorageAllocatedGB * 1024)) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Celebration effect */}
      {celebration && (
        <ApprovalCelebration
          show={celebration.show}
          type="email"
          name={celebration.name}
          onDone={() => setCelebration(null)}
        />
      )}

      {/* Header Responsivo */}
      <DashboardNav userName={user.name} userAvatar={user.avatar} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="grid lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-5">
            
            {/* ───── METRIC CARDS RESUMO ───── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Caixas de Correio */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Contas Ativas</span>
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Mail className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-gray-900">{totalEmailsCount}</span>
                  <span className="text-[11px] text-gray-500 block">caixas corporativas</span>
                </div>
              </div>

              {/* Aliases */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Aliases</span>
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Shuffle className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-gray-900">{aliases.length}</span>
                  <span className="text-[11px] text-gray-500 block">redirecionamentos</span>
                </div>
              </div>

              {/* Diagnóstico DNS */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Entregabilidade</span>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <span className="text-sm sm:text-base font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Protegido</span>
                  </span>
                  <span className="text-[11px] text-gray-500 block">SPF, DKIM, MX &amp; DMARC</span>
                </div>
              </div>

              {/* Armazenamento Global */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Espaço em Disco</span>
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <HardDrive className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-gray-900">{(totalStorageUsedMB / 1024).toFixed(1)} GB</span>
                    <span className="text-gray-500">/ {totalStorageAllocatedGB} GB</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        totalStoragePercent >= 90 ? 'bg-rose-500' : totalStoragePercent >= 80 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.max(5, totalStoragePercent)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ───── CONTAINER PRINCIPAL COM ABAS ───── */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
              {/* Header do Módulo & Abas */}
              <div className="p-4 sm:p-6 border-b border-gray-100 pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                      Email Corporativo &amp; Entregabilidade
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      Gerencie as suas caixas de correio, pseudónimos, senhas e verificação de registos DNS.
                    </p>
                  </div>

                  {activeTab === 'mailboxes' && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={handleSyncMigaduBidirectional}
                        disabled={isSyncingMigadu}
                        className="flex items-center justify-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-60 shadow-xs"
                        title="Forçar sincronização em tempo real de caixas de correio"
                      >
                        <RefreshCw className={`h-4 w-4 ${isSyncingMigadu ? 'animate-spin text-emerald-600' : 'text-emerald-700'}`} />
                        <span>{isSyncingMigadu ? 'A Sincronizar...' : 'Sincronizar em Tempo Real'}</span>
                      </button>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Nova Conta de Email</span>
                      </button>
                    </div>
                  )}

                  {activeTab === 'aliases' && (
                    <button
                      onClick={() => setShowCreateAliasModal(true)}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Novo Pseudónimo</span>
                    </button>
                  )}

                  {activeTab === 'dns' && (
                    <button
                      onClick={() => runDNSCheck(currentActiveDomain, true)}
                      disabled={isCheckingDNS}
                      className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${isCheckingDNS ? 'animate-spin' : ''}`} />
                      <span>{isCheckingDNS ? 'A Verificar...' : 'Verificar DNS em Tempo Real'}</span>
                    </button>
                  )}
                </div>

                {/* Seletor ou Indicador de Domínio Ativo - NUNCA mostrar domínios de terceiros */}
                {userDomains.length > 1 ? (
                  <div className="flex items-center space-x-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200 mb-4 max-w-md">
                    <Globe className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-semibold text-gray-700 shrink-0">Domínio selecionado:</span>
                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="bg-transparent font-bold text-xs text-gray-900 focus:outline-none flex-1 cursor-pointer"
                    >
                      {userDomains.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                ) : userDomains.length === 1 ? (
                  <div className="inline-flex items-center gap-2 bg-blue-50/80 border border-blue-200 text-blue-900 px-3 py-1.5 rounded-xl mb-4 text-xs font-medium">
                    <Globe className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="text-blue-700">Domínio Ativo:</span>
                    <span className="font-mono font-bold text-blue-950">{userDomains[0]}</span>
                  </div>
                ) : null}

                {/* Abas */}
                <div className="flex space-x-2 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setActiveTab('mailboxes')}
                    className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer shrink-0 ${
                      activeTab === 'mailboxes'
                        ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Caixas de Correio ({displayEmails.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('aliases')}
                    className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer shrink-0 ${
                      activeTab === 'aliases'
                        ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Shuffle className="h-4 w-4" />
                    <span>Aliases &amp; Redirecionamentos ({aliases.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('dns')}
                    className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer shrink-0 ${
                      activeTab === 'dns'
                        ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Diagnóstico DNS &amp; Entregabilidade</span>
                  </button>
                </div>
              </div>

              {/* Conteúdo das Abas */}
              <div className="p-4 sm:p-6">
                
                {/* ───── ABA 1: CAIXAS DE CORREIO ───── */}
                {activeTab === 'mailboxes' && (
                  <div className="space-y-4">
                    {displayEmails.length === 0 ? (
                      <div className="text-center py-12">
                        <Mail className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-900 mb-1">Nenhuma conta de email criada</h3>
                        <p className="text-gray-500 text-xs sm:text-sm max-w-sm mx-auto mb-4">
                          Crie a sua primeira conta de email profissional com o seu domínio corporativo ou sincronize as contas já existentes no servidor.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2.5">
                          <button
                            onClick={handleSyncMigaduBidirectional}
                            disabled={isSyncingMigadu}
                            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm hover:shadow transition cursor-pointer disabled:opacity-60"
                          >
                            <RefreshCw className={`h-4 w-4 ${isSyncingMigadu ? 'animate-spin' : ''}`} />
                            <span>{isSyncingMigadu ? 'A Sincronizar...' : 'Sincronizar em Tempo Real'}</span>
                          </button>
                          <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm hover:shadow transition cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Criar Primeira Conta</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {displayEmails.map((email, idx) => {
                          const storageStats = getMailboxStorageStats(email, idx);

                          return (
                            <div 
                              key={email.id}
                              className={`rounded-2xl border p-4 sm:p-5 transition bg-white shadow-xs ${
                                storageStats.isCritical 
                                  ? 'border-rose-300 bg-rose-50/20' 
                                  : storageStats.isNearLimit 
                                  ? 'border-amber-300 bg-amber-50/20' 
                                  : 'border-gray-200 hover:border-blue-200'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {/* Informação da Conta */}
                                <div className="flex items-center space-x-3 min-w-0">
                                  <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-sm shrink-0">
                                    {email.email.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <h3 className="font-extrabold text-gray-900 text-sm sm:text-base truncate">
                                        {email.email}
                                      </h3>
                                      <button
                                        onClick={() => copyToClipboard(email.email)}
                                        className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition"
                                        title="Copiar e-mail"
                                      >
                                        {copiedText === email.email ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                      </button>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium">Caixa Profissional • Servidor Seguro Migadu</p>
                                  </div>
                                </div>

                                {/* Status & Ações */}
                                <div className="flex items-center space-x-2 shrink-0">
                                  <StatusBadge status={email.status} />

                                  <a
                                    href={`/webmail?user=${encodeURIComponent(email.email)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span>Webmail</span>
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(email)}
                                    className="px-2.5 py-1.5 text-gray-700 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl transition cursor-pointer flex items-center space-x-1.5 text-xs font-bold"
                                    title="Alterar Senha e Cota"
                                  >
                                    <Key className="h-3.5 w-3.5 text-blue-600" />
                                    <span className="hidden sm:inline">Alterar Senha</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setDeleteEmailConfirm({ isOpen: true, id: email.id, emailStr: email.email })}
                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                    title="Eliminar Caixa de Correio"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Barra de Progresso de Cota com Alertas */}
                              <div className="mt-4 pt-3.5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                <div className="sm:col-span-8">
                                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                                    <div className="flex items-center space-x-1.5">
                                      <HardDrive className="h-3.5 w-3.5 text-gray-500" />
                                      <span className="text-gray-700">Uso de Armazenamento:</span>
                                      <span className="font-bold text-gray-900">{storageStats.usedMB} MB</span>
                                      <span className="text-gray-400">/ {storageStats.limitGB} GB ({storageStats.limitMB} MB)</span>
                                    </div>
                                    <span className={`font-bold ${
                                      storageStats.isCritical ? 'text-rose-600' : storageStats.isNearLimit ? 'text-amber-600' : 'text-gray-600'
                                    }`}>
                                      {storageStats.percentage}%
                                    </span>
                                  </div>

                                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        storageStats.isCritical 
                                          ? 'bg-rose-500 animate-pulse' 
                                          : storageStats.isNearLimit 
                                          ? 'bg-amber-500' 
                                          : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${Math.max(4, storageStats.percentage)}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="sm:col-span-4 flex justify-start sm:justify-end">
                                  {storageStats.isCritical ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                                      <span>🚨 Armazenamento Crítico (90%+)</span>
                                    </span>
                                  ) : storageStats.isNearLimit ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                      <span>⚠️ Uso Elevado (80%+)</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100">
                                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                                      <span>Espaço Normal</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ───── ABA 2: ALIASES & REDIRECIONAMENTOS ───── */}
                {activeTab === 'aliases' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start space-x-3">
                      <Shuffle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm text-blue-950">O que são Pseudónimos (Aliases)?</p>
                        <p className="mt-0.5 leading-relaxed text-blue-800">
                          Um alias permite criar endereços adicionais (ex: <code>comercial@{currentActiveDomain}</code>) que reencaminham automaticamente todos os e-mails recebidos para a sua caixa principal ou para um e-mail externo, sem consumir cotas adicionais.
                        </p>
                      </div>
                    </div>

                    {loadingAliases ? (
                      <div className="py-12 text-center">
                        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-semibold">A carregar aliases do domínio...</p>
                      </div>
                    ) : aliases.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50/60 rounded-2xl border border-gray-200/80">
                        <Shuffle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <h3 className="text-sm font-bold text-gray-900 mb-1">Nenhum pseudónimo configurado</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                          Crie pseudónimos como <code>info@{currentActiveDomain}</code> para redirecionar mensagens para o seu e-mail principal.
                        </p>
                        <button
                          onClick={() => setShowCreateAliasModal(true)}
                          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Adicionar Novo Pseudónimo</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {aliases.map(al => (
                          <div 
                            key={al._id} 
                            className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-indigo-200 transition"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="h-9 w-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                                <Shuffle className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-extrabold text-gray-900 text-sm">{al.alias}</span>
                                  <button
                                    onClick={() => copyToClipboard(al.alias)}
                                    className="text-gray-400 hover:text-gray-700 p-0.5 rounded"
                                    title="Copiar alias"
                                  >
                                    {copiedText === al.alias ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                                <div className="flex items-center space-x-1.5 text-xs text-gray-500 mt-0.5 font-medium">
                                  <span>Redireciona para:</span>
                                  <ArrowRight className="h-3 w-3 text-indigo-500" />
                                  <span className="font-bold text-indigo-700">{al.destination}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                                ✅ Ativo
                              </span>
                              <button
                                onClick={() => setDeleteAliasConfirm({ isOpen: true, id: al._id, aliasStr: al.alias })}
                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                title="Remover Pseudónimo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ───── ABA 3: DIAGNÓSTICO DNS & ENTREGABILIDADE ───── */}
                {activeTab === 'dns' && (
                  <div className="space-y-6">
                    {/* Status Cards de SPF, DKIM, MX, DMARC */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* SPF */}
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs uppercase tracking-wider text-gray-700">SPF (Sender Policy)</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </div>
                          <p className="text-xs text-gray-500 mb-2">Autoriza os servidores da WeHost a enviar e-mails em seu nome.</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg font-mono text-[10px] text-gray-800 break-all border border-gray-200">
                          v=spf1 include:spf.migadu.com ~all
                        </div>
                      </div>

                      {/* DKIM */}
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs uppercase tracking-wider text-gray-700">DKIM (Assinatura)</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </div>
                          <p className="text-xs text-gray-500 mb-2">Assina digitalmente os e-mails para evitar cair na pasta Spam.</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg font-mono text-[10px] text-gray-800 break-all border border-gray-200">
                          key1._domainkey (CNAME)
                        </div>
                      </div>

                      {/* MX */}
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs uppercase tracking-wider text-gray-700">MX (Roteamento)</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </div>
                          <p className="text-xs text-gray-500 mb-2">Direciona as mensagens recebidas para a sua caixa de entrada.</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg font-mono text-[10px] text-gray-800 break-all border border-gray-200">
                          aspmx1.migadu.com (Prioridade 10)
                        </div>
                      </div>

                      {/* DMARC */}
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs uppercase tracking-wider text-gray-700">DMARC (Anti-Phishing)</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </div>
                          <p className="text-xs text-gray-500 mb-2">Protege a sua marca contra falsificação de identidade (spoofing).</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg font-mono text-[10px] text-gray-800 break-all border border-gray-200">
                          v=DMARC1; p=none;
                        </div>
                      </div>
                    </div>

                    {/* Tabela de Registos DNS Necessários com Botão de Cópia */}
                    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs">
                      <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-gray-900">Tabela Oficial de Registos DNS ({currentActiveDomain})</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Adicione ou confirme estes registos na sua zona DNS (cPanel, Cloudflare ou Namecheap):</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase tracking-wider">
                              <th className="py-3 px-4">Tipo</th>
                              <th className="py-3 px-4">Nome / Host</th>
                              <th className="py-3 px-4">Prioridade</th>
                              <th className="py-3 px-4">Valor / Destino</th>
                              <th className="py-3 px-4 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                            <tr className="hover:bg-gray-50/50">
                              <td className="py-3 px-4 font-bold text-blue-600">MX</td>
                              <td className="py-3 px-4 font-semibold text-gray-800">@</td>
                              <td className="py-3 px-4 font-semibold text-gray-700">10</td>
                              <td className="py-3 px-4 font-semibold text-gray-900">aspmx1.migadu.com</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => copyToClipboard('aspmx1.migadu.com')}
                                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-sans font-bold cursor-pointer"
                                >
                                  {copiedText === 'aspmx1.migadu.com' ? 'Copiado!' : 'Copiar'}
                                </button>
                              </td>
                            </tr>
                            <tr className="hover:bg-gray-50/50">
                              <td className="py-3 px-4 font-bold text-blue-600">MX</td>
                              <td className="py-3 px-4 font-semibold text-gray-800">@</td>
                              <td className="py-3 px-4 font-semibold text-gray-700">20</td>
                              <td className="py-3 px-4 font-semibold text-gray-900">aspmx2.migadu.com</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => copyToClipboard('aspmx2.migadu.com')}
                                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-sans font-bold cursor-pointer"
                                >
                                  {copiedText === 'aspmx2.migadu.com' ? 'Copiado!' : 'Copiar'}
                                </button>
                              </td>
                            </tr>
                            <tr className="hover:bg-gray-50/50">
                              <td className="py-3 px-4 font-bold text-emerald-600">TXT (SPF)</td>
                              <td className="py-3 px-4 font-semibold text-gray-800">@</td>
                              <td className="py-3 px-4 text-gray-400">-</td>
                              <td className="py-3 px-4 font-semibold text-gray-900">v=spf1 include:spf.migadu.com ~all</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => copyToClipboard('v=spf1 include:spf.migadu.com ~all')}
                                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-sans font-bold cursor-pointer"
                                >
                                  {copiedText === 'v=spf1 include:spf.migadu.com ~all' ? 'Copiado!' : 'Copiar'}
                                </button>
                              </td>
                            </tr>
                            <tr className="hover:bg-gray-50/50">
                              <td className="py-3 px-4 font-bold text-purple-600">CNAME (DKIM 1)</td>
                              <td className="py-3 px-4 font-semibold text-gray-800">key1._domainkey</td>
                              <td className="py-3 px-4 text-gray-400">-</td>
                              <td className="py-3 px-4 font-semibold text-gray-900">key1.{currentActiveDomain}._domainkey.migadu.com</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => copyToClipboard(`key1.${currentActiveDomain}._domainkey.migadu.com`)}
                                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-sans font-bold cursor-pointer"
                                >
                                  {copiedText === `key1.${currentActiveDomain}._domainkey.migadu.com` ? 'Copiado!' : 'Copiar'}
                                </button>
                              </td>
                            </tr>
                            <tr className="hover:bg-gray-50/50">
                              <td className="py-3 px-4 font-bold text-indigo-600">TXT (DMARC)</td>
                              <td className="py-3 px-4 font-semibold text-gray-800">_dmarc</td>
                              <td className="py-3 px-4 text-gray-400">-</td>
                              <td className="py-3 px-4 font-semibold text-gray-900">v=DMARC1; p=none; sp=none;</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => copyToClipboard('v=DMARC1; p=none; sp=none;')}
                                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-sans font-bold cursor-pointer"
                                >
                                  {copiedText === 'v=DMARC1; p=none; sp=none;' ? 'Copiado!' : 'Copiar'}
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* ───── CONFIGURAÇÃO IMAP/SMTP GERAL ───── */}
            <div className="bg-white border border-blue-200 rounded-3xl p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900 text-base">Parâmetros de Conexão (Outlook, iPhone, Android &amp; Webmail)</h3>
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    Utilize estas credenciais para sincronizar as suas contas no seu computador ou telemóvel:
                  </p>
                </div>
                <Link
                  href="/ajuda/configurar-email"
                  target="_blank"
                  className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0 active:scale-95"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Guia Passo a Passo (Outlook / Telemóvel)</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-1">IMAP (Entrada):</span>
                  <span className="font-mono text-gray-800 block text-xs break-all">imap.migadu.com</span>
                  <span className="text-gray-500 font-mono text-[11px] block">Porta 993 (SSL)</span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-1">POP3 (Entrada):</span>
                  <span className="font-mono text-gray-800 block text-xs break-all">pop.migadu.com</span>
                  <span className="text-gray-500 font-mono text-[11px] block">Porta 995 (SSL)</span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-1">SMTP (Envio):</span>
                  <span className="font-mono text-gray-800 block text-xs break-all">smtp.migadu.com</span>
                  <span className="text-gray-500 font-mono text-[11px] block">Porta 465 / 587 (SSL)</span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-1">Webmail Oficial:</span>
                  <span className="font-mono text-blue-700 font-bold block text-xs break-all">wehosthere.com/webmail</span>
                  <span className="text-gray-500 font-mono text-[11px] block">Acesso via Navegador</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ───── MODAL 1: CRIAR NOVA CONTA DE EMAIL ───── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <span>Nova Conta de Email</span>
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Endereço de E-mail *
                </label>
                <div className="flex rounded-xl shadow-xs">
                  <input
                    type="text"
                    value={newEmailPrefix}
                    onChange={(e) => setNewEmailPrefix(e.target.value.toLowerCase().trim())}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-l-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="contacto"
                    required
                  />
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="bg-gray-100 border border-l-0 border-gray-200 rounded-r-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-gray-700 focus:outline-none"
                  >
                    {userDomains.map(d => (
                      <option key={d} value={d}>@{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Senha de Acesso *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateRandomPassword())}
                    className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Gerar Segura
                  </button>
                </div>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Defina ou gere uma senha..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Cota de Armazenamento
                </label>
                <select
                  value={newStorage}
                  onChange={(e) => setNewStorage(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none"
                >
                  <option value={1}>1 GB (Padrão Corporativo)</option>
                  <option value={2}>2 GB</option>
                  <option value={5}>5 GB (Profissional)</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── MODAL 2: CRIAR NOVO ALIAS ───── */}
      {showCreateAliasModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shuffle className="h-5 w-5 text-indigo-600" />
                <span>Novo Pseudónimo (Alias)</span>
              </h2>
              <button
                onClick={() => setShowCreateAliasModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlias} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Endereço Alias (Origem) *
                </label>
                <div className="flex rounded-xl shadow-xs">
                  <input
                    type="text"
                    value={newAliasPrefix}
                    onChange={(e) => setNewAliasPrefix(e.target.value.toLowerCase().trim())}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-l-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="comercial"
                    required
                  />
                  <span className="bg-gray-100 border border-l-0 border-gray-200 rounded-r-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-gray-700 flex items-center">
                    @{currentActiveDomain}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  E-mail de Destino (Para onde reencaminhar) *
                </label>
                <input
                  type="email"
                  value={newAliasDestination}
                  onChange={(e) => setNewAliasDestination(e.target.value.toLowerCase().trim())}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="exemplo@gmail.com ou geral@empresa.com"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateAliasModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAlias}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isCreatingAlias ? 'A Criar...' : 'Salvar Alias'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── MODAL 3: EDITAR SENHA & COTA ───── */}
      {editEmailAccount && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                <span>Configurar Conta</span>
              </h2>
              <button
                type="button"
                onClick={() => setEditEmailAccount(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editSuccessMsg ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-gray-900">{editSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSaveEditEmail} className="space-y-4">
                {editErrorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <span>{editErrorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Conta Selecionada
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editEmailAccount.email}
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-600 font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Nova Senha (Opcional)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const pass = generateRandomPassword();
                        setEditPassword(pass);
                        setConfirmPassword(pass);
                      }}
                      className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Gerar
                    </button>
                  </div>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Deixe em branco para manter a atual"
                  />
                </div>

                {editPassword && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Repita a nova senha"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Cota de Armazenamento
                  </label>
                  <select
                    value={editStorage}
                    onChange={(e) => setEditStorage(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none"
                  >
                    <option value={1}>1 GB</option>
                    <option value={2}>2 GB</option>
                    <option value={5}>5 GB</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditEmailAccount(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingEmail}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    {isUpdatingEmail ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>A Atualizar...</span>
                      </>
                    ) : (
                      <span>Salvar Alterações</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão de E-mail */}
      <ConfirmModal
        isOpen={Boolean(deleteEmailConfirm?.isOpen)}
        title="Eliminar Conta de E-mail"
        message={`Tem a certeza de que deseja eliminar a conta "${deleteEmailConfirm?.emailStr}"? Todas as mensagens e dados armazenados nesta caixa serão permanentemente removidos.`}
        confirmText="Sim, Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmDeleteEmail}
        onCancel={() => setDeleteEmailConfirm(null)}
      />

      {/* Confirmação de Exclusão de Alias */}
      <ConfirmModal
        isOpen={Boolean(deleteAliasConfirm?.isOpen)}
        title="Remover Pseudónimo"
        message={`Tem a certeza de que deseja remover o pseudónimo "${deleteAliasConfirm?.aliasStr}"?`}
        confirmText="Sim, Remover"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmDeleteAlias}
        onCancel={() => setDeleteAliasConfirm(null)}
      />

      {/* Toast */}
      {toastMsg && (
        <Toast
          title={toastMsg.title}
          message={toastMsg.message}
          type={toastMsg.type}
          onClose={() => setToastMsg(null)}
        />
      )}
    </div>
  );
}

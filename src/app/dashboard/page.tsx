'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Server, Mail, LayoutDashboard, Settings, LogOut, 
  Plus, Globe, Database, TrendingUp, Users, CheckCircle, Sparkles, ArrowRight, Link2, Loader2, ShoppingBag,
  Activity, Cpu, HardDrive, Wifi, ShieldCheck, Zap, Star, Bell, X, Download, Layers
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager } from '@/lib/data';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { usePWAInstall } from '@/hooks/usePWAInstall';

import DashboardNav from '@/components/DashboardNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageLoader from '@/components/PageLoader';
import { useLanguage } from '@/context/LanguageContext';

function CircularProgress({ percentage, colorClass, size = 64, strokeWidth = 6 }: { percentage: number; colorClass: string; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={`${colorClass} transition-all duration-1000 ease-out`}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-black text-gray-900">{Math.round(percentage)}%</span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncingCounts, setIsSyncingCounts] = useState(true);
  const [siteCount, setSiteCount] = useState(0);
  const [emailCount, setEmailCount] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal, setStorageTotal] = useState(10);
  const [bandwidthUsed, setBandwidthUsed] = useState(2.4);
  const [bandwidthTotal, setBandwidthTotal] = useState(100);
  const [ramUsed, setRamUsed] = useState(0.5);
  const [ramTotal, setRamTotal] = useState(2);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [showPWAInstallBanner, setShowPWAInstallBanner] = useState(false);
  const [showBirthdayBanner, setShowBirthdayBanner] = useState(false);
  const [birthdayInput, setBirthdayInput] = useState('');
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  
  const {
    permission,
    subscription,
    requestPermission,
    unsubscribe,
    isSupported
  } = usePushNotifications();

  const {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissInstall
  } = usePWAInstall();

  useEffect(() => {
    // Primeiro verificar NextAuth (Google Login)
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
    } else {
      // Fallback para sistema customizado
      currentUser = auth.getCurrentUser();
    }
    
    console.log('[Dashboard Auth Check] Session status:', status, 'Session user:', session?.user, 'Local user:', currentUser);

    if (!currentUser) {
      console.log('[Dashboard Auth Check] Nenhum utilizador encontrado, redirecionando para /login');
      window.location.href = '/login';
      return;
    }
    
    if (auth.isAdminUser(currentUser) && !auth.isClientViewActive()) {
      console.log('[Dashboard Auth Check] 👑 Admin detetado localmente! Redirecionando para /admin');
      window.location.replace('/admin');
      return;
    }

    // 🔄 Sincronizar dados atualizados do utilizador do servidor MongoDB (plano, status, dueDate, role)
    if (currentUser.email) {
      fetch('/api/users?email=' + encodeURIComponent(currentUser.email))
        .then(r => r.json())
        .then(data => {
          const serverUser = data.user || (data.users && data.users.find((u: any) => u.email?.toLowerCase() === currentUser?.email?.toLowerCase()));
          if (serverUser) {
            if (!auth.isClientViewActive() && (serverUser.role === 'admin' || serverUser.role === 'super_admin')) {
              const updated = { ...currentUser, role: serverUser.role, status: serverUser.status || 'active', plan: serverUser.plan || 'enterprise' };
              localStorage.setItem('wehosthere_auth', JSON.stringify({ user: updated }));
              localStorage.setItem(`user_${serverUser.id || currentUser?.id}`, JSON.stringify(updated));
              window.location.replace('/admin');
              return;
            }

            // Sincronizar dados do utilizador do MongoDB
            const updatedUser: User = {
              ...currentUser,
              plan: serverUser.plan || currentUser.plan,
              status: serverUser.status || currentUser.status,
              dueDate: serverUser.dueDate !== undefined ? serverUser.dueDate : currentUser.dueDate,
              createdAt: serverUser.createdAt || currentUser.createdAt
            };
            setUser(updatedUser);
            if (typeof window !== 'undefined') {
              const sessStr = localStorage.getItem('wehosthere_auth');
              if (sessStr) {
                try {
                  const sess = JSON.parse(sessStr);
                  sess.user = { ...sess.user, ...updatedUser };
                  localStorage.setItem('wehosthere_auth', JSON.stringify(sess));
                } catch {}
              }
              localStorage.setItem(`user_${serverUser.id || currentUser?.id}`, JSON.stringify(updatedUser));
            }
          }
        })
        .catch(err => console.error('[Dashboard Server User Error]:', err));
    }
    
    setUser(currentUser);
    
    // Carregar contadores iniciais
    const userEmail = currentUser.email;
    const sites = dataManager.getSites(userEmail);
    const emails = dataManager.getEmails(userEmail);
    setSiteCount(sites.length);
    setEmailCount(emails.length);
    const usedStorage = sites.reduce((sum, s) => sum + (s.storage || 0), 0)
      + emails.reduce((sum, e) => sum + (e.storage || 0), 0);
    setStorageUsed(usedStorage);
    const planLimits: Record<string, { storage: number; bandwidth: number; ram: number }> = {
      basic: { storage: 10, bandwidth: 100, ram: 2 },
      pro: { storage: 50, bandwidth: 500, ram: 8 },
      enterprise: { storage: 200, bandwidth: 2000, ram: 16 }
    };
    const limits = planLimits[currentUser.plan] || planLimits.basic;
    setStorageTotal(limits.storage);
    setBandwidthTotal(limits.bandwidth);
    setRamTotal(limits.ram);

    const initialBw = Math.min(limits.bandwidth, Math.round((sites.length * 4.2 + emails.length * 0.5 + 1.2) * 10) / 10);
    const initialRam = Math.min(limits.ram, Math.round((0.4 + sites.length * 0.3) * 10) / 10);
    setBandwidthUsed(initialBw);
    setRamUsed(initialRam);
    setLoading(false);

    // Verificar se o utilizador já preencheu a data de aniversário
    if (!currentUser.birthdate && typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('birthday_prompt_dismissed');
      if (!dismissed) {
        setShowBirthdayBanner(true);
      }
    }

    // Sincronizar assincronamente os contadores e pedidos via API MongoDB
    Promise.all([
      dataManager.fetchSitesAsync(userEmail),
      dataManager.fetchEmailsAsync(userEmail),
      fetch(`/api/orders?userEmail=${encodeURIComponent(userEmail)}`).then(r => r.json()).catch(() => ({ orders: [] }))
    ]).then(([fetchedSites, fetchedEmails, ordersData]) => {
      setSiteCount(fetchedSites.length);
      setEmailCount(fetchedEmails.length);
      const used = fetchedSites.reduce((sum, s) => sum + (s.storage || 0), 0)
        + fetchedEmails.reduce((sum, e) => sum + (e.storage || 0), 0);
      setStorageUsed(used);
      const bw = Math.min(limits.bandwidth, Math.round((fetchedSites.length * 4.2 + fetchedEmails.length * 0.5 + 1.2) * 10) / 10);
      const r = Math.min(limits.ram, Math.round((0.4 + fetchedSites.length * 0.3) * 10) / 10);
      setBandwidthUsed(bw);
      setRamUsed(r);
      const rawOrders = ordersData?.orders || [];
      if (Array.isArray(rawOrders)) {
        setOrders(rawOrders);
      }
      setIsSyncingCounts(false);
    }).catch(() => {
      setIsSyncingCounts(false);
    });
  }, [session, status, router]);

  // Check if should show push notification banner
  useEffect(() => {
    if (!user || !isSupported) return;
    
    // Check if user is new (created within last 7 days) and hasn't activated push
    const isNewUser = user.createdAt && 
      (new Date(user.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const hasNotActivated = !subscription && permission === 'default';
    
    // Check if user has already dismissed the banner
    const hasDismissedBanner = localStorage.getItem('pushBannerDismissed');
    
    if (isNewUser && hasNotActivated && !hasDismissedBanner) {
      setShowPushBanner(true);
    }
  }, [user, subscription, permission, isSupported]);

  // Check if should show PWA install banner
  useEffect(() => {
    if (!user) return;
    
    // Check if user has already dismissed the PWA install banner
    const hasDismissedPWA = localStorage.getItem('pwaInstallDismissed');
    
    if (isInstallable && !isInstalled && !hasDismissedPWA) {
      setShowPWAInstallBanner(true);
    }
  }, [isInstallable, isInstalled, user]);

  const handleDismissPushBanner = () => {
    setShowPushBanner(false);
    localStorage.setItem('pushBannerDismissed', 'true');
  };

  const handleActivatePush = async () => {
    const success = await requestPermission();
    if (success) {
      setShowPushBanner(false);
      localStorage.setItem('pushBannerDismissed', 'true');
    }
  };

  const handleDismissPWAInstallBanner = () => {
    setShowPWAInstallBanner(false);
    localStorage.setItem('pwaInstallDismissed', 'true');
  };

  const handleInstallPWA = async () => {
    const success = await promptInstall();
    if (success) {
      setShowPWAInstallBanner(false);
      localStorage.removeItem('pwaInstallDismissed');
    }
  };

  const handleSaveBirthday = async () => {
    if (!user || !birthdayInput) return;
    setSavingBirthday(true);
    try {
      const updatedUser = { ...user, birthdate: birthdayInput };
      setUser(updatedUser);
      const userData = JSON.parse(localStorage.getItem(`user_${user.id}`) || '{}');
      userData.birthdate = birthdayInput;
      localStorage.setItem(`user_${user.id}`, JSON.stringify(userData));

      const sessionData = localStorage.getItem('wehosthere_auth');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.user) parsed.user.birthdate = birthdayInput;
        localStorage.setItem('wehosthere_auth', JSON.stringify(parsed));
      }

      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          user: {
            id: user.id,
            email: user.email,
            birthdate: birthdayInput
          }
        })
      });

      setShowBirthdayBanner(false);
    } catch (err) {
      console.warn('Erro ao guardar data de aniversário:', err);
    } finally {
      setSavingBirthday(false);
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await auth.logout();
    try {
      signOut({ callbackUrl: '/?logged_out=1' });
    } catch (_) {
      window.location.href = '/?logged_out=1';
    }
  };

  if (loading) {
    return <PageLoader text="A carregar o seu painel..." />;
  }

  if (isLoggingOut) {
    return <PageLoader text="A encerrar a sua sessão com segurança..." />;
  }

  if (!user) {
    return null;
  }

  const getPlanInfo = (plan: string) => {
    const plans = {
      basic: { name: 'Básico', color: 'bg-gray-100 text-gray-800' },
      pro: { name: 'Profissional', color: 'bg-primary-100 text-primary-800' },
      enterprise: { name: 'Empresarial', color: 'bg-purple-100 text-purple-800' }
    };
    return plans[plan as keyof typeof plans] || plans.basic;
  };

  const planInfo = getPlanInfo(user.plan);

  // Calcular dias até expiração do plano
  const getDaysUntilExpiry = () => {
    if (!user || user.status !== 'active' || user.plan === 'none') return null;

    const today = new Date();

    // 1. Verificar se existe um pagamento recente de plano concluído nos últimos 30 dias
    const completedOrders = orders.filter((o: any) => {
      const isCompleted = o.status === 'completed' || o.status === 'approved' || o.status === 'active';
      return isCompleted;
    });

    if (completedOrders.length > 0) {
      completedOrders.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      const latestOrder = completedOrders[0];
      const orderDate = new Date(latestOrder.createdAt || today);
      const diffMs = today.getTime() - orderDate.getTime();
      const daysSincePayment = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Se o pagamento foi concluído nos últimos 30 dias (ex: hoje = 0 dias), restam (30 - dias)
      if (daysSincePayment >= 0 && daysSincePayment < 30) {
        return 30 - daysSincePayment;
      }
    }

    // 2. Se a conta ou plano foi ativado recentemente (últimos 30 dias), calcular 30 dias desde a criação
    if (user.createdAt) {
      const createdDate = new Date(user.createdAt);
      const diffMs = today.getTime() - createdDate.getTime();
      const daysSinceCreation = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (daysSinceCreation >= 0 && daysSinceCreation < 30) {
        return 30 - daysSinceCreation;
      }
    }

    // 3. Fallback: Cálculo baseado em dueDate
    if (!user.dueDate || typeof user.dueDate !== 'number') return null;
    const currentDay = today.getDate();
    const dueDay = user.dueDate;

    if (dueDay > currentDay) {
      return dueDay - currentDay;
    } else {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
      const diffTime = nextMonth.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Responsivo do Dashboard */}
      <DashboardNav userName={user.name} userAvatar={user.avatar} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Banner de Status Pendente - Só mostra se não tiver plano ativo E não tiver sites/emails */}
            {user.status === 'pending' && user.plan === 'none' && siteCount === 0 && emailCount === 0 && (
              <div className="bg-amber-50/90 border border-amber-300/80 rounded-xl p-2.5 sm:p-3.5 flex items-center justify-between gap-2.5 text-amber-950 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base sm:text-lg flex-shrink-0">⏳</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-amber-950 truncate">Ative a sua hospedagem</h3>
                    <p className="text-[11px] text-amber-800 hidden sm:block">Aceda à faturação para escolher o seu plano.</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/billing"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shadow-sm transition flex-shrink-0"
                >
                  Ver Planos →
                </Link>
              </div>
            )}

            {/* Banner de Aviso de Expiração */}
            {isExpiringSoon && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-orange-900 shadow-sm">
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">⚠️</span>
                  <div>
                    <h3 className="font-bold text-orange-950 text-xs sm:text-base">{t('dash.expiring_soon')}</h3>
                    <p className="text-[10px] sm:text-sm text-orange-800 mt-0.5">
                      {daysUntilExpiry} dia{daysUntilExpiry === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/billing"
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap shadow transition"
                >
                  {t('dash.renew_plan')}
                </Link>
              </div>
            )}

            {/* Banner de Incentivo para Ativar Notificações Push */}
            {showPushBanner && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 sm:p-3.5 flex items-center justify-between gap-2.5 text-blue-950 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="bg-blue-100 p-1.5 rounded-lg flex-shrink-0">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-blue-950 truncate">{t('dash.push_title')}</h3>
                    <p className="text-[11px] text-blue-800 hidden sm:block truncate">
                      {t('dash.push_desc')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={handleActivatePush}
                    className="px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shadow-sm transition cursor-pointer"
                  >
                    {t('dash.push_btn')}
                  </button>
                  <button
                    onClick={handleDismissPushBanner}
                    className="p-1 hover:bg-blue-200 rounded-lg transition cursor-pointer text-blue-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Banner de Instalação PWA */}
            {showPWAInstallBanner && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 sm:p-3.5 flex items-center justify-between gap-2.5 text-purple-950 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 flex-shrink-0 bg-white rounded-lg p-0.5 shadow-sm border border-purple-200 flex items-center justify-center">
                    <img 
                      src="/mascote-transparent.png" 
                      alt="WEHOSTHERE App" 
                      className="w-6 h-6 object-contain drop-shadow" 
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-purple-950 truncate">{t('dash.pwa_title')}</h3>
                    <p className="text-[11px] text-purple-800 hidden sm:block truncate">
                      {t('dash.pwa_desc')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={handleInstallPWA}
                    className="px-2.5 sm:px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shadow-sm transition cursor-pointer"
                  >
                    {t('dash.pwa_btn')}
                  </button>
                  <button
                    onClick={handleDismissPWAInstallBanner}
                    className="p-1 hover:bg-purple-200 rounded-lg transition cursor-pointer text-purple-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Welcome Card com Datacenter Background */}
            <div className="relative overflow-hidden bg-slate-950 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 text-white border border-slate-800">
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 mix-blend-luminosity"
                style={{ backgroundImage: "url('/datacenter-bg.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-primary-950/80" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{t('dash.welcome_title')}, {user.name}!</h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-extrabold uppercase tracking-wider ${
                    user.plan === 'enterprise' ? 'bg-purple-500/25 text-purple-200 border border-purple-400/40 shadow-sm' :
                    user.plan === 'pro' ? 'bg-blue-500/25 text-blue-200 border border-blue-400/40 shadow-sm' :
                    user.plan === 'basic' ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-sm' :
                    'bg-slate-700/60 text-slate-300 border border-slate-600'
                  }`}>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Plano {planInfo.name}</span>
                  </span>
                </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Link
                  href="/dashboard/sites"
                  className="flex items-center space-x-1.5 sm:space-x-2 bg-emerald-500 hover:bg-emerald-400 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-lg font-bold text-[10px] sm:text-sm shadow-md transition"
                >
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>{t('dash.btn_new_site')}</span>
                </Link>
                <Link
                  href="/dashboard/email"
                  className="flex items-center space-x-1.5 sm:space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-lg font-bold text-[10px] sm:text-sm shadow-md transition"
                >
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>{t('dash.btn_email')}</span>
                </Link>
                <Link
                  href="/dashboard/domains"
                  className="flex items-center space-x-1.5 sm:space-x-2 bg-white text-gray-900 hover:bg-gray-100 px-3 sm:px-5 py-2 sm:py-3 rounded-lg transition font-bold text-[10px] sm:text-sm shadow-sm"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                  <span>Registar Domínio</span>
                </Link>
                <Link
                  href="/dashboard/visual-builder"
                  className="flex items-center space-x-1.5 sm:space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-lg font-extrabold text-[10px] sm:text-sm shadow-md transition"
                >
                  <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  <span>Editor Visual Pro</span>
                </Link>
                <Link
                  href="/site-quote"
                  className="flex items-center space-x-1.5 sm:space-x-2 bg-amber-400 hover:bg-amber-300 text-gray-900 px-3 sm:px-5 py-2 sm:py-3 rounded-lg font-extrabold text-[10px] sm:text-sm shadow-md transition"
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900" />
                  <span>{t('dash.btn_request_site')}</span>
                </Link>
                <Link
                  href="/dashboard/systems"
                  className="flex items-center space-x-1.5 sm:space-x-2 bg-purple-500 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-lg hover:bg-purple-400 transition font-semibold text-[10px] sm:text-sm"
                >
                  <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>{t('dash.btn_systems')}</span>
                </Link>
                <Link
                  href="/dashboard/uptime"
                  className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-800 text-slate-200 hover:text-white px-3 sm:px-5 py-2 sm:py-3 rounded-lg hover:bg-slate-700 transition font-semibold text-[10px] sm:text-sm"
                >
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                  <span>{t('dash.btn_uptime')}</span>
                </Link>
                </div>
              </div>
            </div>

            {/* Seção de Saúde do Servidor & Recursos (estilo cPanel / Cloudflare) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-5 border-b border-gray-100 gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-600" />
                    <span>{t('dash.server_status')}</span>
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>{t('dash.all_systems_operational')}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* 1. Armazenamento SSD */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1">
                      <HardDrive className="h-4 w-4 text-blue-600" />
                      <span>{t('dash.storage_nvme')}</span>
                    </div>
                    <p className="text-xl font-black text-gray-900">
                      {storageUsed} GB <span className="text-xs font-normal text-gray-500">/ {storageTotal} GB</span>
                    </p>
                  </div>
                  <CircularProgress
                    percentage={Math.min(100, (storageUsed / storageTotal) * 100)}
                    colorClass="text-blue-600"
                    size={58}
                  />
                </div>

                {/* 2. Tráfego Mensal (Bandwidth) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1">
                      <Wifi className="h-4 w-4 text-purple-600" />
                      <span>{t('dash.traffic_bw')}</span>
                    </div>
                    <p className="text-xl font-black text-gray-900">
                      {bandwidthUsed} GB <span className="text-xs font-normal text-gray-500">/ {bandwidthTotal} GB</span>
                    </p>
                  </div>
                  <CircularProgress
                    percentage={Math.min(100, (bandwidthUsed / bandwidthTotal) * 100)}
                    colorClass="text-purple-600"
                    size={58}
                  />
                </div>

                {/* 3. Memória RAM / vCPU */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1">
                      <Cpu className="h-4 w-4 text-emerald-600" />
                      <span>{t('dash.ram_memory')}</span>
                    </div>
                    <p className="text-xl font-black text-gray-900">
                      {ramUsed} GB <span className="text-xs font-normal text-gray-500">/ {ramTotal} GB RAM</span>
                    </p>
                  </div>
                  <CircularProgress
                    percentage={Math.min(100, (ramUsed / ramTotal) * 100)}
                    colorClass="text-emerald-600"
                    size={58}
                  />
                </div>
              </div>
            </div>

            {/* Stats RÁPIDOS */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <Link href="/dashboard/sites" className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition cursor-pointer group border border-gray-100">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] sm:text-sm text-gray-500">Sites</span>
                </div>
                {isSyncingCounts ? (
                  <div className="flex items-center space-x-2 text-primary-600 my-1 font-semibold">
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                    <span className="text-[10px] sm:text-sm text-gray-600">A processar...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{siteCount}</p>
                    <p className="text-[10px] sm:text-sm text-gray-600 mt-1">
                      {siteCount === 0 ? 'Nenhum site configurado' : `${siteCount} site${siteCount > 1 ? 's' : ''} activo${siteCount > 1 ? 's' : ''}`}
                    </p>
                  </>
                )}
              </Link>

              <Link href="/dashboard/email" className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition cursor-pointer group border border-gray-100">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] sm:text-sm text-gray-500">Emails</span>
                </div>
                {isSyncingCounts ? (
                  <div className="flex items-center space-x-2 text-primary-600 my-1 font-semibold">
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                    <span className="text-[10px] sm:text-sm text-gray-600">A processar...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{emailCount}</p>
                    <p className="text-[10px] sm:text-sm text-gray-600 mt-1">
                      {emailCount === 0 ? 'Nenhuma conta configurada' : `${emailCount} conta${emailCount > 1 ? 's' : ''} activa${emailCount > 1 ? 's' : ''}`}
                    </p>
                  </>
                )}
              </Link>

              <Link href="/dashboard/billing" className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition cursor-pointer group border border-gray-100">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] sm:text-sm text-gray-500">Plano</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{planInfo.name}</p>
                <p className="text-[10px] sm:text-sm text-emerald-600 font-semibold mt-1">✓ Status Ativo</p>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{t('dash.quick_actions')}</h2>
              <div className="grid sm:grid-cols-2 gap-2 sm:gap-4">
                <Link
                  href="/site-quote"
                  className="flex items-center space-x-2 sm:space-x-4 p-3 sm:p-4 border-2 border-amber-300 bg-amber-50/60 rounded-xl hover:bg-amber-100/70 transition"
                >
                  <div className="bg-amber-500 p-2 sm:p-3 rounded-lg text-white">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm">
                      <span>{t('dash.btn_request_site')}</span>
                    </h3>
                  </div>
                </Link>

                <Link
                  href="/dashboard/sites"
                  className="flex items-center space-x-2 sm:space-x-4 p-3 sm:p-4 border rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="bg-primary-100 p-2 sm:p-3 rounded-lg">
                    <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">{t('dash.btn_new_site')}</h3>
                  </div>
                </Link>

                <Link
                  href="/dashboard/email"
                  className="flex items-center space-x-2 sm:space-x-4 p-3 sm:p-4 border rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="bg-primary-100 p-2 sm:p-3 rounded-lg">
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">{t('dash.btn_email')}</h3>
                  </div>
                </Link>

                <Link
                  href="/dashboard/billing"
                  className="flex items-center space-x-2 sm:space-x-4 p-3 sm:p-4 border rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="bg-primary-100 p-2 sm:p-3 rounded-lg">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">{t('dash.upgrade_plan')}</h3>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Atividade Recente</h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-gray-900 text-xs sm:text-sm">Conta criada com sucesso</p>
                    <p className="text-[10px] sm:text-sm text-gray-600">Bem-vindo à WEHOSTHERE!</p>
                  </div>
                  <span className="text-[10px] sm:text-sm text-gray-500">Agora</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

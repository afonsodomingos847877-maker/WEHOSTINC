'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Database, CheckCircle, LayoutDashboard, Globe, Mail, Settings as SettingsIcon, LogOut, Server,
  CreditCard, TrendingUp, Calendar, Zap, Shield, Download, Printer
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { hostingPlans, dataManager, ServiceOrder } from '@/lib/data';
import DashboardNav from '@/components/DashboardNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageLoader from '@/components/PageLoader';
import ReceiptModal, { ReceiptData } from '@/components/ReceiptModal';
import Toast from '@/components/Toast';
import { Clock, XCircle, FileText } from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';
import { getCached, setCached } from '@/lib/pageCache';
import { InvoiceItem } from '@/lib/models/Invoice';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  issuedAt: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  items: InvoiceItem[];
  total: number;
  currency: string;
}

export default function BillingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(() => getCached<User>('billing:user') || null);
  const [loading, setLoading] = useState(() => !getCached('billing:user'));
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [userOrders, setUserOrders] = useState<ServiceOrder[]>(() => getCached<ServiceOrder[]>('billing:orders') || []);
  const [invoices, setInvoices] = useState<Invoice[]>(() => getCached<Invoice[]>('billing:invoices') || []);
  const [siteCount, setSiteCount] = useState(0);
  const [emailCount, setEmailCount] = useState(0);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; title?: string; message: string } | null>(null);

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

    const initialSites = dataManager.getSites(currentUser.email);
    const initialEmails = dataManager.getEmails(currentUser.email);
    setSiteCount(initialSites.length);
    setEmailCount(initialEmails.length);

    // Sync live from server
    Promise.all([
      dataManager.fetchSitesAsync(currentUser.email),
      dataManager.fetchEmailsAsync(currentUser.email)
    ]).then(([fetchedSites, fetchedEmails]) => {
      setSiteCount(fetchedSites.length);
      setEmailCount(fetchedEmails.length);
    });

    const refreshOrders = (fetchedOrders?: ServiceOrder[]) => {
      const allOrders = fetchedOrders || dataManager.getOrders();
      const myOrders = allOrders.filter(
        o => o.clientEmail.toLowerCase() === currentUser.email.toLowerCase() ||
             o.clientName.toLowerCase() === currentUser.name.toLowerCase()
      );
      setUserOrders(myOrders);
    };

    refreshOrders();
    setLoading(false);
    setCached('billing:user', currentUser);
    setCached('billing:orders', dataManager.getOrders());

    dataManager.fetchOrdersAsync().then((fetched) => refreshOrders(fetched));

    // Carregar faturas manuais
    const loadInvoices = async () => {
      try {
        const res = await fetch('/api/invoices');
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices || []);
          setCached('billing:invoices', data.invoices || []);
        }
      } catch (e) {
        console.error('Erro ao carregar faturas:', e);
      }
    };
    loadInvoices();

    const interval = setInterval(() => {
      dataManager.fetchOrdersAsync().then((fetched) => refreshOrders(fetched));
      dataManager.fetchSitesAsync(currentUser.email).then(s => setSiteCount(s.length));
      dataManager.fetchEmailsAsync(currentUser.email).then(e => setEmailCount(e.length));
      loadInvoices();
    }, 15000);

    return () => clearInterval(interval);
  }, [session, status, router]);

  const handleUpgrade = (planId: string) => {
    router.push(`/checkout?plan=${planId}`);
  };

  const hasActiveService = userOrders.filter(o => o.status === 'completed' || o.status === 'in_progress').length > 0 || siteCount > 0 || emailCount > 0 || (user?.plan && user.plan !== 'none');

  const getCurrentPlan = () => {
    if (!user) return null;
    if (user.plan && user.plan !== 'none') {
      return hostingPlans.find(p => p.id === user.plan) || hostingPlans[0];
    }
    if (siteCount > 0 || emailCount > 0) {
      return hostingPlans.find(p => p.id === 'basic') || hostingPlans[0];
    }
    return hostingPlans[0];
  };

  if (loading) {
    return <PageLoader text="A carregar os seus dados de faturamento..." />;
  }

  if (isLoggingOut) {
    return <PageLoader text="A encerrar a sua sessão com segurança..." />;
  }

  if (!user) return null;

  const currentPlan = getCurrentPlan();

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
            {/* Serviços & Assinaturas Contratadas */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg p-4 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-1">
                    {hasActiveService
                      ? 'Serviços & Assinaturas Contratadas'
                      : 'Sem Assinatura Ativa'}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {hasActiveService
                      ? 'Hospedagem & Email corporativo ativos'
                      : 'Nenhum plano ativo no momento'}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-3xl sm:text-4xl font-bold">
                    {userOrders.filter(o => o.status === 'completed' || o.status === 'in_progress').reduce((acc, o) => acc + (o.amount || 0), 0).toLocaleString('pt-MZ')} MT
                  </p>
                  <p className="text-blue-100 text-sm">Total Contratado</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <Globe className="h-6 w-6 mb-2 text-emerald-300" />
                  <p className="font-semibold text-lg">{siteCount} Domínio(s)</p>
                  <p className="text-sm text-blue-100">Sites Registados</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <Mail className="h-6 w-6 mb-2 text-blue-300" />
                  <p className="font-semibold text-lg">{emailCount} Caixa(s)</p>
                  <p className="text-sm text-blue-100">E-mails Corporativos</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <CreditCard className="h-6 w-6 mb-2 text-purple-300" />
                  <p className="font-semibold text-lg">{userOrders.filter(o => o.status === 'completed').length} Pago(s)</p>
                  <p className="text-sm text-blue-100">Faturas Liquidadas</p>
                </div>
              </div>
            </div>

            {/* Banner de Ação Rápida no Faturamento */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-500/80 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <span>Contratar ou Renovar Plano</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Escolha um plano abaixo ou pague diretamente no checkout.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Link
                    href="/checkout"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center space-x-1.5"
                  >
                    <span>Ir ao Checkout →</span>
                  </Link>
                  <Link
                    href="/site-quote"
                    className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs sm:text-sm rounded-xl transition flex items-center space-x-1.5"
                  >
                    <span>✨ Solicitar Site</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Histórico de Pagamentos & Faturas</h3>
                  <p className="text-xs text-gray-400">
                    <a href="mailto:info@wehosthere.com" className="hover:underline">info@wehosthere.com</a>
                    {' • '}
                    <a
                      href="https://wa.me/258848335618"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline"
                    >+258 84 833 5618</a>
                  </p>
                </div>
                <span className="bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full border border-primary-200">
                  {userOrders.length} {userOrders.length === 1 ? 'Fatura' : 'Faturas'}
                </span>
              </div>

              {userOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Nenhum histórico de fatura registado ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {userOrders.map((order) => {
                    const statusConfig = {
                      completed: { label: 'Pago / Ativo', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-100' },
                      in_progress: { label: 'Em Processamento', bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: Clock, iconColor: 'text-blue-600', iconBg: 'bg-blue-100' },
                      pending: { label: 'Pagamento Pendente', bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock, iconColor: 'text-amber-600', iconBg: 'bg-amber-100' },
                      suspended: { label: 'Suspenso', bg: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle, iconColor: 'text-rose-600', iconBg: 'bg-rose-100' },
                      cancelled: { label: 'Cancelado', bg: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircle, iconColor: 'text-gray-500', iconBg: 'bg-gray-200' },
                    }[order.status] || { label: order.status, bg: 'bg-gray-50 text-gray-800 border-gray-200', icon: Clock, iconColor: 'text-gray-600', iconBg: 'bg-gray-100' };

                    const StatusIcon = statusConfig.icon;

                    return (
                      <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary-200 transition gap-4">
                        <div className="flex items-center space-x-3.5">
                          <div className={`${statusConfig.iconBg} p-2.5 rounded-xl shrink-0`}>
                            <StatusIcon className={`h-5 w-5 ${statusConfig.iconColor}`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              <span className="font-bold text-gray-900 text-sm sm:text-base">{order.serviceName}</span>
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusConfig.bg}`}>
                                {statusConfig.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center space-x-2 flex-wrap">
                              <span>Ref: <strong className="font-mono text-gray-700">{order.id}</strong></span>
                              <span>•</span>
                              <span className="capitalize">Via {order.paymentMethod === 'mpesa' ? 'M-Pesa' : order.paymentMethod === 'emola' ? 'eMola' : order.paymentMethod === 'card' ? 'Cartão de Crédito/Débito' : 'Transferência Bancária'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                          <div className="text-left sm:text-right">
                            <p className="font-black text-gray-900 text-base">{(order.amount || 0).toLocaleString('pt-MZ')} MT</p>
                            <p className="text-[11px] text-gray-400">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Data não disponível'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.playInvoiceDownloadSound();
                              setSelectedReceipt(order);
                            }}
                            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-emerald-200 shrink-0 shadow-2xs"
                            title="Ver e Imprimir Recibo Oficial (PDF)"
                          >
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span>Recibo (PDF)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Manual Invoices */}
            {invoices.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Faturas Manuais</h3>
                    <p className="text-xs text-gray-400">Faturas emitidas manualmente pela administração</p>
                  </div>
                  <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
                    {invoices.length} {invoices.length === 1 ? 'Fatura' : 'Faturas'}
                  </span>
                </div>

                <div className="space-y-3">
                  {invoices.map((invoice) => {
                    const statusConfig = {
                      draft: { label: 'Rascunho', bg: 'bg-gray-100 text-gray-800 border-gray-200', icon: FileText, iconColor: 'text-gray-600', iconBg: 'bg-gray-200' },
                      pending: { label: 'Pendente', bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock, iconColor: 'text-amber-600', iconBg: 'bg-amber-100' },
                      paid: { label: 'Pago', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-100' },
                      overdue: { label: 'Vencido', bg: 'bg-red-50 text-red-800 border-red-200', icon: XCircle, iconColor: 'text-red-600', iconBg: 'bg-red-100' },
                      cancelled: { label: 'Cancelado', bg: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircle, iconColor: 'text-gray-500', iconBg: 'bg-gray-200' },
                    }[invoice.status] || { label: invoice.status, bg: 'bg-gray-50 text-gray-800 border-gray-200', icon: Clock, iconColor: 'text-gray-600', iconBg: 'bg-gray-100' };

                    const StatusIcon = statusConfig.icon;

                    const handleDownloadInvoicePdf = async () => {
                      try {
                        const res = await fetch(`/api/invoices/${invoice.id}/pdf`);
                        if (res.ok) {
                          const blob = await res.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Fatura-${invoice.invoiceNumber}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          soundEffects.playSuccessSound();
                        } else {
                          setToastMsg({ type: 'error', message: 'Erro ao baixar PDF' });
                        }
                      } catch (e) {
                        console.error('Erro ao baixar PDF:', e);
                        setToastMsg({ type: 'error', message: 'Erro ao baixar PDF' });
                      }
                    };

                    return (
                      <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-amber-200 transition gap-4">
                        <div className="flex items-center space-x-3.5">
                          <div className={`${statusConfig.iconBg} p-2.5 rounded-xl shrink-0`}>
                            <StatusIcon className={`h-5 w-5 ${statusConfig.iconColor}`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              <span className="font-bold text-gray-900 text-sm sm:text-base">{invoice.invoiceNumber}</span>
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusConfig.bg}`}>
                                {statusConfig.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center space-x-2 flex-wrap">
                              <span>Emissão: <strong>{new Date(invoice.issuedAt).toLocaleDateString('pt-MZ')}</strong></span>
                              {invoice.servicePeriodStart && invoice.servicePeriodEnd && (
                                <>
                                  <span>•</span>
                                  <span>Período: {new Date(invoice.servicePeriodStart).toLocaleDateString('pt-MZ')} - {new Date(invoice.servicePeriodEnd).toLocaleDateString('pt-MZ')}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                          <div className="text-left sm:text-right">
                            <p className="font-black text-gray-900 text-base">{invoice.total.toLocaleString('pt-MZ')} {invoice.currency}</p>
                            <p className="text-[11px] text-gray-400">
                              {invoice.items.length} {invoice.items.length === 1 ? 'item' : 'itens'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleDownloadInvoicePdf}
                            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-amber-200 shrink-0 shadow-2xs"
                            title="Baixar Fatura (PDF)"
                          >
                            <Download className="h-4 w-4 text-amber-600" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upgrade Plans */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Fazer Upgrade</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {hostingPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border-2 rounded-xl p-6 flex flex-col justify-between h-full transition-all duration-200 ${
                      plan.id === user.plan
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex-1 flex flex-col">
                      {plan.id === user.plan && (
                        <span className="inline-block self-start bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                          ATUAL
                        </span>
                      )}
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">{plan.price.toLocaleString('pt-MZ')} MT</span>
                        <span className="text-gray-600">/mês</span>
                      </div>
                      <ul className="space-y-3 mb-6 flex-1">
                        <li className="flex items-center text-gray-700">
                          <Globe className="h-4 w-4 text-primary-600 mr-2 shrink-0" />
                          <span>{plan.features.sites === -1 ? 'Sites ilimitados' : `${plan.features.sites} site${plan.features.sites > 1 ? 's' : ''}`}</span>
                        </li>
                        <li className="flex items-center text-gray-700">
                          <Mail className="h-4 w-4 text-primary-600 mr-2 shrink-0" />
                          <span>{plan.features.emails === -1 ? 'Emails ilimitados' : `${plan.features.emails} email${plan.features.emails > 1 ? 's' : ''}`}</span>
                        </li>
                        <li className="flex items-center text-gray-700">
                          <Database className="h-4 w-4 text-primary-600 mr-2 shrink-0" />
                          <span>{plan.features.storage} GB Armazenamento</span>
                        </li>
                        <li className="flex items-center text-gray-700">
                          <Zap className="h-4 w-4 text-primary-600 mr-2 shrink-0" />
                          <span>Tráfego {plan.features.bandwidth}</span>
                        </li>
                        {plan.features.ssl && (
                          <li className="flex items-center text-gray-700">
                            <Shield className="h-4 w-4 text-primary-600 mr-2 shrink-0" />
                            <span>SSL Grátis</span>
                          </li>
                        )}
                        {plan.features.cdn && (
                          <li className="flex items-center text-gray-700">
                            <TrendingUp className="h-4 w-4 text-primary-600 mr-2 shrink-0" />
                            <span>CDN Grátis</span>
                          </li>
                        )}
                      </ul>
                    </div>
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      className="w-full mt-auto py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                    >
                      <span>Contratar {plan.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Métodos de Pagamento */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Métodos de Pagamento</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-3 p-3 border rounded-xl bg-gray-50">
                  <div className="bg-primary-100 p-2 rounded-lg shrink-0">
                    <CreditCard className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-gray-900">M-Pesa / e-Mola / Cartão</p>
                    <p className="text-[11px] text-gray-500">Cobrança e ativação instantânea</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-xl bg-emerald-50/60 border-emerald-200">
                  <div className="bg-emerald-100 p-2 rounded-lg shrink-0">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-emerald-950">Transferência Bancária</p>
                    <p className="text-[11px] text-emerald-700">Ativação manual por comprovativo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Banco & Envio de Comprovativo */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-gray-100">
              <div className="mb-3">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Contas para Transferência</h3>
                <p className="text-xs text-gray-400">Transfira para uma das contas e anexe o comprovativo.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3.5 text-xs">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <strong className="text-gray-900 block font-bold text-xs">Millennium BIM</strong>
                  <span className="font-mono text-[11px] text-gray-700">433372004293948</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <strong className="text-gray-900 block font-bold text-xs">BCI</strong>
                  <span className="text-gray-400 italic text-[11px]">Em breve</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <strong className="text-gray-900 block font-bold text-xs">Standard Bank</strong>
                  <span className="text-gray-400 italic text-[11px]">Em breve</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <strong className="text-gray-900 block font-bold text-xs">M-Pesa Manual</strong>
                  <a
                    href="https://wa.me/258848335618?text=Olá%2C%20quero%20confirmar%20o%20meu%20pagamento%20via%20M-Pesa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 font-bold text-[11px] transition"
                  >84 833 5618</a>
                </div>
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <strong className="text-gray-900 block font-bold text-xs">e-Mola Manual</strong>
                  <span className="text-gray-400 italic text-[11px]">Indisponível</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-primary-50/60 rounded-xl border border-primary-100">
                <div className="text-xs text-gray-600 text-center sm:text-left">
                  <span className="font-bold text-gray-900 text-xs">Anexar Comprovativo</span>
                  <span className="text-gray-400 text-[11px] block sm:inline sm:ml-2">PDF, PNG ou JPG (máx. 10MB)</span>
                </div>
                <Link
                  href="/checkout?plan=pro"
                  className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5 rotate-180" />
                  <span>Submeter Comprovativo</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Recibo Oficial PDF */}
      <ReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
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

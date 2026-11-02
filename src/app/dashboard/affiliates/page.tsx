'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Link2, DollarSign, Users, TrendingUp, Copy, CheckCircle2, 
  Download, Share2, Calendar, Filter, RefreshCw, Wallet,
  ArrowUpRight, Eye, ShoppingCart, Home, BarChart3, Gift, HelpCircle,
  Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowLeft, ArrowRight,
  UserCheck, UserPlus, Sparkles, ShieldCheck, Rocket, Percent, CreditCard, AlertTriangle
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { getUserId, getAffiliateUserInfo, isAffiliateAuthenticated } from '@/lib/affiliateAuth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import PageLoader from '@/components/PageLoader';
import { soundEffects } from '@/lib/soundEffects';
import AffiliatePushBanner from '@/components/AffiliatePushBanner';

// Extender tipos do NextAuth para incluir campos customizados
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: string;
      plan?: string;
      status?: string;
      dueDate?: number;
      createdAt?: string;
    };
  }
}

interface AffiliateData {
  _id: string;
  userId: string;
  affiliateCode: string;
  affiliateLink: string;
  status: 'pending' | 'active' | 'suspended';
  totalEarnings: number;
  availableBalance: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  payoutMethod?: string;
  payoutDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    paypalEmail?: string;
    mpesaPhone?: string;
  };
  createdAt: string;
}

interface Commission {
  _id: string;
  orderId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  referredCustomerEmail: string;
  referredCustomerName?: string;
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
}

interface ReferredUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  status: 'active' | 'pending' | 'suspended';
  plan: 'none' | 'basic' | 'pro' | 'enterprise';
  hasConverted: boolean;
}

interface MarketingMaterial {
  _id: string;
  title: string;
  description: string;
  type: string;
  content: string;
  imageUrl?: string;
  platform?: string;
  category: string;
}

interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  totalReferredUsers?: number;
  conversionRate: number;
  totalEarnings: number;
  availableBalance: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
}

export default function AffiliatesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [materials, setMaterials] = useState<MarketingMaterial[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'commissions' | 'materials' | 'performance'>('overview');
  const [payoutMethod, setPayoutMethod] = useState<'bank_transfer' | 'paypal' | 'mpesa'>('bank_transfer');
  const [payoutDetails, setPayoutDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    paypalEmail: '',
    mpesaPhone: '',
  });
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [performancePeriod, setPerformancePeriod] = useState('30');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<'auth' | 'network' | 'api' | 'unknown'>('unknown');



  const fetchAffiliateData = useCallback(async () => {
    // Aguardar o NextAuth resolver a sessão antes de qualquer verificação.
    // Enquanto status === 'loading', session.user ainda é undefined — chamar
    // agora causaria um falso "Erro de Autenticação" transitório.
    if (status === 'loading') return;

    try {
      setLoading(true);
      setErrorMessage('');
      setErrorType('unknown');
      
      // Obter userId da sessão NextAuth (prioridade para login Google)
      const userId = session?.user?.id || getUserId(session?.user?.id);
      
      // Só chegamos aqui depois de status !== 'loading':
      // se userId ainda está vazio, o utilizador realmente não está autenticado.
      if (!userId) {
        setAffiliate(null);
        setErrorMessage('Não foi possível identificar sua conta. Por favor, faça login novamente.');
        setErrorType('auth');
        setLoading(false);
        return;
      }
      
      // Fetch dashboard data
      const apiUrl = `/api/affiliates/dashboard?userId=${encodeURIComponent(userId)}`;
      const dashboardRes = await fetch(apiUrl);
      
      if (!dashboardRes.ok) {
        setAffiliate(null);
        if (dashboardRes.status === 404) {
          setErrorMessage('Afiliado não encontrado. Você pode se registrar como afiliado abaixo.');
          setErrorType('api');
        } else if (dashboardRes.status === 401) {
          setErrorMessage('Erro de autenticação. Por favor, faça login novamente.');
          setErrorType('auth');
        } else if (dashboardRes.status >= 500) {
          setErrorMessage('Erro no servidor. Tente novamente em alguns minutos.');
          setErrorType('network');
        } else {
          setErrorMessage('Erro ao carregar dados do afiliado. Tente novamente.');
          setErrorType('api');
        }
        setLoading(false);
        return;
      }
      
      const dashboardData = await dashboardRes.json();
      
      if (dashboardData.success && dashboardData.affiliate) {
        setAffiliate(dashboardData.affiliate);
        setStats(dashboardData.stats);
        setCommissions(dashboardData.commissions || []);
        setReferredUsers(dashboardData.referredUsers || []);
        setMaterials(dashboardData.materials || []);
        
        // Verificar se afiliado tem telefone configurado para pagamentos
        const affiliatePhone = dashboardData.affiliate.payoutDetails?.mpesaPhone;
        if (!affiliatePhone) {
          // Afiliado existe mas não tem telefone - precisa fazer verificação
          // Mas permite acesso se estiver em modo skipVerification
          const skipVerification = new URLSearchParams(window.location.search).get('skipVerification') === 'true';
          if (!skipVerification) {
            setAffiliate(null);
            setErrorMessage('Você já é afiliado, mas precisa verificar seu número de telefone para receber comissões. Realize a verificação de 2 MZN abaixo.');
            setErrorType('api');
          } else {
            // Modo skipVerification - permite acesso mas mantém afiliado sem telefone
            setAffiliate(dashboardData.affiliate);
            setStats(dashboardData.stats);
            setCommissions(dashboardData.commissions || []);
            setMaterials(dashboardData.materials || []);
            setErrorMessage(''); // Limpa mensagem de erro
          }
        }
      } else {
        setAffiliate(null);
        setErrorMessage('Afiliado não encontrado. Você pode se registrar como afiliado abaixo.');
        setErrorType('api');
      }
      
      // Fetch performance data
      const performanceUrl = `/api/affiliates/performance?userId=${encodeURIComponent(userId)}&period=${performancePeriod}`;
      const perfRes = await fetch(performanceUrl).catch(() => null);
      
      if (perfRes && perfRes.ok) {
        const perfData = await perfRes.json();
        if (perfData.success) {
          setPerformanceData(perfData.data);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('fetchAffiliateData error:', error);
      setAffiliate(null);
      setErrorMessage('Erro ao carregar dados do afiliado. Verifique sua conexão e tente novamente.');
      setErrorType('network');
      setLoading(false);
    }
  }, [session, performancePeriod, status]);

  useEffect(() => {
    // Não disparar enquanto a sessão ainda está a carregar — aguardar resolução.
    if (status === 'loading') return;
    fetchAffiliateData();
  }, [fetchAffiliateData, status]);

  const shareToSocialMedia = (platform: string) => {
    if (!affiliate) return;
    
    const text = 'Ganhe 30% de comissão com o programa de afiliados da WEHOSTHERE!';
    const url = affiliate.affiliateLink;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    soundEffects.playCopySound();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayout = async () => {
    try {
      const userId = session?.user?.id || getUserId(session?.user?.id);
      if (!userId) {
        soundEffects.playErrorSound();
        alert('Erro: Usuário não autenticado');
        return;
      }
      
      const response = await fetch('/api/affiliates/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          payoutMethod,
          payoutDetails,
        }),
      });

      const data = await response.json();

      if (data.success) {
        soundEffects.playSuccessSound();
        alert('Saque solicitado com sucesso!');
        setShowPayoutModal(false);
        fetchAffiliateData();
      } else {
        soundEffects.playErrorSound();
        alert('Erro ao solicitar saque: ' + data.error);
      }
    } catch (error) {
      soundEffects.playErrorSound();
      alert('Erro ao solicitar saque');
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-MZ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || status === 'loading') {
    return <PageLoader text="A carregar o Painel de Afiliados..." />;
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col justify-center items-center px-4 py-3">
        <div className="w-full max-w-sm sm:max-w-md mx-auto">
          {/* Top navigation */}
          <div className="mb-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar ao Dashboard</span>
            </Link>
          </div>

          {/* Genuine auth/network alert only */}
          {errorMessage && (errorType === 'auth' || errorType === 'network') && (
            <div className={`mb-2 p-2.5 rounded-xl border text-xs flex items-center justify-between ${
              errorType === 'auth' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <span>{errorMessage}</span>
              {errorType === 'auth' ? (
                <Link href="/login" className="underline font-semibold ml-2">Login</Link>
              ) : (
                <button onClick={() => setErrorMessage('')} className="ml-2 font-bold opacity-70 hover:opacity-100">×</button>
              )}
            </div>
          )}

          {/* Compact Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 px-4 py-3.5 text-center text-white relative">
              <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-1.5 shadow-inner">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                Programa de Afiliados
              </h2>
              <p className="text-[11px] sm:text-xs text-white/90 mt-0.5">
                Ganhe <span className="font-bold text-emerald-300">30% de comissão</span> por cada venda indicada
              </p>
            </div>

            {/* Content */}
            <div className="p-3.5 sm:p-4 space-y-2.5">
              {/* Verification Notice */}
              <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="leading-tight text-[11px]">
                  {errorMessage.includes('já é afiliado')
                    ? 'Verificação de 2 MZN para vincular seu telemóvel ao recebimento de comissões.'
                    : 'Verificação única de 2 MZN para vincular seu número aos pagamentos.'}
                </p>
              </div>

              {/* 3 Mini Benefits */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <Percent className="h-3.5 w-3.5 mx-auto text-primary-600 mb-0.5" />
                  <span className="block text-xs font-bold text-gray-900 leading-tight">30%</span>
                  <span className="block text-[10px] text-gray-500">Comissão</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <Share2 className="h-3.5 w-3.5 mx-auto text-blue-600 mb-0.5" />
                  <span className="block text-xs font-bold text-gray-900 leading-tight">Link Próprio</span>
                  <span className="block text-[10px] text-gray-500">Instantâneo</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <Wallet className="h-3.5 w-3.5 mx-auto text-emerald-600 mb-0.5" />
                  <span className="block text-xs font-bold text-gray-900 leading-tight">1.000 MT</span>
                  <span className="block text-[10px] text-gray-500">Saque M-Pesa</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-1 text-center space-y-1.5">
                <Link
                  href={`/checkout?service=affiliate_verification&amount=2&duration=1&domain=affiliate&userId=${encodeURIComponent(session?.user?.id || '')}`}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 hover:from-primary-700 hover:via-primary-800 hover:to-indigo-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
                >
                  <Users className="h-4 w-4" />
                  <span>{errorMessage.includes('já é afiliado') ? 'Verificar Telefone — 2 MZN' : 'Tornar-se Afiliado — 2 MZN'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <div>
                  <button
                    onClick={() => router.push('/dashboard/affiliates?skipVerification=true')}
                    className="text-[11px] text-gray-400 hover:text-gray-600 transition underline"
                  >
                    Pagar depois
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition font-medium">
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Programa de Afiliados</h1>
                  <p className="text-gray-600">
                    Status: <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(affiliate.status)}`}>
                      {affiliate.status === 'active' ? 'Ativo' : affiliate.status}
                    </span>
                    {affiliate.payoutDetails?.mpesaPhone ? (
                      <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        ✓ Telefone Verificado
                      </span>
                    ) : (
                      <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        ⚠ Telefone não verificado
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={fetchAffiliateData}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Push Notification Banner */}
        <AffiliatePushBanner />

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-2 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col items-center justify-center space-y-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition font-medium cursor-pointer ${
                activeTab === 'overview' 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Visão Geral</span>
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`flex flex-col items-center justify-center space-y-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition font-medium cursor-pointer relative ${
                activeTab === 'leads' 
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm flex items-center space-x-1">
                <span>Contas Criadas</span>
                {referredUsers.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'leads' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                    {referredUsers.length}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`flex flex-col items-center justify-center space-y-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition font-medium cursor-pointer ${
                activeTab === 'commissions' 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Comissões</span>
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex flex-col items-center justify-center space-y-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition font-medium cursor-pointer ${
                activeTab === 'performance' 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Performance</span>
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex flex-col items-center justify-center space-y-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition font-medium cursor-pointer ${
                activeTab === 'materials' 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Materiais</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs font-medium mb-1">Saldo Disponível</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {stats?.availableBalance.toLocaleString('pt-MZ')} MZN
                </p>
              </div>
              <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-200 shrink-0" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-xs font-medium mb-1">Ganhos Totais</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {stats?.totalEarnings.toLocaleString('pt-MZ')} MZN
                </p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary-200 shrink-0" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium mb-1">Total Cliques</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {stats?.totalClicks || 0}
                </p>
              </div>
              <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200 shrink-0" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-xs font-medium mb-1">Contas Criadas</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {stats?.totalReferredUsers || referredUsers.length}
                </p>
              </div>
              <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-200 shrink-0" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-4 text-white col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium mb-1">Vendas / Conversões</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {stats?.totalConversions || 0}
                </p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-200 shrink-0" />
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Affiliate Link */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Seu Link de Nhonga</h3>
              </div>
              
              {/* Informação sobre recebimento de comissões */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-blue-600" />
                      Recebimento de Comissões
                    </h4>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Você receberá suas comissões através do número configurado abaixo.
                      Quando atingir <strong>1.000 MZN</strong> em saldo disponível, poderá solicitar o saque.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Número de telefone configurado para comissões */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">Número para Comissões</h4>
                      <p className="text-xs text-emerald-700">Número M-Pesa configurado para receber pagamentos</p>
                    </div>
                  </div>
                  {affiliate.payoutDetails?.mpesaPhone ? (
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-900 font-mono">
                        {affiliate.payoutDetails.mpesaPhone}
                      </div>
                      <span className="text-xs text-emerald-600">✓ Verificado</span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-sm font-medium text-amber-700">
                        Não configurado
                      </div>
                      <span className="text-xs text-amber-600">⚠ Pendente</span>
                    </div>
                  )}
                </div>
                
                {affiliate.payoutDetails?.mpesaPhone && (
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <p className="text-xs text-emerald-700">
                      <strong>⚠️ Nota:</strong> Se quiser mudar este número no futuro, precisará pagar uma taxa de <strong>2 MZN</strong> para o novo número ser verificado (teste de segurança).
                    </p>
                  </div>
                )}
              </div>
              
              {/* Mostrar link apenas se telefone estiver verificado */}
              {affiliate.payoutDetails?.mpesaPhone ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3 mb-4">
                    <input
                      type="text"
                      value={affiliate.affiliateLink}
                      readOnly
                      className="flex-1 px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl text-gray-700 font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(affiliate.affiliateLink)}
                      className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition font-semibold shadow-lg"
                    >
                      {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  
                  {/* Social Media Share Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-600 w-full md:w-auto">Compartilhar:</span>
                    <button
                      onClick={() => shareToSocialMedia('facebook')}
                      className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      title="Compartilhar no Facebook"
                    >
                      <Facebook className="h-4 w-4" />
                      <span className="text-sm">Facebook</span>
                    </button>
                    <button
                      onClick={() => shareToSocialMedia('twitter')}
                      className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
                      title="Compartilhar no Twitter"
                    >
                      <Twitter className="h-4 w-4" />
                      <span className="text-sm">Twitter</span>
                    </button>
                    <button
                      onClick={() => shareToSocialMedia('linkedin')}
                      className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition"
                      title="Compartilhar no LinkedIn"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span className="text-sm">LinkedIn</span>
                    </button>
                    <button
                      onClick={() => shareToSocialMedia('whatsapp')}
                      className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                      title="Compartilhar no WhatsApp"
                    >
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">WhatsApp</span>
                    </button>
                  </div>
                  <p className="text-gray-600 mt-4 flex items-center space-x-2">
                    <Share2 className="h-4 w-4 text-primary-600" />
                    <span>Compartilhe este link para ganhar 30% de comissão em cada venda!</span>
                  </p>
                </>
              ) : (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
                  <svg className="w-12 h-12 text-amber-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h4 className="text-lg font-bold text-amber-800 mb-2">Link de Afiliado Indisponível</h4>
                  <p className="text-sm text-amber-700 mb-4">
                    Seu link de afiliado só aparecerá após verificar seu número de telefone com pagamento de 2 MZN.
                  </p>
                  
                  {/* Informação sobre recebimento de comissões */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-left">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-1.5">
                          <Wallet className="h-4 w-4 text-blue-600" />
                          Recebimento de Comissões
                        </h4>
                        <p className="text-xs text-blue-800 leading-relaxed">
                          Após verificar seu telefone, você receberá suas comissões através desse número quando atingir <strong>1.000 MZN</strong> em saldo disponível.
                        </p>
                        <p className="text-xs text-blue-700 mt-2 border-t border-blue-200 pt-2 flex items-center gap-1">
                          <strong className="inline-flex items-center gap-1 text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            Importante:
                          </strong> Se quiser mudar este número no futuro, precisará pagar uma taxa de <strong>2 MZN</strong> para o novo número ser verificado (teste de segurança).
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href={`/checkout?service=affiliate_verification&amount=2&duration=1&domain=affiliate&userId=${encodeURIComponent(session?.user?.id || '')}`}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition font-semibold"
                  >
                    <Users className="h-4 w-4" />
                    <span>Verificar Telefone — 2 MZN</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Payout Button */}
            {stats && stats.availableBalance >= 1000 && (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">🎉 Você tem saldo disponível para saque!</h3>
                    <p className="text-emerald-100">
                      Saldo: {stats.availableBalance.toLocaleString('pt-MZ')} MZN
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPayoutModal(true)}
                    className="flex items-center space-x-2 bg-white text-emerald-600 px-8 py-4 rounded-xl hover:bg-emerald-50 transition font-semibold shadow-lg"
                  >
                    <Wallet className="h-5 w-5" />
                    <span>Solicitar Saque</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Leads / Contas Criadas */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Contas Criadas (Leads Indicados)</h3>
                  <p className="text-xs text-gray-500">Utilizadores que criaram conta na plataforma através do seu link</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                  {referredUsers.length} {referredUsers.length === 1 ? 'conta vinculada' : 'contas vinculadas'}
                </span>
              </div>
            </div>

            {/* Explanatory Banner */}
            <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 leading-relaxed">
                  <strong>Como funciona:</strong> Todas as contas criadas pelo seu link ficam vinculadas a si por <strong>30 dias</strong>. Assim que qualquer um destes clientes contratar um plano de hospedagem, domínio, sistema ou site, receberá automaticamente <strong>30% de comissão</strong>!
                </div>
              </div>
            </div>

            {referredUsers.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl p-6">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-8 w-8" />
                </div>
                <h4 className="text-base font-bold text-gray-900 mb-1">Nenhuma conta criada ainda</h4>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
                  Partilhe o seu link de afiliado no WhatsApp e redes sociais para atrair os seus primeiros utilizadores.
                </p>
                {affiliate?.affiliateLink && (
                  <button
                    onClick={() => copyToClipboard(affiliate.affiliateLink)}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-md cursor-pointer"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? 'Link Copiado!' : 'Copiar Link de Divulgação'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="w-full min-w-[650px]">
                  <thead>
                    <tr className="border-b-2 border-gray-100 text-left">
                      <th className="py-3 px-4 text-xs font-bold text-gray-700">Utilizador</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-700">Email</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-700">Data de Registo</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-700">Plano Atual</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-700">Status de Compra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {referredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-primary-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                          {user.email}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('pt-MZ', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 capitalize">
                            {user.plan === 'none' ? 'Sem Plano' : user.plan}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {user.hasConverted ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>🎉 Compra Realizada</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>Aguardando 1ª Compra</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Materiais de Marketing</h3>
              </div>
              <span className="text-xs md:text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Use [AFFILIATE_LINK] nos materiais</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {materials.map((material) => (
                <div key={material._id} className="border-2 border-gray-200 rounded-2xl p-4 md:p-5 hover:shadow-xl transition group">
                  {material.imageUrl && (
                    <img
                      src={material.imageUrl}
                      alt={material.title}
                      className="w-full h-32 md:h-40 object-cover rounded-xl mb-4 group-hover:scale-105 transition"
                    />
                  )}
                  <h4 className="font-bold text-gray-900 mb-2 text-sm md:text-base">{material.title}</h4>
                  <p className="text-xs md:text-sm text-gray-600 mb-3">{material.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-4">
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-full font-medium">{material.type}</span>
                    {material.platform && (
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full font-medium">{material.platform}</span>
                    )}
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 text-xs text-gray-600 max-h-24 overflow-y-auto mb-4">
                    {material.content.substring(0, 150)}...
                  </div>
                  <button
                    onClick={() => copyToClipboard(material.content)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition font-semibold shadow-md"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copiar Código</span>
                  </button>
                </div>
              ))}
            </div>
            {materials.length === 0 && (
              <div className="text-center py-12">
                <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum material disponível ainda</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'commissions' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 md:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Histórico de Comissões</h3>
            </div>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 md:py-4 px-4 text-xs md:text-sm font-bold text-gray-700">Pedido</th>
                    <th className="text-left py-3 md:py-4 px-4 text-xs md:text-sm font-bold text-gray-700">Cliente</th>
                    <th className="text-left py-3 md:py-4 px-4 text-xs md:text-sm font-bold text-gray-700">Valor</th>
                    <th className="text-left py-3 md:py-4 px-4 text-xs md:text-sm font-bold text-gray-700">Comissão</th>
                    <th className="text-left py-3 md:py-4 px-4 text-xs md:text-sm font-bold text-gray-700">Status</th>
                    <th className="text-left py-3 md:py-4 px-4 text-xs md:text-sm font-bold text-gray-700">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission._id} className="border-b border-gray-100 hover:bg-gradient-to-r from-gray-50 to-white transition">
                      <td className="py-3 md:py-4 px-4 text-sm text-gray-900">#{commission.orderId}</td>
                      <td className="py-3 md:py-4 px-4 text-sm text-gray-600">
                        {commission.referredCustomerName || commission.referredCustomerEmail}
                      </td>
                      <td className="py-3 md:py-4 px-4 text-sm text-gray-900">
                        {commission.orderAmount.toLocaleString('pt-MZ')} MZN
                      </td>
                      <td className="py-3 md:py-4 px-4 text-sm font-semibold text-emerald-600">
                        {commission.commissionAmount.toLocaleString('pt-MZ')} MZN
                      </td>
                      <td className="py-3 md:py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          commission.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          commission.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          commission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {commission.status}
                        </span>
                      </td>
                      <td className="py-3 md:py-4 px-4 text-sm text-gray-600">
                        {new Date(commission.createdAt).toLocaleDateString('pt-MZ')}
                      </td>
                    </tr>
                  ))}
                  {commissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p>Nenhuma comissão ainda</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Performance</h3>
              </div>
              <select
                value={performancePeriod}
                onChange={(e) => {
                  setPerformancePeriod(e.target.value);
                  fetchAffiliateData();
                }}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
            </div>

            {performanceData ? (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 md:p-6 border border-blue-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <span className="text-xs md:text-sm font-medium text-blue-800">Total de Cliques</span>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-blue-900">{performanceData.totalClicks}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 md:p-6 border border-emerald-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <ShoppingCart className="h-5 w-5 text-emerald-600" />
                      <span className="text-xs md:text-sm font-medium text-emerald-800">Conversões</span>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-emerald-900">{performanceData.totalConversions}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 md:p-6 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="text-xs md:text-sm font-medium text-purple-800">Taxa de Conversão</span>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-purple-900">{performanceData.conversionRate.toFixed(2)}%</p>
                  </div>
                </div>

                {/* Clicks Chart */}
                <div>
                  <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Cliques por Dia</h4>
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={Object.entries(performanceData.clicksByDay).map(([date, clicks]) => ({ date, clicks }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Commissions Chart */}
                <div>
                  <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Comissões por Mês (MZN)</h4>
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(performanceData.commissionsByMonth).map(([month, amount]) => ({ month, amount }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="amount" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Carregando dados de performance...</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-primary-600" />
                <span className="text-sm md:text-base">Programa de Afiliados</span>
              </h4>
              <p className="text-gray-600 text-xs md:text-sm">
                Ganhe 30% de comissão em cada venda que você gerar através do seu link de afiliado.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="hover:text-primary-600 cursor-pointer">Termos e Condições</li>
                <li className="hover:text-primary-600 cursor-pointer">Política de Privacidade</li>
                <li className="hover:text-primary-600 cursor-pointer">FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>info@wehosthere.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+258 84 833 5618</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Moçambique</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Redes Sociais</h4>
              <div className="flex space-x-3">
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-500">
            <p>© 2024 WEHOSTHERE. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Wallet className="h-6 w-6 text-primary-600" />
                <span>Solicitar Saque</span>
              </h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="bank_transfer">Transferência Bancária</option>
                  <option value="paypal">PayPal</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
              </div>

              {payoutMethod === 'bank_transfer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Banco</label>
                    <input
                      type="text"
                      value={payoutDetails.bankName}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número da Conta</label>
                    <input
                      type="text"
                      value={payoutDetails.accountNumber}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titular da Conta</label>
                    <input
                      type="text"
                      value={payoutDetails.accountHolder}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, accountHolder: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {payoutMethod === 'paypal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email PayPal</label>
                  <input
                    type="email"
                    value={payoutDetails.paypalEmail}
                    onChange={(e) => setPayoutDetails({ ...payoutDetails, paypalEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              {payoutMethod === 'mpesa' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone M-Pesa</label>
                  <input
                    type="tel"
                    value={payoutDetails.mpesaPhone}
                    onChange={(e) => setPayoutDetails({ ...payoutDetails, mpesaPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+258 84 123 4567"
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePayout}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Solicitar Saque
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

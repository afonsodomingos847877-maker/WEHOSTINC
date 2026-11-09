/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { 
  Users, Server, Mail, Database, TrendingUp, DollarSign,
  LogOut, Settings, Home, CheckCircle, Clock, XCircle, Search,
  ShoppingBag, MessageSquare, ExternalLink, Trash2, LifeBuoy, Send, ShieldCheck, CheckCircle2, AlertCircle,
  Paperclip, FileText, Image as ImageIcon, Download, File, X, Loader2, Tag, Shield, AlertTriangle,
  Activity, Eye, EyeOff, Globe, Wifi, WifiOff, BarChart2, RefreshCw, UserPlus, Star, Plus, Edit, BookOpen, Bell, CreditCard, GraduationCap,
  Handshake, MessageSquareHeart, Key, Wallet
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, ServiceOrder, SupportTicket, TicketMessage, TicketAttachment, SecurityLog, SystemForRent, RentalRequest, SystemAccess, SocialProof } from '@/lib/data';
import BrandLogo from '@/components/BrandLogo';
import LanguageSelector from '@/components/LanguageSelector';
import PageLoader from '@/components/PageLoader';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { API_URL, apiEndpoint } from '@/lib/siteConfig';
import AdminNotificationCenter from '@/components/AdminNotificationCenter';
import AdminPushBanner from '@/components/AdminPushBanner';
import { dispatchMessage, addAdminNotification } from '@/lib/notifications';
import { soundEffects } from '@/lib/soundEffects';
import AdminAiTopBar from '@/components/AdminAiTopBar';
import AdminSidebar from '@/components/AdminSidebar';

const ADMIN_CANNED_RESPONSES = [
  {
    label: '✅ DNS Propagado',
    text: 'Olá! Confirmamos que o seu domínio já se encontra devidamente apontado e propagado para os nossos NameServers oficiais (ns1.wehosthere.com e ns2.wehosthere.com). O seu serviço está 100% ativo.',
    suggestedStatus: 'answered' as const
  },
  {
    label: '💳 Pagamento Confirmado',
    text: 'Olá! Confirmamos a recepção do pagamento. A sua fatura foi marcada como liquidada no nosso sistema e o seu plano/serviço foi totalmente ativado com sucesso.',
    suggestedStatus: 'answered' as const
  },
  {
    label: '📧 Acesso Webmail & SSL',
    text: 'Para aceder ao seu e-mail corporativo via navegador, utilize o endereço webmail.seudominio.co.mz (Porta 2096 com SSL). Para configurar no Outlook ou telemóvel, utilize servidor IMAP porta 993 e SMTP porta 465.',
    suggestedStatus: 'answered' as const
  },
  {
    label: '⚙️ VPS Provisionada',
    text: 'A sua máquina VPS foi provisionada com sucesso no painel. O IP dedicado atribuído e os acessos do utilizador root já se encontram ativos na secção de servidores.',
    suggestedStatus: 'answered' as const
  },
  {
    label: '🔒 SSL Re-emitido',
    text: 'O certificado SSL gratuito Let\'s Encrypt foi re-emitido e instalado com sucesso para o seu domínio e subdomínios. O tráfego HTTPS agora está seguro.',
    suggestedStatus: 'answered' as const
  },
  {
    label: '⚙️ Em Análise Técnica',
    text: 'Olá! A nossa equipa de engenharia de sistemas recebeu o seu chamado e já está a analisar a questão técnica. Voltaremos a contactar com novidades em breve.',
    suggestedStatus: 'in_progress' as const
  }
];

function getCountryFlag(countryName: string): string {
  const countryFlags: Record<string, string> = {
    'Mozambique': '🇲🇿',
    'Portugal': '🇵🇹',
    'Brazil': '🇧🇷',
    'Angola': '🇦🇴',
    'South Africa': '🇿🇦',
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹',
    'China': '🇨🇳',
    'Russia': '🇷🇺',
    'India': '🇮🇳',
    'Japan': '🇯🇵',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Nigeria': '🇳🇬',
    'Kenya': '🇰🇪',
    'Egypt': '🇪🇬',
    'Morocco': '🇲🇦',
    'Algeria': '🇩🇿',
    'Tunisia': '🇹🇳',
    'Ghana': '🇬🇭',
    'Ethiopia': '🇪🇹',
    'Tanzania': '🇹🇿',
    'Uganda': '🇺🇬',
    'Zambia': '🇿🇲',
    'Zimbabwe': '🇿🇼',
    'Botswana': '🇧🇼',
    'Namibia': '🇳🇦',
    'Malawi': '🇲🇼',
    'Madagascar': '🇲🇬',
    'Mauritius': '🇲🇺',
    'Seychelles': '🇸🇨',
    'Cape Verde': '🇨🇻',
    'Guinea-Bissau': '🇬🇼',
    'Equatorial Guinea': '🇬🇶',
    'Sao Tome and Principe': '🇸🇹',
    'Democratic Republic of the Congo': '🇨🇩',
    'Republic of the Congo': '🇨🇬',
    'Cameroon': '🇨🇲',
    'Gabon': '🇬🇦',
    'Ivory Coast': '🇨🇮',
    'Senegal': '🇸🇳',
    'Mali': '🇲🇱',
    'Burkina Faso': '🇧🇫',
    'Niger': '🇳🇪',
    'Chad': '🇹🇩',
    'Central African Republic': '🇨🇫',
    'Sudan': '🇸🇩',
    'South Sudan': '🇸🇸',
    'Eritrea': '🇪🇷',
    'Djibouti': '🇩🇯',
    'Somalia': '🇸🇴',
    'Liberia': '🇱🇷',
    'Sierra Leone': '🇸🇱',
    'Guinea': '🇬🇳',
    'Benin': '🇧🇯',
    'Togo': '🇹🇬',
    'Rwanda': '🇷🇼',
    'Burundi': '🇧🇮',
    'Lesotho': '🇱🇸',
    'Eswatini': '🇸🇿',
    'North Macedonia': '🇲🇰',
    'Albania': '🇦🇱',
    'Bosnia': '🇧🇦',
    'Serbia': '🇷🇸',
    'Montenegro': '🇲🇪',
    'Kosovo': '🇽🇰',
    'Croatia': '🇭🇷',
    'Slovenia': '🇸🇮',
    'Slovakia': '🇸🇰',
    'Czech Republic': '🇨🇿',
    'Poland': '🇵🇱',
    'Hungary': '🇭🇺',
    'Romania': '🇷🇴',
    'Bulgaria': '🇧🇬',
    'Greece': '🇬🇷',
    'Turkey': '🇹🇷',
    'Cyprus': '🇨🇾',
    'Malta': '🇲🇹',
    'Iceland': '🇮🇸',
    'Norway': '🇳🇴',
    'Sweden': '🇸🇪',
    'Finland': '🇫🇮',
    'Denmark': '🇩🇰',
    'Netherlands': '🇳🇱',
    'Belgium': '🇧🇪',
    'Luxembourg': '🇱🇺',
    'Switzerland': '🇨🇭',
    'Austria': '🇦🇹',
    'Liechtenstein': '🇱🇮',
    'Monaco': '🇲🇨',
    'Andorra': '🇦🇩',
    'San Marino': '🇸🇲',
    'Vatican': '🇻🇦',
    'United Arab Emirates': '🇦🇪',
    'Saudi Arabia': '🇸🇦',
    'Qatar': '🇶🇦',
    'Kuwait': '🇰🇼',
    'Bahrain': '🇧🇭',
    'Oman': '🇴🇲',
    'Yemen': '🇾🇪',
    'Iraq': '🇮🇶',
    'Iran': '🇮🇷',
    'Syria': '🇸🇾',
    'Lebanon': '🇱🇧',
    'Jordan': '🇯🇴',
    'Israel': '🇮🇱',
    'Palestine': '🇵🇸',
    'Pakistan': '🇵🇰',
    'Afghanistan': '🇦🇫',
    'Bangladesh': '🇧🇩',
    'Sri Lanka': '🇱🇰',
    'Nepal': '🇳🇵',
    'Bhutan': '🇧🇹',
    'Maldives': '🇲🇻',
    'Myanmar': '🇲🇲',
    'Thailand': '🇹🇭',
    'Laos': '🇱🇦',
    'Cambodia': '🇰🇭',
    'Vietnam': '🇻🇳',
    'Malaysia': '🇲🇾',
    'Singapore': '🇸🇬',
    'Indonesia': '🇮🇩',
    'Brunei': '🇧🇳',
    'Philippines': '🇵🇭',
    'East Timor': '🇹🇱',
    'New Zealand': '🇳🇿',
    'Fiji': '🇫🇯',
    'Papua New Guinea': '🇵🇬',
    'Solomon Islands': '🇸🇧',
    'Vanuatu': '🇻🇺',
    'New Caledonia': '🇳🇨',
    'French Polynesia': '🇵🇫',
    'Mexico': '🇲🇽',
    'Guatemala': '🇬🇹',
    'Belize': '🇧🇿',
    'Honduras': '🇭🇳',
    'El Salvador': '🇸🇻',
    'Nicaragua': '🇳🇮',
    'Costa Rica': '🇨🇷',
    'Panama': '🇵🇦',
    'Colombia': '🇨🇴',
    'Venezuela': '🇻🇪',
    'Guyana': '🇬🇾',
    'Suriname': '🇸🇷',
    'Ecuador': '🇪🇨',
    'Peru': '🇵🇪',
    'Bolivia': '🇧🇴',
    'Paraguay': '🇵🇾',
    'Chile': '🇨🇱',
    'Argentina': '🇦🇷',
    'Uruguay': '🇺🇾',
    'Cuba': '🇨🇺',
    'Haiti': '🇭🇹',
    'Dominican Republic': '🇩🇴',
    'Jamaica': '🇯🇲',
    'Trinidad and Tobago': '🇹🇹',
    'Barbados': '🇧🇧',
    'Bahamas': '🇧🇸',
    'Grenada': '🇬🇩',
    'Saint Kitts and Nevis': '🇰🇳',
    'Saint Lucia': '🇱🇨',
    'Saint Vincent and the Grenadines': '🇻🇨',
    'Antigua and Barbuda': '🇦🇬',
    'Dominica': '🇩🇲',
    'Puerto Rico': '🇵🇷',
    'Cayman Islands': '🇰🇾',
    'British Virgin Islands': '🇻🇬',
    'US Virgin Islands': '🇻🇮',
    'Aruba': '🇦🇼',
    'Curacao': '🇨🇼',
    'Saint Martin': '🇸🇽',
    'Greenland': '🇬🇱',
  };
  
  return countryFlags[countryName] || '🌍';
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<any[]>([]);
  const [b2cPayouts, setB2cPayouts] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncingData, setIsSyncingData] = useState(true);

  // Current admin user and permissions
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [perms, setPerms] = useState(auth.getAdminPermissions(null));

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');

  // Modal Novo Cliente State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Modal Definir Senha de Utilizador
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('@Admin123@');
  const [newPlan, setNewPlan] = useState<'basic' | 'pro' | 'enterprise'>('pro');
  const [newDueDate, setNewDueDate] = useState<number>(29);
  const [newStatus, setNewStatus] = useState<'active' | 'pending' | 'suspended'>('active');
  const [createError, setCreateError] = useState('');

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Academy Admin State
  const [academyCertificates, setAcademyCertificates] = useState<any[]>([]);
  const [academyEnrollments, setAcademyEnrollments] = useState<any[]>([]);
  const [academyCourseOrders, setAcademyCourseOrders] = useState<any[]>([]);
  const [academyLoading, setAcademyLoading] = useState(false);
  const [academyTab, setAcademyTab] = useState<'orders' | 'enrollments' | 'certificates'>('orders');

  // Analytics State
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userEmail: string; userName: string; userAvatar?: string; role?: string; lastSeen: string; currentPage: string; isOnline: boolean; isGuest?: boolean }>>([]);
  const [recentPresence, setRecentPresence] = useState<Array<{ userEmail: string; userName: string; userAvatar?: string; role?: string; lastSeen: string; currentPage: string; isOnline?: boolean; isGuest?: boolean }>>([]);
  const [visitStats, setVisitStats] = useState<{ total: number; uniqueVisitors: number; topPages: Array<{ page: string; count: number }>; milestones?: any }>({ total: 0, uniqueVisitors: 0, topPages: [] });
  const [visitStatsPeriod, setVisitStatsPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await auth.logout();
    try {
      await nextAuthSignOut({ redirect: false });
    } catch (_) {}
    setTimeout(() => {
      window.location.href = '/?logged_out=1';
    }, 300);
  };

  // Função para criar payout B2C
  const handleB2CPayout = async () => {
    setPayoutLoading(true);
    setPayoutError('');
    setPayoutSuccess('');

    try {
      const response = await fetch('/api/payments/b2c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: payoutPhone,
          amount: parseFloat(payoutAmount),
          reference: payoutReference || `PAYOUT-${Date.now().toString().slice(-6)}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setPayoutError(data.error || 'Erro ao processar payout');
        return;
      }

      setPayoutSuccess('Payout enviado com sucesso!');
      
      // Adicionar ao histórico
      const newPayout = {
        id: data.id,
        phone: payoutPhone,
        amount: parseFloat(payoutAmount),
        currency: 'MZN',
        reference: payoutReference || `PAYOUT-${Date.now().toString().slice(-6)}`,
        status: 'processing',
        createdAt: new Date().toISOString()
      };
      setB2cPayouts([newPayout, ...b2cPayouts]);

      // Limpar formulário
      setPayoutPhone('');
      setPayoutAmount('');
      setPayoutReference('');
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : 'Erro ao processar payout');
    } finally {
      setPayoutLoading(false);
    }
  };

  // Função para criar assinatura
  const handleCreateSubscription = async () => {
    setSubLoading(true);
    setSubError('');
    setSubSuccess('');

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: subCustomerName,
            email: subCustomerEmail,
            phone: subCustomerPhone
          },
          amount: parseFloat(subAmount),
          interval: subInterval,
          reference: subReference || `SUB-${Date.now().toString().slice(-6)}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setSubError(data.error || 'Erro ao criar assinatura');
        return;
      }

      setSubSuccess('Assinatura criada com sucesso!');
      
      // Adicionar ao histórico
      const newSubscription = {
        id: data.id,
        customer: data.customer,
        amount: parseFloat(subAmount),
        currency: 'MZN',
        interval: subInterval,
        reference: subReference || `SUB-${Date.now().toString().slice(-6)}`,
        status: 'active',
        nextBillingDate: data.nextBillingDate,
        createdAt: new Date().toISOString()
      };
      setSubscriptions([newSubscription, ...subscriptions]);

      // Limpar formulário
      setSubCustomerName('');
      setSubCustomerEmail('');
      setSubCustomerPhone('');
      setSubAmount('');
      setSubReference('');
    } catch (err) {
      setSubError(err instanceof Error ? err.message : 'Erro ao criar assinatura');
    } finally {
      setSubLoading(false);
    }
  };

  // Função para cancelar assinatura
  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta assinatura?')) {
      return;
    }

    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        alert('Erro ao cancelar assinatura');
        return;
      }

      // Atualizar status localmente
      setSubscriptions(subscriptions.map(sub => 
        sub.id === subscriptionId ? { ...sub, status: 'cancelled' } : sub
      ));
      
      alert('Assinatura cancelada com sucesso');
    } catch (err) {
      alert('Erro ao cancelar assinatura');
    }
  };

  // Função para exportar payouts para CSV
  const handleExportPayoutsCSV = () => {
    if (b2cPayouts.length === 0) {
      alert('Nenhum payout para exportar');
      return;
    }

    const headers = ['ID', 'Telefone', 'Valor', 'Moeda', 'Referência', 'Status', 'Data'];
    const rows = b2cPayouts.map(p => [
      p.id,
      p.phone,
      p.amount,
      p.currency,
      p.reference,
      p.status,
      new Date(p.createdAt).toLocaleString('pt-MZ')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `payouts_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // Planos pendentes de guardar (chave: userId, valor: novo plano)
  const [pendingPlanChanges, setPendingPlanChanges] = useState<Record<string, 'basic' | 'pro' | 'enterprise'>>({});

  // Tickets de Suporte State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminReplyMessage, setAdminReplyMessage] = useState('');
  const [ticketSearchTerm, setTicketSearchTerm] = useState('');
  const [ticketFilterStatus, setTicketFilterStatus] = useState<'all' | 'open' | 'answered' | 'closed'>('all');

  // B2C Payout State
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutReference, setPayoutReference] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState('');

  // Subscription State
  const [subCustomerName, setSubCustomerName] = useState('');
  const [subCustomerEmail, setSubCustomerEmail] = useState('');
  const [subCustomerPhone, setSubCustomerPhone] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subInterval, setSubInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [subReference, setSubReference] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState('');
  const [subSuccess, setSubSuccess] = useState('');
  
  // Sistemas de Aluguer State
  const [systems, setSystems] = useState<SystemForRent[]>([]);
  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([]);
  const [systemAccesses, setSystemAccesses] = useState<SystemAccess[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'users' | 'sites' | 'emails' | 'orders' | 'tickets' | 'security' | 'systems' | 'newsletter'>('overview');
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [editingSystem, setEditingSystem] = useState<SystemForRent | null>(null);

  // Provas Sociais State
  const [socialProofs, setSocialProofs] = useState<SocialProof[]>([]);
  const [newProofName, setNewProofName] = useState('');
  const [newProofLocation, setNewProofLocation] = useState('Maputo');
  const [newProofAction, setNewProofAction] = useState('contratou o plano Profissional SSD');
  const [newProofTime, setNewProofTime] = useState('há 5 min');

  // User Feedbacks State
  const [userFeedbacks, setUserFeedbacks] = useState<any[]>([]);

  // Monthly Payments State
  const [monthlyPayments, setMonthlyPayments] = useState<any[]>([]);
  
  // Newsletter State
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<any[]>([]);
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterContent, setNewsletterContent] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterSearchTerm, setNewsletterSearchTerm] = useState('');
  const [newsletterFilterStatus, setNewsletterFilterStatus] = useState<'all' | 'active' | 'unsubscribed' | 'bounced'>('all');
  
  // Anexos Admin
  const [adminReplyAttachments, setAdminReplyAttachments] = useState<TicketAttachment[]>([]);
  const [adminUploading, setAdminUploading] = useState(false);

  // States para Alertas e Modais de Confirmação Customizados
  const [toastMsg, setToastMsg] = useState<{ title?: string; message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  } | null>(null);
  const [hideSensitiveValues, setHideSensitiveValues] = useState(false);

  const formatSensitiveValue = (value: number | string, isSensitive: boolean = true) => {
    if (hideSensitiveValues && isSensitive) {
      return '***';
    }
    return typeof value === 'number' ? value.toLocaleString('pt-MZ') : value;
  };

  const handleAdminFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setAdminUploading(true);
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(apiEndpoint('/api/upload'), {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          const newAtt: TicketAttachment = {
            url: data.url,
            name: data.name || file.name,
            type: data.type || (file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'file'),
            bytes: data.bytes || file.size
          };
          setAdminReplyAttachments(prev => [...prev, newAtt]);
        }
      }
    } catch (err) {
      console.error('Erro no upload de anexo do admin:', err);
    } finally {
      setAdminUploading(false);
      e.target.value = '';
    }
  };

  const fetchAnalytics = useCallback(async (period: 'today' | 'week' | 'month' | 'all' = visitStatsPeriod) => {
    try {
      const [presenceRes, visitsRes] = await Promise.all([
        fetch(apiEndpoint('/api/analytics/presence')),
        fetch(apiEndpoint(`/api/analytics/visits?period=${period}`)),
      ]);
      if (presenceRes.ok) {
        const data = await presenceRes.json();
        setOnlineUsers(data.online || []);
        setRecentPresence(data.recent || []);
      }
      if (visitsRes.ok) {
        const data = await visitsRes.json();
        setVisitStats({ total: data.total || 0, uniqueVisitors: data.uniqueVisitors || 0, topPages: data.topPages || [], milestones: data.milestones });
      }
    } catch (e) {}
  }, [visitStatsPeriod]);

  const [isRefreshingAdmin, setIsRefreshingAdmin] = useState(false);

  const handleRefreshAdminData = async () => {
    setIsRefreshingAdmin(true);
    setIsSyncingData(true);
    try {
      const [u, o, s, e, t, sec] = await Promise.all([
        auth.fetchUsersAsync(),
        dataManager.fetchOrdersAsync(),
        dataManager.fetchSitesAsync(),
        dataManager.fetchEmailsAsync(),
        dataManager.fetchTicketsAsync(),
        dataManager.fetchSecurityLogsAsync(),
        new Promise(resolve => setTimeout(resolve, 600))
      ]);
      if (u) setUsers(u);
      if (o) setOrders(o);
      if (s) setSites(s);
      if (e) setEmails(e);
      if (t) setTickets(t);
      if (sec) setSecurityLogs(sec);
      await fetchAnalytics();
      setToastMsg({ title: 'Dados Atualizados', message: 'Os dados do servidor MongoDB foram sincronizados com sucesso.', type: 'success' });
    } catch (err) {
      setToastMsg({ title: 'Erro de Sincronização', message: 'Não foi possível atualizar os dados do servidor.', type: 'error' });
    } finally {
      setIsRefreshingAdmin(false);
      setIsSyncingData(false);
    }
  };

  // Newsletter functions
  const fetchNewsletterSubscribers = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/send');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNewsletterSubscribers(data.subscribers || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar subscritores:', error);
    }
  };

  const handleSendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterSubject.trim() || !newsletterContent.trim()) {
      setNewsletterMessage('Por favor, preencha o assunto e conteúdo.');
      return;
    }

    setSendingNewsletter(true);
    setNewsletterMessage('');

    try {
      const response = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newsletterSubject,
          content: newsletterContent
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setNewsletterMessage(data.message || 'Newsletter enviada com sucesso!');
        setNewsletterSubject('');
        setNewsletterContent('');
      } else {
        setNewsletterMessage(data.error || 'Erro ao enviar newsletter.');
      }
    } catch (error) {
      setNewsletterMessage('Erro ao conectar com servidor.');
    } finally {
      setSendingNewsletter(false);
    }
  };

  const handleDeleteSubscriber = async (email: string) => {
    try {
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        await fetchNewsletterSubscribers();
        setToastMsg({ title: 'Subscritor Removido', message: 'Subscritor removido com sucesso.', type: 'success' });
      }
    } catch (error) {
      setToastMsg({ title: 'Erro', message: 'Erro ao remover subscritor.', type: 'error' });
    }
  };

  useEffect(() => {
    // Aguardar NextAuth resolver antes de verificar autenticação
    if (sessionStatus === 'loading') return;

    // 1️⃣ Verificar sessão NextAuth (Google OAuth)
    let currentUser: User | null = null;
    if (sessionStatus === 'authenticated' && session?.user) {
      const sessionRole = (session.user as any)?.role || 'user';
      currentUser = {
        id: (session.user as any)?.id || session.user.email || '',
        name: session.user.name || '',
        email: session.user.email || '',
        plan: (session.user as any)?.plan || 'enterprise',
        status: (session.user as any)?.status || 'active',
        role: sessionRole as any,
        avatar: session.user.image || undefined,
        dueDate: (session.user as any)?.dueDate,
        createdAt: (session.user as any)?.createdAt || new Date().toISOString()
      };
      console.log('[Admin Auth] Sessão NextAuth encontrada:', { email: currentUser.email, role: currentUser.role });
    }

    // 2️⃣ Fallback: sistema customizado (localStorage)
    if (!currentUser) {
      currentUser = auth.getCurrentUser();
    }

    if (!currentUser) {
      console.log('[Admin Auth] Sem sessão, redirecionando para /login');
      router.push('/login');
      return;
    }

    console.log('[Admin Auth] Utilizador encontrado:', { email: currentUser.email, role: currentUser.role });

    // Verificar role localmente primeiro
    const localIsAdmin = auth.isAdminUser(currentUser);

    if (!localIsAdmin) {
      // 🔄 Sessão local pode estar desatualizada — verificar no servidor
      fetch('/api/users?action=me&email=' + encodeURIComponent(currentUser.email))
        .then(r => r.json())
        .then(data => {
          const serverUser = data.user || (data.users && data.users.find((u: any) => u.email?.toLowerCase() === currentUser!.email.toLowerCase()));
          if (serverUser && (serverUser.role === 'admin' || serverUser.role === 'super_admin')) {
            // Promovido! Atualizar sessão local e recarregar
            const updatedSession = { user: { ...currentUser, role: serverUser.role } };
            localStorage.setItem('wehosthere_auth', JSON.stringify(updatedSession));
            window.location.reload();
          } else {
            console.warn('[Admin Auth] Utilizador sem permissão admin. Redirecionando para dashboard.');
            router.push('/dashboard');
          }
        })
        .catch(() => {
          router.push('/dashboard');
        });
      return;
    }

    // Definir utilizador e permissões
    setAdminUser(currentUser);
    setPerms(auth.getAdminPermissions(currentUser));

    // Carregar dados
    setUsers(auth.getUsers());
    setSites(dataManager.getSites());
    setEmails(dataManager.getEmails());
    setOrders(dataManager.getOrders());
    setTickets(dataManager.getTickets());
    setSecurityLogs(dataManager.getSecurityLogs());
    setSystems(dataManager.getSystemsForRent());
    setRentalRequests(dataManager.getRentalRequests());
    setSystemAccesses(dataManager.getSystemAccesses());
    setSocialProofs(dataManager.getSocialProofs());
    setWebhookEvents(dataManager.getWebhookEvents());
    fetchAnalytics();
    fetchNewsletterSubscribers();
    setLoading(false);

    // Buscar dados atualizados do servidor via API
    Promise.all([
      auth.fetchUsersAsync().then(u => { if (u) setUsers(u); }),
      dataManager.fetchOrdersAsync().then(o => { if (o) setOrders(o); }),
      dataManager.fetchSitesAsync().then(s => { if (s) setSites(s); }),
      dataManager.fetchEmailsAsync().then(e => { if (e) setEmails(e); }),
      dataManager.fetchTicketsAsync().then(t => { if (t) setTickets(t); }),
      dataManager.fetchSystemsForRentAsync().then(s => { if (s) setSystems(s); }),
      dataManager.fetchRentalRequestsAsync().then(r => { if (r) setRentalRequests(r); }),
      dataManager.fetchSystemAccessesAsync().then(a => { if (a) setSystemAccesses(a); }),
      // Monthly Payments
      fetch('/api/monthly-payments').then(r => r.json()).then(d => {
        if (d.payments) setMonthlyPayments(d.payments);
      }).catch(() => {}),
      // Academy Data
      fetch('/api/certificates').then(r => r.json()).then(d => {
        if (d.certificates) setAcademyCertificates(d.certificates);
      }).catch(() => {}),
      fetch('/api/enrollments').then(r => r.json()).then(d => {
        if (d.enrollments) setAcademyEnrollments(d.enrollments);
      }).catch(() => {}),
      fetch('/api/webhooks/kivora').then(r => r.json()).then(d => {
        if (d.events && d.events.length > 0) setWebhookEvents(d.events);
      }).catch(() => {}),
      fetch('/api/feedback').then(r => r.json()).then(d => {
        if (d.feedbacks) setUserFeedbacks(d.feedbacks);
      }).catch(() => {})
    ]).finally(() => {
      setIsSyncingData(false);
    });

    // Polling inteligente a cada 45s (pausado quando a aba estiver inativa)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      auth.fetchUsersAsync().then((fetched) => {
        if (fetched) setUsers(fetched);
      });
      dataManager.fetchOrdersAsync().then((fetched) => {
        if (fetched) setOrders(fetched);
      });
      dataManager.fetchSitesAsync().then((fetched) => {
        if (fetched) setSites(fetched);
      });
      dataManager.fetchEmailsAsync().then((fetched) => {
        if (fetched) setEmails(fetched);
      });
      dataManager.fetchTicketsAsync().then((fetched) => {
        if (fetched) {
          setTickets(fetched);
          setSelectedTicket(prev => prev ? fetched.find(t => t.id === prev.id) || prev : null);
        }
      });
      fetch('/api/webhooks/kivora').then(r => r.json()).then(d => {
        if (d.events && d.events.length > 0) setWebhookEvents(d.events);
      }).catch(() => {});
      fetch('/api/feedback').then(r => r.json()).then(d => {
        if (d.feedbacks) setUserFeedbacks(d.feedbacks);
      }).catch(() => {});
      dataManager.fetchSystemsForRentAsync().then((fetched) => {
        if (fetched) setSystems(fetched);
      });
      dataManager.fetchRentalRequestsAsync().then((fetched) => {
        if (fetched) setRentalRequests(fetched);
      });
      dataManager.fetchSystemAccessesAsync().then((fetched) => {
        if (fetched) setSystemAccesses(fetched);
      });
      fetch('/api/monthly-payments').then(r => r.json()).then(d => {
        if (d.payments) setMonthlyPayments(d.payments);
      }).catch(() => {});
      fetchAnalytics();
      dataManager.fetchSecurityLogsAsync().then((fetched) => {
        if (fetched) setSecurityLogs(fetched);
      });
    }, 45000);

    return () => clearInterval(interval);
  }, [router, fetchAnalytics, session, sessionStatus]);

  // Refresh analytics when period changes
  useEffect(() => {
    fetchAnalytics(visitStatsPeriod);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitStatsPeriod]);

  const handleAdminSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!adminReplyMessage.trim() && adminReplyAttachments.length === 0)) return;

    const updated = dataManager.addTicketReply(
      selectedTicket.id,
      'support',
      'Equipa de Suporte WeHostHere',
      adminReplyMessage.trim(),
      'answered',
      adminReplyAttachments
    );

    if (updated) {
      setSelectedTicket(updated);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setAdminReplyMessage('');
      setAdminReplyAttachments([]);
    }
  };

  const handleAdminUpdateTicketStatus = (ticketId: string, status: SupportTicket['status'], priority?: SupportTicket['priority']) => {
    dataManager.updateTicketStatus(ticketId, status, priority);
    const updatedTickets = dataManager.getTickets();
    setTickets(updatedTickets);
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status, priority: priority || prev.priority } : null);
    }
  };

  const handleUpdateOrderStatus = (id: string, newStatus: ServiceOrder['status']) => {
    const targetOrder = orders.find(o => o.id === id);
    if (!targetOrder) return;

    // 🔒 SEGURANÇA: Permitir alteração manual se for transferência bancária, tiver comprovativo ou se o admin confirmar
    const isMobileMoney = (targetOrder.paymentMethod === 'mpesa' || targetOrder.paymentMethod === 'emola');
    if (isMobileMoney && !targetOrder.proofUrl && newStatus === 'completed') {
      const confirmApproval = window.confirm(
        '⚠️ Este pedido foi iniciado via M-Pesa/eMola sem comprovativo anexado. Deseja realmente aprovar manualmente este pagamento?'
      );
      if (!confirmApproval) return;
    }

    dataManager.updateOrderStatus(id, newStatus, true);
    // Sincronizar explicitamente no backend MongoDB com permissão administrativa
    fetch(apiEndpoint('/api/orders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', orderId: id, status: newStatus, forceAdmin: true })
    }).catch(err => console.error('Erro ao atualizar pedido no MongoDB:', err));

    if (newStatus === 'completed') {
      fetch(apiEndpoint('/api/invoices'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': 'admin@wehosthere.com' },
        body: JSON.stringify({ id, status: 'paid', paymentMethod: targetOrder.paymentMethod || 'manual' })
      }).catch(err => console.error('Erro ao sincronizar fatura associada no MongoDB:', err));
    }
    const updatedOrders = dataManager.getOrders();
    setOrders(updatedOrders);

    if (targetOrder) {
      const clientEmail = (targetOrder.clientEmail || targetOrder.userEmail || '').trim();
      const clientName = targetOrder.clientName || targetOrder.userName || clientEmail.split('@')[0] || 'Cliente';
      const serviceName = (targetOrder.serviceName || '').toLowerCase();

      // Se foi aprovado ('completed'), auto-ativar o plano e a conta do cliente!
      if (newStatus === 'completed' && clientEmail) {
        let detectedPlan: 'basic' | 'pro' | 'enterprise' | null = null;
        if (serviceName.includes('básico') || serviceName.includes('basico') || serviceName.includes('basic')) {
          detectedPlan = 'basic';
        } else if (serviceName.includes('profissional') || serviceName.includes('pro')) {
          detectedPlan = 'pro';
        } else if (serviceName.includes('empresarial') || serviceName.includes('enterprise')) {
          detectedPlan = 'enterprise';
        }

        const today = new Date();
        const renewalDueDay = today.getDate();

        const allUsers = auth.getUsers();
        const matchedUser = allUsers.find(u => u.email.toLowerCase() === clientEmail.toLowerCase());
        
        if (matchedUser) {
          if (detectedPlan) {
            auth.updatePlan(matchedUser.id, detectedPlan);
          }
          auth.updateUserStatus(matchedUser.id, 'active');
          if (typeof window !== 'undefined') {
            const uData = JSON.parse(localStorage.getItem(`user_${matchedUser.id}`) || '{}');
            uData.dueDate = renewalDueDay;
            localStorage.setItem(`user_${matchedUser.id}`, JSON.stringify(uData));
          }
          setUsers(auth.getUsers());
        }

        // Sincronizar também no backend MongoDB
        fetch(apiEndpoint('/api/users'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_plan',
            email: clientEmail,
            plan: detectedPlan || 'basic',
            status: 'active',
            dueDate: renewalDueDay
          })
        }).catch(err => console.error('Erro ao sincronizar plano:', err));

        // Ativar sites pendentes deste cliente
        const clientSites = sites.filter(s => s.userEmail?.toLowerCase() === clientEmail.toLowerCase() && s.status === 'pending');
        clientSites.forEach(s => {
          handleUpdateSiteStatus(s.id, 'active');
        });

        setToastMsg({
          title: '✅ Pedido Aprovado com Sucesso!',
          message: `O pedido #${id} foi aprovado. O plano ${detectedPlan ? detectedPlan.toUpperCase() : 'de Hospedagem'} de ${clientName} foi ativado com vencimento para daqui a 30 dias!`,
          type: 'success'
        });
      } else {
        setToastMsg({
          title: `Status do Pedido Atualizado: #${id}`,
          message: `O pedido foi alterado para: ${newStatus}`,
          type: 'success'
        });
      }

      // 1. Notificar o Administrador
      addAdminNotification({
        title: `Pedido ${newStatus === 'completed' ? 'Aprovado' : newStatus === 'cancelled' ? 'Cancelado' : 'Atualizado'}: #${id}`,
        message: `O pedido #${id} do cliente ${clientName} foi alterado para: ${newStatus}.`,
        type: newStatus === 'completed' ? 'order_approved' : newStatus === 'cancelled' ? 'order_cancelled' : 'order_updated',
        userEmail: clientEmail,
        userName: clientName,
        link: '/admin?tab=orders'
      });

      // 2. Disparar e-mail automático oficial de confirmação de pagamento para o cliente
      const orderAmountVal = getOrderAmount(targetOrder);
      const templateId = newStatus === 'completed' ? 'payment-confirmed' : newStatus === 'cancelled' ? 'order-cancelled' : 'order-status-changed';
      dispatchMessage({
        recipientEmail: clientEmail,
        recipientName: clientName,
        templateId,
        variables: {
          numero_pedido: targetOrder.id,
          valor: `${orderAmountVal.toLocaleString('pt-MZ')} MT`,
          data: new Date().toLocaleDateString('pt-BR'),
          estado_pedido: newStatus === 'completed' ? 'Confirmado / Ativo' : newStatus === 'cancelled' ? 'Cancelado' : newStatus
        },
        isAutomatic: true,
        eventType: newStatus === 'completed' ? 'payment_approved' : `order_${newStatus}`
      });
    }
  };

  const handleUpdateSiteStatus = (id: string, newStatus: 'active' | 'pending' | 'suspended') => {
    dataManager.updateSiteStatus(id, newStatus);
    const targetSite = sites.find(s => s.id === id);
    if (targetSite) {
      setSites(sites.map(s => s.id === id ? { ...s, status: newStatus } : s));
    }
  };

  // Handlers para Sistemas
  const handleApproveSystem = (systemId: string) => {
    soundEffects.playApproveAccountSound();
    dataManager.updateSystemForRent(systemId, { approvalStatus: 'approved', isActive: true });
    setSystems(systems.map(s => s.id === systemId ? { ...s, approvalStatus: 'approved', isActive: true } : s));
    setToastMsg({ title: 'Sistema Aprovado', message: 'O sistema foi aprovado e está disponível para aluguer.', type: 'success' });
  };

  const handleRejectSystem = (systemId: string, reason: string) => {
    soundEffects.playRejectAccountSound();
    dataManager.updateSystemForRent(systemId, { approvalStatus: 'rejected', rejectionReason: reason, isActive: false });
    setSystems(systems.map(s => s.id === systemId ? { ...s, approvalStatus: 'rejected', rejectionReason: reason, isActive: false } : s));
    setToastMsg({ title: 'Sistema Rejeitado', message: 'O sistema foi rejeitado.', type: 'warning' });
  };

  const handleApproveRentalRequest = (requestId: string) => {
    const request = rentalRequests.find(r => r.id === requestId);
    if (!request) return;

    soundEffects.playApproveAccountSound();
    dataManager.updateRentalRequest(requestId, { status: 'approved', approvedAt: new Date().toISOString() });
    setRentalRequests(rentalRequests.map(r => r.id === requestId ? { ...r, status: 'approved', approvedAt: new Date().toISOString() } : r));
    setToastMsg({ title: 'Pedido Aprovado', message: 'Agora forneça as credenciais de acesso ao cliente.', type: 'success' });
  };

  const handleRejectRentalRequest = (requestId: string, reason: string) => {
    soundEffects.playRejectAccountSound();
    dataManager.updateRentalRequest(requestId, { status: 'rejected', rejectedAt: new Date().toISOString(), rejectionReason: reason });
    setRentalRequests(rentalRequests.map(r => r.id === requestId ? { ...r, status: 'rejected', rejectedAt: new Date().toISOString(), rejectionReason: reason } : r));
    setToastMsg({ title: 'Pedido Rejeitado', message: 'O pedido foi rejeitado.', type: 'warning' });
  };

  const handleCreateSystemAccess = (request: RentalRequest, username: string, password: string, accessUrl: string) => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (request.billingCycle === 'yearly' ? 12 : 1));

    const accessData: Omit<SystemAccess, 'id' | 'createdAt'> = {
      systemId: request.systemId,
      systemName: request.systemName,
      clientEmail: request.clientEmail,
      clientName: request.clientName,
      credentials: {
        username,
        password,
        url: accessUrl
      },
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      billingCycle: request.billingCycle,
      updatedAt: new Date().toISOString()
    };

    dataManager.addSystemAccess(accessData);
    dataManager.updateRentalRequest(request.id, { status: 'completed' });
    
    // Recarregar dados
    Promise.all([
      dataManager.fetchSystemAccessesAsync().then(a => setSystemAccesses(a)),
      dataManager.fetchRentalRequestsAsync().then(r => setRentalRequests(r))
    ]);

    setToastMsg({ title: 'Acesso Criado', message: 'As credenciais foram enviadas ao cliente.', type: 'success' });
  };

  const handleAdminDeleteSite = (id: string, domain: string) => {
    setConfirmModalData({
      isOpen: true,
      title: 'Eliminar Domínio & Site',
      message: `Tem certeza que deseja ELIMINAR permanentemente o domínio "${domain}"? Todos os e-mails associados também serão removidos.`,
      variant: 'danger',
      onConfirm: () => {
        try {
          dataManager.deleteSite(id, domain);
          setSites(prev => prev.filter(s => s.id !== id && s.domain !== domain));
          setEmails(prev => prev.filter(e => (e.domain || '').toLowerCase() !== domain.toLowerCase() && !e.email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)));
          setConfirmModalData(null);
          setToastMsg({ title: 'Domínio Removido', message: `O domínio ${domain} foi totalmente eliminado.`, type: 'success' });
        } catch (err) {
          console.error('Erro ao eliminar site no admin:', err);
          setToastMsg({ title: 'Erro de Eliminação', message: `Não foi possível eliminar o domínio ${domain}.`, type: 'error' });
        }
      }
    });
  };

  // Handlers para Provas Sociais
  const handleAddSocialProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProofName.trim() || !newProofAction.trim()) {
      setToastMsg({ title: 'Campos Incompletos', message: 'Por favor preencha o nome do cliente e a ação realizada.', type: 'error' });
      return;
    }
    dataManager.addSocialProof({
      userName: newProofName,
      location: newProofLocation || 'Maputo',
      action: newProofAction,
      timeAgo: newProofTime || 'há poucos minutos',
      active: true
    });
    setSocialProofs(dataManager.getSocialProofs());
    setNewProofName('');
    setToastMsg({ title: 'Notificação Adicionada', message: 'A notificação ao vivo foi cadastrada e já está em exibição no site!', type: 'success' });
  };

  const handleToggleSocialProof = (id: string) => {
    const updated = dataManager.toggleSocialProof(id);
    setSocialProofs(updated);
  };

  const handleDeleteSocialProof = (id: string) => {
    const updated = dataManager.deleteSocialProof(id);
    setSocialProofs(updated);
    setToastMsg({ title: 'Notificação Removida', message: 'A prova social foi removida.', type: 'info' });
  };

  const handleAdminDeleteEmail = (id: string, userEmail?: string, emailStr?: string) => {
    const displayEmail = emailStr || id;
    setConfirmModalData({
      isOpen: true,
      title: 'Eliminar Conta de E-mail',
      message: `Tem certeza que deseja ELIMINAR a conta de e-mail "${displayEmail}"?`,
      variant: 'danger',
      onConfirm: () => {
        try {
          dataManager.deleteEmail(id, userEmail, emailStr);
          setEmails(prev => prev.filter(e => e.id !== id && e.email !== displayEmail));
          setConfirmModalData(null);
          setToastMsg({ title: 'E-mail Removido', message: `A conta ${displayEmail} foi eliminada com sucesso.`, type: 'success' });
        } catch (err) {
          console.error('Erro ao eliminar e-mail no admin:', err);
          setToastMsg({ title: 'Erro de Eliminação', message: `Não foi possível eliminar a conta ${displayEmail}.`, type: 'error' });
        }
      }
    });
  };

  const handleAdminDeleteOrder = (orderId: string) => {
    setConfirmModalData({
      isOpen: true,
      title: 'Eliminar Pedido de Serviço',
      message: `Tem certeza que deseja ELIMINAR permanentemente o pedido "${orderId}"? Esta ação removerá a fatura do sistema.`,
      variant: 'danger',
      onConfirm: () => {
        try {
          dataManager.deleteOrder(orderId);
          setOrders(prev => prev.filter(o => o.id !== orderId));
          setConfirmModalData(null);
          setToastMsg({ title: 'Pedido Removido', message: `O pedido ${orderId} foi totalmente eliminado.`, type: 'success' });
        } catch (err) {
          console.error('Erro ao eliminar pedido no admin:', err);
          setToastMsg({ title: 'Erro de Eliminação', message: `Não foi possível eliminar o pedido ${orderId}.`, type: 'error' });
        }
      }
    });
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    try {
      await auth.registerAsync(newName, newEmail, newPassword, newPlan, newStatus, newDueDate);
      setUsers(auth.getUsers());
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setToastMsg({ title: 'Cliente Cadastrado', message: `O cliente ${newName} (${newEmail}) foi cadastrado com sucesso.`, type: 'success' });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao cadastrar cliente.');
    }
  };

  const handleSavePlanChange = (userId: string, userName: string, userEmail: string) => {
    const newPlanId = pendingPlanChanges[userId];
    if (!newPlanId) return;

    const planPrices: Record<string, number> = { basic: 550, pro: 2500, enterprise: 6200 };
    const planNames: Record<string, string> = { basic: 'Básico', pro: 'Profissional', enterprise: 'Empresarial' };

    // Actualiza o plano do utilizador
    auth.updatePlan(userId, newPlanId);
    setUsers(auth.getUsers());

    // Cria uma fatura de upgrade no sistema de pedidos
    dataManager.addOrder({
      clientName: userName,
      clientEmail: userEmail,
      clientPhone: '',
      serviceName: `Alteração de Plano → ${planNames[newPlanId] || newPlanId}`,
      amount: planPrices[newPlanId] || 0,
      valorFaturado: 0,
      valorPorFaturar: planPrices[newPlanId] || 0,
      paymentMethod: 'bank_transfer',
      status: 'pending',
    });

    // Limpa o registo de alteração pendente
    setPendingPlanChanges(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });

    setToastMsg({
      title: 'Plano Alterado com Sucesso',
      message: `Plano de "${userName}" alterado para ${planNames[newPlanId]}!\nFatura de ${planPrices[newPlanId].toLocaleString('pt-MZ')} MT gerada.`,
      type: 'success'
    });
  };

  const handleUpdateEmailStatus = (emailId: string, status: 'active' | 'pending' | 'suspended') => {
    if (status === 'active') {
      soundEffects.playApproveAccountSound();
    } else {
      soundEffects.playRejectAccountSound();
    }
    dataManager.updateEmailStatus(emailId, status);
    setEmails(dataManager.getEmails());
  };

  const handleApprovePayment = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // 🔒 SEGURANÇA: Apenas permitir aprovação manual para transferência bancária
    // M-Pesa e eMola devem ser confirmados apenas via webhook
    if (order.paymentMethod === 'mpesa' || order.paymentMethod === 'emola') {
      setToastMsg({
        title: '⚠️ Ação Não Permitida',
        message: 'Pagamentos via M-Pesa/eMola devem ser confirmados automaticamente pelo webhook do gateway. Não é possível aprovar manualmente.',
        type: 'error'
      });
      return;
    }

    soundEffects.playApproveAccountSound();

    // Mover valor de por faturar para faturado
    const updatedOrder = {
      ...order,
      valorFaturado: order.valorPorFaturar,
      valorPorFaturar: 0,
      status: 'completed' as const
    };

    // Atualizar no localStorage e no servidor
    const allOrders = dataManager.getOrders();
    const index = allOrders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      allOrders[index] = updatedOrder;
      if (typeof window !== 'undefined') {
        localStorage.setItem('wehosthere_orders', JSON.stringify(allOrders));
      }
    }

    // Sincronizar com servidor
    fetch(apiEndpoint('/api/orders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'update_status', 
        orderId, 
        status: 'completed',
        order: updatedOrder
      })
    }).catch(err => console.error('Erro ao aprovar pagamento:', err));

    setOrders(allOrders);
    setToastMsg({
      title: 'Pagamento Aprovado',
      message: `O pagamento do pedido ${orderId} foi aprovado. Valor faturado: ${updatedOrder.valorFaturado.toLocaleString('pt-MZ')} MT`,
      type: 'success'
    });

    const cEmail = updatedOrder.clientEmail || updatedOrder.userEmail || '';
    const cName = updatedOrder.clientName || updatedOrder.userName || cEmail.split('@')[0] || 'Cliente';

    // Inscrição automática para cursos
    if (updatedOrder.serviceName?.toLowerCase().includes('curso')) {
      try {
        // Buscar cursos para encontrar o curso correspondente
        const coursesResponse = await fetch('/api/courses');
        const coursesData = await coursesResponse.json();
        
        if (coursesData.courses && Array.isArray(coursesData.courses)) {
          // Tentar encontrar o curso pelo nome ou pela correspondência parcial
          const matchingCourse = coursesData.courses.find((course: any) => 
            course.title.toLowerCase().includes(updatedOrder.serviceName.toLowerCase()) ||
            updatedOrder.serviceName.toLowerCase().includes(course.title.toLowerCase())
          );

          if (matchingCourse) {
            // Criar inscrição automática
            const enrollmentResponse = await fetch('/api/enrollments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'create',
                enrollment: {
                  userId: cEmail,
                  courseId: matchingCourse.id,
                  status: 'active',
                  enrolledAt: new Date().toISOString(),
                  paymentId: orderId,
                  freeLessonsAccessed: matchingCourse.freeLessonsCount || 1
                }
              })
            });

            if (enrollmentResponse.ok) {
              console.log('[Admin] Inscrição automática criada para:', cEmail, 'no curso:', matchingCourse.title);
              
              // Atualizar lista de inscrições
              fetch('/api/enrollments').then(r => r.json()).then(d => {
                if (d.enrollments) setAcademyEnrollments(d.enrollments);
              }).catch(() => {});
            }
          }
        }
      } catch (error) {
        console.error('[Admin] Erro ao criar inscrição automática:', error);
        // Não falhar o pagamento se a inscrição falhar
      }
    }

    // 1. Notificar Administrador
    addAdminNotification({
      title: `Pagamento Confirmado: #${orderId}`,
      message: `O pagamento de ${(updatedOrder.valorFaturado || 0).toLocaleString('pt-MZ')} MT do cliente ${cName} foi aprovado.`,
      type: 'payment_success',
      userEmail: cEmail,
      userName: cName,
      link: '/admin?tab=orders'
    });

    // 2. Disparar e-mail de confirmação de pagamento para o cliente
    dispatchMessage({
      recipientEmail: cEmail,
      recipientName: cName,
      templateId: 'payment-confirmed',
      variables: {
        numero_pedido: updatedOrder.id,
        valor: `${(updatedOrder.valorFaturado || 0).toLocaleString('pt-MZ')} MT`
      },
      isAutomatic: true,
      eventType: 'payment_approved'
    });
  };

  const handleDeleteEmail = (emailId: string, emailAddr: string, ownerEmail?: string) => {
    setConfirmModalData({
      isOpen: true,
      title: 'Eliminar Conta de E-mail',
      message: `Tem certeza que deseja ELIMINAR permanentemente a conta de e-mail "${emailAddr}"?`,
      variant: 'danger',
      onConfirm: () => {
        dataManager.deleteEmail(emailId, ownerEmail, emailAddr);
        setEmails(prev => prev.filter(e => e.id !== emailId && e.email !== emailAddr));
        setConfirmModalData(null);
        setToastMsg({ title: 'E-mail Removido', message: `Conta ${emailAddr} eliminada com sucesso.`, type: 'success' });
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getOrderAmount = (o: any) => {
    if (o.status === 'cancelled') return 0;
    const faturado = Number(o.valorFaturado);
    if (!isNaN(faturado) && faturado > 0) return faturado;
    const amount = Number(o.amount);
    if (!isNaN(amount) && amount > 0) return amount;
    const porFaturar = Number(o.valorPorFaturar);
    if (!isNaN(porFaturar) && porFaturar > 0) return porFaturar;
    return 0;
  };

  const isCompletedOrder = (status?: string) => {
    return status === 'completed' || status === 'approved' || status === 'active';
  };

  const completedOrdersRevenue = orders
    .filter(o => isCompletedOrder(o.status))
    .reduce((acc, order) => acc + getOrderAmount(order), 0);

  const allNonCancelledOrdersRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, order) => acc + getOrderAmount(order), 0);

  const actualOrdersRevenue = completedOrdersRevenue > 0 ? completedOrdersRevenue : allNonCancelledOrdersRevenue;

  // Adicionar pagamentos mensais ao cálculo de receita
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const monthlyPaymentsRevenue = monthlyPayments
    .filter(p => p.year === currentYear && p.month === currentMonth && (p.status === 'paid' || p.status === 'partial'))
    .reduce((acc, p) => acc + (p.paidAmount || 0), 0);

  const clientUsers = users.filter(u => u.role !== 'admin' && u.email.toLowerCase() !== 'admin@wehosthere.com');
  const activeClients = clientUsers.filter(u => {
    const isExplicitActive = u.status === 'active';
    const hasActiveAssets = (u.plan && u.plan !== 'none') || 
      sites.some(s => s.userEmail?.toLowerCase() === u.email?.toLowerCase()) ||
      emails.some(e => e.userEmail?.toLowerCase() === u.email?.toLowerCase());
    return isExplicitActive || hasActiveAssets;
  });

  const mrr = activeClients.reduce((acc, user) => {
    const planPrices = { basic: 550, pro: 2500, enterprise: 6200 };
    const effectivePlan = (user.plan && user.plan !== 'none') ? user.plan : 'basic';
    return acc + (planPrices[effectivePlan as keyof typeof planPrices] || 550);
  }, 0);

  const totalRevenue = actualOrdersRevenue > 0 ? actualOrdersRevenue + monthlyPaymentsRevenue : mrr + monthlyPaymentsRevenue;

  const validOrdersCount = orders.filter(o => o.status !== 'cancelled').length;
  const averageTicket = validOrdersCount > 0 
    ? Math.round(totalRevenue / validOrdersCount) 
    : (activeClients.length > 0 ? Math.round(mrr / activeClients.length) : 0);

  const isMpesa = (method?: string) => {
    const m = (method || '').toLowerCase().replace(/[^a-z]/g, '');
    return m === 'mpesa' || m.includes('mpesa') || m.includes('vodacom');
  };
  const isEmola = (method?: string) => {
    const m = (method || '').toLowerCase().replace(/[^a-z]/g, '');
    return m === 'emola' || m.includes('emola') || m.includes('movitel');
  };
  const isCard = (method?: string) => {
    const m = (method || '').toLowerCase().replace(/[^a-z]/g, '');
    return m === 'card' || m.includes('card') || m.includes('cartao') || m.includes('visa') || m.includes('master');
  };

  const mpesaRevenue = orders.filter(o => isMpesa(o.paymentMethod) && o.status !== 'cancelled').reduce((acc, o) => acc + getOrderAmount(o), 0);
  const emolaRevenue = orders.filter(o => isEmola(o.paymentMethod) && o.status !== 'cancelled').reduce((acc, o) => acc + getOrderAmount(o), 0);
  const cardRevenue = orders.filter(o => isCard(o.paymentMethod) && o.status !== 'cancelled').reduce((acc, o) => acc + getOrderAmount(o), 0);
  const validOrdersTotal = (mpesaRevenue + emolaRevenue + cardRevenue) || actualOrdersRevenue || 1;

  const getUserStatus = (user: User) => {
    // Respeitar decisão explícita do Administrador
    if (user.status === 'active') return 'active';
    if (user.status === 'suspended') return 'suspended';

    // Se o cliente tem domínio vinculado ou conta de email, está ativo no plano básico
    const hasAssets = (user.plan && user.plan !== 'none') ||
      sites.some(s => s.userEmail?.toLowerCase() === user.email?.toLowerCase()) ||
      emails.some(e => e.userEmail?.toLowerCase() === user.email?.toLowerCase());
    if (hasAssets) return 'active';

    if (user.status === 'pending') return 'pending';

    const today = new Date();
    const currentDay = today.getDate();
    const dueDay = user.dueDate || 29;

    return auth.isAdminUser(user) ? 'active' : 'pending';
  };

  const filteredUsers = users.filter((user) => {
    const status = getUserStatus(user);
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'suspended':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <PageLoader text="A carregar painel de administração..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {isLoggingOut && <PageLoader text="A encerrar a sua sessão com segurança... Até breve!" />}
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2.5 sm:py-3.5 gap-2 sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
              <BrandLogo />
            </div>

            {/* Menu Horizontal com Scroll Suave */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 max-w-full">
              <div className="shrink-0">
                <LanguageSelector />
              </div>

              <button
                type="button"
                onClick={handleRefreshAdminData}
                disabled={isRefreshingAdmin}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 text-[10px] sm:text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-lg transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
                title="Sincronizar dados em tempo real com o MongoDB Atlas"
              >
                <RefreshCw className={`h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-600 ${isRefreshingAdmin ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshingAdmin ? 'A atualizar...' : 'Atualizar Dados'}</span>
              </button>

              <button
                type="button"
                onClick={() => setHideSensitiveValues(!hideSensitiveValues)}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 text-[10px] sm:text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 rounded-lg transition shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
                title={hideSensitiveValues ? 'Mostrar valores sensíveis' : 'Esconder valores sensíveis'}
              >
                {hideSensitiveValues ? (
                  <EyeOff className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-600" />
                ) : (
                  <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-600" />
                )}
                <span className="hidden sm:inline">{hideSensitiveValues ? 'Mostrar' : 'Esconder'}</span>
              </button>

              <div className="h-4 w-px bg-gray-200 shrink-0 mx-0.5" />

              <Link
                href="/"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-primary-600 font-medium transition text-[10px] sm:text-xs sm:text-sm shrink-0 whitespace-nowrap px-2 py-1.5 rounded-lg hover:bg-gray-100/80"
              >
                <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                <span className="hidden md:inline">Ver Site</span>
              </Link>

              <Link
                href="/admin/comunicacao"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-blue-600 font-medium transition text-[10px] sm:text-xs sm:text-sm shrink-0 whitespace-nowrap px-2 py-1.5 rounded-lg hover:bg-blue-50/70"
              >
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                <span>Comunicação</span>
              </Link>

              <Link
                href="/admin/partners"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-indigo-600 font-medium transition text-[10px] sm:text-xs sm:text-sm shrink-0 whitespace-nowrap px-2 py-1.5 rounded-lg hover:bg-indigo-50/70"
              >
                <Handshake className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" />
                <span>Parceiros</span>
              </Link>

              <Link
                href="/admin/affiliates"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-blue-600 font-medium transition text-[10px] sm:text-xs sm:text-sm shrink-0 whitespace-nowrap px-2 py-1.5 rounded-lg hover:bg-blue-50/70"
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                <span>Afiliados</span>
              </Link>

              <Link
                href="/admin/email-domains"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-purple-600 font-medium transition text-[10px] sm:text-xs sm:text-sm shrink-0 whitespace-nowrap px-2 py-1.5 rounded-lg hover:bg-purple-50/70"
              >
                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
                <span>Email</span>
              </Link>

              <Link
                href="/admin/domain-search-logs"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-amber-600 font-medium transition text-[10px] sm:text-xs sm:text-sm shrink-0 whitespace-nowrap px-2 py-1.5 rounded-lg hover:bg-amber-50/70"
                title="Histórico e tendências de pesquisas de domínios"
              >
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                <span>Pesquisas</span>
              </Link>

              <Link
                href="/admin/blog"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-green-600 font-medium transition text-[10px] sm:text-xs sm:text-sm shrink-0 whitespace-nowrap px-2 py-1.5 rounded-lg hover:bg-green-50/70"
              >
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                <span>Blog</span>
              </Link>

              <Link
                href="/admin/cashvibe"
                className="flex items-center space-x-1.5 text-slate-800 hover:text-emerald-600 font-bold transition text-[10px] sm:text-xs sm:text-sm shrink-0 whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs hover:bg-emerald-100/70"
                title="Cashvibe - Sistema de Microcrédito Integrado"
              >
                <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                <span>Cashvibe (Crédito)</span>
              </Link>

              <Link
                href="/admin/pagamentos-mensais"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-emerald-600 font-medium transition text-[10px] sm:text-xs sm:text-sm shrink-0 whitespace-nowrap px-2 py-1.5 rounded-lg hover:bg-emerald-50/70"
              >
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                <span>Pagamentos</span>
              </Link>

              <Link
                href="/admin/faturas"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-orange-600 font-medium transition text-[10px] sm:text-xs sm:text-sm shrink-0 whitespace-nowrap px-2 py-1.5 rounded-lg hover:bg-orange-50/70"
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                <span>Faturas</span>
              </Link>

              <Link
                href="/admin/academy"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-indigo-600 font-medium transition text-[10px] sm:text-xs sm:text-sm shrink-0 whitespace-nowrap px-2 py-1.5 rounded-lg hover:bg-indigo-50/70"
              >
                <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" />
                <span>Cursos</span>
              </Link>

              <Link
                href="/admin/revista"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-sky-600 font-medium transition text-[10px] sm:text-xs sm:text-sm shrink-0 whitespace-nowrap px-2 py-1.5 rounded-lg hover:bg-sky-50/70"
              >
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-500" />
                <span>Revista</span>
              </Link>

              {perms.canAccessSystemSettings && (
                <Link
                  href="/admin/settings"
                  className="flex items-center space-x-1.5 text-gray-600 hover:text-purple-600 font-medium transition text-[10px] sm:text-xs sm:text-sm shrink-0 whitespace-nowrap px-2 py-1.5 rounded-lg hover:bg-purple-50/70"
                >
                  <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
                  <span>Configurações</span>
                </Link>
              )}

              <Link
                href="/test-payment"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-green-600 font-medium transition text-[10px] sm:text-xs sm:text-sm shrink-0 whitespace-nowrap px-2 py-1.5 rounded-lg hover:bg-green-50/70"
              >
                <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                <span className="hidden sm:inline">Testar Pagamento</span>
              </Link>

              <div className="h-4 w-px bg-gray-200 shrink-0 mx-0.5" />

              <button
                onClick={() => {
                  auth.startClientView();
                  router.push('/dashboard');
                }}
                className="flex items-center space-x-1.5 p-1.5 sm:px-3 sm:py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition shadow-sm cursor-pointer shrink-0 whitespace-nowrap"
                title="Visualizar o painel como cliente"
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline">Ver como Cliente</span>
              </button>

              <div className="shrink-0">
                <AdminNotificationCenter onNavigate={(url) => router.push(url)} />
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 sm:space-x-2 text-gray-600 hover:text-red-600 font-medium transition text-[10px] sm:text-xs sm:text-sm cursor-pointer shrink-0 whitespace-nowrap px-2 py-1.5 rounded-lg hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 🔮 AI Copilot Top Bar — Posicionado imediatamente APÓS a barra de navegação sobre fundo branco */}
      <div className="bg-white border-b border-gray-100 py-2.5 shadow-xs">
        <AdminAiTopBar />
      </div>

      <div className="max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="flex items-start gap-4 xl:gap-6">
          {/* Sidebar Fixa / Sticky no Desktop */}
          <AdminSidebar
            pendingOrdersCount={orders.filter(o => o.status === 'pending' || o.status === 'in_progress').length}
            openTicketsCount={tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}
            pendingEmailsCount={emails.filter(e => e.status === 'pending' || !e.status).length}
            pendingDomainsCount={sites.filter(s => s.status === 'pending').length}
            totalUsersCount={users.length}
            onlineUsersCount={onlineUsers.length}
            isRefreshing={isRefreshingAdmin}
            onRefresh={handleRefreshAdminData}
            hideSensitive={hideSensitiveValues}
            onToggleSensitive={() => setHideSensitiveValues(!hideSensitiveValues)}
          />

          {/* Conteúdo Principal do Painel */}
          <div className="flex-1 min-w-0">
            {/* Banner de Incentivo Push para Admin (Ativação e Teste no Telemóvel) */}
            <AdminPushBanner />

        {/* ───── ANALYTICS — Quem está Online & Visitantes ───── */}
        <div id="sec-online-analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 scroll-mt-28">

          {/* Painel: Utilizadores Online Agora */}
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm">Online Agora</h3>
              </div>
              <span className={`text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${onlineUsers.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {onlineUsers.length} utilizador{onlineUsers.length !== 1 ? 'es' : ''}
              </span>
            </div>

            <div className="divide-y divide-gray-50 max-h-60 sm:max-h-72 overflow-y-auto">
              {onlineUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-gray-400">
                  <WifiOff className="h-6 w-6 sm:h-8 sm:w-8 mb-2 opacity-40" />
                  <p className="text-[10px] sm:text-sm">Nenhum utilizador online</p>
                </div>
              ) : (
                onlineUsers.map(u => (
                  <div key={u.userEmail} className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-5 py-2 sm:py-3 hover:bg-gray-50 transition">
                    <div className="relative">
                      <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white font-bold text-[10px] sm:text-sm flex-shrink-0 ${
                        u.isGuest
                          ? 'bg-gradient-to-br from-slate-600 to-slate-800'
                          : 'bg-gradient-to-br from-primary-500 to-purple-600'
                      }`}>
                        {u.userAvatar ? (
                          <img
                            src={u.userAvatar}
                            alt={u.userName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          u.userName?.charAt(0)?.toUpperCase() || '?'
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] sm:text-sm font-semibold text-gray-900 truncate">{u.userName}</p>
                        {u.isGuest ? (
                          <span className="text-[8px] bg-slate-100 text-slate-600 font-medium px-1 rounded">Visitante</span>
                        ) : (
                          <span className="text-[8px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-200/60">Registado</span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate font-mono">{u.currentPage}</p>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 sm:px-1.5 py-0.5 rounded-full whitespace-nowrap">ONLINE</span>
                  </div>
                ))
              )}
            </div>

            {/* Histórico Recente de Presença */}
            {recentPresence.filter(p => !onlineUsers.find(o => o.userEmail === p.userEmail)).length > 0 && (
              <div className="border-t border-gray-100">
                <p className="px-3 sm:px-5 py-1.5 sm:py-2 text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 font-semibold bg-gray-50">Vistos recentemente</p>
                <div className="divide-y divide-gray-50 max-h-40 sm:max-h-52 overflow-y-auto">
                  {recentPresence
                    .filter(p => !onlineUsers.find(o => o.userEmail === p.userEmail))
                    .slice(0, 10)
                    .map(u => {
                      const lastSeenDate = new Date(u.lastSeen);
                      const diffMin = Math.floor((Date.now() - lastSeenDate.getTime()) / 60000);
                      const timeLabel = diffMin < 1 ? 'agora mesmo' : diffMin < 60 ? `${diffMin}m atrás` : `${Math.floor(diffMin / 60)}h atrás`;
                      return (
                        <div key={u.userEmail} className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-5 py-2 sm:py-2.5 hover:bg-gray-50 transition">
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs flex-shrink-0 ${
                            u.isGuest ? 'bg-slate-200 text-slate-600' : 'bg-primary-100 text-primary-700'
                          }`}>
                            {u.userAvatar ? (
                          <img
                            src={u.userAvatar}
                            alt={u.userName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          u.userName?.charAt(0)?.toUpperCase() || '?'
                        )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-[10px] sm:text-xs font-semibold text-gray-700 truncate">{u.userName}</p>
                              {!u.isGuest && (
                                <span className="text-[8px] bg-blue-50 text-blue-700 font-bold px-1 rounded border border-blue-200/50">Registado</span>
                              )}
                            </div>
                            <p className="text-[9px] sm:text-[10px] text-gray-400 truncate font-mono">{u.currentPage}</p>
                          </div>
                          <span className="text-[9px] sm:text-[10px] text-gray-400 whitespace-nowrap">{timeLabel}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Painel: Visitantes do Site */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gray-50 gap-2 sm:gap-0">
              <div className="flex items-center space-x-2">
                <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm">Visitantes do Site</h3>
              </div>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[10px] sm:text-xs font-semibold">
                {(['today', 'week', 'month', 'all'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setVisitStatsPeriod(p);
                      fetchAnalytics(p);
                    }}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 transition cursor-pointer ${visitStatsPeriod === p ? 'bg-primary-600 text-white font-bold' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    {p === 'today' ? 'Hoje' : p === 'week' ? '7 dias' : p === 'month' ? '30 dias' : 'Todo'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 sm:p-5 grid grid-cols-2 gap-3 sm:gap-4 border-b border-gray-100">
              <div className="bg-primary-50 rounded-xl p-3 sm:p-4 border border-primary-100">
                <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1">
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600" />
                  <span className="text-[10px] sm:text-xs text-primary-600 font-semibold uppercase tracking-wider">Visualizações</span>
                </div>
                {isSyncingData ? (
                  <div className="flex items-center space-x-2 text-primary-600 py-1">
                    <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin" />
                    <span className="text-[10px] sm:text-xs text-primary-500 font-semibold">Atualizando...</span>
                  </div>
                ) : (
                  <p className="text-2xl sm:text-3xl font-extrabold text-primary-700">{formatSensitiveValue(visitStats.total, false)}</p>
                )}
                <p className="text-[10px] sm:text-xs text-primary-500 mt-0.5">páginas vistas</p>
                {visitStats.milestones?.pageViews && (
                  <div className="mt-2 pt-2 border-t border-primary-200/50">
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-primary-600 font-medium">
                      <span>Próximo e-mail (+100):</span>
                      <span className="font-bold">{visitStats.milestones.pageViews.nextMilestone}</span>
                    </div>
                    <div className="w-full bg-primary-200/60 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-primary-600 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((visitStats.total % 100) / 100) * 100))}%`
                        }}
                      />
                    </div>
                    <p className="text-[8px] sm:text-[9px] text-primary-500 mt-0.5 text-right font-medium">
                      faltam {Math.max(0, 100 - (visitStats.total % 100))} para o alerta
                    </p>
                  </div>
                )}
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 border border-emerald-100">
                <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                  <span className="text-[10px] sm:text-xs text-emerald-600 font-semibold uppercase tracking-wider">Visitantes Únicos</span>
                </div>
                {isSyncingData ? (
                  <div className="flex items-center space-x-2 text-emerald-600 py-1">
                    <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin" />
                    <span className="text-[10px] sm:text-xs text-emerald-500 font-semibold">Atualizando...</span>
                  </div>
                ) : (
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{formatSensitiveValue(visitStats.uniqueVisitors, false)}</p>
                )}
                <p className="text-[10px] sm:text-xs text-emerald-500 mt-0.5">sessões distintas</p>
                {visitStats.milestones?.uniqueVisitors && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/50">
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-emerald-600 font-medium">
                      <span>Próximo e-mail (+10):</span>
                      <span className="font-bold">{visitStats.milestones.uniqueVisitors.nextMilestone}</span>
                    </div>
                    <div className="w-full bg-emerald-200/60 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((visitStats.uniqueVisitors % 10) / 10) * 100))}%`
                        }}
                      />
                    </div>
                    <p className="text-[8px] sm:text-[9px] text-emerald-600 mt-0.5 text-right font-medium">
                      faltam {Math.max(0, 10 - (visitStats.uniqueVisitors % 10))} para o alerta
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Páginas */}
            <div className="p-3 sm:p-5">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 sm:mb-3">Top Páginas</p>
              {isSyncingData ? (
                <div className="space-y-2 sm:space-y-3 py-2">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              ) : visitStats.topPages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 sm:py-6 text-gray-400">
                  <Globe className="h-5 w-5 sm:h-7 sm:w-7 mb-2 opacity-40" />
                  <p className="text-[10px] sm:text-sm">Sem dados de visitas ainda</p>
                  <p className="text-[9px] sm:text-xs text-gray-400 mt-1">As visitas aparecerão aqui em tempo real</p>
                </div>
              ) : (
                <div className="space-y-1.5 sm:space-y-2">
                  {visitStats.topPages.map((pg, i) => {
                    const maxCount = visitStats.topPages[0]?.count || 1;
                    const pct = Math.round((pg.count / maxCount) * 100);
                    return (
                      <div key={pg.page} className="flex items-center space-x-2 sm:space-x-3">
                        <span className="text-[10px] sm:text-xs text-gray-400 w-3 sm:w-4 text-right font-bold">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                            <span className="text-[10px] sm:text-xs font-medium text-gray-700 truncate max-w-[150px] sm:max-w-[200px]">{pg.page}</span>
                            <span className="text-[10px] sm:text-xs text-gray-500 font-semibold ml-2">{pg.count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1 sm:h-1.5 overflow-hidden">
                            <div className="bg-primary-500 h-1 sm:h-1.5 rounded-full transition-all duration-700 animate-pulse" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top KPIs */}
        <div id="sec-kpis" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8 scroll-mt-28">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Total</span>
            </div>
            {isSyncingData ? (
              <div className="flex items-center space-x-2 text-primary-600 my-1 font-semibold">
                <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin" />
                <span className="text-[10px] sm:text-sm text-gray-500">A processar...</span>
              </div>
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatSensitiveValue(users.length)}</p>
            )}
            <p className="text-gray-500 text-[10px] sm:text-sm mt-1">Usuários cadastrados</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Server className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Total</span>
            </div>
            {isSyncingData ? (
              <div className="flex items-center space-x-2 text-primary-600 my-1 font-semibold">
                <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin" />
                <span className="text-[10px] sm:text-sm text-gray-500">A processar...</span>
              </div>
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatSensitiveValue(sites.length)}</p>
            )}
            <p className="text-gray-500 text-[10px] sm:text-sm mt-1">Sites & Domínios</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Total</span>
            </div>
            {isSyncingData ? (
              <div className="flex items-center space-x-2 text-primary-600 my-1 font-semibold">
                <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin" />
                <span className="text-[10px] sm:text-sm text-gray-500">A processar...</span>
              </div>
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatSensitiveValue(emails.length)}</p>
            )}
            <p className="text-gray-500 text-[10px] sm:text-sm mt-1">Contas de Email</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Total</span>
            </div>
            {isSyncingData ? (
              <div className="flex items-center space-x-2 text-primary-600 my-1 font-semibold">
                <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin" />
                <span className="text-[10px] sm:text-sm text-gray-500">A processar...</span>
              </div>
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatSensitiveValue(totalRevenue)} MT</p>
            )}
            <p className="text-gray-500 text-[10px] sm:text-sm mt-1">Receita Total</p>
          </div>
        </div>

        {/* Módulo de Análise Financeira & Métricas Recorrentes */}
        <div id="sec-faturamento" className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                <span>Análise Financeira & Desempenho de Vendas</span>
              </h2>
              <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">Métricas de faturamento em Meticais, ticket médio e liquidação via M-Pesa / eMola</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-extrabold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-emerald-300">
              Projeção Anual: {formatSensitiveValue(mrr * 12)} MT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 pt-2">
            {/* Ticket Médio */}
            <div className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider block">Ticket Médio por Cliente</span>
              {isSyncingData ? (
                <div className="flex items-center space-x-2 text-gray-600 mt-1 py-0.5">
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-500">A processar...</span>
                </div>
              ) : (
                <span className="text-xl sm:text-2xl font-black text-gray-900 block mt-1">{formatSensitiveValue(averageTicket)} MT</span>
              )}
              <span className="text-[10px] sm:text-xs text-gray-500 mt-1 block">Média de gasto por contratação na plataforma</span>
            </div>

            {/* Faturamento M-Pesa */}
            <div className="p-3 sm:p-4 bg-red-50/70 border border-red-200 rounded-xl">
              <span className="text-[10px] sm:text-xs font-bold text-red-900 uppercase tracking-wider block">Faturamento via M-Pesa (Vodacom)</span>
              {isSyncingData ? (
                <div className="flex items-center space-x-2 text-red-600 mt-1 py-0.5">
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="text-[10px] sm:text-xs font-semibold text-red-600">A processar...</span>
                </div>
              ) : (
                <span className="text-xl sm:text-2xl font-black text-red-700 block mt-1">{formatSensitiveValue(mpesaRevenue)} MT</span>
              )}
              <div className="w-full bg-red-200 h-1.5 sm:h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-red-600 h-1.5 sm:h-2 rounded-full transition-all duration-700 animate-pulse" style={{ width: `${Math.round((mpesaRevenue / validOrdersTotal) * 100)}%` }}></div>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-red-700 mt-1 block">{Math.round((mpesaRevenue / validOrdersTotal) * 100)}% do volume de vendas</span>
            </div>

            {/* Faturamento eMola / Cartão */}
            <div className="p-3 sm:p-4 bg-orange-50/70 border border-orange-200 rounded-xl">
              <span className="text-[10px] sm:text-xs font-bold text-orange-900 uppercase tracking-wider block">eMola (Movitel) & Cartão</span>
              {isSyncingData ? (
                <div className="flex items-center space-x-2 text-orange-600 mt-1 py-0.5">
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="text-[10px] sm:text-xs font-semibold text-orange-600">A processar...</span>
                </div>
              ) : (
                <span className="text-xl sm:text-2xl font-black text-orange-700 block mt-1">{formatSensitiveValue(emolaRevenue + cardRevenue)} MT</span>
              )}
              <div className="w-full bg-orange-200 h-1.5 sm:h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-orange-600 h-1.5 sm:h-2 rounded-full transition-all duration-700 animate-pulse" style={{ width: `${Math.round(((emolaRevenue + cardRevenue) / validOrdersTotal) * 100)}%` }}></div>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-orange-700 mt-1 block">{Math.round(((emolaRevenue + cardRevenue) / validOrdersTotal) * 100)}% do volume de vendas</span>
            </div>
          </div>
        </div>

        {/* Módulo de Alertas Críticos & Auditoria de Segurança */}
        <div className="bg-white border border-red-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                <span>Central de Alertas Críticos & Auditoria de Segurança</span>
              </h2>
              <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">Registo em tempo real de tentativas maliciosas de login, bloqueios por força bruta e alertas da plataforma</p>
            </div>
            <span className="bg-red-100 text-red-800 text-[10px] sm:text-xs font-extrabold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-red-300 flex items-center space-x-1.5">
              <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600" />
              <span>{securityLogs.filter(l => l.type === 'account_locked').length} Bloqueios Críticos</span>
            </span>
          </div>

          {securityLogs.length === 0 ? (
            <div className="p-3 sm:p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[10px] sm:text-xs font-semibold flex items-center space-x-2">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
              <span>Nenhum alerta crítico de invasão ou tentativa incorreta de login detetado recentemente. O sistema está seguro.</span>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-56 sm:max-h-64 overflow-y-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left text-[10px] sm:text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">E-mail Alvo</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Evento / Tipo</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3 hidden sm:table-cell">Descrição do Alerta</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">País de Origem</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-right">Data & Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {securityLogs.slice(0, 15).map((log) => (
                    <tr key={log.id} className="hover:bg-red-50/40 transition">
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 font-mono font-bold text-gray-900 text-[10px] sm:text-xs truncate max-w-[100px] sm:max-w-none">{log.email}</td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3">
                        {log.type === 'account_locked' && (
                          <span className="bg-red-600 text-white font-extrabold px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] tracking-wide uppercase">
                            🔒 Bloqueada
                          </span>
                        )}
                        {log.type === 'failed_login' && (
                          <span className="bg-amber-100 text-amber-800 font-bold px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px]">
                            ⚠️ Senha Incorreta
                          </span>
                        )}
                        {log.type === 'suspended_attempt' && (
                          <span className="bg-purple-100 text-purple-800 font-bold px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px]">
                            ⛔ Conta Suspensa
                          </span>
                        )}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-gray-700 text-[10px] sm:text-xs hidden sm:table-cell">{log.message}</td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3">
                        {log.country ? (
                          <span className="flex items-center space-x-1 sm:space-x-1.5 font-semibold text-gray-900 text-[10px] sm:text-xs">
                            <span className="text-sm sm:text-lg">{getCountryFlag(log.country)}</span>
                            <span className="hidden sm:inline">{log.country}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[10px] sm:text-xs">Desconhecido</span>
                        )}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right text-gray-500 font-mono text-[9px] sm:text-xs">
                        {new Date(log.createdAt).toLocaleString('pt-MZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ───── MONITORAMENTO DE EVENTOS WEBHOOK KIVORA ───── */}
        <div className="bg-white border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <span>Monitoramento de Eventos Webhook Kivora</span>
              </h2>
              <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">Eventos de pagamento recebidos em tempo real da Kivora</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-emerald-300">
                {webhookEvents.filter(e => e.processed).length} Processados
              </span>
              <span className="bg-red-100 text-red-800 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-red-300">
                {webhookEvents.filter(e => !e.processed).length} Falhados
              </span>
              <button
                onClick={() => {
                  dataManager.clearWebhookEvents();
                  setWebhookEvents([]);
                }}
                className="text-[10px] sm:text-xs font-bold text-gray-600 hover:text-red-600 px-2 py-1 rounded border border-gray-200 hover:border-red-300 transition cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>

          {webhookEvents.length === 0 ? (
            <div className="p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200 text-blue-800 text-[10px] sm:text-xs font-semibold flex items-center space-x-2">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              <span>Nenhum evento do webhook recebido ainda. Os eventos aparecerão aqui quando pagamentos forem processados.</span>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-64 sm:max-h-80 overflow-y-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left text-[10px] sm:text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Tipo</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Evento ID</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Referência</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3 hidden sm:table-cell">Cliente</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Valor</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Status</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3 hidden sm:table-cell">Motivo</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {webhookEvents.slice(0, 20).map((event) => (
                    <tr key={event.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3">
                        <span className={`inline-block px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${
                          event.eventType.includes('completed') ? 'bg-emerald-100 text-emerald-700' :
                          event.eventType.includes('failed') ? 'bg-red-100 text-red-700' :
                          event.eventType.includes('pending') ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {event.eventType.replace('payment.', '').replace('b2c.', '').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 font-mono text-gray-600 text-[9px] sm:text-xs truncate max-w-[80px] sm:max-w-none">
                        {event.eventId?.slice(0, 12)}...
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 font-mono text-gray-900 text-[9px] sm:text-xs">
                        {event.reference || '-'}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-gray-700 text-[10px] sm:text-xs hidden sm:table-cell">
                        {event.clientName || '-'}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 font-bold text-gray-900 text-[10px] sm:text-xs">
                        {event.amount ? `${event.amount} ${event.currency || 'MZN'}` : '-'}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3">
                        {event.processed ? (
                          <span className="bg-emerald-100 text-emerald-700 font-bold px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px]">
                            ✓ Processado
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-700 font-bold px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px]">
                            ✗ Falhou
                          </span>
                        )}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-gray-700 text-[10px] sm:text-xs hidden sm:table-cell max-w-[150px] truncate">
                        {event.failureReason || '-'}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right text-gray-500 font-mono text-[9px] sm:text-xs">
                        {new Date(event.createdAt).toLocaleString('pt-MZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ───── GESTÃO DE PAYOUTS B2C (ENVIAR DINHEIRO PARA CLIENTES) ───── */}
        <div id="sec-payouts" className="bg-white border border-green-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Send className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                <span>Gestão de Payouts B2C</span>
              </h2>
              <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">Envie dinheiro para clientes (reembolsos, comissões, prémios)</p>
            </div>
            {b2cPayouts.length > 0 && (
              <button
                onClick={handleExportPayoutsCSV}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg shadow transition cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            )}
          </div>

          {/* Formulário de Payout */}
          <div className="bg-green-50/60 border border-green-100 rounded-xl p-3 sm:p-4 mb-6">
            <h3 className="text-xs sm:text-sm font-bold text-green-900 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-green-600" />
              <span>Novo Payout B2C</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">Número de Telefone</label>
                <input
                  type="text"
                  placeholder="841234567"
                  value={payoutPhone}
                  onChange={(e) => setPayoutPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">Valor (MZN)</label>
                <input
                  type="number"
                  placeholder="100"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-green-500"
                  required
                  min="1"
                  step="0.01"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">Referência (opcional)</label>
                <input
                  type="text"
                  placeholder="PAYOUT-100"
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <button
              onClick={handleB2CPayout}
              disabled={payoutLoading || !payoutPhone || !payoutAmount}
              className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg shadow transition disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {payoutLoading ? 'Processando...' : 'Enviar Payout'}
            </button>
          </div>

          {payoutError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 mb-4">
              <p className="text-red-700 text-xs sm:text-sm">{payoutError}</p>
            </div>
          )}

          {payoutSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 mb-4">
              <p className="text-emerald-700 text-xs sm:text-sm">{payoutSuccess}</p>
            </div>
          )}

          {/* Tabela de Histórico de Payouts */}
          {b2cPayouts.length > 0 && (
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left text-[10px] sm:text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">ID</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Telefone</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Valor</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Referência</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Status</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {b2cPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-green-50/40 transition">
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 font-mono text-gray-600 text-[9px] sm:text-xs">
                        {payout.id?.slice(0, 12)}...
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 font-mono text-gray-900 text-[9px] sm:text-xs">
                        {payout.phone}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 font-bold text-gray-900 text-[10px] sm:text-xs">
                        {payout.amount} {payout.currency}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 font-mono text-gray-700 text-[9px] sm:text-xs">
                        {payout.reference}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3">
                        <span className={`inline-block px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${
                          payout.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          payout.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                          payout.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {payout.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right text-gray-500 font-mono text-[9px] sm:text-xs">
                        {new Date(payout.createdAt).toLocaleString('pt-MZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {b2cPayouts.length === 0 && (
            <div className="p-3 sm:p-4 bg-green-50 rounded-xl border border-green-200 text-green-800 text-[10px] sm:text-xs font-semibold flex items-center space-x-2">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
              <span>Nenhum payout realizado ainda. Use o formulário acima para enviar dinheiro para clientes.</span>
            </div>
          )}
        </div>

        {/* ───── GESTÃO DE ASSINATURAS RECURRENTES ───── */}
        <div id="sec-assinaturas" className="bg-white border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <span>Gestão de Assinaturas Recorrentes</span>
              </h2>
              <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">Crie e gerencie assinaturas mensais/anuais para clientes</p>
            </div>
          </div>

          {/* Formulário de Assinatura */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 sm:p-4 mb-6">
            <h3 className="text-xs sm:text-sm font-bold text-blue-900 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Nova Assinatura</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  placeholder="João Silva"
                  value={subCustomerName}
                  onChange={(e) => setSubCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="joao@email.com"
                  value={subCustomerEmail}
                  onChange={(e) => setSubCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">Telefone</label>
                <input
                  type="text"
                  placeholder="841234567"
                  value={subCustomerPhone}
                  onChange={(e) => setSubCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">Valor (MZN)</label>
                <input
                  type="number"
                  placeholder="299"
                  value={subAmount}
                  onChange={(e) => setSubAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                  step="0.01"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">Intervalo</label>
                <select
                  value={subInterval}
                  onChange={(e) => setSubInterval(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">Referência (opcional)</label>
                <input
                  type="text"
                  placeholder="SUB-001"
                  value={subReference}
                  onChange={(e) => setSubReference(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleCreateSubscription}
              disabled={subLoading || !subCustomerName || !subAmount}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow transition disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {subLoading ? 'Processando...' : 'Criar Assinatura'}
            </button>
          </div>

          {subError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 mb-4">
              <p className="text-red-700 text-xs sm:text-sm">{subError}</p>
            </div>
          )}

          {subSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 mb-4">
              <p className="text-emerald-700 text-xs sm:text-sm">{subSuccess}</p>
            </div>
          )}

          {/* Tabela de Assinaturas */}
          {subscriptions.length > 0 && (
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left text-[10px] sm:text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">ID</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Cliente</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Valor</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Intervalo</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3">Status</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3 hidden sm:table-cell">Próxima Cobrança</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-right">Ações</th>
                    <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 font-mono text-gray-600 text-[9px] sm:text-xs">
                        {sub.id?.slice(0, 12)}...
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-gray-900 text-[10px] sm:text-xs">
                        {sub.customer?.name || '-'}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 font-bold text-gray-900 text-[10px] sm:text-xs">
                        {sub.amount} {sub.currency}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-gray-700 text-[10px] sm:text-xs capitalize">
                        {sub.interval}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3">
                        <span className={`inline-block px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${
                          sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          sub.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          sub.status === 'past_due' ? 'bg-amber-100 text-amber-700' :
                          sub.status === 'paused' ? 'bg-gray-100 text-gray-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {sub.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-gray-700 text-[10px] sm:text-xs hidden sm:table-cell">
                        {sub.nextBillingDate || '-'}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right">
                        {sub.status === 'active' && (
                          <button
                            onClick={() => handleCancelSubscription(sub.id)}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white font-bold text-[9px] sm:text-[10px] rounded transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right text-gray-500 font-mono text-[9px] sm:text-xs">
                        {new Date(sub.createdAt).toLocaleString('pt-MZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {subscriptions.length === 0 && (
            <div className="p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200 text-blue-800 text-[10px] sm:text-xs font-semibold flex items-center space-x-2">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              <span>Nenhuma assinatura criada ainda. Use o formulário acima para criar assinaturas recorrentes.</span>
            </div>
          )}
        </div>

        {/* ───── GESTÃO DE PROVAS SOCIAIS / NOTIFICAÇÕES AO VIVO ───── */}
        <div id="sec-provas-sociais" className="bg-white border border-purple-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                <span>Gestão de Provas Sociais & Notificações ao Vivo (Toast)</span>
              </h2>
              <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">
                Cadastre e controle as notificações automáticas de vendas/registros exibidas no canto da tela para os visitantes.
              </p>
            </div>
            <span className="bg-purple-100 text-purple-800 text-[10px] sm:text-xs font-extrabold px-3 py-1 rounded-full border border-purple-300">
              {socialProofs.filter(p => p.active).length} Notificações Ativas
            </span>
          </div>

          {/* Formulário de Adicionar Nova Prova Social */}
          <form onSubmit={handleAddSocialProof} className="bg-purple-50/60 border border-purple-100 rounded-xl p-3 sm:p-4 mb-6">
            <h3 className="text-xs sm:text-sm font-bold text-purple-900 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-purple-600" />
              <span>Adicionar Nova Notificação Manual de Venda / Registro</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos M."
                  value={newProofName}
                  onChange={(e) => setNewProofName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">Cidade / Localização</label>
                <input
                  type="text"
                  placeholder="Ex: Maputo, Matola, Beira..."
                  value={newProofLocation}
                  onChange={(e) => setNewProofLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">Ação / Produto</label>
                <input
                  type="text"
                  placeholder="Ex: contratou o plano Profissional SSD"
                  value={newProofAction}
                  onChange={(e) => setNewProofAction(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">Tempo Relativo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: há 3 min"
                    value={newProofTime}
                    onChange={(e) => setNewProofTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow transition whitespace-nowrap cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Tabela de Provas Sociais */}
          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full text-left text-[10px] sm:text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Localização</th>
                  <th className="py-2.5 px-3">Ação Exibida</th>
                  <th className="py-2.5 px-3">Tempo</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {socialProofs.map((sp) => (
                  <tr key={sp.id} className="hover:bg-purple-50/30 transition">
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => handleToggleSocialProof(sp.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          sp.active
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}
                      >
                        {sp.active ? '🟢 Ativa' : '⚪ Pausada'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">{sp.userName}</td>
                    <td className="py-2.5 px-3 text-gray-600">{sp.location}</td>
                    <td className="py-2.5 px-3 text-purple-900 font-medium">{sp.action}</td>
                    <td className="py-2.5 px-3 text-gray-500 font-mono">{sp.timeAgo}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteSocialProof(sp.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Eliminar prova social"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Feedbacks & Ratings */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <MessageSquareHeart className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                <span>Avaliações & Feedbacks dos Clientes</span>
              </h2>
              <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">
                Opiniões, sugestões e notas enviadas diretamente pelos utilizadores na plataforma
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-100 text-amber-900 text-[10px] sm:text-xs font-extrabold px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                {userFeedbacks.length > 0 
                  ? `${(userFeedbacks.reduce((acc, f) => acc + (f.rating || 0), 0) / userFeedbacks.length).toFixed(1)} / 5.0 Média` 
                  : 'Sem avaliações'}
              </span>
              <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-extrabold px-3 py-1 rounded-full border border-blue-300">
                {userFeedbacks.length} Feedbacks
              </span>
            </div>
          </div>

          {userFeedbacks.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <MessageSquareHeart className="w-10 h-10 text-gray-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-gray-700">Ainda não foram submetidos feedbacks</p>
              <p className="text-xs text-gray-500 mt-1">Os feedbacks enviados pelos utilizadores através do botão flutuante aparecerão aqui em tempo real.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Classificação</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Comentário</th>
                    <th className="py-2.5 px-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {userFeedbacks.map((fb) => (
                    <tr key={fb.id || fb._id} className="hover:bg-amber-50/30 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-900">{fb.userName || 'Anónimo'}</div>
                        <div className="text-[10px] text-gray-500">{fb.userEmail}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                (fb.rating || 0) >= s
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                          <span className="font-bold text-gray-700 ml-1 text-xs">{fb.rating}/5</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 capitalize border border-gray-200">
                          {fb.category || 'Sugestão'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-700 max-w-xs break-words">
                        &ldquo;{fb.comment}&rdquo;
                      </td>
                      <td className="py-3 px-3 text-[10px] text-gray-400 whitespace-nowrap">
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('pt-MZ') : 'Recente'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div id="sec-usuarios" className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Usuários Cadastrados</h2>
              <p className="text-[10px] sm:text-sm text-gray-500 mt-1">Gestão de clientes e assinaturas ativas</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center space-x-1.5 sm:space-x-2 bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-200">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                <span className="text-[10px] sm:text-sm font-medium text-gray-700">{users.length} usuários</span>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-[10px] sm:text-sm rounded-lg shadow transition flex items-center space-x-1.5 sm:space-x-2 cursor-pointer"
              >
                <span>+ Novo Cliente</span>
              </button>
            </div>
          </div>

          {/* Search and Status Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pt-3 sm:pt-4 border-t border-gray-100">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente por nome ou e-mail..."
                className="w-full pl-9 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] sm:text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center space-x-1 sm:space-x-1.5 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos ({users.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Ativos ({users.filter(u => getUserStatus(u) === 'active').length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Pendentes ({users.filter(u => getUserStatus(u) === 'pending').length})
              </button>
              <button
                onClick={() => setStatusFilter('suspended')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'suspended'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                Suspensos ({users.filter(u => getUserStatus(u) === 'suspended').length})
              </button>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">Nenhum cliente encontrado</h3>
              <p className="text-[10px] sm:text-sm text-gray-500">Tente ajustar a busca ou o filtro de status</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[600px] sm:min-w-0">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Nome</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Email</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Função</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Serviços</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Vencimento</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Cadastro</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => {
                    const userClientOrders = orders.filter(o => o.clientEmail.toLowerCase() === user.email.toLowerCase() || o.clientName.toLowerCase() === user.name.toLowerCase());
                    const userClientSites = sites.filter(s => (s.userEmail || '').toLowerCase() === user.email.toLowerCase());
                    const isTargetAdmin = auth.isAdminUser(user);
                    const isSuperAdmin = user.email.toLowerCase() === 'admin@wehosthere.com' || user.id === 'admin_root';

                    return (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-gray-900 text-[10px] sm:text-sm">{user.name}</span>
                          {(user.role === 'admin' || user.role === 'super_admin') && (
                            <span className="text-[10px]" title={user.role === 'super_admin' ? 'Super Administrador' : 'Administrador'}>
                              {user.role === 'super_admin' ? '👑' : '🛡️'}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] sm:text-xs text-gray-500 font-mono block sm:hidden">{user.email}</span>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-gray-600 font-mono text-[10px] sm:text-sm hidden sm:table-cell">{user.email}</td>
                      
                      {/* Coluna Função / Role */}
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        {isSuperAdmin && !perms.canManageRoles ? (
                          // Root super admin que não tem canManageRoles — mostrar badge estático
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                            <span>👑 Super Admin</span>
                          </span>
                        ) : perms.canManageRoles ? (() => {
                          // O utilizador atual é Super Admin — pode gerir todos os cargos
                          const isRootTarget = user.email.toLowerCase() === 'admin@wehosthere.com' || user.id === 'admin_root';
                          const isSelf = adminUser?.email?.toLowerCase() === user.email.toLowerCase();
                          const currentRole = user.role || 'user';
                          const isRootSuperAdmin = adminUser?.email?.toLowerCase() === 'admin@wehosthere.com' || adminUser?.id === 'admin_root';

                          // Root admin não pode ser modificado, nem o utilizador pode alterar o próprio cargo
                          if (isRootTarget || isSelf) {
                            return (
                              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-extrabold ${
                                currentRole === 'super_admin' ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : currentRole === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}>
                                <span>{currentRole === 'super_admin' ? '👑 Super Admin' : currentRole === 'admin' ? '🛡️ Admin' : '👤 Utilizador'}</span>
                              </span>
                            );
                          }

                          return (
                            <select
                              value={currentRole}
                              onChange={(e) => {
                                const newRole = e.target.value as 'user' | 'admin' | 'super_admin';
                                const roleLabels: Record<string, string> = {
                                  user: 'Utilizador Comum 👤',
                                  admin: 'Administrador 🛡️',
                                  super_admin: 'Super Administrador 👑'
                                };
                                const roleTitles: Record<string, string> = {
                                  user: 'Rebaixar para Utilizador Comum',
                                  admin: 'Promover a Administrador',
                                  super_admin: '⚠️ Promover a Super Administrador'
                                };
                                const roleMessages: Record<string, string> = {
                                  user: `Tem certeza que deseja remover todos os privilégios administrativos de "${user.name}" (${user.email})? Este utilizador voltará a ser um utilizador comum.`,
                                  admin: `Tem certeza que deseja promover "${user.name}" (${user.email}) a Administrador?\n\nEste utilizador terá acesso operacional ao painel admin (clientes, pedidos, tickets, sites e academia), mas sem acesso a finanças, configurações gerais ou gestão de outros administradores.`,
                                  super_admin: `⚠️ ATENÇÃO: Está prestes a conceder poderes de SUPER ADMINISTRADOR a "${user.name}" (${user.email}).\n\nUm Super Admin tem acesso TOTAL ao sistema, incluindo gestão de outros administradores, finanças, configurações e dados sensíveis.\n\nTem ABSOLUTA CERTEZA que deseja continuar?`
                                };
                                setConfirmModalData({
                                  isOpen: true,
                                  title: roleTitles[newRole] || 'Alterar Cargo',
                                  message: roleMessages[newRole] || '',
                                  variant: newRole === 'super_admin' ? 'danger' : newRole === 'admin' ? 'info' : 'warning',
                                  onConfirm: async () => {
                                    const success = await auth.updateUserRole(user.id, newRole, user.email, adminUser?.email);
                                    if (success) {
                                      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
                                      setToastMsg({
                                        title: 'Cargo Atualizado',
                                        message: `${user.name} agora é ${roleLabels[newRole]}.`,
                                        type: 'success'
                                      });
                                    } else {
                                      setToastMsg({ title: 'Erro', message: 'Falha ao atualizar cargo. Verifique as permissões.', type: 'error' });
                                    }
                                    setConfirmModalData(null);
                                  }
                                });
                              }}
                              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-xs font-bold outline-none border cursor-pointer ${
                                currentRole === 'super_admin'
                                  ? 'bg-purple-50 text-purple-800 border-purple-300 ring-1 ring-purple-400/30'
                                  : currentRole === 'admin'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-1 ring-indigo-400/30'
                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                              }`}
                              title="Alterar cargo do utilizador"
                            >
                              <option value="user">👤 Utilizador</option>
                              <option value="admin">🛡️ Admin</option>
                              {isRootSuperAdmin && (
                                <option value="super_admin">👑 Super Admin</option>
                              )}
                            </select>
                          );
                        })() : (
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-bold ${
                            user.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : user.role === 'admin'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            <span>{user.role === 'super_admin' ? '👑 Super Admin' : user.role === 'admin' ? '🛡️ Admin' : '👤 Utilizador'}</span>
                          </span>
                        )}

                      </td>

                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        <div className="flex flex-col gap-1">
                          <select
                            value={user.plan || 'none'}
                            onChange={(e) => {
                              const newPl = e.target.value as 'none' | 'basic' | 'pro' | 'enterprise';
                              auth.updatePlan(user.id, newPl);
                              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, plan: newPl } : u));
                              fetch(apiEndpoint('/api/users'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  action: 'update_plan',
                                  email: user.email,
                                  plan: newPl,
                                  status: user.status || 'active',
                                  dueDate: user.dueDate || 28
                                })
                              }).catch(() => {});
                              setToastMsg({
                                title: 'Plano Atualizado',
                                message: `Plano de ${user.name} alterado para ${newPl === 'basic' ? 'Básico' : newPl === 'pro' ? 'Profissional' : newPl === 'enterprise' ? 'Empresarial' : 'Nenhum'}.`,
                                type: 'success'
                              });
                            }}
                            className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-[11px] sm:text-xs font-bold rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                            title="Alterar plano de hospedagem"
                          >
                            <option value="none">⚪ Sem Plano</option>
                            <option value="basic">⭐ Plano Básico</option>
                            <option value="pro">🚀 Plano Profissional</option>
                            <option value="enterprise">🏢 Plano Empresarial</option>
                          </select>

                          {userClientOrders.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {userClientOrders.slice(0, 2).map((ord) => (
                                <span key={ord.id} className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                  📦 {ord.serviceName.length > 14 ? ord.serviceName.substring(0, 14) + '...' : ord.serviceName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-gray-600 text-[10px] sm:text-sm font-medium hidden sm:table-cell">
                        {isTargetAdmin ? (
                          <span className="text-gray-400 font-mono text-xs">N/A</span>
                        ) : (
                          <select
                            value={user.dueDate || 29}
                            onChange={(e) => {
                              const newDay = Number(e.target.value);
                              auth.updateUserDueDate(user.id, newDay);
                              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, dueDate: newDay } : u));
                            }}
                            className="bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-gray-800 text-[11px] sm:text-xs font-bold rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                            title="Alterar dia de vencimento mensal"
                          >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                              <option key={day} value={day}>
                                Dia {day}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        <select
                          value={user.status || 'pending'}
                          onChange={(e) => {
                            const newSt = e.target.value as 'active' | 'pending' | 'suspended';
                            auth.updateUserStatus(user.id, newSt);
                            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newSt } : u));
                            setToastMsg({
                              title: 'Status Atualizado',
                              message: `Status de ${user.name} alterado para ${newSt === 'active' ? 'Ativo' : newSt === 'pending' ? 'Pendente' : 'Suspenso'}.`,
                              type: 'success'
                            });
                          }}
                          className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-xs font-bold outline-none border cursor-pointer ${
                            (user.status || 'pending') === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : (user.status || 'pending') === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-red-50 text-red-700 border-red-300'
                          }`}
                          title="Alterar estado do utilizador"
                        >
                          <option value="active">🟢 Ativo (✓)</option>
                          <option value="pending">🟡 Pendente (⏰)</option>
                          <option value="suspended">🔴 Suspenso (✗)</option>
                        </select>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-gray-500 text-[10px] sm:text-sm hidden sm:table-cell">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        <div className="flex items-center space-x-1 sm:space-x-1.5">
                          <button
                            onClick={() => {
                              auth.startClientView(user);
                              router.push('/dashboard');
                            }}
                            className="p-1 sm:p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition cursor-pointer"
                            title={`Visualizar painel exatamente como ${user.name}`}
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setPasswordModalUser(user);
                              setNewPasswordValue('');
                            }}
                            className="p-1 sm:p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-md transition cursor-pointer"
                            title={`Definir ou redefinir senha para ${user.name}`}
                          >
                            <Key className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>

                          {!isTargetAdmin && (
                            <button
                              onClick={() => {
                                const currentSt = user.status || 'active';
                                const newStatus = currentSt === 'suspended' ? 'active' : 'suspended';
                                auth.updateUserStatus(user.id, newStatus);
                                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
                              }}
                              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-xs font-semibold transition ${
                                (user.status || 'active') === 'suspended'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                              }`}
                            >
                              {(user.status || 'active') === 'suspended' ? 'Reativar' : 'Suspender'}
                            </button>
                          )}

                          {!isTargetAdmin && (
                            <button
                              onClick={() => {
                                setConfirmModalData({
                                  isOpen: true,
                                  title: 'Eliminar Utilizador',
                                  message: `Tem certeza que deseja eliminar permanentemente o utilizador "${user.name}" (${user.email})?`,
                                  variant: 'danger',
                                  onConfirm: () => {
                                    auth.deleteUser(user.id, user.email);
                                    setUsers(auth.getUsers());
                                    setConfirmModalData(null);
                                    setToastMsg({ title: 'Utilizador Eliminado', message: `O utilizador ${user.name} foi removido da plataforma.`, type: 'success' });
                                  }
                                });
                              }}
                              className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                              title="Eliminar utilizador"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ===== ACADEMIA — GESTÃO ADMIN ===== */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                <span>Academia Web — Gestão de Cursos</span>
              </h2>
              <p className="text-[10px] sm:text-sm text-gray-500 mt-1">Pagamentos de cursos, alunos inscritos e certificados emitidos</p>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href="/verify-certificate"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold transition"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Portal de Verificação</span>
              </a>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
              <p className="text-xl sm:text-2xl font-extrabold text-indigo-700">
                {orders.filter(o => o.serviceName?.toLowerCase().includes('curso')).length}
              </p>
              <p className="text-[10px] sm:text-xs text-indigo-600 font-semibold mt-0.5">Pagamentos</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-700">{academyEnrollments.length}</p>
              <p className="text-[10px] sm:text-xs text-emerald-600 font-semibold mt-0.5">Inscrições</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
              <p className="text-xl sm:text-2xl font-extrabold text-purple-700">{academyCertificates.length}</p>
              <p className="text-[10px] sm:text-xs text-purple-600 font-semibold mt-0.5">Certificados</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-5">
            {[
              { id: 'orders', label: '💳 Pagamentos' },
              { id: 'enrollments', label: '📋 Inscrições' },
              { id: 'certificates', label: '🏆 Certificados' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAcademyTab(tab.id as any)}
                className={`flex-1 py-2 px-2 text-[11px] sm:text-xs font-semibold rounded-lg transition cursor-pointer ${
                  academyTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Pagamentos de Cursos */}
          {academyTab === 'orders' && (
            <>
              {orders.filter(o => o.serviceName?.toLowerCase().includes('curso')).length === 0 ? (
                <div className="text-center py-10">
                  <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-500">Nenhum pagamento de curso registado</p>
                  <p className="text-xs text-gray-400 mt-1">Os pagamentos de 500 MT aparecerão aqui após o checkout</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aluno</th>
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Curso</th>
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Método</th>
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orders.filter(o => o.serviceName?.toLowerCase().includes('curso')).map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 transition">
                          <td className="py-3 px-2">
                            <p className="font-semibold text-gray-900 text-xs">{order.clientName}</p>
                            <p className="text-[10px] text-gray-400">{order.clientEmail}</p>
                          </td>
                          <td className="py-3 px-2 text-xs text-gray-700 max-w-[180px] truncate">{order.serviceName}</td>
                          <td className="py-3 px-2 text-xs font-bold text-emerald-700">{order.amount?.toLocaleString('pt-MZ')} MT</td>
                          <td className="py-3 px-2 text-xs text-gray-600 capitalize">{order.paymentMethod}</td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status === 'completed' ? '✓ Pago' : order.status === 'pending' ? '⏳ Pendente' : '🔄 Em progresso'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString('pt-MZ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Tab: Inscrições */}
          {academyTab === 'enrollments' && (
            <>
              {academyEnrollments.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-500">Nenhuma inscrição registada</p>
                  <p className="text-xs text-gray-400 mt-1">As inscrições de alunos aparecerão aqui automaticamente</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aluno</th>
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Curso</th>
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Progresso</th>
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {academyEnrollments.map((enr: any, i: number) => (
                        <tr key={enr.id || i} className="hover:bg-gray-50 transition">
                          <td className="py-3 px-2">
                            <p className="font-semibold text-gray-900 text-xs">{enr.userName || enr.userEmail}</p>
                            <p className="text-[10px] text-gray-400">{enr.userEmail}</p>
                          </td>
                          <td className="py-3 px-2 text-xs text-gray-700">{enr.courseTitle || enr.courseId}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${enr.progress || 0}%` }} />
                              </div>
                              <span className="text-[10px] text-gray-500 font-semibold">{enr.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-[10px] text-gray-400">{new Date(enr.enrolledAt || enr.createdAt).toLocaleDateString('pt-MZ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Tab: Certificados */}
          {academyTab === 'certificates' && (
            <>
              {academyCertificates.length === 0 ? (
                <div className="text-center py-10">
                  <ShieldCheck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-500">Nenhum certificado emitido</p>
                  <p className="text-xs text-gray-400 mt-1">Os certificados emitidos após conclusão do curso aparecerão aqui</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aluno</th>
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Curso</th>
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {academyCertificates.map((cert: any, i: number) => (
                        <tr key={cert.id || i} className="hover:bg-gray-50 transition">
                          <td className="py-3 px-2 font-mono text-[10px] text-purple-700 font-bold">{cert.certificateNumber}</td>
                          <td className="py-3 px-2">
                            <p className="font-semibold text-gray-900 text-xs">{cert.userName || cert.userEmail}</p>
                            <p className="text-[10px] text-gray-400">{cert.userEmail}</p>
                          </td>
                          <td className="py-3 px-2 text-xs text-gray-700">{cert.courseTitle}</td>
                          <td className="py-3 px-2 text-[10px] text-gray-400">{new Date(cert.completionDate || cert.createdAt).toLocaleDateString('pt-MZ')}</td>
                          <td className="py-3 px-2">
                            <a
                              href={`/verify-certificate?code=${cert.certificateNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-[10px] text-indigo-600 hover:underline font-semibold"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Verificar</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Gestão de Pedidos de Serviços */}
        <div id="sec-pedidos" className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                <span>Gestão de Pedidos & Serviços</span>
              </h2>
              <p className="text-[10px] sm:text-sm text-gray-500 mt-1">Acompanhamento de solicitações de hospedagem e criação de sites</p>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2 bg-primary-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-primary-200 text-primary-700 font-semibold text-[10px] sm:text-xs">
              <span>{orders.length} pedidos totais</span>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">Nenhum pedido de serviço recebido</h3>
              <p className="text-[10px] sm:text-sm text-gray-500">Os pedidos efetuados no checkout aparecerão aqui</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[600px] sm:min-w-0">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">ID / Data</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Cliente</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Serviço</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Valor / Método</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        <span className="font-mono font-bold text-gray-900 text-[10px] sm:text-sm block">{order.id}</span>
                        <span className="text-[9px] sm:text-xs text-gray-500 block">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span className="text-[9px] sm:text-xs text-gray-400 font-mono block sm:hidden">{order.clientName}</span>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-gray-600 text-[10px] sm:text-sm hidden sm:table-cell">
                        <div>
                          <span className="font-semibold text-gray-900 block">{order.clientName}</span>
                          <span className="text-gray-500 text-xs block">{order.clientEmail}</span>
                        </div>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        <span className="font-semibold text-gray-900 text-[10px] sm:text-sm block">{order.serviceName}</span>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        <span className="font-bold text-gray-900 text-[10px] sm:text-sm block">{getOrderAmount(order).toLocaleString('pt-MZ')} MT</span>
                        <span className="text-[9px] sm:text-xs text-gray-500 block uppercase font-mono">{order.paymentMethod || 'mpesa'}</span>
                        {order.proofUrl && (
                          <a
                            href={order.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[9px] sm:text-[10px] font-semibold transition cursor-pointer"
                            title="Ver / Baixar Comprovativo Bancário"
                          >
                            <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600" />
                            <span>Comprovativo</span>
                            <ExternalLink className="h-2 w-2 text-blue-400" />
                          </a>
                        )}
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                          className={`text-[9px] sm:text-xs font-bold rounded-lg px-2 py-1 border transition cursor-pointer ${
                            order.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            order.status === 'in_progress' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                            order.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                            order.status === 'cancelled' ? 'bg-red-50 text-red-800 border-red-300' :
                            'bg-gray-50 text-gray-800 border-gray-300'
                          }`}
                        >
                          <option value="pending">⏰ Pendente</option>
                          <option value="in_progress">⚙️ Em Progresso</option>
                          <option value="completed">✓ Concluído</option>
                          <option value="cancelled">✗ Cancelado</option>
                        </select>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        <div className="flex items-center gap-1.5">
                          {order.status !== 'completed' ? (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] sm:text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
                              title="Aprovar pedido e ativar plano imediatamente"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Aprovar</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle className="h-3 w-3 text-emerald-600" />
                              <span>Ativo</span>
                            </span>
                          )}
                          {order.proofUrl && (
                            <a
                              href={order.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 sm:p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition cursor-pointer"
                              title="Abrir Comprovativo em nova aba"
                            >
                              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleAdminDeleteOrder(order.id)}
                            className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                            title="Eliminar pedido"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gestão e Aprovação de Contas de E-mail Corporativo */}
        <div id="sec-emails-aprovacao" className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                <span>Gestão de E-mails Corporativos</span>
              </h2>
              <p className="text-[10px] sm:text-sm text-gray-500 mt-1">Aprove ou suspenda solicitações de caixas de e-mail corporativo</p>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="bg-amber-100 text-amber-800 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-amber-300">
                {emails.filter(e => e.status === 'pending' || !e.status).length} Pendente(s)
              </span>
              <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-blue-300">
                {emails.length} Totais
              </span>
            </div>
          </div>

          {emails.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Mail className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">Nenhuma conta de email criada</h3>
              <p className="text-[10px] sm:text-sm text-gray-500">As contas criadas pelos clientes no painel aparecerão aqui para aprovação</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[600px] sm:min-w-0">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">E-mail</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Cliente</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Armazenamento</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Data</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {emails.map((emailAcc) => {
                    const isPending = emailAcc.status === 'pending' || !emailAcc.status;
                    return (
                      <tr key={emailAcc.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                          <span className="font-mono font-bold text-gray-900 text-[10px] sm:text-sm block">{emailAcc.email}</span>
                          <span className="text-[9px] sm:text-xs text-primary-600 font-semibold block sm:hidden">{emailAcc.userEmail || 'Cliente'}</span>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[10px] sm:text-sm hidden sm:table-cell">
                          <span className="font-semibold text-gray-900 block">{emailAcc.userEmail || 'Cliente Plataforma'}</span>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                          <span className="font-bold text-gray-700 text-[10px] sm:text-xs">Partilhado</span>
                          <div className="text-[9px] text-gray-400">Pool Migadu</div>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[10px] sm:text-xs text-gray-500 hidden sm:table-cell">
                          {emailAcc.createdAt ? new Date(emailAcc.createdAt).toLocaleDateString('pt-BR') : 'Hoje'}
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                          <span className={`inline-block px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold ${
                            emailAcc.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : emailAcc.status === 'suspended'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}>
                            {emailAcc.status === 'active' ? '✓ Ativo' : emailAcc.status === 'suspended' ? '🛑 Suspenso' : '⏰ Pendente'}
                          </span>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            {isPending && (
                              <button
                                onClick={() => {
                                  dataManager.updateEmailStatus(emailAcc.id, 'active');
                                  setEmails(prev => prev.map(e => e.id === emailAcc.id ? { ...e, status: 'active' } : e));
                                  setToastMsg({ title: 'E-mail Aprovado', message: `A conta ${emailAcc.email} foi ativada com sucesso.`, type: 'success' });
                                }}
                                className="px-1.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] sm:text-xs font-bold rounded-lg shadow-2xs transition flex items-center space-x-1 sm:space-x-1.5 cursor-pointer"
                                title="Aprovar e Ativar Conta de Email"
                              >
                                <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span className="hidden sm:inline">Aprovar</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                dataManager.deleteEmail(emailAcc.id, emailAcc.userEmail, emailAcc.email);
                                setEmails(prev => prev.filter(e => e.id !== emailAcc.id));
                                setToastMsg({ title: 'E-mail Removido', message: `A conta ${emailAcc.email} foi removida.`, type: 'info' });
                              }}
                              className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Eliminar Conta de E-mail"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gestão de Tickets de Suporte (Helpdesk) */}
        <div id="sec-tickets" className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <LifeBuoy className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                <span>Central de Tickets de Suporte</span>
              </h2>
              <p className="text-[10px] sm:text-sm text-gray-500 mt-1">Atendimento ao cliente e chamados técnicos</p>
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="bg-amber-100 text-amber-800 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-amber-300">
                {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length} Pendente(s)
              </span>
              <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-blue-300">
                {tickets.length} Totais
              </span>
            </div>
          </div>

          {/* Filtros e Busca de Tickets */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pt-3 sm:pt-4 border-t border-gray-100">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
              <input
                type="text"
                value={ticketSearchTerm}
                onChange={(e) => setTicketSearchTerm(e.target.value)}
                placeholder="Buscar ticket..."
                className="w-full pl-9 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] sm:text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center space-x-1 sm:space-x-1.5 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setTicketFilterStatus('all')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition cursor-pointer ${
                  ticketFilterStatus === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos ({tickets.length})
              </button>
              <button
                onClick={() => setTicketFilterStatus('open')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition cursor-pointer ${
                  ticketFilterStatus === 'open' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Abertos ({tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length})
              </button>
              <button
                onClick={() => setTicketFilterStatus('answered')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition cursor-pointer ${
                  ticketFilterStatus === 'answered' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Respondidos ({tickets.filter(t => t.status === 'answered').length})
              </button>
              <button
                onClick={() => setTicketFilterStatus('closed')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition cursor-pointer ${
                  ticketFilterStatus === 'closed' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Fechados ({tickets.filter(t => t.status === 'closed').length})
              </button>
            </div>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <LifeBuoy className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">Nenhum ticket registrado</h3>
              <p className="text-[10px] sm:text-sm text-gray-500">Os chamados abertos pelos clientes aparecerão aqui</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[600px] sm:min-w-0">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">ID / Data</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Cliente</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Assunto</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Prioridade</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets
                    .filter(t => {
                      const matchesSearch = 
                        t.subject.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
                        t.userName.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
                        t.userEmail.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
                        t.id.toLowerCase().includes(ticketSearchTerm.toLowerCase());
                      if (ticketFilterStatus === 'open') return matchesSearch && (t.status === 'open' || t.status === 'in_progress');
                      if (ticketFilterStatus === 'answered') return matchesSearch && t.status === 'answered';
                      if (ticketFilterStatus === 'closed') return matchesSearch && t.status === 'closed';
                      return matchesSearch;
                    })
                    .map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                          <span className="font-mono font-bold text-gray-900 text-[10px] sm:text-sm block">{ticket.id}</span>
                          <span className="text-[9px] sm:text-xs text-gray-400 block">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('pt-MZ') : 'N/A'}</span>
                          <span className="text-[9px] sm:text-xs text-gray-500 font-mono block sm:hidden">{ticket.userName}</span>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[10px] sm:text-sm hidden sm:table-cell">
                          <span className="font-semibold text-gray-900 block">{ticket.userName}</span>
                          <span className="text-gray-500 text-xs block">{ticket.userEmail}</span>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                          <span className="font-bold text-gray-900 text-[10px] sm:text-sm block">{ticket.subject.length > 25 ? ticket.subject.substring(0, 25) + '...' : ticket.subject}</span>
                          <span className="text-[9px] sm:text-[11px] font-semibold text-gray-500 uppercase">{ticket.category}</span>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 hidden sm:table-cell">
                          <span className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-xs font-bold ${
                            ticket.priority === 'urgent' ? 'bg-red-100 text-red-700 border border-red-300' :
                            ticket.priority === 'high' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                            ticket.priority === 'medium' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                            'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}>
                            {ticket.priority === 'urgent' ? '🔥 Urgente' : ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                          <span className={`inline-block px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold ${
                            ticket.status === 'answered' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                            ticket.status === 'in_progress' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                            ticket.status === 'open' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {ticket.status === 'answered' ? '✓ Respondido' : ticket.status === 'in_progress' ? '⚙️ Em Análise' : ticket.status === 'open' ? '⏰ Aberto' : '🛑 Fechado'}
                          </span>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="px-1.5 sm:px-3 py-1 sm:py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-[9px] sm:text-xs rounded-lg shadow transition flex items-center space-x-1 sm:space-x-1.5 cursor-pointer"
                          >
                            <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            <span className="hidden sm:inline">Atender</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gestão de Domínios e Sites */}
        <div id="sec-dominios" className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Gestão de Domínios e Sites</h2>
              <p className="text-[10px] sm:text-sm text-gray-500">Aprove registros e gerencie o status dos domínios</p>
            </div>
            <span className="bg-amber-100 text-amber-800 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-amber-300">
              {sites.filter(s => s.status === 'pending').length} Pendente(s)
            </span>
          </div>

          {/* Banner de Name Servers para cópia pelo Admin */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-2.5 sm:p-3.5 mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-[10px] sm:text-xs">
            <div>
              <span className="font-bold text-blue-900 block">🌐 Name Servers WEHOSTHERE:</span>
              <span className="text-blue-700">Use ao registrar domínios:</span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2 font-mono font-bold text-blue-900 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-blue-200 text-[9px] sm:text-xs">
              <span>ns1.wehosthere.com</span>
              <span className="text-gray-300">|</span>
              <span>ns2.wehosthere.com</span>
            </div>
          </div>

          {sites.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500 text-[10px] sm:text-sm">
              Nenhum domínio ou site cadastrado.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[600px] sm:min-w-0">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Domínio</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Data</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sites.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        <span className="font-bold text-gray-900 text-[10px] sm:text-sm block">{site.domain}</span>
                        <span className="text-[9px] sm:text-xs text-gray-500 block">{site.name}</span>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        <span className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold border ${
                          site.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          site.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          'bg-red-50 text-red-800 border-red-300'
                        }`}>
                          <span>{site.status === 'active' ? '🟢 Ativo' : site.status === 'pending' ? '🟡 Pendente' : '🔴 Suspenso'}</span>
                        </span>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[10px] sm:text-xs text-gray-500 font-mono hidden sm:table-cell">
                        {site.createdAt ? new Date(site.createdAt).toLocaleDateString('pt-MZ') : 'N/A'}
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          {site.status === 'pending' ? (
                            <button
                              onClick={() => {
                                dataManager.updateSiteStatus(site.id, 'active');
                                setSites(prev => prev.map(s => s.id === site.id ? { ...s, status: 'active' } : s));
                                setToastMsg({ title: 'Domínio Ativado', message: `O domínio ${site.domain} foi ativado com sucesso.`, type: 'success' });
                              }}
                              className="px-1.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] sm:text-xs rounded-lg shadow transition flex items-center space-x-1 sm:space-x-1.5 cursor-pointer"
                            >
                              <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span className="hidden sm:inline">Ativar</span>
                            </button>
                          ) : (
                            <span className={`inline-block px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold ${
                              site.status === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              {site.status === 'active' ? '🟢 Ativo' : '🔴 Suspenso'}
                            </span>
                          )}
                          <button
                            onClick={() => handleAdminDeleteSite(site.id, site.domain)}
                            title="Eliminar Domínio"
                            className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gestão Global de Contas de E-mail Corporativo */}
        <div id="sec-emails-global" className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                <span>Gestão Global de E-mails</span>
              </h2>
              <p className="text-[10px] sm:text-sm text-gray-500">Visualize e gerencie contas de e-mail corporativo</p>
            </div>
            <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-blue-300">
              {emails.length} Conta(s)
            </span>
          </div>

          {emails.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500 text-[10px] sm:text-sm">
              Nenhuma conta de e-mail cadastrada.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[600px] sm:min-w-0">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">E-mail</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Cliente</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {emails.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-mono font-bold text-gray-900 text-[10px] sm:text-sm">
                        {item.email}
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[10px] sm:text-xs text-gray-600 hidden sm:table-cell">
                        {item.userEmail || 'Desconhecido'}
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        <span className={`inline-flex items-center space-x-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold border ${
                          item.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          <span>{item.status === 'active' ? '🟢 Ativo' : '🟡 Pendente'}</span>
                        </span>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <button
                            onClick={() => {
                              const newStatus = item.status === 'active' ? 'pending' : 'active';
                              dataManager.updateEmailStatus(item.id, newStatus);
                              setEmails(prev => prev.map(e => e.id === item.id ? { ...e, status: newStatus } : e));
                              setToastMsg({ title: 'Status Atualizado', message: `A conta ${item.email} está agora ${newStatus === 'active' ? 'ativa' : 'pendente'}.`, type: 'info' });
                            }}
                            className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-xs font-semibold transition cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                          >
                            {item.status === 'active' ? 'Suspender' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleAdminDeleteEmail(item.id, item.userEmail, item.email)}
                            title="Eliminar Conta de E-mail"
                            className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div id="sec-auditoria" className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8 scroll-mt-28">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Atividade Recente</h2>
          <div className="space-y-3 sm:space-y-4">
            {users.length > 0 && (
              <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 border border-gray-100 rounded-lg">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-[10px] sm:text-sm">Novo usuário cadastrado</p>
                  <p className="text-[9px] sm:text-sm text-gray-600 truncate">{users[users.length - 1].name} ({users[users.length - 1].email})</p>
                </div>
                <span className="text-[9px] sm:text-xs font-medium text-gray-400">Agora</span>
              </div>
            )}
            {sites.length > 0 && (
              <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 border border-gray-100 rounded-lg">
                <Server className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-[10px] sm:text-sm">Novo site adicionado</p>
                  <p className="text-[9px] sm:text-sm text-gray-600 truncate">{sites[sites.length - 1].name}</p>
                </div>
                <span className="text-[9px] sm:text-xs font-medium text-gray-400">Recentemente</span>
              </div>
            )}
            {emails.length > 0 && (
              <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 border border-gray-100 rounded-lg">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-[10px] sm:text-sm">Nova conta de email criada</p>
                  <p className="text-[9px] sm:text-sm text-gray-600 truncate">{emails[emails.length - 1].email}</p>
                </div>
                <span className="text-[9px] sm:text-xs font-medium text-gray-400">Recentemente</span>
              </div>
            )}
            {users.length === 0 && sites.length === 0 && emails.length === 0 && (
              <div className="text-center py-6 sm:py-8">
                <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                <p className="text-gray-500 font-medium text-[10px] sm:text-sm">Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </div>

        {/* Plan Distribution */}
        <div id="sec-distribuicao" className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 scroll-mt-28">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-3 sm:mb-4">Distribuição de Planos</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] sm:text-sm font-medium text-gray-600">Básico (Ativo)</span>
                  <span className="text-[10px] sm:text-sm font-bold text-gray-900">
                    {clientUsers.filter(u => u.plan === 'basic' && u.status === 'active').length}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-gray-400 h-1.5 sm:h-2 rounded-full"
                    style={{
                      width: clientUsers.length > 0
                        ? `${(clientUsers.filter(u => u.plan === 'basic' && u.status === 'active').length / clientUsers.length) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] sm:text-sm font-medium text-gray-600">Profissional (Ativo)</span>
                  <span className="text-[10px] sm:text-sm font-bold text-gray-900">
                    {clientUsers.filter(u => u.plan === 'pro' && u.status === 'active').length}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-blue-600 h-1.5 sm:h-2 rounded-full"
                    style={{
                      width: clientUsers.length > 0
                        ? `${(clientUsers.filter(u => u.plan === 'pro' && u.status === 'active').length / clientUsers.length) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] sm:text-sm font-medium text-gray-600">Enterprise (Ativo)</span>
                  <span className="text-[10px] sm:text-sm font-bold text-gray-900">
                    {clientUsers.filter(u => u.plan === 'enterprise' && u.status === 'active').length}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-emerald-600 h-1.5 sm:h-2 rounded-full"
                    style={{
                      width: clientUsers.length > 0
                        ? `${(clientUsers.filter(u => u.plan === 'enterprise' && u.status === 'active').length / clientUsers.length) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-3 sm:mb-4">Status de Usuários</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] sm:text-sm font-medium text-gray-600">Ativos</span>
                  <span className="text-[10px] sm:text-sm font-bold text-emerald-600">
                    {clientUsers.filter(u => u.status === 'active').length}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-emerald-500 h-1.5 sm:h-2 rounded-full"
                    style={{
                      width: clientUsers.length > 0
                        ? `${(clientUsers.filter(u => u.status === 'active').length / clientUsers.length) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] sm:text-sm font-medium text-gray-600">Pendentes</span>
                  <span className="text-[10px] sm:text-sm font-bold text-amber-600">
                    {clientUsers.filter(u => u.status === 'pending').length}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-amber-500 h-1.5 sm:h-2 rounded-full"
                    style={{
                      width: clientUsers.length > 0
                        ? `${(clientUsers.filter(u => u.status === 'pending').length / clientUsers.length) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] sm:text-sm font-medium text-gray-600">Suspensos</span>
                  <span className="text-[10px] sm:text-sm font-bold text-red-600">
                    {clientUsers.filter(u => u.status === 'suspended').length}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-red-500 h-1.5 sm:h-2 rounded-full"
                    style={{
                      width: clientUsers.length > 0
                        ? `${(clientUsers.filter(u => u.status === 'suspended').length / clientUsers.length) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-3 sm:mb-4">Recursos da Plataforma</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-sm font-medium text-gray-600">Total de Usuários</span>
                <span className="text-[10px] sm:text-sm font-bold text-gray-900">{users.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-sm font-medium text-gray-600">Sites Ativos</span>
                <span className="text-[10px] sm:text-sm font-bold text-gray-900">{sites.filter(s => s.status === 'active').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-sm font-medium text-gray-600">Contas de E-mail</span>
                <span className="text-[10px] sm:text-sm font-bold text-gray-900">{emails.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-sm font-medium text-gray-600">Pedidos de Serviço</span>
                <span className="text-[10px] sm:text-sm font-bold text-gray-900">{orders.length}</span>
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* Modal Novo Cliente */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <UserPlus className="h-6 w-6 text-primary-600" />
              <span>Adicionar Novo Cliente</span>
            </h2>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: João Manuel"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Ex: info@msservices.co.mz"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Senha Inicial</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Plano</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="basic">Básico (550 MT/mês)</option>
                    <option value="pro">Profissional (2.500 MT/mês)</option>
                    <option value="enterprise">Empresarial (6.200 MT/mês)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dia de Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status Inicial</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">Ativo (✓)</option>
                  <option value="pending">Pendente (⏰)</option>
                  <option value="suspended">Suspenso (✗)</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow transition"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Thread de Atendimento do Ticket no Admin */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header da Conversa */}
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 rounded-t-3xl">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-gray-500">{selectedTicket.id}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Cliente: {selectedTicket.userName} ({selectedTicket.userEmail})
                  </span>
                </div>
                <h2 className="text-xl font-black text-gray-900">{selectedTicket.subject}</h2>
              </div>

              <div className="flex items-center space-x-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Alterar Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleAdminUpdateTicketStatus(selectedTicket.id, e.target.value as any)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 bg-white outline-none cursor-pointer"
                  >
                    <option value="open">Aberto (⏰)</option>
                    <option value="in_progress">Em Análise (⚙️)</option>
                    <option value="answered">Respondido (✓)</option>
                    <option value="closed">Fechado (🛑)</option>
                  </select>
                </div>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Corpo das Mensagens */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/30">
              {selectedTicket.messages.map((msg) => {
                const isClient = msg.sender === 'client';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-gray-700">
                        {isClient ? msg.senderName : (
                          <span className="flex items-center space-x-1 text-primary-700 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />
                            <span>{msg.senderName} (Suporte)</span>
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(msg.timestamp).toLocaleDateString('pt-PT')} às {new Date(msg.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        !isClient
                          ? 'bg-primary-600 text-white rounded-br-none shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.message}

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-gray-100/30 pt-2">
                          {msg.attachments.map((att, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              {att.type === 'image' ? (
                                <div className="group relative rounded-xl overflow-hidden border border-gray-200 bg-black/5 mt-1">
                                  <img src={att.url} alt={att.name} className="max-h-48 max-w-full rounded-xl object-cover" />
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 backdrop-blur-sm transition"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Ver Imagem</span>
                                  </a>
                                </div>
                              ) : (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={att.name}
                                  className={`inline-flex items-center space-x-2.5 p-3 rounded-xl border text-xs font-bold transition ${
                                    !isClient
                                      ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                                      : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200'
                                  }`}
                                >
                                  <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                                  <span className="truncate max-w-[200px]">{att.name}</span>
                                  <Download className="w-3.5 h-3.5 opacity-70" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formulário de Resposta pelo Admin */}
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-white rounded-b-3xl">
              <form onSubmit={handleAdminSendReply} className="flex flex-col gap-3">
                {/* Respostas Rápidas / Canned Responses */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-primary-600" />
                    <span>Respostas Rápidas do Atendimento</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ADMIN_CANNED_RESPONSES.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAdminReplyMessage(item.text);
                          if (selectedTicket) {
                            handleAdminUpdateTicketStatus(selectedTicket.id, item.suggestedStatus);
                          }
                        }}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-primary-50 hover:text-primary-800 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {adminReplyAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {adminReplyAttachments.map((att, idx) => (
                      <div key={idx} className="flex items-center space-x-1.5 bg-primary-50 text-primary-900 border border-primary-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
                        {att.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-primary-600" /> : <FileText className="w-3.5 h-3.5 text-red-500" />}
                        <span className="truncate max-w-[150px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setAdminReplyAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="p-0.5 text-gray-400 hover:text-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  rows={3}
                  placeholder="Escreva a resposta oficial do suporte para o cliente..."
                  value={adminReplyMessage}
                  onChange={(e) => setAdminReplyMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                ></textarea>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer inline-flex items-center space-x-2 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition border border-gray-200">
                      {adminUploading ? <Loader2 className="w-4 h-4 animate-spin text-primary-600" /> : <Paperclip className="w-4 h-4" />}
                      <span>Anexar Imagem/PDF</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={handleAdminFileUpload}
                        disabled={adminUploading}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!adminReplyMessage.trim() && adminReplyAttachments.length === 0}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow transition flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Resposta ao Cliente</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirm Modal */}
      {confirmModalData && (
        <ConfirmModal
          isOpen={confirmModalData.isOpen}
          title={confirmModalData.title}
          message={confirmModalData.message}
          confirmText="Sim, Confirmar"
          cancelText="Cancelar"
          variant={confirmModalData.variant || 'danger'}
          onConfirm={confirmModalData.onConfirm}
          onCancel={() => setConfirmModalData(null)}
        />
      )}

      {/* Modal Definir Senha de Utilizador */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Definir Senha de Acesso</h3>
                  <p className="text-xs text-gray-500 font-medium">{passwordModalUser.name} ({passwordModalUser.email})</p>
                </div>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nova Senha para o Utilizador
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="Introduza a nova senha (mínimo 6 caracteres)"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
                      let generated = '';
                      for (let i = 0; i < 12; i++) {
                        generated += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      setNewPasswordValue(generated);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer flex items-center space-x-1"
                  >
                    <span>⚡ Gerar senha aleatória segura</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-900 leading-relaxed">
                💡 Esta ação altera a senha diretamente no banco de dados e permite que <strong>{passwordModalUser.name}</strong> faça login imediatamente com este email e a nova senha definida.
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={newPasswordValue.length < 6 || savingPassword}
                  onClick={async () => {
                    setSavingPassword(true);
                    const success = await auth.adminSetUserPassword(passwordModalUser.id, passwordModalUser.email, newPasswordValue);
                    setSavingPassword(false);
                    if (success) {
                      setToastMsg({
                        type: 'success',
                        title: 'Senha Atualizada',
                        message: `Nova senha configurada com sucesso para ${passwordModalUser.email}.`
                      });
                      setPasswordModalUser(null);
                    } else {
                      setToastMsg({
                        type: 'error',
                        title: 'Erro ao Definir Senha',
                        message: 'Não foi possível atualizar a senha no servidor. Tente novamente.'
                      });
                    }
                  }}
                  className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A guardar...</span>
                    </>
                  ) : (
                    <span>Guardar Nova Senha</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

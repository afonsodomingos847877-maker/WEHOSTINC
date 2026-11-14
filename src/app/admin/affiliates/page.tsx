'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { 
  Users, DollarSign, TrendingUp, Plus, Edit, Trash2, 
  CheckCircle2, XCircle, Clock, Filter, RefreshCw,
  Image as ImageIcon, FileText, Video, Mail, Share2, Wallet,
  AlertTriangle, CheckCircle, X, ArrowLeft, Eye, ShoppingCart,
  Shield, Activity, Database, AlertCircle
} from 'lucide-react';

interface Affiliate {
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
  userName: string;
  userEmail: string;
  totalCommissions: number;
  pendingCommissions: number;
  createdAt: string;
}

interface Commission {
  _id: string;
  affiliateId: string;
  affiliateCode: string;
  orderId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  serviceType: string;
  referredCustomerEmail: string;
  referredCustomerName?: string;
  createdAt: string;
}

interface MarketingMaterial {
  _id: string;
  title: string;
  description: string;
  type: 'banner' | 'social_media' | 'email_template' | 'landing_page' | 'video' | 'text_ad';
  content: string;
  imageUrl?: string;
  platform?: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminAffiliatesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'affiliates' | 'commissions' | 'materials' | 'payouts' | 'migration' | 'reports' | 'consistency'>('affiliates');
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [materials, setMaterials] = useState<MarketingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MarketingMaterial | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [payouts, setPayouts] = useState<any[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);

  // Consistency monitoring states
  const [consistencyReport, setConsistencyReport] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [autoValidate, setAutoValidate] = useState(false);

  // Migration states
  const [migrateLoading, setMigrateLoading] = useState(false);
  const [migrateResult, setMigrateResult] = useState<any>(null);
  const [migrateError, setMigrateError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  // Reports states
  const [reportsData, setReportsData] = useState<any>(null);
  const [reportsPeriod, setReportsPeriod] = useState('30');

  // Adicionar / Promover Afiliado diretamente pelo Admin
  const [showAddAffiliateModal, setShowAddAffiliateModal] = useState(false);
  const [addAffiliateEmail, setAddAffiliateEmail] = useState('');
  const [addAffiliateCode, setAddAffiliateCode] = useState('');
  const [addAffiliatePhone, setAddAffiliatePhone] = useState('');
  const [addAffiliateSendEmail, setAddAffiliateSendEmail] = useState(true);
  const [addingAffiliate, setAddingAffiliate] = useState(false);
  const [addAffiliateError, setAddAffiliateError] = useState('');
  const [addAffiliateSuccess, setAddAffiliateSuccess] = useState('');
  const [platformUsers, setPlatformUsers] = useState<Array<{ id: string; name: string; email: string; phone?: string; isAffiliate: boolean; affiliateStatus?: string | null }>>([]);
  const [loadingPlatformUsers, setLoadingPlatformUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [commissionSettings, setCommissionSettings] = useState({
    defaultCommissionRate: 30,
    minPayoutAmount: 1000,
    allowBalanceCredit: true,
    eligibleServices: ['hosting', 'domain', 'email', 'site', 'systems', 'academy', 'vps', 'loja-online'],
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/affiliates/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.success && d.settings) {
          setCommissionSettings({
            defaultCommissionRate: d.settings.defaultCommissionRate ?? 30,
            minPayoutAmount: d.settings.minPayoutAmount ?? 1000,
            allowBalanceCredit: d.settings.allowBalanceCredit ?? true,
            eligibleServices: d.settings.eligibleServices || ['hosting', 'domain', 'email', 'site', 'systems', 'academy', 'vps', 'loja-online'],
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveCommissionSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSavedMsg('');
    try {
      const res = await fetch('/api/admin/affiliates/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commissionSettings),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSavedMsg('Configurações guardadas com sucesso!');
        setTimeout(() => setSettingsSavedMsg(''), 3000);
      } else {
        alert(data.error || 'Erro ao guardar configurações.');
      }
    } catch {
      alert('Erro ao ligar ao servidor.');
    } finally {
      setSavingSettings(false);
    }
  };

  const openAddAffiliateModal = async () => {
    setAddAffiliateError('');
    setAddAffiliateSuccess('');
    setUserSearchQuery('');
    setShowAddAffiliateModal(true);
    try {
      setLoadingPlatformUsers(true);
      const res = await fetch('/api/admin/affiliates/create');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setPlatformUsers(data.users);
      }
    } catch (err) {
      console.error('Erro ao carregar utilizadores:', err);
    } finally {
      setLoadingPlatformUsers(false);
    }
  };

  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    type: 'banner' as 'banner' | 'social_media' | 'email_template' | 'landing_page' | 'video' | 'text_ad',
    content: '',
    imageUrl: '',
    platform: '',
    category: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'affiliates') {
        const res = await fetch(`/api/admin/affiliates/list?status=${filterStatus}`);
        const data = await res.json();
        if (data.success) setAffiliates(data.affiliates);
      } else if (activeTab === 'commissions') {
        const res = await fetch(`/api/admin/affiliates/commissions?status=${filterStatus}`);
        const data = await res.json();
        if (data.success) setCommissions(data.commissions);
      } else if (activeTab === 'materials') {
        const res = await fetch('/api/admin/affiliates/materials');
        const data = await res.json();
        if (data.success) setMaterials(data.materials);
      } else if (activeTab === 'payouts') {
        const res = await fetch(`/api/admin/affiliates/payouts?status=${filterStatus}`);
        const data = await res.json();
        if (data.success) setPayouts(data.affiliates);
      } else if (activeTab === 'reports') {
        const res = await fetch(`/api/admin/affiliates/reports?period=${reportsPeriod}`);
        const data = await res.json();
        if (data.success) setReportsData(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAffiliateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao atualizar afiliado:', error);
    }
  };

  const handleCreateAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAffiliate(true);
    setAddAffiliateError('');
    setAddAffiliateSuccess('');

    try {
      const res = await fetch('/api/admin/affiliates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: addAffiliateEmail.trim(),
          customCode: addAffiliateCode.trim() || undefined,
          phone: addAffiliatePhone.trim() || undefined,
          sendWelcomeEmail: addAffiliateSendEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAddAffiliateError(data.error || 'Erro ao adicionar afiliado.');
        return;
      }

      setAddAffiliateSuccess(data.message || 'Afiliado configurado com sucesso!');
      setAddAffiliateEmail('');
      setAddAffiliateCode('');
      setAddAffiliatePhone('');
      fetchData();

      setTimeout(() => {
        setShowAddAffiliateModal(false);
        setAddAffiliateSuccess('');
      }, 1500);
    } catch (error) {
      console.error('Erro ao criar afiliado:', error);
      setAddAffiliateError('Erro de ligação ao servidor.');
    } finally {
      setAddingAffiliate(false);
    }
  };

  const handleUpdateCommissionStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/admin/affiliates/commissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionId: id, status }),
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        alert('Erro ao atualizar comissão: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao atualizar comissão');
      console.error(error);
    }
  };

  const handleProcessPayout = async (affiliateId: string, payoutStatus: string, payoutNotes?: string) => {
    try {
      const response = await fetch('/api/admin/affiliates/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          affiliateId, 
          payoutStatus, 
          payoutNotes: payoutNotes || '' 
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        alert('Erro ao processar saque: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao processar saque');
      console.error(error);
    }
  };

  const handleSaveMaterial = async () => {
    try {
      const adminId = localStorage.getItem('userId');
      console.log('handleSaveMaterial - adminId:', adminId);
      console.log('handleSaveMaterial - materialForm:', materialForm);
      
      const url = editingMaterial 
        ? `/api/admin/affiliates/materials/${editingMaterial._id}`
        : '/api/admin/affiliates/materials';
      
      const method = editingMaterial ? 'PATCH' : 'POST';
      
      const payload = {
        ...materialForm,
        createdBy: adminId,
      };
      
      console.log('handleSaveMaterial - Payload:', payload);
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      console.log('handleSaveMaterial - Response:', data);
      
      if (res.ok) {
        setShowMaterialModal(false);
        setEditingMaterial(null);
        setMaterialForm({
          title: '',
          description: '',
          type: 'banner',
          content: '',
          imageUrl: '',
          platform: '',
          category: '',
        });
        setUploadedImageUrl('');
        fetchData();
      } else {
        alert('Erro ao salvar material: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      alert('Erro ao salvar material');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este material?')) return;
    
    try {
      const res = await fetch(`/api/admin/affiliates/materials/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchData();
      } else {
        alert('Erro ao excluir material');
      }
    } catch (error) {
      console.error('Erro ao excluir material:', error);
      alert('Erro ao excluir material');
    }
  };

  const handleEditMaterial = (material: MarketingMaterial) => {
    setEditingMaterial(material);
    setMaterialForm({
      title: material.title,
      description: material.description,
      type: material.type,
      content: material.content,
      imageUrl: material.imageUrl || '',
      platform: material.platform || '',
      category: material.category,
    });
    setShowMaterialModal(true);
  };

  // Migration functions
  const handleMigrate = async () => {
    setMigrateLoading(true);
    setMigrateError('');
    setMigrateResult(null);

    try {
      const response = await fetch('/api/admin/migrate-affiliate-codes', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-secret',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setMigrateResult(data);
      } else {
        setMigrateError(data.error || 'Erro na migração');
      }
    } catch (err) {
      setMigrateError('Erro ao conectar com o servidor');
    } finally {
      setMigrateLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('⚠️ Tem certeza que deseja apagar todos os registros de afiliados?\n\nEsta ação não pode ser desfeita e irá remover:\n- Todos os afiliados\n- Todas as comissões\n- Todos os cliques rastreados')) {
      return;
    }

    setResetLoading(true);
    setMigrateError('');
    setMigrateResult(null);

    try {
      const response = await fetch('/api/admin/migrate-affiliate-codes/reset', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-secret',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Registros apagados com sucesso!\n\n${data.stats.deletedAffiliates} afiliados\n${data.stats.deletedCommissions} comissões\n${data.stats.deletedClicks} cliques`);
      } else {
        setMigrateError(data.error || 'Erro ao apagar registros');
      }
    } catch (err) {
      setMigrateError('Erro ao conectar com o servidor');
    } finally {
      setResetLoading(false);
    }
  };

  // Consistency validation functions
  const handleValidateAll = async () => {
    setValidating(true);
    setConsistencyReport(null);
    
    try {
      const response = await fetch('/api/admin/affiliates/validate?mode=all');
      const data = await response.json();
      
      if (data.success) {
        setConsistencyReport(data.result);
      } else {
        alert('Erro ao validar consistência: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao validar consistência');
      console.error(error);
    } finally {
      setValidating(false);
    }
  };

  const handleAutoValidate = async () => {
    setValidating(true);
    
    try {
      const response = await fetch('/api/admin/affiliates/validate?mode=auto');
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Validação automática concluída!\n\nVerificados: ${data.result.checked}\nCorrigidos: ${data.result.corrected}\nProblemas críticos: ${data.result.criticalIssues}\nAvisos: ${data.result.warningIssues}`);
        fetchData(); // Refresh data
      } else {
        alert('Erro ao validar consistência: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao validar consistência');
      console.error(error);
    } finally {
      setValidating(false);
    }
  };

  // Upload function
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setUploadedImageUrl(data.url);
        setMaterialForm(prev => ({ ...prev, imageUrl: data.url }));
      } else {
        alert('Erro ao fazer upload: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao fazer upload do arquivo');
      console.error(error);
    } finally {
      setUploadingFile(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-MZ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'banner':
      case 'social_media':
        return <ImageIcon className="h-4 w-4" />;
      case 'email_template':
        return <Mail className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white transition shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-700">Voltar</span>
              </Link>
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                  Gestão de Afiliados
                </h1>
                <p className="text-lg text-gray-600">
                  Gerencie o programa de afiliados da WEHOSTHERE
                </p>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 px-6 py-3 rounded-xl hover:bg-white transition shadow-sm hover:shadow-md"
            >
              <RefreshCw className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-700">Atualizar</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('affiliates')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'affiliates'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Afiliados</span>
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'commissions'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <DollarSign className="h-5 w-5" />
              <span>Comissões</span>
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'payouts'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Wallet className="h-5 w-5" />
              <span>Saques</span>
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'materials'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ImageIcon className="h-5 w-5" />
              <span>Materiais</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'reports'
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              <span>Relatórios</span>
            </button>
            <button
              onClick={() => setActiveTab('consistency')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'consistency'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Shield className="h-5 w-5" />
              <span>Consistência</span>
            </button>
            <button
              onClick={() => setActiveTab('migration')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'migration'
                  ? 'bg-gradient-to-r from-slate-600 to-gray-700 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <RefreshCw className="h-5 w-5" />
              <span>Migração</span>
            </button>
          </div>
        </div>

      {activeTab === 'affiliates' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Afiliados</h2>
              <p className="text-xs text-gray-500 mt-0.5">Gerir parceiros ou ativar qualquer utilizador diretamente como afiliado.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                <option value="">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="pending">Pendentes</option>
                <option value="suspended">Suspensos</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setAddAffiliateError('');
                  setAddAffiliateSuccess('');
                  openAddAffiliateModal();
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tornar Utilizador Afiliado</span>
              </button>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : affiliates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum afiliado encontrado para este filtro.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                      <th className="py-3 pr-4">Utilizador</th>
                      <th className="py-3 pr-4">Código & Link</th>
                      <th className="py-3 pr-4">Cliques / Conv.</th>
                      <th className="py-3 pr-4">Ganhos / Saldo</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {affiliates.map((aff) => (
                      <tr key={aff._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="font-semibold text-gray-900">{aff.userName}</div>
                          <div className="text-xs text-gray-500">{aff.userEmail}</div>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className="inline-block font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            {aff.affiliateCode}
                          </span>
                          <div className="text-[11px] text-gray-400 truncate max-w-[200px] mt-0.5">{aff.affiliateLink}</div>
                        </td>
                        <td className="py-3.5 pr-4 text-gray-700">
                          {aff.totalClicks} cliques • {aff.totalConversions} conv.
                        </td>
                        <td className="py-3.5 pr-4">
                          <div className="font-semibold text-emerald-700">{(aff.totalEarnings || 0).toLocaleString()} MT</div>
                          <div className="text-xs text-gray-500">Disp: {(aff.availableBalance || 0).toLocaleString()} MT</div>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            aff.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : aff.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {aff.status === 'active' ? 'Ativo' : aff.status === 'pending' ? 'Pendente' : 'Suspenso'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right space-x-2 whitespace-nowrap">
                          {aff.status !== 'active' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateAffiliateStatus(aff._id, 'active')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              Ativar
                            </button>
                          )}
                          {aff.status !== 'suspended' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateAffiliateStatus(aff._id, 'suspended')}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              Suspender
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'affiliates' && (
        <div className="mt-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-1">Regras Comerciais & Comissões</h3>
          <p className="text-xs text-gray-500 mb-4">Altere a percentagem de comissão, mínimo de saque e serviços elegíveis sem mexer no código.</p>
          <form onSubmit={handleSaveCommissionSettings} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Comissão Padrão (%)</label>
              <input
                type="number"
                min={1}
                max={90}
                value={commissionSettings.defaultCommissionRate}
                onChange={(e) => setCommissionSettings({ ...commissionSettings, defaultCommissionRate: Number(e.target.value) })}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Saque Mínimo (MZN)</label>
              <input
                type="number"
                min={50}
                value={commissionSettings.minPayoutAmount}
                onChange={(e) => setCommissionSettings({ ...commissionSettings, minPayoutAmount: Number(e.target.value) })}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commissionSettings.allowBalanceCredit}
                  onChange={(e) => setCommissionSettings({ ...commissionSettings, allowBalanceCredit: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span>Permitir crédito na plataforma</span>
              </label>
              <button
                type="submit"
                disabled={savingSettings}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 shrink-0"
              >
                {savingSettings ? 'A guardar...' : 'Guardar Regras'}
              </button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-gray-600 mr-1">Serviços elegíveis:</span>
            {['hosting', 'domain', 'email', 'site', 'systems', 'academy', 'vps', 'loja-online'].map((svc) => {
              const checked = commissionSettings.eligibleServices.includes(svc);
              return (
                <button
                  key={svc}
                  type="button"
                  onClick={() => {
                    setCommissionSettings((prev) => ({
                      ...prev,
                      eligibleServices: checked
                        ? prev.eligibleServices.filter((s) => s !== svc)
                        : [...prev.eligibleServices, svc],
                    }));
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                    checked ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600'
                  }`}
                >
                  {svc}
                </button>
              );
            })}
            {settingsSavedMsg && <span className="text-xs font-semibold text-emerald-600 ml-2">{settingsSavedMsg}</span>}
          </div>
        </div>
      )}

      {/* Modal: Tornar Utilizador Afiliado */}
      {showAddAffiliateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Tornar Utilizador Afiliado</h3>
              <button
                type="button"
                onClick={() => setShowAddAffiliateModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              Insira o email de uma conta já registada para ativá-la imediatamente como afiliado ativo (sem necessidade de verificação).
            </p>
            <form onSubmit={handleCreateAffiliate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Selecionar Utilizador da Plataforma</label>
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Pesquisar por nome ou email..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                />
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-gray-50/50">
                  {loadingPlatformUsers ? (
                    <div className="p-3 text-center text-xs text-gray-500">A carregar utilizadores...</div>
                  ) : (
                    (() => {
                      const q = userSearchQuery.trim().toLowerCase();
                      const filtered = platformUsers
                        .filter((u) => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
                        .sort((a, b) => Number(a.isAffiliate) - Number(b.isAffiliate));
                      if (filtered.length === 0) {
                        return <div className="p-3 text-center text-xs text-gray-500">Nenhum utilizador encontrado.</div>;
                      }
                      return filtered.slice(0, 50).map((u) => {
                        const isSelected = addAffiliateEmail.toLowerCase() === u.email?.toLowerCase();
                        const isAlreadyActive = u.affiliateStatus === 'active';
                        return (
                          <button
                            key={u.id || u.email}
                            type="button"
                            disabled={isAlreadyActive}
                            onClick={() => {
                              setAddAffiliateEmail(u.email);
                              if (u.phone && !addAffiliatePhone) {
                                setAddAffiliatePhone(u.phone);
                              }
                            }}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 text-xs transition ${
                              isAlreadyActive
                                ? 'opacity-50 cursor-not-allowed bg-gray-100/60'
                                : isSelected
                                ? 'bg-blue-50 text-blue-900 font-semibold'
                                : 'hover:bg-white cursor-pointer'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="truncate font-medium text-gray-900">{u.name}</div>
                              <div className="truncate text-[11px] text-gray-500">{u.email}</div>
                            </div>
                            {isAlreadyActive ? (
                              <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                                Já Afiliado
                              </span>
                            ) : isSelected ? (
                              <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-semibold">
                                Selecionado
                              </span>
                            ) : (
                              <span className="shrink-0 text-[10px] text-blue-600 font-semibold">Selecionar</span>
                            )}
                          </button>
                        );
                      });
                    })()
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email do Utilizador Selecionado *</label>
                <input
                  type="email"
                  required
                  value={addAffiliateEmail}
                  onChange={(e) => setAddAffiliateEmail(e.target.value)}
                  placeholder="exemplo@dominio.com"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Código Personalizado (opcional)</label>
                <input
                  type="text"
                  value={addAffiliateCode}
                  onChange={(e) => setAddAffiliateCode(e.target.value)}
                  placeholder="Ex: joaosilva (deixe vazio para gerar automático)"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Telefone M-Pesa (opcional)</label>
                <input
                  type="text"
                  value={addAffiliatePhone}
                  onChange={(e) => setAddAffiliatePhone(e.target.value)}
                  placeholder="Ex: 841234567"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addAffiliateSendEmail}
                  onChange={(e) => setAddAffiliateSendEmail(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Enviar email de boas-vindas com o link de afiliado</span>
              </label>

              {addAffiliateError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {addAffiliateError}
                </div>
              )}
              {addAffiliateSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
                  {addAffiliateSuccess}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAffiliateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingAffiliate}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {addingAffiliate ? 'A ativar...' : 'Ativar como Afiliado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'commissions' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Comissões</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : (
              <p className="text-gray-500">Lista de comissões será exibida aqui</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Solicitações de Saque</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                >
                  <option value="">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                  <option value="processed">Processado</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma solicitação de saque encontrada</p>
                <p className="text-gray-400 text-sm mt-1">Os saques aparecerão aqui quando os afiliados solicitarem</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div key={payout._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{payout.userId}</p>
                          <p className="text-sm text-gray-500">{payout.payoutMethod}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payout.payoutStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        payout.payoutStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        payout.payoutStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        payout.payoutStatus === 'processed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payout.payoutStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <p>Saldo disponível: <span className="font-semibold text-gray-900">{payout.availableBalance?.toLocaleString('pt-MZ')} MZN</span></p>
                        {payout.payoutDetails && (
                          <p className="mt-1">
                            {payout.payoutMethod === 'bank_transfer' && `${payout.payoutDetails.bankName} - ${payout.payoutDetails.accountHolder}`}
                            {payout.payoutMethod === 'paypal' && payout.payoutDetails.paypalEmail}
                            {payout.payoutMethod === 'mpesa' && payout.payoutDetails.mpesaPhone}
                          </p>
                        )}
                      </div>
                      {payout.payoutStatus === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleProcessPayout(payout._id, 'approved')}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleProcessPayout(payout._id, 'rejected')}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                          >
                            Rejeitar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900">Relatórios de Afiliados</h2>
              <select
                value={reportsPeriod}
                onChange={(e) => {
                  setReportsPeriod(e.target.value);
                  fetchData();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : !reportsData ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum dado de relatório disponível</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Total de Afiliados</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{reportsData.summary?.totalAffiliates || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <Eye className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">Total de Cliques</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">{reportsData.summary?.totalClicks || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <ShoppingCart className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Total de Conversões</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{reportsData.summary?.totalConversions || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <DollarSign className="h-5 w-5 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">Total de Ganhos</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-900">{(reportsData.summary?.totalEarnings || 0).toLocaleString('pt-MZ')} MZN</p>
                  </div>
                </div>

                {/* Conversion Rate Card */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-xl p-4 border border-teal-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <TrendingUp className="h-5 w-5 text-teal-600" />
                    <span className="text-sm font-medium text-teal-800">Taxa de Conversão Global</span>
                  </div>
                  <p className="text-3xl font-bold text-teal-900">{(reportsData.summary?.conversionRate || 0).toFixed(2)}%</p>
                  <p className="text-xs text-teal-700 mt-1">Últimos {reportsData.summary?.period || 30} dias</p>
                </div>

                {/* Individual Affiliate Reports */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Relatório por Afiliado</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Afiliado</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Código</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliques</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Conversões</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ganhos</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Saldo</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Taxa Conv.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reportsData.affiliates?.map((affiliate: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 text-sm text-gray-900">{affiliate.userId}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{affiliate.affiliateCode}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{affiliate.clicks}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{affiliate.conversions}</td>
                            <td className="px-4 py-3 text-sm text-emerald-600 font-semibold">{affiliate.earnings.toLocaleString('pt-MZ')} MZN</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{affiliate.availableBalance.toLocaleString('pt-MZ')} MZN</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{affiliate.conversionRate.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Materiais de Marketing</h2>
              <button
                onClick={() => {
                  setEditingMaterial(null);
                  setMaterialForm({
                    title: '',
                    description: '',
                    type: 'banner',
                    content: '',
                    imageUrl: '',
                    platform: '',
                    category: '',
                  });
                  setUploadedImageUrl('');
                  setShowMaterialModal(true);
                }}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-4 py-2 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                <Plus className="h-4 w-4" />
                <span>Novo Material</span>
              </button>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum material cadastrado</p>
                <p className="text-gray-400 text-sm mt-1">Clique em &quot;Novo Material&quot; para começar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map((material) => (
                  <div key={material._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                    {material.imageUrl && (
                      <div className="h-40 bg-gray-100 overflow-hidden">
                        <img 
                          src={material.imageUrl} 
                          alt={material.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          material.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {material.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="text-xs text-gray-500">{material.type}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{material.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{material.description}</p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditMaterial(material)}
                          className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition text-sm font-medium"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material._id)}
                          className="inline-flex items-center justify-center space-x-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition text-sm font-medium"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingMaterial ? 'Editar Material' : 'Novo Material'}
                </h3>
                <button
                  onClick={() => {
                    setShowMaterialModal(false);
                    setEditingMaterial(null);
                    setUploadedImageUrl('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ex: Banner Promocional"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descrição do material..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={materialForm.type}
                  onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="banner">Banner</option>
                  <option value="social_media">Social Media</option>
                  <option value="email_template">Email Template</option>
                  <option value="landing_page">Landing Page</option>
                  <option value="video">Vídeo</option>
                  <option value="text_ad">Texto Publicitário</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input
                  type="text"
                  value={materialForm.category}
                  onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ex: Promoções"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma (opcional)</label>
                <input
                  type="text"
                  value={materialForm.platform}
                  onChange={(e) => setMaterialForm({ ...materialForm, platform: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ex: Instagram, Facebook"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo</label>
                <textarea
                  value={materialForm.content}
                  onChange={(e) => setMaterialForm({ ...materialForm, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={4}
                  placeholder="Conteúdo do material..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagem</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                    {uploadingFile && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
                    )}
                  </div>
                  
                  {materialForm.imageUrl && (
                    <div className="relative">
                      <img 
                        src={materialForm.imageUrl} 
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => {
                          setMaterialForm({ ...materialForm, imageUrl: '' });
                          setUploadedImageUrl('');
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveMaterial}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                >
                  {editingMaterial ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  onClick={() => {
                    setShowMaterialModal(false);
                    setEditingMaterial(null);
                    setUploadedImageUrl('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl transition-all duration-300 font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'consistency' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Monitoramento de Consistência</h2>
                <p className="text-sm text-gray-600">Valide e corrija automaticamente inconsistências nos dados de afiliados</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleValidateAll}
                  disabled={validating}
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                >
                  <Activity className="h-4 w-4" />
                  <span>Validar Todos</span>
                </button>
                <button
                  onClick={handleAutoValidate}
                  disabled={validating}
                  className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                >
                  <Database className="h-4 w-4" />
                  <span>Auto-Corrigir</span>
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            {validating ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                <p className="ml-3 text-gray-600">Validando consistência dos dados...</p>
              </div>
            ) : !consistencyReport ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Nenhuma validação realizada ainda</p>
                <button
                  onClick={handleValidateAll}
                  className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-medium transition"
                >
                  <Activity className="h-4 w-4" />
                  <span>Iniciar Validação</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Total Verificados</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{consistencyReport.totalAffiliates}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">Consistentes</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">{consistencyReport.consistentAffiliates}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">Inconsistentes</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-900">{consistencyReport.inconsistentAffiliates}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <RefreshCw className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Corrigidos</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {consistencyReport.reports.filter((r: any) => r.corrected).length}
                    </p>
                  </div>
                </div>

                {/* Issues List */}
                {consistencyReport.reports && consistencyReport.reports.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900">Detalhes das Inconsistências</h3>
                    {consistencyReport.reports.map((report: any, index: number) => (
                      !report.isConsistent && (
                        <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-5 w-5 text-amber-600" />
                              <span className="font-medium text-gray-900">{report.affiliateCode}</span>
                            </div>
                            {report.corrected && (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                                Corrigido
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            {report.issues.map((issue: any, issueIndex: number) => (
                              <div key={issueIndex} className={`text-sm p-2 rounded ${
                                issue.severity === 'critical' ? 'bg-red-50 text-red-800' :
                                issue.severity === 'warning' ? 'bg-amber-50 text-amber-800' :
                                'bg-blue-50 text-blue-800'
                              }`}>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{issue.type}:</span>
                                  <span>{issue.description}</span>
                                </div>
                                <div className="text-xs mt-1 opacity-75">
                                  Esperado: {issue.expected} | Atual: {issue.actual}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {consistencyReport.inconsistentAffiliates === 0 && (
                  <div className="text-center py-8 bg-emerald-50 rounded-xl border border-emerald-200">
                    <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                    <p className="text-emerald-800 font-medium">Todos os dados estão consistentes!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'migration' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-600 via-red-700 to-pink-700 p-6 sm:p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Migração de Códigos</h2>
                <p className="text-white/90 text-sm leading-relaxed">
                  Atualiza códigos de afiliados do formato numérico (6 dígitos) para o novo formato baseado no nome do usuário.
                  Isso torna os links mais personalizados e fáceis de compartilhar.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={handleMigrate}
                disabled={migrateLoading}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white px-6 py-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative z-10 flex items-center justify-center space-x-2">
                  {migrateLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Migrando...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5" />
                      <span>Iniciar Migração</span>
                    </>
                  )}
                </div>
              </button>
              
              <button
                onClick={handleReset}
                disabled={resetLoading}
                className="group relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-700 hover:via-red-800 hover:to-rose-800 text-white px-6 py-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative z-10 flex items-center justify-center space-x-2">
                  {resetLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Apagando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5" />
                      <span>Apagar Registros</span>
                    </>
                  )}
                </div>
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Atenção</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Apagar registros irá remover permanentemente todos os afiliados, comissões e cliques rastreados do banco de dados.
                  </p>
                </div>
              </div>
            </div>

            {migrateError && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800">Erro</p>
                    <p className="text-red-700 mt-1">{migrateError}</p>
                  </div>
                </div>
              </div>
            )}

            {migrateResult && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-800">Migração Concluída!</h3>
                    <p className="text-green-700">Processo finalizado com sucesso</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl">
                    <p className="text-2xl font-bold text-blue-600">{migrateResult.stats.total}</p>
                    <p className="text-gray-700 font-medium mt-1">Total</p>
                    <p className="text-xs text-gray-500 mt-1">Registros processados</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">{migrateResult.stats.updated}</p>
                    <p className="text-gray-700 font-medium mt-1">Atualizados</p>
                    <p className="text-xs text-gray-500 mt-1">Códigos migrados</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <p className="text-2xl font-bold text-gray-600">{migrateResult.stats.skipped}</p>
                    <p className="text-gray-700 font-medium mt-1">Pulados</p>
                    <p className="text-xs text-gray-500 mt-1">Já no novo formato</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-4">Detalhes da Migração</h4>
                  <div className="bg-white rounded-xl border border-gray-200 max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Usuário</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alteração</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {migrateResult.results.map((r: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                r.status === 'updated' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {r.status === 'updated' ? '✓ Atualizado' : '○ Pulado'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {r.userName || r.userId}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {r.status === 'updated' ? (
                                <span className="text-green-600 font-medium">
                                  {r.oldCode} → {r.newCode}
                                </span>
                              ) : (
                                <span className="text-gray-500">{r.reason}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Plus, Edit, Trash2, Download, FileText, Calendar, DollarSign, 
  Search, User, Save, X, CheckCircle, Clock, AlertCircle, ArrowLeft,
  Sparkles, Check, RotateCcw
} from 'lucide-react';
import UserModel from '@/lib/models/User';
import ManualClientModel from '@/lib/models/ManualClient';
import InvoiceModel, { InvoiceItem } from '@/lib/models/Invoice';
import { soundEffects } from '@/lib/soundEffects';
import Toast from '@/components/Toast';

// Helpers para manipulação e validação de datas sem problemas de fuso horário
function parseDateParts(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr || !dateStr.includes('-')) return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { year: parts[0], month: parts[1], day: parts[2] };
}

function formatDateString(year: number, month: number, day: number): string {
  const y = String(year);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addMonthsToDate(dateStr: string, months: number): string {
  const parts = parseDateParts(dateStr);
  if (!parts) return '';
  const { year, month, day } = parts;
  
  const targetMonthIndex = (month - 1) + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  
  const maxDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const targetDay = Math.min(day, maxDay);
  
  return formatDateString(targetYear, normalizedMonth + 1, targetDay);
}

function addDaysToDate(dateStr: string, days: number): string {
  const parts = parseDateParts(dateStr);
  if (!parts) return '';
  const date = new Date(parts.year, parts.month - 1, parts.day);
  date.setDate(date.getDate() + days);
  return formatDateString(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function getEndOfMonth(dateStr: string): string {
  const parts = parseDateParts(dateStr);
  if (!parts) return '';
  const maxDay = new Date(parts.year, parts.month, 0).getDate();
  return formatDateString(parts.year, parts.month, maxDay);
}

function getStartOfMonth(dateStr: string): string {
  const parts = parseDateParts(dateStr);
  if (!parts) return '';
  return formatDateString(parts.year, parts.month, 1);
}

function formatPtDate(dateStr: string): string {
  const parts = parseDateParts(dateStr);
  if (!parts) return dateStr || '-';
  const d = String(parts.day).padStart(2, '0');
  const m = String(parts.month).padStart(2, '0');
  return `${d}/${m}/${parts.year}`;
}

function getDaysDiff(startStr: string, endStr: string): number {
  const s = parseDateParts(startStr);
  const e = parseDateParts(endStr);
  if (!s || !e) return 0;
  const d1 = new Date(s.year, s.month - 1, s.day);
  const d2 = new Date(e.year, e.month - 1, e.day);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
}

function getPeriodLabel(startStr: string, endStr: string): string {
  const days = getDaysDiff(startStr, endStr);
  if (days >= 27 && days <= 32) return '1 Mês (Mensal)';
  if (days >= 85 && days <= 95) return '3 Meses (Trimestral)';
  if (days >= 175 && days <= 190) return '6 Meses (Semestral)';
  if (days >= 360 && days <= 370) return '1 Ano (Anual)';
  return `${days} dias`;
}

interface PresetService {
  name: string;
  category: string;
  defaultDescription: string;
  defaultPrice: number;
  periodType: 'monthly' | 'quarterly' | 'semiannual' | 'yearly' | 'none';
  months: number;
}

const PRESET_SERVICES: PresetService[] = [
  {
    name: 'Hospedagem Web',
    category: 'Hospedagem',
    defaultDescription: 'Hospedagem de Sites e Sistemas - Período Mensal',
    defaultPrice: 4900,
    periodType: 'monthly',
    months: 1,
  },
  {
    name: 'Hospedagem Web (Básico)',
    category: 'Hospedagem',
    defaultDescription: 'Hospedagem Web Compartilhada c/ cPanel - Mensal',
    defaultPrice: 990,
    periodType: 'monthly',
    months: 1,
  },
  {
    name: 'Hospedagem Web (Anual)',
    category: 'Hospedagem',
    defaultDescription: 'Hospedagem Web Anual c/ Certificado SSL e Domínio',
    defaultPrice: 9900,
    periodType: 'yearly',
    months: 12,
  },
  {
    name: 'Email Profissional',
    category: 'Email',
    defaultDescription: 'Caixas de Correio Corporativo (@empresa.co.mz) - Mensal',
    defaultPrice: 1500,
    periodType: 'monthly',
    months: 1,
  },
  {
    name: 'Servidor VPS / Cloud',
    category: 'Servidores',
    defaultDescription: 'Servidor VPS Dedicado com IP fixo Moçambique - Mensal',
    defaultPrice: 7500,
    periodType: 'monthly',
    months: 1,
  },
  {
    name: 'Manutenção & Suporte Mensal',
    category: 'Suporte',
    defaultDescription: 'Serviço Mensal de Manutenção Preventiva, Backups e Suporte Técnico',
    defaultPrice: 5000,
    periodType: 'monthly',
    months: 1,
  },
  {
    name: 'Registo / Renovação de Domínio .mz',
    category: 'Domínios',
    defaultDescription: 'Registo ou Renovação de Domínio Nacional .co.mz / .mz - Anual',
    defaultPrice: 2499,
    periodType: 'yearly',
    months: 12,
  },
  {
    name: 'Desenvolvimento Web / Landing Page',
    category: 'Desenvolvimento',
    defaultDescription: 'Criação e Desenvolvimento de Website Institucional / Vendas',
    defaultPrice: 15000,
    periodType: 'none',
    months: 0,
  },
];

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: 'user' | 'manual';
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  issuedAt: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  dueDate?: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: string;
}

export default function FaturasPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; title?: string; message: string } | null>(null);

  // Ciclo e cálculo automático de período
  const [periodCycle, setPeriodCycle] = useState<'monthly' | 'quarterly' | 'semiannual' | 'yearly' | 'custom'>('monthly');
  const [autoCalculatePeriod, setAutoCalculatePeriod] = useState(true);

  // Form state
  const [formData, setFormData] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      customerId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      issuedAt: today,
      servicePeriodStart: today,
      servicePeriodEnd: addMonthsToDate(today, 1),
      dueDate: addDaysToDate(today, 7),
      status: 'draft' as 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled',
      paymentMethod: '',
      notes: '',
      items: [] as InvoiceItem[],
      discount: 0
    };
  });

  // New item form
  const [newItem, setNewItem] = useState({
    service: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    const userRole = (session?.user as any)?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [session, status, router]);

  const loadData = async () => {
    try {
      // Carregar clientes (Users e ManualClients)
      const [usersRes, manualClientsRes, invoicesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/manual-clients'),
        fetch('/api/invoices')
      ]);

      const usersData = usersRes.ok ? await usersRes.json() : { users: [] };
      const manualClientsData = manualClientsRes.ok ? await manualClientsRes.json() : { clients: [] };
      const invoicesData = invoicesRes.ok ? await invoicesRes.json() : { invoices: [] };

      const allCustomers: Customer[] = [
        ...(usersData.users || []).map((u: any) => ({ ...u, type: 'user' as const })),
        ...(manualClientsData.clients || []).map((c: any) => ({ ...c, type: 'manual' as const }))
      ];

      setCustomers(allCustomers);
      setInvoices(invoicesData.invoices || []);
      setLoading(false);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      setToastMsg({ type: 'error', message: 'Erro ao carregar dados' });
      setLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || ''
      });
    }
  };

  const handleAddItem = () => {
    if (!newItem.service.trim()) {
      setToastMsg({ type: 'error', message: 'Informe o nome do serviço' });
      return;
    }

    if (newItem.unitPrice <= 0) {
      setToastMsg({ type: 'error', message: 'Informe um preço unitário válido para o item' });
      return;
    }

    const description = newItem.description.trim() || newItem.service.trim();
    const quantity = newItem.quantity > 0 ? newItem.quantity : 1;
    const subtotal = (quantity * newItem.unitPrice) - (newItem.discount || 0);

    const item: InvoiceItem = {
      service: newItem.service.trim(),
      description,
      quantity,
      unitPrice: newItem.unitPrice,
      discount: newItem.discount || 0,
      subtotal
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({ service: '', description: '', quantity: 1, unitPrice: 0, discount: 0 });
    soundEffects.playSuccessSound();
    setToastMsg({ type: 'success', message: `Item "${item.service}" adicionado à fatura!` });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal - formData.discount;
    return { subtotal, total };
  };

  // Validações de consistência de datas
  const isPeriodInconsistent = Boolean(
    formData.servicePeriodStart && 
    formData.servicePeriodEnd && 
    formData.servicePeriodEnd < formData.servicePeriodStart
  );

  const isDueDateBeforeIssued = Boolean(
    formData.dueDate && 
    formData.issuedAt && 
    formData.dueDate < formData.issuedAt
  );

  // Manipuladores de ciclo e datas
  const handleIssuedAtChange = (newIssuedAt: string) => {
    const prevIssuedAt = formData.issuedAt;
    let newStart = formData.servicePeriodStart;
    let newEnd = formData.servicePeriodEnd;
    let newDue = formData.dueDate;

    if (autoCalculatePeriod && (!newStart || newStart === prevIssuedAt)) {
      newStart = newIssuedAt;
      const months = periodCycle === 'quarterly' ? 3 : periodCycle === 'semiannual' ? 6 : periodCycle === 'yearly' ? 12 : 1;
      newEnd = addMonthsToDate(newIssuedAt, months);
    }

    if (!newDue || newDue < newIssuedAt) {
      newDue = addDaysToDate(newIssuedAt, 7);
    }

    setFormData(prev => ({
      ...prev,
      issuedAt: newIssuedAt,
      servicePeriodStart: newStart,
      servicePeriodEnd: newEnd,
      dueDate: newDue
    }));
  };

  const handleServicePeriodStartChange = (newStart: string) => {
    let newEnd = formData.servicePeriodEnd;
    if (autoCalculatePeriod && newStart) {
      const months = periodCycle === 'quarterly' ? 3 : periodCycle === 'semiannual' ? 6 : periodCycle === 'yearly' ? 12 : 1;
      newEnd = addMonthsToDate(newStart, months);
    }
    setFormData(prev => ({
      ...prev,
      servicePeriodStart: newStart,
      servicePeriodEnd: newEnd
    }));
  };

  const handleApplyCycle = (cycle: 'monthly' | 'quarterly' | 'semiannual' | 'yearly') => {
    setPeriodCycle(cycle);
    setAutoCalculatePeriod(true);
    const start = formData.servicePeriodStart || formData.issuedAt || new Date().toISOString().split('T')[0];
    const months = cycle === 'quarterly' ? 3 : cycle === 'semiannual' ? 6 : cycle === 'yearly' ? 12 : 1;
    const end = addMonthsToDate(start, months);
    setFormData(prev => ({
      ...prev,
      servicePeriodStart: start,
      servicePeriodEnd: end
    }));
    const label = cycle === 'monthly' ? 'Mensal (1 Mês)' : cycle === 'quarterly' ? 'Trimestral (3 Meses)' : cycle === 'semiannual' ? 'Semestral (6 Meses)' : 'Anual (1 Ano)';
    setToastMsg({ type: 'info', message: `Período ${label} aplicado: ${formatPtDate(start)} a ${formatPtDate(end)}` });
  };

  const handleApplyCurrentMonth = () => {
    const baseDate = formData.issuedAt || new Date().toISOString().split('T')[0];
    const start = getStartOfMonth(baseDate);
    const end = getEndOfMonth(baseDate);
    setPeriodCycle('custom');
    setAutoCalculatePeriod(false);
    setFormData(prev => ({
      ...prev,
      servicePeriodStart: start,
      servicePeriodEnd: end
    }));
    setToastMsg({ type: 'info', message: `Período ajustado para o mês civil completo: ${formatPtDate(start)} a ${formatPtDate(end)}` });
  };

  const handleApplyDueDays = (days: number) => {
    const baseDate = formData.issuedAt || new Date().toISOString().split('T')[0];
    const newDue = addDaysToDate(baseDate, days);
    setFormData(prev => ({ ...prev, dueDate: newDue }));
  };

  const handleSelectPresetService = (preset: PresetService) => {
    setNewItem({
      service: preset.name,
      description: preset.defaultDescription,
      quantity: 1,
      unitPrice: preset.defaultPrice,
      discount: 0
    });

    if (preset.periodType === 'monthly' || preset.periodType === 'yearly' || preset.periodType === 'quarterly' || preset.periodType === 'semiannual') {
      const cycle = preset.periodType;
      setPeriodCycle(cycle);
      setAutoCalculatePeriod(true);
      const start = formData.servicePeriodStart || formData.issuedAt || new Date().toISOString().split('T')[0];
      const end = addMonthsToDate(start, preset.months);
      setFormData(prev => ({
        ...prev,
        servicePeriodStart: start,
        servicePeriodEnd: end
      }));
      soundEffects.playClickSound();
      setToastMsg({
        type: 'info',
        title: 'Serviço Selecionado',
        message: `Serviço "${preset.name}" selecionado com cálculo automático do período ${preset.periodType === 'monthly' ? 'mensal' : 'anual'} (${formatPtDate(start)} a ${formatPtDate(end)})!`
      });
    }
  };

  const handleServiceInputChange = (serviceName: string) => {
    setNewItem(prev => ({ ...prev, service: serviceName }));

    const matchedPreset = PRESET_SERVICES.find(p => p.name.toLowerCase() === serviceName.trim().toLowerCase());
    if (matchedPreset) {
      handleSelectPresetService(matchedPreset);
      return;
    }

    const lower = serviceName.toLowerCase();
    if ((lower.includes('mensal') || lower.includes('hospedagem') || lower.includes('vps') || lower.includes('email')) && autoCalculatePeriod) {
      const start = formData.servicePeriodStart || formData.issuedAt || new Date().toISOString().split('T')[0];
      const end = addMonthsToDate(start, 1);
      setPeriodCycle('monthly');
      setFormData(prev => ({
        ...prev,
        servicePeriodStart: start,
        servicePeriodEnd: end
      }));
    }
  };

  const handleSubmit = async () => {
    // Se o usuário preencheu o formulário de item mas não clicou no botão (+), inclui automaticamente
    let finalItems = [...formData.items];
    if (newItem.service.trim() && newItem.unitPrice > 0) {
      const quantity = newItem.quantity > 0 ? newItem.quantity : 1;
      const description = newItem.description.trim() || newItem.service.trim();
      const subtotal = (quantity * newItem.unitPrice) - (newItem.discount || 0);
      finalItems.push({
        service: newItem.service.trim(),
        description,
        quantity,
        unitPrice: newItem.unitPrice,
        discount: newItem.discount || 0,
        subtotal
      });
      // Limpa os campos do item adicionado automaticamente
      setNewItem({ service: '', description: '', quantity: 1, unitPrice: 0, discount: 0 });
      setFormData(prev => ({ ...prev, items: finalItems }));
    }

    if (!formData.customerId) {
      setToastMsg({ type: 'error', message: 'Por favor, selecione um cliente para a fatura' });
      return;
    }

    if (finalItems.length === 0) {
      setToastMsg({ type: 'error', message: 'Adicione pelo menos um item à fatura (preencha o serviço, valor e clique em +)' });
      return;
    }

    if (isPeriodInconsistent) {
      setToastMsg({ 
        type: 'error', 
        message: 'A data de fim do período de prestação não pode ser anterior à data de início.' 
      });
      return;
    }

    try {
      const subtotal = finalItems.reduce((sum, item) => sum + item.subtotal, 0);
      const total = subtotal - formData.discount;
      const payload = {
        ...formData,
        subtotal,
        total,
        items: finalItems
      };

      let res;
      if (editingInvoice) {
        res = await fetch('/api/invoices', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingInvoice.id, ...payload })
        });
      } else {
        res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setToastMsg({ type: 'success', message: editingInvoice ? 'Fatura atualizada!' : 'Fatura criada!' });
        setShowModal(false);
        setEditingInvoice(null);
        resetForm();
        loadData();
        soundEffects.playSuccessSound();
      } else {
        const error = await res.json();
        setToastMsg({ type: 'error', message: error.error || 'Erro ao salvar fatura' });
      }
    } catch (e) {
      console.error('Erro ao salvar fatura:', e);
      setToastMsg({ type: 'error', message: 'Erro ao salvar fatura' });
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone || '',
      issuedAt: invoice.issuedAt.split('T')[0],
      servicePeriodStart: invoice.servicePeriodStart?.split('T')[0] || '',
      servicePeriodEnd: invoice.servicePeriodEnd?.split('T')[0] || '',
      dueDate: invoice.dueDate?.split('T')[0] || '',
      status: invoice.status,
      paymentMethod: invoice.paymentMethod || '',
      notes: invoice.notes || '',
      items: invoice.items,
      discount: invoice.discount
    });
    setAutoCalculatePeriod(false);
    setPeriodCycle('custom');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fatura?')) return;

    try {
      const res = await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setToastMsg({ type: 'success', message: 'Fatura excluída!' });
        loadData();
        soundEffects.playDeleteEmailSound();
      } else {
        setToastMsg({ type: 'error', message: 'Erro ao excluir fatura' });
      }
    } catch (e) {
      console.error('Erro ao excluir fatura:', e);
      setToastMsg({ type: 'error', message: 'Erro ao excluir fatura' });
    }
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Fatura-${invoiceId}.pdf`;
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

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultEnd = addMonthsToDate(today, 1);
    const defaultDue = addDaysToDate(today, 7);
    setFormData({
      customerId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      issuedAt: today,
      servicePeriodStart: today,
      servicePeriodEnd: defaultEnd,
      dueDate: defaultDue,
      status: 'draft',
      paymentMethod: '',
      notes: '',
      items: [],
      discount: 0
    });
    setPeriodCycle('monthly');
    setAutoCalculatePeriod(true);
    setNewItem({ service: '', description: '', quantity: 1, unitPrice: 0, discount: 0 });
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusConfig = {
    draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800', icon: FileText },
    pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-800', icon: Clock },
    paid: { label: 'Pago', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    overdue: { label: 'Vencido', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-600', icon: X }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              title="Voltar para Admin"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Faturas</h1>
              <p className="text-sm text-gray-500">Criar e gerenciar faturas manuais</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingInvoice(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center space-x-2 transition"
          >
            <Plus className="h-5 w-5" />
            <span>Nova Fatura</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, email ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Todos os Status</option>
            <option value="draft">Rascunho</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="overdue">Vencido</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhuma fatura encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Número</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data Emissão</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => {
                    const config = statusConfig[invoice.status];
                    const StatusIcon = config.icon;
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">{invoice.invoiceNumber}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{invoice.customerName}</div>
                          <div className="text-xs text-gray-500">{invoice.customerEmail}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(invoice.issuedAt).toLocaleDateString('pt-MZ')}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {invoice.total.toLocaleString('pt-MZ')} MT
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleDownloadPdf(invoice.id)}
                              className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Baixar PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(invoice)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(invoice.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingInvoice ? 'Editar Fatura' : 'Nova Fatura'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingInvoice(null);
                  resetForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  required
                >
                  <option value="" className="text-gray-400">Selecione um cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id} className="text-gray-900">
                      {customer.name} ({customer.email}) {customer.type === 'manual' ? '[Manual]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Datas e Período de Prestação */}
              <div className="space-y-3 bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-gray-900">Período de Prestação & Datas</span>
                  </div>
                  {/* Ciclo pills */}
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-xs text-gray-500 font-medium mr-1">Ciclo:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyCycle('monthly')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                        periodCycle === 'monthly'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Mensal (1 Mês)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyCycle('quarterly')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        periodCycle === 'quarterly'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Trimestral
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyCycle('semiannual')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        periodCycle === 'semiannual'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Semestral
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyCycle('yearly')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        periodCycle === 'yearly'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Anual
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyCurrentMonth}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 transition"
                      title="Definir 1º ao último dia do mês corrente"
                    >
                      Mês Civil
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Data de Emissão</label>
                    <input
                      type="date"
                      value={formData.issuedAt}
                      onChange={(e) => handleIssuedAtChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-700">Data de Vencimento</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleApplyDueDays(5)}
                          className="text-[10px] text-gray-500 hover:text-emerald-600 bg-white px-1.5 py-0.5 rounded border border-gray-200"
                        >
                          +5d
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyDueDays(7)}
                          className="text-[10px] text-gray-500 hover:text-emerald-600 bg-white px-1.5 py-0.5 rounded border border-gray-200"
                        >
                          +7d
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyDueDays(15)}
                          className="text-[10px] text-gray-500 hover:text-emerald-600 bg-white px-1.5 py-0.5 rounded border border-gray-200"
                        >
                          +15d
                        </button>
                      </div>
                    </div>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-700">Início do Período</label>
                      <button
                        type="button"
                        onClick={() => handleServicePeriodStartChange(formData.issuedAt)}
                        className="text-[10px] text-emerald-600 hover:underline font-medium"
                      >
                        = Emissão
                      </button>
                    </div>
                    <input
                      type="date"
                      value={formData.servicePeriodStart}
                      onChange={(e) => handleServicePeriodStartChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-700">Fim do Período</label>
                      <label className="flex items-center gap-1 cursor-pointer text-[10px] text-gray-500">
                        <input
                          type="checkbox"
                          checked={autoCalculatePeriod}
                          onChange={(e) => setAutoCalculatePeriod(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-3 w-3"
                        />
                        <span>Auto-calcular</span>
                      </label>
                    </div>
                    <input
                      type="date"
                      value={formData.servicePeriodEnd}
                      onChange={(e) => {
                        setAutoCalculatePeriod(false);
                        setPeriodCycle('custom');
                        setFormData({ ...formData, servicePeriodEnd: e.target.value });
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 bg-white focus:ring-2 ${
                        isPeriodInconsistent
                          ? 'border-red-400 focus:ring-red-500 bg-red-50/50'
                          : 'border-gray-300 focus:ring-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Alerta de Inconsistência de Datas */}
                {isPeriodInconsistent && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>
                        <strong>Período Inconsistente:</strong> A data de fim ({formatPtDate(formData.servicePeriodEnd)}) não pode ser anterior à data de início ({formatPtDate(formData.servicePeriodStart)}).
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyCycle('monthly')}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[11px] transition shrink-0 ml-2"
                    >
                      Ajustar p/ 1 Mês Automático
                    </button>
                  </div>
                )}

                {/* Badge de Período Válido */}
                {!isPeriodInconsistent && formData.servicePeriodStart && formData.servicePeriodEnd && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Prestação de Serviço:</strong> {formatPtDate(formData.servicePeriodStart)} até {formatPtDate(formData.servicePeriodEnd)} ({getDaysDiff(formData.servicePeriodStart, formData.servicePeriodEnd)} dias)
                      </span>
                    </div>
                    <span className="bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded text-[11px]">
                      {getPeriodLabel(formData.servicePeriodStart, formData.servicePeriodEnd)}
                    </span>
                  </div>
                )}

                {isDueDateBeforeIssued && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Atenção: A data de vencimento é anterior à data de emissão.</span>
                  </div>
                )}
              </div>

              {/* Status e Método de Pagamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="overdue">Vencido</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pagamento</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  >
                    <option value="" className="text-gray-400">Selecione</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="emola">eMola</option>
                    <option value="card">Cartão</option>
                    <option value="bank_transfer">Transferência Bancária</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>

              {/* Itens */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Itens da Fatura</label>
                  <span className="text-xs text-gray-500">Selecione um serviço pré-definido para preenchimento e cálculo automático:</span>
                </div>

                {/* Predefinições Rápidas de Serviços */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
                  {PRESET_SERVICES.slice(0, 5).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPresetService(preset)}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 border border-gray-200 hover:border-emerald-300 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                      <span>{preset.name}</span>
                      <span className="text-[10px] text-gray-400">({preset.defaultPrice.toLocaleString('pt-MZ')} MT)</span>
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.service}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                        <div className="text-xs text-gray-400">
                          {item.quantity} x {item.unitPrice.toLocaleString('pt-MZ')} MT
                          {item.discount > 0 && ` - ${item.discount.toLocaleString('pt-MZ')} MT`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="font-semibold text-gray-900">
                          {item.subtotal.toLocaleString('pt-MZ')} MT
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Adicionar Item */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-3 border-t">
                    <div className="relative">
                      <input
                        type="text"
                        list="preset-services-datalist"
                        placeholder="Serviço (ex: Hospedagem Web)"
                        value={newItem.service}
                        onChange={(e) => handleServiceInputChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500"
                      />
                      <datalist id="preset-services-datalist">
                        {PRESET_SERVICES.map((preset, i) => (
                          <option key={i} value={preset.name}>
                            {preset.name} - {preset.defaultPrice} MT ({preset.periodType === 'monthly' ? 'Mensal' : 'Anual'})
                          </option>
                        ))}
                      </datalist>
                    </div>
                    <input
                      type="text"
                      placeholder="Descrição (opcional)"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      placeholder="Qtd"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500"
                      min="1"
                    />
                    <input
                      type="number"
                      placeholder="Preço"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500"
                      min="0"
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition shadow-xs flex items-center justify-center gap-1"
                      title="Adicionar Item"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="md:hidden">Adicionar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Desconto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desconto Total (MT)</label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                  min="0"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                  rows={3}
                />
              </div>

              {/* Totais */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{calculateTotals().subtotal.toLocaleString('pt-MZ')} MT</span>
                </div>
                {formData.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Desconto:</span>
                    <span className="font-medium">-{formData.discount.toLocaleString('pt-MZ')} MT</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-emerald-600">{calculateTotals().total.toLocaleString('pt-MZ')} MT</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingInvoice(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPeriodInconsistent}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2 ${
                  isPeriodInconsistent
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-75'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                }`}
                title={isPeriodInconsistent ? 'Corrija o período de datas antes de salvar' : undefined}
              >
                <Save className="h-4 w-4" />
                <span>{editingInvoice ? 'Atualizar' : 'Criar Fatura'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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

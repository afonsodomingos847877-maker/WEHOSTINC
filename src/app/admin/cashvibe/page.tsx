'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Search, DollarSign, Users, AlertTriangle, 
  CheckCircle2, Clock, Calendar, Phone, MessageSquare, 
  Printer, FileText, ChevronRight, RefreshCw, X, Shield, 
  CreditCard, TrendingUp, Sparkles, Filter, Trash2, Edit3, 
  Wallet, Award, ExternalLink, Send, Download, Upload, Image as ImageIcon, Eye,
  BarChart3, PieChart, Repeat, Zap, AlertCircle, Ban, CheckSquare
} from 'lucide-react';
import PageLoader from '@/components/PageLoader';
import Toast from '@/components/Toast';
import { parseMobileMoneyMessage, IParsedTransaction } from '@/lib/cashvibeSmsParser';
import { calculateCreditScore } from '@/lib/cashvibeScore';

interface IClient {
  id: string;
  name: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address: {
    province: string;
    city: string;
    neighborhood: string;
    street?: string;
  };
  occupation: string;
  workplace?: string;
  monthlyIncome: number;
  guarantor?: {
    name: string;
    phone: string;
    relationship: string;
    documentNumber?: string;
  };
  collateralDescription?: string;
  biPhotoUrl?: string;
  collateralPhotoUrl?: string;
  status: 'active' | 'blacklisted' | 'inactive';
  rating: 'A' | 'B' | 'C' | 'D';
  totalLoansCount?: number;
  activeLoansCount?: number;
  totalDebt?: number;
  hasOverdue?: boolean;
}

interface IInstallment {
  number: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
}

interface ILoan {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientDocumentNumber?: string;
  principalAmount: number;
  interestRate: number;
  interestAmount: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  durationValue: number;
  durationUnit: 'days' | 'weeks' | 'months';
  installmentsCount: number;
  disbursementDate: string;
  firstDueDate: string;
  finalDueDate: string;
  lateFeeDaily: number;
  status: 'pending' | 'approved' | 'active' | 'paid' | 'overdue' | 'defaulted' | 'cancelled';
  purpose: string;
  collateral?: string;
  contractSigned: boolean;
  installments: IInstallment[];
  notes?: string;
  createdAt: string;
}

interface IPayment {
  id: string;
  loanId: string;
  clientId: string;
  clientName: string;
  installmentNumber?: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionReference?: string;
  receiptNumber: string;
  receivedBy: string;
  notes?: string;
}

export default function CashvibeAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'cashflow' | 'loans' | 'clients' | 'collections' | 'simulator'>('overview');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Dados principais
  const [stats, setStats] = useState<any>(null);
  const [cashflowData, setCashflowData] = useState<{ dre: any; weeks: any[] } | null>(null);
  const [upcomingInstallments, setUpcomingInstallments] = useState<any[]>([]);
  const [overdueInstallments, setOverdueInstallments] = useState<any[]>([]);
  const [loans, setLoans] = useState<ILoan[]>([]);
  const [clients, setClients] = useState<IClient[]>([]);

  // Filtros
  const [loanSearch, setLoanSearch] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState('all');
  const [clientSearch, setClientSearch] = useState('');

  // Modais
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<IClient | null>(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<ILoan | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedLoanForContract, setSelectedLoanForContract] = useState<ILoan | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  // Modal e Estado de Rollover / Prorrogação
  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);
  const [selectedLoanForRollover, setSelectedLoanForRollover] = useState<ILoan | null>(null);
  const [rolloverForm, setRolloverForm] = useState({
    rolloverFee: '300',
    extensionDays: '30',
    paymentMethod: 'mpesa',
    transactionReference: '',
    notes: '',
  });

  // Modal e Estado de Conciliação Automática de SMS M-Pesa
  const [isSmsParserModalOpen, setIsSmsParserModalOpen] = useState(false);
  const [smsInputText, setSmsInputText] = useState('');
  const [parsedSmsResult, setParsedSmsResult] = useState<IParsedTransaction | null>(null);
  const [matchedLoanForSms, setMatchedLoanForSms] = useState<ILoan | null>(null);
  const [matchedClientForSms, setMatchedClientForSms] = useState<IClient | null>(null);

  // Estados de Fotos KYC, Preview e Fila de Cobrança em Massa
  const [uploadingPhoto, setUploadingPhoto] = useState<'bi' | 'collateral' | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [isBatchQueueOpen, setIsBatchQueueOpen] = useState(false);
  const [dispatchedIds, setDispatchedIds] = useState<string[]>([]);
  const [batchQueueFilter, setBatchQueueFilter] = useState<'all' | 'overdue' | 'upcoming'>('all');

  // Form states - Cliente
  const [clientForm, setClientForm] = useState({
    name: '',
    documentType: 'BI',
    documentNumber: '',
    phone: '',
    secondaryPhone: '',
    email: '',
    province: 'Maputo',
    city: 'Maputo',
    neighborhood: '',
    street: '',
    occupation: '',
    workplace: '',
    monthlyIncome: '',
    guarantorName: '',
    guarantorPhone: '',
    guarantorRelation: '',
    collateralDescription: '',
    biPhotoUrl: '',
    collateralPhotoUrl: '',
    rating: 'A',
    notes: '',
  });

  // Form states - Empréstimo
  const [loanForm, setLoanForm] = useState({
    clientId: '',
    principalAmount: '1000',
    interestRate: '30',
    durationValue: '1',
    durationUnit: 'months',
    installmentsCount: '2',
    disbursementDate: new Date().toISOString().split('T')[0],
    purpose: 'Capital de Giro para Comércio',
    collateral: '',
    lateFeeDaily: '50',
    notes: '',
    riskOverrideConfirmed: false,
  });

  // Form states - Pagamento
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    installmentNumber: '',
    paymentMethod: 'mpesa',
    transactionReference: '',
    receivedBy: 'Admin Cashvibe',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Simulador State - Padrão Cashvibe (1.000 MT, 30% juros, 1 mês, 2 parcelas de 650 MT)
  const [simPrincipal, setSimPrincipal] = useState(1000);
  const [simRate, setSimRate] = useState(30);
  const [simDuration, setSimDuration] = useState(1);
  const [simInstallments, setSimInstallments] = useState(2);

  // Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, loansRes, clientsRes, cashflowRes] = await Promise.all([
        fetch('/api/admin/cashvibe/stats'),
        fetch(`/api/admin/cashvibe/loans?search=${encodeURIComponent(loanSearch)}&status=${loanStatusFilter}`),
        fetch(`/api/admin/cashvibe/clients?search=${encodeURIComponent(clientSearch)}`),
        fetch('/api/admin/cashvibe/stats/cashflow'),
      ]);

      const [statsData, loansData, clientsData, cashflowResData] = await Promise.all([
        statsRes.json(),
        loansRes.json(),
        clientsRes.json(),
        cashflowRes.json(),
      ]);

      if (statsData.success) {
        setStats(statsData.stats);
        setUpcomingInstallments(statsData.upcomingInstallments || []);
        setOverdueInstallments(statsData.overdueInstallments || []);
      }
      if (loansData.success) setLoans(loansData.loans || []);
      if (clientsData.success) setClients(clientsData.clients || []);
      if (cashflowResData.success) {
        setCashflowData({
          dre: cashflowResData.dre,
          weeks: cashflowResData.weeks || [],
        });
      }
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Erro ao carregar dados do Cashvibe', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [loanSearch, loanStatusFilter, clientSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Salvar Cliente (Criar ou Editar)
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: clientForm.name,
        documentType: clientForm.documentType,
        documentNumber: clientForm.documentNumber,
        phone: clientForm.phone,
        secondaryPhone: clientForm.secondaryPhone,
        email: clientForm.email,
        address: {
          province: clientForm.province,
          city: clientForm.city,
          neighborhood: clientForm.neighborhood,
          street: clientForm.street,
        },
        occupation: clientForm.occupation,
        workplace: clientForm.workplace,
        monthlyIncome: Number(clientForm.monthlyIncome) || 0,
        guarantor: {
          name: clientForm.guarantorName,
          phone: clientForm.guarantorPhone,
          relationship: clientForm.guarantorRelation,
        },
        collateralDescription: clientForm.collateralDescription,
        biPhotoUrl: clientForm.biPhotoUrl,
        collateralPhotoUrl: clientForm.collateralPhotoUrl,
        rating: clientForm.rating,
        notes: clientForm.notes,
      };

      const url = editingClient
        ? `/api/admin/cashvibe/clients/${editingClient.id}`
        : '/api/admin/cashvibe/clients';
      const method = editingClient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setToast({
        message: editingClient ? 'Cliente atualizado com sucesso!' : 'Novo cliente cadastrado!',
        type: 'success',
      });
      setIsClientModalOpen(false);
      setEditingClient(null);
      loadData();
    } catch (err: any) {
      setToast({ message: err.message || 'Erro ao salvar cliente', type: 'error' });
    }
  };

  // Salvar Empréstimo
  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/cashvibe/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanForm),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setToast({ message: 'Empréstimo concedido com sucesso!', type: 'success' });
      setIsLoanModalOpen(false);
      loadData();
      setActiveTab('loans');
    } catch (err: any) {
      setToast({ message: err.message || 'Erro ao conceder empréstimo', type: 'error' });
    }
  };

  // Registrar Pagamento
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForPayment) return;

    try {
      const res = await fetch(`/api/admin/cashvibe/loans/${selectedLoanForPayment.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentForm,
          installmentNumber: paymentForm.installmentNumber ? Number(paymentForm.installmentNumber) : undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setToast({ message: 'Pagamento amortizado com sucesso!', type: 'success' });
      setIsPaymentModalOpen(false);
      
      // Abrir recibo
      setActiveReceipt(data.payment);
      setIsReceiptModalOpen(true);
      
      loadData();
    } catch (err: any) {
      setToast({ message: err.message || 'Erro ao registrar pagamento', type: 'error' });
    }
  };

  // Automação: Envio de Recibo de Pagamento com Link do PDF no WhatsApp
  const handleSendReceiptWhatsApp = (receipt: any, loan?: any) => {
    const client = clients.find(c => c.id === receipt.clientId);
    const phone = client?.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('258') ? cleanPhone : `258${cleanPhone}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://wehosthere.com';
    const pdfUrl = `${origin}/api/admin/cashvibe/payments/${receipt.receiptNumber}/pdf`;
    
    const msg = `🧾 *Recibo Oficial de Pagamento - Cashvibe*\n\n` +
      `Olá *${receipt.clientName}*, confirmamos a recepção do seu pagamento com sucesso!\n\n` +
      `• *Valor Amortizado:* ${Number(receipt.amount).toLocaleString('pt-MZ')} MT\n` +
      `• *Empréstimo:* ${receipt.loanId}\n` +
      `• *Nº do Recibo:* ${receipt.receiptNumber}\n` +
      (receipt.transactionReference ? `• *Referência:* ${receipt.transactionReference}\n` : '') +
      (loan ? `• *Saldo Devedor Restante:* ${Number(loan.totalRemaining).toLocaleString('pt-MZ')} MT\n\n` : '\n') +
      `📥 *Baixe o seu Recibo Oficial em PDF:* ${pdfUrl}\n\n` +
      `_Agradecemos a sua pontualidade e preferência!_ ✨\n*Cashvibe Microcrédito (by WeHost Inc.)*`;

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Automação: Envio de Contrato de Mútuo com Link do PDF no WhatsApp
  const handleSendContractWhatsApp = (loan: ILoan) => {
    const cleanPhone = loan.clientPhone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('258') ? cleanPhone : `258${cleanPhone}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://wehosthere.com';
    const pdfUrl = `${origin}/api/admin/cashvibe/loans/${loan.id}/pdf`;
    
    const msg = `📄 *Contrato de Mútuo Oficial - Cashvibe Microcrédito*\n\n` +
      `Olá *${loan.clientName}*, o seu microcrédito foi concedido e ativado com sucesso!\n\n` +
      `• *Capital Concedido:* ${loan.principalAmount.toLocaleString('pt-MZ')} MT\n` +
      `• *Total a Reembolsar:* ${loan.totalAmount.toLocaleString('pt-MZ')} MT\n` +
      `• *Modalidade:* ${loan.installmentsCount} parcela(s)\n` +
      `• *Vencimento Final:* ${loan.finalDueDate}\n\n` +
      `📥 *Aceda ao seu Contrato Oficial em PDF:* ${pdfUrl}\n\n` +
      `Para qualquer esclarecimento ou pagamento via M-Pesa, fale connosco neste mesmo contacto. Tenha um excelente dia! ✨\n*Cashvibe Microcrédito*`;

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Automação: Disparador de Templates no WhatsApp
  const handleOpenWhatsAppTemplate = (
    phone: string,
    clientName: string,
    amount: number,
    dueDate: string,
    templateType: 'preventive' | 'due_today' | 'overdue_mild' | 'overdue_severe' | 'rollover',
    days?: number,
    itemKey?: string
  ) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('258') ? cleanPhone : `258${cleanPhone}`;
    
    let msg = '';
    switch (templateType) {
      case 'preventive':
        msg = `🔔 *Lembrete Preventivo - Cashvibe*\n\nOlá ${clientName}, tudo bem? Lembramos cordialmente que a sua parcela no valor de *${amount.toLocaleString('pt-MZ')} MT* vence em 2 dias (*${dueDate}*).\n\nPode efetuar o pagamento via M-Pesa para a nossa conta oficial. Agradecemos a pontualidade! ✨`;
        break;
      case 'due_today':
        msg = `⏰ *Vencimento Hoje - Cashvibe*\n\nBom dia ${clientName}! Lembramos que a sua parcela de *${amount.toLocaleString('pt-MZ')} MT* vence hoje (*${dueDate}*).\n\nPor favor, envie o comprovativo M-Pesa assim que efetuar o pagamento para emissão do seu recibo oficial. Obrigado!`;
        break;
      case 'overdue_mild':
        msg = `⚠️ *Aviso de Vencimento - Cashvibe*\n\nOlá ${clientName}, registamos que a sua parcela no valor de *${amount.toLocaleString('pt-MZ')} MT* venceu em *${dueDate}* (${days || 1} dias em aberto).\n\nSolicitamos a regularização hoje via M-Pesa para evitar taxas adicionais de mora. Contamos com a sua colaboração!`;
        break;
      case 'overdue_severe':
        msg = `🚨 *Aviso Formal de Cobrança - Cashvibe*\n\nPrezado(a) ${clientName}, o seu microcrédito encontra-se em atraso há *${days} dias* (Total atualizado com mora: *${amount.toLocaleString('pt-MZ')} MT*).\n\nSolicitamos a regularização imediata ou contacto urgente com a gerência para evitar a execução da garantia/penhor e medidas legais cabíveis. Aguardamos o seu retorno.`;
        break;
      case 'rollover':
        msg = `🤝 *Renovação de Crédito - Cashvibe*\n\nOlá ${clientName}, se não for possível liquidar o capital integral na data de vencimento, informamos que pode optar pela *Renovação de Prazo por mais 30 dias* mediante o pagamento exclusivo da taxa de juro acordada (300 MT).\n\nResponda a esta mensagem caso pretenda solicitar a prorrogação imediata.`;
        break;
    }

    if (itemKey && !dispatchedIds.includes(itemKey)) {
      setDispatchedIds(prev => [...prev, itemKey]);
    }

    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Gerador de Mensagem WhatsApp Padrão
  const handleOpenWhatsApp = (phone: string, clientName: string, amount: number, dueDate: string, isOverdue: boolean, days?: number) => {
    handleOpenWhatsAppTemplate(phone, clientName, amount, dueDate, isOverdue ? 'overdue_mild' : 'due_today', days);
  };

  // Automação: Executar Rollover / Prorrogação em 1 Clique
  const handleExecuteRollover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForRollover) return;

    try {
      const res = await fetch(`/api/admin/cashvibe/loans/${selectedLoanForRollover.id}/rollover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rolloverForm),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setToast({ message: data.message || 'Rollover aplicado com sucesso!', type: 'success' });
      setIsRolloverModalOpen(false);

      // Auto-abrir recibo da taxa de rollover
      if (data.payment) {
        setActiveReceipt(data.payment);
        setIsReceiptModalOpen(true);
      }

      loadData();
    } catch (err: any) {
      setToast({ message: err.message || 'Erro ao processar rollover', type: 'error' });
    }
  };

  // Conciliador SMS: Analisar mensagem M-Pesa / Mobile Money
  const handleParseSms = (text: string) => {
    setSmsInputText(text);
    if (!text.trim()) {
      setParsedSmsResult(null);
      setMatchedLoanForSms(null);
      setMatchedClientForSms(null);
      return;
    }

    const parsed = parseMobileMoneyMessage(text);
    setParsedSmsResult(parsed);

    // Tentar localizar cliente e empréstimo ativo pelo telefone
    if (parsed.phone) {
      const cleanTarget = parsed.phone.slice(-8);
      const client = clients.find(c => {
        const p1 = (c.phone || '').replace(/\D/g, '');
        const p2 = (c.secondaryPhone || '').replace(/\D/g, '');
        return p1.endsWith(cleanTarget) || p2.endsWith(cleanTarget);
      });

      if (client) {
        setMatchedClientForSms(client);
        const activeLoan = loans.find(l => l.clientId === client.id && ['active', 'overdue'].includes(l.status));
        setMatchedLoanForSms(activeLoan || null);
      } else {
        setMatchedClientForSms(null);
        setMatchedLoanForSms(null);
      }
    } else {
      setMatchedClientForSms(null);
      setMatchedLoanForSms(null);
    }
  };

  // Conciliador SMS: Transferir dados para o formulário de pagamento
  const handleApplySmsToPayment = (loan?: ILoan | null) => {
    const targetLoan = loan || matchedLoanForSms;
    if (!targetLoan || !parsedSmsResult) {
      setToast({ message: 'Selecione ou vincule um empréstimo para amortizar.', type: 'info' });
      return;
    }

    setSelectedLoanForPayment(targetLoan);
    setPaymentForm({
      amount: parsedSmsResult.amount ? String(parsedSmsResult.amount) : String(targetLoan.totalRemaining),
      installmentNumber: '1',
      paymentMethod: parsedSmsResult.source === 'unknown' ? 'mpesa' : parsedSmsResult.source,
      transactionReference: parsedSmsResult.reference || '',
      receivedBy: 'Conciliador M-Pesa',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: `Autoconciliado via SMS ${parsedSmsResult.source.toUpperCase()}`,
    });

    setIsSmsParserModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  // Central de Risco: Alternar Lista Negra / Bloqueio
  const handleToggleBlacklist = async (client: IClient) => {
    const newStatus = client.status === 'blacklisted' ? 'active' : 'blacklisted';
    const confirmMsg = newStatus === 'blacklisted'
      ? `Tem a certeza que deseja colocar ${client.name} na LISTA NEGRA? O sistema bloqueará novas concessões de crédito.`
      : `Deseja desbloquear ${client.name} e restaurar para status Ativo?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/cashvibe/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setToast({
        message: newStatus === 'blacklisted' ? 'Cliente bloqueado na Lista Negra.' : 'Cliente reativado com sucesso.',
        type: 'success',
      });
      loadData();
    } catch (err: any) {
      setToast({ message: err.message || 'Erro ao atualizar status do cliente', type: 'error' });
    }
  };

  // Abrir Modal de Edição de Cliente
  const openEditClient = (c: IClient) => {
    setEditingClient(c);
    setClientForm({
      name: c.name,
      documentType: c.documentType,
      documentNumber: c.documentNumber,
      phone: c.phone,
      secondaryPhone: c.secondaryPhone || '',
      email: c.email || '',
      province: c.address?.province || 'Maputo',
      city: c.address?.city || 'Maputo',
      neighborhood: c.address?.neighborhood || '',
      street: c.address?.street || '',
      occupation: c.occupation || '',
      workplace: c.workplace || '',
      monthlyIncome: String(c.monthlyIncome || ''),
      guarantorName: c.guarantor?.name || '',
      guarantorPhone: c.guarantor?.phone || '',
      guarantorRelation: c.guarantor?.relationship || '',
      collateralDescription: c.collateralDescription || '',
      biPhotoUrl: c.biPhotoUrl || '',
      collateralPhotoUrl: c.collateralPhotoUrl || '',
      rating: c.rating || 'A',
      notes: (c as any).notes || '',
    });
    setIsClientModalOpen(true);
  };

  // Upload de Fotos de BI e Garantia
  const handleUploadPhoto = async (file: File, field: 'bi' | 'collateral') => {
    setUploadingPhoto(field);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        if (field === 'bi') {
          setClientForm(prev => ({ ...prev, biPhotoUrl: data.url }));
        } else {
          setClientForm(prev => ({ ...prev, collateralPhotoUrl: data.url }));
        }
        setToast({ message: 'Foto anexada com sucesso!', type: 'success' });
      } else {
        throw new Error(data.error || 'Falha no upload');
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Erro ao fazer upload da foto', type: 'error' });
    } finally {
      setUploadingPhoto(null);
    }
  };

  // Exportar Relatório de Empréstimos para Excel/CSV
  const exportLoansCSV = () => {
    if (loans.length === 0) {
      setToast({ message: 'Sem empréstimos para exportar', type: 'info' });
      return;
    }
    const headers = ['ID', 'Mutuário', 'Telefone', 'Capital (MT)', 'Taxa (%)', 'Total (MT)', 'Pago (MT)', 'Saldo Devedor (MT)', 'Parcelas', 'Vencimento Final', 'Status'];
    const rows = loans.map(l => [
      l.id,
      `"${l.clientName.replace(/"/g, '""')}"`,
      `"${l.clientPhone}"`,
      l.principalAmount,
      l.interestRate,
      l.totalAmount,
      l.totalPaid,
      l.totalRemaining,
      l.installmentsCount,
      l.finalDueDate,
      l.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cashvibe_Emprestimos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: 'Relatório CSV exportado com sucesso!', type: 'success' });
  };

  // Exportar Lista de Clientes Mutuários para Excel/CSV
  const exportClientsCSV = () => {
    if (clients.length === 0) {
      setToast({ message: 'Sem clientes para exportar', type: 'info' });
      return;
    }
    const headers = ['ID', 'Nome', 'Documento', 'Telefone', 'Bairro', 'Profissão', 'Renda (MT)', 'Fiador', 'Score', 'Dívida Ativa (MT)'];
    const rows = clients.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.documentType}: ${c.documentNumber}"`,
      `"${c.phone}"`,
      `"${c.address?.neighborhood || c.address?.city || 'Maputo'}"`,
      `"${c.occupation || 'N/A'}"`,
      c.monthlyIncome || 0,
      `"${c.guarantor?.name || 'Sem Fiador'}"`,
      c.rating || 'A',
      c.totalDebt || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cashvibe_Mutuarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: 'Lista de clientes exportada para CSV!', type: 'success' });
  };

  // Helper de Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Ativo</span>;
      case 'paid':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Liquidado</span>;
      case 'overdue':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200 animate-pulse">Em Atraso</span>;
      case 'pending':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Pendente</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <Link 
                href="/admin" 
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Voltar ao Painel Geral"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-500/20">
                    CV
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    Cashvibe Microcrédito
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">
                      Módulo Integrado
                    </span>
                  </h1>
                </div>
                <p className="text-xs text-slate-500">Gestão de Mutuários, Concessão de Crédito, Cobranças e Amortizações</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSmsInputText('');
                  setParsedSmsResult(null);
                  setMatchedLoanForSms(null);
                  setMatchedClientForSms(null);
                  setIsSmsParserModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs transition"
                title="Colar mensagem SMS do M-Pesa para autoconciliação"
              >
                <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Conciliar M-Pesa</span>
              </button>

              <a
                href="/api/admin/cashvibe/reports/financial-pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs transition"
                title="Baixar Relatório Executivo e Balancete Oficial em PDF"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Balancete PDF</span>
              </a>

              <Link
                href="/cashvibe/meu-credito"
                target="_blank"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs transition"
                title="Abrir Portal Público de Auto-Atendimento do Mutuário"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Portal do Mutuário</span>
              </Link>

              <button
                onClick={() => {
                  setEditingClient(null);
                  setClientForm({
                    name: '', documentType: 'BI', documentNumber: '', phone: '',
                    secondaryPhone: '', email: '', province: 'Maputo', city: 'Maputo',
                    neighborhood: '', street: '', occupation: '', workplace: '',
                    monthlyIncome: '', guarantorName: '', guarantorPhone: '',
                    guarantorRelation: '', collateralDescription: '',
                    biPhotoUrl: '', collateralPhotoUrl: '',
                    rating: 'A', notes: ''
                  });
                  setIsClientModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs transition"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Novo Cliente</span>
              </button>

              <button
                onClick={() => {
                  if (clients.length === 0) {
                    setToast({ message: 'Cadastre pelo menos um cliente primeiro!', type: 'info' });
                    setIsClientModalOpen(true);
                    return;
                  }
                  setLoanForm(prev => ({ ...prev, clientId: clients[0].id, riskOverrideConfirmed: false }));
                  setIsLoanModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition"
              >
                <Wallet className="w-4 h-4" />
                <span>Novo Empréstimo</span>
              </button>
            </div>

          </div>

          {/* Abas de Navegação */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto border-t border-slate-100 pt-3 scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Visão Geral & KPIs</span>
            </button>

            <button
              onClick={() => setActiveTab('cashflow')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'cashflow'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Fluxo & DRE (30d)</span>
            </button>

            <button
              onClick={() => setActiveTab('loans')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'loans'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Empréstimos ({loans.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'clients'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clientes Mutuários ({clients.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('collections')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'collections'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Central de Cobranças</span>
              {overdueInstallments.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-rose-700 font-extrabold ml-1">
                  {overdueInstallments.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'simulator'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Simulador de Crédito</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {loading && <PageLoader message="A sincronizar carteira do Cashvibe..." />}

        {/* ===================== TAB 1: VISÃO GERAL ===================== */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Cards de Métricas Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Capital Concedido</span>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">
                    {Number(stats.totalPrincipalDisbursed || 0).toLocaleString('pt-MZ')} <span className="text-sm font-semibold text-slate-400">MT</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span className="font-semibold text-emerald-600">+{Number(stats.totalInterestProjected || 0).toLocaleString('pt-MZ')} MT</span> em juros previstos
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Recuperado</span>
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-blue-600">
                    {Number(stats.totalCollected || 0).toLocaleString('pt-MZ')} <span className="text-sm font-semibold text-slate-400">MT</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Lucro recebido: <span className="font-semibold text-blue-700">{Number(stats.profitCollected || 0).toLocaleString('pt-MZ')} MT</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo em Carteira (A Receber)</span>
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-amber-600">
                    {Number(stats.totalOutstandingDebt || 0).toLocaleString('pt-MZ')} <span className="text-sm font-semibold text-slate-400">MT</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {stats.activeLoansCount} empréstimos em curso
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Capital em Risco (Atraso)</span>
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-rose-600">
                    {Number(stats.totalOverdueDebt || 0).toLocaleString('pt-MZ')} <span className="text-sm font-semibold text-slate-400">MT</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>Taxa Inadimplência:</span>
                    <span className="font-bold text-rose-700">{stats.defaultRate}%</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Alertas Imediatos de Cobrança */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Vencidos - Urgência */}
              <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Cobranças Urgentes (Em Atraso)</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('collections')}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    Ver Todas ({overdueInstallments.length})
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {overdueInstallments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    Parabéns! Não existem parcelas vencidas em atraso no momento.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {overdueInstallments.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{item.clientName}</div>
                          <div className="text-rose-700 text-[11px] font-semibold">
                            Parcela #{item.installmentNumber} • Venceu há {item.daysOverdue} dias ({item.dueDate})
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-black text-rose-700">{item.remainingAmount.toLocaleString('pt-MZ')} MT</div>
                            <div className="text-[10px] text-slate-500">+ {item.calculatedLateFee} MT mora</div>
                          </div>
                          <button
                            onClick={() => handleOpenWhatsApp(item.clientPhone, item.clientName, item.remainingAmount, item.dueDate, true, item.daysOverdue)}
                            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition"
                            title="Cobrar via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Próximos Vencimentos (7 Dias) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Próximos Vencimentos (Esta Semana)</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">{upcomingInstallments.length} parcelas</span>
                </div>

                {upcomingInstallments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Nenhuma parcela prevista para os próximos 7 dias.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingInstallments.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{item.clientName}</div>
                          <div className="text-slate-500 text-[11px]">
                            Vence em: <span className="font-semibold text-slate-800">{item.dueDate}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-black text-slate-900">{item.remainingAmount.toLocaleString('pt-MZ')} MT</div>
                          <button
                            onClick={() => handleOpenWhatsApp(item.clientPhone, item.clientName, item.remainingAmount, item.dueDate, false)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Lembrar via WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Ações Rápidas & Banner de Destaque */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
                  Cashvibe Microcrédito
                </span>
                <h2 className="text-xl font-bold mt-2">Deseja simular um novo crédito antes de conceder?</h2>
                <p className="text-xs text-slate-300 max-w-xl mt-1">
                  Utilize o Simulador de Crédito inteligente com projeção de juros e amortizações em semanas ou meses com 1 clique.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('simulator')}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition whitespace-nowrap"
              >
                Abrir Simulador Agora
              </button>
            </div>

          </div>
        )}

        {/* ===================== TAB: FLUXO DE CAIXA & DRE ===================== */}
        {activeTab === 'cashflow' && (
          <div className="space-y-6">
            
            {/* Header do DRE */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
                  Controladoria & DRE
                </span>
                <h2 className="text-xl font-bold mt-2">Demonstrativo de Resultados & Fluxo de Caixa Projetado</h2>
                <p className="text-xs text-slate-300 max-w-xl mt-1">
                  Acompanhe em tempo real o lucro realizado, o juro a receber e as entradas previstas semana a semana para os próximos 30 dias.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="/api/admin/cashvibe/reports/financial-pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Balancete Executivo em PDF</span>
                </a>
              </div>
            </div>

            {/* Cards do DRE Operacional */}
            {cashflowData && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Receita Realizada (Juros)</div>
                    <div className="text-2xl font-black text-emerald-600 mt-2">
                      +{Number(cashflowData.dre.realizedInterest || 0).toLocaleString('pt-MZ')} <span className="text-xs font-semibold text-slate-400">MT</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Capital amortizado: <strong className="text-slate-700">{Number(cashflowData.dre.realizedPrincipal || 0).toLocaleString('pt-MZ')} MT</strong>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Juros Futuros em Carteira</div>
                    <div className="text-2xl font-black text-blue-600 mt-2">
                      +{Number(cashflowData.dre.totalProjectedInterest - cashflowData.dre.realizedInterest || 0).toLocaleString('pt-MZ')} <span className="text-xs font-semibold text-slate-400">MT</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      A receber nos contratos ativos
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Provisão de Perdas (PDD &gt;30d)</div>
                    <div className="text-2xl font-black text-rose-600 mt-2">
                      -{Number(cashflowData.dre.pddAmount || 0).toLocaleString('pt-MZ')} <span className="text-xs font-semibold text-slate-400">MT</span>
                    </div>
                    <div className="text-[11px] text-rose-700 mt-1 font-semibold">
                      Créditos com atraso superior a 30 dias
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-emerald-300 shadow-2xs bg-gradient-to-b from-white to-emerald-50/30">
                    <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Lucro Operacional Líquido</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">
                      {Number(cashflowData.dre.netOperatingProfit || 0).toLocaleString('pt-MZ')} <span className="text-xs font-semibold text-slate-400">MT</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-1 font-semibold">
                      Taxa de Retorno de Carteira: {cashflowData.dre.recoveryRate}%
                    </div>
                  </div>

                </div>

                {/* Tabela de Fluxo de Caixa Semanal */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>Previsão de Entradas Semana a Semana (Próximos 30 Dias)</span>
                      </h3>
                      <p className="text-xs text-slate-500">Distribuição cronológica das parcelas a vencer</p>
                    </div>

                    <button
                      onClick={loadData}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                      title="Atualizar Projeção"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3.5">Período / Semana</th>
                          <th className="px-5 py-3.5">Parcelas Previstas</th>
                          <th className="px-5 py-3.5">Capital a Retornar</th>
                          <th className="px-5 py-3.5">Lucro em Juros</th>
                          <th className="px-5 py-3.5 text-right">Total Esperado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cashflowData.weeks.map((week) => (
                          <tr key={week.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-5 py-4 font-bold text-slate-900">
                              {week.label}
                            </td>
                            <td className="px-5 py-4">
                              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-xs">
                                {week.count} parcela(s)
                              </span>
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-800">
                              {Number(week.principal).toLocaleString('pt-MZ')} MT
                            </td>
                            <td className="px-5 py-4 font-bold text-emerald-600">
                              +{Number(week.interest).toLocaleString('pt-MZ')} MT
                            </td>
                            <td className="px-5 py-4 font-black text-slate-900 text-right">
                              {Number(week.total).toLocaleString('pt-MZ')} MT
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                        <tr>
                          <td className="px-5 py-3.5 text-slate-900 uppercase text-[11px]">Total Projetado (30 Dias):</td>
                          <td className="px-5 py-3.5 text-slate-900">
                            {cashflowData.weeks.reduce((sum, w) => sum + w.count, 0)} parcelas
                          </td>
                          <td className="px-5 py-3.5 text-slate-900">
                            {cashflowData.weeks.reduce((sum, w) => sum + w.principal, 0).toLocaleString('pt-MZ')} MT
                          </td>
                          <td className="px-5 py-3.5 text-emerald-700">
                            +{cashflowData.weeks.reduce((sum, w) => sum + w.interest, 0).toLocaleString('pt-MZ')} MT
                          </td>
                          <td className="px-5 py-3.5 text-right font-black text-slate-900">
                            {cashflowData.weeks.reduce((sum, w) => sum + w.total, 0).toLocaleString('pt-MZ')} MT
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )}

          </div>
        )}

        {/* ===================== TAB 2: EMPRÉSTIMOS ===================== */}
        {activeTab === 'loans' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Filtros da Tabela */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Pesquisar por cliente, telefone, código..."
                  value={loanSearch}
                  onChange={(e) => setLoanSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={loanStatusFilter}
                  onChange={(e) => setLoanStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 font-semibold"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativos</option>
                  <option value="overdue">Em Atraso</option>
                  <option value="paid">Liquidados</option>
                  <option value="pending">Pendentes</option>
                </select>

                <button
                  onClick={exportLoansCSV}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                  title="Exportar dados para Excel / CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Exportar CSV</span>
                </button>

                <button
                  onClick={loadData}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                  title="Atualizar"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabela de Empréstimos */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">ID / Mutuário</th>
                    <th className="px-5 py-3.5">Capital</th>
                    <th className="px-5 py-3.5">Taxa / Juro</th>
                    <th className="px-5 py-3.5">Total & Saldo</th>
                    <th className="px-5 py-3.5">Parcelas</th>
                    <th className="px-5 py-3.5">Vencimento</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                        Nenhum empréstimo encontrado. Conceda o primeiro clicando no botão &quot;Novo Empréstimo&quot;.
                      </td>
                    </tr>
                  ) : (
                    loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-50/70 transition">
                        
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{loan.clientName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{loan.id} • {loan.clientPhone}</div>
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {loan.principalAmount.toLocaleString('pt-MZ')} MT
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-bold text-emerald-700">{loan.interestRate}%</span>
                          <span className="text-slate-400 text-[11px]"> (+{loan.interestAmount.toLocaleString('pt-MZ')} MT)</span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{loan.totalAmount.toLocaleString('pt-MZ')} MT</div>
                          <div className="text-[11px] font-semibold text-amber-600">
                            Resta: {loan.totalRemaining.toLocaleString('pt-MZ')} MT
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {loan.installmentsCount}x de {Math.round(loan.totalAmount / loan.installmentsCount).toLocaleString('pt-MZ')} MT
                          </span>
                        </td>

                        <td className="px-5 py-4 text-[11px] text-slate-600">
                          <div>Final: <span className="font-semibold text-slate-800">{loan.finalDueDate}</span></div>
                        </td>

                        <td className="px-5 py-4">
                          {getStatusBadge(loan.status)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {loan.status !== 'paid' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedLoanForPayment(loan);
                                    setPaymentForm({
                                      amount: String(loan.totalRemaining),
                                      installmentNumber: '1',
                                      paymentMethod: 'mpesa',
                                      transactionReference: '',
                                      receivedBy: 'Admin Cashvibe',
                                      paymentDate: new Date().toISOString().split('T')[0],
                                      notes: '',
                                    });
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition flex items-center gap-1"
                                  title="Amortizar Parcela"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>Pagar</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedLoanForRollover(loan);
                                    setRolloverForm({
                                      rolloverFee: String(loan.interestAmount || 300),
                                      extensionDays: '30',
                                      paymentMethod: 'mpesa',
                                      transactionReference: '',
                                      notes: 'Renovação de prazo por mais 30 dias',
                                    });
                                    setIsRolloverModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] transition flex items-center gap-1"
                                  title="Prorrogar Prazo / Rollover de 30 dias (Taxa de Juro)"
                                >
                                  <Repeat className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Rollover</span>
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => {
                                setSelectedLoanForContract(loan);
                                setIsContractModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                              title="Ver Contrato"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                            </button>

                            <a
                              href={`/api/admin/cashvibe/loans/${loan.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-emerald-50 text-emerald-700 transition"
                              title="Baixar Contrato em PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>

                            <button
                              onClick={() => handleSendContractWhatsApp(loan)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-emerald-50 text-emerald-700 transition"
                              title="Enviar Contrato via WhatsApp com link PDF"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenWhatsApp(loan.clientPhone, loan.clientName, loan.totalRemaining, loan.finalDueDate, loan.status === 'overdue')}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                              title="Mensagem de Cobrança / Lembrete WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: CLIENTES ===================== */}
        {activeTab === 'clients' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, BI, contacto..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportClientsCSV}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                  title="Exportar clientes para Excel / CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Exportar CSV</span>
                </button>

                <button
                  onClick={() => {
                    setEditingClient(null);
                    setClientForm({
                      name: '', documentType: 'BI', documentNumber: '', phone: '',
                      secondaryPhone: '', email: '', province: 'Maputo', city: 'Maputo',
                      neighborhood: '', street: '', occupation: '', workplace: '',
                      monthlyIncome: '', guarantorName: '', guarantorPhone: '',
                      guarantorRelation: '', collateralDescription: '',
                      biPhotoUrl: '', collateralPhotoUrl: '',
                      rating: 'A', notes: ''
                    });
                    setIsClientModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Mutuário</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Mutuário</th>
                    <th className="px-5 py-3.5">Documento</th>
                    <th className="px-5 py-3.5">Contacto</th>
                    <th className="px-5 py-3.5">Endereço / Bairro</th>
                    <th className="px-5 py-3.5">Ocupação / Renda</th>
                    <th className="px-5 py-3.5">Fiador</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                        Nenhum cliente cadastrado ainda.
                      </td>
                    </tr>
                  ) : (
                    clients.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{c.id}</div>
                        </td>

                        <td className="px-5 py-4 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span><span className="font-bold text-slate-800">{c.documentType}:</span> {c.documentNumber}</span>
                            {c.biPhotoUrl && (
                              <button
                                onClick={() => setPreviewImage({ url: c.biPhotoUrl!, title: `Foto do ${c.documentType} - ${c.name}` })}
                                className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                                title="Ver foto do documento"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {c.phone}
                        </td>

                        <td className="px-5 py-4 text-slate-600 text-[11px]">
                          {c.address?.neighborhood || c.address?.city || 'Maputo'}
                        </td>

                        <td className="px-5 py-4 text-[11px]">
                          <div className="font-semibold text-slate-800">{c.occupation || 'Comerciante'}</div>
                          <div className="text-slate-400">{c.monthlyIncome ? `${c.monthlyIncome.toLocaleString('pt-MZ')} MT/mês` : '-'}</div>
                        </td>

                        <td className="px-5 py-4 text-[11px]">
                          {c.guarantor?.name ? (
                            <div>
                              <span className="font-bold text-slate-800">{c.guarantor.name}</span>
                              <div className="text-slate-400">{c.guarantor.phone}</div>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                          {c.collateralPhotoUrl && (
                            <button
                              onClick={() => setPreviewImage({ url: c.collateralPhotoUrl!, title: `Foto da Garantia/Penhor - ${c.name} (${c.collateralDescription || 'Garantia'})` })}
                              className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold transition"
                              title="Ver foto da garantia"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>Foto Penhor</span>
                            </button>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {(() => {
                            const scoreData = calculateCreditScore({
                              monthlyIncome: c.monthlyIncome || 0,
                              totalLoans: c.totalLoansCount || 0,
                              paidLoans: Math.max(0, (c.totalLoansCount || 0) - (c.activeLoansCount || 0)),
                              overdueLoans: c.hasOverdue ? 1 : 0,
                              maxDaysOverdue: c.hasOverdue ? 10 : 0,
                              isBlacklisted: c.status === 'blacklisted',
                            });

                            return (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                    c.status === 'blacklisted' ? 'bg-red-200 text-red-900 border border-red-300' :
                                    scoreData.rating === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                    scoreData.rating === 'B' ? 'bg-blue-100 text-blue-800' :
                                    scoreData.rating === 'C' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {c.status === 'blacklisted' ? 'Bloqueado' : `Nota ${scoreData.rating}`}
                                  </span>
                                  <span className="font-mono text-[11px] font-bold text-slate-700">
                                    {scoreData.score} pts
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Risco {scoreData.riskLevel}
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setLoanForm(prev => ({ ...prev, clientId: c.id, riskOverrideConfirmed: false }));
                                setIsLoanModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition"
                              title="Conceder Empréstimo a este cliente"
                            >
                              + Crédito
                            </button>

                            <button
                              onClick={() => openEditClient(c)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                              title="Editar Dados"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleBlacklist(c)}
                              className={`p-1.5 rounded-lg border transition ${
                                c.status === 'blacklisted'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                              }`}
                              title={c.status === 'blacklisted' ? 'Desbloquear da Lista Negra' : 'Bloquear / Lista Negra'}
                            >
                              {c.status === 'blacklisted' ? <Shield className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: CENTRAL DE COBRANÇAS ===================== */}
        {activeTab === 'collections' && (
          <div className="space-y-6">
            
            {/* Header de Cobranças */}
            <div className="bg-rose-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-rose-800 text-rose-200 text-xs font-bold uppercase tracking-wider">
                  Recuperação de Crédito
                </span>
                <h2 className="text-xl font-bold mt-2">Central Ativa de Cobranças & Lembretes</h2>
                <p className="text-xs text-rose-200 mt-1">
                  Envie avisos de vencimento e cobranças formais no WhatsApp com 1 clique, com cálculo automático de dias de mora.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="text-right bg-rose-950/60 p-4 rounded-xl border border-rose-800/50 w-full sm:w-auto">
                  <div className="text-xs text-rose-300 font-semibold uppercase">Total em Atraso</div>
                  <div className="text-2xl font-black text-rose-300">
                    {Number(stats?.totalOverdueDebt || 0).toLocaleString('pt-MZ')} MT
                  </div>
                </div>

                <button
                  onClick={() => setIsBatchQueueOpen(true)}
                  className="w-full sm:w-auto px-5 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Fila de Disparos Rápidos</span>
                </button>
              </div>
            </div>

            {/* Lista Detalhada de Parcelas Vencidas */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Parcelas em Atraso Ativo ({overdueInstallments.length})
                </h3>

                <button
                  onClick={() => setIsBatchQueueOpen(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Disparar Cobranças em Lote</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Mutuário / Empréstimo</th>
                      <th className="px-5 py-3.5">Contacto</th>
                      <th className="px-5 py-3.5">Vencimento Original</th>
                      <th className="px-5 py-3.5">Dias em Atraso</th>
                      <th className="px-5 py-3.5">Valor Parcela</th>
                      <th className="px-5 py-3.5">Multa de Mora</th>
                      <th className="px-5 py-3.5">Total Atualizado</th>
                      <th className="px-5 py-3.5 text-right">Disparar Cobrança</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overdueInstallments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                          Nenhum cliente em atraso. Carteira 100% em dia!
                        </td>
                      </tr>
                    ) : (
                      overdueInstallments.map((inst, idx) => {
                        const itemKey = `${inst.loanId}-${inst.installmentNumber}`;
                        const isDispatched = dispatchedIds.includes(itemKey);
                        return (
                          <tr key={idx} className="hover:bg-rose-50/40 transition">
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-900">{inst.clientName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{inst.loanId} • Parcela #{inst.installmentNumber}</div>
                            </td>

                            <td className="px-5 py-4 font-semibold text-slate-800">
                              {inst.clientPhone}
                            </td>

                            <td className="px-5 py-4 text-slate-600 font-medium">
                              {inst.dueDate}
                            </td>

                            <td className="px-5 py-4">
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-xs">
                                {inst.daysOverdue} dias
                              </span>
                            </td>

                            <td className="px-5 py-4 font-semibold text-slate-900">
                              {inst.remainingAmount.toLocaleString('pt-MZ')} MT
                            </td>

                            <td className="px-5 py-4 font-semibold text-rose-700">
                              +{inst.calculatedLateFee.toLocaleString('pt-MZ')} MT
                            </td>

                            <td className="px-5 py-4 font-black text-slate-900">
                              {inst.totalWithLateFee.toLocaleString('pt-MZ')} MT
                            </td>

                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenWhatsAppTemplate(
                                    inst.clientPhone, 
                                    inst.clientName, 
                                    inst.totalWithLateFee, 
                                    inst.dueDate, 
                                    inst.daysOverdue > 7 ? 'overdue_severe' : 'overdue_mild', 
                                    inst.daysOverdue, 
                                    itemKey
                                  )}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs transition inline-flex items-center gap-1.5 ${
                                    isDispatched 
                                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  }`}
                                  title="Enviar Notificação no WhatsApp"
                                >
                                  {isDispatched ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Enviado</span>
                                    </>
                                  ) : (
                                    <>
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>Cobrar</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleOpenWhatsAppTemplate(
                                    inst.clientPhone, 
                                    inst.clientName, 
                                    inst.remainingAmount, 
                                    inst.dueDate, 
                                    'rollover', 
                                    inst.daysOverdue, 
                                    `${itemKey}-roll`
                                  )}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs transition inline-flex items-center gap-1"
                                  title="Propor Renovação de Prazo (300 MT Juros)"
                                >
                                  <span>Renovar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ===================== TAB 5: SIMULADOR ===================== */}
        {activeTab === 'simulator' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Calculadora & Simulador de Microcrédito Cashvibe</h2>
                  <p className="text-xs text-slate-500">Projeção instantânea de juros, lucro e plano de parcelas</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Capital a Conceder (MT)</label>
                  <input
                    type="number"
                    value={simPrincipal}
                    onChange={(e) => setSimPrincipal(Number(e.target.value) || 0)}
                    step="500"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Taxa de Juros (%)</label>
                  <input
                    type="number"
                    value={simRate}
                    onChange={(e) => setSimRate(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prazo (Meses)</label>
                  <input
                    type="number"
                    value={simDuration}
                    onChange={(e) => setSimDuration(Number(e.target.value) || 1)}
                    min="1"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número de Parcelas</label>
                  <input
                    type="number"
                    value={simInstallments}
                    onChange={(e) => setSimInstallments(Number(e.target.value) || 1)}
                    min="1"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-emerald-500"
                  />
                </div>

              </div>

              {/* Resultado da Simulação */}
              {(() => {
                const interest = Math.round((simPrincipal * simRate) / 100);
                const total = simPrincipal + interest;
                const installmentVal = Math.round(total / simInstallments);

                return (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-slate-900 text-white grid grid-cols-1 sm:grid-cols-3 gap-6 shadow-xl">
                      <div>
                        <div className="text-xs text-slate-400 font-medium uppercase">Lucro em Juros (Cashvibe)</div>
                        <div className="text-2xl font-black text-emerald-400 mt-1">
                          +{interest.toLocaleString('pt-MZ')} MT
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Margem: {simRate}%</div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-400 font-medium uppercase">Total a Devolver</div>
                        <div className="text-2xl font-black text-white mt-1">
                          {total.toLocaleString('pt-MZ')} MT
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Capital + Juros</div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-400 font-medium uppercase">Valor da Parcela</div>
                        <div className="text-2xl font-black text-amber-300 mt-1">
                          {installmentVal.toLocaleString('pt-MZ')} MT
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">em {simInstallments}x parcelas</div>
                      </div>
                    </div>

                    {/* Botão de Transferir Simulação para Novo Empréstimo */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setLoanForm({
                            clientId: clients[0]?.id || '',
                            principalAmount: String(simPrincipal),
                            interestRate: String(simRate),
                            durationValue: String(simDuration),
                            durationUnit: 'months',
                            installmentsCount: String(simInstallments),
                            disbursementDate: new Date().toISOString().split('T')[0],
                            purpose: 'Capital de Giro Simulado',
                            collateral: '',
                            lateFeeDaily: '50',
                            notes: 'Gerado a partir do simulador',
                            riskOverrideConfirmed: false,
                          });
                          setIsLoanModalOpen(true);
                        }}
                        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Transformar Esta Simulação em Empréstimo</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>
        )}

      </div>

      {/* ===================== MODAL NOVO/EDITAR CLIENTE ===================== */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingClient ? 'Editar Mutuário' : 'Novo Mutuário Cashvibe'}
              </h3>
              <button 
                onClick={() => setIsClientModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500"
                    placeholder="Ex: Armando Chissano"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Documento</label>
                  <select
                    value={clientForm.documentType}
                    onChange={(e) => setClientForm({ ...clientForm, documentType: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500"
                  >
                    <option value="BI">Bilhete de Identidade (BI)</option>
                    <option value="Passaporte">Passaporte</option>
                    <option value="DIRE">DIRE</option>
                    <option value="NUIT">NUIT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número do Documento *</label>
                  <input
                    type="text"
                    required
                    value={clientForm.documentNumber}
                    onChange={(e) => setClientForm({ ...clientForm, documentNumber: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500 font-mono"
                    placeholder="Ex: 110100234567A"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone Principal (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500 font-mono"
                    placeholder="840000000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone Alternativo</label>
                  <input
                    type="tel"
                    value={clientForm.secondaryPhone}
                    onChange={(e) => setClientForm({ ...clientForm, secondaryPhone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500 font-mono"
                    placeholder="820000000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bairro / Endereço</label>
                  <input
                    type="text"
                    value={clientForm.neighborhood}
                    onChange={(e) => setClientForm({ ...clientForm, neighborhood: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500"
                    placeholder="Ex: Alto Maé, Bairro Central"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ocupação / Profissão</label>
                  <input
                    type="text"
                    value={clientForm.occupation}
                    onChange={(e) => setClientForm({ ...clientForm, occupation: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500"
                    placeholder="Ex: Venda de Roupas / Mercearia"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Renda Mensal Estimada (MT)</label>
                  <input
                    type="number"
                    value={clientForm.monthlyIncome}
                    onChange={(e) => setClientForm({ ...clientForm, monthlyIncome: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500"
                    placeholder="Ex: 25000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Classificação / Score</label>
                  <select
                    value={clientForm.rating}
                    onChange={(e) => setClientForm({ ...clientForm, rating: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500 font-bold"
                  >
                    <option value="A">Score A - Excelente / Baixo Risco</option>
                    <option value="B">Score B - Bom Pagador</option>
                    <option value="C">Score C - Regular / Acompanhar</option>
                    <option value="D">Score D - Alto Risco</option>
                  </select>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Dados do Fiador / Avalista (Opcional)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Nome do Fiador"
                      value={clientForm.guarantorName}
                      onChange={(e) => setClientForm({ ...clientForm, guarantorName: e.target.value })}
                      className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500"
                    />
                    <input
                      type="tel"
                      placeholder="Telefone Fiador"
                      value={clientForm.guarantorPhone}
                      onChange={(e) => setClientForm({ ...clientForm, guarantorPhone: e.target.value })}
                      className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Parentesco / Relação"
                      value={clientForm.guarantorRelation}
                      onChange={(e) => setClientForm({ ...clientForm, guarantorRelation: e.target.value })}
                      className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Garantia / Penhor (Opcional)</label>
                  <input
                    type="text"
                    value={clientForm.collateralDescription}
                    onChange={(e) => setClientForm({ ...clientForm, collateralDescription: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500"
                    placeholder="Ex: Frigorífico Defy 220L com factura"
                  />
                </div>

                {/* Uploads KYC (Anti-Fraude) */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Documentos & Fotos KYC (Anti-Fraude)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Foto do Documento / BI */}
                    <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">Foto do Documento (BI)</label>
                        {uploadingPhoto === 'bi' && <span className="text-[10px] text-emerald-600 font-bold animate-pulse">A carregar...</span>}
                      </div>

                      {clientForm.biPhotoUrl ? (
                        <div className="relative rounded-lg overflow-hidden border border-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={clientForm.biPhotoUrl} alt="Foto BI" className="w-full h-24 object-cover" />
                          <button
                            type="button"
                            onClick={() => setClientForm({ ...clientForm, biPhotoUrl: '' })}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md text-xs"
                            title="Remover foto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition text-center">
                          <Upload className="w-5 h-5 text-slate-400 mb-1" />
                          <span className="text-[11px] font-semibold text-slate-600">Carregar Foto do BI</span>
                          <span className="text-[9px] text-slate-400">PNG, JPG até 5MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingPhoto === 'bi'}
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleUploadPhoto(e.target.files[0], 'bi');
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Foto da Garantia */}
                    <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">Foto do Bem em Garantia</label>
                        {uploadingPhoto === 'collateral' && <span className="text-[10px] text-amber-600 font-bold animate-pulse">A carregar...</span>}
                      </div>

                      {clientForm.collateralPhotoUrl ? (
                        <div className="relative rounded-lg overflow-hidden border border-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={clientForm.collateralPhotoUrl} alt="Foto Garantia" className="w-full h-24 object-cover" />
                          <button
                            type="button"
                            onClick={() => setClientForm({ ...clientForm, collateralPhotoUrl: '' })}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md text-xs"
                            title="Remover foto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition text-center">
                          <Upload className="w-5 h-5 text-slate-400 mb-1" />
                          <span className="text-[11px] font-semibold text-slate-600">Carregar Foto Penhor</span>
                          <span className="text-[9px] text-slate-400">TV, Telemóvel, Factura</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingPhoto === 'collateral'}
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleUploadPhoto(e.target.files[0], 'collateral');
                            }}
                          />
                        </label>
                      )}
                    </div>

                  </div>
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition"
                >
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Mutuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL NOVO EMPRÉSTIMO ===================== */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Conceder Novo Microcrédito</h3>
              <button 
                onClick={() => setIsLoanModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoan} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Selecionar Mutuário *</label>
                <select
                  required
                  value={loanForm.clientId}
                  onChange={(e) => setLoanForm({ ...loanForm, clientId: e.target.value, riskOverrideConfirmed: false })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-emerald-500"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - {c.status === 'blacklisted' ? 'LISTA NEGRA (BLOQUEADO)' : `Score Nota ${c.rating}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Avaliação Automática de Risco & Credit Score */}
              {(() => {
                const selectedClient = clients.find(c => c.id === loanForm.clientId);
                if (!selectedClient) return null;
                const scoreInfo = calculateCreditScore({
                  monthlyIncome: selectedClient.monthlyIncome || 0,
                  totalLoans: selectedClient.totalLoansCount || 0,
                  paidLoans: Math.max(0, (selectedClient.totalLoansCount || 0) - (selectedClient.activeLoansCount || 0)),
                  overdueLoans: selectedClient.hasOverdue ? 1 : 0,
                  maxDaysOverdue: selectedClient.hasOverdue ? 10 : 0,
                  isBlacklisted: selectedClient.status === 'blacklisted',
                });

                const isRisky = selectedClient.status === 'blacklisted' || selectedClient.hasOverdue || scoreInfo.rating === 'D';

                if (!isRisky) {
                  return (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                      <span>Score de Crédito: <strong>{scoreInfo.score} pts (Nota {scoreInfo.rating} • {scoreInfo.label})</strong></span>
                      <span className="text-[11px] font-semibold text-emerald-700">Risco Baixo</span>
                    </div>
                  );
                }

                return (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>Alerta de Risco - Score {scoreInfo.score} pts (Nota {scoreInfo.rating} • Risco {scoreInfo.riskLevel})</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-700">
                      {selectedClient.status === 'blacklisted'
                        ? 'Este mutuário está na LISTA NEGRA. A concessão é de altíssimo risco.'
                        : selectedClient.hasOverdue
                        ? 'Este mutuário possui parcelas em atraso ativo na carteira.'
                        : 'Pontuação de crédito baixa com histórico de atrasos frequentes.'}
                    </p>
                    <label className="flex items-center gap-2 pt-1 font-bold text-slate-900 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={loanForm.riskOverrideConfirmed}
                        onChange={(e) => setLoanForm({ ...loanForm, riskOverrideConfirmed: e.target.checked })}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <span>Confirmo a avaliação de risco e autorizo a concessão extraordinária</span>
                    </label>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Capital (MT) *</label>
                  <input
                    type="number"
                    required
                    value={loanForm.principalAmount}
                    onChange={(e) => setLoanForm({ ...loanForm, principalAmount: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-black text-slate-900 focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Taxa de Juros (%) *</label>
                  <input
                    type="number"
                    required
                    value={loanForm.interestRate}
                    onChange={(e) => setLoanForm({ ...loanForm, interestRate: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-black text-emerald-700 focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duração</label>
                  <input
                    type="number"
                    value={loanForm.durationValue}
                    onChange={(e) => setLoanForm({ ...loanForm, durationValue: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidade</label>
                  <select
                    value={loanForm.durationUnit}
                    onChange={(e) => setLoanForm({ ...loanForm, durationUnit: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500"
                  >
                    <option value="months">Meses</option>
                    <option value="weeks">Semanas</option>
                    <option value="days">Dias</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nº Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    value={loanForm.installmentsCount}
                    onChange={(e) => setLoanForm({ ...loanForm, installmentsCount: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data de Concessão / Desembolso</label>
                <input
                  type="date"
                  value={loanForm.disbursementDate}
                  onChange={(e) => setLoanForm({ ...loanForm, disbursementDate: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Finalidade</label>
                <input
                  type="text"
                  value={loanForm.purpose}
                  onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500"
                  placeholder="Ex: Compra de mercadoria / stock"
                />
              </div>

              {/* Prévia dos Valores */}
              {(() => {
                const p = Number(loanForm.principalAmount) || 0;
                const r = Number(loanForm.interestRate) || 0;
                const j = Math.round((p * r) / 100);
                const t = p + j;
                const n = Math.max(1, Number(loanForm.installmentsCount) || 1);
                return (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-slate-500">Juros a faturar:</span>{' '}
                      <span className="font-bold text-emerald-700">+{j.toLocaleString('pt-MZ')} MT</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Total a devolver:</span>{' '}
                      <span className="font-black text-slate-900">{t.toLocaleString('pt-MZ')} MT</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={(() => {
                    const sel = clients.find(c => c.id === loanForm.clientId);
                    if (!sel) return false;
                    const isRisky = sel.status === 'blacklisted' || sel.hasOverdue;
                    return isRisky && !loanForm.riskOverrideConfirmed;
                  })()}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Conceder Empréstimo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL REGISTRAR PAGAMENTO ===================== */}
      {isPaymentModalOpen && selectedLoanForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Registrar Pagamento / Amortização</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedLoanForPayment.clientName} • {selectedLoanForPayment.id}</p>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Valor do Pagamento (MT) *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setSmsInputText('');
                      setParsedSmsResult(null);
                      setMatchedLoanForSms(selectedLoanForPayment);
                      setMatchedClientForSms(clients.find(c => c.id === selectedLoanForPayment.clientId) || null);
                      setIsSmsParserModalOpen(true);
                    }}
                    className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 transition"
                    title="Colar mensagem SMS do M-Pesa para preencher o valor e referência"
                  >
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>Autopreencher com SMS</span>
                  </button>
                </div>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-base font-black text-slate-900 rounded-xl border border-slate-300 focus:outline-emerald-500"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  Saldo devedor total: <span className="font-bold text-slate-700">{selectedLoanForPayment.totalRemaining.toLocaleString('pt-MZ')} MT</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meio de Pagamento</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500 font-semibold"
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="emola">e-Mola</option>
                  <option value="bank_transfer">Transferência Bancária</option>
                  <option value="cash">Dinheiro em Mão</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Referência da Transação / Código M-Pesa</label>
                <input
                  type="text"
                  value={paymentForm.transactionReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono uppercase focus:outline-emerald-500"
                  placeholder="Ex: 8J192K90A"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data do Pagamento</label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar & Emitir Recibo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL RECIBO OFICIAL ===================== */}
      {isReceiptModalOpen && activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-900">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-600 mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900">Recibo Oficial de Pagamento</h3>
              <p className="text-xs text-slate-500 font-mono">{activeReceipt.receiptNumber}</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs border-b border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Mutuário:</span>
                <span className="font-bold text-slate-900">{activeReceipt.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Empréstimo:</span>
                <span className="font-mono text-slate-700">{activeReceipt.loanId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Amortizado:</span>
                <span className="font-black text-emerald-600 text-sm">{Number(activeReceipt.amount).toLocaleString('pt-MZ')} MT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Método:</span>
                <span className="font-semibold uppercase text-slate-800">{activeReceipt.paymentMethod}</span>
              </div>
              {activeReceipt.transactionReference && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Código Ref:</span>
                  <span className="font-mono text-slate-800">{activeReceipt.transactionReference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Data:</span>
                <span className="text-slate-700">{activeReceipt.paymentDate}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`/api/admin/cashvibe/payments/${activeReceipt.receiptNumber}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar PDF</span>
                </a>

                <button
                  onClick={() => handleSendReceiptWhatsApp(activeReceipt, selectedLoanForPayment)}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs"
                  title="Enviar Recibo Oficial com Link PDF pelo WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar WhatsApp</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL CONTRATO / TERMO DE MÚTUO ===================== */}
      {isContractModalOpen && selectedLoanForContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl my-8 text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black uppercase tracking-wider">Contrato de Mútuo de Microcrédito Cashvibe</h3>
              </div>
              <button 
                onClick={() => setIsContractModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 space-y-4 text-xs leading-relaxed text-slate-700">
              <p>
                <strong>TERMO DE CONCESSÃO DE CRÉDITO</strong> sob o registro de identificação <strong>{selectedLoanForContract.id}</strong>.
              </p>
              
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div><strong>MUTUANTE:</strong> CASHVIBE MICROCRÉDITO (by WeHost Inc.)</div>
                <div><strong>MUTUÁRIO:</strong> {selectedLoanForContract.clientName} (Contacto: {selectedLoanForContract.clientPhone})</div>
                <div><strong>CAPITAL EMPRESTADO:</strong> {selectedLoanForContract.principalAmount.toLocaleString('pt-MZ')} MT</div>
                <div><strong>TAXA DE JURO ACORDADA:</strong> {selectedLoanForContract.interestRate}% (+{selectedLoanForContract.interestAmount.toLocaleString('pt-MZ')} MT)</div>
                <div><strong>VALOR TOTAL A REEMBOLSAR:</strong> {selectedLoanForContract.totalAmount.toLocaleString('pt-MZ')} MT</div>
                <div><strong>DATA DE VENCIMENTO FINAL:</strong> {selectedLoanForContract.finalDueDate}</div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Cláusulas & Compromissos:</h4>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                  <li>O Mutuário declara ter recebido na íntegra a quantia supra citada para fins de capital de giro e compromete-se a liquidar as parcelas até a data limite indicada.</li>
                  <li>O atraso no pagamento sujeita o mutuário a uma penalidade de mora de {selectedLoanForContract.lateFeeDaily} MT por dia corrido até a liquidação integral.</li>
                  <li>O Mutuário autoriza a comunicação por via telefónica e WhatsApp para fins de acompanhamento e lembretes de cobrança.</li>
                </ol>
              </div>

              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-2 font-semibold">
                  Pela Cashvibe Microcrédito
                </div>
                <div className="border-t border-slate-400 pt-2 font-semibold">
                  O Mutuário ({selectedLoanForContract.clientName})
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-200 gap-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`/api/admin/cashvibe/loans/${selectedLoanForContract.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar PDF</span>
                </a>

                <button
                  onClick={() => handleSendContractWhatsApp(selectedLoanForContract)}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs"
                  title="Enviar Contrato via WhatsApp com link PDF"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar WhatsApp</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL FILA DE DISPAROS RÁPIDOS WHATSAPP ===================== */}
      {isBatchQueueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-8 text-slate-900 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Fila Inteligente de Disparos no WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cobranças em atraso, lembretes preventivos e propostas de renovação (Rollover)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsBatchQueueOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-header / Filtros & Status */}
            <div className="py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setBatchQueueFilter('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    batchQueueFilter === 'all' 
                      ? 'bg-white text-slate-900 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({overdueInstallments.length + upcomingInstallments.length})
                </button>
                <button
                  onClick={() => setBatchQueueFilter('overdue')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    batchQueueFilter === 'overdue' 
                      ? 'bg-white text-rose-700 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Em Atraso ({overdueInstallments.length})
                </button>
                <button
                  onClick={() => setBatchQueueFilter('upcoming')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    batchQueueFilter === 'upcoming' 
                      ? 'bg-white text-blue-700 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Próximos 7 Dias ({upcomingInstallments.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  Enviados nesta sessão: <strong className="text-emerald-700">{dispatchedIds.length}</strong>
                </span>
                {dispatchedIds.length > 0 && (
                  <button
                    onClick={() => setDispatchedIds([])}
                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 underline transition"
                  >
                    Resetar Fila
                  </button>
                )}
              </div>
            </div>

            {/* Lista Rolável de Disparos */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {/* Parcelas em Atraso */}
              {(batchQueueFilter === 'all' || batchQueueFilter === 'overdue') && (
                <>
                  {overdueInstallments.map((inst, idx) => {
                    const itemKey = `${inst.loanId}-${inst.installmentNumber}`;
                    const isDispatched = dispatchedIds.includes(itemKey);
                    return (
                      <div 
                        key={`overdue-${idx}`}
                        className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isDispatched 
                            ? 'bg-slate-50/70 border-slate-200 opacity-80' 
                            : 'bg-rose-50/40 border-rose-200/80 shadow-2xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                              {inst.daysOverdue} dias em atraso
                            </span>
                            <span className="text-xs font-bold text-slate-900">{inst.clientName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">({inst.clientPhone})</span>
                          </div>
                          <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            <span>Empréstimo: <strong className="font-mono">{inst.loanId}</strong> (P#{inst.installmentNumber})</span>
                            <span>Vencimento: <strong>{inst.dueDate}</strong></span>
                            <span>Multa acumulada: <strong className="text-rose-700">+{inst.calculatedLateFee} MT</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <div className="text-sm font-black text-rose-700">
                              {inst.totalWithLateFee.toLocaleString('pt-MZ')} MT
                            </div>
                            <div className="text-[10px] text-slate-400">Total com mora</div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenWhatsAppTemplate(
                                inst.clientPhone,
                                inst.clientName,
                                inst.totalWithLateFee,
                                inst.dueDate,
                                inst.daysOverdue > 7 ? 'overdue_severe' : 'overdue_mild',
                                inst.daysOverdue,
                                itemKey
                              )}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                                isDispatched
                                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                              title={inst.daysOverdue > 7 ? 'Cobrança Formal com Multa' : 'Aviso Amigável de Vencimento'}
                            >
                              {isDispatched ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Enviado</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>{inst.daysOverdue > 7 ? 'Cobrança Formal' : 'Aviso Cobrança'}</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleOpenWhatsAppTemplate(
                                inst.clientPhone,
                                inst.clientName,
                                inst.remainingAmount,
                                inst.dueDate,
                                'rollover',
                                inst.daysOverdue,
                                `${itemKey}-roll`
                              )}
                              className="px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition flex items-center gap-1"
                              title="Propor Renovação de Prazo por mais 30 dias (300 MT Juro)"
                            >
                              <span>Renovação</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Próximos Vencimentos (Prevenção) */}
              {(batchQueueFilter === 'all' || batchQueueFilter === 'upcoming') && (
                <>
                  {upcomingInstallments.map((inst, idx) => {
                    const itemKey = `${inst.loanId}-${inst.installmentNumber}-up`;
                    const isDispatched = dispatchedIds.includes(itemKey);
                    return (
                      <div 
                        key={`upcoming-${idx}`}
                        className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isDispatched 
                            ? 'bg-slate-50/70 border-slate-200 opacity-80' 
                            : 'bg-blue-50/40 border-blue-200/80 shadow-2xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                              Lembrete Preventivo
                            </span>
                            <span className="text-xs font-bold text-slate-900">{inst.clientName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">({inst.clientPhone})</span>
                          </div>
                          <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            <span>Empréstimo: <strong className="font-mono">{inst.loanId}</strong> (P#{inst.installmentNumber})</span>
                            <span>Vencimento em: <strong className="text-blue-800">{inst.dueDate}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <div className="text-sm font-black text-slate-900">
                              {inst.remainingAmount.toLocaleString('pt-MZ')} MT
                            </div>
                            <div className="text-[10px] text-slate-400">Valor da parcela</div>
                          </div>

                          <button
                            onClick={() => handleOpenWhatsAppTemplate(
                              inst.clientPhone,
                              inst.clientName,
                              inst.remainingAmount,
                              inst.dueDate,
                              'preventive',
                              0,
                              itemKey
                            )}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                              isDispatched
                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                            title="Enviar Lembrete Preventivo de Pagamento via WhatsApp"
                          >
                            {isDispatched ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Enviado</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Lembrar (48h)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Estado Vazio */}
              {((batchQueueFilter === 'overdue' && overdueInstallments.length === 0) ||
                (batchQueueFilter === 'upcoming' && upcomingInstallments.length === 0) ||
                (batchQueueFilter === 'all' && overdueInstallments.length === 0 && upcomingInstallments.length === 0)) && (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <span>Não existem notificações pendentes neste filtro. A carteira está em dia!</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-slate-500">
                Os links do WhatsApp abrem numa nova aba diretamente com a mensagem pré-formatada.
              </span>
              <button
                onClick={() => setIsBatchQueueOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
              >
                Fechar Fila
              </button>
            </div>

          </div>
        </div>
      )}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white rounded-2xl max-w-xl w-full p-4 shadow-2xl overflow-hidden cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>{previewImage.title}</span>
              </h4>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="rounded-xl overflow-hidden bg-slate-100 max-h-[70vh] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewImage.url} alt={previewImage.title} className="max-w-full max-h-[70vh] object-contain" />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Abrir Imagem Original</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL DE PRORROGAÇÃO / ROLLOVER ===================== */}
      {isRolloverModalOpen && selectedLoanForRollover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Prorrogação de Prazo (Rollover)</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedLoanForRollover.clientName} • {selectedLoanForRollover.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRolloverModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumo do Crédito */}
            <div className="my-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">Capital Concedido:</span>
                <div className="font-bold text-slate-900">{selectedLoanForRollover.principalAmount.toLocaleString('pt-MZ')} MT</div>
              </div>
              <div>
                <span className="text-slate-500">Saldo Devedor Atual:</span>
                <div className="font-bold text-rose-700">{selectedLoanForRollover.totalRemaining.toLocaleString('pt-MZ')} MT</div>
              </div>
              <div>
                <span className="text-slate-500">Vencimento Atual:</span>
                <div className="font-mono text-slate-800">{selectedLoanForRollover.finalDueDate}</div>
              </div>
              <div>
                <span className="text-slate-500">Status Atual:</span>
                <div className="font-bold text-amber-700 uppercase text-[10px]">{selectedLoanForRollover.status}</div>
              </div>
            </div>

            <form onSubmit={handleExecuteRollover} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Taxa de Juro / Rollover (MT) *</label>
                  <input
                    type="number"
                    required
                    value={rolloverForm.rolloverFee}
                    onChange={(e) => setRolloverForm({ ...rolloverForm, rolloverFee: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm font-black text-emerald-700 rounded-xl border border-slate-300 focus:outline-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">Padrão Cashvibe: 300 MT</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dias de Prorrogação *</label>
                  <input
                    type="number"
                    required
                    min="7"
                    value={rolloverForm.extensionDays}
                    onChange={(e) => setRolloverForm({ ...rolloverForm, extensionDays: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">Padrão: +30 dias</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meio de Pagamento da Taxa</label>
                <select
                  value={rolloverForm.paymentMethod}
                  onChange={(e) => setRolloverForm({ ...rolloverForm, paymentMethod: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500 font-semibold"
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="emola">e-Mola</option>
                  <option value="bank_transfer">Transferência Bancária</option>
                  <option value="cash">Dinheiro em Mão</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Referência M-Pesa / Talão (Opcional)</label>
                <input
                  type="text"
                  value={rolloverForm.transactionReference}
                  onChange={(e) => setRolloverForm({ ...rolloverForm, transactionReference: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono uppercase focus:outline-emerald-500"
                  placeholder="Ex: 8J192K90A"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                ℹ️ <strong>O que acontece ao confirmar:</strong> O sistema registra a receita da taxa de juro, gera o recibo oficial de quitação da prorrogação e estende o vencimento final do contrato por mais {rolloverForm.extensionDays} dias, restaurando o status para <strong>Ativo</strong>.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRolloverModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 transition flex items-center gap-1.5"
                >
                  <Repeat className="w-4 h-4" />
                  <span>Confirmar & Emitir Recibo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL CONCILIADOR INTELIGENTE DE SMS ===================== */}
      {isSmsParserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-900 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <Zap className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Leitor & Conciliador de SMS M-Pesa</h3>
                  <p className="text-xs text-slate-500">Cole o SMS de pagamento para extração instantânea</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSmsParserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mensagem SMS Recebida no Telemóvel:
                </label>
                <textarea
                  rows={4}
                  value={smsInputText}
                  onChange={(e) => handleParseSms(e.target.value)}
                  placeholder="Cole aqui o SMS recebido do M-Pesa ou e-Mola. Exemplo:&#10;8J192K90A Confirmado. Recebeu 650.00MT de 841234567 em 30/10/2026 às 09:30..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-emerald-500 font-mono"
                />
              </div>

              {/* Prévia dos Dados Extraídos */}
              {parsedSmsResult && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>Dados Extraídos com Sucesso</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase">
                      {parsedSmsResult.source}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium uppercase">Valor Detectado</span>
                      <div className="text-base font-black text-emerald-600 mt-0.5">
                        {parsedSmsResult.amount ? `${parsedSmsResult.amount.toLocaleString('pt-MZ')} MT` : 'Não localizado'}
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium uppercase">Referência</span>
                      <div className="text-xs font-mono font-black text-slate-900 mt-1 truncate">
                        {parsedSmsResult.reference || 'Não localizado'}
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium uppercase">Telefone Remetente</span>
                      <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                        {parsedSmsResult.phone || 'Não localizado'}
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium uppercase">Remetente / Data</span>
                      <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                        {parsedSmsResult.senderName || parsedSmsResult.dateTime || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Mutuário Correspondente */}
                  {matchedClientForSms ? (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Mutuário Identificado: {matchedClientForSms.name}</span>
                      </div>
                      {matchedLoanForSms ? (
                        <div className="mt-1 text-[11px] text-emerald-800 flex items-center justify-between">
                          <span>Empréstimo Ativo: <strong>{matchedLoanForSms.id}</strong> (Resta: {matchedLoanForSms.totalRemaining.toLocaleString('pt-MZ')} MT)</span>
                        </div>
                      ) : (
                        <div className="mt-1 text-[11px] text-amber-700">
                          Este cliente não tem empréstimo ativo no momento.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      Nenhum mutuário encontrado automaticamente com o telefone detectado. Poderá selecionar o empréstimo manualmente após transferir.
                    </div>
                  )}

                  {/* Ação de Amortizar */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!parsedSmsResult.amount}
                      onClick={() => handleApplySmsToPayment(matchedLoanForSms)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Transferir Dados para Amortização</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSmsParserModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

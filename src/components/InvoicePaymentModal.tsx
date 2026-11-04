'use client';

import { useState } from 'react';
import { 
  X, CreditCard, Smartphone, Landmark, CheckCircle2, 
  Clock, ShieldCheck, Copy, Check, ArrowRight, Upload, 
  Loader2, AlertCircle, MessageCircle, FileText, ExternalLink 
} from 'lucide-react';

export interface InvoicePaymentTarget {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  total: number;
  currency?: string;
  serviceName?: string;
  dueDate?: string;
}

interface InvoicePaymentModalProps {
  invoice: InvoicePaymentTarget | null;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export default function InvoicePaymentModal({
  invoice,
  onClose,
  onPaymentSuccess
}: InvoicePaymentModalProps) {
  const [activeTab, setActiveTab] = useState<'mpesa' | 'emola' | 'bank' | 'card'>('mpesa');
  
  // M-Pesa / eMola State
  const [phone, setPhone] = useState(invoice?.customerPhone?.replace(/\D/g, '') || '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [stkSent, setStkSent] = useState(false);
  
  // Copied states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Bank Transfer Proof
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);

  if (!invoice) return null;

  const invoiceRef = invoice.invoiceNumber || invoice.id;
  const formattedAmount = (invoice.total || 0).toLocaleString('pt-MZ');
  const currency = invoice.currency || 'MT';
  const bimNib = '433372004293948';

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleMpesaPay = async () => {
    setStatusMessage(null);
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 9) {
      setStatusMessage({ type: 'error', text: 'Por favor, insere um número M-Pesa válido (9 dígitos, ex: 84XXXXXXX ou 85XXXXXXX).' });
      return;
    }

    if (!cleanPhone.startsWith('84') && !cleanPhone.startsWith('85') && !cleanPhone.startsWith('25884') && !cleanPhone.startsWith('25885')) {
      setStatusMessage({ type: 'error', text: 'O número M-Pesa deve iniciar com 84 ou 85.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments/mpesa/c2b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msisdn: cleanPhone,
          amount: invoice.total,
          reference: invoiceRef,
          thirdPartyReference: invoiceRef,
          clientName: invoice.customerName,
          clientEmail: invoice.customerEmail,
          serviceName: invoice.serviceName || `Fatura ${invoiceRef}`
        })
      });

      const data = await res.json();
      if (res.ok && (data.success || data.status === 'success' || data.id || data.reference)) {
        setStkSent(true);
        setStatusMessage({
          type: 'success',
          text: `Pedido de pagamento enviado com sucesso para ${cleanPhone}! Por favor, desbloqueia o teu telemóvel e digita o PIN do M-Pesa para aprovar.`
        });
        if (onPaymentSuccess) onPaymentSuccess();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || data.message || 'Falha ao solicitar pagamento M-Pesa. Verifica o teu saldo ou tenta novamente.'
        });
      }
    } catch (err: any) {
      console.error('Erro no pagamento M-Pesa:', err);
      setStatusMessage({
        type: 'error',
        text: 'Erro de comunicação com a rede M-Pesa. Tenta novamente ou usa transferência bancária.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmolaPay = async () => {
    setStatusMessage(null);
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 9) {
      setStatusMessage({ type: 'error', text: 'Por favor, insere um número eMola válido (9 dígitos, ex: 86XXXXXXX ou 87XXXXXXX).' });
      return;
    }

    if (!cleanPhone.startsWith('86') && !cleanPhone.startsWith('87') && !cleanPhone.startsWith('25886') && !cleanPhone.startsWith('25887')) {
      setStatusMessage({ type: 'error', text: 'O número eMola deve iniciar com 86 ou 87.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments/emola/c2b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msisdn: cleanPhone,
          amount: invoice.total,
          reference: invoiceRef,
          thirdPartyReference: invoiceRef,
          clientName: invoice.customerName,
          clientEmail: invoice.customerEmail,
          serviceName: invoice.serviceName || `Fatura ${invoiceRef}`
        })
      });

      const data = await res.json();
      if (res.ok && (data.success || data.status === 'success' || data.id)) {
        setStkSent(true);
        setStatusMessage({
          type: 'success',
          text: `Pedido de pagamento eMola enviado para ${cleanPhone}! Confirma a transação no teu telemóvel com o teu PIN.`
        });
        if (onPaymentSuccess) onPaymentSuccess();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || data.message || 'Falha ao solicitar pagamento eMola. Verifica o teu saldo ou tenta novamente.'
        });
      }
    } catch (err: any) {
      console.error('Erro no pagamento eMola:', err);
      setStatusMessage({
        type: 'error',
        text: 'Erro de comunicação com a rede eMola. Tenta novamente ou usa transferência bancária.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProofFile(file);
    setUploadingProof(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reference', invoiceRef);
      formData.append('customerEmail', invoice.customerEmail);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && (data.success || data.url)) {
        setProofUploaded(true);
        setStatusMessage({
          type: 'success',
          text: 'Comprovativo enviado com sucesso! A equipa financeira da WEHOSTHERE irá validar a fatura nas próximas horas.'
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Falha no envio do ficheiro. Podes enviar diretamente pelo WhatsApp.'
        });
      }
    } catch (err) {
      console.error('Erro upload comprovativo:', err);
      setStatusMessage({
        type: 'error',
        text: 'Erro ao carregar ficheiro. Podes enviar diretamente para o WhatsApp do suporte.'
      });
    } finally {
      setUploadingProof(false);
    }
  };

  const whatsappUrl = `https://wa.me/258848335618?text=${encodeURIComponent(
    `Olá WEHOSTHERE! Acabei de efetuar o pagamento da Fatura ${invoiceRef} no valor de ${formattedAmount} ${currency}. Segue o comprovativo para confirmação.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-slate-950 text-white p-5 sm:p-6 flex items-start justify-between gap-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                Pagar Fatura
              </span>
              <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                {invoiceRef}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {formattedAmount} <span className="text-emerald-400 text-lg font-bold">{currency}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cliente: <strong className="text-slate-200">{invoice.customerName}</strong>
              {invoice.serviceName ? ` • ${invoice.serviceName}` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Status Message Alert */}
          {statusMessage && (
            <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 animate-in fade-in ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : statusMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">
                {statusMessage.text}
              </div>
            </div>
          )}

          {/* Payment Method Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Escolhe o Método de Pagamento:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => { setActiveTab('mpesa'); setStatusMessage(null); }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'mpesa'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/30 font-bold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  M
                </div>
                <span className="text-xs font-bold mt-1">M-Pesa</span>
                <span className="text-[10px] text-gray-500">Vodacom</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('emola'); setStatusMessage(null); }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'emola'
                    ? 'border-orange-500 bg-orange-50/70 text-orange-900 ring-2 ring-orange-500/30 font-bold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  e
                </div>
                <span className="text-xs font-bold mt-1">eMola</span>
                <span className="text-[10px] text-gray-500">Movitel</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('bank'); setStatusMessage(null); }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'bank'
                    ? 'border-primary-500 bg-primary-50/70 text-primary-900 ring-2 ring-primary-500/30 font-bold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs font-bold mt-1">Banco / BIM</span>
                <span className="text-[10px] text-gray-500">Transferência</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('card'); setStatusMessage(null); }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'card'
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/30 font-bold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold mt-1">Cartão</span>
                <span className="text-[10px] text-gray-500">Checkout</span>
              </button>
            </div>
          </div>

          {/* TAB 1: M-PESA */}
          {activeTab === 'mpesa' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-black flex items-center justify-center shrink-0">
                  M
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Pagamento Automático M-Pesa</h4>
                  <p className="text-xs text-gray-500">Recebe a solicitação de PIN instantânea no teu telemóvel.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Número de Telemóvel Vodacom (84 / 85)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    +258
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="84 123 4567"
                    disabled={loading || stkSent}
                    className="w-full pl-16 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Certifica-te de ter pelo menos <strong>{formattedAmount} MT</strong> de saldo disponível na conta M-Pesa.
                </p>
              </div>

              {stkSent ? (
                <div className="p-3.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-center space-y-2">
                  <Smartphone className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
                  <p className="text-xs font-bold text-emerald-900">
                    Aguardando confirmação do PIN no teu telemóvel...
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Se não recebeste o alerta no telemóvel, podes tentar novamente abaixo.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStkSent(false)}
                    className="text-xs font-bold text-emerald-800 underline cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleMpesaPay}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A enviar solicitação para o telemóvel...</span>
                    </>
                  ) : (
                    <>
                      <span>Pedir PIN no Telemóvel ({formattedAmount} MT)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* TAB 2: EMOLA */}
          {activeTab === 'emola' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-black flex items-center justify-center shrink-0">
                  e
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Pagamento Automático eMola</h4>
                  <p className="text-xs text-gray-500">Recebe a solicitação de PIN instantânea na rede Movitel.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Número de Telemóvel Movitel (86 / 87)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    +258
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="86 123 4567"
                    disabled={loading || stkSent}
                    className="w-full pl-16 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Certifica-te de ter pelo menos <strong>{formattedAmount} MT</strong> de saldo disponível na conta eMola.
                </p>
              </div>

              {stkSent ? (
                <div className="p-3.5 bg-orange-100/70 border border-orange-300 rounded-xl text-center space-y-2">
                  <Smartphone className="w-8 h-8 text-orange-600 mx-auto animate-bounce" />
                  <p className="text-xs font-bold text-orange-900">
                    Aguardando confirmação do PIN no teu telemóvel...
                  </p>
                  <button
                    type="button"
                    onClick={() => setStkSent(false)}
                    className="text-xs font-bold text-orange-800 underline cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleEmolaPay}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A enviar solicitação para o telemóvel...</span>
                    </>
                  ) : (
                    <>
                      <span>Pedir PIN no Telemóvel ({formattedAmount} MT)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* TAB 3: TRANSFERÊNCIA BANCÁRIA / BIM */}
          {activeTab === 'bank' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Transferência Bancária / Millennium BIM</h4>
                  <p className="text-xs text-gray-500">Transfere via Internet Banking, ATM ou balcão.</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {/* NIB Box */}
                <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">
                      Banco Millennium BIM • NIB
                    </span>
                    <span className="font-mono text-sm sm:text-base font-black text-gray-900 select-all">
                      {bimNib}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(bimNib, 'nib')}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Copiar NIB"
                  >
                    {copiedField === 'nib' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 text-[11px]">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Referência da Fatura */}
                <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">
                      Referência Obrigatória da Transferência
                    </span>
                    <span className="font-mono text-sm font-black text-emerald-700 select-all">
                      {invoiceRef}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(invoiceRef, 'ref')}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Copiar Referência"
                  >
                    {copiedField === 'ref' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 text-[11px]">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Titular */}
                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">
                    Titular da Conta
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    WEHOSTHERE Moçambique
                  </span>
                </div>
              </div>

              {/* Botões de Ação para Comprovativo */}
              <div className="pt-2 border-t border-gray-200 space-y-2">
                <span className="block text-xs font-bold text-gray-700">
                  Depois de transferir, envia o comprovativo:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar via WhatsApp</span>
                  </a>

                  <label className="py-2.5 px-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                    {uploadingProof ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>A enviar...</span>
                      </>
                    ) : proofUploaded ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Comprovativo Anexado</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-gray-600" />
                        <span>Carregar Comprovativo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleUploadProof}
                      disabled={uploadingProof}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CARTÃO / CHECKOUT GERAL */}
          {activeTab === 'card' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Pagar no Checkout Completo</h4>
                  <p className="text-xs text-gray-500">Paga com Cartão de Crédito/Débito Visa, Mastercard ou outros métodos.</p>
                </div>
              </div>

              <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-2 text-xs text-gray-600 leading-relaxed">
                <p>
                  Podes concluir este pagamento na página de checkout da WEHOSTHERE com a referência <strong>{invoiceRef}</strong> já associada à tua conta.
                </p>
                <div className="flex items-center gap-2 pt-1 font-bold text-gray-900">
                  <span>Valor a liquidar:</span>
                  <span className="text-emerald-600 text-sm">{formattedAmount} {currency}</span>
                </div>
              </div>

              <a
                href={`/checkout?continuePayment=${encodeURIComponent(invoice.id)}&invoice=${encodeURIComponent(invoiceRef)}&amount=${invoice.total}`}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Ir para o Checkout da Fatura</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Rodapé de Segurança */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Pagamento Seguro com Criptografia SSL 256-bit • WEHOSTHERE Moçambique</span>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
          
          <div className="text-right">
            <span className="text-[10px] text-gray-400 block">Total da Fatura</span>
            <span className="text-sm font-black text-gray-900">{formattedAmount} {currency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

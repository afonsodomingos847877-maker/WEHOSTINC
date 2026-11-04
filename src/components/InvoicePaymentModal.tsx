'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, CreditCard, Smartphone, Landmark, CheckCircle2, 
  ShieldCheck, Copy, Check, ArrowRight, Upload, 
  Loader2, AlertCircle, MessageCircle, ExternalLink 
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
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'mpesa' | 'emola' | 'bank' | 'card'>('mpesa');
  
  // M-Pesa / eMola State
  const [phone, setPhone] = useState(invoice?.customerPhone?.replace(/\D/g, '') || '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [stkSent, setStkSent] = useState(false);
  
  // Copied states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Bank Transfer Proof
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloqueia totalmente o scroll da página enquanto o modal está aberto
  useEffect(() => {
    if (!invoice) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [invoice, onClose]);

  useEffect(() => {
    if (invoice?.customerPhone) {
      setPhone(invoice.customerPhone.replace(/\D/g, ''));
    }
  }, [invoice]);

  if (!invoice || !mounted) return null;

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
      setStatusMessage({ type: 'error', text: 'Insere um número M-Pesa válido (9 dígitos, ex: 84XXXXXXX).' });
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
          text: `Pedido enviado para ${cleanPhone}! Desbloqueia o telemóvel e digita o PIN do M-Pesa.`
        });
        if (onPaymentSuccess) onPaymentSuccess();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || data.message || 'Falha ao solicitar pagamento M-Pesa. Verifica o saldo ou tenta novamente.'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Erro de comunicação com a rede M-Pesa. Tenta novamente ou usa transferência.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmolaPay = async () => {
    setStatusMessage(null);
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 9) {
      setStatusMessage({ type: 'error', text: 'Insere um número eMola válido (9 dígitos, ex: 86XXXXXXX).' });
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
          text: `Pedido eMola enviado para ${cleanPhone}! Confirma no teu telemóvel com o PIN.`
        });
        if (onPaymentSuccess) onPaymentSuccess();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || data.message || 'Falha ao solicitar pagamento eMola. Tenta novamente.'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Erro de comunicação com a rede eMola. Tenta novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          text: 'Comprovativo enviado! A equipa financeira irá validar a fatura em breve.'
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Falha no envio. Podes enviar diretamente pelo WhatsApp.'
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Erro ao carregar ficheiro. Envia pelo WhatsApp do suporte.'
      });
    } finally {
      setUploadingProof(false);
    }
  };

  const whatsappUrl = `https://wa.me/258848335618?text=${encodeURIComponent(
    `Olá WEHOSTHERE! Acabei de efetuar o pagamento da Fatura ${invoiceRef} no valor de ${formattedAmount} ${currency}. Segue o comprovativo para confirmação.`
  )}`;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Compacto */}
        <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between gap-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                Pagar Fatura
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                {invoiceRef}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {formattedAmount} <span className="text-emerald-400 text-base font-bold">{currency}</span>
              </h2>
              <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                • {invoice.serviceName || 'Hospedagem Web'}
              </span>
            </div>
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
        <div className="p-4 sm:p-5 space-y-4">
          {/* Status Message Alert */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : statusMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed font-medium">
                {statusMessage.text}
              </div>
            </div>
          )}

          {/* Payment Method Selector Tabs */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
              Escolhe o Método de Pagamento:
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => { setActiveTab('mpesa'); setStatusMessage(null); }}
                className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  activeTab === 'mpesa'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20 font-bold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  M
                </div>
                <span className="text-xs font-bold mt-0.5">M-Pesa</span>
                <span className="text-[10px] text-gray-500">Vodacom</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('emola'); setStatusMessage(null); }}
                className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  activeTab === 'emola'
                    ? 'border-orange-500 bg-orange-50/80 text-orange-950 ring-2 ring-orange-500/20 font-bold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  e
                </div>
                <span className="text-xs font-bold mt-0.5">eMola</span>
                <span className="text-[10px] text-gray-500">Movitel</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('bank'); setStatusMessage(null); }}
                className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  activeTab === 'bank'
                    ? 'border-primary-500 bg-primary-50/80 text-primary-950 ring-2 ring-primary-500/20 font-bold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-xs font-bold mt-0.5">BIM</span>
                <span className="text-[10px] text-gray-500">Banco</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('card'); setStatusMessage(null); }}
                className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  activeTab === 'card'
                    ? 'border-indigo-500 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20 font-bold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <CreditCard className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-bold mt-0.5">Cartão</span>
                <span className="text-[10px] text-gray-500">Checkout</span>
              </button>
            </div>
          </div>

          {/* TAB 1: M-PESA */}
          {activeTab === 'mpesa' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-black flex items-center justify-center shrink-0">
                  M
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">Pagamento Instantâneo M-Pesa</h4>
                  <p className="text-[11px] text-gray-500">Recebe o pedido de PIN diretamente no teu telemóvel.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Número Vodacom (84 / 85)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                    +258
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="84 123 4567"
                    disabled={loading || stkSent}
                    className="w-full pl-14 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {stkSent ? (
                <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl text-center space-y-1.5">
                  <Smartphone className="w-6 h-6 text-emerald-600 mx-auto animate-bounce" />
                  <p className="text-xs font-bold text-emerald-900">
                    Confirma com o teu PIN M-Pesa no telemóvel!
                  </p>
                  <button
                    type="button"
                    onClick={() => setStkSent(false)}
                    className="text-[11px] font-bold text-emerald-800 underline cursor-pointer"
                  >
                    Reenviar pedido
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleMpesaPay}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A enviar para o telemóvel...</span>
                    </>
                  ) : (
                    <>
                      <span>Pagar com M-Pesa ({formattedAmount} MT)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* TAB 2: EMOLA */}
          {activeTab === 'emola' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white font-black flex items-center justify-center shrink-0">
                  e
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">Pagamento Instantâneo eMola</h4>
                  <p className="text-[11px] text-gray-500">Recebe o pedido de PIN na tua conta Movitel.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Número Movitel (86 / 87)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                    +258
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="86 123 4567"
                    disabled={loading || stkSent}
                    className="w-full pl-14 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {stkSent ? (
                <div className="p-3 bg-orange-100/70 border border-orange-300 rounded-xl text-center space-y-1.5">
                  <Smartphone className="w-6 h-6 text-orange-600 mx-auto animate-bounce" />
                  <p className="text-xs font-bold text-orange-900">
                    Confirma com o teu PIN eMola no telemóvel!
                  </p>
                  <button
                    type="button"
                    onClick={() => setStkSent(false)}
                    className="text-[11px] font-bold text-orange-800 underline cursor-pointer"
                  >
                    Reenviar pedido
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleEmolaPay}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A enviar para o telemóvel...</span>
                    </>
                  ) : (
                    <>
                      <span>Pagar com eMola ({formattedAmount} MT)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* TAB 3: TRANSFERÊNCIA BANCÁRIA / BIM */}
          {activeTab === 'bank' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* NIB Box */}
                <div className="p-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] text-gray-400 uppercase font-black block">
                      Millennium BIM • NIB
                    </span>
                    <span className="font-mono text-xs font-black text-gray-900 select-all">
                      {bimNib}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(bimNib, 'nib')}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedField === 'nib' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Referência */}
                <div className="p-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] text-gray-400 uppercase font-black block">
                      Referência da Fatura
                    </span>
                    <span className="font-mono text-xs font-black text-emerald-700 select-all truncate block">
                      {invoiceRef}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(invoiceRef, 'ref')}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedField === 'ref' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar no WhatsApp</span>
                </a>

                <label className="py-2.5 px-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                  {uploadingProof ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : proofUploaded ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-gray-600" />
                  )}
                  <span>{proofUploaded ? 'Enviado!' : 'Anexar Recibo'}</span>
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
          )}

          {/* TAB 4: CARTÃO / CHECKOUT */}
          {activeTab === 'card' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                Conclui o pagamento da fatura <strong>{invoiceRef}</strong> com Cartão Visa/Mastercard no Checkout da WEHOSTHERE.
              </p>
              <a
                href={`/checkout?continuePayment=${encodeURIComponent(invoice.id)}&invoice=${encodeURIComponent(invoiceRef)}&amount=${invoice.total}`}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Abrir Checkout Completo ({formattedAmount} MT)</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Rodapé Seguro */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Pagamento 100% Seguro SSL
            </span>
            <button
              type="button"
              onClick={onClose}
              className="font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              Cancelar / Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

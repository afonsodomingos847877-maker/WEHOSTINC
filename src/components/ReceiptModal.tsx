'use client';

import { X, Printer, Download, CheckCircle2, Clock, ShieldCheck, FileText, Server, CreditCard } from 'lucide-react';
import BrandLogo from './BrandLogo';

export interface ReceiptItem {
  service: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  subtotal: number;
}

export interface ReceiptData {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceName?: string;
  items?: ReceiptItem[];
  amount: number;
  valorFaturado?: number;
  valorPorFaturar?: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  dueDate?: string;
  notes?: string;
}

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
  onPay?: (receipt: ReceiptData) => void;
}

export default function ReceiptModal({ receipt, onClose, onPay }: ReceiptModalProps) {
  if (!receipt) return null;

  const formattedDate = new Date(receipt.createdAt).toLocaleDateString('pt-MZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const receiptNumber = receipt.id.startsWith('REC-') || receipt.id.startsWith('INV-') 
    ? receipt.id 
    : `REC-${receipt.id}`;

  const documentTypeLabel = receipt.id.startsWith('INV-') 
    ? 'FATURA OFICIAL' 
    : 'FATURA-RECIBO OFICIAL';

  const handlePrint = () => {
    window.print();
  };

  const paymentMethodLabel = {
    mpesa: 'M-Pesa Moçambique',
    emola: 'eMola Moçambique',
    card: 'Cartão de Crédito / Débito',
    bank_transfer: 'Transferência Bancária / Depósito',
    cash: 'Numerário / Caixa'
  }[(receipt.paymentMethod || '').toLowerCase()] || receipt.paymentMethod || 'M-Pesa / eMola / BIM';

  const isPaid = receipt.status === 'completed' || receipt.status === 'active' || receipt.status === 'paid';
  const isInProgress = receipt.status === 'in_progress';
  const isPending = receipt.status === 'pending' || receipt.status === 'draft';
  const isOverdue = receipt.status === 'overdue';
  const isCancelled = receipt.status === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Container Principal */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none">
        
        {/* Barra Superior de Ações (Oculta na Impressão) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Recibo Oficial PDF</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Imprimir em PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* CONTEÚDO IMPRESSO DO RECIBO */}
        <div id="receipt-printable-area" className="p-6 sm:p-10 space-y-6 text-gray-900 bg-white">
          
          {/* Topo do Recibo: Logotipo e Emissor */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-200 pb-6 gap-4">
            <div>
              <BrandLogo href="" logoHeightClass="h-8" />
              <p className="text-xs text-gray-500 mt-2 font-medium">WEHOSTHERE Infraestruturas & Cloud Moçambique</p>
              <p className="text-xs text-gray-400">Maputo, Moçambique</p>
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

            <div className="text-left sm:text-right">
              <span className="inline-block bg-primary-50 text-primary-700 font-extrabold text-xs px-3 py-1 rounded-full border border-primary-200 uppercase tracking-wider mb-2">
                {documentTypeLabel}
              </span>
              <h2 className="text-lg font-black text-gray-900 font-mono">{receiptNumber}</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Emissão: {formattedDate}</p>
              
              <div className="mt-3">
                {isPaid && (
                  <span className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full border border-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>DOCUMENTO LIQUIDADO (PAGO)</span>
                  </span>
                )}
                {isInProgress && (
                  <span className="inline-flex items-center space-x-1.5 bg-amber-100 text-amber-800 font-extrabold text-xs px-3 py-1 rounded-full border border-amber-300">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>EM PROCESSAMENTO</span>
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center space-x-1.5 bg-amber-100 text-amber-800 font-extrabold text-xs px-3 py-1 rounded-full border border-amber-300">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>PAGAMENTO PENDENTE</span>
                  </span>
                )}
                {isOverdue && (
                  <span className="inline-flex items-center space-x-1.5 bg-red-100 text-red-800 font-extrabold text-xs px-3 py-1 rounded-full border border-red-300">
                    <span>DOCUMENTO VENCIDO</span>
                  </span>
                )}
                {isCancelled && (
                  <span className="inline-flex items-center space-x-1.5 bg-gray-100 text-gray-700 font-extrabold text-xs px-3 py-1 rounded-full border border-gray-300">
                    <span>FATURA CANCELADA</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Dados do Cliente</span>
              <p className="font-extrabold text-gray-900 text-sm">{receipt.clientName}</p>
              <p className="text-gray-600 font-mono">{receipt.clientEmail}</p>
              {receipt.clientPhone && <p className="text-gray-500">{receipt.clientPhone}</p>}
            </div>
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Detalhes do Pagamento</span>
              <p className="font-semibold text-gray-800">Método: <strong className="text-gray-900">{paymentMethodLabel}</strong></p>
              <p className="text-gray-600">Estado: <strong className={isPaid ? 'text-emerald-600 font-bold' : isInProgress ? 'text-blue-600 font-bold' : 'text-amber-600 font-bold'}>{isPaid ? 'Confirmado / Ativo' : isInProgress ? 'Em Processamento' : 'Pendente de Verificação'}</strong></p>
              <p className="text-gray-500">Moeda: Meticais Moçambicanos (MT)</p>
              {receipt.servicePeriodStart && receipt.servicePeriodEnd && (
                <p className="text-gray-500 mt-1">
                  Período: <strong className="text-gray-800">{new Date(receipt.servicePeriodStart).toLocaleDateString('pt-MZ')} a {new Date(receipt.servicePeriodEnd).toLocaleDateString('pt-MZ')}</strong>
                </p>
              )}
              {receipt.dueDate && (
                <p className="text-gray-500">
                  Vencimento: <strong className="text-gray-800">{new Date(receipt.dueDate).toLocaleDateString('pt-MZ')}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Tabela de Itens */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Descrição do Serviço / Produto</th>
                  <th className="py-3 px-4 text-center">Qtd</th>
                  <th className="py-3 px-4 text-right">Valor Total (MT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                {receipt.items && receipt.items.length > 0 ? (
                  receipt.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-900 text-sm">{item.service}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{item.description || 'Infraestrutura em Datacenter • WEHOSTHERE Moçambique'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">{item.quantity}</td>
                      <td className="py-3.5 px-4 text-right font-black text-sm text-gray-900">
                        {item.subtotal.toLocaleString('pt-MZ')} MT
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-900 text-sm">{receipt.serviceName || 'Serviços de Hospedagem & Cloud'}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Infraestrutura em Datacenter • WEHOSTHERE Moçambique</p>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">1</td>
                    <td className="py-3.5 px-4 text-right font-black text-sm text-gray-900">
                      {receipt.amount.toLocaleString('pt-MZ')} MT
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totais com Cálculo de IVA */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 gap-4 text-xs">
            <div className="text-gray-500 text-[11px] space-y-1 max-w-sm">
              <p className="flex items-center space-x-1 text-emerald-700 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Garantia de Uptime de 99.9% e Suporte 24/7 Ativo.</span>
              </p>
              <p>Valores incluem IVA à taxa legal em vigor (16%). Documento emitido ao abrigo do artigo 23º do Código do IVA.</p>
              {receipt.notes && (
                <p className="text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-200 mt-2">
                  <strong>Obs:</strong> {receipt.notes}
                </p>
              )}
            </div>

            <div className="w-full sm:w-64 bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (sem IVA):</span>
                <span className="font-semibold">{(receipt.amount * 0.84).toLocaleString('pt-MZ', { maximumFractionDigits: 2 })} MT</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IVA (16%):</span>
                <span className="font-semibold">{(receipt.amount * 0.16).toLocaleString('pt-MZ', { maximumFractionDigits: 2 })} MT</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-black text-base text-gray-900">
                <span>{isPaid ? 'TOTAL PAGO:' : 'TOTAL A PAGAR:'}</span>
                <span className={isPaid ? 'text-emerald-600' : 'text-amber-600'}>{receipt.amount.toLocaleString('pt-MZ')} MT</span>
              </div>
            </div>
          </div>

          {/* Rodapé de Autenticidade */}
          <div className="border-t border-dashed border-gray-300 pt-4 text-center text-[10px] text-gray-400 space-y-1">
            <p className="font-mono">Processado por Computador • WEHOSTHERE Cloud Engine v2.4</p>
            <p>Obrigado por escolher a WEHOSTHERE como a sua fornecedora de hospedagem e domínios.</p>
          </div>
        </div>

        {/* Rodapé Modal de Ações (Oculto na Impressão) */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-wrap justify-between items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
          
          <div className="flex items-center gap-2">
            {(isPending || isOverdue) && onPay && (
              <button
                type="button"
                onClick={() => onPay(receipt)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <CreditCard className="h-4 w-4" />
                <span>Pagar Fatura Agora</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-2 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Baixar / Imprimir Recibo em PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
// ============================================================================
// ➕ WEHOSTHERE VISUAL BUILDER - MODAL DE ADICIONAR NOVA SECÇÃO
// Permite escolher uma secção pronta para inserir diretamente na posição pretendida
// ============================================================================

import { X, Sparkles, Layout, CreditCard, CheckCircle2, Quote, HelpCircle, Mail, MessageCircle, Box } from 'lucide-react';
import { ComponentType } from '@/lib/builder/types';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: ComponentType) => void;
  insertIndex?: number;
}

const SECTION_TEMPLATES: {
  type: ComponentType;
  title: string;
  description: string;
  icon: any;
  tag: string;
  color: string;
}[] = [
  {
    type: 'hero',
    title: 'Banner Principal (Hero)',
    description: 'Título de alto impacto, subtítulo, botão de ação e imagem em destaque.',
    icon: Layout,
    tag: 'Destaque',
    color: 'from-blue-600/20 to-indigo-600/20 border-blue-500/30 text-blue-400',
  },
  {
    type: 'features',
    title: 'Grelha de Recursos & Benefícios',
    description: '3 cartões modernos com ícones explicativos sobre os diferenciais da sua empresa.',
    icon: CheckCircle2,
    tag: 'Mais Popular',
    color: 'from-emerald-600/20 to-teal-600/20 border-emerald-500/30 text-emerald-400',
  },
  {
    type: 'pricing-table',
    title: 'Tabela de Preços Comparativa',
    description: 'Planos estruturados com preços em Meticais (MT), lista de benefícios e botão de contratação.',
    icon: CreditCard,
    tag: 'Conversão',
    color: 'from-purple-600/20 to-pink-600/20 border-purple-500/30 text-purple-400',
  },
  {
    type: 'testimonials',
    title: 'Depoimentos de Clientes',
    description: 'Avaliações com estrelas, fotos de perfil e relatos para gerar confiança imediata.',
    icon: Quote,
    tag: 'Prova Social',
    color: 'from-amber-600/20 to-orange-600/20 border-amber-500/30 text-amber-400',
  },
  {
    type: 'faq',
    title: 'Perguntas Frequentes (FAQ)',
    description: 'Perguntas e respostas comuns para esclarecer dúvidas dos seus visitantes.',
    icon: HelpCircle,
    tag: 'Suporte',
    color: 'from-cyan-600/20 to-blue-600/20 border-cyan-500/30 text-cyan-400',
  },
  {
    type: 'contact-form',
    title: 'Formulário de Contacto & Localização',
    description: 'Campos para nome, e-mail, telefone e mensagem com envio direto.',
    icon: Mail,
    tag: 'Leads',
    color: 'from-rose-600/20 to-red-600/20 border-rose-500/30 text-rose-400',
  },
  {
    type: 'whatsapp-button',
    title: 'Botão Flutuante de WhatsApp',
    description: 'Atalho direto para conversa no WhatsApp com mensagem personalizada.',
    icon: MessageCircle,
    tag: 'Vendas Diretas',
    color: 'from-green-600/20 to-emerald-600/20 border-green-500/30 text-green-400',
  },
  {
    type: 'section',
    title: 'Secção em Branco (Container)',
    description: 'Estrutura vazia com margens responsivas para montar blocos livremente.',
    icon: Box,
    tag: 'Livre',
    color: 'from-slate-700/20 to-slate-800/20 border-slate-700 text-slate-300',
  },
];

export default function AddSectionModal({
  isOpen,
  onClose,
  onSelectType,
  insertIndex,
}: AddSectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Adicionar Nova Secção ao Website</h3>
              <p className="text-[11px] text-slate-400">
                {typeof insertIndex === 'number'
                  ? `A secção será inserida na posição ${insertIndex + 1} da página`
                  : 'Escolha uma secção pré-construída de alta conversão'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grelha de Secções */}
        <div className="flex-1 overflow-y-auto p-6 grid sm:grid-cols-2 gap-3.5">
          {SECTION_TEMPLATES.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  onSelectType(item.type);
                  onClose();
                }}
                className={`text-left p-4 rounded-xl border bg-gradient-to-br transition-all hover:scale-[1.02] cursor-pointer group flex flex-col justify-between ${item.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/90">
                      {item.tag}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition mb-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center text-[11px] font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
                  <span>+ Inserir Bloco</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

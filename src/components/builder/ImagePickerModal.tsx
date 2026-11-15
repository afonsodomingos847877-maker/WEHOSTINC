'use client';
// ============================================================================
// 🖼️ WEHOSTHERE VISUAL BUILDER - MODAL SELETOR DE IMAGENS (Image Picker)
// Permite escolher imagens de stock profissionais, inserir URL ou carregar ficheiro
// ============================================================================

import { useState } from 'react';
import { X, Upload, Link2, Sparkles, Image as ImageIcon, Check } from 'lucide-react';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
  currentImage?: string;
}

const STOCK_COLLECTIONS = [
  {
    category: 'Tecnologia & Empresas',
    images: [
      { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop&q=80', title: 'Dashboard & Métricas' },
      { url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1000&auto=format&fit=crop&q=80', title: 'Equipa de Trabalho' },
      { url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&auto=format&fit=crop&q=80', title: 'Infraestrutura Cloud' },
      { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80', title: 'Reunião de Negócios' },
    ],
  },
  {
    category: 'Comércio & Serviços',
    images: [
      { url: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1000&auto=format&fit=crop&q=80', title: 'Pagamentos no Ponto de Venda' },
      { url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1000&auto=format&fit=crop&q=80', title: 'Loja e Vitrine Comercial' },
      { url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=1000&auto=format&fit=crop&q=80', title: 'Atendimento ao Cliente' },
      { url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1000&auto=format&fit=crop&q=80', title: 'Estratégia & Crescimento' },
    ],
  },
  {
    category: 'Restauração & Alimentação',
    images: [
      { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80', title: 'Restaurante Moderno' },
      { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&auto=format&fit=crop&q=80', title: 'Gastronomia & Pratos' },
      { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80', title: 'Ambiente Gourmet' },
      { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1000&auto=format&fit=crop&q=80', title: 'Café & Confeitaria' },
    ],
  },
  {
    category: 'Advocacia, Saúde & Consultoria',
    images: [
      { url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000&auto=format&fit=crop&q=80', title: 'Direito & Escritório' },
      { url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1000&auto=format&fit=crop&q=80', title: 'Saúde & Medicina' },
      { url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1000&auto=format&fit=crop&q=80', title: 'Consultoria Financeira' },
      { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&auto=format&fit=crop&q=80', title: 'Escritório Executivo' },
    ],
  },
];

export default function ImagePickerModal({
  isOpen,
  onClose,
  onSelectImage,
  currentImage = '',
}: ImagePickerModalProps) {
  const [activeTab, setActiveTab] = useState<'stock' | 'url' | 'upload'>('stock');
  const [urlInput, setUrlInput] = useState(currentImage);
  const [selectedCategory, setSelectedCategory] = useState(STOCK_COLLECTIONS[0].category);

  if (!isOpen) return null;

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onSelectImage(urlInput.trim());
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSelectImage(reader.result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const currentCategoryData = STOCK_COLLECTIONS.find((c) => c.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Biblioteca de Imagens do Website</h3>
              <p className="text-[11px] text-slate-400">Escolha uma foto profissional ou faça upload do seu computador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs de Seleção */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-[#0f172a]">
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 pb-3 px-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'stock'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Fotos Profissionais
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 pb-3 px-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload do Computador
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 pb-3 px-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'url'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Link URL Externo
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'stock' && (
            <div className="space-y-4">
              {/* Filtro de Categorias */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {STOCK_COLLECTIONS.map((col) => (
                  <button
                    key={col.category}
                    onClick={() => setSelectedCategory(col.category)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                      selectedCategory === col.category
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {col.category}
                  </button>
                ))}
              </div>

              {/* Grelha de Fotos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {currentCategoryData?.images.map((img) => {
                  const isSelected = currentImage === img.url;
                  return (
                    <div
                      key={img.url}
                      onClick={() => {
                        onSelectImage(img.url);
                        onClose();
                      }}
                      className={`group relative aspect-[4/3] rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-102 ${
                        isSelected ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-800 hover:border-blue-400'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.title}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition p-2.5 flex flex-col justify-end">
                        <span className="text-[11px] font-bold text-white leading-tight">{img.title}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700/80 hover:border-blue-500 rounded-2xl p-10 text-center transition bg-slate-900/40">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Carregar Imagem do Dispositivo</h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Suporta ficheiros JPG, PNG, WebP e SVG até 10MB. A imagem será otimizada para o website.
              </p>
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/30">
                Selecionar Ficheiro
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Endereço URL da Imagem</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    onClick={handleApplyUrl}
                    disabled={!urlInput.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition"
                  >
                    Aplicar
                  </button>
                </div>
              </div>

              {urlInput && (
                <div>
                  <span className="block text-[11px] text-slate-400 mb-2">Pré-visualização do link:</span>
                  <div className="relative aspect-[16/9] max-w-md rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                    <img
                      src={urlInput}
                      alt="Pré-visualização"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';
// ============================================================================
// 🎨 WEHOSTHERE VISUAL BUILDER - BARRA LATERAL ESQUERDA (Elementor-like)
// ============================================================================

import { useState, useCallback } from 'react';
import {
  Layout, Box, Grid3X3, Rows3, Columns2, Navigation, PanelBottom,
  Heading, AlignLeft, MousePointerClick, Image, Sparkles, Tag, Minus,
  MoveVertical, SquareCode, CheckCircle2, CreditCard, Quote, HelpCircle,
  Mail, MessageCircle, Code, Search, ChevronDown, ChevronRight,
  Eye, EyeOff, Lock, Unlock, Trash2, Copy, ArrowUp, ArrowDown,
  FilePlus, FileX, FileText, Settings, GripVertical, Layers3,
  LayoutGrid, BookOpen, Plus, X, Globe, Info,
} from 'lucide-react';
import { SiteDocument, VisualComponent, PageDocument } from '@/lib/builder/types';
import { COMPONENT_CATALOG, ComponentMeta } from '@/lib/builder/defaultComponents';
import { moveComponentOrder, addPageToDocument, removePageFromDocument } from '@/lib/builder/documentActions';

// ─── Mapeamento de Ícones Lucide por Nome ────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Layout, Box, Grid3X3, Rows: Rows3, Columns: Columns2, Navigation, PanelBottom,
  Heading, AlignLeft, MousePointerClick, Image, Sparkles, Tag, Minus, MoveVertical,
  SquareCode, CheckCircle2, CreditCard, Quote, HelpCircle, Mail, MessageCircle, Code,
};

function LucideIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Box;
  return <Icon className={className} />;
}

// ─── Tipos ───────────────────────────────────────────────────────────────────
type LeftTab = 'elements' | 'layers' | 'pages';

interface Props {
  siteDocument: SiteDocument;
  selectedComponentId: string | null;
  onInsertComponent: (type: string) => void;
  onSelectComponent: (id: string | null) => void;
  onUpdateDocument: (doc: SiteDocument) => void;
  onDeleteComponent: (id: string) => void;
  onDuplicateComponent: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

// ─── Componente de Item da Camada (Recursivo) ─────────────────────────────────
interface LayerItemProps {
  component: VisualComponent;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}

function LayerItem({
  component, depth, selectedId, onSelect, onDelete, onDuplicate,
  onMoveUp, onMoveDown, onToggleVisibility, expandedIds, onToggleExpand,
}: LayerItemProps) {
  const isSelected = selectedId === component.id;
  const isExpanded = expandedIds.has(component.id);
  const hasChildren = component.children && component.children.length > 0;
  const meta = COMPONENT_CATALOG.find((c) => c.type === component.type);
  const iconName = meta?.icon || 'Box';

  return (
    <div className="select-none">
      {/* Linha da Camada */}
      <div
        className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150 ${
          isSelected
            ? 'bg-blue-600/25 border border-blue-500/50 text-white'
            : 'hover:bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(component.id)}
      >
        {/* Botão de expandir */}
        <button
          onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggleExpand(component.id); }}
          className={`w-4 h-4 flex items-center justify-center flex-shrink-0 transition-transform ${
            hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } ${isExpanded ? 'rotate-90' : ''}`}
        >
          <ChevronRight className="w-3 h-3" />
        </button>

        {/* Ícone do tipo de componente */}
        <span className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>
          <LucideIcon name={iconName} className="w-3.5 h-3.5" />
        </span>

        {/* Nome do Componente */}
        <span className="text-[12px] font-medium truncate flex-1 min-w-0">
          {component.name}
        </span>

        {/* Ações rápidas - aparecem no hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0">
          <button
            title="Mover acima"
            onClick={(e) => { e.stopPropagation(); onMoveUp(component.id); }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition text-slate-400 hover:text-slate-200"
          >
            <ArrowUp className="w-2.5 h-2.5" />
          </button>
          <button
            title="Mover abaixo"
            onClick={(e) => { e.stopPropagation(); onMoveDown(component.id); }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition text-slate-400 hover:text-slate-200"
          >
            <ArrowDown className="w-2.5 h-2.5" />
          </button>
          <button
            title={component.hidden ? 'Mostrar' : 'Ocultar'}
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(component.id); }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition text-slate-400 hover:text-slate-200"
          >
            {component.hidden ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
          </button>
          <button
            title="Duplicar"
            onClick={(e) => { e.stopPropagation(); onDuplicate(component.id); }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition text-slate-400 hover:text-slate-200"
          >
            <Copy className="w-2.5 h-2.5" />
          </button>
          <button
            title="Eliminar"
            onClick={(e) => { e.stopPropagation(); onDelete(component.id); }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 transition text-slate-400 hover:text-red-400"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Filhos */}
      {hasChildren && isExpanded && (
        <div className="border-l border-slate-700/50 ml-5">
          {component.children.map((child) => (
            <LayerItem
              key={child.id}
              component={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onToggleVisibility={onToggleVisibility}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Aba: Biblioteca de Elementos ────────────────────────────────────────────
function ElementsTab({ onInsert }: { onInsert: (type: string) => void }) {
  const [search, setSearch] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('blocks');

  const categories: { id: string; label: string; icon: React.ElementType }[] = [
    { id: 'layout', label: 'Layout & Estrutura', icon: LayoutGrid },
    { id: 'basic', label: 'Conteúdo Básico', icon: AlignLeft },
    { id: 'blocks', label: 'Blocos Prontos', icon: Layers3 },
  ];

  const filtered = COMPONENT_CATALOG.filter((c) =>
    search === '' ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  const getItemsForCategory = (catId: string) =>
    filtered.filter((c) => c.category === catId);

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Barra de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          placeholder="Pesquisar elemento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-[12px] bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <X className="w-3 h-3 text-slate-500 hover:text-slate-300" />
          </button>
        )}
      </div>

      {/* Categorias de elementos */}
      <div className="flex flex-col gap-2">
        {categories.map((cat) => {
          const items = getItemsForCategory(cat.id);
          if (items.length === 0) return null;
          const isOpen = search !== '' || expandedCategory === cat.id;

          return (
            <div key={cat.id} className="rounded-xl overflow-hidden border border-slate-700/40">
              {/* Cabeçalho da categoria */}
              <button
                onClick={() => setExpandedCategory(isOpen && search === '' ? null : cat.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800/50 hover:bg-slate-700/40 transition text-left"
              >
                <div className="flex items-center gap-2">
                  <cat.icon className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">{cat.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">{items.length}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Grelha de itens */}
              {isOpen && (
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-900/30">
                  {items.map((item) => (
                    <ComponentCard key={item.type} meta={item} onInsert={onInsert} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComponentCard({ meta, onInsert }: { meta: ComponentMeta; onInsert: (type: string) => void }) {
  return (
    <button
      onClick={() => onInsert(meta.type)}
      title={meta.description}
      className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-slate-700/30 bg-slate-800/30 hover:bg-blue-600/15 hover:border-blue-500/50 transition-all duration-200 cursor-pointer text-center"
    >
      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/50 group-hover:bg-blue-600/20 transition text-slate-400 group-hover:text-blue-400">
        <LucideIcon name={meta.icon} className="w-4 h-4" />
      </div>
      <span className="text-[10.5px] font-medium text-slate-400 group-hover:text-slate-200 leading-tight transition line-clamp-2">
        {meta.title}
      </span>
    </button>
  );
}

// ─── Aba: Navegador de Camadas ────────────────────────────────────────────────
function LayersTab({
  siteDocument,
  selectedComponentId,
  onSelectComponent,
  onUpdateDocument,
  onDeleteComponent,
  onDuplicateComponent,
  onToggleVisibility,
}: Pick<Props, 'siteDocument' | 'selectedComponentId' | 'onSelectComponent' | 'onUpdateDocument' | 'onDeleteComponent' | 'onDuplicateComponent' | 'onToggleVisibility'>) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const activePage =
    siteDocument.pages.find((p) => p.id === siteDocument.activePageId) ||
    siteDocument.pages[0];
  const rootComponents = activePage?.rootComponents || [];

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleMoveUp = (id: string) => {
    onUpdateDocument(moveComponentOrder(siteDocument, id, 'up'));
  };
  const handleMoveDown = (id: string) => {
    onUpdateDocument(moveComponentOrder(siteDocument, id, 'down'));
  };

  if (rootComponents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
        <Layers3 className="w-10 h-10 text-slate-700" />
        <p className="text-slate-500 text-xs">
          A página está em branco. Adicione elementos pela aba{' '}
          <span className="text-blue-400 font-medium">Elementos</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {/* Info do total de camadas */}
      <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-700/40 mb-1">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Camadas</span>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
          {rootComponents.length} secções
        </span>
      </div>

      {rootComponents.map((comp) => (
        <LayerItem
          key={comp.id}
          component={comp}
          depth={0}
          selectedId={selectedComponentId}
          onSelect={onSelectComponent}
          onDelete={onDeleteComponent}
          onDuplicate={onDuplicateComponent}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onToggleVisibility={onToggleVisibility}
          expandedIds={expandedIds}
          onToggleExpand={toggleExpand}
        />
      ))}
    </div>
  );
}

// ─── Aba: Gestor de Páginas ───────────────────────────────────────────────────
function PagesTab({
  siteDocument,
  onUpdateDocument,
}: Pick<Props, 'siteDocument' | 'onUpdateDocument'>) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');

  const handleAddPage = () => {
    if (!newTitle.trim() || !newSlug.trim()) return;
    const slug = newSlug.startsWith('/') ? newSlug : `/${newSlug}`;
    const updated = addPageToDocument(siteDocument, newTitle.trim(), slug);
    onUpdateDocument(updated);
    setIsAdding(false);
    setNewTitle('');
    setNewSlug('');
  };

  const handleSwitchPage = (pageId: string) => {
    onUpdateDocument({ ...siteDocument, activePageId: pageId });
  };

  const handleDeletePage = (pageId: string) => {
    if (siteDocument.pages.length <= 1) return;
    onUpdateDocument(removePageFromDocument(siteDocument, pageId));
  };

  const slugFromTitle = (t: string) =>
    t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Lista de páginas */}
      <div className="flex flex-col gap-1.5">
        {siteDocument.pages.map((page) => {
          const isActive = page.id === siteDocument.activePageId;
          return (
            <div
              key={page.id}
              className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600/20 border-blue-500/50 text-white'
                  : 'bg-slate-800/30 border-slate-700/30 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
              onClick={() => handleSwitchPage(page.id)}
            >
              <FileText className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[12px] font-semibold truncate">{page.title}</span>
                <span className="text-[10px] text-slate-500 truncate font-mono">{page.slug}</span>
              </div>
              {isActive && (
                <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  Ativa
                </span>
              )}
              {!isActive && siteDocument.pages.length > 1 && (
                <button
                  title="Eliminar página"
                  onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id); }}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/20 transition text-slate-500 hover:text-red-400"
                >
                  <FileX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Formulário de nova página */}
      {isAdding ? (
        <div className="flex flex-col gap-2 p-3 rounded-xl border border-blue-500/30 bg-blue-600/5">
          <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Nova Página</p>
          <input
            type="text"
            placeholder="Título (ex: Sobre Nós)"
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              setNewSlug(slugFromTitle(e.target.value));
            }}
            autoFocus
            className="w-full px-3 py-2 text-[12px] bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[12px] font-mono">/</span>
            <input
              type="text"
              placeholder="slug-da-pagina"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="flex-1 px-3 py-2 text-[12px] bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddPage}
              disabled={!newTitle.trim() || !newSlug.trim()}
              className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12px] font-semibold transition"
            >
              Criar Página
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewTitle(''); setNewSlug(''); }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[12px] transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-600 hover:border-blue-500/60 hover:bg-blue-600/5 text-slate-500 hover:text-blue-400 text-[12px] font-medium transition-all"
        >
          <FilePlus className="w-3.5 h-3.5" />
          Adicionar Nova Página
        </button>
      )}

      {/* Info de SEO */}
      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30">
        <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-[10.5px] text-slate-500 leading-relaxed">
          Cada página tem o seu próprio conjunto de secções e componentes. As alterações de tema e configurações globais aplicam-se a todas as páginas.
        </p>
      </div>
    </div>
  );
}

// ─── Componente Principal: LeftSidebar ───────────────────────────────────────
export default function LeftSidebar({
  siteDocument,
  selectedComponentId,
  onInsertComponent,
  onSelectComponent,
  onUpdateDocument,
  onDeleteComponent,
  onDuplicateComponent,
  onToggleVisibility,
}: Props) {
  const [activeTab, setActiveTab] = useState<LeftTab>('elements');

  const activePage =
    siteDocument.pages.find((p) => p.id === siteDocument.activePageId) ||
    siteDocument.pages[0];

  const tabs: { id: LeftTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'elements', label: 'Elementos', icon: LayoutGrid },
    {
      id: 'layers',
      label: 'Camadas',
      icon: Layers3,
      badge: activePage?.rootComponents?.length || 0,
    },
    { id: 'pages', label: 'Páginas', icon: BookOpen, badge: siteDocument.pages.length },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0f1117] border-r border-slate-800/80 w-72 min-w-[288px] max-w-[288px] flex-shrink-0">
      {/* Cabeçalho */}
      <div className="flex flex-col border-b border-slate-800/80 flex-shrink-0">
        {/* Tabs em Grid Equilibrada */}
        <div className="grid grid-cols-3 p-1 gap-1 bg-slate-900/60 rounded-xl m-2 border border-slate-800/60">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all relative ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title={tab.label}
            >
              <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[9px] px-1 py-0 rounded-full font-bold leading-none ${
                  activeTab === tab.id
                    ? 'bg-blue-800/80 text-blue-100'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sub-info da aba ativa */}
        <div className="px-3 py-1.5">
          {activeTab === 'layers' && (
            <p className="text-[10px] text-slate-600 truncate">
              Página: <span className="text-slate-500">{activePage?.title || '-'}</span>
              <span className="font-mono ml-1 text-slate-600">{activePage?.slug || ''}</span>
            </p>
          )}
          {activeTab === 'elements' && (
            <p className="text-[10px] text-slate-600">Clique para inserir na página</p>
          )}
          {activeTab === 'pages' && (
            <p className="text-[10px] text-slate-600">
              {siteDocument.pages.length} página{siteDocument.pages.length !== 1 ? 's' : ''} neste site
            </p>
          )}
        </div>
      </div>

      {/* Conteúdo da Tab (scroll) */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
        {activeTab === 'elements' && (
          <ElementsTab onInsert={onInsertComponent} />
        )}
        {activeTab === 'layers' && (
          <LayersTab
            siteDocument={siteDocument}
            selectedComponentId={selectedComponentId}
            onSelectComponent={onSelectComponent}
            onUpdateDocument={onUpdateDocument}
            onDeleteComponent={onDeleteComponent}
            onDuplicateComponent={onDuplicateComponent}
            onToggleVisibility={onToggleVisibility}
          />
        )}
        {activeTab === 'pages' && (
          <PagesTab
            siteDocument={siteDocument}
            onUpdateDocument={onUpdateDocument}
          />
        )}
      </div>

      {/* Rodapé com info do site */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-800/80 flex-shrink-0">
        <Globe className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
        <span className="text-[10.5px] text-slate-600 truncate flex-1">
          {siteDocument.site.subdomain
            ? `${siteDocument.site.subdomain}.wehosthere.co.mz`
            : siteDocument.site.name}
        </span>
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
      </div>
    </div>
  );
}

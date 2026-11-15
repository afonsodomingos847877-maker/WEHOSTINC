'use client';
// ============================================================================
// 🎨 WEHOSTHERE VISUAL BUILDER - BARRA LATERAL DIREITA (Inspector de Estilos)
// ============================================================================

import { useState } from 'react';
import {
  Type, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Palette, Move, Box, Frame, Monitor, Tablet, Smartphone,
  ChevronDown, ChevronRight, Eye, EyeOff, Lock, Unlock,
  Bold, Italic, Underline, Link, Image as ImageIcon, Sparkles,
  Layers, MousePointerClick, Globe, Hash, ArrowUpDown, FileText,
} from 'lucide-react';
import { SiteDocument, VisualComponent, StyleProps, DeviceBreakpoint } from '@/lib/builder/types';
import { updateComponentInDocument } from '@/lib/builder/documentActions';

interface RightSidebarProps {
  siteDocument: SiteDocument;
  selectedComponentId: string | null;
  deviceMode: DeviceBreakpoint;
  onUpdateDocument: (doc: SiteDocument) => void;
  onOpenImagePicker?: (id: string, currentSrc: string) => void;
}

// ─── Utilitários ─────────────────────────────────────────────────────────────
function findComponentById(nodes: VisualComponent[], id: string): VisualComponent | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findComponentById(node.children || [], id);
    if (found) return found;
  }
  return null;
}

function getStyles(comp: VisualComponent, device: DeviceBreakpoint): StyleProps {
  if (device === 'mobile' && comp.styles.mobile) return { ...comp.styles.desktop, ...comp.styles.mobile };
  if (device === 'tablet' && comp.styles.tablet) return { ...comp.styles.desktop, ...comp.styles.tablet };
  return comp.styles.desktop || {};
}

// ─── Painel Colapsável ────────────────────────────────────────────────────────
function Panel({ title, icon: Icon, defaultOpen = false, children }: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-800/60 last:border-none">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-blue-400/80" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        </div>
        <ChevronDown className={`w-3 h-3 text-slate-600 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

// ─── Campo de Input com label ─────────────────────────────────────────────────
function StyleInput({ label, value, onChange, placeholder, type = 'text', className = '' }: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 text-[12px] bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition"
      />
    </div>
  );
}

// ─── Color Picker com preview ──────────────────────────────────────────────────
function ColorInput({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value?.startsWith('#') ? value : '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded-lg border border-slate-700 cursor-pointer bg-transparent p-0.5 overflow-hidden"
          />
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ex: #3b82f6 ou rgba(59,130,246,0.5)"
          className="flex-1 px-2.5 py-1.5 text-[11px] bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition font-mono"
        />
      </div>
    </div>
  );
}

// ─── Grupo de Botões (alinhamento, etc) ────────────────────────────────────────
function ButtonGroup<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: { value: T; icon: React.ElementType; title: string }[];
  value?: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</label>
      <div className="flex gap-1">
        {options.map(({ value: v, icon: Icon, title }) => (
          <button
            key={v}
            title={title}
            onClick={() => onChange(v)}
            className={`flex-1 flex items-center justify-center py-1.5 rounded-lg border transition ${
              value === v
                ? 'bg-blue-600/25 border-blue-500/50 text-blue-400'
                : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Seção de Espaçamento (Padding / Margin) ──────────────────────────────────
function SpacingControl({ label, top, right, bottom, left, onChange }: {
  label: string;
  top?: string; right?: string; bottom?: string; left?: string;
  onChange: (side: 'Top' | 'Right' | 'Bottom' | 'Left', v: string) => void;
}) {
  const [linked, setLinked] = useState(false);

  const handleChange = (side: 'Top' | 'Right' | 'Bottom' | 'Left', v: string) => {
    if (linked) {
      onChange('Top', v);
      onChange('Right', v);
      onChange('Bottom', v);
      onChange('Left', v);
    } else {
      onChange(side, v);
    }
  };

  const inputClass = "w-full px-1.5 py-1 text-[11px] bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500/60 transition text-center font-mono";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</label>
        <button
          onClick={() => setLinked((l) => !l)}
          title={linked ? 'Desligar valores iguais' : 'Ligar valores iguais'}
          className="text-slate-600 hover:text-slate-300 transition"
        >
          {linked ? <Lock className="w-3 h-3 text-blue-400" /> : <Unlock className="w-3 h-3" />}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {([['Top', top], ['Right', right], ['Bottom', bottom], ['Left', left]] as const).map(([side, val]) => (
          <div key={side} className="flex flex-col items-center gap-0.5">
            <input
              type="text"
              value={val || ''}
              onChange={(e) => handleChange(side, e.target.value)}
              placeholder="0"
              className={inputClass}
            />
            <span className="text-[9px] text-slate-700 uppercase">{side[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Painel de Tipografia ──────────────────────────────────────────────────────
function TypographyPanel({ styles, onChange }: { styles: StyleProps; onChange: (key: keyof StyleProps, v: string) => void }) {
  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px', '60px', '72px'];
  const fontWeights = [
    { label: 'Fino', value: '100' },
    { label: 'Leve', value: '300' },
    { label: 'Normal', value: '400' },
    { label: 'Médio', value: '500' },
    { label: 'SemiBold', value: '600' },
    { label: 'Bold', value: '700' },
    { label: 'ExtraBold', value: '800' },
    { label: 'Black', value: '900' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Família de fonte */}
      <StyleInput
        label="Família da Fonte"
        value={styles.fontFamily}
        onChange={(v) => onChange('fontFamily', v)}
        placeholder="ex: Inter, Outfit, Poppins"
      />

      {/* Tamanho */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-slate-600 uppercase tracking-wider">Tamanho</label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={styles.fontSize || ''}
            onChange={(e) => onChange('fontSize', e.target.value)}
            placeholder="16px"
            className="flex-1 px-2.5 py-1.5 text-[12px] bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition font-mono"
          />
          <select
            value={styles.fontSize || ''}
            onChange={(e) => onChange('fontSize', e.target.value)}
            className="px-2 py-1.5 text-[11px] bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-400 focus:outline-none focus:border-blue-500/60 transition"
          >
            <option value="">Escala</option>
            {fontSizes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Peso */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-slate-600 uppercase tracking-wider">Peso / Espessura</label>
        <select
          value={styles.fontWeight || ''}
          onChange={(e) => onChange('fontWeight', e.target.value)}
          className="w-full px-2.5 py-1.5 text-[12px] bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500/60 transition"
        >
          <option value="">Padrão</option>
          {fontWeights.map(({ label, value }) => (
            <option key={value} value={value}>{label} ({value})</option>
          ))}
        </select>
      </div>

      {/* Altura da linha */}
      <div className="grid grid-cols-2 gap-2">
        <StyleInput
          label="Altura da Linha"
          value={styles.lineHeight}
          onChange={(v) => onChange('lineHeight', v)}
          placeholder="1.5"
        />
        <StyleInput
          label="Espaçamento Letras"
          value={styles.letterSpacing}
          onChange={(v) => onChange('letterSpacing', v)}
          placeholder="0px"
        />
      </div>

      {/* Alinhamento */}
      <ButtonGroup
        label="Alinhamento"
        value={styles.textAlign}
        onChange={(v) => onChange('textAlign', v)}
        options={[
          { value: 'left', icon: AlignLeft, title: 'Esquerda' },
          { value: 'center', icon: AlignCenter, title: 'Centro' },
          { value: 'right', icon: AlignRight, title: 'Direita' },
          { value: 'justify', icon: AlignJustify, title: 'Justificado' },
        ]}
      />

      {/* Cor do texto */}
      <ColorInput label="Cor do Texto" value={styles.color} onChange={(v) => onChange('color', v)} />
    </div>
  );
}

// ─── Painel de Fundo ─────────────────────────────────────────────────────────
function BackgroundPanel({ styles, onChange }: { styles: StyleProps; onChange: (key: keyof StyleProps, v: string) => void }) {
  const [bgMode, setBgMode] = useState<'color' | 'image' | 'gradient'>(
    styles.backgroundGradient ? 'gradient' : styles.backgroundImage ? 'image' : 'color'
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Modo de fundo */}
      <div className="flex gap-1">
        {([
          ['color', 'Cor'],
          ['gradient', 'Gradiente'],
          ['image', 'Imagem'],
        ] as const).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setBgMode(mode)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition ${
              bgMode === mode
                ? 'bg-blue-600/25 border-blue-500/50 text-blue-400'
                : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {bgMode === 'color' && (
        <ColorInput
          label="Cor de Fundo"
          value={styles.backgroundColor}
          onChange={(v) => onChange('backgroundColor', v)}
        />
      )}

      {bgMode === 'gradient' && (
        <StyleInput
          label="Classes Tailwind CSS de Gradiente"
          value={styles.backgroundGradient}
          onChange={(v) => onChange('backgroundGradient', v)}
          placeholder="ex: from-blue-600 to-indigo-800"
        />
      )}

      {bgMode === 'image' && (
        <div className="flex flex-col gap-2">
          <StyleInput
            label="URL da Imagem"
            value={styles.backgroundImage}
            onChange={(v) => onChange('backgroundImage', v)}
            placeholder="https://exemplo.com/img.jpg"
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-600 uppercase tracking-wider">Tamanho</label>
              <select
                value={styles.backgroundSize || ''}
                onChange={(e) => onChange('backgroundSize', e.target.value)}
                className="w-full px-2.5 py-1.5 text-[12px] bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500/60 transition"
              >
                <option value="">Auto</option>
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-600 uppercase tracking-wider">Posição</label>
              <select
                value={styles.backgroundPosition || ''}
                onChange={(e) => onChange('backgroundPosition', e.target.value)}
                className="w-full px-2.5 py-1.5 text-[12px] bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500/60 transition"
              >
                <option value="">Auto</option>
                <option value="center">Centro</option>
                <option value="top">Topo</option>
                <option value="bottom">Inferior</option>
                <option value="left">Esquerda</option>
                <option value="right">Direita</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Painel de Dimensões & Espaçamento ────────────────────────────────────────
function DimensionsPanel({ styles, onChange }: { styles: StyleProps; onChange: (key: keyof StyleProps, v: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Largura & Altura */}
      <div className="grid grid-cols-2 gap-2">
        <StyleInput label="Largura" value={styles.width} onChange={(v) => onChange('width', v)} placeholder="100%" />
        <StyleInput label="Altura" value={styles.height} onChange={(v) => onChange('height', v)} placeholder="auto" />
        <StyleInput label="Larg. Máx." value={styles.maxWidth} onChange={(v) => onChange('maxWidth', v)} placeholder="1280px" />
        <StyleInput label="Alt. Mín." value={styles.minHeight} onChange={(v) => onChange('minHeight', v)} placeholder="200px" />
      </div>

      {/* Espaçamento Externo (Margin) */}
      <SpacingControl
        label="Margem (Margin)"
        top={styles.marginTop} right={styles.marginRight}
        bottom={styles.marginBottom} left={styles.marginLeft}
        onChange={(side, v) => onChange((`margin${side}`) as keyof StyleProps, v)}
      />

      {/* Espaçamento Interno (Padding) */}
      <SpacingControl
        label="Preenchimento (Padding)"
        top={styles.paddingTop} right={styles.paddingRight}
        bottom={styles.paddingBottom} left={styles.paddingLeft}
        onChange={(side, v) => onChange((`padding${side}`) as keyof StyleProps, v)}
      />
    </div>
  );
}

// ─── Painel de Bordas ─────────────────────────────────────────────────────────
function BorderPanel({ styles, onChange }: { styles: StyleProps; onChange: (key: keyof StyleProps, v: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <StyleInput label="Espessura" value={styles.borderWidth} onChange={(v) => onChange('borderWidth', v)} placeholder="1px" />
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-600 uppercase tracking-wider">Estilo</label>
          <select
            value={styles.borderStyle || ''}
            onChange={(e) => onChange('borderStyle', e.target.value)}
            className="w-full px-2.5 py-1.5 text-[12px] bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500/60 transition"
          >
            <option value="">Nenhum</option>
            <option value="solid">Sólida</option>
            <option value="dashed">Tracejada</option>
            <option value="dotted">Ponteada</option>
          </select>
        </div>
      </div>
      <ColorInput label="Cor da Borda" value={styles.borderColor} onChange={(v) => onChange('borderColor', v)} />
      <StyleInput
        label="Cantos Arredondados (Border Radius)"
        value={styles.borderRadius}
        onChange={(v) => onChange('borderRadius', v)}
        placeholder="ex: 12px, 9999px, rounded-2xl"
      />
      <StyleInput
        label="Sombra (Box Shadow)"
        value={styles.boxShadow}
        onChange={(v) => onChange('boxShadow', v)}
        placeholder="ex: 0 10px 25px rgba(0,0,0,0.3)"
      />
    </div>
  );
}

// ─── Painel Avançado (Classes livres, Posicionamento) ─────────────────────────
function AdvancedPanel({ styles, onChange }: { styles: StyleProps; onChange: (key: keyof StyleProps, v: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <StyleInput
        label="Classes Tailwind CSS Livres"
        value={styles.customClasses}
        onChange={(v) => onChange('customClasses', v)}
        placeholder="ex: animate-pulse transition-all"
      />
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-slate-600 uppercase tracking-wider">Posicionamento</label>
        <select
          value={styles.position || ''}
          onChange={(e) => onChange('position', e.target.value)}
          className="w-full px-2.5 py-1.5 text-[12px] bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500/60 transition"
        >
          <option value="">Padrão (static)</option>
          <option value="relative">Relativo</option>
          <option value="absolute">Absoluto</option>
          <option value="fixed">Fixo</option>
          <option value="sticky">Pegajoso (sticky)</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StyleInput label="Top" value={styles.top} onChange={(v) => onChange('top', v)} placeholder="auto" />
        <StyleInput label="Right" value={styles.right} onChange={(v) => onChange('right', v)} placeholder="auto" />
        <StyleInput label="Bottom" value={styles.bottom} onChange={(v) => onChange('bottom', v)} placeholder="auto" />
        <StyleInput label="Left" value={styles.left} onChange={(v) => onChange('left', v)} placeholder="auto" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StyleInput label="Z-index" value={String(styles.zIndex || '')} onChange={(v) => onChange('zIndex', v)} placeholder="auto" />
        <StyleInput label="Opacidade (0-1)" value={String(styles.opacity || '')} onChange={(v) => onChange('opacity', v)} placeholder="1" />
      </div>
    </div>
  );
}

// ─── Painel de Conteúdo (Textos, Links, Imagens) ─────────────────────────────
function ContentPanel({
  comp,
  onChangeContent,
  onOpenImagePicker,
}: {
  comp: VisualComponent;
  onChangeContent: (key: string, value: any) => void;
  onOpenImagePicker?: (id: string, currentSrc: string) => void;
}) {
  const content = comp.content || {};

  return (
    <div className="flex flex-col gap-3">
      {/* Título / Texto */}
      {(comp.type === 'heading' || comp.type === 'text' || typeof content.text === 'string') && (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Texto do Bloco</label>
          <textarea
            rows={comp.type === 'heading' ? 2 : 4}
            value={content.text || ''}
            onChange={(e) => onChangeContent('text', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition resize-none font-sans"
            placeholder="Insira o texto..."
          />
        </div>
      )}

      {/* Nível de Cabeçalho H1-H6 */}
      {comp.type === 'heading' && (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Nível de Título</label>
          <div className="grid grid-cols-6 gap-1">
            {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onChangeContent('headingLevel', lvl)}
                className={`py-1 text-[11px] font-bold uppercase rounded-lg border transition ${
                  (content.headingLevel || 'h2') === lvl
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subtítulo */}
      {typeof content.subtitle === 'string' && (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Subtítulo</label>
          <textarea
            rows={2}
            value={content.subtitle}
            onChange={(e) => onChangeContent('subtitle', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition resize-none"
          />
        </div>
      )}

      {/* Botão Texto & Link */}
      {(comp.type === 'button' || content.buttonText) && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Texto do Botão</label>
            <input
              type="text"
              value={content.buttonText || ''}
              onChange={(e) => onChangeContent('buttonText', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-blue-500"
              placeholder="Ex: Começar Agora"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Link de Destino</label>
            <input
              type="text"
              value={content.buttonLink || content.href || ''}
              onChange={(e) => {
                onChangeContent('buttonLink', e.target.value);
                onChangeContent('href', e.target.value);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
              placeholder="https:// ou #seccao"
            />
          </div>
        </>
      )}

      {/* Badge / Pill */}
      {(comp.type === 'badge' || typeof content.badgeText === 'string') && (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Texto do Badge</label>
          <input
            type="text"
            value={content.badgeText || ''}
            onChange={(e) => onChangeContent('badgeText', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Imagem */}
      {(comp.type === 'image' || typeof content.src === 'string') && (
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Imagem</label>
          {content.src && (
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
              <img src={content.src} alt={content.alt || 'Imagem'} className="w-full h-full object-cover" />
            </div>
          )}
          <button
            type="button"
            onClick={() => onOpenImagePicker && onOpenImagePicker(comp.id, content.src || '')}
            className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Mudar Imagem</span>
          </button>
          <input
            type="text"
            value={content.src || ''}
            onChange={(e) => onChangeContent('src', e.target.value)}
            className="w-full px-2.5 py-1 text-[11px] bg-slate-900 border border-slate-700/80 rounded-lg text-slate-300 font-mono focus:outline-none focus:border-blue-500"
            placeholder="URL direta da imagem..."
          />
        </div>
      )}

      {/* WhatsApp */}
      {comp.type === 'whatsapp-button' && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Número de WhatsApp</label>
            <input
              type="text"
              value={content.whatsappNumber || ''}
              onChange={(e) => onChangeContent('whatsappNumber', e.target.value)}
              placeholder="ex: 258841234567"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Mensagem Predefinida</label>
            <textarea
              rows={2}
              value={content.whatsappMessage || ''}
              onChange={(e) => onChangeContent('whatsappMessage', e.target.value)}
              placeholder="Olá! Gostaria de mais informações..."
              className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Painel de Visibilidade ────────────────────────────────────────────────────
function VisibilityPanel({ styles, onChange }: { styles: StyleProps; onChange: (key: keyof StyleProps, v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {([
        ['hiddenOnMobile', '📱 Ocultar em Mobile'],
        ['hiddenOnTablet', '📲 Ocultar em Tablet'],
        ['hiddenOnDesktop', '🖥️ Ocultar em Desktop'],
      ] as const).map(([key, label]) => (
        <label key={key} className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={!!(styles as Record<string, unknown>)[key]}
            onChange={(e) => onChange(key as keyof StyleProps, String(e.target.checked))}
            className="w-4 h-4 rounded accent-blue-600"
          />
          <span className="text-[12px] text-slate-400">{label}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Componente Principal: RightSidebar ──────────────────────────────────────
export default function RightSidebar({
  siteDocument,
  selectedComponentId,
  deviceMode,
  onUpdateDocument,
  onOpenImagePicker,
}: RightSidebarProps) {
  const [activeDevice, setActiveDevice] = useState<DeviceBreakpoint>('desktop');

  // Encontrar o componente selecionado
  const activePage =
    siteDocument.pages.find((p) => p.id === siteDocument.activePageId) ||
    siteDocument.pages[0];
  const selectedComponent = selectedComponentId
    ? findComponentById(activePage?.rootComponents || [], selectedComponentId)
    : null;

  const styles = selectedComponent ? getStyles(selectedComponent, activeDevice) : null;

  const handleStyleChange = (key: keyof StyleProps, value: string) => {
    if (!selectedComponent) return;

    const updated = updateComponentInDocument(siteDocument, selectedComponent.id, (comp) => {
      const deviceKey = activeDevice === 'desktop' ? 'desktop' : activeDevice;
      if (deviceKey === 'desktop') {
        return {
          ...comp,
          styles: {
            ...comp.styles,
            desktop: {
              ...comp.styles.desktop,
              [key]: value === '' ? undefined : value,
            },
          },
        };
      } else {
        return {
          ...comp,
          styles: {
            ...comp.styles,
            [deviceKey]: {
              ...(comp.styles[deviceKey] || {}),
              [key]: value === '' ? undefined : value,
            },
          },
        };
      }
    });

    onUpdateDocument(updated);
  };

  // ─── Estado vazio ─────────────────────────────────────────────────────────
  if (!selectedComponent || !styles) {
    return (
      <div className="w-64 min-w-[256px] max-w-[256px] bg-[#0f1117] border-l border-slate-800/80 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
          <MousePointerClick className="w-6 h-6 text-slate-600" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold text-slate-500">Nenhum elemento selecionado</p>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            Clique num elemento no canvas ou na árvore de camadas para inspecionar e editar os seus estilos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 min-w-[256px] max-w-[256px] bg-[#0f1117] border-l border-slate-800/80 flex flex-col h-full overflow-hidden">
      {/* Cabeçalho do Inspector */}
      <div className="flex flex-col gap-2 px-3 py-3 border-b border-slate-800/80 flex-shrink-0">
        {/* Info do componente */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-slate-200 truncate">{selectedComponent.name}</p>
            <p className="text-[10px] text-slate-600 font-mono">{selectedComponent.type}</p>
          </div>
        </div>

        {/* Seletor de dispositivo */}
        <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/40">
          {([
            ['desktop', Monitor],
            ['tablet', Tablet],
            ['mobile', Smartphone],
          ] as const).map(([device, Icon]) => (
            <button
              key={device}
              title={device}
              onClick={() => setActiveDevice(device)}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition ${
                activeDevice === device
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {activeDevice !== 'desktop' && (
          <p className="text-[10px] text-amber-400/70 text-center">
            ⚠️ Sobrepõe apenas para {activeDevice === 'mobile' ? 'Mobile' : 'Tablet'}
          </p>
        )}
      </div>

      {/* Painéis de estilo (scroll) */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
        <Panel title="Conteúdo & Textos" icon={FileText} defaultOpen>
          <ContentPanel
            comp={selectedComponent}
            onChangeContent={(key, val) => {
              const updated = updateComponentInDocument(siteDocument, selectedComponent.id, (c) => ({
                ...c,
                content: {
                  ...c.content,
                  [key]: val,
                },
              }));
              onUpdateDocument(updated);
            }}
            onOpenImagePicker={onOpenImagePicker}
          />
        </Panel>

        <Panel title="Tipografia" icon={Type} defaultOpen>
          <TypographyPanel styles={styles} onChange={handleStyleChange} />
        </Panel>

        <Panel title="Fundo & Cores" icon={Palette} defaultOpen>
          <BackgroundPanel styles={styles} onChange={handleStyleChange} />
        </Panel>

        <Panel title="Dimensões & Espaçamento" icon={Move} defaultOpen>
          <DimensionsPanel styles={styles} onChange={handleStyleChange} />
        </Panel>

        <Panel title="Borda & Sombra" icon={Frame}>
          <BorderPanel styles={styles} onChange={handleStyleChange} />
        </Panel>

        <Panel title="Visibilidade por Dispositivo" icon={Eye}>
          <VisibilityPanel styles={styles} onChange={handleStyleChange} />
        </Panel>

        <Panel title="Avançado" icon={Hash}>
          <AdvancedPanel styles={styles} onChange={handleStyleChange} />
        </Panel>
      </div>

      {/* ID do componente (debug info) */}
      <div className="px-3 py-2 border-t border-slate-800/60 flex-shrink-0">
        <p className="text-[9px] text-slate-700 font-mono truncate" title={selectedComponent.id}>
          ID: {selectedComponent.id}
        </p>
      </div>
    </div>
  );
}

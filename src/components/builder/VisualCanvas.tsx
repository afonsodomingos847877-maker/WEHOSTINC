'use client';
// ============================================================================
// 🖥️ WEHOSTHERE VISUAL BUILDER - CANVAS VISUAL (iframe com bridge postMessage)
// ============================================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { 
  Laptop, Tablet, Smartphone, RefreshCw, ZoomIn, ZoomOut, 
  ArrowUp, ArrowDown, Copy, Trash2, X, Image as ImageIcon, Sparkles, Loader2, MousePointer
} from 'lucide-react';
import { SiteDocument } from '@/lib/builder/types';
import { compileSiteDocumentToHtml } from '@/lib/builder/htmlCompiler';
import { findComponentInDocument } from '@/lib/builder/documentActions';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface CanvasProps {
  siteDocument: SiteDocument;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  deviceMode: DeviceMode;
  onDeviceModeChange: (mode: DeviceMode) => void;
  onUpdateText?: (id: string, text: string) => void;
  onOpenImagePicker?: (id: string, currentSrc: string) => void;
  onOpenAddSection?: (insertIndex?: number) => void;
  onMoveComponent?: (id: string, direction: 'up' | 'down') => void;
  onDuplicateComponent?: (id: string) => void;
  onDeleteComponent?: (id: string) => void;
  onOpenAiForComponent?: (id: string) => void;
}

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

const DEVICE_LABELS: Record<DeviceMode, string> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
};

// ─── Hook: Compilar o SiteDocument para HTML ─────────────────────────────────
function useCompiledHtml(siteDocument: SiteDocument, selectedId: string | null): string {
  // Compila sempre que o documento mudar
  const html = compileSiteDocumentToHtml(siteDocument, undefined, true);
  return html;
}

export default function VisualCanvas({
  siteDocument,
  selectedComponentId,
  onSelectComponent,
  deviceMode,
  onDeviceModeChange,
  onUpdateText,
  onOpenImagePicker,
  onOpenAddSection,
  onMoveComponent,
  onDuplicateComponent,
  onDeleteComponent,
  onOpenAiForComponent,
}: CanvasProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [iframeKey, setIframeKey] = useState(0);

  const compiledHtml = useCompiledHtml(siteDocument, selectedComponentId);
  const selectedComponent = selectedComponentId ? findComponentInDocument(siteDocument, selectedComponentId) : null;

  // ─── Injetar HTML no iframe via srcdoc ───────────────────────────────────
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setIsLoading(true);
    iframe.srcdoc = compiledHtml;
  }, [compiledHtml]);

  // ─── Ouvir mensagens postMessage do iframe ───────────────────────────────
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      const { type, componentId, newText, currentSrc, insertIndex } = event.data;

      if (type === 'COMPONENT_CLICKED') {
        onSelectComponent(componentId || null);
      }
      if (type === 'UPDATE_COMPONENT_TEXT' && componentId && typeof newText === 'string') {
        if (onUpdateText) {
          onUpdateText(componentId, newText);
        }
      }
      if (type === 'OPEN_IMAGE_PICKER' && componentId) {
        if (onOpenImagePicker) {
          onOpenImagePicker(componentId, currentSrc || '');
        }
      }
      if (type === 'OPEN_ADD_SECTION') {
        if (onOpenAddSection) {
          onOpenAddSection(typeof insertIndex === 'number' ? insertIndex : undefined);
        }
      }
      if (type === 'CANVAS_READY') {
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSelectComponent, onUpdateText, onOpenImagePicker, onOpenAddSection]);

  // ─── Enviar seleção ativa para o iframe (highlight overlay) ─────────────
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      { type: 'SELECT_COMPONENT', componentId: selectedComponentId },
      '*'
    );
  }, [selectedComponentId]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleRefresh = () => {
    setIframeKey((k) => k + 1);
  };

  const zoomIn = () => setCanvasZoom((z) => Math.min(z + 10, 150));
  const zoomOut = () => setCanvasZoom((z) => Math.max(z - 10, 50));
  const zoomReset = () => setCanvasZoom(100);

  const iframeWidth = DEVICE_WIDTHS[deviceMode];

  return (
    <div className="flex flex-col h-full bg-[#080c14] flex-1 min-w-0 overflow-hidden">
      {/* ─── Ribbon de Ações Rápidas do Elemento Selecionado ───────────────── */}
      {selectedComponent && (
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-950/60 to-slate-900/60 border-b border-blue-600/30 flex-shrink-0 animate-in fade-in duration-150 backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-blue-600/40 text-blue-200 border border-blue-500/40 shrink-0">
              {selectedComponent.type}
            </span>
            <span className="text-xs font-bold text-white truncate">
              {selectedComponent.name}
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline border-l border-slate-700 pl-2">
              💡 Duplo clique para editar texto ou trocar imagem diretamente
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onMoveComponent && (
              <>
                <button
                  type="button"
                  onClick={() => onMoveComponent(selectedComponent.id, 'up')}
                  className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-blue-600/30 transition text-xs flex items-center gap-1 cursor-pointer"
                  title="Mover para cima"
                >
                  <ArrowUp className="w-3 h-3 text-blue-400" />
                  <span className="hidden md:inline text-[11px]">Subir</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMoveComponent(selectedComponent.id, 'down')}
                  className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-blue-600/30 transition text-xs flex items-center gap-1 cursor-pointer"
                  title="Mover para baixo"
                >
                  <ArrowDown className="w-3 h-3 text-blue-400" />
                  <span className="hidden md:inline text-[11px]">Descer</span>
                </button>
              </>
            )}
            {onDuplicateComponent && (
              <button
                type="button"
                onClick={() => onDuplicateComponent(selectedComponent.id)}
                className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-blue-600/30 transition text-xs flex items-center gap-1 cursor-pointer"
                title="Duplicar elemento"
              >
                <Copy className="w-3 h-3 text-blue-400" />
                <span className="hidden md:inline text-[11px]">Duplicar</span>
              </button>
            )}
            {onDeleteComponent && (
              <button
                type="button"
                onClick={() => onDeleteComponent(selectedComponent.id)}
                className="px-2 py-1 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-600/30 transition text-xs flex items-center gap-1 cursor-pointer"
                title="Eliminar elemento"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden md:inline text-[11px]">Apagar</span>
              </button>
            )}
            {onOpenAiForComponent && (
              <button
                type="button"
                onClick={() => onOpenAiForComponent(selectedComponent.id)}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-600/30 to-blue-600/30 hover:from-violet-600/50 hover:to-blue-600/50 text-violet-200 border border-violet-500/40 transition text-xs flex items-center gap-1.5 cursor-pointer font-bold shadow-xs active:scale-95"
                title="Pedir à IA para alterar cirurgicamente este elemento"
              >
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>Pedir à IA</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelectComponent(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs ml-1 cursor-pointer"
              title="Deselecionar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Área do Canvas ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 canvas-area">
        <div
          className="relative transition-all duration-300 ease-in-out shadow-2xl shadow-black/60"
          style={{
            width: iframeWidth,
            maxWidth: '100%',
            transform: `scale(${canvasZoom / 100})`,
            transformOrigin: 'top center',
            minHeight: '200px',
          }}
        >
          {/* Indicador de carregamento */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80 rounded-xl backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-400 text-sm">A renderizar o site...</p>
              </div>
            </div>
          )}

          {/* Indicador de dispositivo */}
          {deviceMode !== 'desktop' && (
            <div className="absolute -top-7 left-0 right-0 flex items-center justify-center">
              <span className="text-[10px] text-slate-600 bg-[#080c14] px-2 py-0.5 rounded-full border border-slate-800">
                {DEVICE_LABELS[deviceMode]} - {iframeWidth}
              </span>
            </div>
          )}

          {/* Moldura do dispositivo para tablet/mobile */}
          <div className={`relative ${
            deviceMode === 'mobile'
              ? 'rounded-[2rem] border-[8px] border-slate-700 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]'
              : deviceMode === 'tablet'
              ? 'rounded-[1.5rem] border-[6px] border-slate-700 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]'
              : 'rounded-xl border border-slate-800/60'
          } overflow-hidden`}>
            {/* iframe do Canvas */}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              title="Visual Builder Canvas"
              className="w-full bg-white"
              style={{
                height: deviceMode === 'mobile' ? '700px' : deviceMode === 'tablet' ? '900px' : '85vh',
                border: 'none',
                display: 'block',
              }}
              sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-modals"
              onLoad={handleIframeLoad}
              srcDoc={compiledHtml}
            />
          </div>

          {/* Clique fora deseleciona */}
          {selectedComponentId && (
            <div
              className="absolute inset-0 pointer-events-none"
              // transparent overlay - a seleção vem de dentro do iframe
            />
          )}
        </div>
      </div>

      {/* ─── Barra de Info Inferior & Controles de Zoom ────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800/80 bg-[#0b0f1a] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-[11px] text-slate-400 font-medium">Canvas Pronto</span>
          </div>
          <div className="text-[11px] text-slate-600 font-mono hidden sm:block">
            Modo: <span className="text-slate-400">{DEVICE_LABELS[deviceMode]}</span> ({iframeWidth})
          </div>
        </div>

        {/* Controles de Zoom e Atualização */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-800">
          <button
            onClick={zoomOut}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Reduzir zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={zoomReset}
            className="text-[11px] font-mono text-slate-300 hover:text-white px-1.5 py-0.5 rounded transition cursor-pointer"
            title="Repor zoom para 100%"
          >
            {canvasZoom}%
          </button>
          <button
            onClick={zoomIn}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-slate-800 mx-0.5" />
          <button
            onClick={handleRefresh}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Recarregar pré-visualização"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

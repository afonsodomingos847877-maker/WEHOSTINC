'use client';
// ============================================================================
// 🎨 WEHOSTHERE VISUAL BUILDER v2 - EDITOR VISUAL PRINCIPAL (Elementor-like)
// Editor completo com 3 painéis: LeftSidebar | VisualCanvas | RightSidebar
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, X, Send, Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

// Builder Core
import { SiteDocument, VisualComponent } from '@/lib/builder/types';
import { createDefaultComponent, createInitialSiteDocument } from '@/lib/builder/defaultComponents';
import { parseHtmlToSiteDocument } from '@/lib/builder/htmlParser';
import { auth } from '@/lib/auth';
import { compileSiteDocumentToHtml as compileSiteDocument } from '@/lib/builder/htmlCompiler';
import {
  insertComponentIntoDocument,
  removeComponentFromDocument,
  updateComponentInDocument,
  duplicateComponentInDocument,
  moveComponentOrder,
  findComponentInDocument,
} from '@/lib/builder/documentActions';
import { ComponentType } from '@/lib/builder/types';

// Builder Components
import LeftSidebar from '@/components/builder/LeftSidebar';
import VisualCanvas from '@/components/builder/VisualCanvas';
import RightSidebar from '@/components/builder/RightSidebar';
import BuilderTopbar from '@/components/builder/BuilderTopbar';
import ImagePickerModal from '@/components/builder/ImagePickerModal';
import AddSectionModal from '@/components/builder/AddSectionModal';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; message: string; type: ToastType; }

// ─── Hook: Sistema de Toasts ──────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = `t_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  const dismiss = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  return { toasts, show, dismiss };
}

interface UndoEntry {
  doc: SiteDocument;
  label: string;
}

// ─── Hook: Histórico de Undo/Redo ────────────────────────────────────────────
function useUndoHistory(initial: SiteDocument | null) {
  const [history, setHistory] = useState<UndoEntry[]>([]);
  const [future, setFuture] = useState<UndoEntry[]>([]);
  const [current, setCurrent] = useState<SiteDocument | null>(initial);

  const set = useCallback((doc: SiteDocument, label = 'Alteração') => {
    setCurrent((prev) => {
      if (prev) setHistory((h) => [...h.slice(-49), { doc: prev, label }]);
      return doc;
    });
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrent((prev) => {
      if (prev) setFuture((f) => [{ doc: prev, label: 'Redo' }, ...f.slice(0, 49)]);
      return last.doc;
    });
  }, [history]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setCurrent((prev) => {
      if (prev) setHistory((h) => [...h.slice(-49), { doc: prev, label: 'Undo' }]);
      return next.doc;
    });
  }, [future]);

  const reset = useCallback((doc: SiteDocument) => {
    setCurrent(doc);
    setHistory([]);
    setFuture([]);
  }, []);

  return {
    doc: current,
    set,
    undo,
    redo,
    reset,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
  };
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function VisualBuilderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteId = searchParams.get('id');
  const siteSlug = searchParams.get('slug') || '';

  // ─── Estado ─────────────────────────────────────────────────────────────
  const { doc: siteDocument, set: setDoc, undo, redo, reset, canUndo, canRedo } = useUndoHistory(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Toast
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();

  // IA Chat
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiInputRef = useRef<HTMLTextAreaElement>(null);
  // IA Cirúrgica - componente alvo
  const [surgicalTargetId, setSurgicalTargetId] = useState<string | null>(null);

  // Modais de Edição Interativa
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [imagePickerTargetId, setImagePickerTargetId] = useState<string | null>(null);
  const [imagePickerCurrentSrc, setImagePickerCurrentSrc] = useState<string>('');
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [addSectionIndex, setAddSectionIndex] = useState<number | undefined>(undefined);

  // Auto-save debounce ref
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Carregar Site ───────────────────────────────────────────────────────
  useEffect(() => {
    let currentUserEmail = session?.user?.email;
    if (!currentUserEmail && typeof window !== 'undefined') {
      const localUser = auth.getCurrentUser();
      if (localUser?.email) {
        currentUserEmail = localUser.email;
      }
    }

    if (status === 'unauthenticated' && !currentUserEmail) {
      router.push('/login');
      return;
    }

    const loadSite = async () => {
      try {
        // 1. Carregar via API se id ou slug fornecido
        if (siteId || siteSlug) {
          const params = siteId
            ? `?id=${siteId}`
            : `?slug=${siteSlug}&userEmail=${currentUserEmail || ''}`;
          const res = await fetch(`/api/ai/sites${params}`);
          const data = await res.json();

          if (data.success && data.site) {
            const site = data.site;
            setIsPublished(site.status === 'published');

            let doc: SiteDocument;
            if (site.documentJson && site.documentJson.version) {
              doc = site.documentJson as SiteDocument;
            } else if (site.htmlContent) {
              doc = parseHtmlToSiteDocument(site.htmlContent, site.id, site.title);
            } else {
              doc = createInitialSiteDocument(site.title || 'Meu Website', site.slug || 'meu-site');
            }

            reset(doc);
            setIsLoading(false);
            return;
          }
        }

        // 2. Fallback: carregar a partir do sessionStorage (se o utilizador veio do construtor clássico)
        if (typeof window !== 'undefined') {
          const cachedHtml = sessionStorage.getItem('wehost_visual_builder_html');
          const cachedTitle = sessionStorage.getItem('wehost_visual_builder_title');
          if (cachedHtml && cachedHtml.trim().length > 50) {
            const doc = parseHtmlToSiteDocument(
              cachedHtml,
              siteId || `site_${Date.now()}`,
              cachedTitle || 'Website Criado com IA'
            );
            reset(doc);
            setIsLoading(false);
            return;
          }
        }

        // 3. Fallback: Criar novo documento profissional completo pronto a usar
        const starterDoc = createInitialSiteDocument('Meu Website Profissional', 'meu-website');
        reset(starterDoc);
        setIsLoading(false);
      } catch (err: any) {
        console.warn('Erro ao carregar do servidor, carregando modelo inicial:', err);
        const fallbackDoc = createInitialSiteDocument('Meu Website', 'meu-site');
        reset(fallbackDoc);
        setIsLoading(false);
      }
    };

    loadSite();
  }, [status, siteId, siteSlug, session, router, reset]);

  // ─── Auto-Guardar (8s sem actividade) ────────────────────────────────────
  useEffect(() => {
    if (!siteDocument) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      handleSave();
    }, 8000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteDocument]);

  // ─── Inserir Componente ──────────────────────────────────────────────────
  const handleInsertComponent = useCallback((type: string) => {
    if (!siteDocument) return;
    const newComp = createDefaultComponent(type as any);
    const updated = insertComponentIntoDocument(siteDocument, newComp, null);
    setDoc(updated, `Inserir ${type}`);
    setSelectedComponentId(newComp.id);
  }, [siteDocument, setDoc]);

  // ─── Apagar Componente ───────────────────────────────────────────────────
  const handleDeleteComponent = useCallback((id: string) => {
    if (!siteDocument) return;
    const updated = removeComponentFromDocument(siteDocument, id);
    setDoc(updated, 'Apagar componente');
    if (selectedComponentId === id) setSelectedComponentId(null);
  }, [siteDocument, setDoc, selectedComponentId]);

  // ─── Duplicar Componente ─────────────────────────────────────────────────
  const handleDuplicateComponent = useCallback((id: string) => {
    if (!siteDocument) return;
    const { updatedDoc, newId } = duplicateComponentInDocument(siteDocument, id);
    setDoc(updatedDoc, 'Duplicar componente');
    if (newId) setSelectedComponentId(newId);
  }, [siteDocument, setDoc]);

  // ─── Alternar Visibilidade ───────────────────────────────────────────────
  const handleToggleVisibility = useCallback((id: string) => {
    if (!siteDocument) return;
    const updated = updateComponentInDocument(siteDocument, id, (comp) => ({
      ...comp,
      hidden: !comp.hidden,
    }));
    setDoc(updated, 'Alternar visibilidade');
  }, [siteDocument, setDoc]);

  // ─── Atualização de Texto Inline Diretamente do Canvas ───────────────────
  const handleUpdateText = useCallback((id: string, text: string) => {
    if (!siteDocument) return;
    const updated = updateComponentInDocument(siteDocument, id, (comp) => {
      const updatedComp = { ...comp, content: { ...comp.content } };
      if (comp.type === 'heading' || comp.type === 'text') {
        updatedComp.content.text = text;
      } else if (comp.type === 'button') {
        updatedComp.content.buttonText = text;
      } else if (comp.type === 'badge') {
        updatedComp.content.badgeText = text;
      } else {
        updatedComp.content.text = text;
      }
      return updatedComp;
    });
    setDoc(updated, 'Editar texto');
  }, [siteDocument, setDoc]);

  // ─── Mover Componente (Subir / Descer) ───────────────────────────────────
  const handleMoveComponent = useCallback((id: string, direction: 'up' | 'down') => {
    if (!siteDocument) return;
    const updated = moveComponentOrder(siteDocument, id, direction);
    setDoc(updated, `Mover para ${direction === 'up' ? 'cima' : 'baixo'}`);
  }, [siteDocument, setDoc]);

  // ─── Seletor de Imagens ──────────────────────────────────────────────────
  const handleOpenImagePicker = useCallback((id: string, currentSrc: string) => {
    setImagePickerTargetId(id);
    setImagePickerCurrentSrc(currentSrc);
    setIsImagePickerOpen(true);
  }, []);

  const handleApplyImage = useCallback((url: string) => {
    if (!siteDocument || !imagePickerTargetId) return;
    const updated = updateComponentInDocument(siteDocument, imagePickerTargetId, (comp) => ({
      ...comp,
      content: {
        ...comp.content,
        src: url,
      },
    }));
    setDoc(updated, 'Substituir imagem');
    setIsImagePickerOpen(false);
    setImagePickerTargetId(null);
  }, [siteDocument, imagePickerTargetId, setDoc]);

  // ─── Inserir Secção na Posição ───────────────────────────────────────────
  const handleOpenAddSection = useCallback((insertIndex?: number) => {
    setAddSectionIndex(insertIndex);
    setIsAddSectionOpen(true);
  }, []);

  const handleAddSectionFromModal = useCallback((type: ComponentType) => {
    if (!siteDocument) return;
    const newComp = createDefaultComponent(type);
    const updated = insertComponentIntoDocument(siteDocument, newComp, null, addSectionIndex);
    setDoc(updated, `Inserir secção ${type}`);
    setSelectedComponentId(newComp.id);
    setIsAddSectionOpen(false);
    setAddSectionIndex(undefined);
  }, [siteDocument, addSectionIndex, setDoc]);

  // ─── Atualizar Documento ─────────────────────────────────────────────────
  const handleUpdateDocument = useCallback((doc: SiteDocument) => {
    setDoc(doc, 'Atualizar');
  }, [setDoc]);

  // ─── Guardar ─────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!siteDocument || isSaving) return;
    setIsSaving(true);
    try {
      const compiledHtml = compileSiteDocument(siteDocument);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('wehost_visual_builder_html', compiledHtml);
        sessionStorage.setItem('wehost_visual_builder_title', siteDocument.site.name);
      }
      const email = session?.user?.email || (typeof window !== 'undefined' ? auth.getCurrentUser()?.email : null);
      const res = await fetch('/api/ai/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: siteId || siteDocument.site.id,
          userEmail: email,
          title: siteDocument.site.name,
          slug: siteSlug || siteDocument.site.slug,
          htmlContent: compiledHtml,
          documentJson: siteDocument,
          status: isPublished ? 'published' : 'draft',
        }),
      });
      if (!res.ok) throw new Error('Falha ao guardar');
      showToast('Site guardado!', 'success');
    } catch (err: any) {
      console.error('[VisualBuilder Save]', err);
      showToast('Erro ao guardar. Tente novamente.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [siteDocument, isSaving, siteId, siteSlug, session, isPublished, showToast]);

  // ─── Publicar ────────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (!siteDocument || isPublishing) return;
    setIsPublishing(true);
    try {
      const compiledHtml = compileSiteDocument(siteDocument);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('wehost_visual_builder_html', compiledHtml);
        sessionStorage.setItem('wehost_visual_builder_title', siteDocument.site.name);
      }
      const email = session?.user?.email || (typeof window !== 'undefined' ? auth.getCurrentUser()?.email : null);
      const res = await fetch('/api/ai/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: siteId || siteDocument.site.id,
          userEmail: email,
          title: siteDocument.site.name,
          slug: siteSlug || siteDocument.site.slug,
          htmlContent: compiledHtml,
          documentJson: siteDocument,
          status: 'published',
        }),
      });
      if (res.ok) {
        setIsPublished(true);
        showToast('🌐 Site publicado com sucesso!', 'success');
      } else throw new Error('Falha ao publicar');
    } catch (err: any) {
      console.error('[VisualBuilder Publish]', err);
      showToast('Erro ao publicar. Tente novamente.', 'error');
    } finally {
      setIsPublishing(false);
    }
  }, [siteDocument, isPublishing, siteId, siteSlug, session, showToast]);

  // ─── IA: Enviar prompt de refinamento ────────────────────────────────────
  const handleAiSubmit = useCallback(async () => {
    if (!aiPrompt.trim() || isAiLoading || !siteDocument) return;
    setIsAiLoading(true);
    setAiError(null);

    try {
      if (surgicalTargetId) {
        // Edição cirúrgica de um componente específico
        const res = await fetch('/api/ai/surgical-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteDocument,
            componentId: surgicalTargetId,
            instruction: aiPrompt,
            userEmail: session?.user?.email,
          }),
        });
        const data = await res.json();
        if (data.success && data.updatedComponent) {
          const updated = updateComponentInDocument(
            siteDocument,
            surgicalTargetId,
            () => data.updatedComponent
          );
          setDoc(updated, `IA Cirúrgica: ${aiPrompt.slice(0, 30)}...`);
          setAiPrompt('');
          setSurgicalTargetId(null);
          setIsAiChatOpen(false);
          showToast('✨ Elemento atualizado pela IA!', 'success');
        } else {
          setAiError(data.error || 'A IA não conseguiu modificar o elemento.');
        }
      } else {
        // Edição global do site inteiro
        const compiledHtml = compileSiteDocument(siteDocument);
        const res = await fetch('/api/ai/site-builder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: session?.user?.email,
            prompt: aiPrompt,
            currentHtml: compiledHtml,
            siteId: siteId || siteDocument.site.id,
            title: siteDocument.site.name,
          }),
        });
        const data = await res.json();
        if (data.htmlContent) {
          const updatedDoc = parseHtmlToSiteDocument(
            data.htmlContent,
            siteDocument.site.id,
            siteDocument.site.name
          );
          setDoc(updatedDoc, `IA: ${aiPrompt.slice(0, 30)}...`);
          setAiPrompt('');
          setIsAiChatOpen(false);
          showToast('✨ Site atualizado pela IA!', 'success');
        } else {
          setAiError('A IA não devolveu HTML. Tente novamente.');
        }
      }
    } catch (err: any) {
      setAiError(err?.message || 'Erro ao comunicar com a IA.');
    } finally {
      setIsAiLoading(false);
    }
  }, [aiPrompt, isAiLoading, siteDocument, session, siteId, setDoc, surgicalTargetId, showToast]);

  // ─── IA: Abrir chat para componente específico ────────────────────────────
  const handleOpenAiForComponent = useCallback((id: string) => {
    setSurgicalTargetId(id);
    setIsAiChatOpen(true);
    const comp = siteDocument ? findComponentInDocument(siteDocument, id) : null;
    if (comp) setAiPrompt(`Alterar o elemento "${comp.type}" selecionado: `);
    setTimeout(() => aiInputRef.current?.focus(), 150);
  }, [siteDocument]);

  // ─── Atalhos de Teclado ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); showToast('↩ Desfeito', 'info'); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); showToast('↪ Refeito', 'info'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape') { setSelectedComponentId(null); setIsAiChatOpen(false); setSurgicalTargetId(null); }
      if (e.key === 'Delete' && selectedComponentId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        handleDeleteComponent(selectedComponentId);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo, handleSave, selectedComponentId, handleDeleteComponent]);

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (isLoading || status === 'loading') {
    return (
      <div className="h-screen bg-[#080c14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
          <p className="text-slate-400 text-sm">A carregar o editor visual...</p>
        </div>
      </div>
    );
  }

  if (loadError || !siteDocument) {
    return (
      <div className="h-screen bg-[#080c14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center p-6 max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-slate-200 font-semibold">Erro ao carregar o editor</p>
          <p className="text-slate-500 text-sm">{loadError}</p>
          <button
            onClick={() => router.push('/dashboard/builder')}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition"
          >
            Voltar ao Painel
          </button>
        </div>
      </div>
    );
  }

  // ─── Render Principal ────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-[#080c14] overflow-hidden">
      {/* Barra de Topo */}
      <BuilderTopbar
        siteDocument={siteDocument}
        siteSlug={siteSlug || siteDocument.site.slug}
        deviceMode={deviceMode}
        onDeviceModeChange={setDeviceMode}
        isSaving={isSaving}
        isPublishing={isPublishing}
        isPublished={isPublished}
        canUndo={canUndo}
        canRedo={canRedo}
        onSave={handleSave}
        onPublish={handlePublish}
        onUndo={undo}
        onRedo={redo}
        onOpenAiChat={() => { setIsAiChatOpen(true); setTimeout(() => aiInputRef.current?.focus(), 100); }}
        onUpdateDocument={handleUpdateDocument}
      />

      {/* Layout de 3 Colunas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Barra Lateral Esquerda */}
        <LeftSidebar
          siteDocument={siteDocument}
          selectedComponentId={selectedComponentId}
          onInsertComponent={handleInsertComponent}
          onSelectComponent={setSelectedComponentId}
          onUpdateDocument={handleUpdateDocument}
          onDeleteComponent={handleDeleteComponent}
          onDuplicateComponent={handleDuplicateComponent}
          onToggleVisibility={handleToggleVisibility}
        />

        {/* Canvas Visual Central */}
        <VisualCanvas
          siteDocument={siteDocument}
          selectedComponentId={selectedComponentId}
          onSelectComponent={setSelectedComponentId}
          deviceMode={deviceMode}
          onDeviceModeChange={setDeviceMode}
          onUpdateText={handleUpdateText}
          onOpenImagePicker={handleOpenImagePicker}
          onOpenAddSection={handleOpenAddSection}
          onMoveComponent={handleMoveComponent}
          onDuplicateComponent={handleDuplicateComponent}
          onDeleteComponent={handleDeleteComponent}
          onOpenAiForComponent={handleOpenAiForComponent}
        />

        {/* Barra Lateral Direita - Inspector */}
        <RightSidebar
          siteDocument={siteDocument}
          selectedComponentId={selectedComponentId}
          deviceMode={deviceMode as any}
          onUpdateDocument={handleUpdateDocument}
          onOpenImagePicker={handleOpenImagePicker}
        />
      </div>

      {/* ─── Sistema de Toasts ──────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium backdrop-blur-md transition-all
              ${
                toast.type === 'success'
                  ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-100'
                  : toast.type === 'error'
                  ? 'bg-red-900/90 border-red-500/40 text-red-100'
                  : 'bg-slate-800/95 border-slate-600/50 text-slate-100'
              }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 flex-shrink-0 text-blue-400" />}
            <span>{toast.message}</span>
            <button onClick={() => dismissToast(toast.id)} className="ml-1 opacity-50 hover:opacity-100 transition">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* ─── Painel de Chat com IA (slide-in) ─────────────────────────── */}
      {isAiChatOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsAiChatOpen(false)}
          />

          {/* Painel */}
          <div className="relative w-full max-w-2xl bg-[#0f1117] border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '80vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-600/25 border border-violet-500/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-200">
                    {surgicalTargetId ? '✦ Edição Cirúrgica - IA' : 'IA Assistente de Edição'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {surgicalTargetId
                      ? 'A IA vai modificar apenas o elemento selecionado'
                      : 'Descreva o que quer alterar no site'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsAiChatOpen(false); setSurgicalTargetId(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sugestões Rápidas */}
            <div className="px-4 py-3 border-b border-slate-800/60 flex flex-wrap gap-2">
              {[
                'Mudar as cores para azul oceano',
                'Tornar o texto do hero mais impactante',
                'Adicionar uma secção de FAQ',
                'Mudar o botão para verde',
                'Adicionar botão de WhatsApp',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setAiPrompt(s)}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-violet-500/40 hover:bg-violet-600/10 transition"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 flex flex-col gap-3">
              {aiError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[12px]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {aiError}
                </div>
              )}

              <textarea
                ref={aiInputRef}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSubmit(); }
                }}
                placeholder="Ex: Adiciona um depoimento de clientes com 3 reviews com 5 estrelas..."
                rows={4}
                className="w-full px-4 py-3 text-[13px] bg-slate-900/60 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/60 transition resize-none"
              />

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-600">Enter para enviar · Shift+Enter para nova linha</p>
                <button
                  onClick={handleAiSubmit}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-[13px] font-bold transition-all shadow-lg shadow-violet-600/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  {isAiLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> A processar...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Enviar à IA</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal de Biblioteca de Imagens ───────────────────────────── */}
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => {
          setIsImagePickerOpen(false);
          setImagePickerTargetId(null);
        }}
        onSelectImage={handleApplyImage}
        currentImage={imagePickerCurrentSrc}
      />

      {/* ─── Modal de Adicionar Secção entre Blocos ────────────────────── */}
      <AddSectionModal
        isOpen={isAddSectionOpen}
        onClose={() => {
          setIsAddSectionOpen(false);
          setAddSectionIndex(undefined);
        }}
        onSelectType={handleAddSectionFromModal}
        insertIndex={addSectionIndex}
      />

      {/* ─── Toast Notifications Overlay ───────────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : t.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-slate-900/95 border-slate-700/60 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {t.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
              <span className="text-[13px] font-medium leading-snug">{t.message}</span>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition shrink-0"
              title="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

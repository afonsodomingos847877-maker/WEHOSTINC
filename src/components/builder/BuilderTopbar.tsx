'use client';
// ============================================================================
// 🎨 WEHOSTHERE VISUAL BUILDER - BARRA DE TOPO DO EDITOR VISUAL
// ============================================================================

import { useState } from 'react';
import {
  ArrowLeft, Save, Globe, Eye, Undo2, Redo2, Wand2,
  ExternalLink, ChevronDown, Loader2, Check, History,
  Palette, Settings, Download, Share2, Sparkles, Lock,
  Laptop, Tablet, Smartphone,
} from 'lucide-react';
import Link from 'next/link';
import { SiteDocument } from '@/lib/builder/types';

interface BuilderTopbarProps {
  siteDocument: SiteDocument;
  siteSlug: string;
  deviceMode: 'desktop' | 'tablet' | 'mobile';
  onDeviceModeChange: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  isSaving: boolean;
  isPublishing: boolean;
  isPublished: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  onPublish: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenAiChat: () => void;
  onUpdateDocument: (doc: SiteDocument) => void;
}

export default function BuilderTopbar({
  siteDocument,
  siteSlug,
  deviceMode,
  onDeviceModeChange,
  isSaving,
  isPublishing,
  isPublished,
  canUndo,
  canRedo,
  onSave,
  onPublish,
  onUndo,
  onRedo,
  onOpenAiChat,
  onUpdateDocument,
}: BuilderTopbarProps) {
  const [showSiteMenu, setShowSiteMenu] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const handleSave = async () => {
    onSave();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const siteUrl = siteDocument.site.customDomain
    ? `https://${siteDocument.site.customDomain}`
    : `https://${siteDocument.site.subdomain || siteSlug}.wehosthere.co.mz`;

  return (
    <div className="h-12 flex items-center justify-between px-3 bg-[#0b0f1a] border-b border-slate-800/80 flex-shrink-0 z-50 gap-2">
      {/* ─── Lado Esquerdo ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Voltar ao painel */}
        <Link
          href="/dashboard/builder"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition text-[12px] font-medium flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Painel</span>
        </Link>

        <div className="w-px h-5 bg-slate-800" />

        {/* Nome do Site (clicável para configurações) */}
        <div className="relative">
          <button
            onClick={() => setShowSiteMenu((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/60 transition group min-w-0"
          >
            <div className="w-5 h-5 rounded-md bg-blue-600/30 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
              <Globe className="w-2.5 h-2.5 text-blue-400" />
            </div>
            <span className="text-[13px] font-semibold text-slate-200 truncate max-w-[160px]">
              {siteDocument.site.name}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition flex-shrink-0" />
          </button>

          {/* Dropdown de info do site */}
          {showSiteMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSiteMenu(false)} />
              <div className="absolute top-full left-0 mt-1 w-64 bg-[#141821] border border-slate-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-700/40">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Informações do Site</p>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider">URL Pública</span>
                    <a
                      href={siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-blue-400 hover:text-blue-300 truncate font-mono flex items-center gap-1"
                    >
                      {siteUrl}
                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                    </a>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider">Slug</span>
                    <span className="text-[12px] text-slate-400 font-mono">/{siteSlug}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider">Estado</span>
                    <span className={`text-[12px] font-semibold ${isPublished ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isPublished ? '✅ Publicado' : '🕒 Rascunho'}
                    </span>
                  </div>
                </div>
                <div className="p-2 border-t border-slate-700/40">
                  <a
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-700/40 transition text-slate-400 hover:text-slate-200 text-[12px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Abrir em Nova Aba
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Lado Central - Seletor de Dispositivo & Undo / Redo ────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Seletor de Dispositivo (Desktop | Tablet | Mobile) */}
        <div className="flex items-center gap-0.5 bg-slate-900/90 rounded-xl p-0.5 border border-slate-800">
          <button
            onClick={() => onDeviceModeChange('desktop')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              deviceMode === 'desktop'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Visualização Desktop (100%)"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Desktop</span>
          </button>
          <button
            onClick={() => onDeviceModeChange('tablet')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              deviceMode === 'tablet'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Visualização Tablet (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Tablet</span>
          </button>
          <button
            onClick={() => onDeviceModeChange('mobile')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              deviceMode === 'mobile'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Visualização Mobile (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Mobile</span>
          </button>
        </div>

        <div className="w-px h-4 bg-slate-800 hidden sm:block" />

        {/* Desfazer / Refazer */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Lado Direito - IA, Guardar & Publicar ───────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Botão de Assistente IA */}
        <button
          onClick={onOpenAiChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-bold transition shadow-xs active:scale-95"
          title="Assistente de Edição Inteligente"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden sm:inline">IA Assistente</span>
        </button>

        {/* Botão Guardar */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold transition-all active:scale-95 ${
            savedFlash
              ? 'border-emerald-500/50 bg-emerald-600/20 text-emerald-400'
              : 'border-slate-700/60 bg-slate-800/60 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700/40'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : savedFlash ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:block">{savedFlash ? 'Guardado!' : 'Guardar'}</span>
        </button>

        {/* Botão Publicar */}
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[12px] font-bold transition-all shadow-[0_0_12px_rgba(59,130,246,0.4)] hover:shadow-[0_0_18px_rgba(59,130,246,0.6)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPublishing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Globe className="w-3.5 h-3.5" />
          )}
          <span>{isPublishing ? 'A publicar...' : (isPublished ? 'Atualizar' : 'Publicar')}</span>
        </button>
      </div>
    </div>
  );
}

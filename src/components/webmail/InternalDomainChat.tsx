'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Send,
  Paperclip,
  X,
  Maximize2,
  Minimize2,
  Circle,
  CheckCircle2,
  FileText,
  Download,
  Loader2,
  Plus,
  Hash,
  UserCheck,
  Sparkles,
  Image as ImageIcon,
  Globe,
  ExternalLink,
  Camera,
  User,
  Trash2,
  Check,
} from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';
import { apiEndpoint } from '@/lib/siteConfig';

export interface ColleagueInfo {
  email: string;
  name: string;
  avatarUrl?: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  isOnline: boolean;
  lastSeenAt?: string;
  unreadCount: number;
}

export interface InternalChatMessage {
  id: string;
  domain: string;
  channel: string;
  fromEmail: string;
  fromName: string;
  fromAvatarUrl?: string;
  toEmail: string;
  text: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  readBy: string[];
  createdAt: string;
}

interface InternalDomainChatProps {
  currentEmail: string;
  currentUserName: string;
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
  onUnreadChange?: (count: number, onlineColleagues: number) => void;
  onProfileChange?: (avatarUrl: string, displayName: string) => void;
}

export default function InternalDomainChat({
  currentEmail,
  currentUserName,
  isOpen,
  onToggleOpen,
  onUnreadChange,
  onProfileChange,
}: InternalDomainChatProps) {
  const safeEmail =
    currentEmail && currentEmail.includes('@')
      ? currentEmail.trim().toLowerCase()
      : 'equipa@wehosthere.com';
  const domain = (safeEmail.split('@')[1] || 'wehosthere.com').toLowerCase();

  const [selectedPeer, setSelectedPeer] = useState<string>('general'); // 'general' ou email do colega
  const [colleagues, setColleagues] = useState<ColleagueInfo[]>([]);
  const [messages, setMessages] = useState<InternalChatMessage[]>([]);
  const [generalUnread, setGeneralUnread] = useState<number>(0);
  const [totalUnread, setTotalUnread] = useState<number>(0);
  const [selfStatus, setSelfStatus] = useState<'online' | 'busy' | 'away'>('online');
  const [messageText, setMessageText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showAddColleague, setShowAddColleague] = useState<boolean>(false);
  const [customColleagueLocal, setCustomColleagueLocal] = useState<string>('');

  // Estados de Foto de Perfil e Nome Personalizado do Utilizador
  const [selfAvatarUrl, setSelfAvatarUrl] = useState<string>('');
  const [selfDisplayName, setSelfDisplayName] = useState<string>(currentUserName || '');
  const [showProfileEditor, setShowProfileEditor] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [profileSavedToast, setProfileSavedToast] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const prevTotalUnreadRef = useRef<number>(0);
  const prevLastMsgIdRef = useRef<string | null>(null);

  // Carregar foto de perfil e nome salvos localmente ao iniciar
  useEffect(() => {
    if (typeof window === 'undefined' || !safeEmail) return;
    try {
      const localAv = localStorage.getItem(`wehosthere_avatar_${safeEmail}`) || '';
      const localNm = localStorage.getItem(`wehosthere_displayname_${safeEmail}`) || '';
      if (localAv) setSelfAvatarUrl(localAv);
      if (localNm) setSelfDisplayName(localNm);
      else if (currentUserName) setSelfDisplayName(currentUserName);
    } catch {}
  }, [safeEmail, currentUserName]);

  const getLocalCacheKey = (peer: string) =>
    `wehosthere_internal_chat_${domain}_${peer === 'general' ? 'general' : peer.toLowerCase()}`;

  const fetchChatState = async () => {
    if (!safeEmail || !safeEmail.includes('@')) return;
    try {
      const params = new URLSearchParams({
        email: safeEmail,
        with: selectedPeer,
        name: currentUserName || '',
      });
      const res = await fetch(apiEndpoint(`/api/webmail/chat?${params.toString()}`));
      if (!res.ok) {
        // Fallback para cache local se o servidor/BD estiver temporariamente indisponível
        try {
          const cached = localStorage.getItem(getLocalCacheKey(selectedPeer));
          if (cached) {
            setMessages(JSON.parse(cached));
          }
        } catch {}
        return;
      }
      const data = await res.json();
      if (!data.success) return;

      const nextColleagues: ColleagueInfo[] = data.colleagues || [];
      const nextMessages: InternalChatMessage[] = data.messages || [];
      const nextTotalUnread: number = data.totalUnread || 0;
      const onlineCount = nextColleagues.filter((c) => c.isOnline).length;

      // Tocar som suave quando chega nova mensagem de um colega
      const newestMsg = nextMessages[nextMessages.length - 1];
      if (
        newestMsg &&
        prevLastMsgIdRef.current &&
        newestMsg.id !== prevLastMsgIdRef.current &&
        newestMsg.fromEmail.toLowerCase() !== safeEmail.toLowerCase()
      ) {
        soundEffects.playNewEmailSound();
      } else if (nextTotalUnread > prevTotalUnreadRef.current) {
        soundEffects.playNewEmailSound();
      }

      if (newestMsg) {
        prevLastMsgIdRef.current = newestMsg.id;
      }
      prevTotalUnreadRef.current = nextTotalUnread;

      setColleagues(nextColleagues);
      setMessages(nextMessages);
      try {
        localStorage.setItem(getLocalCacheKey(selectedPeer), JSON.stringify(nextMessages.slice(-80)));
      } catch {}
      setGeneralUnread(data.generalUnreadCount || 0);
      setTotalUnread(nextTotalUnread);
      if (data.selfStatus) setSelfStatus(data.selfStatus);
      if (data.selfAvatarUrl) {
        setSelfAvatarUrl(data.selfAvatarUrl);
        try {
          localStorage.setItem(`wehosthere_avatar_${safeEmail}`, data.selfAvatarUrl);
        } catch {}
      }
      if (data.selfName) {
        setSelfDisplayName((prev) => prev || data.selfName);
      }
      if (onProfileChange && (data.selfAvatarUrl || selfAvatarUrl)) {
        onProfileChange(data.selfAvatarUrl || selfAvatarUrl, data.selfName || selfDisplayName || currentUserName);
      }

      if (onUnreadChange) {
        onUnreadChange(nextTotalUnread, onlineCount);
      }
    } catch {
      try {
        const cached = localStorage.getItem(getLocalCacheKey(selectedPeer));
        if (cached) {
          setMessages(JSON.parse(cached));
        }
      } catch {}
    }
  };

  useEffect(() => {
    fetchChatState();
    const interval = setInterval(fetchChatState, isOpen ? 3500 : 8000);
    return () => clearInterval(interval);
  }, [currentEmail, selectedPeer, isOpen, currentUserName]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen, selectedPeer]);

  const handleUpdateStatus = async (newStatus: 'online' | 'busy' | 'away') => {
    setSelfStatus(newStatus);
    try {
      await fetch(apiEndpoint('/api/webmail/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          fromEmail: safeEmail,
          fromName: selfDisplayName || currentUserName,
          avatarUrl: selfAvatarUrl || undefined,
          status: newStatus,
        }),
      });
    } catch {}
  };

  // Comprimir imagem de perfil para um quadrado nítido 180x180 (compatível com Cloudinary e armazenamento direto)
  const resizeImageToSquareAvatar = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        try {
          const size = 180;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context indisponível'));
            return;
          }
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.84));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        reject(new Error('Falha ao carregar imagem'));
      };
      img.src = objUrl;
    });
  };

  const handleSaveProfileUpdate = async (newAvatarUrl: string, newName: string) => {
    const cleanName = (newName || selfDisplayName || currentUserName || safeEmail.split('@')[0]).trim();
    setSelfAvatarUrl(newAvatarUrl);
    setSelfDisplayName(cleanName);
    try {
      localStorage.setItem(`wehosthere_avatar_${safeEmail}`, newAvatarUrl);
      localStorage.setItem(`wehosthere_displayname_${safeEmail}`, cleanName);
    } catch {}

    if (onProfileChange) {
      onProfileChange(newAvatarUrl, cleanName);
    }

    // Atualizar também as mensagens já visíveis do próprio utilizador
    setMessages((prev) =>
      prev.map((m) =>
        m.fromEmail.toLowerCase() === safeEmail.toLowerCase()
          ? { ...m, fromAvatarUrl: newAvatarUrl, fromName: cleanName }
          : m
      )
    );

    try {
      await fetch(apiEndpoint('/api/webmail/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'profile',
          fromEmail: safeEmail,
          fromName: cleanName,
          avatarUrl: newAvatarUrl,
        }),
      });
      setProfileSavedToast(true);
      setTimeout(() => setProfileSavedToast(false), 2500);
    } catch {}
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const squareDataUrl = await resizeImageToSquareAvatar(file);
      let finalAvatarUrl = squareDataUrl;

      // Tentar enviar para Cloudinary se disponível; caso contrário usa o dataURL compacto 180x180
      try {
        const sigRes = await fetch(apiEndpoint('/api/upload'), { method: 'GET' });
        if (sigRes.ok) {
          const sigData = await sigRes.json();
          if (sigData.success && sigData.cloudName && sigData.signature) {
            const formData = new FormData();
            formData.append('file', squareDataUrl);
            formData.append('api_key', sigData.apiKey);
            formData.append('timestamp', sigData.timestamp);
            formData.append('signature', sigData.signature);

            const uploadRes = await fetch(
              `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
              { method: 'POST', body: formData }
            );
            if (uploadRes.ok) {
              const upData = await uploadRes.json();
              if (upData.secure_url || upData.url) {
                finalAvatarUrl = upData.secure_url || upData.url;
              }
            }
          }
        }
      } catch {}

      await handleSaveProfileUpdate(finalAvatarUrl, selfDisplayName || currentUserName);
      soundEffects.playAttachSound();
    } catch (err) {
      console.error('[InternalChat] Erro ao atualizar foto de perfil:', err);
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const sigRes = await fetch(apiEndpoint('/api/upload'), { method: 'GET' });
      if (sigRes.ok) {
        const sigData = await sigRes.json();
        if (sigData.success && sigData.cloudName && sigData.signature) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('api_key', sigData.apiKey);
          formData.append('timestamp', sigData.timestamp);
          formData.append('signature', sigData.signature);

          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`,
            {
              method: 'POST',
              body: formData,
            }
          );
          if (uploadRes.ok) {
            const upData = await uploadRes.json();
            const url = upData.secure_url || upData.url;
            if (url) {
              setPendingAttachment({
                url,
                name: file.name,
                type: file.type || 'application/octet-stream',
              });
              soundEffects.playAttachSound();
            }
          }
        }
      }
    } catch (err) {
      console.error('[InternalChat] Erro ao anexar ficheiro:', err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSending || (!messageText.trim() && !pendingAttachment)) return;

    const textToSend = messageText.trim();
    const attToSend = pendingAttachment;
    setMessageText('');
    setPendingAttachment(null);
    setIsSending(true);

    const optimisticMsg: InternalChatMessage = {
      id: `local-${Date.now()}`,
      domain,
      channel: selectedPeer === 'general' ? 'general' : `dm:${safeEmail}:${selectedPeer}`,
      fromEmail: safeEmail,
      fromName: selfDisplayName || currentUserName || safeEmail.split('@')[0],
      fromAvatarUrl: selfAvatarUrl || undefined,
      toEmail: selectedPeer === 'general' ? 'all' : selectedPeer,
      text: textToSend,
      attachmentUrl: attToSend?.url,
      attachmentName: attToSend?.name,
      attachmentType: attToSend?.type,
      readBy: [safeEmail],
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(apiEndpoint('/api/webmail/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          fromEmail: safeEmail,
          fromName: selfDisplayName || currentUserName,
          avatarUrl: selfAvatarUrl || undefined,
          toEmail: selectedPeer === 'general' ? 'all' : selectedPeer,
          text: textToSend,
          attachmentUrl: attToSend?.url,
          attachmentName: attToSend?.name,
          attachmentType: attToSend?.type,
        }),
      });
      const data = await res.json();
      const savedMsg = data?.success && data?.message ? data.message : optimisticMsg;
      setMessages((prev) => {
        const next = [...prev, savedMsg];
        try {
          localStorage.setItem(getLocalCacheKey(selectedPeer), JSON.stringify(next.slice(-80)));
        } catch {}
        return next;
      });
      prevLastMsgIdRef.current = savedMsg.id;
      soundEffects.playSendEmailSound();
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } catch (err) {
      console.error('[InternalChat] Erro ao enviar mensagem (salvo localmente):', err);
      setMessages((prev) => {
        const next = [...prev, optimisticMsg];
        try {
          localStorage.setItem(getLocalCacheKey(selectedPeer), JSON.stringify(next.slice(-80)));
        } catch {}
        return next;
      });
      soundEffects.playSendEmailSound();
    } finally {
      setIsSending(false);
    }
  };

  const handleStartCustomChat = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLocal = customColleagueLocal.trim().toLowerCase().split('@')[0];
    if (!cleanLocal) return;
    const fullPeerEmail = `${cleanLocal}@${domain}`;
    if (fullPeerEmail === currentEmail.toLowerCase()) return;

    if (!colleagues.some((c) => c.email.toLowerCase() === fullPeerEmail)) {
      setColleagues((prev) => [
        {
          email: fullPeerEmail,
          name: cleanLocal.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          status: 'offline',
          isOnline: false,
          unreadCount: 0,
        },
        ...prev,
      ]);
    }
    setSelectedPeer(fullPeerEmail);
    setCustomColleagueLocal('');
    setShowAddColleague(false);
  };

  const onlineColleaguesCount = colleagues.filter((c) => c.isOnline).length;
  const activeColleagueObj = colleagues.find(
    (c) => c.email.toLowerCase() === selectedPeer.toLowerCase()
  );

  const getStatusDotColor = (status: string, isOnline: boolean) => {
    if (!isOnline) return 'bg-neutral-400';
    if (status === 'busy') return 'bg-rose-500';
    if (status === 'away') return 'bg-amber-400';
    return 'bg-emerald-500';
  };

  if (!domain && !isOpen) return null;

  return (
    <>
      {/* Botão Flutuante Rápido de Chat Interno da Equipa (@dominio) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => onToggleOpen(true)}
          className="fixed bottom-5 right-5 z-[9980] flex items-center space-x-2.5 px-4 py-3 bg-neutral-950 hover:bg-black text-white rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.45)] border border-emerald-500/40 transition-all duration-200 cursor-pointer group active:scale-95"
          title={`Abrir Chat Interno da Equipa @${domain}`}
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400">
            <MessageSquare className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-extrabold tracking-tight text-white">
                Chat da Equipa
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-emerald-300">
                @{domain}
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 block">
              {onlineColleaguesCount > 0
                ? `${onlineColleaguesCount} colega(s) online agora`
                : 'Comunicação interna instantânea'}
            </span>
          </div>
          {totalUnread > 0 && (
            <span className="px-2 py-0.5 bg-emerald-500 text-neutral-950 font-black text-xs rounded-full shadow-xs animate-bounce">
              {totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Janela / Gaveta do Chat Interno Corporativo (@dominio) */}
      {isOpen && (
        <div
          className={`fixed z-[9990] bg-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.45)] border border-neutral-200 overflow-hidden flex flex-col transition-all duration-200 animate-in zoom-in-95 ${
            isExpanded
              ? 'inset-3 sm:inset-6'
              : 'bottom-3 right-3 left-3 sm:left-auto sm:bottom-5 sm:right-5 sm:w-[760px] h-[82vh] sm:h-[560px]'
          }`}
        >
          {/* Cabeçalho Escuro Corporativo */}
          <div className="bg-neutral-950 text-white px-4 py-3 border-b border-neutral-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              {/* Avatar do Utilizador Atual (Clicável para alterar Foto de Perfil) */}
              <button
                type="button"
                onClick={() => setShowProfileEditor(!showProfileEditor)}
                className="relative w-9 h-9 rounded-full bg-emerald-500/20 border-2 border-emerald-400/60 flex items-center justify-center text-emerald-300 shrink-0 overflow-hidden group cursor-pointer"
                title="Clique para colocar ou alterar a sua Foto de Perfil"
              >
                {selfAvatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selfAvatarUrl}
                    alt={selfDisplayName || safeEmail}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-extrabold text-emerald-300">
                    {(selfDisplayName || safeEmail).charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </span>
              </button>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs sm:text-sm font-extrabold tracking-tight truncate">
                    Chat Corporativo Interno
                  </h3>
                  <a
                    href={`https://${domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/30 shrink-0 inline-flex items-center space-x-1 transition cursor-pointer"
                    title={`Visitar o site oficial https://${domain}`}
                  >
                    <Globe className="w-3 h-3 text-emerald-400" />
                    <span>{domain}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-emerald-400" />
                  </a>
                </div>
                <p className="text-[10px] text-neutral-400 truncate">
                  Comunicação instantânea sem enviar e-mail · Exclusivo para membros de @{domain}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              {/* Botão Rápido: Foto de Perfil */}
              <button
                type="button"
                onClick={() => setShowProfileEditor(!showProfileEditor)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center space-x-1.5 border ${
                  showProfileEditor
                    ? 'bg-emerald-500 text-neutral-950 border-emerald-400'
                    : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                }`}
                title="Colocar ou alterar foto de perfil e nome"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Foto de Perfil</span>
              </button>

              {/* Seletor de Estado Pessoal */}
              <div className="hidden sm:flex items-center space-x-1.5 bg-white/10 border border-white/15 px-2.5 py-1 rounded-xl">
                <span
                  className={`w-2 h-2 rounded-full ${getStatusDotColor(selfStatus, true)}`}
                />
                <select
                  value={selfStatus}
                  onChange={(e) => handleUpdateStatus(e.target.value as any)}
                  className="bg-transparent text-[11px] font-bold text-white outline-none cursor-pointer"
                >
                  <option value="online" className="text-neutral-900">
                    Disponível
                  </option>
                  <option value="busy" className="text-neutral-900">
                    Ocupado
                  </option>
                  <option value="away" className="text-neutral-900">
                    Ausente
                  </option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer hidden sm:inline-flex"
                title={isExpanded ? 'Restaurar tamanho' : 'Maximizar chat'}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onToggleOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                title="Fechar chat interno"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Painel Rápido de Foto de Perfil & Nome de Exibição */}
          {showProfileEditor && (
            <div className="bg-neutral-900 text-white px-4 py-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-1 duration-150 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="relative w-12 h-12 rounded-full bg-neutral-800 border-2 border-emerald-400 flex items-center justify-center overflow-hidden shrink-0">
                  {selfAvatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selfAvatarUrl}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-neutral-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <label className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-[11px] rounded-xl transition cursor-pointer inline-flex items-center space-x-1.5 shadow-xs">
                      {isUploadingAvatar ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                      <span>{isUploadingAvatar ? 'A carregar...' : 'Escolher Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFileSelect}
                        disabled={isUploadingAvatar}
                      />
                    </label>
                    {selfAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => handleSaveProfileUpdate('', selfDisplayName)}
                        className="px-2.5 py-1 bg-white/10 hover:bg-rose-500/20 text-rose-300 border border-white/10 rounded-xl text-[11px] font-bold transition cursor-pointer inline-flex items-center space-x-1"
                        title="Remover foto atual"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    A sua foto aparece para todos os colegas de <span className="font-mono text-emerald-300">@{domain}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-1 sm:max-w-xs">
                <input
                  type="text"
                  value={selfDisplayName}
                  onChange={(e) => setSelfDisplayName(e.target.value)}
                  placeholder="Seu nome na equipa..."
                  className="flex-1 px-3 py-1.5 bg-white/10 border border-white/15 rounded-xl text-xs text-white font-bold placeholder:text-neutral-400 outline-none focus:border-emerald-400"
                />
                <button
                  type="button"
                  onClick={() => handleSaveProfileUpdate(selfAvatarUrl, selfDisplayName)}
                  className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-950 font-extrabold text-[11px] rounded-xl transition cursor-pointer inline-flex items-center space-x-1 shrink-0"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{profileSavedToast ? 'Salvo!' : 'Guardar'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Corpo Principal: Lista de Canais/Colegas + Conversa */}
          <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
            {/* Coluna Esquerda: Canal Geral & Colegas do Domínio */}
            <div className="w-full sm:w-60 bg-neutral-50 border-b sm:border-b-0 sm:border-r border-neutral-200 flex flex-col shrink-0 max-h-44 sm:max-h-none">
              <div className="p-2.5 border-b border-neutral-200/80 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
                  Canais & Colegas ({colleagues.length + 1})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddColleague(!showAddColleague)}
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center space-x-1"
                  title="Iniciar conversa com outro endereço deste domínio"
                >
                  <Plus className="w-3 h-3" />
                  <span>Novo</span>
                </button>
              </div>

              {showAddColleague && (
                <form
                  onSubmit={handleStartCustomChat}
                  className="p-2 bg-white border-b border-neutral-200 space-y-1.5"
                >
                  <label className="block text-[10px] font-bold text-neutral-600">
                    Utilizador do domínio @{domain}:
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={customColleagueLocal}
                      onChange={(e) => setCustomColleagueLocal(e.target.value)}
                      placeholder="ex: comercial"
                      className="w-full px-2 py-1 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 font-bold outline-none focus:border-neutral-900"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-neutral-900 text-white text-[11px] font-bold rounded-lg hover:bg-black cursor-pointer shrink-0"
                    >
                      Abrir
                    </button>
                  </div>
                </form>
              )}

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Canal Geral da Equipa */}
                <button
                  type="button"
                  onClick={() => setSelectedPeer('general')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                    selectedPeer === 'general'
                      ? 'bg-neutral-900 text-white font-bold shadow-xs'
                      : 'text-neutral-700 hover:bg-neutral-200/70 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedPeer === 'general'
                          ? 'bg-emerald-500 text-neutral-950'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      <Hash className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left truncate">
                      <span className="block truncate">Geral da Equipa</span>
                      <span
                        className={`text-[10px] block truncate ${
                          selectedPeer === 'general' ? 'text-neutral-300' : 'text-neutral-400'
                        }`}
                      >
                        Todos @{domain}
                      </span>
                    </div>
                  </div>
                  {generalUnread > 0 && (
                    <span className="px-1.5 py-0.2 bg-emerald-500 text-neutral-950 font-black text-[10px] rounded-full">
                      {generalUnread}
                    </span>
                  )}
                </button>

                {/* Lista de Colegas do Mesmo Domínio */}
                {colleagues.length === 0 ? (
                  <div className="p-3 text-center text-[11px] text-neutral-400">
                    Use o botão <strong>+ Novo</strong> acima para conversar diretamente com qualquer colega @{domain}.
                  </div>
                ) : (
                  colleagues.map((col) => {
                    const isSelected =
                      selectedPeer.toLowerCase() === col.email.toLowerCase();
                    return (
                      <button
                        key={col.email}
                        type="button"
                        onClick={() => setSelectedPeer(col.email)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white font-bold shadow-xs'
                            : 'text-neutral-700 hover:bg-neutral-200/70 font-medium'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <div className="relative shrink-0">
                            {col.avatarUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={col.avatarUrl}
                                alt={col.name}
                                className="w-7 h-7 rounded-full object-cover border border-neutral-300"
                              />
                            ) : (
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] ${
                                  isSelected
                                    ? 'bg-white text-neutral-900'
                                    : 'bg-neutral-200 text-neutral-800'
                                }`}
                              >
                                {col.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${getStatusDotColor(
                                col.status,
                                col.isOnline
                              )}`}
                            />
                          </div>
                          <div className="text-left truncate">
                            <span className="block truncate">{col.name}</span>
                            <span
                              className={`text-[10px] font-mono block truncate ${
                                isSelected ? 'text-neutral-300' : 'text-neutral-400'
                              }`}
                            >
                              {col.email.split('@')[0]}
                            </span>
                          </div>
                        </div>

                        {col.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 bg-emerald-500 text-neutral-950 font-black text-[10px] rounded-full">
                            {col.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Coluna Direita: Mensagens em Tempo Real */}
            <div className="flex-1 flex flex-col min-h-0 bg-white">
              {/* Sub-cabeçalho da Conversa Ativa */}
              <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
                {selectedPeer === 'general' ? (
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-extrabold text-neutral-900">
                        Canal Geral da Equipa (@{domain})
                      </h4>
                      <p className="text-[10px] text-neutral-500">
                        Visível para todas as contas corporativas de @{domain}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2.5">
                    <div className="relative">
                      {activeColleagueObj?.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={activeColleagueObj.avatarUrl}
                          alt={activeColleagueObj.name}
                          className="w-8 h-8 rounded-full object-cover border border-neutral-300"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                          {(activeColleagueObj?.name || selectedPeer).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${getStatusDotColor(
                          activeColleagueObj?.status || 'offline',
                          !!activeColleagueObj?.isOnline
                        )}`}
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-neutral-900">
                        {activeColleagueObj?.name || selectedPeer.split('@')[0]}
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {selectedPeer} ·{' '}
                        {activeColleagueObj?.isOnline ? (
                          <span className="text-emerald-600 font-sans font-bold">
                            Online agora
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-sans">
                            Mensagem direta privada
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/60">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-2.5 text-neutral-500">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-neutral-700">
                      Nenhuma mensagem ainda neste canal
                    </p>
                    <p className="text-[11px] text-neutral-400 max-w-xs mt-1">
                      Envie um &ldquo;Olá!&rdquo; ou partilhe um ficheiro instantaneamente com a sua equipa @{domain} sem precisar de enviar e-mail.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe =
                      msg.fromEmail.toLowerCase() === safeEmail.toLowerCase();
                    const isReadByOthers = (msg.readBy || []).some(
                      (r) => r.toLowerCase() !== safeEmail.toLowerCase()
                    );
                    const senderColleague = colleagues.find(
                      (c) => c.email.toLowerCase() === msg.fromEmail.toLowerCase()
                    );
                    const bubbleAvatarUrl = isMe
                      ? selfAvatarUrl || msg.fromAvatarUrl
                      : msg.fromAvatarUrl || senderColleague?.avatarUrl || '';
                    const bubbleDisplayName = isMe
                      ? 'Você'
                      : senderColleague?.name || msg.fromName;

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${
                          isMe ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        {/* Avatar circular ao lado da mensagem */}
                        <div className="shrink-0 mb-0.5">
                          {bubbleAvatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={bubbleAvatarUrl}
                              alt={bubbleDisplayName}
                              className="w-7 h-7 rounded-full object-cover border border-neutral-300 shadow-2xs"
                            />
                          ) : (
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[11px] shadow-2xs ${
                                isMe
                                  ? 'bg-neutral-900 text-emerald-400 border border-neutral-700'
                                  : 'bg-neutral-200 text-neutral-800 border border-neutral-300'
                              }`}
                            >
                              {(isMe ? selfDisplayName || safeEmail : bubbleDisplayName)
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div
                          className={`flex flex-col max-w-[78%] sm:max-w-[72%] ${
                            isMe ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 mb-1 px-1">
                            <span className="text-[10px] font-bold text-neutral-600">
                              {bubbleDisplayName}
                            </span>
                            <span className="text-[9px] text-neutral-400 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div
                            className={`w-full rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs space-y-2 ${
                              isMe
                                ? 'bg-neutral-900 text-white rounded-br-xs'
                                : 'bg-white text-neutral-900 border border-neutral-200 rounded-bl-xs'
                            }`}
                          >
                          {msg.text && (
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              {msg.text}
                            </p>
                          )}

                          {msg.attachmentUrl && (
                            <div
                              className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                                isMe
                                  ? 'bg-white/10 border-white/15 text-white'
                                  : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                {msg.attachmentType?.startsWith('image/') ? (
                                  <ImageIcon className="w-4 h-4 shrink-0 text-emerald-400" />
                                ) : (
                                  <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
                                )}
                                <span className="text-[11px] font-bold truncate">
                                  {msg.attachmentName || 'Ficheiro partilhado'}
                                </span>
                              </div>
                              <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={msg.attachmentName}
                                className="p-1 hover:bg-black/20 rounded-lg transition shrink-0"
                                title="Abrir ou descarregar ficheiro"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}

                          {isMe && (
                            <div className="flex items-center justify-end space-x-1 text-[9px] text-neutral-400 pt-0.5">
                              <CheckCircle2
                                className={`w-3 h-3 ${
                                  isReadByOthers
                                    ? 'text-emerald-400'
                                    : 'text-neutral-500'
                                }`}
                              />
                              <span>{isReadByOthers ? 'Visto' : 'Enviado'}</span>
                            </div>
                          )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Barra de Ficheiro Pendente */}
              {pendingAttachment && (
                <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate text-emerald-900 font-bold">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{pendingAttachment.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingAttachment(null)}
                    className="text-emerald-700 hover:text-rose-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Formulário de Envio Instantâneo */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white border-t border-neutral-200 flex items-center space-x-2 shrink-0"
              >
                <label
                  className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition cursor-pointer shrink-0"
                  title="Partilhar ficheiro ou imagem no chat"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>

                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    selectedPeer === 'general'
                      ? `Mensagem rápida para toda a equipa @${domain}...`
                      : `Mensagem direta para ${
                          activeColleagueObj?.name || selectedPeer.split('@')[0]
                        }...`
                  }
                  className="flex-1 px-3.5 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs text-neutral-900 font-medium outline-none focus:bg-white focus:border-neutral-900 transition"
                />

                <button
                  type="submit"
                  disabled={
                    isSending || (!messageText.trim() && !pendingAttachment)
                  }
                  className="px-4 py-2.5 bg-neutral-900 hover:bg-black disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-xs shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


import { apiEndpoint } from './siteConfig';

export interface WebmailAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
  cid?: string;
  related?: boolean;
}

export interface WebmailMessage {
  id: string;
  uid?: number;
  accountEmail: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  ccEmail?: string;
  bccEmail?: string;
  subject: string;
  body: string;
  textPreview?: string;
  date: string;
  scheduledFor?: string;
  isRead: boolean;
  starred: boolean;
  pinned?: boolean;
  priority?: 'high' | 'normal' | 'low';
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'scheduled';
  avatarColor?: string;
  attachments?: WebmailAttachment[];
}

// Limites de anexos
export const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024; // 10MB em bytes
export const ATTACHMENT_MAX_COUNT = 10; // Maximo de 10 anexos por email
export const ATTACHMENT_TOTAL_MAX_SIZE = 25 * 1024 * 1024; // 25MB total por email

const WEBMAIL_STORAGE_KEY = 'wehosthere_webmail_drafts';
const WEBMAIL_SCHEDULED_KEY = 'wehosthere_webmail_scheduled';
const WEBMAIL_PINNED_KEY = 'wehosthere_webmail_pinned';
const WEBMAIL_PRIORITY_KEY = 'wehosthere_webmail_priorities';

// Mapeamento de pasta UI -> nome IMAP real (Migadu)
export const FOLDER_IMAP_MAP: Record<string, string> = {
  inbox: 'INBOX',
  sent: 'Sent',
  drafts: 'Drafts',
  trash: 'Trash',
};

const WEBMAIL_SENT_KEY = 'wehosthere_webmail_sent_cache';

/**
 * Remove payloads base64 pesados antes de gravar no localStorage (evita QuotaExceededError)
 */
function sanitizeAttachmentsForStorage(attachments?: WebmailAttachment[]): WebmailAttachment[] | undefined {
  if (!attachments || attachments.length === 0) return undefined;
  return attachments.map((att) => ({
    name: att.name,
    size: att.size,
    type: att.type,
    url: att.url && att.url.length <= 32768 ? att.url : '',
  }));
}

/**
 * Converte uma data URL (data:mime;base64,...) em Blob binário para envio multipart sem inflação de 33% do Base64
 */
function dataUrlToBlob(dataUrl: string, fallbackType = 'application/octet-stream'): Blob {
  const parts = dataUrl.split(',');
  const header = parts[0] || '';
  const base64 = parts[1] || '';
  const mimeMatch = header.match(/data:([^;]+);/);
  const mime = mimeMatch ? mimeMatch[1] : fallbackType;
  const binaryStr = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export const webmailManager = {
  isRealEmailAvailable: (email: string, password: string): boolean => {
    return !!(email && password);
  },

  getPinnedSet: (accountEmail?: string): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const key = `${WEBMAIL_PINNED_KEY}_${(accountEmail || 'default').toLowerCase()}`;
      const data = localStorage.getItem(key);
      return data ? new Set(JSON.parse(data)) : new Set();
    } catch {
      return new Set();
    }
  },

  togglePin: (msgId: string, accountEmail?: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const key = `${WEBMAIL_PINNED_KEY}_${(accountEmail || 'default').toLowerCase()}`;
      const pinnedSet = webmailManager.getPinnedSet(accountEmail);
      let isPinned = false;
      if (pinnedSet.has(msgId)) {
        pinnedSet.delete(msgId);
        isPinned = false;
      } else {
        pinnedSet.add(msgId);
        isPinned = true;
      }
      localStorage.setItem(key, JSON.stringify(Array.from(pinnedSet)));
      return isPinned;
    } catch {
      return false;
    }
  },

  getPriorityMap: (accountEmail?: string): Record<string, 'high' | 'normal' | 'low'> => {
    if (typeof window === 'undefined') return {};
    try {
      const key = `${WEBMAIL_PRIORITY_KEY}_${(accountEmail || 'default').toLowerCase()}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  setMessagePriority: (msgId: string, priority: 'high' | 'normal' | 'low', accountEmail?: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const key = `${WEBMAIL_PRIORITY_KEY}_${(accountEmail || 'default').toLowerCase()}`;
      const map = webmailManager.getPriorityMap(accountEmail);
      map[msgId] = priority;
      localStorage.setItem(key, JSON.stringify(map));
    } catch {}
  },

  /**
   * Busca mensagens de uma pasta especifica via IMAP (Migadu) com sincronização em tempo real.
   */
  getMessages: async (
    accountEmail?: string,
    password?: string,
    folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'scheduled' = 'inbox'
  ): Promise<WebmailMessage[]> => {
    const pinnedSet = webmailManager.getPinnedSet(accountEmail);
    const priorityMap = webmailManager.getPriorityMap(accountEmail);

    const enrichMessage = (msg: WebmailMessage): WebmailMessage => {
      const isPinned = pinnedSet.has(msg.id) || !!msg.pinned;
      const customPriority = priorityMap[msg.id];
      let effectivePriority = customPriority || msg.priority || 'normal';
      if (!customPriority && !msg.priority) {
        const subj = (msg.subject || '').toUpperCase();
        if (subj.includes('URGENTE') || subj.includes('PRIORIDADE ALTA') || subj.includes('[HIGH]') || subj.includes('[URGENT]')) {
          effectivePriority = 'high';
        }
      }
      return {
        ...msg,
        pinned: isPinned,
        priority: effectivePriority
      };
    };

    const sortMessages = (list: WebmailMessage[]) => {
      return [...list].sort((a, b) => {
        // Pinned messages first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        // Then by date descending
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    };

    // 0. Agendados (Fila de envio programado)
    if (folder === 'scheduled') {
      const scheduledList = await webmailManager.getScheduledMessages(accountEmail);
      return [...scheduledList]
        .map(enrichMessage)
        .sort((a, b) => {
          const tA = new Date(a.scheduledFor || a.date).getTime();
          const tB = new Date(b.scheduledFor || b.date).getTime();
          return tA - tB;
        });
    }

    // 1. Rascunhos (Local + IMAP se disponível)
    if (folder === 'drafts') {
      const localDrafts = await webmailManager.getDrafts(accountEmail);
      if (accountEmail && password) {
        try {
          const params = new URLSearchParams({
            email: accountEmail,
            password,
            folder: 'Drafts',
          });
          const res = await fetch(apiEndpoint(`/api/webmail/messages?${params.toString()}`));
          if (res.ok) {
            const data = await res.json();
            const imapDrafts = (data.messages || []).map((msg: WebmailMessage) => ({
              ...msg,
              folder: 'drafts' as const,
              accountEmail,
            }));
            // Merge deduping by subject and date
            const combined = [...localDrafts];
            for (const idraft of imapDrafts) {
              if (!combined.some(d => d.subject === idraft.subject && Math.abs(new Date(d.date).getTime() - new Date(idraft.date).getTime()) < 60000)) {
                combined.push(idraft);
              }
            }
            return sortMessages(combined.map(enrichMessage));
          }
        } catch {}
      }
      return sortMessages(localDrafts.map(enrichMessage));
    }

    // 2. Mensagens via IMAP (Inbox, Sent, Trash)
    if (accountEmail && password) {
      try {
        const imapFolder = FOLDER_IMAP_MAP[folder] || 'INBOX';
        const params = new URLSearchParams({
          email: accountEmail,
          password,
          folder: imapFolder,
        });

        const res = await fetch(apiEndpoint(`/api/webmail/messages?${params.toString()}`), {
          method: 'GET',
        });

        let imapMsgs: WebmailMessage[] = [];
        if (res.ok) {
          const data = await res.json();
          imapMsgs = (data.messages || []).map((msg: WebmailMessage) => ({
            ...msg,
            folder,
            accountEmail,
          }));
        }

        // Para pasta "Enviados" (sent), mesclar com cache local para exibição instantânea
        if (folder === 'sent') {
          const localSent = typeof window !== 'undefined' ? localStorage.getItem(`${WEBMAIL_SENT_KEY}_${accountEmail.toLowerCase()}`) : null;
          const sentCache: WebmailMessage[] = localSent ? JSON.parse(localSent) : [];
          
          // Mesclar mensagens mantendo ordenação por data mais recente
          const allSent = [...imapMsgs];
          for (const localMsg of sentCache) {
            const alreadyInImap = allSent.some(m => 
              m.subject === localMsg.subject && 
              m.toEmail === localMsg.toEmail &&
              Math.abs(new Date(m.date).getTime() - new Date(localMsg.date).getTime()) < 120000
            );
            if (!alreadyInImap) {
              allSent.push(localMsg);
            }
          }
          return sortMessages(allSent.map(enrichMessage));
        }

        return sortMessages(imapMsgs.map(enrichMessage));
      } catch (error) {
        console.error('[Webmail] API fetch failed:', error);
        if (folder === 'sent') {
          const localSent = typeof window !== 'undefined' ? localStorage.getItem(`${WEBMAIL_SENT_KEY}_${accountEmail.toLowerCase()}`) : null;
          const list = localSent ? JSON.parse(localSent) : [];
          return sortMessages(list.map(enrichMessage));
        }
        return [];
      }
    }

    // Fallback para sent local se sem credenciais
    if (folder === 'sent' && accountEmail) {
      const localSent = typeof window !== 'undefined' ? localStorage.getItem(`${WEBMAIL_SENT_KEY}_${accountEmail.toLowerCase()}`) : null;
      const list = localSent ? JSON.parse(localSent) : [];
      return sortMessages(list.map(enrichMessage));
    }

    return [];
  },

  sendMessage: async (
    accountEmail: string,
    password: string,
    toEmail: string,
    subject: string,
    body: string,
    attachments?: WebmailAttachment[],
    priority: 'high' | 'normal' | 'low' = 'normal',
    cc?: string,
    bcc?: string
  ): Promise<WebmailMessage> => {
    let res: Response;

    const hasDataUrlAttachments = attachments?.some((a) => a.url && a.url.startsWith('data:'));

    if (attachments && attachments.length > 0 && hasDataUrlAttachments && typeof FormData !== 'undefined') {
      // Enviar como multipart/form-data binário (e incluir também eventuais anexos Cloudinary remotos)
      const formData = new FormData();
      formData.append('email', accountEmail);
      formData.append('password', password);
      formData.append('to', toEmail);
      if (cc) formData.append('cc', cc);
      if (bcc) formData.append('bcc', bcc);
      formData.append('subject', subject);
      formData.append('body', body);
      formData.append('priority', priority);

      const remoteAtts: WebmailAttachment[] = [];
      for (const att of attachments) {
        if (att.url && att.url.startsWith('data:')) {
          const blob = dataUrlToBlob(att.url, att.type);
          formData.append('files', blob, att.name || 'anexo');
        } else if (att.url && (att.url.startsWith('http://') || att.url.startsWith('https://'))) {
          remoteAtts.push(att);
        }
      }
      if (remoteAtts.length > 0) {
        formData.append('remoteAttachments', JSON.stringify(remoteAtts));
      }

      res = await fetch(apiEndpoint('/api/webmail/send'), {
        method: 'POST',
        body: formData,
      });
    } else {
      // Quando os anexos já estão no Cloudinary (URLs https:// leves), o JSON tem apenas ~1KB
      res = await fetch(apiEndpoint('/api/webmail/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: accountEmail,
          password,
          to: toEmail,
          cc,
          bcc,
          subject,
          body,
          priority,
          attachments,
        }),
      });
    }

    if (!res.ok) {
      if (res.status === 413) {
        throw new Error(
          'Os anexos excedem o limite máximo de envio direto do servidor (~4.2 MB por mensagem). Por favor, comprima o PDF ou envie os ficheiros em e-mails separados.'
        );
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Não foi possível enviar o e-mail.');
    }

    const sentMessage: WebmailMessage = {
      id: `sent-${Date.now()}`,
      accountEmail,
      fromName: accountEmail.split('@')[0],
      fromEmail: accountEmail,
      toEmail,
      subject,
      body,
      date: new Date().toISOString(),
      isRead: true,
      starred: false,
      priority,
      folder: 'sent',
      avatarColor: 'bg-primary-600',
      attachments: sanitizeAttachmentsForStorage(attachments),
    };

    // Salvar no cache local de enviados sem estourar a quota do localStorage
    if (typeof window !== 'undefined') {
      try {
        const cacheKey = `${WEBMAIL_SENT_KEY}_${accountEmail.toLowerCase()}`;
        const existing = localStorage.getItem(cacheKey);
        const list: WebmailMessage[] = existing ? JSON.parse(existing) : [];
        list.unshift(sentMessage);
        localStorage.setItem(cacheKey, JSON.stringify(list.slice(0, 35)));
      } catch {
        try {
          const cacheKey = `${WEBMAIL_SENT_KEY}_${accountEmail.toLowerCase()}`;
          localStorage.setItem(cacheKey, JSON.stringify([sentMessage]));
        } catch {}
      }
    }

    return sentMessage;
  },

  toggleStar: async (
    msgId: string,
    accountEmail?: string,
    password?: string,
    uid?: number,
    imapFolder?: string
  ): Promise<void> => {
    if (accountEmail && password && uid) {
      try {
        await fetch(apiEndpoint('/api/webmail/toggle-star'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: accountEmail,
            password,
            uid,
            folder: imapFolder || 'INBOX',
          }),
        });
      } catch (error) {
        console.error('[Webmail] API toggle star failed:', error);
      }
    }
  },

  markAsRead: async (
    msgId: string,
    isRead = true,
    accountEmail?: string,
    password?: string,
    uid?: number,
    imapFolder?: string
  ): Promise<void> => {
    if (accountEmail && password && uid) {
      try {
        await fetch(apiEndpoint('/api/webmail/mark-read'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: accountEmail,
            password,
            uid,
            isRead,
            folder: imapFolder || 'INBOX',
          }),
        });
      } catch (error) {
        console.error('[Webmail] API mark as read failed:', error);
      }
    }
  },

  moveFolder: async (
    msgId: string,
    newFolder: 'inbox' | 'sent' | 'drafts' | 'trash',
    accountEmail?: string,
    password?: string,
    uid?: number,
    fromImapFolder?: string
  ): Promise<void> => {
    if (accountEmail && password && uid) {
      try {
        const res = await fetch(apiEndpoint('/api/webmail/move'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: accountEmail,
            password,
            uid,
            fromFolder: fromImapFolder || 'INBOX',
            toFolder: FOLDER_IMAP_MAP[newFolder] || 'Trash',
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error('[Webmail] Move failed:', data.error);
        }
      } catch (error) {
        console.error('[Webmail] API move folder failed:', error);
      }
    }
    // If moving from sent, remove from local sent cache
    if (typeof window !== 'undefined' && accountEmail && fromImapFolder === 'Sent') {
      try {
        const sentKey = `${WEBMAIL_SENT_KEY}_${accountEmail.toLowerCase()}`;
        const stored = localStorage.getItem(sentKey);
        if (stored) {
          const sentList: WebmailMessage[] = JSON.parse(stored);
          const filtered = sentList.filter((m) => m.id !== msgId && (uid ? m.uid !== uid : true));
          localStorage.setItem(sentKey, JSON.stringify(filtered));
        }
      } catch {}
    }
  },

  deletePermanently: async (
    msgId: string,
    accountEmail?: string,
    password?: string,
    uid?: number,
    imapFolder?: string
  ): Promise<void> => {
    if (accountEmail && password && uid) {
      try {
        const res = await fetch(apiEndpoint('/api/webmail/delete'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: accountEmail,
            password,
            uid,
            folder: imapFolder || 'INBOX',
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error('[Webmail] Delete failed:', data.error);
        }
      } catch (error) {
        console.error('[Webmail] API delete failed:', error);
      }
    }
    // Remove from local drafts if it is a draft
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(WEBMAIL_STORAGE_KEY);
        if (stored) {
          const drafts: WebmailMessage[] = JSON.parse(stored);
          const filtered = drafts.filter((m) => m.id !== msgId);
          localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(filtered));
        }
      } catch {}
      try {
        const storedSched = localStorage.getItem(WEBMAIL_SCHEDULED_KEY);
        if (storedSched) {
          const schedList: WebmailMessage[] = JSON.parse(storedSched);
          const filteredSched = schedList.filter((m) => m.id !== msgId);
          localStorage.setItem(WEBMAIL_SCHEDULED_KEY, JSON.stringify(filteredSched));
        }
      } catch {}
      // Remove from local sent cache
      if (accountEmail) {
        try {
          const sentKey = `${WEBMAIL_SENT_KEY}_${accountEmail.toLowerCase()}`;
          const storedSent = localStorage.getItem(sentKey);
          if (storedSent) {
            const sentList: WebmailMessage[] = JSON.parse(storedSent);
            const filteredSent = sentList.filter((m) => m.id !== msgId && (uid ? m.uid !== uid : true));
            localStorage.setItem(sentKey, JSON.stringify(filteredSent));
          }
        } catch {}
      }
    }
  },

  saveDraft: async (
    accountEmail: string,
    toEmail: string,
    subject: string,
    body: string,
    attachments?: WebmailAttachment[],
    password?: string
  ): Promise<WebmailMessage> => {
    let drafts: WebmailMessage[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(WEBMAIL_STORAGE_KEY);
        drafts = stored ? JSON.parse(stored) : [];
      } catch {
        drafts = [];
      }
    }

    const existingIdx = drafts.findIndex(
      (m) =>
        m.folder === 'drafts' &&
        (m.accountEmail || '').toLowerCase() === (accountEmail || '').toLowerCase() &&
        (m.toEmail || '').toLowerCase() === (toEmail || '').toLowerCase() &&
        (m.subject || '').toLowerCase() === (subject || '').toLowerCase()
    );

    const draftData = {
      accountEmail,
      fromName: (accountEmail || '').split('@')[0] || 'Rascunho',
      fromEmail: accountEmail,
      toEmail,
      subject,
      body,
      date: new Date().toISOString(),
      isRead: true,
      starred: false,
      folder: 'drafts' as const,
      avatarColor: 'bg-gray-500',
      attachments: sanitizeAttachmentsForStorage(attachments),
    };

    if (existingIdx !== -1) {
      drafts[existingIdx] = { ...drafts[existingIdx], ...draftData };
    } else {
      drafts.unshift({ id: `draft-${Date.now()}`, ...draftData });
    }

    // Manter no máximo 20 rascunhos leves sem base64 pesado
    const trimmedDrafts = drafts.slice(0, 20).map((d) => ({
      ...d,
      attachments: sanitizeAttachmentsForStorage(d.attachments),
    }));

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(trimmedDrafts));
      } catch {
        try {
          // Caso o localStorage esteja cheio por rascunhos antigos com base64, limpar e guardar apenas o atual
          localStorage.removeItem(WEBMAIL_STORAGE_KEY);
          localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify([trimmedDrafts[0]]));
        } catch {}
      }
    }

    return existingIdx !== -1 ? drafts[existingIdx] : drafts[0];
  },

  getDrafts: async (accountEmail?: string, password?: string): Promise<WebmailMessage[]> => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(WEBMAIL_STORAGE_KEY) : null;
      const drafts: WebmailMessage[] = stored ? JSON.parse(stored) : [];
      if (accountEmail) {
        return drafts.filter((m) => (m.accountEmail || '').toLowerCase() === accountEmail.toLowerCase());
      }
      return drafts;
    } catch {
      return [];
    }
  },

  scheduleMessage: async (
    accountEmail: string,
    toEmail: string,
    subject: string,
    body: string,
    scheduledForIso: string,
    attachments?: WebmailAttachment[],
    priority: 'high' | 'normal' | 'low' = 'normal',
    ccEmail?: string,
    bccEmail?: string,
    existingId?: string
  ): Promise<WebmailMessage> => {
    let scheduledList: WebmailMessage[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(WEBMAIL_SCHEDULED_KEY);
        scheduledList = stored ? JSON.parse(stored) : [];
      } catch {
        scheduledList = [];
      }
    }

    // Preservar URLs remotas (Cloudinary https://) e data URLs moderadas
    const safeAttachments = attachments?.map((att) => ({
      name: att.name,
      size: att.size,
      type: att.type,
      url:
        att.url && (att.url.startsWith('http://') || att.url.startsWith('https://') || att.url.length <= 350000)
          ? att.url
          : '',
    }));

    const msgData: WebmailMessage = {
      id: existingId || `sched-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      accountEmail,
      fromName: (accountEmail || '').split('@')[0] || 'Agendado',
      fromEmail: accountEmail,
      toEmail,
      ccEmail,
      bccEmail,
      subject: subject || '(Sem assunto)',
      body,
      date: new Date().toISOString(),
      scheduledFor: scheduledForIso,
      isRead: true,
      starred: false,
      priority,
      folder: 'scheduled',
      avatarColor: 'bg-emerald-600',
      attachments: safeAttachments,
    };

    const existingIdx = existingId ? scheduledList.findIndex((m) => m.id === existingId) : -1;
    if (existingIdx !== -1) {
      scheduledList[existingIdx] = msgData;
    } else {
      scheduledList.unshift(msgData);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(WEBMAIL_SCHEDULED_KEY, JSON.stringify(scheduledList.slice(0, 30)));
      } catch {
        // Se algum anexo data: excedeu a quota, sanitizar estritamente mantendo URLs https://
        const compactList = scheduledList.slice(0, 20).map((item) => ({
          ...item,
          attachments: item.attachments?.map((a) => ({
            ...a,
            url: a.url && (a.url.startsWith('http://') || a.url.startsWith('https://')) ? a.url : '',
          })),
        }));
        try {
          localStorage.setItem(WEBMAIL_SCHEDULED_KEY, JSON.stringify(compactList));
        } catch {}
      }
    }

    return msgData;
  },

  getScheduledMessages: async (accountEmail?: string): Promise<WebmailMessage[]> => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(WEBMAIL_SCHEDULED_KEY) : null;
      const list: WebmailMessage[] = stored ? JSON.parse(stored) : [];
      const filtered = accountEmail
        ? list.filter((m) => (m.accountEmail || '').toLowerCase() === accountEmail.toLowerCase())
        : list;
      return filtered.sort(
        (a, b) => new Date(a.scheduledFor || a.date).getTime() - new Date(b.scheduledFor || b.date).getTime()
      );
    } catch {
      return [];
    }
  },

  removeScheduledMessage: (msgId: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(WEBMAIL_SCHEDULED_KEY);
      if (!stored) return;
      const list: WebmailMessage[] = JSON.parse(stored);
      const filtered = list.filter((m) => m.id !== msgId);
      localStorage.setItem(WEBMAIL_SCHEDULED_KEY, JSON.stringify(filtered));
    } catch {}
  },
};

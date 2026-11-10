import { apiEndpoint } from './siteConfig';

export interface WebmailAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

export interface WebmailMessage {
  id: string;
  uid?: number;
  accountEmail: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
  avatarColor?: string;
  attachments?: WebmailAttachment[];
}

// Limites de anexos
export const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024; // 10MB em bytes
export const ATTACHMENT_MAX_COUNT = 5; // Máximo de 5 anexos por email
export const ATTACHMENT_TOTAL_MAX_SIZE = 25 * 1024 * 1024; // 25MB total por email

const WEBMAIL_STORAGE_KEY = 'wehosthere_webmail_messages';

export const INITIAL_WEBMAIL_MESSAGES: WebmailMessage[] = [
  {
    id: 'wm-1',
    accountEmail: 'ericaguelume@msservices.co.mz',
    fromName: 'Equipa WEHOSTHERE',
    fromEmail: 'info@wehosthere.com',
    toEmail: 'ericaguelume@msservices.co.mz',
    subject: '🎉 Bem-vindo ao seu novo E-mail Corporativo WEHOSTHERE!',
    body: `Olá Erica Guelume,

A sua conta de e-mail corporativo (ericaguelume@msservices.co.mz) foi ativada com sucesso!

A partir de agora pode enviar e receber mensagens de forma profissional com os parâmetros SSL do seu próprio domínio.

Recursos incluídos na sua conta:
- Armazenamento partilhado via pool Migadu
- Proteção Anti-Spam e Anti-Phishing Ativa
- Suporte IMAP, POP3 e SMTP para Outlook/Smartphone

Qualquer dúvida, a nossa equipa de suporte está 24/7 ao seu dispor.

Com os melhores cumprimentos,
Equipa de Engenharia WEHOSTHERE`,
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    isRead: false,
    starred: true,
    folder: 'inbox',
    avatarColor: 'bg-primary-600'
  },
  {
    id: 'wm-2',
    accountEmail: 'ericaguelume@msservices.co.mz',
    fromName: 'Erica Guélume',
    fromEmail: 'ericaguelume@msservices.co.mz',
    toEmail: 'info@wehosthere.com',
    subject: 'Solicitação de Serviço',
    body: '<p>Olá,</p><p>Gostaria de solicitar informações sobre os serviços de hospedagem.</p>',
    date: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
    starred: false,
    folder: 'inbox',
    avatarColor: 'bg-primary-600'
  }
];

export const webmailManager = {
  // Check if real IMAP/SMTP is available
  isRealEmailAvailable: (email: string, password: string): boolean => {
    // Check if email belongs to a domain managed by Migadu
    // This would check against our database in production
    return !!(email && password);
  },

  getMessages: async (accountEmail?: string, password?: string): Promise<WebmailMessage[]> => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, require real credentials
    if (isProduction && (!accountEmail || !password)) {
      throw new Error('Credenciais de email são obrigatórias');
    }

    // Try to fetch from API
    if (accountEmail && password && webmailManager.isRealEmailAvailable(accountEmail, password)) {
      try {
        const params = new URLSearchParams({ email: accountEmail, password });
        const res = await fetch(apiEndpoint(`/api/webmail/messages?${params.toString()}`));
        
        if (res.ok) {
          const data = await res.json();
          return data.messages || [];
        }
      } catch (error) {
        console.error('[Webmail] API fetch failed:', error);
        if (isProduction) {
          throw new Error('Não foi possível conectar ao servidor de email. Verifique as suas credenciais ou tente novamente.');
        }
      }
    }

    // Fallback to localStorage simulation (only in development)
    if (isProduction) {
      throw new Error('Não foi possível conectar ao servidor de email. Verifique as suas credenciais ou tente novamente.');
    }
    
    const stored = localStorage.getItem(WEBMAIL_STORAGE_KEY);
    let messages: WebmailMessage[] = stored ? JSON.parse(stored) : INITIAL_WEBMAIL_MESSAGES;
    if (!stored) {
      localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(INITIAL_WEBMAIL_MESSAGES));
    }
    if (accountEmail) {
      return messages.filter(m => m.accountEmail.toLowerCase() === accountEmail.toLowerCase());
    }
    return messages;
  },

  sendMessage: async (accountEmail: string, password: string, toEmail: string, subject: string, body: string, attachments?: WebmailAttachment[]): Promise<WebmailMessage> => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, require real credentials
    if (isProduction && (!accountEmail || !password)) {
      throw new Error('Credenciais de email são obrigatórias');
    }

    // Try to send via API
    if (password && webmailManager.isRealEmailAvailable(accountEmail, password)) {
      try {
        const res = await fetch(apiEndpoint('/api/webmail/send'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: accountEmail,
            password,
            to: toEmail,
            subject,
            body,
            attachments
          })
        });

        if (res.ok) {
          return {
            id: `smtp-${Date.now()}`,
            accountEmail,
            fromName: accountEmail.split('@')[0],
            fromEmail: accountEmail,
            toEmail,
            subject,
            body,
            date: new Date().toISOString(),
            isRead: true,
            starred: false,
            folder: 'sent',
            avatarColor: 'bg-primary-600',
            attachments: attachments && attachments.length > 0 ? attachments : undefined
          };
        }

        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Erro ${res.status} ao enviar o e-mail.`);
      } catch (error: any) {
        console.error('[Webmail] API send failed:', error);
        if (isProduction) {
          throw new Error(error?.message || 'Não foi possível enviar o email. O servidor de email não está disponível neste momento.');
        }
      }
    }

    // Fallback to localStorage simulation (only in development)
    if (isProduction) {
      throw new Error('Não foi possível enviar o email. O servidor de email não está disponível neste momento.');
    }
    
    const messages = await webmailManager.getMessages();
    const newMsg: WebmailMessage = {
      id: `wm-${Date.now()}`,
      accountEmail,
      fromName: accountEmail.split('@')[0],
      fromEmail: accountEmail,
      toEmail,
      subject,
      body,
      date: new Date().toISOString(),
      isRead: true,
      starred: false,
      folder: 'sent',
      avatarColor: 'bg-primary-600',
      attachments: attachments && attachments.length > 0 ? attachments : undefined
    };
    messages.unshift(newMsg);
    if (typeof window !== 'undefined') {
      localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(messages));
    }
    return newMsg;
  },

  toggleStar: async (id: string, accountEmail?: string, password?: string): Promise<void> => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, require real credentials
    if (isProduction && (!accountEmail || !password)) {
      throw new Error('Credenciais de email são obrigatórias');
    }

    // Try to toggle via API
    if (accountEmail && password && webmailManager.isRealEmailAvailable(accountEmail, password)) {
      try {
        const msg = (await webmailManager.getMessages(accountEmail, password)).find(m => m.id === id);
        if (msg && msg.uid) {
          await fetch(apiEndpoint('/api/webmail/toggle-star'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: accountEmail, password, uid: msg.uid })
          });
        }
      } catch (error) {
        console.error('[Webmail] API toggle star failed:', error);
        if (isProduction) {
          throw new Error('Não foi possível atualizar a mensagem. O servidor de email não está disponível.');
        }
      }
    }

    // Fallback to localStorage simulation (only in development)
    if (isProduction) {
      throw new Error('Não foi possível atualizar a mensagem. O servidor de email não está disponível.');
    }
    
    const messages = await webmailManager.getMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.starred = !msg.starred;
      if (typeof window !== 'undefined') {
        localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(messages));
      }
    }
  },

  markAsRead: async (id: string, isRead = true, accountEmail?: string, password?: string): Promise<void> => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, require real credentials
    if (isProduction && (!accountEmail || !password)) {
      throw new Error('Credenciais de email são obrigatórias');
    }

    // Try to mark via API
    if (accountEmail && password && webmailManager.isRealEmailAvailable(accountEmail, password)) {
      try {
        const msg = (await webmailManager.getMessages(accountEmail, password)).find(m => m.id === id);
        if (msg && msg.uid) {
          await fetch(apiEndpoint('/api/webmail/mark-read'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: accountEmail, password, uid: msg.uid, isRead })
          });
        }
      } catch (error) {
        console.error('[Webmail] API mark as read failed:', error);
        if (isProduction) {
          throw new Error('Não foi possível atualizar a mensagem. O servidor de email não está disponível.');
        }
      }
    }

    // Fallback to localStorage simulation (only in development)
    if (isProduction) {
      throw new Error('Não foi possível atualizar a mensagem. O servidor de email não está disponível.');
    }
    
    const messages = await webmailManager.getMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.isRead = isRead;
      if (typeof window !== 'undefined') {
        localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(messages));
      }
    }
  },

  moveFolder: async (id: string, newFolder: 'inbox' | 'sent' | 'drafts' | 'trash', accountEmail?: string, password?: string): Promise<void> => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, require real credentials
    if (isProduction && (!accountEmail || !password)) {
      throw new Error('Credenciais de email são obrigatórias');
    }

    // Try to move via API
    if (accountEmail && password && webmailManager.isRealEmailAvailable(accountEmail, password)) {
      try {
        const msg = (await webmailManager.getMessages(accountEmail, password)).find(m => m.id === id);
        if (msg && msg.uid) {
          const folderMap = {
            'inbox': 'INBOX',
            'sent': 'Sent',
            'drafts': 'Drafts',
            'trash': 'Trash'
          };
          await fetch(apiEndpoint('/api/webmail/move'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: accountEmail, 
              password, 
              uid: msg.uid, 
              fromFolder: msg.folder, 
              toFolder: folderMap[newFolder] 
            })
          });
        }
      } catch (error) {
        console.error('[Webmail] API move folder failed:', error);
        if (isProduction) {
          throw new Error('Não foi possível mover a mensagem. O servidor de email não está disponível.');
        }
      }
    }

    // Fallback to localStorage simulation (only in development)
    if (isProduction) {
      throw new Error('Não foi possível mover a mensagem. O servidor de email não está disponível.');
    }
    
    const messages = await webmailManager.getMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.folder = newFolder;
      if (typeof window !== 'undefined') {
        localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(messages));
      }
    }
  },

  deletePermanently: async (id: string, accountEmail?: string, password?: string): Promise<void> => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, require real credentials
    if (isProduction && (!accountEmail || !password)) {
      throw new Error('Credenciais de email são obrigatórias');
    }

    // Try to delete via API
    if (accountEmail && password && webmailManager.isRealEmailAvailable(accountEmail, password)) {
      try {
        const msg = (await webmailManager.getMessages(accountEmail, password)).find(m => m.id === id);
        if (msg && msg.uid) {
          await fetch(apiEndpoint('/api/webmail/delete'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: accountEmail, password, uid: msg.uid, folder: msg.folder })
          });
        }
      } catch (error) {
        console.error('[Webmail] API delete failed:', error);
        if (isProduction) {
          throw new Error('Não foi possível apagar a mensagem. O servidor de email não está disponível.');
        }
      }
    }

    // Fallback to localStorage simulation (only in development)
    if (isProduction) {
      throw new Error('Não foi possível apagar a mensagem. O servidor de email não está disponível.');
    }
    
    const messages = await webmailManager.getMessages();
    const filtered = messages.filter(m => m.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(filtered));
    }
  },

  saveDraft: async (accountEmail: string, toEmail: string, subject: string, body: string, attachments?: WebmailAttachment[], password?: string): Promise<WebmailMessage> => {
    // For drafts, we always use localStorage for now
    // In production, you might want to save drafts on the IMAP server
    const messages = await webmailManager.getMessages();
    const existingDraftIndex = messages.findIndex(m => 
      m.folder === 'drafts' && 
      m.accountEmail.toLowerCase() === accountEmail.toLowerCase() &&
      m.toEmail.toLowerCase() === toEmail.toLowerCase() &&
      m.subject.toLowerCase() === subject.toLowerCase()
    );

    const draftData = {
      accountEmail,
      fromName: accountEmail.split('@')[0],
      fromEmail: accountEmail,
      toEmail,
      subject,
      body,
      date: new Date().toISOString(),
      isRead: true,
      starred: false,
      folder: 'drafts' as const,
      avatarColor: 'bg-gray-500',
      attachments: attachments && attachments.length > 0 ? attachments : undefined
    };

    if (existingDraftIndex !== -1) {
      // Atualiza rascunho existente
      messages[existingDraftIndex] = {
        ...messages[existingDraftIndex],
        ...draftData,
        id: messages[existingDraftIndex].id
      };
    } else {
      // Cria novo rascunho
      const newDraft: WebmailMessage = {
        id: `draft-${Date.now()}`,
        ...draftData
      };
      messages.unshift(newDraft);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(messages));
    }

    return existingDraftIndex !== -1 ? messages[existingDraftIndex] : messages[0];
  },

  getDrafts: async (accountEmail?: string, password?: string): Promise<WebmailMessage[]> => {
    const messages = await webmailManager.getMessages(accountEmail, password);
    return messages.filter(m => m.folder === 'drafts');
  }
};

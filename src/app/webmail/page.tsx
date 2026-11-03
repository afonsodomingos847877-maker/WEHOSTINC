'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Mail, Inbox, Send, Star, Trash2, Edit3, Search, RefreshCw, 
  ArrowLeft, CheckCircle2, ShieldCheck, User, Paperclip, Reply, Forward,
  FileText, LogOut, ChevronRight, X, AlertCircle, Sparkles, Clock, Printer, Download, Loader2, Filter, Maximize2, Minimize2, Bold, Italic, Underline, Type,
  Wand2, Bot, FileSignature, Lightbulb, Check, Wifi, WifiOff, Pin, PinOff, Flag, Flame, Lock, Key, Eye, EyeOff,
  Bell, Calendar, TrendingUp, LayoutGrid, HelpCircle, Smartphone, Laptop, Monitor
} from 'lucide-react';
import { auth, User as AuthUser } from '@/lib/auth';
import { dataManager, EmailAccount } from '@/lib/data';
import { webmailManager, WebmailMessage, WebmailAttachment, ATTACHMENT_MAX_SIZE, ATTACHMENT_MAX_COUNT, ATTACHMENT_TOTAL_MAX_SIZE } from '@/lib/webmailClient';
import { emailTemplates, templateCategories, templateCategoriesEN, EmailTemplate } from '@/lib/emailTemplates';
import { soundEffects } from '@/lib/soundEffects';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import { apiEndpoint } from '@/lib/siteConfig';
import dynamic from 'next/dynamic';

const templateCategoryIcons: Record<string, React.ElementType> = {
  'Boas-vindas': Sparkles,
  'Welcome': Sparkles,
  'Vendas': TrendingUp,
  'Sales': TrendingUp,
  'Suporte': ShieldCheck,
  'Support': ShieldCheck,
  'Reuniões': Calendar,
  'Meetings': Calendar,
  'Notificações': Bell,
  'Notifications': Bell,
  'Pessoal': User,
  'Personal': User,
  'Marketing': Lightbulb,
  'Tables': FileText,
  'Tabelas': FileText,
};

// Dynamic import for React Quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function stripRawHeaders(raw: string): string {
  if (!raw) return '';
  let str = raw;
  if (str.includes('Delivered-To:') || str.includes('Received:') || str.includes('X-Envelope-To:') || str.includes('Content-Type: multipart/')) {
    const parts = str.split(/\r?\n\r?\n/);
    if (parts.length > 1) {
      const contentParts = parts.filter(p => !/^(Delivered-To|Received|X-|ARC-|DKIM|Authentication|From|To|Subject|Message-ID|MIME-Version|Content-Type):/i.test(p.trim()));
      if (contentParts.length > 0) {
        str = contentParts.join('\n\n').replace(/--[a-zA-Z0-9_-]+(--)?/g, '').trim();
      }
    }
  }
  return str;
}

function getSnippetText(text?: string, body?: string): string {
  const source = text || body || '';
  if (!source) return '';
  const noHeaders = stripRawHeaders(source);
  return noHeaders
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 110);
}

function WebmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmailParam = searchParams.get('email') || searchParams.get('user') || searchParams.get('account');

  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountEmail, setSelectedAccountEmail] = useState<string>('');
  const [mailboxPassword, setMailboxPassword] = useState<string>(''); // Password da mailbox Migadu
  const [showWebmailLogin, setShowWebmailLogin] = useState<boolean>(false); // Modal de login webmail
  const [webmailLoginEmail, setWebmailLoginEmail] = useState<string>(''); // Email para login webmail
  const [webmailLoginPassword, setWebmailLoginPassword] = useState<string>(''); // Password para login webmail
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false); // Alternar visibilidade da senha
  const [webmailLoginError, setWebmailLoginError] = useState<string>(''); // Erro de login
  const [webmailLoginLoading, setWebmailLoginLoading] = useState<boolean>(false); // Loading de login

  const [currentFolder, setCurrentFolder] = useState<'inbox' | 'sent' | 'starred' | 'trash' | 'drafts'>('inbox');
  const [messages, setMessages] = useState<WebmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<WebmailMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; msgId: string; subject: string; isPermanent: boolean } | null>(null);

  // New email sound detection
  const knownInboxIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  // Filter & Refresh State
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'attachments' | 'starred' | 'pinned' | 'priority'>('all');
  const [isRefreshingWebmail, setIsRefreshingWebmail] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Compose Modal & Attachment State
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeBcc, setComposeBcc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composePriority, setComposePriority] = useState<'high' | 'normal' | 'low'>('normal');
  const [composeAttachments, setComposeAttachments] = useState<WebmailAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [sentSuccessMsg, setSentSuccessMsg] = useState('');
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  // Show CC/BCC fields state
  const [showCcBcc, setShowCcBcc] = useState(false);

  // Template state
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>('Todas');
  const [templateLanguage, setTemplateLanguage] = useState<'pt' | 'en'>('pt');
  const [isComposeExpanded, setIsComposeExpanded] = useState(true);

  // Collapse states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isStorageCollapsed, setIsStorageCollapsed] = useState(false);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Attachment preview state
  const [previewAttachment, setPreviewAttachment] = useState<WebmailAttachment | null>(null);

  // Placeholder warning state
  const [showPlaceholderWarning, setShowPlaceholderWarning] = useState(false);
  const [unfilledPlaceholders, setUnfilledPlaceholders] = useState<string[]>([]);

  // Change password state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Attachment error state
  const [attachmentError, setAttachmentError] = useState('');

  // Message editor expansion state
  const [isMessageEditorExpanded, setIsMessageEditorExpanded] = useState(false);

  // Reply inline
  const [replyText, setReplyText] = useState('');
  const [quickReplySending, setQuickReplySending] = useState(false);
  const [quickReplyStatus, setQuickReplyStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  // AI Assistant states
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isImprovingDraft, setIsImprovingDraft] = useState(false);

  // Debug webmail login modal
  useEffect(() => {
    console.log('showWebmailLogin mudou para:', showWebmailLogin);
  }, [showWebmailLogin]);

  // Signature states
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [userSignature, setUserSignature] = useState<any | null>(null);
  const [signatureForm, setSignatureForm] = useState({
    fullName: '',
    jobTitle: '',
    companyName: '',
    phone: '',
    website: '',
    logoUrl: '',
    isEnabled: true
  });
  const [isSavingSignature, setIsSavingSignature] = useState(false);

  // Current date/time & Network connectivity
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnectedToast, setShowReconnectedToast] = useState<boolean>(false);

  useEffect(() => {
    // Initialize date only on client to avoid hydration mismatch
    setCurrentDateTime(new Date());
    
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        setShowReconnectedToast(true);
        setTimeout(() => setShowReconnectedToast(false), 4000);
      };

      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      const timer = setInterval(() => {
        setCurrentDateTime(new Date());
      }, 60000); // Update every minute

      return () => {
        clearInterval(timer);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (!showCompose) return;
    
    const autoSaveInterval = setInterval(() => {
      if (composeTo || composeSubject || composeBody) {
        webmailManager.saveDraft(
          selectedAccountEmail,
          composeTo,
          composeSubject,
          composeBody,
          composeAttachments
        );
      }
    }, 5000); // Auto-save a cada 5 segundos

    return () => clearInterval(autoSaveInterval);
  }, [showCompose, composeTo, composeSubject, composeBody, composeAttachments, selectedAccountEmail]);

  const handleComposeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachmentError('');

    // Validação de número máximo de anexos
    if (composeAttachments.length >= ATTACHMENT_MAX_COUNT) {
      setAttachmentError(`Máximo de ${ATTACHMENT_MAX_COUNT} anexos permitidos por email.`);
      return;
    }

    // Validação de tamanho individual (máximo 10MB)
    if (file.size > ATTACHMENT_MAX_SIZE) {
      setAttachmentError(`O ficheiro é muito grande! O tamanho máximo permitido é ${ATTACHMENT_MAX_SIZE / (1024 * 1024)}MB.`);
      return;
    }

    // Validação de tamanho total
    const currentTotalSize = composeAttachments.reduce((sum, att) => sum + (att.size || 0), 0);
    if (currentTotalSize + file.size > ATTACHMENT_TOTAL_MAX_SIZE) {
      setAttachmentError(`O tamanho total dos anexos excede o limite de ${ATTACHMENT_TOTAL_MAX_SIZE / (1024 * 1024)}MB.`);
      return;
    }

    // Validação de tipo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      setAttachmentError('Tipo de ficheiro não permitido. Formatos aceitos: PDF, Imagens, Word, Excel, Texto, ZIP.');
      return;
    }

    setUploadingAttachment(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(apiEndpoint('/api/webmail/upload-attachment'), {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.content) {
          // Store base64 content in the URL field for later processing
          const base64Url = `data:${data.type};base64,${data.content}`;
          soundEffects.playAttachSound();
          setComposeAttachments(prev => [
            ...prev,
            {
              url: base64Url,
              name: data.name || file.name,
              size: data.size || file.size,
              type: data.type || file.type
            }
          ]);
        }
      } else {
        setAttachmentError('Erro ao fazer upload do ficheiro. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro no upload de anexo do webmail:', err);
      setAttachmentError('Erro de conexão ao fazer upload. Verifique sua internet.');
    } finally {
      setUploadingAttachment(false);
      e.target.value = '';
    }
  };

  const handleRemoveComposeAttachment = (index: number) => {
    setComposeAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraftManually = () => {
    webmailManager.saveDraft(
      selectedAccountEmail,
      composeTo,
      composeSubject,
      composeBody,
      composeAttachments
    );
    setEditingDraftId(null);
    refreshMessages();
    setSentSuccessMsg('Rascunho guardado com sucesso!');
    setTimeout(() => {
      setShowCompose(false);
      setSentSuccessMsg('');
      setComposeTo('');
      setComposeCc('');
      setComposeBcc('');
      setComposeSubject('');
      setComposeBody('');
      setComposeAttachments([]);
    }, 1500);
  };

  const handleCloseCompose = () => {
    // Se houver conteúdo, salvar como rascunho
    if (composeTo || composeSubject || composeBody) {
      webmailManager.saveDraft(
        selectedAccountEmail,
        composeTo,
        composeSubject,
        composeBody,
        composeAttachments
      );
      refreshMessages();
    }
    setShowCompose(false);
    setEditingDraftId(null);
    setComposeTo('');
    setComposeCc('');
    setComposeBcc('');
    setComposeSubject('');
    setComposeBody('');
    setComposeAttachments([]);
  };

  const handleInsertSignature = () => {
    if (!signatureForm.fullName && !signatureForm.companyName) {
      setShowSignatureModal(true);
      return;
    }
    const sigText = `\n\n--\n${signatureForm.fullName || ''}\n${signatureForm.jobTitle ? signatureForm.jobTitle + ' | ' : ''}${signatureForm.companyName || ''}\n${signatureForm.phone ? 'Tel: ' + signatureForm.phone + '\n' : ''}${signatureForm.website ? 'Web: ' + signatureForm.website : ''}`;
    setComposeBody(prev => prev + sigText);
  };

  const handleReplyMessage = () => {
    if (!selectedMessage) return;
    setComposeTo(selectedMessage.fromEmail);
    setComposeSubject(`Re: ${selectedMessage.subject}`);
    setComposeBody(`\n\n--- Mensagem Original ---\nDe: ${selectedMessage.fromName} <${selectedMessage.fromEmail}>\nData: ${new Date(selectedMessage.date).toLocaleString()}\n\n${selectedMessage.body}`);
    setComposeCc('');
    setComposeBcc('');
    setComposeAttachments([]);
    setShowCompose(true);
  };

  const handleReplyAllMessage = () => {
    if (!selectedMessage) return;
    setComposeTo(selectedMessage.fromEmail);
    setComposeCc(selectedAccountEmail); // Adicionar remetente original em CC
    setComposeSubject(`Re: ${selectedMessage.subject}`);
    setComposeBody(`\n\n--- Mensagem Original ---\nDe: ${selectedMessage.fromName} <${selectedMessage.fromEmail}>\nPara: ${selectedMessage.toEmail}\nData: ${new Date(selectedMessage.date).toLocaleString()}\n\n${selectedMessage.body}`);
    setComposeBcc('');
    setComposeAttachments([]);
    setShowCompose(true);
  };

  const handleForwardMessage = () => {
    if (!selectedMessage) return;
    setComposeTo('');
    setComposeSubject(`Fwd: ${selectedMessage.subject}`);
    setComposeBody(`\n\n--- Mensagem Encaminhada ---\nDe: ${selectedMessage.fromName} <${selectedMessage.fromEmail}>\nPara: ${selectedMessage.toEmail}\nData: ${new Date(selectedMessage.date).toLocaleString()}\nAssunto: ${selectedMessage.subject}\n\n${selectedMessage.body}`);
    setComposeCc('');
    setComposeBcc('');
    setComposeAttachments(selectedMessage.attachments || []);
    setShowCompose(true);
  };

  const handleToggleUppercase = () => {
    // Toggle uppercase/lowercase for selected text or entire content
    setComposeBody(prev => {
      // Check if content is mostly uppercase
      const isMostlyUppercase = prev.length > 0 && 
        prev.replace(/[^a-zA-Z]/g, '').length > 0 &&
        (prev.match(/[A-Z]/g) || []).length > (prev.match(/[a-z]/g) || []).length;
      
      if (isMostlyUppercase) {
        // Convert to lowercase
        return prev.toLowerCase();
      } else {
        // Convert to uppercase
        return prev.toUpperCase();
      }
    });
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setComposeSubject(templateLanguage === 'pt' ? template.subject : template.subjectEN);
    setComposeBody(templateLanguage === 'pt' ? template.body : template.bodyEN);
    setShowTemplateSelector(false);
  };

  const getFilteredTemplates = () => {
    if (selectedTemplateCategory === 'Todas') {
      return emailTemplates;
    }
    return emailTemplates.filter(t => 
      templateLanguage === 'pt' ? t.category === selectedTemplateCategory : t.categoryEN === selectedTemplateCategory
    );
  };

  const getDisplayCategories = () => {
    return templateLanguage === 'pt' ? templateCategories : templateCategoriesEN;
  };

  // Function to detect unfilled placeholders
  const detectUnfilledPlaceholders = (text: string): string[] => {
    const placeholderRegex = /\{([^}]+)\}/g;
    const matches = text.match(placeholderRegex);
    return matches || [];
  };

  // Function to handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || !confirmPassword) {
      setPasswordError('Por favor, preencha a nova senha e a confirmação.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (!selectedAccountEmail || !selectedAccountEmail.includes('@')) {
      setPasswordError('Nenhuma caixa de e-mail selecionada.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      // 1. Verificar senha atual se fornecida
      if (currentPassword) {
        let isVerified = false;

        // Se coincidir com a senha ativa na sessão do Webmail
        if (mailboxPassword && currentPassword.trim() === mailboxPassword.trim()) {
          isVerified = true;
        } else {
          // Testar via IMAP
          try {
            const authRes = await fetch('/api/webmail/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: selectedAccountEmail, password: currentPassword })
            });
            if (authRes.ok) {
              isVerified = true;
            }
          } catch (authErr) {
            console.warn('[ChangePassword] Auth check warning:', authErr);
          }

          // Fallback portal check
          if (!isVerified) {
            const currentUser = auth.getCurrentUser();
            if (currentUser && auth.login(currentUser.email, currentPassword)) {
              isVerified = true;
            }
          }
        }

        if (!isVerified) {
          setPasswordError('A senha atual inserida está incorreta.');
          setIsUpdatingPassword(false);
          soundEffects.playErrorSound();
          return;
        }
      }

      // 2. Sincronizar nova senha diretamente com o servidor Migadu
      const [localPart, domain] = selectedAccountEmail.split('@');
      const res = await fetch(`/api/email-providers/migadu/domains/${domain}/mailboxes/${localPart}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.error || resData.message || 'Falha ao atualizar senha na Migadu.');
      }

      // 3. Atualizar estado e credenciais locais do Webmail
      setMailboxPassword(newPassword);
      try {
        localStorage.setItem(`webmail_auth_${selectedAccountEmail}`, newPassword);
      } catch (e) {}

      // Atualizar também na conta local do dataManager
      const existingAcc = accounts.find(a => a.email.toLowerCase() === selectedAccountEmail.toLowerCase());
      if (existingAcc) {
        dataManager.updateEmail(existingAcc.id, { password: newPassword } as any);
      }

      // Se utilizador do portal for igual a este email, atualizar também
      const currentUser = auth.getCurrentUser();
      if (currentUser && currentUser.email.toLowerCase() === selectedAccountEmail.toLowerCase()) {
        auth.updatePassword(currentUser.email, newPassword);
      }

      soundEffects.playSuccessSound();
      setPasswordSuccess('Senha alterada com sucesso! Atualizada imediatamente no servidor Migadu.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err: any) {
      console.error('[Webmail Change Password] Error:', err);
      soundEffects.playErrorSound();
      setPasswordError(err?.message || 'Erro ao alterar a senha. Tente novamente.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    const userEmailFilter = currentUser.email;

    // Clean up stale shared localStorage data and migrate to per-user key
    dataManager.initUserEmails(userEmailFilter);

    const refreshAccounts = (emailList: EmailAccount[]) => {
      setAccounts(emailList);
      if (initialEmailParam) {
        setSelectedAccountEmail(initialEmailParam);
        setWebmailLoginEmail(initialEmailParam);
        if (!mailboxPassword) {
          setShowWebmailLogin(true);
        }
      } else if (emailList.length > 0) {
        const firstEmail = emailList[0].email;
        setSelectedAccountEmail(prev => prev || firstEmail);
        setWebmailLoginEmail(prev => prev || firstEmail);
        if (!mailboxPassword) {
          setShowWebmailLogin(true);
        }
      }
    };

    // Load strictly from user-specific key
    const localEmails = dataManager.getEmails(userEmailFilter);
    refreshAccounts(localEmails);

    // Sync inicial com servidor (filtrado por utilizador)
    dataManager.fetchEmailsAsync(userEmailFilter).then(emails => {
      refreshAccounts(emails);
    });

    // Polling a cada 3s para sincronizar status (pending → active) quando Admin aprova
    const interval = setInterval(() => {
      dataManager.fetchEmailsAsync(userEmailFilter).then(emails => {
        setAccounts(emails);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [router, initialEmailParam, mailboxPassword]);


  // PWA Install Prompt State & Handlers
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsAppInstalled(true);
      }

      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredInstallPrompt(e);
      };

      const handleInstalled = () => {
        setIsAppInstalled(true);
        setDeferredInstallPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      window.addEventListener('appinstalled', handleInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleInstalled);
      };
    }
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      try {
        const choice = await deferredInstallPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsAppInstalled(true);
        }
      } catch (err) {
        console.error('Erro ao instalar PWA:', err);
      }
      setDeferredInstallPrompt(null);
    } else {
      setShowInstallGuideModal(true);
    }
  };

  // Helper to open login modal reliably from any button
  const openLoginModal = (targetEmail?: string) => {
    const emailToUse = targetEmail || selectedAccountEmail || initialEmailParam || (accounts.length > 0 ? accounts[0].email : '');
    setWebmailLoginEmail(emailToUse);
    setWebmailLoginError('');
    setWebmailLoginPassword('');
    setShowWebmailLogin(true);
  };

  // Helper to open compose — asks for login first if not authenticated
  const handleOpenCompose = () => {
    if (!mailboxPassword) {
      openLoginModal();
      return;
    }
    setShowCompose(true);
  };

  // Dynamic folder counters across folder switches
  const [folderStats, setFolderStats] = useState<{
    inboxUnread: number;
    starred: number;
    drafts: number;
    sent: number;
    trash: number;
  }>({
    inboxUnread: 0,
    starred: 0,
    drafts: 0,
    sent: 0,
    trash: 0,
  });
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(null);

  // Load messages whenever account, password, or folder changes
  useEffect(() => {
    if (selectedAccountEmail && mailboxPassword) {
      const folder = currentFolder === 'starred' ? 'inbox' : currentFolder as 'inbox' | 'sent' | 'drafts' | 'trash';
      setIsLoadingMessages(true);
      setSelectedMessage(null);
      (async () => {
        try {
          const msgs = await webmailManager.getMessages(selectedAccountEmail, mailboxPassword, folder);
          // If viewing starred, filter from inbox result
          const filtered = currentFolder === 'starred' ? msgs.filter(m => m.starred) : msgs;
          setMessages(filtered);
          setSelectedMessage(filtered.length > 0 ? filtered[0] : null);
          setLastSyncedTime(new Date());

          // Update folder stats dynamically
          if (folder === 'inbox') {
            const unread = msgs.filter(m => !m.isRead).length;
            const starred = msgs.filter(m => m.starred).length;
            setFolderStats(prev => ({ ...prev, inboxUnread: unread, starred }));
          } else if (folder === 'sent') {
            setFolderStats(prev => ({ ...prev, sent: msgs.length }));
          } else if (folder === 'trash') {
            setFolderStats(prev => ({ ...prev, trash: msgs.length }));
          } else if (folder === 'drafts') {
            setFolderStats(prev => ({ ...prev, drafts: msgs.length }));
          }
        } catch (error) {
          console.error('[Webmail] Error loading messages:', error);
          setMessages([]);
          setSelectedMessage(null);
        }
        setIsLoadingMessages(false);
      })();
    }
  }, [selectedAccountEmail, mailboxPassword, currentFolder]);

  // Sync initial drafts count from local storage
  useEffect(() => {
    if (selectedAccountEmail) {
      webmailManager.getDrafts(selectedAccountEmail).then(localDrafts => {
        setFolderStats(prev => ({ ...prev, drafts: localDrafts.length }));
      });
    }
  }, [selectedAccountEmail]);

  const refreshMessages = async () => {
    if (selectedAccountEmail && mailboxPassword) {
      setIsRefreshingWebmail(true);
      try {
        const folder = currentFolder === 'starred' ? 'inbox' : currentFolder as 'inbox' | 'sent' | 'drafts' | 'trash';
        const msgs = await webmailManager.getMessages(selectedAccountEmail, mailboxPassword, folder);
        const filtered = currentFolder === 'starred' ? msgs.filter(m => m.starred) : msgs;
        setMessages(filtered);
        setLastSyncedTime(new Date());
        if (folder === 'inbox') {
          const unread = msgs.filter(m => !m.isRead).length;
          const starred = msgs.filter(m => m.starred).length;
          setFolderStats(prev => ({ ...prev, inboxUnread: unread, starred }));
        }
      } catch (error) {
        console.error('[Webmail] Error refreshing messages:', error);
      }
      setIsRefreshingWebmail(false);
    }
  };

  // Detect new incoming emails in inbox and play chime sound
  useEffect(() => {
    if (currentFolder === 'inbox' && messages.length > 0) {
      if (isInitialLoadRef.current) {
        knownInboxIdsRef.current = new Set(messages.map(m => m.id));
        isInitialLoadRef.current = false;
      } else {
        const hasNewIncoming = messages.some(m => !knownInboxIdsRef.current.has(m.id) && !m.isRead);
        if (hasNewIncoming) {
          soundEffects.playNewEmailSound();
        }
        knownInboxIdsRef.current = new Set(messages.map(m => m.id));
      }
    }
  }, [messages, currentFolder]);

  const handleSelectMessage = async (msg: WebmailMessage) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      const imapFolder = msg.folder === 'sent' ? 'Sent' : msg.folder === 'trash' ? 'Trash' : 'INBOX';
      await webmailManager.markAsRead(msg.id, true, selectedAccountEmail, mailboxPassword, msg.uid, imapFolder);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
    }
    
    // Se for um rascunho, abrir no compose modal
    if (msg.folder === 'drafts') {
      setComposeTo(msg.toEmail);
      setComposeSubject(msg.subject);
      setComposeBody(msg.body);
      setComposeAttachments(msg.attachments || []);
      setEditingDraftId(msg.id);
      setShowCompose(true);
    }
  };

  const handleToggleStar = async (msgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = messages.find(m => m.id === msgId);
    const imapFolder = msg?.folder === 'sent' ? 'Sent' : msg?.folder === 'trash' ? 'Trash' : 'INBOX';
    const isCurrentlyStarred = !!msg?.starred;
    soundEffects.playStarSound(!isCurrentlyStarred);
    await webmailManager.toggleStar(msgId, selectedAccountEmail, mailboxPassword, msg?.uid, imapFolder);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, starred: !m.starred } : m));
    if (selectedMessage?.id === msgId) {
      setSelectedMessage(prev => prev ? { ...prev, starred: !prev.starred } : null);
    }
  };

  const handleTogglePin = (msgId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEffects.playPinSound();
    const isPinned = webmailManager.togglePin(msgId, selectedAccountEmail);
    setMessages(prev => {
      const updated = prev.map(m => m.id === msgId ? { ...m, pinned: isPinned } : m);
      return [...updated].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    });
    if (selectedMessage?.id === msgId) {
      setSelectedMessage(prev => prev ? { ...prev, pinned: isPinned } : null);
    }
  };

  const handleChangePriority = (msgId: string, priority: 'high' | 'normal' | 'low', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    webmailManager.setMessagePriority(msgId, priority, selectedAccountEmail);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, priority } : m));
    if (selectedMessage?.id === msgId) {
      setSelectedMessage(prev => prev ? { ...prev, priority } : null);
    }
  };

  // Eliminar mensagem permanentemente com atualização instantânea
  const handleDeleteMessage = async (msgId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const msg = messages.find(m => m.id === msgId) || (selectedMessage?.id === msgId ? selectedMessage : null);
    if (!msg) return;

    const fromImapFolder = msg.folder === 'sent' ? 'Sent' : msg.folder === 'trash' ? 'Trash' : msg.folder === 'drafts' ? 'Drafts' : 'INBOX';
    
    // Atualização otimista imediata na UI
    setMessages(prev => prev.filter(m => m.id !== msgId));
    if (selectedMessage?.id === msgId) {
      setSelectedMessage(null);
    }
    setFolderStats(prev => ({
      ...prev,
      inboxUnread: msg.folder === 'inbox' && !msg.isRead ? Math.max(prev.inboxUnread - 1, 0) : prev.inboxUnread,
      trash: msg.folder === 'trash' ? Math.max(prev.trash - 1, 0) : prev.trash,
      sent: msg.folder === 'sent' ? Math.max(prev.sent - 1, 0) : prev.sent,
      drafts: msg.folder === 'drafts' ? Math.max(prev.drafts - 1, 0) : prev.drafts,
      starred: msg.starred ? Math.max(prev.starred - 1, 0) : prev.starred
    }));
    soundEffects.playDeleteEmailSound();

    // Eliminação definitiva no servidor IMAP
    try {
      await webmailManager.deletePermanently(msgId, selectedAccountEmail, mailboxPassword, msg.uid, fromImapFolder);
    } catch (err) {
      console.error('[Webmail] Error deleting message permanently:', err);
    }
  };

  // Executar eliminação definitiva quando o utilizador confirma dentro da Lixeira
  const executeDeleteMessage = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId) || (selectedMessage?.id === msgId ? selectedMessage : null);
    const imapFolder = msg?.folder === 'sent' ? 'Sent' : msg?.folder === 'trash' ? 'Trash' : msg?.folder === 'drafts' ? 'Drafts' : 'INBOX';
    try {
      await webmailManager.deletePermanently(msgId, selectedAccountEmail, mailboxPassword, msg?.uid, imapFolder);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      if (selectedMessage?.id === msgId) setSelectedMessage(null);
      setFolderStats(prev => ({
        ...prev,
        trash: Math.max(prev.trash - 1, 0)
      }));
      soundEffects.playDeleteEmailSound();
    } catch (err) {
      console.error('[Webmail] Error deleting message permanently:', err);
    } finally {
      setDeleteConfirmModal(null);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeBody) return;

    // Block sending for pending accounts
    const selectedAcc = accounts.find(a => a.email.toLowerCase() === selectedAccountEmail.toLowerCase());
    const isPending = !selectedAcc || selectedAcc.status === 'pending' || !selectedAcc.status;
    if (isPending) {
      setSentSuccessMsg('');
      setSendingMsg(false);
      setWebmailLoginError('Esta conta ainda não foi aprovada pelo administrador. O envio de emails estará disponível após a aprovação.');
      return;
    }

    // Check for unfilled placeholders
    const subjectPlaceholders = detectUnfilledPlaceholders(composeSubject);
    const bodyPlaceholders = detectUnfilledPlaceholders(composeBody);
    const allPlaceholders = Array.from(new Set([...subjectPlaceholders, ...bodyPlaceholders]));

    if (allPlaceholders.length > 0) {
      setUnfilledPlaceholders(allPlaceholders);
      setShowPlaceholderWarning(true);
      return;
    }

    proceedToSendEmail();
  };

  const proceedToSendEmail = async () => {
    setSendingMsg(true);
    setShowPlaceholderWarning(false);

    try {
      // 1. Enviar via Migadu SMTP usando webmailManager
      await webmailManager.sendMessage(
        selectedAccountEmail,
        mailboxPassword,
        composeTo,
        composeSubject || '(Sem assunto)',
        composeBody,
        composeAttachments,
        composePriority,
        composeCc,
        composeBcc
      );

      // 2. Remover rascunho se existir
      if (editingDraftId) {
        await webmailManager.deletePermanently(editingDraftId, selectedAccountEmail, mailboxPassword);
        setEditingDraftId(null);
      }

      soundEffects.playSendEmailSound();
      setSendingMsg(false);
      setSentSuccessMsg('✅ E-mail enviado com sucesso!');

      setTimeout(() => {
        setShowCompose(false);
        setSentSuccessMsg('');
        setComposeTo('');
        setComposeCc('');
        setComposeBcc('');
        setComposeSubject('');
        setComposeBody('');
        setComposeAttachments([]);
        refreshMessages();
      }, 2000);
    } catch (err) {
      console.error('Erro ao enviar e-mail:', err);
      setSendingMsg(false);
      setSentSuccessMsg('Erro ao enviar. Verifique as credenciais e tente novamente.');
    }
  };

  const handleWebmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setWebmailLoginLoading(true);
    setWebmailLoginError('');

    try {
      const res = await fetch(apiEndpoint('/api/webmail/auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: webmailLoginEmail,
          password: webmailLoginPassword
        })
      });

      const data = await res.json();

      if (data.success) {
        // Login bem-sucedido
        soundEffects.playLoginSuccessSound();
        setSelectedAccountEmail(webmailLoginEmail);
        setMailboxPassword(webmailLoginPassword);
        setShowWebmailLogin(false);
        setWebmailLoginEmail('');
        setWebmailLoginPassword('');
      } else {
        setWebmailLoginError(data.error || 'Erro ao autenticar');
      }
    } catch (err) {
      console.error('[Webmail] Login error:', err);
      setWebmailLoginError('Erro de conexão. Tente novamente.');
    } finally {
      setWebmailLoginLoading(false);
    }
  };

  const handleWebmailLogout = () => {
    setSelectedAccountEmail('');
    setMailboxPassword('');
    setMessages([]);
    setSelectedMessage(null);
    setShowWebmailLogin(true);
  };

  const handleSendQuickReply = async () => {
    if (!replyText || !selectedMessage) return;

    setQuickReplySending(true);

    try {
      // Enviar via Migadu SMTP
      await webmailManager.sendMessage(
        selectedAccountEmail,
        mailboxPassword,
        selectedMessage.fromEmail,
        `Re: ${selectedMessage.subject}`,
        replyText
      );

      soundEffects.playSendEmailSound();
      setReplyText('');
      refreshMessages();
      setQuickReplyStatus('sent');
    } catch {
      setQuickReplyStatus('error');
    } finally {
      setQuickReplySending(false);
      setTimeout(() => setQuickReplyStatus('idle'), 3000);
    }
  };

  // Load signature for active account
  useEffect(() => {
    if (selectedAccountEmail) {
      fetch(`/api/webmail/signature?email=${encodeURIComponent(selectedAccountEmail)}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.signature) {
            setUserSignature(data.signature);
            setSignatureForm({
              fullName: data.signature.fullName || '',
              jobTitle: data.signature.jobTitle || '',
              companyName: data.signature.companyName || '',
              phone: data.signature.phone || '',
              website: data.signature.website || '',
              logoUrl: data.signature.logoUrl || '',
              isEnabled: data.signature.isEnabled !== false
            });
          }
        })
        .catch(() => {});
    }
  }, [selectedAccountEmail]);

  // AI Assistant Handlers
  const handleSummarizeWithAI = async () => {
    if (!selectedMessage) return;
    setIsGeneratingSummary(true);
    try {
      const res = await fetch('/api/ai/email-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summarize',
          content: selectedMessage.body,
          subject: selectedMessage.subject,
          from: selectedMessage.fromEmail
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setAiSummary(data.result);
      }
    } catch (err) {
      console.error('Error generating summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateAIReply = async (tone: string) => {
    if (!selectedMessage) return;
    setIsGeneratingReply(true);
    try {
      const res = await fetch('/api/ai/email-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          content: selectedMessage.body,
          subject: selectedMessage.subject,
          from: selectedMessage.fromEmail,
          tone
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setReplyText(data.result);
      }
    } catch (err) {
      console.error('Error generating AI reply:', err);
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleImproveWithAI = async () => {
    if (!composeBody) return;
    setIsImprovingDraft(true);
    try {
      const res = await fetch('/api/ai/email-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'improve',
          content: composeBody,
          tone: 'professional'
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setComposeBody(data.result);
        soundEffects.playAICompleteSound();
      }
    } catch (err) {
      console.error('Error improving draft:', err);
    } finally {
      setIsImprovingDraft(false);
    }
  };

  const handleSaveSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSignature(true);
    try {
      const res = await fetch('/api/webmail/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedAccountEmail,
          ...signatureForm
        })
      });
      const data = await res.json();
      if (data.success) {
        setUserSignature(data.signature);
        setShowSignatureModal(false);
      }
    } catch (err) {
      console.error('Error saving signature:', err);
    } finally {
      setIsSavingSignature(false);
    }
  };

  // Filtragem por Pasta, Filtros e Pesquisa
  const displayMessages = messages.filter(m => {
    let matchesFolder = false;
    if (currentFolder === 'starred') {
      matchesFolder = m.starred && m.folder !== 'trash';
    } else {
      matchesFolder = m.folder === currentFolder;
    }

    let matchesFilter = true;
    if (filterType === 'unread') matchesFilter = !m.isRead;
    if (filterType === 'attachments') matchesFilter = !!(m.attachments && m.attachments.length > 0);
    if (filterType === 'starred') matchesFilter = m.starred;
    if (filterType === 'pinned') matchesFilter = !!m.pinned;
    if (filterType === 'priority') matchesFilter = m.priority === 'high';

    const q = searchQuery.toLowerCase();
    const matchesSearch = q === '' ||
      m.subject.toLowerCase().includes(q) ||
      m.fromName.toLowerCase().includes(q) ||
      m.fromEmail.toLowerCase().includes(q) ||
      m.body.toLowerCase().includes(q);

    return matchesFolder && matchesFilter && matchesSearch;
  });

  const currentAccountObj = accounts.find(a => a.email.toLowerCase() === selectedAccountEmail.toLowerCase());
  const isAccountPending = currentAccountObj ? (currentAccountObj.status === 'pending' || !currentAccountObj.status) : false;

  const unreadCount = messages.filter(m => !m.isRead).length;
  
  // Dynamic badge counters
  const unreadInboxCount = currentFolder === 'inbox' 
    ? messages.filter(m => !m.isRead).length 
    : folderStats.inboxUnread;

  const starredCount = currentFolder === 'starred'
    ? messages.length
    : (currentFolder === 'inbox' ? messages.filter(m => m.starred).length : folderStats.starred);

  const draftsCount = currentFolder === 'drafts'
    ? messages.length
    : folderStats.drafts;

  const sentCount = currentFolder === 'sent'
    ? messages.length
    : folderStats.sent;

  // Armazenamento real via Migadu + cálculo dinâmico por mensagens carregadas
  const [migaduStorageUsedMB, setMigaduStorageUsedMB] = useState<number>(0);

  useEffect(() => {
    if (selectedAccountEmail && mailboxPassword) {
      // Fetch real storage usage from Migadu
      const domain = selectedAccountEmail.split('@')[1];
      fetch(`/api/email-providers/migadu/domains/${domain}/mailboxes`)
        .then(r => r.json())
        .then(data => {
          const mailboxes: Array<{usage_bytes?: number; local_part?: string}> = data.mailboxes || data || [];
          const localPart = selectedAccountEmail.split('@')[0];
          const box = mailboxes.find((m: {local_part?: string}) => m.local_part === localPart);
          if (box && box.usage_bytes) {
            setMigaduStorageUsedMB(box.usage_bytes / (1024 * 1024));
          }
        })
        .catch(() => {/* silently ignore */});
    }
  }, [selectedAccountEmail, mailboxPassword]);

  // Dynamic storage calculation from messages and attachments
  const calculatedStorageBytes = messages.reduce((acc, m) => {
    let msgBytes = (m.body?.length || 0) + (m.subject?.length || 0) + 1024;
    if (m.attachments) {
      msgBytes += m.attachments.reduce((sum, att) => sum + (att.size || 0), 0);
    }
    return acc + msgBytes;
  }, 0);

  const effectiveStorageMB = migaduStorageUsedMB > 0 
    ? migaduStorageUsedMB 
    : (mailboxPassword ? Math.max(calculatedStorageBytes / (1024 * 1024), 0.15) : 0);

  const storagePercentage = Math.min((effectiveStorageMB / 1024) * 100, 100);

  const storageInfo = {
    usedMB: effectiveStorageMB,
    percentage: storagePercentage,
    usedDisplay: effectiveStorageMB < 1024
      ? `${effectiveStorageMB.toFixed(1)} MB`
      : `${(effectiveStorageMB / 1024).toFixed(2)} GB`,
  };

  // Gerador de Respostas Rápidas Inteligentes Contextuais
  const getSmartReplies = (subject?: string, body?: string): string[] => {
    const text = `${subject || ''} ${body || ''}`.toLowerCase();
    if (text.includes('orçamento') || text.includes('preço') || text.includes('proposta') || text.includes('cotação')) {
      return [
        'Recebido! Vou analisar a proposta e retorno em breve.',
        'Obrigado pelo envio. Podemos agendar uma reunião?',
        'Proposta aprovada! Como podemos proceder?'
      ];
    }
    if (text.includes('reunião') || text.includes('agendamento') || text.includes('horário') || text.includes('disponível') || text.includes('call')) {
      return [
        'Perfeito, estarei disponível no horário indicado.',
        'Agradeço o convite. Poderíamos remarcar para a tarde?',
        'Confirmado! Envie-me o link da chamada, por favor.'
      ];
    }
    if (text.includes('obrigado') || text.includes('agradeço') || text.includes('agradecemos') || text.includes('parabéns')) {
      return [
        'De nada! Fico sempre à disposição.',
        'Com certeza! Qualquer dúvida adicional, avise-me.',
        'Obrigado pela parceria e confiança.'
      ];
    }
    if (text.includes('urgente') || text.includes('prioridade') || text.includes('asap')) {
      return [
        'Recebido! Estou a tratar deste assunto com prioridade máxima.',
        'Entendido. Darei retorno dentro de alguns minutos.',
        'A trabalhar nisso agora mesmo!'
      ];
    }
    return [
      'Olá! Mensagem recebida com sucesso. Retornarei em breve.',
      'Obrigado pela informação. Darei seguimento de imediato.',
      'Perfeito, agradeço a rápida atualização!'
    ];
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Webmail Header Bar - Mobile First */}
      <header className="bg-white text-gray-800 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center space-x-2.5 min-w-0">
          <Link href="/dashboard/email" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition shrink-0" title="Voltar ao Painel">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center space-x-2 shrink-0">
            <BrandLogo />
            <span className="hidden sm:inline-block text-primary-600 font-bold text-xs uppercase tracking-wider bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">Email Corporativo</span>
          </div>
        </div>

        {/* Account Switcher & Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Account Switcher */}
          {accounts.length > 0 ? (
            <div className="flex items-center space-x-1.5 bg-gray-100 px-2 sm:px-3 py-1.5 rounded-xl border border-gray-200 max-w-[130px] sm:max-w-xs">
              <User className="h-3.5 w-3.5 text-primary-500 shrink-0" />
              <select
                value={selectedAccountEmail}
                onChange={(e) => {
                  const newEmail = e.target.value;
                  setSelectedAccountEmail(newEmail);
                  setMailboxPassword('');
                  setTimeout(() => {
                    setWebmailLoginEmail(newEmail);
                    setWebmailLoginError('');
                    setWebmailLoginPassword('');
                    setShowWebmailLogin(true);
                  }, 50);
                }}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer truncate w-full"
              >
                {accounts.map(acc => {
                  const pending = acc.status === 'pending' || !acc.status;
                  return (
                    <option key={acc.id} value={acc.email} className="bg-white text-gray-900">
                      {acc.email} {pending ? '⏳ (Em Processamento)' : '✓ (Ativo)'}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <span className="text-xs text-gray-600 font-mono font-bold bg-gray-100 px-2 py-1.5 rounded-xl border border-gray-200 truncate max-w-[110px] sm:max-w-[180px]">
              {selectedAccountEmail}
            </span>
          )}

          {/* Botão Rápido: Instalar Webmail App */}
          {!isAppInstalled && (
            <button
              type="button"
              onClick={handleTriggerInstall}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-xl transition cursor-pointer text-xs font-bold shadow-xs shrink-0 active:scale-95"
              title="Instalar o Webmail no Computador ou Telemóvel"
            >
              <Download className="h-3.5 w-3.5 text-gray-300 shrink-0" />
              <span>Instalar App</span>
            </button>
          )}

          {/* Botão Rápido: Mudar Senha */}
          <button
            type="button"
            onClick={() => {
              setPasswordError('');
              setPasswordSuccess('');
              setShowChangePasswordModal(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-xl transition cursor-pointer text-xs font-bold shadow-xs shrink-0 active:scale-95"
            title="Alterar senha desta conta de e-mail"
          >
            <Key className="h-3.5 w-3.5 text-gray-300 shrink-0" />
            <span>Mudar Senha</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => {
              setIsRefreshingWebmail(true);
              refreshMessages();
              setTimeout(() => setIsRefreshingWebmail(false), 800);
            }}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition cursor-pointer shrink-0"
            title="Sincronizar caixa de entrada"
          >
            {isRefreshingWebmail ? <Loader2 className="h-4 w-4 animate-spin text-primary-600" /> : <RefreshCw className="h-4 w-4" />}
          </button>

          {/* Link Ajuda Outlook & Telemóvel */}
          <Link
            href="/ajuda/configurar-email"
            target="_blank"
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-xl transition cursor-pointer text-xs font-bold shadow-xs shrink-0 active:scale-95"
            title="Abrir guia de configuração para Outlook e Celular"
          >
            <HelpCircle className="h-3.5 w-3.5 text-gray-300 shrink-0" />
            <span>Guia Outlook/Celular</span>
          </Link>

          {/* Mailbox Logout */}
          {mailboxPassword && (
            <button
              onClick={handleWebmailLogout}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition cursor-pointer shrink-0"
              title="Sair do Webmail"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}

          {/* Live Connection & Sync Status Pill */}
          <div 
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition-all duration-300"
            style={{
              backgroundColor: !isOnline ? '#FEF2F2' : (isLoadingMessages || isRefreshingWebmail) ? '#EFF6FF' : mailboxPassword ? '#ECFDF5' : '#FFFBEB',
              borderColor: !isOnline ? '#FECACA' : (isLoadingMessages || isRefreshingWebmail) ? '#BFDBFE' : mailboxPassword ? '#A7F3D0' : '#FDE68A',
              color: !isOnline ? '#991B1B' : (isLoadingMessages || isRefreshingWebmail) ? '#1E40AF' : mailboxPassword ? '#065F46' : '#92400E'
            }}
          >
            {!isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span className="text-[11px] font-bold">Offline</span>
              </>
            ) : (isLoadingMessages || isRefreshingWebmail) ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-600 shrink-0" />
                <span className="text-[11px] font-bold">A sincronizar...</span>
              </>
            ) : mailboxPassword ? (
              <>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold">IMAP Ativo</span>
                {lastSyncedTime && (
                  <span className="text-[10px] opacity-75 font-normal">
                    ({lastSyncedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 text-amber-600 shrink-0" />
                <span className="text-[11px] font-bold">Sessão Fechada</span>
              </>
            )}
          </div>

          {/* Desktop-only: Date/Time */}
          {currentDateTime && (
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-xl border border-primary-200 shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary-600" />
              <span className="text-xs font-bold text-gray-700">
                {currentDateTime.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-[10px] text-gray-500">
                {currentDateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {/* Desktop-only secondary actions */}
          <button
            type="button"
            onClick={handleOpenCompose}
            className="hidden sm:flex p-2 hover:bg-primary-50 text-primary-600 rounded-xl transition cursor-pointer shrink-0"
            title="Escrever E-mail"
          >
            <Edit3 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowSignatureModal(true)}
            className="hidden sm:flex p-2 hover:bg-purple-50 text-purple-600 rounded-xl transition cursor-pointer shrink-0"
            title="Configurar Assinatura Profissional"
          >
            <FileSignature className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowChangePasswordModal(true)}
            className="hidden sm:flex p-2 hover:bg-primary-50 text-primary-600 rounded-xl transition cursor-pointer shrink-0"
            title="Alterar Senha"
          >
            <ShieldCheck className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              auth.logout();
              router.push('/login');
            }}
            className="hidden sm:flex p-2 hover:bg-rose-50 text-rose-600 rounded-xl transition cursor-pointer shrink-0"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>

          {/* Mobile: More Options (⋯) */}
          <button
            type="button"
            onClick={() => setShowMobileMenu(true)}
            className="sm:hidden p-2 hover:bg-gray-100 text-gray-600 rounded-xl transition cursor-pointer shrink-0"
            title="Mais opções"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </header>

      {/* Alerta de Perda de Conexão à Internet (Offline) */}
      {!isOnline && (
        <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold shadow-md animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2.5">
            <WifiOff className="h-4 w-4 text-white animate-bounce shrink-0" />
            <span>
              Sem Conexão à Internet. O Webmail está a funcionar em modo offline — novas mensagens serão sincronizadas assim que a rede for restabelecida.
            </span>
          </div>
          <span className="bg-rose-800/90 text-rose-100 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase shrink-0">
            Offline
          </span>
        </div>
      )}

      {/* Toast de Reconexão Restabelecida */}
      {showReconnectedToast && isOnline && (
        <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-md animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4 text-emerald-200 shrink-0" />
            <span>Ligação à internet restabelecida com sucesso! A sincronizar as suas caixas de e-mail...</span>
          </div>
          <span className="bg-emerald-800/90 text-emerald-100 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase shrink-0">
            Online ✓
          </span>
        </div>
      )}

      {/* Sincronização em tempo real Indicator */}
      {(isLoadingMessages || isRefreshingWebmail) && (
        <div className="bg-primary-50 border-b border-primary-200 px-4 py-2 flex items-center justify-between text-xs text-primary-800 font-medium">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary-600 shrink-0" />
            <span>A sincronizar mensagens... ({currentFolder === 'inbox' ? 'Caixa de Entrada' : currentFolder === 'sent' ? 'Enviados' : currentFolder === 'drafts' ? 'Rascunhos' : currentFolder === 'trash' ? 'Lixeira' : 'Com Estrela'})</span>
          </div>
          <span className="text-[11px] text-primary-600 font-mono hidden sm:inline-block">IMAP SSL Â· Servidor Seguro</span>
        </div>
      )}

      {/* Banner Informativo de Aprovação Pendente (Se a conta estiver a processar) */}
      {isAccountPending && (
        <div className="bg-amber-50 border-b-2 border-amber-300 px-3.5 sm:px-4 py-3 text-amber-950 flex flex-wrap items-start justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start space-x-3">
            <div className="bg-amber-200 rounded-full p-1.5 shrink-0 mt-0.5">
              <Clock className="h-4 w-4 text-amber-700 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-amber-950">Conta em Processo de Aprovação — Envio de E-mails Bloqueado</p>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                A conta <strong className="font-mono">{selectedAccountEmail}</strong> está a aguardar aprovação do administrador.
                Pode visualizar a caixa de entrada, mas <strong>não é possível enviar e-mails</strong> até a conta ser ativada.
                Prazo estimado: <strong>até 24 horas</strong>.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-extrabold bg-amber-300 text-amber-950 px-3 py-1 rounded-full border border-amber-400 shrink-0 self-center whitespace-nowrap">
            Aguardando Validação
          </span>
        </div>
      )}

      {/* Mobile Folder Selector Tabs (Visível em Telas Pequenas) */}
      <div className="md:hidden bg-white border-b border-gray-200 px-2 py-2 flex items-center space-x-1 overflow-x-auto text-xs shrink-0">
        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('inbox'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-black transition-all duration-200 shrink-0 border ${
            currentFolder === 'inbox' 
              ? 'bg-primary-600 text-white shadow-md border-primary-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
          }`}
        >
          <Inbox className="h-3.5 w-3.5" />
          <span>Entrada</span>
          {unreadInboxCount > 0 && (
            <span className="bg-white text-primary-600 text-[10px] px-1.5 py-0.2 rounded-full font-black ml-1 shadow-sm">
              {unreadInboxCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('starred'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-black transition-all duration-200 shrink-0 border ${
            currentFolder === 'starred' 
              ? 'bg-amber-500 text-white shadow-md border-amber-600' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
          }`}
        >
          <Star className="h-3.5 w-3.5" />
          <span>Com Estrela</span>
          {starredCount > 0 && (
            <span className="bg-white text-amber-600 text-[10px] px-1.5 py-0.2 rounded-full font-black ml-1 shadow-sm">
              {starredCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('sent'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-black transition-all duration-200 shrink-0 border ${
            currentFolder === 'sent' 
              ? 'bg-emerald-600 text-white shadow-md border-emerald-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Enviados</span>
          {sentCount > 0 && (
            <span className="bg-white text-emerald-600 text-[10px] px-1.5 py-0.2 rounded-full font-black ml-1 shadow-sm">
              {sentCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('trash'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-black transition-all duration-200 shrink-0 border ${
            currentFolder === 'trash' 
              ? 'bg-rose-600 text-white shadow-md border-rose-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
          }`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Lixeira</span>
        </button>

        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('drafts'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-black transition-all duration-200 shrink-0 border ${
            currentFolder === 'drafts' 
              ? 'bg-purple-600 text-white shadow-md border-purple-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Rascunhos</span>
          {draftsCount > 0 && (
            <span className="bg-white text-purple-600 text-[10px] px-1.5 py-0.2 rounded-full font-black ml-1 shadow-sm">
              {draftsCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Nav */}
        <aside className={`hidden md:flex bg-white text-gray-600 flex-col p-3 border-r border-gray-200 space-y-4 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-56'}`}>
          <button
            type="button"
            onClick={handleOpenCompose}
            className={`w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer border border-gray-800 ${isSidebarCollapsed ? 'px-2' : ''}`}
          >
            <Edit3 className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span>Escrever E-mail</span>}
          </button>

          {/* Collapse Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
            title={isSidebarCollapsed ? "Expandir Sidebar" : "Recolher Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4 text-gray-600" /> : <ChevronRight className="h-4 w-4 text-gray-600 rotate-180" />}
          </button>

          <nav className={`space-y-1 text-xs font-semibold ${isSidebarCollapsed ? 'hidden' : ''}`}>
            <button
              onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('inbox'); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                currentFolder === 'inbox' 
                  ? 'bg-primary-50 text-primary-700 border-primary-200 font-black shadow-sm' 
                  : 'hover:bg-gray-100 text-gray-600 border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Inbox className="h-4 w-4 text-primary-500" />
                <span className="font-bold">Entrada</span>
              </div>
              {unreadInboxCount > 0 && (
                <span className="bg-primary-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm">
                  {unreadInboxCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('starred'); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                currentFolder === 'starred' 
                  ? 'bg-amber-50 text-amber-700 border-amber-200 font-black shadow-sm' 
                  : 'hover:bg-gray-100 text-gray-600 border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Star className="h-4 w-4 text-amber-400" />
                <span className="font-bold">Com Estrela</span>
              </div>
              {starredCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm">
                  {starredCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('sent'); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                currentFolder === 'sent' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-black shadow-sm' 
                  : 'hover:bg-gray-100 text-gray-600 border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Send className="h-4 w-4 text-emerald-500" />
                <span className="font-bold">Enviados</span>
              </div>
              {sentCount > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm">
                  {sentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('trash'); }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                currentFolder === 'trash' 
                  ? 'bg-rose-50 text-rose-700 border-rose-200 font-black shadow-sm' 
                  : 'hover:bg-gray-100 text-gray-600 border-transparent hover:border-gray-200'
              }`}
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
              <span className="font-bold">Lixeira</span>
            </button>

            <button
              onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('drafts'); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                currentFolder === 'drafts' 
                  ? 'bg-purple-50 text-purple-700 border-purple-200 font-black shadow-sm' 
                  : 'hover:bg-gray-100 text-gray-600 border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileText className="h-4 w-4 text-purple-400" />
                <span className="font-bold">Rascunhos</span>
              </div>
              {draftsCount > 0 && (
                <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm">
                  {draftsCount}
                </span>
              )}
            </button>
          </nav>

          <div className={`mt-auto pt-4 border-t border-gray-200 text-[11px] text-gray-400 space-y-2 ${isSidebarCollapsed ? 'hidden' : ''}`}>
            <button
              type="button"
              onClick={() => setIsStorageCollapsed(!isStorageCollapsed)}
              className="w-full flex items-center justify-between font-bold text-gray-600 cursor-pointer hover:text-gray-800 transition"
            >
              <span>Cota de Armazenamento</span>
              <ChevronRight className={`h-3 w-3 transition-transform ${isStorageCollapsed ? '' : 'rotate-180'}`} />
            </button>
            
            {!isStorageCollapsed && (
              <div className="space-y-2 p-2.5 bg-gray-50/90 rounded-2xl border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-black text-gray-800">
                    {storageInfo.usedDisplay} <span className="text-gray-400 font-normal">/ 1 GB</span>
                  </span>
                  <span className="text-primary-700 font-black text-[10px] bg-primary-100/80 px-2 py-0.5 rounded-md border border-primary-200">
                    {storageInfo.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      storageInfo.percentage > 90 
                        ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-sm shadow-rose-500/50' 
                        : storageInfo.percentage > 70 
                        ? 'bg-gradient-to-r from-amber-400 to-amber-600 shadow-sm shadow-amber-500/50' 
                        : 'bg-gradient-to-r from-primary-500 to-indigo-600 shadow-sm shadow-primary-500/40'
                    }`}
                    style={{ width: `${Math.max(storageInfo.percentage, 2)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
                  <span className="font-semibold text-gray-500">Plano Corporativo</span>
                  <span className="text-emerald-600 font-black flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    <span>Espaço Seguro</span>
                  </span>
                </div>
              </div>
            )}

            {/* Botão Rápido de Mudar Senha na Barra Lateral */}
            <button
              type="button"
              onClick={() => {
                setPasswordError('');
                setPasswordSuccess('');
                setShowChangePasswordModal(true);
              }}
              className="w-full h-9 flex items-center justify-center space-x-2 px-3 bg-gray-900 hover:bg-black text-white rounded-xl transition cursor-pointer text-xs font-bold shadow-xs mt-2.5 active:scale-98"
              title="Alterar senha desta conta de e-mail"
            >
              <Key className="h-3.5 w-3.5 text-gray-300 shrink-0" />
              <span>Mudar Senha</span>
            </button>

            {/* Botão de Instalação na Barra Lateral */}
            {!isAppInstalled && (
              <button
                type="button"
                onClick={handleTriggerInstall}
                className="w-full h-9 flex items-center justify-center space-x-2 px-3 bg-gray-900 hover:bg-black text-white rounded-xl transition cursor-pointer text-xs font-bold shadow-xs mt-2 active:scale-98"
                title="Instalar o Webmail no Computador ou Telemóvel"
              >
                <Download className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                <span>Instalar App</span>
              </button>
            )}
          </div>
        </aside>

        {/* Message List Column - Mobile First */}
        <section className={`w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col shrink-0 ${selectedMessage ? 'hidden md:flex' : 'flex'}`}>
          {/* Search Input & Filter Pills */}
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar e-mails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>

            {/* Filter Pills */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                className="flex items-center space-x-1.5 text-[11px] font-semibold text-gray-600 hover:text-gray-800 transition cursor-pointer"
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Filtros</span>
                <ChevronRight className={`h-3 w-3 transition-transform ${isFiltersCollapsed ? '' : 'rotate-180'}`} />
              </button>
              
              {!isFiltersCollapsed && (
                <div className="flex items-center space-x-1 text-[11px] font-semibold overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                      filterType === 'all' ? 'bg-primary-600 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('unread')}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                      filterType === 'unread' ? 'bg-primary-600 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Não lidas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('attachments')}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer flex items-center space-x-1 ${
                      filterType === 'attachments' ? 'bg-primary-600 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Paperclip className="w-3 h-3" />
                    <span>Anexos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('starred')}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer flex items-center space-x-1 ${
                      filterType === 'starred' ? 'bg-amber-500 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Star className="w-3 h-3" />
                    <span>Estrela</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('pinned')}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer flex items-center space-x-1 ${
                      filterType === 'pinned' ? 'bg-purple-600 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Pin className="w-3 h-3" />
                    <span>Fixados</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('priority')}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer flex items-center space-x-1 ${
                      filterType === 'priority' ? 'bg-rose-600 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Flame className="w-3 h-3" />
                    <span>Alta Prioridade</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {isLoadingMessages ? (
              // Skeleton Loading
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 mx-2 my-2 animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="w-4 h-4 bg-gray-200 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-16" />
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))
            ) : !mailboxPassword && !isAccountPending ? (
              <div className="p-4 sm:p-6 text-center flex flex-col items-center justify-center my-auto w-full max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-indigo-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-primary-200/60 mb-2">
                  <Lock className="h-6 w-6 text-primary-600" />
                </div>
                <h4 className="font-extrabold text-gray-900 text-sm sm:text-base">Caixa Bloqueada</h4>
                <p className="text-xs text-gray-500 mt-0.5 mb-3 leading-relaxed">
                  Insira a senha de <strong className="font-mono text-primary-700">{selectedAccountEmail}</strong> para aceder às mensagens.
                </p>

                <form onSubmit={handleWebmailLogin} className="w-full space-y-3 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-sm text-left">
                  {webmailLoginError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                      {webmailLoginError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Conta de Email
                    </label>
                    <input
                      type="email"
                      value={webmailLoginEmail || selectedAccountEmail}
                      onChange={(e) => {
                        setWebmailLoginEmail(e.target.value);
                        setSelectedAccountEmail(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs font-mono bg-gray-50 text-gray-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Senha do Webmail
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={webmailLoginPassword}
                        onChange={(e) => setWebmailLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                        title={showLoginPassword ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={webmailLoginLoading}
                    className="w-full py-2.5 bg-gray-900 hover:bg-black active:scale-98 disabled:bg-gray-400 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md flex items-center justify-center space-x-2"
                  >
                    {webmailLoginLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>A autenticar...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Entrar no Webmail</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma mensagem nesta pasta.</p>
              </div>
            ) : (
              displayMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const hasAtt = msg.attachments && msg.attachments.length > 0;
                const imageAttachment = msg.attachments?.find(att => att.type?.startsWith('image/'));
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3.5 sm:p-4 cursor-pointer transition-all duration-200 flex items-start space-x-2.5 sm:space-x-3 rounded-2xl mx-2 my-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 border-2 border-primary-300 shadow-md'
                        : msg.pinned
                        ? 'bg-gradient-to-r from-purple-50/70 to-indigo-50/50 border border-purple-200 shadow-2xs hover:shadow-sm'
                        : msg.isRead
                        ? 'bg-white hover:bg-gray-50 hover:shadow-2xs border border-transparent'
                        : 'bg-gradient-to-r from-blue-50/60 to-indigo-50/40 hover:from-blue-50/80 hover:to-indigo-50/60 border border-blue-200/50 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(msg.id, e)}
                        className="text-gray-300 hover:text-amber-400 transition"
                        title={msg.starred ? 'Remover estrela' : 'Marcar com estrela'}
                      >
                        <Star className={`h-4 w-4 ${msg.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(msg.id, e)}
                        className={`transition ${msg.pinned ? 'text-purple-600 hover:text-purple-700' : 'text-gray-300 hover:text-purple-500'}`}
                        title={msg.pinned ? 'Desafixar mensagem do topo' : 'Fixar mensagem no topo'}
                      >
                        <Pin className={`h-3.5 w-3.5 ${msg.pinned ? 'fill-purple-600 text-purple-600' : ''}`} />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1.5 truncate">
                          <span className={`text-xs sm:text-sm truncate ${msg.isRead ? 'text-gray-700 font-semibold' : 'text-gray-900 font-extrabold'}`}>
                            {msg.fromName}
                          </span>
                          {msg.pinned && (
                            <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-1.5 py-0.2 rounded-md shrink-0 border border-purple-200 flex items-center space-x-1">
                              <Pin className="w-2.5 h-2.5" />
                              <span>Fixado</span>
                            </span>
                          )}
                          {msg.priority === 'high' && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-1.5 py-0.2 rounded-md shrink-0 border border-rose-200 flex items-center space-x-1">
                              <Flame className="w-2.5 h-2.5 text-rose-600" />
                              <span className="hidden sm:inline">Urgente</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 ml-2 shrink-0">
                          {hasAtt && <Paperclip className="h-3.5 w-3.5 text-gray-400" />}
                          <span className="text-[10px] sm:text-[11px] text-gray-400 whitespace-nowrap font-medium">
                            {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <h4 className={`text-xs sm:text-sm truncate mb-0.5 ${msg.isRead ? 'text-gray-800 font-semibold' : 'text-gray-900 font-bold'}`}>
                        {msg.subject}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-gray-500 truncate leading-relaxed">
                        {getSnippetText(msg.textPreview, msg.body)}
                      </p>
                      {imageAttachment && (
                        <div className="mt-1.5 flex items-center space-x-2">
                          <img 
                            src={imageAttachment.url} 
                            alt="Preview" 
                            className="h-7 w-7 rounded-lg object-cover border border-gray-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Message Viewer Pane - Mobile First */}
        <main className={`w-full flex-1 bg-gray-50 flex flex-col overflow-y-auto ${selectedMessage ? 'flex' : 'hidden md:flex'}`}>
          {selectedMessage ? (
            <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-4 sm:space-y-6">
              
              {/* Mobile Back Button */}
              <div className="md:hidden flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="inline-flex items-center space-x-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-2xs hover:bg-gray-50 transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 text-primary-600" />
                  <span>Voltar</span>
                </button>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => handleTogglePin(selectedMessage.id, e)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer ${selectedMessage.pinned ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-white text-gray-600 border-gray-200'}`}
                    title={selectedMessage.pinned ? "Desafixar mensagem" : "Fixar mensagem"}
                  >
                    <Pin className={`h-4 w-4 ${selectedMessage.pinned ? 'fill-purple-600' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleReplyMessage()}
                    className="p-2.5 bg-primary-50 text-primary-600 rounded-xl border border-primary-200 cursor-pointer"
                    title="Responder"
                  >
                    <Reply className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                    className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Header card */}
              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-200 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {selectedMessage.pinned && (
                        <span className="bg-purple-100 text-purple-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center space-x-1 shrink-0">
                          <Pin className="w-3 h-3 fill-purple-700 text-purple-700" />
                          <span>Fixado no Topo</span>
                        </span>
                      )}
                      {selectedMessage.priority === 'high' && (
                        <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center space-x-1 shrink-0">
                          <span>⚡</span>
                          <span>Alta Prioridade</span>
                        </span>
                      )}
                      {selectedMessage.priority === 'low' && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                          🔵 Baixa Prioridade
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900 leading-tight break-words">
                      {selectedMessage.subject}
                    </h2>
                  </div>
                  <div className="hidden sm:flex items-center space-x-2 shrink-0">
                    <button
                      onClick={(e) => handleTogglePin(selectedMessage.id, e)}
                      className={`p-2.5 rounded-2xl transition cursor-pointer border ${selectedMessage.pinned ? 'bg-purple-100 text-purple-700 border-purple-300' : 'hover:bg-purple-50 text-gray-400 hover:text-purple-600 border-transparent'}`}
                      title={selectedMessage.pinned ? "Desafixar mensagem" : "Fixar mensagem no topo"}
                    >
                      <Pin className={`h-4 w-4 ${selectedMessage.pinned ? 'fill-purple-600' : ''}`} />
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="p-2.5 hover:bg-gray-100 text-gray-500 rounded-2xl transition cursor-pointer"
                      title="Imprimir e-mail"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleReplyMessage()}
                      className="p-2.5 hover:bg-primary-50 text-gray-400 hover:text-primary-600 rounded-2xl transition cursor-pointer"
                      title="Responder"
                    >
                      <Reply className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleReplyAllMessage()}
                      className="p-2.5 hover:bg-primary-50 text-gray-400 hover:text-primary-600 rounded-2xl transition cursor-pointer"
                      title="Responder a Todos"
                    >
                      <Reply className="h-4 w-4" style={{ transform: 'scaleX(-1)' }} />
                    </button>
                    <button
                      onClick={() => handleForwardMessage()}
                      className="p-2.5 hover:bg-primary-50 text-gray-400 hover:text-primary-600 rounded-2xl transition cursor-pointer"
                      title="Encaminhar"
                    >
                      <Forward className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleToggleStar(selectedMessage.id, e)}
                      className="p-2.5 hover:bg-gray-100 rounded-2xl transition cursor-pointer"
                    >
                      <Star className={`h-4 w-4 ${selectedMessage.starred ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="p-2.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-2xl transition cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-gray-100 gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${selectedMessage.avatarColor || 'bg-primary-600'} text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0`}>
                      {selectedMessage.fromName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 text-sm block">{selectedMessage.fromName}</span>
                      <span className="text-gray-500 font-mono text-[11px] truncate max-w-[180px] sm:max-w-none block">&lt;{selectedMessage.fromEmail}&gt;</span>
                    </div>
                  </div>

                  {/* Priority Selector Pill */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1.5 bg-gray-100 px-2.5 py-1 rounded-xl border border-gray-200">
                      <Flag className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] font-bold text-gray-500">Prioridade:</span>
                      <select
                        value={selectedMessage.priority || 'normal'}
                        onChange={(e) => handleChangePriority(selectedMessage.id, e.target.value as any)}
                        className={`bg-transparent text-xs font-black outline-none cursor-pointer ${
                          selectedMessage.priority === 'high' ? 'text-rose-700' : selectedMessage.priority === 'low' ? 'text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <option value="normal">Normal</option>
                        <option value="high">Alta Prioridade</option>
                        <option value="low">Baixa Prioridade</option>
                      </select>
                    </div>
                    <div className="text-right text-gray-400 font-medium text-[11px] sm:text-xs">
                      {new Date(selectedMessage.date).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Assistant Smart Bar */}
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-primary-950 rounded-2xl p-3 sm:p-4 text-white shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-xs font-bold">
                    <Sparkles className="h-4 w-4 text-purple-300 animate-pulse" />
                    <span>IA Integrado</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSummarizeWithAI}
                      disabled={isGeneratingSummary}
                      className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[11px] font-bold transition flex items-center space-x-1 disabled:opacity-50"
                    >
                      {isGeneratingSummary ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3 text-amber-300" />}
                      <span>{isGeneratingSummary ? 'Resumindo...' : 'Resumir'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateAIReply('formal')}
                      disabled={isGeneratingReply}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-semibold transition"
                    >
                      Formal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateAIReply('friendly')}
                      disabled={isGeneratingReply}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-semibold transition"
                    >
                      Amigável
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateAIReply('quick_accept')}
                      disabled={isGeneratingReply}
                      className="px-2.5 py-1 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 rounded-lg text-[11px] font-bold transition"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>

                {/* AI Summary Box */}
                {aiSummary && (
                  <div className="p-3 bg-white/10 rounded-xl border border-white/15 text-xs text-purple-100 whitespace-pre-line relative">
                    <button
                      onClick={() => setAiSummary(null)}
                      className="absolute top-2 right-2 text-white/50 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {aiSummary}
                  </div>
                )}
              </div>

              {/* Body card */}
              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-200 flex-1 space-y-4">
                {(() => {
                  let cleanBody = stripRawHeaders(selectedMessage.body);
                  if (cleanBody.includes('&lt;') && cleanBody.includes('&gt;')) {
                    cleanBody = decodeHtmlEntities(cleanBody);
                  }
                  const isHtml = /<[a-z][\s\S]*>/i.test(cleanBody);
                  return isHtml ? (
                    <div 
                      className="prose prose-sm max-w-none text-gray-900 font-sans break-words overflow-x-auto leading-relaxed [&_p]:my-1.5 [&_div]:my-1 [&_*]:text-gray-900"
                      dangerouslySetInnerHTML={{ __html: cleanBody }}
                    />
                  ) : (
                    <div className="whitespace-pre-line text-sm text-gray-900 leading-relaxed font-sans font-normal">
                      {cleanBody}
                    </div>
                  );
                })()}

                {/* Exibição de Ficheiros Anexados */}
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                    <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                      <Paperclip className="h-4 w-4 text-primary-600" />
                      <span>{selectedMessage.attachments.length} Ficheiro(s) Anexado(s)</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedMessage.attachments.map((att, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewAttachment(att)}
                          className="p-2.5 bg-gray-50 hover:bg-primary-50/50 rounded-xl border border-gray-200 flex items-center justify-between transition group cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <FileText className="h-4 w-4 text-primary-600 shrink-0" />
                            <span className="text-xs font-bold text-gray-800 truncate group-hover:text-primary-700">{att.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {att.type?.startsWith('image/') && (
                              <span className="text-[10px] text-gray-400">📷</span>
                            )}
                            <Download className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary-600 shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Reply Form */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                    <Reply className="h-4 w-4 text-primary-600" />
                    <span className="truncate">Resposta rápida para <span className="font-mono text-primary-700">{selectedMessage.fromEmail}</span></span>
                  </span>
                  <span className="text-[10px] text-gray-400 hidden sm:inline">Shift + Enter para nova linha</span>
                </div>

                {/* Sugestões Inteligentes de Resposta Rápida (1 Clique) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-gray-700 flex items-center space-x-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
                      <span>Sugestões Rápidas:</span>
                    </span>
                    <span className="text-[10px] text-gray-400">Clique para preencher</span>
                  </div>
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {getSmartReplies(selectedMessage.subject, selectedMessage.body).map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplyText(sug)}
                        className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-primary-50 hover:from-indigo-100 hover:to-primary-100 text-indigo-800 text-[11px] font-bold rounded-xl border border-indigo-200/80 shadow-2xs whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 flex items-center space-x-1 shrink-0"
                        title="Usar esta resposta"
                      >
                        <span>💬</span>
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escreva a sua resposta..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-sans resize-none"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {quickReplyStatus !== 'idle' && (
                    <span className={`text-xs font-semibold ${quickReplyStatus === 'sent' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {quickReplyStatus === 'sent' ? '✅ Enviada!' : 'Erro ao enviar.'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSendQuickReply}
                    disabled={!replyText.trim() || quickReplySending}
                    className="ml-auto px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{quickReplySending ? 'A enviar...' : 'Enviar Resposta'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isAccountPending ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-amber-950">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 border border-amber-200 shadow-2xs">
                <Clock className="h-8 w-8 text-amber-600 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-gray-900 text-lg mb-1">Conta de E-mail em Ativação (Aguarde Aprovação)</h3>
              <p className="text-xs sm:text-sm text-gray-600 max-w-md leading-relaxed">
                O provisionamento do endereço <strong className="font-mono text-primary-700">{selectedAccountEmail}</strong> está em andamento. O envio, receção e ferramentas completas do Webmail estarão disponíveis assim que o administrador validar a solicitação (prazo estipulado: <strong>em até 24 horas</strong>).
              </p>
            </div>
          ) : !mailboxPassword && !isAccountPending ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-gray-50/60 via-white to-primary-50/20">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200/80 text-left space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center space-x-3.5 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 bg-gradient-to-tr from-primary-100 to-indigo-100 rounded-2xl flex items-center justify-center shrink-0 border border-primary-200/80 shadow-xs">
                    <Mail className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-gray-900">Entrar no Webmail</h3>
                    <p className="text-xs text-gray-500 font-medium">Autenticação Corporativa Segura</p>
                  </div>
                </div>

                <form onSubmit={handleWebmailLogin} className="space-y-4">
                  {webmailLoginError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                      {webmailLoginError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Endereço de E-mail</label>
                    <input
                      type="email"
                      value={webmailLoginEmail || selectedAccountEmail}
                      onChange={(e) => setWebmailLoginEmail(e.target.value)}
                      placeholder="info@seudominio.com"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 font-bold focus:ring-2 focus:ring-primary-500 focus:bg-white transition outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Palavra-passe da Caixa</label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={webmailLoginPassword}
                        onChange={(e) => setWebmailLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoFocus
                        className="w-full pl-4 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:bg-white transition outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                        title={showLoginPassword ? "Ocultar senha" : "Ver senha"}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={webmailLoginLoading}
                    className="w-full py-3 bg-gray-900 hover:bg-black disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center space-x-2 active:scale-98"
                  >
                    {webmailLoginLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>A autenticar...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Entrar no Webmail</span>
                      </>
                    )}
                  </button>
                </form>

                <p className="text-[11px] text-gray-400 text-center pt-1">
                  Protegido com encriptação SSL/TLS via servidores IMAP/SMTP dedicados.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <Mail className="h-16 w-16 mb-3 text-gray-300 opacity-60" />
              <h3 className="font-bold text-gray-700 text-base mb-1">Nenhum e-mail selecionado</h3>
              <p className="text-xs text-gray-400">Selecione uma mensagem na lista à esquerda para visualizar.</p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile FAB: Escrever E-mail */}
      {!showCompose && (
        <button
          type="button"
          onClick={handleOpenCompose}
          className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-primary-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 active:scale-95 border-2 border-white"
          title="Escrever E-mail"
        >
          <Edit3 className="h-6 w-6" />
        </button>
      )}

      {/* Mobile Bottom Sheet Menu */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 z-50 sm:hidden"
          onClick={() => setShowMobileMenu(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-sm font-black text-gray-900 mb-4">Ações do Webmail</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { handleOpenCompose(); setShowMobileMenu(false); }}
                className="flex items-center space-x-3 p-4 bg-primary-50 hover:bg-primary-100 rounded-2xl transition cursor-pointer border border-primary-200 active:scale-95"
              >
                <Edit3 className="h-5 w-5 text-primary-600 shrink-0" />
                <span className="text-sm font-bold text-primary-700">Novo Email</span>
              </button>
              <button
                type="button"
                onClick={() => { setShowSignatureModal(true); setShowMobileMenu(false); }}
                className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-2xl transition cursor-pointer border border-purple-200 active:scale-95"
              >
                <FileSignature className="h-5 w-5 text-purple-600 shrink-0" />
                <span className="text-sm font-bold text-purple-700">Assinatura</span>
              </button>
              <button
                type="button"
                onClick={() => { setShowChangePasswordModal(true); setShowMobileMenu(false); }}
                className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl transition cursor-pointer border border-blue-200 active:scale-95"
              >
                <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
                <span className="text-sm font-bold text-blue-700">Alterar Senha</span>
              </button>
              <button
                type="button"
                onClick={() => { auth.logout(); router.push('/login'); }}
                className="flex items-center space-x-3 p-4 bg-rose-50 hover:bg-rose-100 rounded-2xl transition cursor-pointer border border-rose-200 active:scale-95"
              >
                <LogOut className="h-5 w-5 text-rose-600 shrink-0" />
                <span className="text-sm font-bold text-rose-700">Sair da App</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowMobileMenu(false)}
              className="mt-4 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-2xl transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Escrever E-mail (Compose) */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50">
          <div className={`bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 ${isComposeExpanded ? 'sm:max-w-4xl' : 'sm:max-w-xl'} w-full border border-gray-100 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto`}>
            {isAccountPending ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600 border border-amber-200 shadow-2xs">
                  <Clock className="h-7 w-7 animate-pulse" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900">Aprovação em Processamento</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                  A conta <strong className="font-mono text-primary-700">{selectedAccountEmail}</strong> foi criada e está a ser provisionada nos servidores pela equipa técnica/administrador.
                  <br /><br />
                  <strong>Aviso de Envio:</strong> Poderá escrever e enviar e-mails normalmente assim que a conta for aprovada pelo administrador (o processo é concluído em <strong>até 24 horas</strong>).
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="w-full sm:w-auto px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Entendido, Vou Aguardar a Ativação (24h)
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-extrabold text-gray-900">Novo E-mail</h2>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                      className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-xl transition cursor-pointer ${
                        showTemplateSelector 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                      }`}
                      title="Usar Template"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs font-bold">Templates</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsComposeExpanded(!isComposeExpanded)}
                      className="hidden sm:flex p-2 hover:bg-gray-100 text-gray-600 rounded-xl transition cursor-pointer"
                      title={isComposeExpanded ? "Reduzir" : "Expandir"}
                    >
                      {isComposeExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseCompose}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Template Selector */}
                {showTemplateSelector && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-2xl border border-primary-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
                          <Sparkles className="h-4 w-4 text-primary-600" />
                          <span>Templates de Email</span>
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-1">Selecione um modelo para começar rapidamente</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Language Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            setTemplateLanguage(templateLanguage === 'pt' ? 'en' : 'pt');
                            setSelectedTemplateCategory('Todas');
                          }}
                          className="px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer border border-gray-200 hover:border-primary-300 bg-white"
                        >
                          {templateLanguage === 'pt' ? '🇵🇹 PT' : '🇬🇧 EN'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowTemplateSelector(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Category Filter */}
                    <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() => setSelectedTemplateCategory('Todas')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                          selectedTemplateCategory === 'Todas'
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <LayoutGrid className="h-3 w-3" />
                          {templateLanguage === 'pt' ? 'Todas' : 'All'}
                        </span>
                      </button>
                      {getDisplayCategories().map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedTemplateCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                            selectedTemplateCategory === cat
                              ? 'bg-primary-600 text-white shadow-md'
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Template Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {getFilteredTemplates().map(template => {
                        const IconComp = templateCategoryIcons[template.category] || templateCategoryIcons[template.categoryEN] || FileText;
                        return (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => handleSelectTemplate(template)}
                            className="p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition text-left group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 mb-2 group-hover:scale-105 transition-transform">
                              <IconComp className="h-4 w-4" />
                            </div>
                            <div className="text-xs font-bold text-gray-800 truncate mb-1">
                              {templateLanguage === 'pt' ? template.name : template.nameEN}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate mb-2">
                              {templateLanguage === 'pt' ? template.category : template.categoryEN}
                            </div>
                            <div className="text-[9px] text-gray-400 line-clamp-2">
                              {templateLanguage === 'pt' ? template.subject : template.subjectEN}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

            {sentSuccessMsg ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <p className="font-bold text-gray-900">{sentSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    De (Remetente)
                  </label>
                  <input
                    type="text"
                    value={selectedAccountEmail}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Para (Destinatário)
                  </label>
                  <input
                    type="email"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-sans"
                    required
                  />
                </div>

                {showCcBcc && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                        CC (Cópia)
                      </label>
                      <input
                        type="email"
                        value={composeCc}
                        onChange={(e) => setComposeCc(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                        BCC (Cópia Oculta)
                      </label>
                      <input
                        type="email"
                        value={composeBcc}
                        onChange={(e) => setComposeBcc(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-sans"
                      />
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setShowCcBcc(!showCcBcc)}
                  className="text-[11px] font-bold text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg border border-primary-200 transition cursor-pointer"
                >
                  {showCcBcc ? 'Ocultar CC/BCC' : 'Mostrar CC/BCC'}
                </button>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Assunto
                  </label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Assunto da mensagem"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-sans"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Mensagem
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleImproveWithAI}
                        disabled={isImprovingDraft || !composeBody}
                        className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                        title="Aprimorar redação com IA"
                      >
                        {isImprovingDraft ? <Loader2 className="w-3 h-3 animate-spin text-purple-600" /> : <Sparkles className="w-3 h-3 text-purple-600" />}
                        <span>{isImprovingDraft ? 'Aprimorando...' : '✨ Melhorar com IA'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleInsertSignature}
                        className="text-[11px] font-bold text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded-lg border border-primary-200 transition cursor-pointer flex items-center space-x-1"
                      >
                        <FileSignature className="w-3 h-3 text-primary-600" />
                        <span>Assinatura</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleToggleUppercase}
                        className="text-[11px] font-bold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg border border-gray-300 transition cursor-pointer flex items-center space-x-1"
                        title="Alternar Uppercase/Lowercase"
                      >
                        <Type className="w-3 h-3" />
                        <span>Aa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMessageEditorExpanded(!isMessageEditorExpanded)}
                        className="text-[11px] font-bold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg border border-gray-300 transition cursor-pointer flex items-center space-x-1"
                        title={isMessageEditorExpanded ? "Minimizar Editor" : "Expandir Editor"}
                      >
                        {isMessageEditorExpanded ? (
                          <Minimize2 className="w-3 h-3" />
                        ) : (
                          <Maximize2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 text-gray-900 ${isMessageEditorExpanded ? 'fixed inset-4 z-50 rounded-3xl shadow-2xl' : ''}`}>
                    <style>{`
                      .webmail-quill-editor .ql-toolbar.ql-snow {
                        background-color: #ffffff !important;
                        border-top-left-radius: 1rem !important;
                        border-top-right-radius: 1rem !important;
                        border-color: #e5e7eb !important;
                      }
                      .webmail-quill-editor .ql-container.ql-snow {
                        background-color: #ffffff !important;
                        border-bottom-left-radius: 1rem !important;
                        border-bottom-right-radius: 1rem !important;
                        border-color: #e5e7eb !important;
                      }
                      .webmail-quill-editor .ql-editor {
                        color: #000000 !important;
                        -webkit-text-fill-color: #000000 !important;
                        caret-color: #000000 !important;
                        background-color: #ffffff !important;
                        font-size: 13.5px !important;
                        font-family: inherit !important;
                        line-height: 1.6 !important;
                      }
                      .webmail-quill-editor .ql-editor * {
                        color: #000000 !important;
                        -webkit-text-fill-color: #000000 !important;
                      }
                      .webmail-quill-editor .ql-editor.ql-blank::before {
                        color: #6b7280 !important;
                        -webkit-text-fill-color: #6b7280 !important;
                        font-style: normal !important;
                      }
                    `}</style>
                    {typeof window !== 'undefined' && (
                      <ReactQuill
                        theme="snow"
                        value={composeBody}
                        onChange={setComposeBody}
                        placeholder="Escreva a sua mensagem aqui..."
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['clean']
                          ]
                        }}
                        className="text-xs text-gray-900 bg-white webmail-quill-editor"
                        style={{ minHeight: isMessageEditorExpanded ? 'calc(100vh - 200px)' : '150px' }}
                      />
                    )}
                    {isMessageEditorExpanded && (
                      <button
                        type="button"
                        onClick={() => setIsMessageEditorExpanded(false)}
                        className="absolute top-4 right-4 p-2 bg-white hover:bg-gray-100 rounded-full shadow-lg border border-gray-200 transition cursor-pointer"
                        title="Minimizar"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload de Anexos no Compose */}
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition border border-emerald-200">
                      {uploadingAttachment ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      ) : (
                        <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>{uploadingAttachment ? 'A carregar anexo...' : '📎 Anexar Ficheiro'}</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleComposeFileUpload}
                        disabled={uploadingAttachment}
                      />
                    </label>
                    <span className="text-[10px] text-gray-400">PDF, Imagens, Documentos</span>
                  </div>

                  {attachmentError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl">
                      <p className="text-xs font-bold text-rose-700 flex items-center space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{attachmentError}</span>
                      </p>
                    </div>
                  )}

                  {composeAttachments.length > 0 && (
                    <>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
                        <span className="font-semibold">
                          {composeAttachments.length}/{ATTACHMENT_MAX_COUNT} anexos
                        </span>
                        <span className="font-semibold">
                          {(composeAttachments.reduce((sum, att) => sum + (att.size || 0), 0) / (1024 * 1024)).toFixed(2)} / {ATTACHMENT_TOTAL_MAX_SIZE / (1024 * 1024)}MB
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            (composeAttachments.reduce((sum, att) => sum + (att.size || 0), 0) / ATTACHMENT_TOTAL_MAX_SIZE) > 0.9 
                              ? 'bg-red-500' 
                              : (composeAttachments.reduce((sum, att) => sum + (att.size || 0), 0) / ATTACHMENT_TOTAL_MAX_SIZE) > 0.7 
                                ? 'bg-amber-500' 
                                : 'bg-primary-500'
                          }`}
                          style={{ width: `${Math.min((composeAttachments.reduce((sum, att) => sum + (att.size || 0), 0) / ATTACHMENT_TOTAL_MAX_SIZE) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {composeAttachments.map((att, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs">
                            <FileText className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                            <span className="font-bold text-gray-800 truncate max-w-[150px]">{att.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveComposeAttachment(idx)}
                              className="text-gray-400 hover:text-red-600 transition p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Seletor de Prioridade da Mensagem */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <Flag className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-bold text-gray-700">Prioridade da Mensagem:</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setComposePriority('normal')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border flex items-center space-x-1.5 ${
                        composePriority === 'normal'
                          ? 'bg-white text-gray-900 border-gray-300 shadow-xs'
                          : 'text-gray-500 hover:bg-gray-100 border-transparent'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      <span>Normal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposePriority('high')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border flex items-center space-x-1.5 ${
                        composePriority === 'high'
                          ? 'bg-rose-100 text-rose-800 border-rose-300 shadow-xs font-extrabold'
                          : 'text-gray-500 hover:bg-rose-50 hover:text-rose-700 border-transparent'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                      <span>Alta Prioridade</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposePriority('low')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border flex items-center space-x-1.5 ${
                        composePriority === 'low'
                          ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-xs'
                          : 'text-gray-500 hover:bg-blue-50 hover:text-blue-700 border-transparent'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>Baixa</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseCompose}
                    className="sm:flex-1 py-3 border border-gray-200 text-gray-700 font-bold text-xs rounded-2xl hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraftManually}
                    disabled={sendingMsg || uploadingAttachment}
                    className="sm:flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition cursor-pointer shadow-md flex items-center justify-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Salvar Rascunho</span>
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMsg || uploadingAttachment}
                    className="sm:flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition cursor-pointer shadow-md flex items-center justify-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>{sendingMsg ? 'A Enviar...' : 'Enviar E-mail'}</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {/* MODAL: Attachment Preview */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2 truncate">
                <FileText className="h-5 w-5 text-primary-600 shrink-0" />
                <span className="text-sm font-bold text-gray-900 truncate">{previewAttachment.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={previewAttachment.url}
                  download={previewAttachment.name}
                  className="p-2 hover:bg-gray-100 text-gray-600 rounded-xl transition cursor-pointer"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="p-2 hover:bg-gray-100 text-gray-600 rounded-xl transition cursor-pointer"
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {previewAttachment.type?.startsWith('image/') ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-md"
                />
              ) : previewAttachment.type === 'application/pdf' ? (
                <iframe
                  src={previewAttachment.url}
                  className="w-full h-[70vh] rounded-lg border border-gray-200"
                  title={previewAttachment.name}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-500">
                  <FileText className="h-16 w-16 text-gray-300" />
                  <p className="text-sm">Pré-visualização não disponível para este tipo de ficheiro.</p>
                  <a
                    href={previewAttachment.url}
                    download={previewAttachment.name}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition cursor-pointer"
                  >
                    Download Ficheiro
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Placeholder Warning */}
      {showPlaceholderWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto sm:mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900">Campos Pendentes</h3>
                <p className="text-xs sm:text-sm text-gray-600">O modelo contém placeholders não preenchidos</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs sm:text-sm text-gray-700 mb-3">
                Os seguintes campos precisam ser preenchidos antes de enviar:
              </p>
              <div className="bg-amber-50 rounded-xl p-3 space-y-2">
                {unfilledPlaceholders.map((placeholder, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0"></span>
                    <code className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded">
                      {placeholder}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowPlaceholderWarning(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs sm:text-sm rounded-xl transition cursor-pointer"
              >
                Voltar e Editar
              </button>
              <button
                type="button"
                onClick={proceedToSendEmail}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-md"
              >
                Enviar Mesmo Assim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Webmail Login */}
      {showWebmailLogin && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowWebmailLogin(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">Login Webmail</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Aceda à sua caixa de correio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowWebmailLogin(false);
                  setWebmailLoginEmail('');
                  setWebmailLoginPassword('');
                  setWebmailLoginError('');
                }}
                className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-xl transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleWebmailLogin} className="space-y-4">
              {webmailLoginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <p className="text-xs font-bold text-rose-700">{webmailLoginError}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email da Mailbox</label>
                <input
                  type="email"
                  value={webmailLoginEmail}
                  onChange={(e) => setWebmailLoginEmail(e.target.value)}
                  placeholder="info@wehosthere.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password da Mailbox</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={webmailLoginPassword}
                    onChange={(e) => setWebmailLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-4 pr-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                    title={showLoginPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={webmailLoginLoading}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-black text-sm rounded-xl transition cursor-pointer shadow-md flex items-center justify-center space-x-2"
              >
                {webmailLoginLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Entrar</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Use o e-mail e a palavra-passe da sua conta de e-mail
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Alterar Senha de E-mail (Sincronizado com Migadu) */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold shrink-0">
                  <Key className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">Alterar Senha do E-mail</h3>
                  <p className="text-xs font-mono font-semibold text-blue-600 truncate max-w-[220px] sm:max-w-none">{selectedAccountEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-xl transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Aviso de Sincronização Migadu */}
            <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start space-x-2 mb-4">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                A nova senha será <strong>atualizada instantaneamente na Migadu</strong> e passará a valer para este Webmail, telemóvel e Outlook.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <p className="text-xs font-bold text-rose-700">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-xs font-bold text-emerald-700">{passwordSuccess}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Senha Atual da Caixa {mailboxPassword ? <span className="text-gray-400 font-normal">(opcional)</span> : ''}
                </label>
                <input
                  type={showPasswordText ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  placeholder={mailboxPassword ? "Sessão já autenticada (opcional)" : "Digite sua senha atual"}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">Nova Senha</label>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
                      let generated = '';
                      for (let i = 0; i < 12; i++) {
                        generated += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      setNewPassword(generated);
                      setConfirmPassword(generated);
                      setShowPasswordText(true);
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
                  >
                    <span>Gerar Senha Forte</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPasswordText ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium pr-10"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                    title={showPasswordText ? "Ocultar senha" : "Ver senha"}
                  >
                    {showPasswordText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirmar Nova Senha</label>
                <input
                  type={showPasswordText ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  placeholder="Digite novamente a nova senha"
                  required
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newPassword || !confirmPassword || isUpdatingPassword}
                  className="flex-1 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-md flex items-center justify-center space-x-2"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>A sincronizar...</span>
                    </>
                  ) : (
                    <span>Salvar Nova Senha</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Gerador e Gestor de Assinatura de E-mail */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto border border-gray-100 sm:mx-4">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center font-bold">
                  <FileSignature className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">Assinatura Profissional</h3>
                  <p className="text-[11px] sm:text-xs text-gray-500 truncate max-w-[200px] sm:max-w-none">{selectedAccountEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSignatureModal(false)}
                className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-xl transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSignature} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={signatureForm.fullName}
                    onChange={(e) => setSignatureForm({ ...signatureForm, fullName: e.target.value })}
                    placeholder="Seu Nome"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={signatureForm.jobTitle}
                    onChange={(e) => setSignatureForm({ ...signatureForm, jobTitle: e.target.value })}
                    placeholder="Diretor Geral, Comercial, etc."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Empresa</label>
                  <input
                    type="text"
                    value={signatureForm.companyName}
                    onChange={(e) => setSignatureForm({ ...signatureForm, companyName: e.target.value })}
                    placeholder="Nome da sua Empresa"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={signatureForm.phone}
                    onChange={(e) => setSignatureForm({ ...signatureForm, phone: e.target.value })}
                    placeholder="+258 84 000 0000"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Website / Link</label>
                <input
                  type="text"
                  value={signatureForm.website}
                  onChange={(e) => setSignatureForm({ ...signatureForm, website: e.target.value })}
                  placeholder="https://suaempresa.co.mz"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              {/* Live Signature Preview */}
              <div className="pt-1">
                <label className="block text-gray-700 font-bold mb-1">Pré-visualização:</label>
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1 text-gray-800 font-sans border-l-4 border-l-purple-600">
                  <div className="font-bold text-sm text-gray-900">{signatureForm.fullName || 'Seu Nome'}</div>
                  <div className="text-gray-600 text-xs">
                    {signatureForm.jobTitle ? `${signatureForm.jobTitle} • ` : ''}{signatureForm.companyName || 'Sua Empresa'}
                  </div>
                  {signatureForm.phone && (
                    <div className="text-gray-500 text-[11px]">📞 {signatureForm.phone}</div>
                  )}
                  {signatureForm.website && (
                    <div className="text-purple-600 font-semibold text-[11px]"> {signatureForm.website}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignatureModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingSignature || !signatureForm.fullName}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center space-x-1.5"
                >
                  {isSavingSignature ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>{isSavingSignature ? 'Salvando...' : 'Salvar Assinatura'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Como Instalar o Webmail no Computador ou Telemóvel */}
      {showInstallGuideModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-gray-100 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    Instalar WEHOSTHERE Webmail
                  </h3>
                  <p className="text-xs text-gray-500">
                    Abra o seu e-mail como um app dedicado no PC ou telemóvel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallGuideModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-gray-700">
              {/* Opção 1: Computador */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-slate-900">
                  <Laptop className="h-4 w-4 text-blue-600" />
                  <span>No Computador (Google Chrome ou Microsoft Edge):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 pl-1">
                  <li>Na barra de endereços (ao lado do link do site), clique no ícone de <strong>Instalar aplicativo (⊕ ou monitor)</strong>.</li>
                  <li>Ou clique nos <strong>três pontinhos (⋮)</strong> no canto superior direito do navegador &gt; <strong>Instalar WEHOSTHERE Webmail</strong>.</li>
                  <li>Clique em <strong>Instalar</strong>. O ícone será colocado na sua Área de Trabalho e Menu Iniciar.</li>
                </ol>
              </div>

              {/* Opção 2: iPhone / iPad */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-slate-900">
                  <Smartphone className="h-4 w-4 text-slate-800" />
                  <span>No iPhone ou iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 pl-1">
                  <li>Toque no botão de <strong>Partilhar (o ícone de quadrado com seta para cima ⎋)</strong> na barra inferior.</li>
                  <li>Role a lista para baixo e toque em <strong>&quot;Adicionar ao Ecrã Principal&quot;</strong>.</li>
                  <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
                </ol>
              </div>

              {/* Opção 3: Android */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-slate-900">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  <span>No Android (Google Chrome / Samsung Internet):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 pl-1">
                  <li>Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito do navegador.</li>
                  <li>Toque em <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar ao ecrã inicial&quot;</strong>.</li>
                  <li>Confirme tocando em <strong>Instalar</strong>.</li>
                </ol>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInstallGuideModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirmação de Eliminação de E-mail */}
      {deleteConfirmModal?.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3.5 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${deleteConfirmModal.isPermanent ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900">
                  {deleteConfirmModal.isPermanent ? 'Eliminar Permanentemente' : 'Mover para a Lixeira'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {deleteConfirmModal.isPermanent ? 'Esta ação não pode ser desfeita' : 'Pode recuperar a mensagem na Lixeira'}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 mb-5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Assunto da Mensagem</span>
              <p className="text-xs sm:text-sm font-bold text-gray-800 truncate mt-0.5">
                {deleteConfirmModal.subject}
              </p>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold text-xs rounded-2xl hover:bg-gray-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => executeDeleteMessage(deleteConfirmModal.msgId)}
                className={`flex-1 py-3 text-white font-black text-xs rounded-2xl transition cursor-pointer shadow-md flex items-center justify-center space-x-2 ${deleteConfirmModal.isPermanent ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                <Trash2 className="h-4 w-4" />
                <span>{deleteConfirmModal.isPermanent ? 'Sim, Eliminar' : 'Sim, Mover para Lixeira'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )}
</div>
  );
}

export default function WebmailPage() {
  return (
    <Suspense fallback={<PageLoader text="A carregar Email Corporativo..." />}>
      <WebmailContent />
    </Suspense>
  );
}


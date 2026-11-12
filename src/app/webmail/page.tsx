'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Mail, Inbox, Send, Star, Trash2, Edit3, Search, RefreshCw, 
  ArrowLeft, CheckCircle2, ShieldCheck, ShieldAlert, User, Paperclip, Reply, Forward,
  FileText, LogOut, ChevronRight, X, AlertCircle, Sparkles, Clock, Printer, Download, Loader2, Filter, Maximize2, Minimize2, Bold, Italic, Underline, Type,
  Wand2, Bot, FileSignature, Lightbulb, Check, CheckCheck, Wifi, WifiOff, Pin, PinOff, Flag, Flame, Lock, Key, Eye, EyeOff,
  Bell, Calendar, TrendingUp, LayoutGrid, HelpCircle, Smartphone, Laptop, Monitor,
  Globe, Languages, Sun, Sunset, Moon, MessageSquare, Image as ImageIcon, ExternalLink, BarChart3,
  Mic, MicOff, Volume2, VolumeX, Play, Pause, Square, Headphones, Server, Plus, Users
} from 'lucide-react';
import { auth, User as AuthUser } from '@/lib/auth';
import { dataManager, EmailAccount } from '@/lib/data';
import { webmailManager, WebmailMessage, WebmailAttachment, ATTACHMENT_MAX_SIZE, ATTACHMENT_MAX_COUNT, ATTACHMENT_TOTAL_MAX_SIZE } from '@/lib/webmailClient';
import { emailTemplates, templateCategories, templateCategoriesEN, EmailTemplate } from '@/lib/emailTemplates';
import { soundEffects } from '@/lib/soundEffects';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import InternalDomainChat from '@/components/webmail/InternalDomainChat';
import WebmailAnalyticsDashboard from '@/components/webmail/WebmailAnalyticsDashboard';
import ExternalAccountsModal from '@/components/webmail/ExternalAccountsModal';
import EmailAgentControl from '@/components/EmailAgentControl';
import { apiEndpoint } from '@/lib/siteConfig';
import dynamic from 'next/dynamic';
import ContactPicker from '@/components/webmail/ContactPicker';
import RecipientInput, { normalizeRecipients, findInvalidRecipients, splitRecipients } from '@/components/webmail/RecipientInput';

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

// Configuração dos formatos customizados do Quill (fontes e tamanhos estilo Outlook)
function setupQuillFormats(Quill: any) {
  if (!Quill) return;
  try {
    const fonts = [
      'arial',
      'calibri',
      'times-new-roman',
      'georgia',
      'verdana',
      'tahoma',
      'courier-new'
    ];
    const sizes = ['10px', '12px', '14px', '16px', '18px', '24px', '32px'];

    // 1. Whitelist em formats/font (ClassAttributor utilizado pelo Snow theme)
    const FontClass = Quill.import('formats/font');
    if (FontClass) {
      FontClass.whitelist = fonts;
      Quill.register(FontClass, true);
    }

    // 2. Whitelist em attributors/style/font (StyleAttributor)
    const FontStyle = Quill.import('attributors/style/font');
    if (FontStyle) {
      FontStyle.whitelist = fonts;
      Quill.register(FontStyle, true);
    }

    // 3. Whitelist em formats/size (ClassAttributor utilizado pelo Snow theme)
    const SizeClass = Quill.import('formats/size');
    if (SizeClass) {
      SizeClass.whitelist = sizes;
      Quill.register(SizeClass, true);
    }

    // 4. Whitelist em attributors/style/size (StyleAttributor)
    const SizeStyle = Quill.import('attributors/style/size');
    if (SizeStyle) {
      SizeStyle.whitelist = sizes;
      Quill.register(SizeStyle, true);
    }

    // 5. Alinhamentos
    const AlignClass = Quill.import('formats/align');
    if (AlignClass) {
      Quill.register(AlignClass, true);
    }
    const AlignStyle = Quill.import('attributors/style/align');
    if (AlignStyle) {
      Quill.register(AlignStyle, true);
    }
  } catch (err) {
    console.warn('Quill setup formats:', err);
  }
}

// Dynamic import for React Quill to avoid SSR issues and register Outlook-style font families and sizes
const ReactQuill = dynamic(
  async () => {
    const rq = await import('react-quill');
    const Quill = (rq as any).Quill || (rq as any).default?.Quill;
    if (Quill) {
      setupQuillFormats(Quill);
    }
    return rq.default;
  },
  { ssr: false }
);
import 'react-quill/dist/quill.snow.css';

function prepareEmailBodyForSending(html: string): string {
  if (!html) return html;
  return html
    // Converter classes de fonte em estilos inline para clientes de e-mail (Gmail, Outlook, Apple Mail, etc.)
    .replace(/class="([^"]*)ql-font-times-new-roman([^"]*)"/gi, 'class="$1$2" style="font-family: \'Times New Roman\', Times, Georgia, serif;"')
    .replace(/class="([^"]*)ql-font-arial([^"]*)"/gi, 'class="$1$2" style="font-family: Arial, Helvetica, sans-serif;"')
    .replace(/class="([^"]*)ql-font-calibri([^"]*)"/gi, 'class="$1$2" style="font-family: Calibri, Candara, Segoe, Arial, sans-serif;"')
    .replace(/class="([^"]*)ql-font-georgia([^"]*)"/gi, 'class="$1$2" style="font-family: Georgia, serif;"')
    .replace(/class="([^"]*)ql-font-verdana([^"]*)"/gi, 'class="$1$2" style="font-family: Verdana, Geneva, sans-serif;"')
    .replace(/class="([^"]*)ql-font-tahoma([^"]*)"/gi, 'class="$1$2" style="font-family: Tahoma, Verdana, sans-serif;"')
    .replace(/class="([^"]*)ql-font-courier-new([^"]*)"/gi, 'class="$1$2" style="font-family: \'Courier New\', Courier, monospace;"')
    .replace(/class="([^"]*)ql-font-serif([^"]*)"/gi, 'class="$1$2" style="font-family: \'Times New Roman\', Times, Georgia, serif;"')
    .replace(/class="([^"]*)ql-font-monospace([^"]*)"/gi, 'class="$1$2" style="font-family: \'Courier New\', Courier, monospace;"')
    // Substituições de estilo inline
    .replace(/font-family:\s*times-new-roman/gi, 'font-family: "Times New Roman", Times, Georgia, serif')
    .replace(/font-family:\s*courier-new/gi, 'font-family: "Courier New", Courier, monospace')
    .replace(/font-family:\s*arial/gi, 'font-family: Arial, Helvetica, sans-serif')
    .replace(/font-family:\s*calibri/gi, 'font-family: Calibri, Candara, Segoe, Arial, sans-serif')
    .replace(/font-family:\s*georgia/gi, 'font-family: Georgia, serif')
    .replace(/font-family:\s*verdana/gi, 'font-family: Verdana, Geneva, sans-serif')
    .replace(/font-family:\s*tahoma/gi, 'font-family: Tahoma, Verdana, sans-serif')
    // Tamanhos
    .replace(/class="([^"]*)ql-size-10px([^"]*)"/gi, 'class="$1$2" style="font-size: 10px;"')
    .replace(/class="([^"]*)ql-size-12px([^"]*)"/gi, 'class="$1$2" style="font-size: 12px;"')
    .replace(/class="([^"]*)ql-size-14px([^"]*)"/gi, 'class="$1$2" style="font-size: 14px;"')
    .replace(/class="([^"]*)ql-size-16px([^"]*)"/gi, 'class="$1$2" style="font-size: 16px;"')
    .replace(/class="([^"]*)ql-size-18px([^"]*)"/gi, 'class="$1$2" style="font-size: 18px;"')
    .replace(/class="([^"]*)ql-size-24px([^"]*)"/gi, 'class="$1$2" style="font-size: 24px;"')
    .replace(/class="([^"]*)ql-size-32px([^"]*)"/gi, 'class="$1$2" style="font-size: 32px;"')
    .replace(/class="([^"]*)ql-size-small([^"]*)"/gi, 'class="$1$2" style="font-size: 11px;"')
    .replace(/class="([^"]*)ql-size-large([^"]*)"/gi, 'class="$1$2" style="font-size: 18px;"')
    .replace(/class="([^"]*)ql-size-huge([^"]*)"/gi, 'class="$1$2" style="font-size: 24px;"')
    // Alinhamentos
    .replace(/class="([^"]*)ql-align-center([^"]*)"/gi, 'class="$1$2" style="text-align: center;"')
    .replace(/class="([^"]*)ql-align-right([^"]*)"/gi, 'class="$1$2" style="text-align: right;"')
    .replace(/class="([^"]*)ql-align-justify([^"]*)"/gi, 'class="$1$2" style="text-align: justify;"')
    // Unificar atributos style duplicados na mesma tag HTML (ex: cor + fonte + tamanho)
    .replace(/<([a-z0-9]+)\b([^>]*)>/gi, (tag, tagName, attrs) => {
      const styleMatches = [...attrs.matchAll(/\sstyle="([^"]*)"/gi)];
      if (styleMatches.length <= 1) return tag;
      const mergedStyle = styleMatches.map(m => m[1].trim().replace(/;$/, '')).filter(Boolean).join('; ');
      const cleanedAttrs = attrs.replace(/\sstyle="[^"]*"/gi, '');
      return `<${tagName}${cleanedAttrs} style="${mergedStyle};">`;
    });
}

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

interface EmailSecurityAnalysis {
  level: 'safe' | 'medium' | 'high';
  title: string;
  reasons: string[];
  tips: string[];
}

function analyzeEmailSecurity(
  msg: WebmailMessage | null,
  currentAccountEmail: string,
  trustedSenders: Set<string>
): EmailSecurityAnalysis {
  if (!msg || msg.folder === 'sent' || msg.folder === 'drafts') {
    return { level: 'safe', title: '', reasons: [], tips: [] };
  }

  const fromEmail = (msg.fromEmail || '').trim().toLowerCase();
  const fromName = (msg.fromName || '').trim();
  const fromDomain = fromEmail.split('@')[1] || '';
  const userDomain = (currentAccountEmail || '').split('@')[1]?.toLowerCase() || '';

  // Remetentes confiáveis pelo utilizador ou notificações internas oficiais WEHOSTHERE
  if (
    trustedSenders.has(fromEmail) ||
    fromEmail === 'noreply@wehosthere.com' ||
    fromEmail === 'info@wehosthere.com' ||
    fromEmail === 'suporte@wehosthere.com' ||
    fromEmail === 'admin@wehosthere.com'
  ) {
    return { level: 'safe', title: '', reasons: [], tips: [] };
  }

  const rawBody = stripRawHeaders(msg.body || '');
  const plainBody = rawBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const combinedLower = `${msg.subject || ''} ${plainBody}`.toLowerCase();
  const nameLower = fromName.toLowerCase();

  const freeEmailDomains = new Set([
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'yahoo.com.br',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'msn.com',
    'icloud.com',
    'aol.com',
    'mail.ru',
    'yandex.com',
    'protonmail.com',
    'proton.me',
  ]);
  const isFreeDomain = freeEmailDomains.has(fromDomain);

  const reasons: string[] = [];
  let isHighRisk = false;

  // 1. Deteção de Falsificação de Identidade (Spoofing de Marca / Banco / Suporte)
  const protectedBrands = [
    { keyword: 'wehosthere', officialDomain: 'wehosthere.com', label: 'WEHOSTHERE' },
    { keyword: 'millennium', officialDomain: 'millenniumbim.co.mz', label: 'Millennium BIM' },
    { keyword: 'standard bank', officialDomain: 'standardbank.co.mz', label: 'Standard Bank' },
    { keyword: 'bci', officialDomain: 'bci.co.mz', label: 'Banco BCI' },
    { keyword: 'm-pesa', officialDomain: 'vm.co.mz', label: 'Vodacom M-Pesa' },
    { keyword: 'mpesa', officialDomain: 'vm.co.mz', label: 'Vodacom M-Pesa' },
    { keyword: 'emola', officialDomain: 'movitel.co.mz', label: 'Movitel e-Mola' },
    { keyword: 'paypal', officialDomain: 'paypal.com', label: 'PayPal' },
    { keyword: 'microsoft', officialDomain: 'microsoft.com', label: 'Microsoft' },
  ];

  for (const brand of protectedBrands) {
    if (nameLower.includes(brand.keyword) && !fromDomain.endsWith(brand.officialDomain)) {
      isHighRisk = true;
      reasons.push(
        `O nome de exibição menciona "${brand.label}", mas o e-mail real provém de um domínio externo não oficial (<${fromEmail}>).`
      );
    }
  }

  // 2. Deteção de Phishing / Roubo de Credenciais / Fraude Financeira
  const phishingPatterns = [
    /confirm(e|ar)?\s+(a\s+)?sua\s+senha/i,
    /atualiz(e|ar)\s+(os\s+)?seus\s+dados\s+banc[aá]rios/i,
    /sua\s+conta\s+foi\s+suspensa/i,
    /sua\s+conta\s+ser[aá]\s+(bloqueada|desativada|suspensa)/i,
    /verify\s+your\s+(account|password|identity)/i,
    /your\s+account\s+has\s+been\s+(suspended|locked|compromised)/i,
    /urgent\s+action\s+required/i,
    /digite\s+o\s+seu\s+pin/i,
    /seed\s+phrase|private\s+key/i,
    /ganhou\s+um\s+pr[eé]mio|won\s+the\s+lottery/i,
  ];

  if (phishingPatterns.some((rx) => rx.test(combinedLower))) {
    isHighRisk = true;
    reasons.push(
      'A mensagem contém linguagem típica de phishing (pedido urgente de validação de conta, senha, PIN ou ameaça de bloqueio).'
    );
  }

  // 3. Anexos potencialmente executáveis ou perigosos
  if (msg.attachments && msg.attachments.length > 0) {
    const dangerousExts = ['.exe', '.scr', '.bat', '.cmd', '.vbs', '.js', '.msi', '.ps1', '.hta', '.apk'];
    const riskyAtt = msg.attachments.find((att) =>
      dangerousExts.some((ext) => (att.name || '').toLowerCase().endsWith(ext))
    );
    if (riskyAtt) {
      isHighRisk = true;
      reasons.push(
        `Contém um anexo executável potencialmente perigoso ("${riskyAtt.name}"). Nunca execute ficheiros desconhecidos.`
      );
    }
  }

  // 4. Redirecionamento para Telegram / Contacto Externo Anónimo ou Spam Comercial (ex: Trustpilot / Reviews / Crypto)
  if (/telegram\s*:\s*@|t\.me\/|whatsapp\s*:\s*\+/i.test(combinedLower) && isFreeDomain) {
    reasons.push(
      `O remetente utiliza uma conta de e-mail gratuita (${fromDomain}) e tenta desviar a conversa para canais externos (${
        /telegram/i.test(combinedLower) ? 'Telegram' : 'WhatsApp'
      }).`
    );
  }

  if (
    isFreeDomain &&
    /trustpilot|negative\s+reviews|genuine\s+feedback|seo\s+services|buy\s+reviews|backlinks|crypto\s+investment|forex/i.test(
      combinedLower
    )
  ) {
    reasons.push(
      'Solicitação comercial não verificada (venda de avaliações/Trustpilot, SEO ou serviços externos de origem desconhecida).'
    );
  }

  // 5. Conta gratuita com números aleatórios no utilizador + abordagem genérica em inglês/português
  if (
    isFreeDomain &&
    /\d{2,}@/.test(fromEmail) &&
    /business\s+discussion|partnership\s+proposal|urgent\s+business|investment\s+opportunity/i.test(combinedLower)
  ) {
    reasons.push(
      `Endereço de remetente genérico (${fromEmail}) com assunto de abordagem em massa ("${msg.subject}").`
    );
  }

  // 6. Links encurtados ou endereços IP diretos no corpo do e-mail
  if (/https?:\/\/(bit\.ly|tinyurl\.com|is\.gd|rb\.gy|cutt\.ly|t\.co)\//i.test(rawBody) || /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(rawBody)) {
    reasons.push(
      'O e-mail contém links encurtados ou ocultos que podem mascarar o verdadeiro site de destino.'
    );
  }

  if (reasons.length === 0) {
    return { level: 'safe', title: '', reasons: [], tips: [] };
  }

  const level: 'medium' | 'high' = isHighRisk ? 'high' : 'medium';
  const title = isHighRisk
    ? 'Alerta Crítico de Segurança: Possível Tentativa de Phishing ou Fraude'
    : 'Aviso Inteligente de Segurança: E-mail ou Remetente Suspeito';

  const tips = isHighRisk
    ? [
        'Nunca forneça a sua palavra-passe do Webmail, códigos M-Pesa/eMola ou dados bancários.',
        'Não clique em links nem descarregue anexos deste remetente.',
        'Recomendamos eliminar esta mensagem imediatamente.',
      ]
    : [
        'Confirme se conhece realmente o remetente antes de responder ou clicar em links.',
        'Evite continuar negociações empresariais através de contas anónimas de Telegram enviadas por desconhecidos.',
      ];

  return { level, title, reasons, tips };
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

// Reescreve as imagens do corpo do e-mail para que sejam sempre visíveis:
// - CDNs públicas (Cloudinary, Google, Unsplash) e data: carregam directamente
// - referências cid: são resolvidas a partir dos anexos inline da mensagem
// - http inseguro passa pelo proxy do servidor para evitar bloqueio por Mixed Content
// - https externo carrega directamente com fallback limpo para proxy se CORS/hotlink bloquear
function rewriteEmailImages(html: string, attachments?: WebmailAttachment[]): string {
  if (!html || !/<img/i.test(html)) return html;
  return html.replace(/(<img\b[^>]*?\bsrc\s*=\s*)(["'])(.*?)\2/gi, (full, prefix, quote, rawSrc) => {
    const src = decodeHtmlEntities(String(rawSrc).trim());
    if (!src || src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/api/')) return full;

    // CDNs públicas conhecidas: carregar directamente sem proxy
    if (
      src.includes('res.cloudinary.com') ||
      src.includes('cloudinary.com') ||
      src.includes('googleusercontent.com') ||
      src.includes('images.unsplash.com')
    ) {
      return `${prefix}${quote}${src}${quote}`;
    }

    if (/^cid:/i.test(src)) {
      const cid = src.slice(4).replace(/^<|>$/g, '').trim();
      const cidBase = cid.split('@')[0].toLowerCase();
      const match = attachments?.find(att => {
        const attCid = (att.cid || '').replace(/^<|>$/g, '').trim().toLowerCase();
        const n = (att.name || '').toLowerCase();
        return (
          (attCid && (attCid === cid.toLowerCase() || attCid === cidBase || attCid.includes(cidBase))) ||
          (n && (n === cidBase || cid.toLowerCase().includes(n) || n.includes(cidBase)))
        );
      });
      if (match?.url) {
        return `${prefix}${quote}${match.url}${quote}`;
      }
      // CID sem correspondência: ocultar o elemento para não exibir ícone quebrado
      return `${prefix}${quote}data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7${quote} style="display:none;"`;
    }

    const absolute = src.startsWith('//') ? `https:${src}` : src;
    if (/^https?:\/\//i.test(absolute)) {
      // Passar sempre pelo proxy: garante que http e https carregam sem Mixed Content, CORS ou anti-hotlink
      return `${prefix}${quote}/api/webmail/image-proxy?url=${encodeURIComponent(absolute)}${quote}`;
    }

    return full;
  });
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
  const [showExternalAccountsModal, setShowExternalAccountsModal] = useState<boolean>(false); // Modal de Contas Externas IMAP/SMTP
  const [externalAccountsCount, setExternalAccountsCount] = useState<number>(0); // Total de contas externas conectadas
  const [showAgentModal, setShowAgentModal] = useState<boolean>(false); // Modal Modo Agente IA Auto-Resposta
  const [agentActive, setAgentActive] = useState<boolean>(false);
  const activeAgentEmail = (selectedAccountEmail || webmailLoginEmail || accounts[0]?.email || '').trim().toLowerCase();
  const isWehosthereAccount = activeAgentEmail.endsWith('@wehosthere.com');

  useEffect(() => {
    const emailToCheck = selectedAccountEmail || webmailLoginEmail || accounts[0]?.email;
    if (!emailToCheck || !emailToCheck.includes('@') || !emailToCheck.trim().toLowerCase().endsWith('@wehosthere.com')) {
      setAgentActive(false);
      setShowAgentModal(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/webmail/agent?email=${encodeURIComponent(emailToCheck)}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.config?.evaluation) {
          setAgentActive(!!d.config.evaluation.active);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedAccountEmail, webmailLoginEmail, accounts]);
  const [animatedEmailPlaceholder, setAnimatedEmailPlaceholder] = useState<string>('');

  // Efeito máquina de escrever (Typewriter) para o placeholder de endereço de e-mail
  useEffect(() => {
    if (mailboxPassword && !showWebmailLogin) return;
    const placeholders = [
      'colaborador@suaempresa.co.mz',
      'direccao@suaempresa.com',
      'comercial@empresa.co.mz',
      'info@seudominio.co.mz',
      'financeiro@suaempresa.co.mz',
    ];
    let currentIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const tick = () => {
      const currentFullText = placeholders[currentIndex];
      if (!isDeleting) {
        charIndex++;
        setAnimatedEmailPlaceholder(currentFullText.slice(0, charIndex));
        if (charIndex === currentFullText.length) {
          isDeleting = true;
          timeoutId = setTimeout(tick, 1800);
          return;
        }
        timeoutId = setTimeout(tick, 65);
      } else {
        charIndex--;
        setAnimatedEmailPlaceholder(currentFullText.slice(0, charIndex));
        if (charIndex === 0) {
          isDeleting = false;
          currentIndex = (currentIndex + 1) % placeholders.length;
          timeoutId = setTimeout(tick, 350);
          return;
        }
        timeoutId = setTimeout(tick, 35);
      }
    };

    timeoutId = setTimeout(tick, 300);
    return () => clearTimeout(timeoutId);
  }, [mailboxPassword, showWebmailLogin]);

  const [currentFolder, setCurrentFolder] = useState<'inbox' | 'notifications' | 'sent' | 'starred' | 'trash' | 'drafts' | 'scheduled'>('inbox');
  const [messages, setMessages] = useState<WebmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<WebmailMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; msgId: string; msgIds?: string[]; subject: string; isPermanent: boolean } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const isNotificationEmail = (msg: WebmailMessage): boolean => {
    const from = (msg.fromEmail || '').trim().toLowerCase();
    return (
      from.startsWith('noreply@') ||
      from.startsWith('no-reply@') ||
      from.startsWith('do-not-reply@') ||
      from.startsWith('donotreply@') ||
      from.startsWith('notifications@') ||
      from.startsWith('notification@') ||
      from.startsWith('mailer-daemon@')
    );
  };

  // New email sound detection
  const knownInboxIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  // Filter & Refresh State
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'overdue' | 'attachments' | 'starred' | 'pinned' | 'priority'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | `m:${number}`>('all');
  const [isRefreshingWebmail, setIsRefreshingWebmail] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Percentagem Dinâmica de Processamento e Sincronização (0% a 100%)
  const [syncPercentage, setSyncPercentage] = useState<number>(0);
  const [isSyncVisible, setIsSyncVisible] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let fadeTimeout: NodeJS.Timeout;

    if (isLoadingMessages || isRefreshingWebmail) {
      setIsSyncVisible(true);
      setSyncPercentage((prev) => (prev > 0 && prev < 90 ? prev : 15));

      interval = setInterval(() => {
        setSyncPercentage((prev) => {
          if (prev < 40) return prev + Math.floor(Math.random() * 8 + 5);
          if (prev < 75) return prev + Math.floor(Math.random() * 6 + 4);
          if (prev < 92) return prev + Math.floor(Math.random() * 3 + 2);
          return Math.min(97, prev + 1);
        });
      }, 160);
    } else if (isSyncVisible) {
      // Quando termina de processar, atinge 100% e fecha suavemente
      setSyncPercentage(100);
      fadeTimeout = setTimeout(() => {
        setIsSyncVisible(false);
        setSyncPercentage(0);
      }, 550);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimeout);
    };
  }, [isLoadingMessages, isRefreshingWebmail]);

  // Floating Inbox Briefing Card State (Auto-dismisses after showing new/overdue emails)
  const [floatingBriefing, setFloatingBriefing] = useState<{
    isOpen: boolean;
    isClosing?: boolean;
    type: 'welcome' | 'new_incoming';
    unreadCount: number;
    overdueCount: number;
    urgentCount: number;
    latestSender?: string;
    latestSubject?: string;
    latestMsgId?: string;
  } | null>(null);
  const briefingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const briefingCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dismissFloatingBriefing = () => {
    if (briefingTimeoutRef.current) clearTimeout(briefingTimeoutRef.current);
    if (briefingCloseTimeoutRef.current) clearTimeout(briefingCloseTimeoutRef.current);
    setFloatingBriefing((prev) => (prev ? { ...prev, isClosing: true } : null));
    briefingCloseTimeoutRef.current = setTimeout(() => {
      setFloatingBriefing(null);
    }, 520);
  };

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
  const [composeError, setComposeError] = useState('');
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingScheduledId, setEditingScheduledId] = useState<string | null>(null);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [composeScheduledFor, setComposeScheduledFor] = useState<string>('');
  const scheduledDispatchingRef = useRef<Set<string>>(new Set());

  // Módulos do editor de e-mail estilo Outlook (família da fonte, tamanhos, cores, realce, alinhamentos)
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ font: [false, 'arial', 'calibri', 'times-new-roman', 'georgia', 'verdana', 'tahoma', 'courier-new'] }],
        [{ size: ['10px', '12px', false, '16px', '18px', '24px', '32px'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ script: 'sub' }, { script: 'super' }],
        ['clean']
      ]
    }),
    []
  );

  // Garantir que os formatos customizados do Quill (fontes e tamanhos estilo Outlook) estão registrados no browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-quill').then((rq) => {
        const Quill = (rq as any).Quill || (rq as any).default?.Quill;
        if (Quill) {
          setupQuillFormats(Quill);
        }
      });
    }
  }, []);

  // Show CC/BCC fields state
  const [showCcBcc, setShowCcBcc] = useState(false);
  // Contact picker state
  const [showToPicker, setShowToPicker] = useState(false);

  // Autocomplete de contactos no campo "Para"
  const [toSuggestions, setToSuggestions] = useState<{ email: string; name: string }[]>([]);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const toInputRef = useRef<HTMLInputElement>(null);

  // Template state
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>('Todas');
  const [templateLanguage, setTemplateLanguage] = useState<'pt' | 'en'>('pt');
  const [isComposeExpanded, setIsComposeExpanded] = useState(true);

  // Collapse states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [internalChatUnread, setInternalChatUnread] = useState(0);
  const [internalChatOnline, setInternalChatOnline] = useState(0);
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);

  // Attachment preview state
  const [previewAttachment, setPreviewAttachment] = useState<WebmailAttachment | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  // Converter anexos (especialmente PDFs e imagens data: ou IMAP) em Blob URLs seguras para preview instantâneo
  useEffect(() => {
    if (!previewAttachment || !previewAttachment.url) {
      setPreviewBlobUrl('');
      setPreviewLoading(false);
      return;
    }

    let active = true;
    setPreviewLoading(true);

    const prepareUrl = async () => {
      try {
        const url = previewAttachment.url;
        const filename = previewAttachment.name || '';
        const isPdf = previewAttachment.type === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');
        const isImage = previewAttachment.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(filename);

        // 1. Anexo em formato Data URL (base64)
        if (url.startsWith('data:')) {
          const parts = url.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          let mime = mimeMatch ? mimeMatch[1] : (isPdf ? 'application/pdf' : isImage ? 'image/png' : 'application/octet-stream');
          if (isPdf && mime !== 'application/pdf') mime = 'application/pdf';

          const byteCharacters = atob(parts[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mime });
          const blobUrl = URL.createObjectURL(blob);
          if (active) {
            setPreviewBlobUrl(blobUrl);
            setPreviewLoading(false);
          }
          return;
        }

        // 2. Anexo do servidor via API ou link remoto - descarregar como Blob para renderizar no visualizador nativo sem bloqueios
        const fetchUrl = url.includes('/api/webmail/attachment')
          ? (url.includes('inline=') ? url : `${url}&inline=1`)
          : url;

        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error('Falha ao descarregar anexo');
        const resBlob = await res.blob();

        let mime = resBlob.type;
        if (isPdf && (!mime || mime === 'application/octet-stream')) {
          mime = 'application/pdf';
        } else if (isImage && (!mime || mime === 'application/octet-stream')) {
          const ext = filename.split('.').pop()?.toLowerCase();
          mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
        }

        const finalBlob = new Blob([resBlob], { type: mime });
        const finalBlobUrl = URL.createObjectURL(finalBlob);

        if (active) {
          setPreviewBlobUrl(finalBlobUrl);
          setPreviewLoading(false);
        }
      } catch (err) {
        if (active) {
          console.warn('[Preview] Usando URL direta de fallback:', err);
          setPreviewBlobUrl(previewAttachment.url);
          setPreviewLoading(false);
        }
      }
    };

    prepareUrl();

    return () => {
      active = false;
    };
  }, [previewAttachment]);

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
  const [aiReplyVariation, setAiReplyVariation] = useState(0);
  const [hasAiGeneratedReply, setHasAiGeneratedReply] = useState(false);
  const [isImprovingDraft, setIsImprovingDraft] = useState(false);
  const [translatedEmail, setTranslatedEmail] = useState<{
    msgId: string;
    lang: 'pt' | 'en';
    subject: string;
    body: string;
  } | null>(null);
  const [isTranslatingEmail, setIsTranslatingEmail] = useState<'pt' | 'en' | null>(null);
  const [isTranslatingDraft, setIsTranslatingDraft] = useState<'pt' | 'en' | null>(null);
  const [isTranslatingQuickReply, setIsTranslatingQuickReply] = useState<'pt' | 'en' | null>(null);
  const [trustedSenders, setTrustedSenders] = useState<Set<string>>(new Set());

  // 23. Voice to Email States (Fala -> E-mail Profissional com IA)
  const [showVoiceToEmailPanel, setShowVoiceToEmailPanel] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceTargetMode, setVoiceTargetMode] = useState<'compose' | 'quick_reply'>('compose');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceInterimTranscript, setVoiceInterimTranscript] = useState('');
  const [voiceTone, setVoiceTone] = useState<'professional' | 'friendly' | 'formal'>('professional');
  const [voiceLang, setVoiceLang] = useState<'pt-PT' | 'en-US'>('pt-PT');
  const [isConvertingVoiceToEmail, setIsConvertingVoiceToEmail] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const speechRecognitionRef = useRef<any>(null);

  // 24. Text-to-Speech (Ouvir E-mail em Áudio — Recebidos, Rascunhos e Respostas)
  const [isSpeakingEmail, setIsSpeakingEmail] = useState(false);
  const [isPausedSpeech, setIsPausedSpeech] = useState(false);
  const [speakingSource, setSpeakingSource] = useState<'email' | 'compose' | 'quick_reply' | null>(null);
  const [speechSpeed, setSpeechSpeed] = useState<1 | 1.25 | 1.5>(1);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedAccountEmail) {
      try {
        const savedAv = localStorage.getItem(`wehosthere_avatar_${selectedAccountEmail.trim().toLowerCase()}`) || '';
        setUserAvatarUrl(savedAv);
      } catch {}

      // Obter contagem de contas externas conectadas ao titular
      fetch(`/api/webmail/external-accounts?ownerEmail=${encodeURIComponent(selectedAccountEmail)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.accounts)) {
            setExternalAccountsCount(data.accounts.length);
          }
        })
        .catch(() => {});
    }
  }, [selectedAccountEmail]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('wehosthere_webmail_trusted_senders');
        if (stored) {
          setTrustedSenders(new Set(JSON.parse(stored)));
        }
      } catch {}
    }
  }, []);

  const handleTrustSender = (senderEmail: string) => {
    const clean = (senderEmail || '').trim().toLowerCase();
    if (!clean) return;
    setTrustedSenders((prev) => {
      const next = new Set(prev);
      next.add(clean);
      try {
        localStorage.setItem('wehosthere_webmail_trusted_senders', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

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
    signatureImage: '',
    signatureType: 'image' as 'image' | 'text',
    autoInsert: true,
    isEnabled: true
  });
  const [signatureActiveTab, setSignatureActiveTab] = useState<'image' | 'text'>('image');
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
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [showCompose]);

  // Auto-focus editor at top when compose modal opens
  useEffect(() => {
    if (!showCompose) return;
    const timer = setTimeout(() => {
      if (typeof document !== 'undefined') {
        const ql = document.querySelector('.webmail-quill-editor .ql-editor') as HTMLElement;
        if (ql) {
          ql.focus();
          try {
            const sel = window.getSelection();
            if (sel && ql.firstChild) {
              const range = document.createRange();
              range.setStart(ql.firstChild, 0);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          } catch {}
        }
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [showCompose]);

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

  // Limpar eventuais rascunhos antigos com base64 pesado no localStorage ao iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const rawDrafts = localStorage.getItem('wehosthere_webmail_drafts');
        if (rawDrafts && rawDrafts.length > 500000) {
          const parsed = JSON.parse(rawDrafts);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.slice(0, 15).map((d: any) => ({
              ...d,
              attachments: Array.isArray(d.attachments)
                ? d.attachments.map((a: any) => ({ name: a.name, size: a.size, type: a.type, url: '' }))
                : undefined,
            }));
            localStorage.setItem('wehosthere_webmail_drafts', JSON.stringify(cleaned));
          }
        }
      } catch {
        try {
          localStorage.removeItem('wehosthere_webmail_drafts');
        } catch {}
      }
    }
  }, []);

  const readFileAsDataUrl = (file: File): Promise<{ dataUrl: string; size: number; type: string }> => {
    return new Promise((resolve, reject) => {
      // Se for uma imagem grande (> 500 KB), comprimir de forma inteligente via canvas para evitar erro 413 no envio
      if (file.type.startsWith('image/') && file.type !== 'image/gif' && file.size > 500 * 1024) {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          try {
            const maxDim = 1800;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
              const approxSize = Math.round(((compressedDataUrl.split(',')[1] || '').length * 3) / 4);
              if (approxSize < file.size) {
                resolve({ dataUrl: compressedDataUrl, size: approxSize, type: 'image/jpeg' });
                return;
              }
            }
          } catch {}
          // Fallback para leitura direta
          const reader = new FileReader();
          reader.onload = () => resolve({ dataUrl: String(reader.result || ''), size: file.size, type: file.type });
          reader.onerror = () => reject(new Error('Falha ao ler ficheiro'));
          reader.readAsDataURL(file);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          const reader = new FileReader();
          reader.onload = () => resolve({ dataUrl: String(reader.result || ''), size: file.size, type: file.type });
          reader.onerror = () => reject(new Error('Falha ao ler ficheiro'));
          reader.readAsDataURL(file);
        };
        img.src = objectUrl;
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: String(reader.result || ''), size: file.size, type: file.type || 'application/octet-stream' });
      reader.onerror = () => reject(new Error('Falha ao ler ficheiro'));
      reader.readAsDataURL(file);
    });
  };

  const uploadFileToCloudinaryDirect = async (file: File): Promise<{ url: string; size: number; type: string } | null> => {
    try {
      const sigRes = await fetch(apiEndpoint('/api/upload'), { method: 'GET' });
      if (!sigRes.ok) return null;
      const sigData = await sigRes.json();
      if (!sigData.success || !sigData.cloudName || !sigData.signature) return null;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', sigData.timestamp);
      formData.append('signature', sigData.signature);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) return null;
      const uploadData = await uploadRes.json();
      const cloudUrl = uploadData.secure_url || uploadData.url;
      if (!cloudUrl) return null;

      return {
        url: cloudUrl,
        size: uploadData.bytes || file.size,
        type: file.type || 'application/octet-stream',
      };
    } catch (err) {
      console.warn('[Webmail] Cloudinary direct upload fallback:', err);
      return null;
    }
  };

  const handleComposeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setAttachmentError('');

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip'
    ];

    setUploadingAttachment(true);
    try {
      const filesArray = Array.from(fileList);
      if (composeAttachments.length + filesArray.length > ATTACHMENT_MAX_COUNT) {
        setAttachmentError(`Máximo de ${ATTACHMENT_MAX_COUNT} anexos permitidos por e-mail.`);
        return;
      }

      let runningTotalSize = composeAttachments.reduce((sum, att) => sum + (att.size || 0), 0);
      const newAttachments: WebmailAttachment[] = [];

      for (const file of filesArray) {
        if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
          setAttachmentError(`Tipo de ficheiro não permitido (${file.name}). Formatos aceites: PDF, Imagens, Word, Excel, Texto, ZIP.`);
          return;
        }

        if (file.size > ATTACHMENT_MAX_SIZE) {
          setAttachmentError(`O ficheiro "${file.name}" é muito grande! O tamanho máximo por ficheiro é ${ATTACHMENT_MAX_SIZE / (1024 * 1024)}MB.`);
          return;
        }

        if (runningTotalSize + file.size > ATTACHMENT_TOTAL_MAX_SIZE) {
          setAttachmentError(
            `O tamanho total dos anexos excede o limite de ${ATTACHMENT_TOTAL_MAX_SIZE / (1024 * 1024)}MB por e-mail.`
          );
          return;
        }

        // 1. Tentar upload direto para o Cloudinary CDN (suporta até 25MB no total sem erro 413 na Vercel)
        const cloudResult = await uploadFileToCloudinaryDirect(file);
        if (cloudResult) {
          runningTotalSize += cloudResult.size;
          newAttachments.push({
            url: cloudResult.url,
            name: file.name,
            size: cloudResult.size,
            type: cloudResult.type,
          });
        } else {
          // 2. Fallback local com compressão inteligente de imagens
          const processed = await readFileAsDataUrl(file);
          runningTotalSize += processed.size;
          newAttachments.push({
            url: processed.dataUrl,
            name: file.name,
            size: processed.size,
            type: processed.type,
          });
        }
      }

      if (newAttachments.length > 0) {
        soundEffects.playAttachSound();
        setComposeAttachments(prev => [...prev, ...newAttachments]);
      }
    } catch (err) {
      console.error('Erro no upload de anexo do webmail:', err);
      setAttachmentError('Erro ao anexar o ficheiro. Tente novamente.');
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
    setEditingScheduledId(null);
    setShowSchedulePicker(false);
    setComposeScheduledFor('');
    setComposeTo('');
    setComposeCc('');
    setComposeBcc('');
    setComposeSubject('');
    setComposeBody('');
    setComposeAttachments([]);
  };

  const getSignatureHtml = useCallback(() => {
    if (!signatureForm.isEnabled) return '';
    if (signatureForm.signatureType === 'image' && signatureForm.signatureImage) {
      return `<p><br></p><p><br></p><p><img src="${signatureForm.signatureImage}" alt="Assinatura" style="max-width: 520px; width: auto; height: auto; display: block; border: 0; border-radius: 4px; margin-top: 16px;" /></p>`;
    }
    if (signatureForm.signatureImage && !signatureForm.fullName) {
      return `<p><br></p><p><br></p><p><img src="${signatureForm.signatureImage}" alt="Assinatura" style="max-width: 520px; width: auto; height: auto; display: block; border: 0; border-radius: 4px; margin-top: 16px;" /></p>`;
    }
    if (signatureForm.fullName || signatureForm.companyName) {
      return `<p><br></p><div style="font-family: Arial, sans-serif; font-size: 13px; color: #222; border-left: 3px solid #7c3aed; padding-left: 10px; margin-top: 15px;">
        <strong style="color: #111; font-size: 14px;">${signatureForm.fullName || ''}</strong><br/>
        <span style="color: #555;">${signatureForm.jobTitle ? signatureForm.jobTitle + ' • ' : ''}${signatureForm.companyName || ''}</span><br/>
        ${signatureForm.phone ? `<span style="color: #666; font-size: 12px;">📞 ${signatureForm.phone}</span><br/>` : ''}
        ${signatureForm.website ? `<a href="${signatureForm.website.startsWith('http') ? signatureForm.website : 'https://' + signatureForm.website}" target="_blank" style="color: #7c3aed; font-size: 12px; text-decoration: none;">🌐 ${signatureForm.website}</a><br/>` : ''}
        ${signatureForm.signatureImage ? `<br/><img src="${signatureForm.signatureImage}" alt="Assinatura" style="max-width: 450px; width: 100%; height: auto; margin-top: 8px; display: block;" />` : ''}
      </div>`;
    }
    return '';
  }, [signatureForm]);

  const handleInsertSignature = () => {
    const sig = getSignatureHtml();
    if (!sig) {
      setShowSignatureModal(true);
      return;
    }
    setComposeBody(prev => (prev ? prev + sig : sig));
  };

  const handleReplyMessage = () => {
    if (!selectedMessage) return;
    setComposeTo(selectedMessage.fromEmail);
    setComposeSubject(`Re: ${selectedMessage.subject}`);
    const sig = getSignatureHtml();
    const sigBlock = sig ? `${sig}<p><br></p>` : '';
    setComposeBody(`<p><br></p><p><br></p>${sigBlock}<hr style="border:0;border-top:1px solid #e5e7eb;margin:15px 0;"/><p><strong>De:</strong> ${selectedMessage.fromName} &lt;${selectedMessage.fromEmail}&gt;<br/><strong>Data:</strong> ${new Date(selectedMessage.date).toLocaleString()}<br/><strong>Assunto:</strong> ${selectedMessage.subject}</p><blockquote>${selectedMessage.body}</blockquote>`);
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
    const sig = getSignatureHtml();
    const sigBlock = sig ? `${sig}<p><br></p>` : '';
    setComposeBody(`<p><br></p><p><br></p>${sigBlock}<hr style="border:0;border-top:1px solid #e5e7eb;margin:15px 0;"/><p><strong>De:</strong> ${selectedMessage.fromName} &lt;${selectedMessage.fromEmail}&gt;<br/><strong>Para:</strong> ${selectedMessage.toEmail}<br/><strong>Data:</strong> ${new Date(selectedMessage.date).toLocaleString()}<br/><strong>Assunto:</strong> ${selectedMessage.subject}</p><blockquote>${selectedMessage.body}</blockquote>`);
    setComposeBcc('');
    setComposeAttachments([]);
    setShowCompose(true);
  };

  const handleForwardMessage = () => {
    if (!selectedMessage) return;
    setComposeTo('');
    setComposeSubject(`Fwd: ${selectedMessage.subject}`);
    const sig = getSignatureHtml();
    const sigBlock = sig ? `${sig}<p><br></p>` : '';
    setComposeBody(`<p><br></p><p><br></p>${sigBlock}<hr style="border:0;border-top:1px solid #e5e7eb;margin:15px 0;"/><p><strong>--- Mensagem Encaminhada ---</strong><br/><strong>De:</strong> ${selectedMessage.fromName} &lt;${selectedMessage.fromEmail}&gt;<br/><strong>Para:</strong> ${selectedMessage.toEmail}<br/><strong>Data:</strong> ${new Date(selectedMessage.date).toLocaleString()}<br/><strong>Assunto:</strong> ${selectedMessage.subject}</p><blockquote>${selectedMessage.body}</blockquote>`);
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

  const formatTemplateBodyToHtml = (rawBody: string): string => {
    if (!rawBody) return '';
    // Se já for um template HTML completo (ex: tabelas), apenas remover eventuais ** soltos fora de tags
    if (/<(table|div|p|ul|ol|h[1-6])\b/i.test(rawBody)) {
      return rawBody.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    }
    return rawBody
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .split(/\n\n+/)
      .map(paragraph => `<p>${paragraph.trim().replace(/\n/g, '<br/>')}</p>`)
      .join('');
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setComposeSubject(templateLanguage === 'pt' ? template.subject : template.subjectEN);
    const rawBody = templateLanguage === 'pt' ? template.body : template.bodyEN;
    const formattedHtml = formatTemplateBodyToHtml(rawBody);
    const sig = getSignatureHtml();
    if (sig) {
      setComposeBody(`${formattedHtml}<p><br></p>${sig}`);
    } else {
      setComposeBody(formattedHtml);
    }
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

  // Function to detect unfilled placeholders (ignoring CSS/style blocks)
  const detectUnfilledPlaceholders = (text: string): string[] => {
    if (!text) return [];
    const cleaned = text
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ');
    const placeholderRegex = /\{([a-zA-Z0-9_À-ÿ\s-]{1,40})\}/g;
    const matches = cleaned.match(placeholderRegex);
    return matches || [];
  };

  // Open Change Password Modal safely from anywhere
  const handleOpenChangePassword = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentActiveEmail = (selectedAccountEmail || webmailLoginEmail || accounts[0]?.email || '').trim();
    if (currentActiveEmail && !selectedAccountEmail) {
      setSelectedAccountEmail(currentActiveEmail);
    }
    setShowWebmailLogin(false);
    setShowMobileMenu(false);
    setPasswordError('');
    setPasswordSuccess('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowChangePasswordModal(true);
  };

  // Function to handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const targetEmail = (selectedAccountEmail || webmailLoginEmail || accounts[0]?.email || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setPasswordError('Informe um endereço de e-mail corporativo válido para alterar a senha.');
      return;
    }

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
              body: JSON.stringify({ email: targetEmail, password: currentPassword })
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
      const [localPart, domain] = targetEmail.split('@');
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
        localStorage.setItem(`webmail_auth_${targetEmail}`, newPassword);
      } catch (e) {}

      // Atualizar também na conta local do dataManager
      const existingAcc = accounts.find(a => a.email.toLowerCase() === targetEmail.toLowerCase());
      if (existingAcc) {
        dataManager.updateEmail(existingAcc.id, { password: newPassword } as any);
      }

      // Se utilizador do portal for igual a este email, atualizar também
      const currentUser = auth.getCurrentUser();
      if (currentUser && currentUser.email.toLowerCase() === targetEmail.toLowerCase()) {
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
    setUser(currentUser);

    // Restaurar sessão ativa de Webmail na aba atual (útil tanto para colaboradores públicos quanto clientes)
    let sessionActiveEmail = '';
    try {
      sessionActiveEmail = sessionStorage.getItem('wm_active_email') || localStorage.getItem('wm_active_email') || '';
      const targetEmailToRestore = initialEmailParam || sessionActiveEmail;
      if (targetEmailToRestore) {
        const savedPwd =
          sessionStorage.getItem(`wm_pwd_${targetEmailToRestore.toLowerCase()}`) ||
          localStorage.getItem(`wm_pwd_${targetEmailToRestore.toLowerCase()}`) ||
          localStorage.getItem(`webmail_auth_${targetEmailToRestore}`);
        if (savedPwd) {
          setSelectedAccountEmail(prev => prev || targetEmailToRestore);
          setWebmailLoginEmail(prev => prev || targetEmailToRestore);
          if (!mailboxPassword) {
            setMailboxPassword(savedPwd);
          }
        } else if (initialEmailParam) {
          setSelectedAccountEmail(initialEmailParam);
          setWebmailLoginEmail(initialEmailParam);
        }
      }
    } catch {}

    // Se for um colaborador externo sem conta no portal WEHOSTHERE, o acesso a /webmail é 100% público!
    if (!currentUser) {
      if (initialEmailParam) {
        setSelectedAccountEmail(initialEmailParam);
        setWebmailLoginEmail(initialEmailParam);
      }
      return;
    }

    const userEmailFilter = currentUser.email;

    // Clean up stale shared localStorage data and migrate to per-user key
    dataManager.initUserEmails(userEmailFilter);

    const refreshAccounts = (emailList: EmailAccount[]) => {
      setAccounts(emailList);
      if (initialEmailParam) {
        setSelectedAccountEmail(initialEmailParam);
        setWebmailLoginEmail(initialEmailParam);
      }
    };

    // Load strictly from user-specific key
    const localEmails = dataManager.getEmails(userEmailFilter);
    refreshAccounts(localEmails);

    // Sync inicial com servidor (filtrado por utilizador)
    dataManager.fetchEmailsAsync(userEmailFilter).then(emails => {
      refreshAccounts(emails);
    });

    // Polling inteligente para sincronizar status (pending → active) pausado em aba inativa
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      dataManager.fetchEmailsAsync(userEmailFilter).then(emails => {
        setAccounts(emails);
      });
    }, 45000);

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
    const sig = getSignatureHtml();
    if (sig && signatureForm.autoInsert && (!composeBody || composeBody === '<p><br></p>' || composeBody === '')) {
      setComposeBody('<p><br></p><p><br></p><p><br></p>' + sig);
    }
    setShowCompose(true);
  };

  // Dynamic folder counters across folder switches
  const [folderStats, setFolderStats] = useState<{
    inboxUnread: number;
    notificationsUnread: number;
    starred: number;
    drafts: number;
    scheduled: number;
    sent: number;
    trash: number;
  }>({
    inboxUnread: 0,
    notificationsUnread: 0,
    starred: 0,
    drafts: 0,
    scheduled: 0,
    sent: 0,
    trash: 0,
  });
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(null);

  // Cache em Memória e Sessão para troca instantânea de pastas sem recarregamento
  const folderCacheRef = useRef<Record<string, WebmailMessage[]>>({});

  const getFolderCacheKey = (email: string, folder: string) => `${email.toLowerCase()}:${folder}`;

  const getCachedMessages = (email: string, folder: string): WebmailMessage[] | null => {
    const key = getFolderCacheKey(email, folder);
    if (folderCacheRef.current[key] && folderCacheRef.current[key].length > 0) {
      return folderCacheRef.current[key];
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(`wehost_cache_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            folderCacheRef.current[key] = parsed;
            return parsed;
          }
        }
      } catch {}
    }
    return null;
  };

  const setCachedMessages = (email: string, folder: string, msgs: WebmailMessage[]) => {
    const key = getFolderCacheKey(email, folder);
    folderCacheRef.current[key] = msgs;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`wehost_cache_${key}`, JSON.stringify(msgs.slice(0, 100)));
      } catch {}
    }
  };

  // Carregamento com Cache Instantâneo (Stale-While-Revalidate)
  useEffect(() => {
    setSelectedIds(new Set());
    if (selectedAccountEmail && mailboxPassword) {
      const folder = (currentFolder === 'starred' || currentFolder === 'notifications') ? 'inbox' : currentFolder as 'inbox' | 'sent' | 'drafts' | 'trash' | 'scheduled';
      
      // 1. EXIBIÇÃO INSTANTÂNEA: Se temos mensagens em cache, exibe imediatamente (0ms)
      const cached = getCachedMessages(selectedAccountEmail, currentFolder);
      if (cached && cached.length > 0) {
        setMessages(cached);
        setSelectedMessage(prev => {
          if (prev && cached.some(m => m.id === prev.id)) return prev;
          return cached[0] || null;
        });
        // Não ativa o skeleton pesado porque já temos mensagens na tela
        setIsLoadingMessages(false);
      } else {
        // Primeira abertura sem cache: ativa skeleton
        setIsLoadingMessages(true);
        setSelectedMessage(null);
      }

      // 2. REVALIDAÇÃO SILENCIOSA: Sincroniza em segundo plano sem travar a navegação
      (async () => {
        try {
          const msgs = await webmailManager.getMessages(selectedAccountEmail, mailboxPassword, folder);
          const filtered = currentFolder === 'starred' ? msgs.filter(m => m.starred) : currentFolder === 'notifications' ? msgs.filter(m => isNotificationEmail(m)) : currentFolder === 'inbox' ? msgs.filter(m => !isNotificationEmail(m)) : msgs;
          
          // Gravar no cache rápido
          setCachedMessages(selectedAccountEmail, currentFolder, filtered);

          setMessages(filtered);
          setSelectedMessage(prev => {
            if (prev && filtered.some(m => m.id === prev.id)) {
              return filtered.find(m => m.id === prev.id) || prev;
            }
            return filtered.length > 0 ? filtered[0] : null;
          });
          setLastSyncedTime(new Date());

          // Atualizar contadores
          if (folder === 'inbox') {
            const unread = msgs.filter(m => !m.isRead && !isNotificationEmail(m)).length;
            const notificationsUnread = msgs.filter(m => !m.isRead && isNotificationEmail(m)).length;
            const starred = msgs.filter(m => m.starred).length;
            setFolderStats(prev => ({ ...prev, inboxUnread: unread, notificationsUnread, starred }));
          } else if (folder === 'sent') {
            setFolderStats(prev => ({ ...prev, sent: msgs.length }));
          } else if (folder === 'trash') {
            setFolderStats(prev => ({ ...prev, trash: msgs.length }));
          } else if (folder === 'drafts') {
            setFolderStats(prev => ({ ...prev, drafts: msgs.length }));
          } else if (folder === 'scheduled') {
            setFolderStats(prev => ({ ...prev, scheduled: msgs.length }));
          }
        } catch (error) {
          console.error('[Webmail] Error loading messages:', error);
          if (!cached || cached.length === 0) {
            setMessages([]);
            setSelectedMessage(null);
          }
        } finally {
          setIsLoadingMessages(false);
        }
      })();
    }
  }, [selectedAccountEmail, mailboxPassword, currentFolder]);

  // Sync initial drafts and scheduled counts from local storage
  useEffect(() => {
    if (selectedAccountEmail) {
      webmailManager.getDrafts(selectedAccountEmail).then(localDrafts => {
        setFolderStats(prev => ({ ...prev, drafts: localDrafts.length }));
      });
      webmailManager.getScheduledMessages(selectedAccountEmail).then(localScheduled => {
        setFolderStats(prev => ({ ...prev, scheduled: localScheduled.length }));
      });
    }
  }, [selectedAccountEmail]);

  // Sincronização Automática em Segundo Plano (Auto-Sync a cada 60 segundos com pausa em aba inativa)
  useEffect(() => {
    if (!selectedAccountEmail || !mailboxPassword) return;

    const autoSyncTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const folder = (currentFolder === 'starred' || currentFolder === 'notifications') ? 'inbox' : currentFolder as 'inbox' | 'sent' | 'drafts' | 'trash' | 'scheduled';
      webmailManager.getMessages(selectedAccountEmail, mailboxPassword, folder).then(msgs => {
        const filtered = currentFolder === 'starred' ? msgs.filter(m => m.starred) : currentFolder === 'notifications' ? msgs.filter(m => isNotificationEmail(m)) : currentFolder === 'inbox' ? msgs.filter(m => !isNotificationEmail(m)) : msgs;
        setMessages(prev => {
          const hasNew = prev.length !== filtered.length || (prev[0] && filtered[0] && prev[0].id !== filtered[0].id);
          if (hasNew) {
            setLastSyncedTime(new Date());
            if (folder === 'inbox') {
              const unread = filtered.filter(m => !m.isRead).length;
              setFolderStats(st => ({ ...st, inboxUnread: unread }));
            }
            return filtered;
          }
          return prev;
        });
      }).catch(err => {
        console.warn('[Webmail Auto-Sync] Sync check:', err);
      });
    }, 60000);

    return () => clearInterval(autoSyncTimer);
  }, [selectedAccountEmail, mailboxPassword, currentFolder]);

  const refreshMessages = async () => {
    setSelectedIds(new Set());
    if (selectedAccountEmail && mailboxPassword) {
      setIsRefreshingWebmail(true);
      try {
        const folder = (currentFolder === 'starred' || currentFolder === 'notifications') ? 'inbox' : currentFolder as 'inbox' | 'sent' | 'drafts' | 'trash' | 'scheduled';
        const msgs = await webmailManager.getMessages(selectedAccountEmail, mailboxPassword, folder);
        const filtered = currentFolder === 'starred' ? msgs.filter(m => m.starred) : currentFolder === 'notifications' ? msgs.filter(m => isNotificationEmail(m)) : currentFolder === 'inbox' ? msgs.filter(m => !isNotificationEmail(m)) : msgs;
        setCachedMessages(selectedAccountEmail, currentFolder, filtered);
        setMessages(filtered);
        setLastSyncedTime(new Date());
        if (folder === 'inbox') {
          const unread = msgs.filter(m => !m.isRead && !isNotificationEmail(m)).length;
          const notificationsUnread = msgs.filter(m => !m.isRead && isNotificationEmail(m)).length;
          const starred = msgs.filter(m => m.starred).length;
          setFolderStats(prev => ({ ...prev, inboxUnread: unread, notificationsUnread, starred }));
        } else if (folder === 'scheduled') {
          setFolderStats(prev => ({ ...prev, scheduled: msgs.length }));
        }
        const schedAll = await webmailManager.getScheduledMessages(selectedAccountEmail);
        setFolderStats(prev => ({ ...prev, scheduled: schedAll.length }));
      } catch (error) {
        console.error('[Webmail] Error refreshing messages:', error);
      }
      setIsRefreshingWebmail(false);
    }
  };

  // Verifica se um e-mail da caixa de entrada está em atraso / sem resposta enviada
  const isMessageOverdue = (msg: WebmailMessage): boolean => {
    if (!msg || msg.folder !== 'inbox') return false;
    const fromLower = (msg.fromEmail || '').toLowerCase();
    // Ignorar notificações automáticas do sistema
    if (
      fromLower.startsWith('noreply@') ||
      fromLower.startsWith('no-reply@') ||
      fromLower.startsWith('mailer-daemon@') ||
      fromLower === (selectedAccountEmail || '').toLowerCase()
    ) {
      return false;
    }

    const msgTime = new Date(msg.date).getTime();
    if (isNaN(msgTime)) return false;
    const ageHours = (Date.now() - msgTime) / (1000 * 60 * 60);

    // Verificar no cache local de enviados se já houve resposta após este e-mail
    if (typeof window !== 'undefined' && selectedAccountEmail) {
      try {
        const sentCacheRaw = localStorage.getItem(`wehosthere_webmail_sent_cache_${selectedAccountEmail.toLowerCase()}`);
        if (sentCacheRaw) {
          const sentList: WebmailMessage[] = JSON.parse(sentCacheRaw);
          const cleanSubj = (msg.subject || '').replace(/^(re|fwd|enc):\s*/gi, '').trim().toLowerCase();
          const hasReplied = sentList.some((s) => {
            const sentTime = new Date(s.date).getTime();
            const toMatch = (s.toEmail || '').toLowerCase().includes(fromLower);
            const subjMatch = cleanSubj && (s.subject || '').toLowerCase().includes(cleanSubj);
            return sentTime >= msgTime && (toMatch || subjMatch);
          });
          if (hasReplied) return false;
        }
      } catch {}
    }

    // Não lido há mais de 2 horas OU recebido há mais de 18 horas sem resposta
    return (!msg.isRead && ageHours >= 2) || ageHours >= 18;
  };

  const getDynamicUserGreeting = (): {
    greeting: string;
    period: 'morning' | 'afternoon' | 'evening';
    userName: string;
  } => {
    const hour = new Date().getHours();
    let greeting = 'Bom dia';
    let period: 'morning' | 'afternoon' | 'evening' = 'morning';
    if (hour >= 12 && hour < 18) {
      greeting = 'Boa tarde';
      period = 'afternoon';
    } else if (hour >= 18 || hour < 5) {
      greeting = 'Boa noite';
      period = 'evening';
    }

    let rawName = (signatureForm.fullName || '').trim();
    if (!rawName && user?.name) {
      rawName = user.name.trim();
    }
    if (!rawName && selectedAccountEmail) {
      const localPart = selectedAccountEmail.split('@')[0] || '';
      const genericPrefixes = new Set(['info', 'contacto', 'contato', 'suporte', 'comercial', 'geral', 'admin', 'vendas', 'financeiro', 'rh']);
      if (genericPrefixes.has(localPart.toLowerCase())) {
        const domainName = (selectedAccountEmail.split('@')[1] || '').split('.')[0] || '';
        rawName = domainName ? `Equipa ${domainName.toUpperCase()}` : localPart;
      } else {
        rawName = localPart
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }

    return {
      greeting,
      period,
      userName: rawName || 'Utilizador',
    };
  };

  // Reiniciar estado de carregamento inicial quando mudar de conta autenticada
  useEffect(() => {
    isInitialLoadRef.current = true;
    knownInboxIdsRef.current = new Set();
  }, [selectedAccountEmail]);

  // Detect new incoming emails or initial login briefing in inbox and show floating card
  useEffect(() => {
    if (currentFolder === 'inbox' && mailboxPassword && !isLoadingMessages) {
      if (isInitialLoadRef.current) {
        knownInboxIdsRef.current = new Set(messages.map(m => m.id));
        isInitialLoadRef.current = false;

        const unreadMsgs = messages.filter(m => !m.isRead);
        const overdueMsgs = messages.filter(m => isMessageOverdue(m));
        const urgentMsgs = messages.filter(m => !m.isRead && m.priority === 'high');
        const topMsg = unreadMsgs[0] || overdueMsgs[0] || messages[0];

        if (unreadMsgs.length > 0) {
          soundEffects.playNewEmailSound();
        }

        setFloatingBriefing({
          isOpen: true,
          isClosing: false,
          type: 'welcome',
          unreadCount: unreadMsgs.length,
          overdueCount: overdueMsgs.length,
          urgentCount: urgentMsgs.length,
          latestSender: topMsg?.fromName,
          latestSubject: topMsg?.subject,
          latestMsgId: topMsg?.id,
        });

        if (briefingTimeoutRef.current) clearTimeout(briefingTimeoutRef.current);
        briefingTimeoutRef.current = setTimeout(() => {
          dismissFloatingBriefing();
        }, 8500);
      } else if (!isInitialLoadRef.current && messages.length > 0) {
        const newIncoming = messages.filter(m => !knownInboxIdsRef.current.has(m.id) && !m.isRead);
        if (newIncoming.length > 0) {
          soundEffects.playNewEmailSound();
          const overdueMsgs = messages.filter(m => isMessageOverdue(m));
          const urgentMsgs = messages.filter(m => !m.isRead && m.priority === 'high');
          const newest = newIncoming[0];

          setFloatingBriefing({
            isOpen: true,
            isClosing: false,
            type: 'new_incoming',
            unreadCount: newIncoming.length,
            overdueCount: overdueMsgs.length,
            urgentCount: urgentMsgs.length,
            latestSender: newest?.fromName,
            latestSubject: newest?.subject,
            latestMsgId: newest?.id,
          });

          if (briefingTimeoutRef.current) clearTimeout(briefingTimeoutRef.current);
          briefingTimeoutRef.current = setTimeout(() => {
            dismissFloatingBriefing();
          }, 7500);
        }
        knownInboxIdsRef.current = new Set(messages.map(m => m.id));
      }
    }
  }, [messages, currentFolder, mailboxPassword, isLoadingMessages]);

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

  // Solicitar confirmação ao utilizador antes de eliminar qualquer mensagem
  const handleDeleteMessage = (msgId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const msg = messages.find(m => m.id === msgId) || (selectedMessage?.id === msgId ? selectedMessage : null);
    if (!msg) return;

    // Sempre abrir modal de confirmação para prevenir eliminações acidentais ("do nada")
    setDeleteConfirmModal({
      isOpen: true,
      msgId,
      subject: msg.subject || '(Sem assunto)',
      isPermanent: msg.folder === 'trash'
    });
  };

  // Executar eliminação após confirmação explícita do utilizador no modal
  // Fluxo em 2 etapas:
  //   1. Se a mensagem NÃO está na Lixeira → move para a Lixeira (recuperável)
  //   2. Se a mensagem JÁ está na Lixeira → eliminação permanente (irrecuperável)
  const executeDeleteMessage = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId) || (selectedMessage?.id === msgId ? selectedMessage : null);
    if (!msg) {
      setDeleteConfirmModal(null);
      return;
    }
    const isAlreadyInTrash = msg.folder === 'trash';
    const imapFolder = msg.folder === 'sent' ? 'Sent' : msg.folder === 'trash' ? 'Trash' : msg.folder === 'drafts' ? 'Drafts' : 'INBOX';
    
    // Atualização otimista na interface
    setMessages(prev => prev.filter(m => m.id !== msgId));
    if (selectedMessage?.id === msgId) {
      setSelectedMessage(null);
    }
    setFolderStats(prev => ({
      ...prev,
      inboxUnread: msg.folder === 'inbox' && !msg.isRead ? Math.max(prev.inboxUnread - 1, 0) : prev.inboxUnread,
      trash: isAlreadyInTrash ? Math.max(prev.trash - 1, 0) : prev.trash + 1,
      sent: msg.folder === 'sent' ? Math.max(prev.sent - 1, 0) : prev.sent,
      drafts: msg.folder === 'drafts' ? Math.max(prev.drafts - 1, 0) : prev.drafts,
      starred: msg.starred ? Math.max(prev.starred - 1, 0) : prev.starred
    }));
    soundEffects.playDeleteEmailSound();

    try {
      if (isAlreadyInTrash) {
        // Etapa 2: Eliminação permanente — a mensagem já está na Lixeira
        await webmailManager.deletePermanently(msgId, selectedAccountEmail, mailboxPassword, msg.uid, imapFolder);
      } else {
        // Etapa 1: Mover para a Lixeira — a mensagem pode ser recuperada
        await webmailManager.moveFolder(msgId, 'trash', selectedAccountEmail, mailboxPassword, msg.uid, imapFolder);
      }
    } catch (err) {
      console.error('[Webmail] Error deleting/moving message:', err);
    } finally {
      setDeleteConfirmModal(null);
    }
  };

  const toggleSelectId = (id: string, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (visibleMsgs: WebmailMessage[]) => {
    if (visibleMsgs.length === 0) return;
    const allSelected = visibleMsgs.every(m => selectedIds.has(m.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleMsgs.map(m => m.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const isPermanent = currentFolder === 'trash';
    setDeleteConfirmModal({
      isOpen: true,
      msgId: ids[0],
      msgIds: ids,
      subject: `${ids.length} ${ids.length === 1 ? 'e-mail selecionado' : 'e-mails selecionados'}`,
      isPermanent,
    });
  };

  const executeBulkDelete = async (msgIds: string[]) => {
    if (msgIds.length === 0) {
      setDeleteConfirmModal(null);
      return;
    }
    setIsBulkDeleting(true);
    const idSet = new Set(msgIds);
    const targetMsgs = messages.filter(m => idSet.has(m.id));

    setMessages(prev => prev.filter(m => !idSet.has(m.id)));
    if (selectedMessage && idSet.has(selectedMessage.id)) {
      setSelectedMessage(null);
    }
    setSelectedIds(new Set());

    setFolderStats(prev => {
      let inboxDelta = 0;
      let notifDelta = 0;
      let trashDelta = 0;
      let sentDelta = 0;
      let draftsDelta = 0;
      let starredDelta = 0;
      for (const m of targetMsgs) {
        if (m.folder === 'inbox' && !m.isRead) {
          if (isNotificationEmail(m)) notifDelta += 1;
          else inboxDelta += 1;
        }
        if (m.folder === 'trash') trashDelta -= 1;
        else trashDelta += 1;
        if (m.folder === 'sent') sentDelta += 1;
        if (m.folder === 'drafts') draftsDelta += 1;
        if (m.starred) starredDelta += 1;
      }
      return {
        ...prev,
        inboxUnread: Math.max(prev.inboxUnread - inboxDelta, 0),
        notificationsUnread: Math.max(prev.notificationsUnread - notifDelta, 0),
        trash: Math.max(prev.trash + trashDelta, 0),
        sent: Math.max(prev.sent - sentDelta, 0),
        drafts: Math.max(prev.drafts - draftsDelta, 0),
        starred: Math.max(prev.starred - starredDelta, 0),
      };
    });
    soundEffects.playDeleteEmailSound();

    try {
      await Promise.allSettled(
        targetMsgs.map(msg => {
          const isAlreadyInTrash = msg.folder === 'trash';
          const imapFolder =
            msg.folder === 'sent'
              ? 'Sent'
              : msg.folder === 'trash'
              ? 'Trash'
              : msg.folder === 'drafts'
              ? 'Drafts'
              : 'INBOX';
          if (isAlreadyInTrash) {
            return webmailManager.deletePermanently(msg.id, selectedAccountEmail, mailboxPassword, msg.uid, imapFolder);
          }
          return webmailManager.moveFolder(msg.id, 'trash', selectedAccountEmail, mailboxPassword, msg.uid, imapFolder);
        })
      );
    } catch (err) {
      console.error('[Webmail] Error in bulk delete:', err);
    } finally {
      setIsBulkDeleting(false);
      setDeleteConfirmModal(null);
    }
  };

  const formatToLocalDatetimeInput = (dateObj: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(
      dateObj.getHours()
    )}:${pad(dateObj.getMinutes())}`;
  };

  const formatFullMessageDate = (dateVal: string | Date | undefined): string => {
    if (!dateVal) return '';
    try {
      let d = new Date(dateVal);
      if (isNaN(d.getTime())) {
        if (typeof dateVal === 'string' && /^\d{1,2}:\d{2}/.test(dateVal.trim())) {
          const today = new Date();
          const [hh, mm] = dateVal.trim().split(':');
          today.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
          d = today;
        } else {
          return String(dateVal);
        }
      }
      return d.toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return String(dateVal);
    }
  };

  const getQuickSchedulePresets = (): Array<{ label: string; sublabel: string; value: string }> => {
    const now = new Date();

    // 1. Daqui a 1 hora
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

    // 2. Mais tarde hoje (17:00) ou +3 horas se já passou das 16:00
    const laterToday = new Date(now);
    if (now.getHours() < 16) {
      laterToday.setHours(17, 0, 0, 0);
    } else {
      laterToday.setTime(now.getTime() + 3 * 60 * 60 * 1000);
    }

    // 3. Amanhã de manhã (08:30)
    const tomorrowMorning = new Date(now);
    tomorrowMorning.setDate(now.getDate() + 1);
    tomorrowMorning.setHours(8, 30, 0, 0);

    // 4. Amanhã à tarde (14:00)
    const tomorrowAfternoon = new Date(now);
    tomorrowAfternoon.setDate(now.getDate() + 1);
    tomorrowAfternoon.setHours(14, 0, 0, 0);

    // 5. Próxima Segunda-feira (08:30)
    const nextMonday = new Date(now);
    const daysUntilMonday = ((1 + 7 - now.getDay()) % 7) || 7;
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(8, 30, 0, 0);

    const fmtSub = (d: Date) =>
      d.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

    return [
      { label: 'Daqui a 1 hora', sublabel: fmtSub(inOneHour), value: formatToLocalDatetimeInput(inOneHour) },
      { label: 'Mais tarde hoje', sublabel: fmtSub(laterToday), value: formatToLocalDatetimeInput(laterToday) },
      { label: 'Amanhã de manhã', sublabel: fmtSub(tomorrowMorning), value: formatToLocalDatetimeInput(tomorrowMorning) },
      { label: 'Amanhã à tarde', sublabel: fmtSub(tomorrowAfternoon), value: formatToLocalDatetimeInput(tomorrowAfternoon) },
      { label: 'Próxima Segunda', sublabel: fmtSub(nextMonday), value: formatToLocalDatetimeInput(nextMonday) },
    ];
  };

  const handleScheduleEmail = async (customScheduledIso?: string) => {
    if (sendingMsg) return;
    setComposeError('');

    const recipientsTo = splitRecipients(composeTo);
    const plainBody = composeBody.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

    if (recipientsTo.length === 0) {
      setComposeError('Por favor, informe pelo menos um e-mail de destinatário (Para) antes de agendar.');
      return;
    }

    const invalidTo = findInvalidRecipients(composeTo);
    if (invalidTo.length > 0) {
      setComposeError(`E-mail inválido em "Para": ${invalidTo.join(', ')}`);
      return;
    }
    const invalidCc = findInvalidRecipients(composeCc);
    if (invalidCc.length > 0) {
      setComposeError(`E-mail inválido em "CC (Cópia)": ${invalidCc.join(', ')}`);
      return;
    }
    const invalidBcc = findInvalidRecipients(composeBcc);
    if (invalidBcc.length > 0) {
      setComposeError(`E-mail inválido em "BCC (Cópia Oculta)": ${invalidBcc.join(', ')}`);
      return;
    }

    if (!plainBody && composeAttachments.length === 0) {
      setComposeError('Por favor, escreva uma mensagem ou anexe um ficheiro antes de agendar.');
      return;
    }

    const rawTarget = customScheduledIso || composeScheduledFor;
    if (!rawTarget) {
      setShowSchedulePicker(true);
      setComposeError('Selecione a data e hora em que pretende enviar este e-mail.');
      return;
    }

    const scheduledDate = new Date(rawTarget);
    if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now() + 15000) {
      setComposeError('Escolha uma data e hora futura (pelo menos 1 minuto à frente do horário atual).');
      return;
    }

    try {
      setSendingMsg(true);
      let scheduledBody = prepareEmailBodyForSending(composeBody);
      const sig = getSignatureHtml();
      if (sig) {
        const hasSigImage = signatureForm.signatureImage && scheduledBody.includes(signatureForm.signatureImage);
        const hasSigName = signatureForm.fullName && scheduledBody.includes(signatureForm.fullName);
        if (!hasSigImage && !hasSigName) {
          scheduledBody = scheduledBody ? `${scheduledBody}<p><br></p>${sig}` : sig;
        }
      }

      await webmailManager.scheduleMessage(
        selectedAccountEmail,
        normalizeRecipients(composeTo),
        composeSubject.trim() || '(Sem assunto)',
        scheduledBody,
        scheduledDate.toISOString(),
        composeAttachments,
        composePriority,
        normalizeRecipients(composeCc),
        normalizeRecipients(composeBcc),
        editingScheduledId || undefined
      );

      if (editingDraftId) {
        await webmailManager.deletePermanently(editingDraftId, selectedAccountEmail, mailboxPassword);
        setEditingDraftId(null);
      }

      const updatedScheduled = await webmailManager.getScheduledMessages(selectedAccountEmail);
      setFolderStats((prev) => ({ ...prev, scheduled: updatedScheduled.length }));

      soundEffects.playSendEmailSound();
      setSendingMsg(false);
      const formattedWhen = scheduledDate.toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setSentSuccessMsg(`E-mail agendado com sucesso para ${formattedWhen}!`);

      setTimeout(() => {
        setShowCompose(false);
        setShowSchedulePicker(false);
        setComposeScheduledFor('');
        setEditingScheduledId(null);
        setSentSuccessMsg('');
        setComposeError('');
        setComposeTo('');
        setComposeCc('');
        setComposeBcc('');
        setComposeSubject('');
        setComposeBody('');
        setComposeAttachments([]);
        refreshMessages();
      }, 1600);
    } catch (err: any) {
      setSendingMsg(false);
      setComposeError(err?.message || 'Não foi possível agendar o e-mail.');
    }
  };

  const handleSendScheduledNow = async (msg: WebmailMessage) => {
    if (!selectedAccountEmail) return;
    const activePassword =
      mailboxPassword ||
      (typeof window !== 'undefined'
        ? sessionStorage.getItem(`wm_pwd_${selectedAccountEmail.toLowerCase()}`) ||
          localStorage.getItem(`wm_pwd_${selectedAccountEmail.toLowerCase()}`) ||
          localStorage.getItem(`webmail_auth_${selectedAccountEmail}`) ||
          ''
        : '');

    if (!activePassword) {
      setShowWebmailLogin(true);
      return;
    }

    try {
      setSendingMsg(true);
      await webmailManager.sendMessage(
        selectedAccountEmail,
        activePassword,
        msg.toEmail,
        msg.subject,
        msg.body,
        msg.attachments,
        msg.priority || 'normal',
        msg.ccEmail,
        msg.bccEmail
      );
      webmailManager.removeScheduledMessage(msg.id);
      soundEffects.playSendEmailSound();
      setSelectedMessage(null);
      await refreshMessages();
    } catch (err) {
      console.error('[Webmail] Erro ao enviar e-mail agendado imediatamente:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleEditScheduledMessage = (msg: WebmailMessage) => {
    setComposeTo(msg.toEmail || '');
    setComposeCc(msg.ccEmail || '');
    setComposeBcc(msg.bccEmail || '');
    setShowCcBcc(!!(msg.ccEmail || msg.bccEmail));
    setComposeSubject(msg.subject || '');
    setComposeBody(msg.body || '');
    setComposePriority(msg.priority || 'normal');
    setComposeAttachments(msg.attachments || []);
    setEditingScheduledId(msg.id);
    if (msg.scheduledFor) {
      const dt = new Date(msg.scheduledFor);
      if (!isNaN(dt.getTime())) {
        setComposeScheduledFor(formatToLocalDatetimeInput(dt));
      }
    }
    setShowSchedulePicker(true);
    setShowCompose(true);
  };

  const handleCancelScheduledMessage = async (msg: WebmailMessage) => {
    await webmailManager.saveDraft(
      selectedAccountEmail,
      msg.toEmail,
      msg.subject,
      msg.body,
      msg.attachments
    );
    webmailManager.removeScheduledMessage(msg.id);
    const updatedDrafts = await webmailManager.getDrafts(selectedAccountEmail);
    const updatedSched = await webmailManager.getScheduledMessages(selectedAccountEmail);
    setFolderStats((prev) => ({
      ...prev,
      drafts: updatedDrafts.length,
      scheduled: updatedSched.length,
    }));
    setSelectedMessage(null);
    await refreshMessages();
  };

  // Motor Automático de Disparo de E-mails Agendados (verifica a cada 15 segundos)
  useEffect(() => {
    if (!selectedAccountEmail || !mailboxPassword) return;

    const checkAndDispatchScheduled = async () => {
      try {
        const scheduledList = await webmailManager.getScheduledMessages(selectedAccountEmail);
        const nowMs = Date.now();
        const dueMessages = scheduledList.filter((m) => {
          const targetMs = new Date(m.scheduledFor || '').getTime();
          return !isNaN(targetMs) && targetMs <= nowMs && !scheduledDispatchingRef.current.has(m.id);
        });

        if (dueMessages.length === 0) return;

        for (const msg of dueMessages) {
          scheduledDispatchingRef.current.add(msg.id);
          try {
            await webmailManager.sendMessage(
              selectedAccountEmail,
              mailboxPassword,
              msg.toEmail,
              msg.subject,
              msg.body,
              msg.attachments,
              msg.priority || 'normal',
              msg.ccEmail,
              msg.bccEmail
            );
            webmailManager.removeScheduledMessage(msg.id);
            soundEffects.playSendEmailSound();
          } catch (err) {
            console.error('[Webmail] Falha ao disparar e-mail agendado:', err);
          } finally {
            scheduledDispatchingRef.current.delete(msg.id);
          }
        }

        const remaining = await webmailManager.getScheduledMessages(selectedAccountEmail);
        setFolderStats((prev) => ({
          ...prev,
          scheduled: remaining.length,
          sent: prev.sent + dueMessages.length,
        }));
        if (currentFolder === 'scheduled' || currentFolder === 'sent') {
          refreshMessages();
        }
      } catch {}
    };

    checkAndDispatchScheduled();
    const timer = setInterval(checkAndDispatchScheduled, 15000);
    return () => clearInterval(timer);
  }, [selectedAccountEmail, mailboxPassword, currentFolder]);

  const handleSendEmail = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (sendingMsg) return;
    setComposeError('');

    const recipientsTo = splitRecipients(composeTo);
    const plainBody = composeBody.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

    if (recipientsTo.length === 0) {
      setComposeError('Por favor, informe pelo menos um e-mail de destinatário (Para).');
      return;
    }

    const invalidTo = findInvalidRecipients(composeTo);
    if (invalidTo.length > 0) {
      setComposeError(`E-mail inválido em "Para": ${invalidTo.join(', ')}`);
      return;
    }
    const invalidCc = findInvalidRecipients(composeCc);
    if (invalidCc.length > 0) {
      setComposeError(`E-mail inválido em "CC (Cópia)": ${invalidCc.join(', ')}`);
      return;
    }
    const invalidBcc = findInvalidRecipients(composeBcc);
    if (invalidBcc.length > 0) {
      setComposeError(`E-mail inválido em "BCC (Cópia Oculta)": ${invalidBcc.join(', ')}`);
      return;
    }

    if (!plainBody && composeAttachments.length === 0) {
      setComposeError('Por favor, escreva uma mensagem ou anexe um ficheiro antes de enviar.');
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

    await proceedToSendEmail();
  };

  const proceedToSendEmail = async () => {
    setSendingMsg(true);
    setComposeError('');
    setShowPlaceholderWarning(false);

    const activePassword =
      mailboxPassword ||
      (typeof window !== 'undefined' && selectedAccountEmail
        ? sessionStorage.getItem(`wm_pwd_${selectedAccountEmail.toLowerCase()}`) ||
          localStorage.getItem(`wm_pwd_${selectedAccountEmail.toLowerCase()}`) ||
          localStorage.getItem(`webmail_auth_${selectedAccountEmail}`) ||
          ''
        : '');

    if (!activePassword) {
      setSendingMsg(false);
      setComposeError('Sessão expirada. Por favor, volte a autenticar a sua senha do Webmail.');
      setShowWebmailLogin(true);
      return;
    }

    try {
      // Garantir fontes e assinatura fixa do e-mail configurado
      let finalBody = prepareEmailBodyForSending(composeBody);
      const sig = getSignatureHtml();
      if (sig) {
        const hasSigImage = signatureForm.signatureImage && finalBody.includes(signatureForm.signatureImage);
        const hasSigName = signatureForm.fullName && finalBody.includes(signatureForm.fullName);
        if (!hasSigImage && !hasSigName) {
          finalBody = finalBody ? `${finalBody}<p><br></p>${sig}` : sig;
        }
      }

      // 1. Enviar via Migadu SMTP usando webmailManager com múltiplos destinatários normalizados
      await webmailManager.sendMessage(
        selectedAccountEmail,
        activePassword,
        normalizeRecipients(composeTo),
        composeSubject.trim() || '(Sem assunto)',
        finalBody,
        composeAttachments,
        composePriority,
        normalizeRecipients(composeCc),
        normalizeRecipients(composeBcc)
      );

      // 2. Remover rascunho se existir
      if (editingDraftId) {
        await webmailManager.deletePermanently(editingDraftId, selectedAccountEmail, activePassword);
        setEditingDraftId(null);
      }

      soundEffects.playSendEmailSound();
      setSendingMsg(false);
      setSentSuccessMsg('E-mail enviado com sucesso!');

      setTimeout(() => {
        setShowCompose(false);
        setSentSuccessMsg('');
        setComposeError('');
        setComposeTo('');
        setComposeCc('');
        setComposeBcc('');
        setComposeSubject('');
        setComposeBody('');
        setComposeAttachments([]);
        refreshMessages();
      }, 2200);
    } catch (err: any) {
      console.error('Erro ao enviar e-mail:', err);
      setSendingMsg(false);
      setComposeError(err?.message || 'Erro ao enviar e-mail. Verifique o endereço do destinatário e tente novamente.');
    }
  };

  const handleWebmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setWebmailLoginLoading(true);
    setWebmailLoginError('');

    const targetLoginEmail = (webmailLoginEmail || selectedAccountEmail).trim();

    try {
      const res = await fetch(apiEndpoint('/api/webmail/auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetLoginEmail,
          password: webmailLoginPassword
        })
      });

      const data = await res.json();

      if (data.success) {
        // Login bem-sucedido
        soundEffects.playLoginSuccessSound();
        setSelectedAccountEmail(targetLoginEmail);
        setMailboxPassword(webmailLoginPassword);
        try {
          sessionStorage.setItem('wm_active_email', targetLoginEmail);
          sessionStorage.setItem(`wm_pwd_${targetLoginEmail.toLowerCase()}`, webmailLoginPassword);
          localStorage.setItem('wm_active_email', targetLoginEmail);
          localStorage.setItem(`wm_pwd_${targetLoginEmail.toLowerCase()}`, webmailLoginPassword);
          localStorage.setItem(`webmail_auth_${targetLoginEmail}`, webmailLoginPassword);
        } catch {}
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
    try {
      sessionStorage.removeItem('wm_active_email');
      localStorage.removeItem('wm_active_email');
      if (selectedAccountEmail) {
        sessionStorage.removeItem(`wm_pwd_${selectedAccountEmail.toLowerCase()}`);
        localStorage.removeItem(`wm_pwd_${selectedAccountEmail.toLowerCase()}`);
        localStorage.removeItem(`webmail_auth_${selectedAccountEmail}`);
      }
    } catch {}
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
      // Enviar via Migadu SMTP com assinatura corporativa fixa
      const sig = getSignatureHtml();
      const replyBodyWithSig = sig 
        ? `<p>${replyText.replace(/\n/g, '<br/>')}</p><p><br></p>${sig}` 
        : `<p>${replyText.replace(/\n/g, '<br/>')}</p>`;

      await webmailManager.sendMessage(
        selectedAccountEmail,
        mailboxPassword,
        selectedMessage.fromEmail,
        `Re: ${selectedMessage.subject}`,
        replyBodyWithSig
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
      // 1. Tentar localStorage primeiro para disponibilidade instantânea e offline
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`wehost_signature_${selectedAccountEmail.toLowerCase()}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            setSignatureForm(prev => ({ ...prev, ...parsed }));
            if (parsed.signatureImage) {
              setSignatureActiveTab('image');
            }
          }
        } catch {}
      }

      // 2. Sincronizar com a API do servidor
      fetch(`/api/webmail/signature?email=${encodeURIComponent(selectedAccountEmail)}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.signature) {
            setUserSignature(data.signature);
            setSignatureForm(prev => {
              const updated = {
                ...prev,
                fullName: data.signature.fullName || prev.fullName || '',
                jobTitle: data.signature.jobTitle || prev.jobTitle || '',
                companyName: data.signature.companyName || prev.companyName || '',
                phone: data.signature.phone || prev.phone || '',
                website: data.signature.website || prev.website || '',
                logoUrl: data.signature.logoUrl || prev.logoUrl || '',
                signatureImage: data.signature.signatureImage || prev.signatureImage || '',
                signatureType: (data.signature.signatureType || (data.signature.signatureImage ? 'image' : prev.signatureType)) as 'image' | 'text',
                isEnabled: data.signature.isEnabled !== false
              };
              if (typeof window !== 'undefined') {
                try {
                  localStorage.setItem(`wehost_signature_${selectedAccountEmail.toLowerCase()}`, JSON.stringify(updated));
                } catch {}
              }
              return updated;
            });
            if (data.signature.signatureImage) {
              setSignatureActiveTab('image');
            }
          }
        })
        .catch(() => {});
    }
  }, [selectedAccountEmail]);
  // Auto-inject signature into compose body when compose opens and signature is ready
  useEffect(() => {
    if (!showCompose) return;
    // Only inject if compose body is blank (new email) — not reply/forward
    const isBlankBody = !composeBody || composeBody === '<p><br></p>' || composeBody === '';
    if (!isBlankBody) return;
    const sig = getSignatureHtml();
    if (sig && signatureForm.autoInsert && signatureForm.isEnabled) {
      setComposeBody('<p><br></p><p><br></p><p><br></p>' + sig);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCompose, signatureForm.signatureImage, signatureForm.fullName]);

  // AI Assistant Handlers
  const cleanAiText = (raw: string) =>
    decodeHtmlEntities(raw)
      .replace(/&mdash;/gi, '—')
      .replace(/&ndash;/gi, '–')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*\*+/g, '')
      .trim();

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
        setAiSummary(cleanAiText(data.result));
      }
    } catch (err) {
      console.error('Error generating summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  useEffect(() => {
    setAiReplyVariation(0);
    setHasAiGeneratedReply(false);
  }, [selectedMessage?.id]);

  const handleGenerateAIReply = async (tone: string, generateAlternative = false) => {
    if (!selectedMessage) return;
    const nextVariation = generateAlternative ? aiReplyVariation + 1 : 0;
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
          fromName: selectedMessage.fromName || '',
          senderName: selectedAccountEmail || '',
          tone,
          variation: nextVariation,
          previousReply: generateAlternative ? replyText : ''
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setReplyText(cleanAiText(data.result));
        setAiReplyVariation(nextVariation);
        setHasAiGeneratedReply(true);
        soundEffects.playAICompleteSound();
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
        const cleaned = cleanAiText(data.result);
        const sig = getSignatureHtml();
        setComposeBody(sig ? `${cleaned}<p><br></p>${sig}` : cleaned);
        soundEffects.playAICompleteSound();
      }
    } catch (err) {
      console.error('Error improving draft:', err);
    } finally {
      setIsImprovingDraft(false);
    }
  };

  // 23. Voice to Email — Captura de Voz em Tempo Real + Transformação em E-mail Corporativo Profissional
  const stopVoiceRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    setIsRecordingVoice(false);
    setVoiceInterimTranscript('');
  };

  const startVoiceRecording = (mode: 'compose' | 'quick_reply' = 'compose') => {
    if (typeof window === 'undefined') return;
    setVoiceError('');
    setVoiceTargetMode(mode);
    if (mode === 'compose') {
      setShowVoiceToEmailPanel(true);
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceError(
        'O seu navegador não suporta reconhecimento de voz direto. Pode digitar ou colar o comando abaixo para a IA transformar num e-mail profissional.'
      );
      return;
    }

    try {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.lang = voiceLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecordingVoice(true);
        setVoiceError('');
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcriptPiece + ' ';
          } else {
            interimChunk += transcriptPiece;
          }
        }
        if (finalChunk) {
          setVoiceTranscript((prev) => `${prev ? prev.trim() + ' ' : ''}${finalChunk.trim()}`);
        }
        setVoiceInterimTranscript(interimChunk);
      };

      recognition.onerror = (event: any) => {
        if (event?.error === 'not-allowed') {
          setVoiceError('Permissão de microfone negada. Autorize o microfone no navegador para ditar por voz.');
        } else if (event?.error !== 'no-speech' && event?.error !== 'aborted') {
          setVoiceError('Não foi possível captar o áudio. Verifique o microfone ou escreva o resumo abaixo.');
        }
        setIsRecordingVoice(false);
      };

      recognition.onend = () => {
        setIsRecordingVoice(false);
        setVoiceInterimTranscript('');
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[Voice to Email] Erro ao iniciar microfone:', err);
      setVoiceError('Não foi possível iniciar a gravação de voz.');
      setIsRecordingVoice(false);
    }
  };

  const handleConvertVoiceToProfessionalEmail = async (overrideTarget?: 'compose' | 'quick_reply') => {
    const target = overrideTarget || voiceTargetMode;
    const combinedSpoken = `${voiceTranscript} ${voiceInterimTranscript}`.trim();
    if (!combinedSpoken) {
      setVoiceError('Fale ao microfone ou escreva uma ideia rápida antes de transformar em e-mail profissional.');
      return;
    }

    if (isRecordingVoice) {
      stopVoiceRecording();
    }

    setIsConvertingVoiceToEmail(true);
    setVoiceError('');

    try {
      const recipientRef =
        target === 'quick_reply'
          ? selectedMessage?.fromName || selectedMessage?.fromEmail || ''
          : composeTo;

      const senderRef =
        userSignature?.fullName ||
        user?.name ||
        selectedAccountEmail.split('@')[0] ||
        '';

      const res = await fetch('/api/ai/email-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'voice_to_email',
          content: combinedSpoken,
          recipient: recipientRef,
          senderName: senderRef,
          tone: voiceTone,
          targetLang: voiceLang.startsWith('en') ? 'en' : 'pt',
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        const cleanedBody = cleanAiText(data.result);

        if (target === 'quick_reply') {
          setReplyText(cleanedBody);
        } else {
          const htmlParagraphs = cleanedBody
            .split(/\n\n+/)
            .map((p: string) => `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`)
            .join('');
          const sig = getSignatureHtml();
          setComposeBody(sig ? `${htmlParagraphs}<p><br></p>${sig}` : htmlParagraphs);

          if (!composeSubject.trim() && data.generatedSubject) {
            setComposeSubject(cleanAiText(data.generatedSubject));
          }
          setShowVoiceToEmailPanel(false);
        }

        setVoiceTranscript('');
        setVoiceInterimTranscript('');
        soundEffects.playAICompleteSound();
      } else {
        setVoiceError(data.error || 'Não foi possível transformar a fala em e-mail.');
      }
    } catch (err) {
      console.error('[Voice to Email] Erro ao converter fala:', err);
      setVoiceError('Erro ao comunicar com o assistente de IA.');
    } finally {
      setIsConvertingVoiceToEmail(false);
    }
  };

  // 24. Ouvir E-mail em Áudio (Text-to-Speech Natural com Controlo de Velocidade e Pausa)
  const cleanTextForSpeech = (rawHtmlOrText: string): string => {
    if (!rawHtmlOrText) return '';
    const withoutRawHeaders = stripRawHeaders(rawHtmlOrText);
    const withoutScripts = withoutRawHeaders
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, '. ')
      .replace(/<[^>]+>/g, ' ');
    return decodeHtmlEntities(withoutScripts)
      .replace(/https?:\/\/\S+/gi, 'link anexado')
      .replace(/\s+/g, ' ')
      .replace(/\.\s*\./g, '.')
      .trim();
  };

  const handleStopEmailSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    speechUtteranceRef.current = null;
    setIsSpeakingEmail(false);
    setIsPausedSpeech(false);
    setSpeakingSource(null);
  };

  const handleTogglePauseEmailSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!isSpeakingEmail) return;

    if (isPausedSpeech) {
      window.speechSynthesis.resume();
      setIsPausedSpeech(false);
    } else {
      window.speechSynthesis.pause();
      setIsPausedSpeech(true);
    }
  };

  const handleSpeakEmailText = (
    source: 'email' | 'compose' | 'quick_reply',
    customRate?: 1 | 1.25 | 1.5
  ) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    // Se já estiver a falar a mesma fonte e não for troca de velocidade, parar
    if (isSpeakingEmail && speakingSource === source && !customRate) {
      handleStopEmailSpeech();
      return;
    }

    window.speechSynthesis.cancel();

    let textToRead = '';
    let langCode = 'pt-PT';

    if (source === 'email' && selectedMessage) {
      const isTranslatedForCurrent =
        translatedEmail && translatedEmail.msgId === selectedMessage.id;
      const activeSubject = isTranslatedForCurrent
        ? translatedEmail.subject
        : selectedMessage.subject;
      const activeBody = isTranslatedForCurrent
        ? translatedEmail.body
        : cleanTextForSpeech(selectedMessage.body);

      if (isTranslatedForCurrent && translatedEmail.lang === 'en') {
        langCode = 'en-US';
        textToRead = `Email from ${selectedMessage.fromName || selectedMessage.fromEmail}. Subject: ${activeSubject || 'No subject'}. ${activeBody}`;
      } else {
        langCode = 'pt-PT';
        textToRead = `E-mail de ${selectedMessage.fromName || selectedMessage.fromEmail}. Assunto: ${activeSubject || 'Sem assunto'}. ${activeBody}`;
      }
    } else if (source === 'compose') {
      const cleanCompose = cleanTextForSpeech(composeBody);
      if (!cleanCompose && !composeSubject) return;
      textToRead = `${composeSubject ? `Assunto: ${composeSubject}. ` : ''}${cleanCompose}`;
    } else if (source === 'quick_reply') {
      const cleanReply = cleanTextForSpeech(replyText);
      if (!cleanReply) return;
      textToRead = cleanReply;
    }

    if (!textToRead.trim()) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    const activeRate = customRate || speechSpeed;
    utterance.rate = activeRate;
    utterance.pitch = 1;
    utterance.lang = langCode;

    // Escolher a voz mais natural disponível para o idioma
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const langPrefix = langCode.slice(0, 2).toLowerCase();
      const preferredVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith(langPrefix) &&
            (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Microsoft'))
        ) || voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    utterance.onstart = () => {
      setIsSpeakingEmail(true);
      setIsPausedSpeech(false);
      setSpeakingSource(source);
    };

    utterance.onend = () => {
      setIsSpeakingEmail(false);
      setIsPausedSpeech(false);
      setSpeakingSource(null);
    };

    utterance.onerror = () => {
      setIsSpeakingEmail(false);
      setIsPausedSpeech(false);
      setSpeakingSource(null);
    };

    speechUtteranceRef.current = utterance;
    setIsSpeakingEmail(true);
    setIsPausedSpeech(false);
    setSpeakingSource(source);
    window.speechSynthesis.speak(utterance);
  };

  const handleCycleSpeechSpeed = () => {
    const nextSpeed: 1 | 1.25 | 1.5 =
      speechSpeed === 1 ? 1.25 : speechSpeed === 1.25 ? 1.5 : 1;
    setSpeechSpeed(nextSpeed);
    if (isSpeakingEmail && speakingSource) {
      handleSpeakEmailText(speakingSource, nextSpeed);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedMessage?.id, showCompose]);

  const handleTranslateEmail = async (targetLang: 'pt' | 'en') => {
    if (!selectedMessage) return;
    // Se já estiver traduzido para este idioma, alternar de volta para o original
    if (translatedEmail && translatedEmail.msgId === selectedMessage.id && translatedEmail.lang === targetLang) {
      setTranslatedEmail(null);
      return;
    }

    setIsTranslatingEmail(targetLang);
    try {
      const rawBody = stripRawHeaders(selectedMessage.body);
      const res = await fetch('/api/ai/email-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translate',
          targetLang,
          content: rawBody,
          subject: selectedMessage.subject,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setTranslatedEmail({
          msgId: selectedMessage.id,
          lang: targetLang,
          subject: data.translatedSubject ? cleanAiText(data.translatedSubject) : selectedMessage.subject,
          body: cleanAiText(data.result),
        });
        soundEffects.playAICompleteSound();
      }
    } catch (err) {
      console.error('Error translating email:', err);
    } finally {
      setIsTranslatingEmail(null);
    }
  };

  const handleTranslateDraft = async (targetLang: 'pt' | 'en') => {
    if (!composeBody && !composeSubject) return;
    setIsTranslatingDraft(targetLang);
    try {
      const res = await fetch('/api/ai/email-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translate',
          targetLang,
          content: composeBody,
          subject: composeSubject,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.result) {
          const cleaned = cleanAiText(data.result);
          const htmlParagraphs = cleaned
            .split(/\n\n+/)
            .map((p: string) => `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`)
            .join('');
          const sig = getSignatureHtml();
          setComposeBody(sig ? `${htmlParagraphs}<p><br></p>${sig}` : htmlParagraphs);
        }
        if (data.translatedSubject && composeSubject) {
          setComposeSubject(cleanAiText(data.translatedSubject));
        }
        soundEffects.playAICompleteSound();
      }
    } catch (err) {
      console.error('Error translating draft:', err);
    } finally {
      setIsTranslatingDraft(null);
    }
  };

  const handleTranslateQuickReply = async (targetLang: 'pt' | 'en') => {
    if (!replyText.trim()) return;
    setIsTranslatingQuickReply(targetLang);
    try {
      const res = await fetch('/api/ai/email-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translate',
          targetLang,
          content: replyText,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setReplyText(cleanAiText(data.result));
        soundEffects.playAICompleteSound();
      }
    } catch (err) {
      console.error('Error translating quick reply:', err);
    } finally {
      setIsTranslatingQuickReply(null);
    }
  };

  const handleSignatureImageUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem da assinatura deve ter no máximo 2MB.');
      return;
    }

    // 1. Mostrar preview imediato local
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setSignatureForm(prev => ({
          ...prev,
          signatureImage: result,
          signatureType: 'image'
        }));
      }
    };
    reader.readAsDataURL(file);

    // 2. Fazer upload para a CDN pública Cloudinary para que clientes externos (Gmail, Outlook) renderizem diretamente
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setSignatureForm(prev => ({
          ...prev,
          signatureImage: data.url,
          signatureType: 'image'
        }));
      }
    } catch (uploadErr) {
      console.warn('[Signature Upload] Erro ao enviar para CDN Cloudinary:', uploadErr);
    }
  };

  const handleSaveSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSignature(true);

    // Salvar localmente de imediato
    if (typeof window !== 'undefined' && selectedAccountEmail) {
      try {
        localStorage.setItem(`wehost_signature_${selectedAccountEmail.toLowerCase()}`, JSON.stringify(signatureForm));
      } catch {}
    }

    // Gerar HTML da assinatura para inserção imediata no campo de mensagem
    let sigHtml = '';
    if (signatureForm.signatureType === 'image' && signatureForm.signatureImage) {
      sigHtml = `<p><br></p><p><br></p><p><img src="${signatureForm.signatureImage}" alt="Assinatura" style="max-width: 520px; width: auto; height: auto; display: block; border: 0; border-radius: 4px; margin-top: 16px;" /></p>`;
    } else if (signatureForm.signatureImage && !signatureForm.fullName) {
      sigHtml = `<p><br></p><p><br></p><p><img src="${signatureForm.signatureImage}" alt="Assinatura" style="max-width: 520px; width: auto; height: auto; display: block; border: 0; border-radius: 4px; margin-top: 16px;" /></p>`;
    } else if (signatureForm.fullName || signatureForm.companyName) {
      sigHtml = `<p><br></p><div style="font-family: Arial, sans-serif; font-size: 13px; color: #222; border-left: 3px solid #7c3aed; padding-left: 10px; margin-top: 15px;">
        <strong style="color: #111; font-size: 14px;">${signatureForm.fullName || ''}</strong><br/>
        <span style="color: #555;">${signatureForm.jobTitle ? signatureForm.jobTitle + ' • ' : ''}${signatureForm.companyName || ''}</span><br/>
        ${signatureForm.phone ? `<span style="color: #666; font-size: 12px;">📞 ${signatureForm.phone}</span><br/>` : ''}
        ${signatureForm.website ? `<a href="${signatureForm.website.startsWith('http') ? signatureForm.website : 'https://' + signatureForm.website}" target="_blank" style="color: #7c3aed; font-size: 12px; text-decoration: none;">🌐 ${signatureForm.website}</a><br/>` : ''}
        ${signatureForm.signatureImage ? `<br/><img src="${signatureForm.signatureImage}" alt="Assinatura" style="max-width: 450px; width: 100%; height: auto; margin-top: 8px; display: block;" />` : ''}
      </div>`;
    }

    if (sigHtml) {
      setComposeBody(prev => {
        if (!prev || prev === '<p><br></p>' || prev.trim() === '') {
          return '<p><br></p>' + sigHtml;
        }
        if (signatureForm.signatureImage && prev.includes(signatureForm.signatureImage)) {
          return prev;
        }
        return prev + sigHtml;
      });
    }

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
      }
    } catch (err) {
      console.error('Error saving signature:', err);
    } finally {
      setIsSavingSignature(false);
      setShowSignatureModal(false);
    }
  };

  // Filtragem por Pasta, Filtros e Pesquisa
  const displayMessages = messages.filter(m => {
    let matchesFolder = false;
    if (currentFolder === 'starred') {
      matchesFolder = m.starred && m.folder !== 'trash';
    } else if (currentFolder === 'notifications') {
      matchesFolder = m.folder === 'inbox' && isNotificationEmail(m);
    } else if (currentFolder === 'inbox') {
      matchesFolder = m.folder === 'inbox' && !isNotificationEmail(m);
    } else {
      matchesFolder = m.folder === currentFolder;
    }

    let matchesFilter = true;
    if (filterType === 'unread') matchesFilter = !m.isRead;
    if (filterType === 'overdue') matchesFilter = isMessageOverdue(m);
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

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const msgDate = new Date(m.date);
      if (isNaN(msgDate.getTime())) {
        matchesDate = false;
      } else {
        const now = new Date();
        if (dateFilter === 'today') {
          matchesDate =
            msgDate.getFullYear() === now.getFullYear() &&
            msgDate.getMonth() === now.getMonth() &&
            msgDate.getDate() === now.getDate();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
          matchesDate = msgDate >= weekAgo;
        } else if (dateFilter === 'month') {
          matchesDate =
            msgDate.getFullYear() === now.getFullYear() &&
            msgDate.getMonth() === now.getMonth();
        } else if (dateFilter.startsWith('m:')) {
          const targetMonth = Number(dateFilter.slice(2));
          matchesDate = msgDate.getMonth() === targetMonth;
        }
      }
    }

    return matchesFolder && matchesFilter && matchesDate && matchesSearch;
  });

  const currentAccountObj = accounts.find(a => a.email.toLowerCase() === selectedAccountEmail.toLowerCase());
  const isAccountPending = !mailboxPassword && currentAccountObj ? currentAccountObj.status === 'pending' : false;

  const unreadCount = messages.filter(m => !m.isRead).length;
  
  // Dynamic badge counters
  const unreadInboxCount = currentFolder === 'inbox' 
    ? messages.filter(m => !m.isRead).length 
    : folderStats.inboxUnread;

  const notificationsUnreadCount = currentFolder === 'notifications'
    ? messages.filter(m => !m.isRead && isNotificationEmail(m)).length
    : folderStats.notificationsUnread;

  const starredCount = currentFolder === 'starred'
    ? messages.length
    : (currentFolder === 'inbox' ? messages.filter(m => m.starred).length : folderStats.starred);

  const draftsCount = currentFolder === 'drafts'
    ? messages.length
    : folderStats.drafts;

  const sentCount = currentFolder === 'sent'
    ? messages.length
    : folderStats.sent;

  const scheduledCount = currentFolder === 'scheduled'
    ? messages.length
    : folderStats.scheduled;

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


  // ── Contactos históricos extraídos dos emails sincronizados ──────────────
  // Chave localStorage: wehost_contacts_<email>
  const contactsCacheKey = selectedAccountEmail
    ? `wehost_contacts_${selectedAccountEmail.toLowerCase()}`
    : null;

  // Extrai contactos únicos das mensagens actuais (sent + received)
  const knownContacts = useMemo<{ email: string; name: string }[]>(() => {
    const map = new Map<string, string>();
    // Carregar contactos persistidos
    if (typeof window !== 'undefined' && contactsCacheKey) {
      try {
        const stored = localStorage.getItem(contactsCacheKey);
        if (stored) {
          const arr: { email: string; name: string }[] = JSON.parse(stored);
          arr.forEach((c) => { if (c.email) map.set(c.email.toLowerCase(), c.name || c.email); });
        }
      } catch {}
    }
    // Adicionar contactos das mensagens actuais
    messages.forEach((msg) => {
      const fe = (msg.fromEmail || '').trim().toLowerCase();
      const fn = (msg.fromName || '').trim();
      const te = (msg.toEmail || '').trim().toLowerCase();
      if (fe && fe !== selectedAccountEmail?.toLowerCase()) map.set(fe, fn || fe);
      if (te && te !== selectedAccountEmail?.toLowerCase()) map.set(te, te);
    });
    return Array.from(map.entries()).map(([email, name]) => ({ email, name }));
  }, [messages, contactsCacheKey, selectedAccountEmail]);

  // Persistir contactos no localStorage sempre que a lista crescer
  useEffect(() => {
    if (!contactsCacheKey || knownContacts.length === 0) return;
    try { localStorage.setItem(contactsCacheKey, JSON.stringify(knownContacts)); } catch {}
  }, [knownContacts, contactsCacheKey]);

  // Filtrar sugestões conforme o que o utilizador digita no campo "Para"
  const handleToChange = useCallback((val: string) => {
    setComposeTo(val);
    if (!val.trim()) { setShowToSuggestions(false); setToSuggestions([]); return; }
    const q = val.toLowerCase();
    const filtered = knownContacts
      .filter((c) => c.email.includes(q) || c.name.toLowerCase().includes(q))
      .slice(0, 8);
    setToSuggestions(filtered);
    setShowToSuggestions(filtered.length > 0);
  }, [knownContacts]);

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col font-sans">
      {/* Webmail Header Bar - Mobile First */}
      <header className="bg-white text-gray-800 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center space-x-2.5 min-w-0">
          <Link href={user ? "/dashboard/email" : "/"} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-900 transition shrink-0" title={user ? "Voltar ao Painel" : "Voltar ao Início"}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center space-x-2 shrink-0">
            <BrandLogo showIcon={false} />
            <span className="hidden sm:inline-block text-neutral-900 font-bold text-xs tracking-wider bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">inLook</span>
          </div>
        </div>

        {/* Account Switcher & Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Account Switcher */}
          {accounts.length > 0 ? (
            <div className="flex items-center space-x-1.5 bg-neutral-100 hover:bg-neutral-200/60 px-2.5 sm:px-3 py-1.5 rounded-xl border border-neutral-200 max-w-[140px] sm:max-w-xs transition">
              {userAvatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={userAvatarUrl}
                  alt={selectedAccountEmail}
                  onClick={() => setShowInternalChat(true)}
                  className="h-5 w-5 rounded-full object-cover border border-emerald-400 shrink-0 cursor-pointer"
                  title="Foto de perfil (clique para editar no Chat da Equipa)"
                />
              ) : (
                <User className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
              )}
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
                className="bg-transparent text-xs font-bold text-neutral-800 outline-none cursor-pointer truncate w-full"
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
          ) : (mailboxPassword && selectedAccountEmail) ? (
            <button
              type="button"
              onClick={() => setShowInternalChat(true)}
              className="flex items-center space-x-2 text-xs text-neutral-700 font-mono font-bold bg-neutral-100 hover:bg-neutral-200/70 px-2.5 py-1.5 rounded-xl border border-neutral-200 truncate max-w-[130px] sm:max-w-[210px] cursor-pointer transition"
              title="Clique para abrir o Chat da Equipa ou alterar a sua Foto de Perfil"
            >
              {userAvatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={userAvatarUrl}
                  alt={selectedAccountEmail}
                  className="h-5 w-5 rounded-full object-cover border border-emerald-500 shrink-0"
                />
              ) : (
                <span className="h-5 w-5 rounded-full bg-neutral-900 text-emerald-400 font-sans font-extrabold text-[10px] flex items-center justify-center shrink-0">
                  {selectedAccountEmail.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="truncate">{selectedAccountEmail}</span>
            </button>
          ) : null}

          {/* Botão Modo Agente IA Auto-Resposta (apenas contas @wehosthere.com) */}
          {isWehosthereAccount && (
          <button
            type="button"
            onClick={() => {
              soundEffects.playFolderSwitchSound();
              setShowAgentModal(true);
            }}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition cursor-pointer text-xs font-bold shadow-2xs shrink-0 active:scale-95 border ${
              agentActive
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                : 'bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-300'
            }`}
            title="Ligar ou desligar o Agente IA de resposta automática"
          >
            <Bot className={`h-3.5 w-3.5 shrink-0 ${agentActive ? 'text-white' : 'text-indigo-600'}`} />
            <span className="hidden sm:inline">Modo Agente</span>
            <span
              className={`w-2 h-2 rounded-full ${
                agentActive ? 'bg-emerald-200 animate-pulse' : 'bg-neutral-300'
              }`}
            />
          </button>

          )}

          {/* Botão Conectar / Gerir Contas Externas (IMAP/SMTP) */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playFolderSwitchSound();
              setShowExternalAccountsModal(true);
            }}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 rounded-xl transition cursor-pointer text-xs font-bold shadow-2xs shrink-0 active:scale-95"
            title="Conectar contas externas de outros provedores (IMAP/SMTP)"
          >
            <Server className="h-3.5 w-3.5 text-primary-600 shrink-0" />
            <span className="hidden sm:inline">Contas Externas</span>
            {externalAccountsCount > 0 ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-primary-50 text-primary-700 border border-primary-200">
                {externalAccountsCount}
              </span>
            ) : (
              <span className="hidden lg:inline text-[10px] font-normal text-neutral-500">
                + Adicionar
              </span>
            )}
          </button>



          {/* Mailbox Logout */}
          {mailboxPassword && (
            <button
              onClick={handleWebmailLogout}
              className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-500 hover:text-neutral-900 transition cursor-pointer shrink-0"
              title="Sair do Webmail"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}

          {/* Mobile: More Options (⋯) */}
          {mailboxPassword && (
            <button
              type="button"
              onClick={() => setShowMobileMenu(true)}
              className="sm:hidden p-2 hover:bg-neutral-100 text-neutral-600 rounded-xl transition cursor-pointer shrink-0"
              title="Mais opções"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          )}
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
            <span>A sincronizar mensagens... ({currentFolder === 'inbox' ? 'Caixa de Entrada' : currentFolder === 'notifications' ? 'Notificações' : currentFolder === 'sent' ? 'Enviados' : currentFolder === 'drafts' ? 'Rascunhos' : currentFolder === 'trash' ? 'Lixeira' : 'Com Estrela'})</span>
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

      {/* Se não autenticado: Apresenta Tela de Login Única, Centralizada e Elegante (Estilo Tesla) */}
      {!mailboxPassword && !isAccountPending ? (
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-neutral-50/60">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm text-left space-y-6 animate-in zoom-in-95 duration-150">
            <div className="text-center space-y-1.5 pb-2 border-b border-neutral-100">
              <div className="w-12 h-12 bg-neutral-100 text-neutral-900 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-neutral-200 shadow-2xs">
                <Lock className="h-6 w-6 text-neutral-800" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Entrar no Webmail</h2>
              <p className="text-xs text-neutral-500 font-medium">
                {(webmailLoginEmail || selectedAccountEmail) ? (
                  <>Autentique-se para aceder à caixa de <span className="font-mono text-neutral-900 font-bold">{webmailLoginEmail || selectedAccountEmail}</span></>
                ) : (
                  'Insira o seu e-mail corporativo e palavra-passe para aceder à sua caixa de correio.'
                )}
              </p>
            </div>

            <form onSubmit={handleWebmailLogin} className="space-y-4">
              {webmailLoginError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-start space-x-2 text-xs font-bold text-rose-700">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{webmailLoginError}</span>
                  </div>
                  <a
                    href={`https://wa.me/258848335618?text=${encodeURIComponent(
                      `Olá Suporte WEHOSTHERE! Preciso de ajuda para aceder ao Webmail Corporativo${
                        webmailLoginEmail || selectedAccountEmail ? ` com a conta ${webmailLoginEmail || selectedAccountEmail}` : ''
                      } (Erro: ${webmailLoginError}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.126.557 4.199 1.613 6.028l-1.613 5.972 6.135-1.608c1.777.962 3.778 1.472 5.865 1.472 6.627 0 12-5.373 12-12s-5.373-12-12-12z"/>
                    </svg>
                    <span>Falar com o Suporte no WhatsApp</span>
                  </a>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Endereço de E-mail</label>
                <input
                  type="email"
                  value={webmailLoginEmail}
                  onChange={(e) => {
                    setWebmailLoginEmail(e.target.value);
                    setSelectedAccountEmail(e.target.value);
                  }}
                  placeholder={`${animatedEmailPlaceholder}|`}
                  required
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-bold placeholder:text-neutral-400 placeholder:font-medium focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-700">Palavra-passe da Caixa</label>
                  <button
                    type="button"
                    onClick={handleOpenChangePassword}
                    className="text-xs font-medium text-neutral-500 hover:text-black hover:underline cursor-pointer"
                  >
                    Mudar senha
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={webmailLoginPassword}
                    onChange={(e) => setWebmailLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoFocus
                    className="w-full pl-4 pr-11 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
                    title={showLoginPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={webmailLoginLoading}
                className="w-full py-3 bg-neutral-900 hover:bg-black disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center space-x-2 active:scale-98"
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

            <p className="text-[11px] text-neutral-400 text-center pt-2 border-t border-neutral-100">
              Protegido com encriptação SSL/TLS via servidores IMAP/SMTP dedicados.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Folder Selector Tabs (Visível em Telas Pequenas) */}
          <div className="md:hidden bg-white border-b border-neutral-200 px-2 py-2 flex items-center space-x-1.5 overflow-x-auto text-xs shrink-0">
        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('inbox'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all duration-200 shrink-0 border ${
            currentFolder === 'inbox' 
              ? 'bg-neutral-900 text-white shadow-xs border-neutral-900' 
              : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 border-neutral-200/80'
          }`}
        >
          <Inbox className="h-3.5 w-3.5" />
          <span>Entrada</span>
          {unreadInboxCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${currentFolder === 'inbox' ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-700'}`}>
              {unreadInboxCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('notifications'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all duration-200 shrink-0 border ${
            currentFolder === 'notifications' 
              ? 'bg-neutral-900 text-white shadow-xs border-neutral-900' 
              : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 border-neutral-200/80'
          }`}
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Notificações</span>
          {notificationsUnreadCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${currentFolder === 'notifications' ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-700'}`}>
              {notificationsUnreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('starred'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all duration-200 shrink-0 border ${
            currentFolder === 'starred' 
              ? 'bg-neutral-900 text-white shadow-xs border-neutral-900' 
              : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 border-neutral-200/80'
          }`}
        >
          <Star className="h-3.5 w-3.5" />
          <span>Com Estrela</span>
          {starredCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${currentFolder === 'starred' ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-700'}`}>
              {starredCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('sent'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all duration-200 shrink-0 border ${
            currentFolder === 'sent' 
              ? 'bg-neutral-900 text-white shadow-xs border-neutral-900' 
              : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 border-neutral-200/80'
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Enviados</span>
          {sentCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${currentFolder === 'sent' ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-700'}`}>
              {sentCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('scheduled'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all duration-200 shrink-0 border ${
            currentFolder === 'scheduled' 
              ? 'bg-neutral-900 text-white shadow-xs border-neutral-900' 
              : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 border-neutral-200/80'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Agendados</span>
          {scheduledCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${currentFolder === 'scheduled' ? 'bg-emerald-400 text-neutral-950' : 'bg-emerald-100 text-emerald-800'}`}>
              {scheduledCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('trash'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all duration-200 shrink-0 border ${
            currentFolder === 'trash' 
              ? 'bg-neutral-900 text-white shadow-xs border-neutral-900' 
              : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 border-neutral-200/80'
          }`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Lixeira</span>
        </button>

        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setCurrentFolder('drafts'); setSelectedMessage(null); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all duration-200 shrink-0 border ${
            currentFolder === 'drafts' 
              ? 'bg-neutral-900 text-white shadow-xs border-neutral-900' 
              : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 border-neutral-200/80'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Rascunhos</span>
          {draftsCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${currentFolder === 'drafts' ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-700'}`}>
              {draftsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setShowInternalChat(true); }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all duration-200 shrink-0 border bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
        >
          <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
          <span>Chat Equipa</span>
          {internalChatUnread > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black ml-1 bg-emerald-500 text-neutral-950">
              {internalChatUnread}
            </span>
          )}
        </button>

        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setShowAnalyticsDashboard(!showAnalyticsDashboard); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all duration-200 shrink-0 border ${
            showAnalyticsDashboard
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
              : 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
          }`}
        >
          <BarChart3 className={`h-3.5 w-3.5 ${showAnalyticsDashboard ? 'text-emerald-400' : 'text-indigo-600'}`} />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => { soundEffects.playFolderSwitchSound(); setShowExternalAccountsModal(true); }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all duration-200 shrink-0 border bg-neutral-100 text-neutral-700 hover:bg-neutral-200/70 border-neutral-200"
        >
          <Server className="h-3.5 w-3.5 text-primary-600" />
          <span>Contas Externas</span>
          {externalAccountsCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 bg-primary-100 text-primary-800">
              {externalAccountsCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Desktop Sidebar Nav */}
        <aside className={`hidden md:flex bg-white text-gray-600 flex-col p-3 border-r border-gray-200 space-y-2 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-56'}`}>
          <button
            type="button"
            onClick={handleOpenCompose}
            className={`w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer border border-primary-600 ${isSidebarCollapsed ? 'px-2' : ''}`}
          >
            <Edit3 className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span>Escrever E-mail</span>}
          </button>

          {/* Collapse Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
            title={isSidebarCollapsed ? "Expandir Sidebar" : "Recolher Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4 text-gray-600" /> : <ChevronRight className="h-4 w-4 text-gray-600 rotate-180" />}
          </button>

          <nav className={`space-y-1 text-xs font-semibold ${isSidebarCollapsed ? 'hidden' : ''}`}>
            <button
              onClick={() => { soundEffects.playFolderSwitchSound(); setShowAnalyticsDashboard(false); setCurrentFolder('inbox'); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                !showAnalyticsDashboard && currentFolder === 'inbox' 
                  ? 'bg-neutral-900 text-white border-neutral-900 font-bold shadow-xs' 
                  : 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Inbox className={`h-4 w-4 ${!showAnalyticsDashboard && currentFolder === 'inbox' ? 'text-white' : 'text-neutral-500'}`} />
                <span>Entrada</span>
              </div>
              {unreadInboxCount > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-2xs ${
                  !showAnalyticsDashboard && currentFolder === 'inbox' ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {unreadInboxCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { soundEffects.playFolderSwitchSound(); setShowAnalyticsDashboard(false); setCurrentFolder('notifications'); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                !showAnalyticsDashboard && currentFolder === 'notifications' 
                  ? 'bg-neutral-900 text-white border-neutral-900 font-bold shadow-xs' 
                  : 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Bell className={`h-4 w-4 ${!showAnalyticsDashboard && currentFolder === 'notifications' ? 'text-white' : 'text-neutral-500'}`} />
                <span>Notificações</span>
              </div>
              {notificationsUnreadCount > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-2xs ${
                  !showAnalyticsDashboard && currentFolder === 'notifications' ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {notificationsUnreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { soundEffects.playFolderSwitchSound(); setShowAnalyticsDashboard(false); setCurrentFolder('starred'); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                !showAnalyticsDashboard && currentFolder === 'starred' 
                  ? 'bg-neutral-900 text-white border-neutral-900 font-bold shadow-xs' 
                  : 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Star className={`h-4 w-4 ${!showAnalyticsDashboard && currentFolder === 'starred' ? 'text-white' : 'text-neutral-500'}`} />
                <span>Com Estrela</span>
              </div>
              {starredCount > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-2xs ${
                  !showAnalyticsDashboard && currentFolder === 'starred' ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {starredCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { soundEffects.playFolderSwitchSound(); setShowAnalyticsDashboard(false); setCurrentFolder('sent'); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                !showAnalyticsDashboard && currentFolder === 'sent' 
                  ? 'bg-neutral-900 text-white border-neutral-900 font-bold shadow-xs' 
                  : 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Send className={`h-4 w-4 ${!showAnalyticsDashboard && currentFolder === 'sent' ? 'text-white' : 'text-neutral-500'}`} />
                <span>Enviados</span>
              </div>
              {sentCount > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-2xs ${
                  !showAnalyticsDashboard && currentFolder === 'sent' ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {sentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { soundEffects.playFolderSwitchSound(); setShowAnalyticsDashboard(false); setCurrentFolder('scheduled'); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                !showAnalyticsDashboard && currentFolder === 'scheduled' 
                  ? 'bg-neutral-900 text-white border-neutral-900 font-bold shadow-xs' 
                  : 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Calendar className={`h-4 w-4 ${!showAnalyticsDashboard && currentFolder === 'scheduled' ? 'text-emerald-400' : 'text-neutral-500'}`} />
                <span>Agendados</span>
              </div>
              {scheduledCount > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-2xs ${
                  !showAnalyticsDashboard && currentFolder === 'scheduled' ? 'bg-emerald-400 text-neutral-950' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {scheduledCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { soundEffects.playFolderSwitchSound(); setShowAnalyticsDashboard(false); setCurrentFolder('trash'); }}
              className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                !showAnalyticsDashboard && currentFolder === 'trash' 
                  ? 'bg-neutral-900 text-white border-neutral-900 font-bold shadow-xs' 
                  : 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-transparent'
              }`}
            >
              <Trash2 className={`h-4 w-4 ${!showAnalyticsDashboard && currentFolder === 'trash' ? 'text-white' : 'text-neutral-500'}`} />
              <span>Lixeira</span>
            </button>

            <button
              onClick={() => { soundEffects.playFolderSwitchSound(); setShowAnalyticsDashboard(false); setCurrentFolder('drafts'); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                !showAnalyticsDashboard && currentFolder === 'drafts' 
                  ? 'bg-neutral-900 text-white border-neutral-900 font-bold shadow-xs' 
                  : 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileText className={`h-4 w-4 ${!showAnalyticsDashboard && currentFolder === 'drafts' ? 'text-white' : 'text-neutral-500'}`} />
                <span>Rascunhos</span>
              </div>
              {draftsCount > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-2xs ${
                  !showAnalyticsDashboard && currentFolder === 'drafts' ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {draftsCount}
                </span>
              )}
            </button>

            {/* Botão Dashboard de Relatórios & Analytics */}
            <button
              type="button"
              onClick={() => { soundEffects.playFolderSwitchSound(); setShowAnalyticsDashboard(!showAnalyticsDashboard); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border mt-1 ${
                showAnalyticsDashboard
                  ? 'bg-neutral-900 text-white border-neutral-900 font-bold shadow-xs'
                  : 'bg-indigo-50/80 hover:bg-indigo-100 text-indigo-950 border-indigo-200 font-bold'
              }`}
              title="Abrir Dashboard Interativo de Relatórios e Gráficos"
            >
              <div className="flex items-center space-x-2.5 truncate">
                <BarChart3 className={`h-4 w-4 shrink-0 ${showAnalyticsDashboard ? 'text-emerald-400' : 'text-indigo-600'}`} />
                <div className="text-left truncate">
                  <span className="block truncate">Analytics &amp; Dados</span>
                  <span className={`text-[10px] font-normal block truncate ${showAnalyticsDashboard ? 'text-neutral-300' : 'text-indigo-700'}`}>
                    Relatórios interativos
                  </span>
                </div>
              </div>
            </button>

            {/* Botão de Chat Interno Corporativo (@dominio) */}
            <button
              type="button"
              onClick={() => { soundEffects.playFolderSwitchSound(); setShowInternalChat(!showInternalChat); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border mt-1 ${
                showInternalChat
                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                  : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-950 border-emerald-200 font-bold'
              }`}
              title="Abrir Chat Interno da Equipa (mesmo domínio)"
            >
              <div className="flex items-center space-x-2.5 truncate">
                <MessageSquare className={`h-4 w-4 shrink-0 ${showInternalChat ? 'text-white' : 'text-emerald-600'}`} />
                <div className="text-left truncate">
                  <span className="block truncate">Chat da Equipa</span>
                  <span className={`text-[10px] font-normal block truncate ${showInternalChat ? 'text-emerald-100' : 'text-emerald-700'}`}>
                    {internalChatOnline > 0 ? `${internalChatOnline} online agora` : `@${selectedAccountEmail.split('@')[1] || 'dominio'}`}
                  </span>
                </div>
              </div>
              {internalChatUnread > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-400 text-neutral-950 shadow-2xs">
                  {internalChatUnread}
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>

            {/* Botão de Contas Externas (IMAP/SMTP) */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playFolderSwitchSound();
                setShowExternalAccountsModal(true);
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border mt-1 bg-neutral-50/80 hover:bg-neutral-100 text-neutral-800 border-neutral-200 font-bold"
              title="Conectar e gerir contas de e-mail de outros provedores (IMAP/SMTP)"
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Server className="h-4 w-4 shrink-0 text-primary-600" />
                <div className="text-left truncate">
                  <span className="block truncate text-xs">Contas Externas</span>
                  <span className="text-[10px] font-normal block truncate text-neutral-500">
                    {externalAccountsCount > 0
                      ? `${externalAccountsCount} conectada${externalAccountsCount > 1 ? 's' : ''}`
                      : 'Adicionar conta externa'}
                  </span>
                </div>
              </div>
              <Plus className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
            </button>

            {/* Atalho Direto para Visitar o Site do Domínio da Empresa */}
            {selectedAccountEmail && selectedAccountEmail.includes('@') && (
              <a
                href={`https://${selectedAccountEmail.split('@')[1].toLowerCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 mt-1"
                title={`Abrir https://${selectedAccountEmail.split('@')[1].toLowerCase()} num novo separador`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Globe className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="text-left truncate">
                    <span className="block truncate text-xs font-bold">Visitar Site</span>
                    <span className="text-[10px] font-mono text-neutral-500 block truncate">
                      {selectedAccountEmail.split('@')[1].toLowerCase()}
                    </span>
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
              </a>
            )}
          </nav>

          <div className={`mt-auto pt-2 border-t border-neutral-200 text-[11px] text-neutral-500 space-y-2 ${isSidebarCollapsed ? 'hidden' : ''}`}>

            {/* Botão Rápido de Mudar Senha na Barra Lateral (Tesla Dark) */}
            <button
              type="button"
              onClick={handleOpenChangePassword}
              className="w-full h-9 flex items-center justify-center space-x-2 px-3 bg-neutral-900 hover:bg-black text-white rounded-xl transition cursor-pointer text-xs font-bold shadow-xs mt-2.5 active:scale-98"
              title="Alterar senha desta conta de e-mail"
            >
              <Key className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
              <span>Mudar Senha</span>
            </button>

            {/* Botão de Instalação na Barra Lateral (Tesla White) */}
            {!isAppInstalled && (
              <button
                type="button"
                onClick={handleTriggerInstall}
                className="w-full h-9 flex items-center justify-center space-x-2 px-3 bg-white hover:bg-neutral-100 text-neutral-900 rounded-xl transition cursor-pointer text-xs font-bold border border-neutral-300 shadow-2xs mt-2 active:scale-98"
                title="Instalar o Webmail no Computador ou Telemóvel"
              >
                <Download className="h-3.5 w-3.5 text-neutral-700 shrink-0" />
                <span>Instalar App</span>
              </button>
            )}
          </div>
        </aside>

        {showAnalyticsDashboard ? (
          <WebmailAnalyticsDashboard
            accountEmail={selectedAccountEmail}
            messages={messages}
            folderStats={folderStats}
            onClose={() => setShowAnalyticsDashboard(false)}
            onOpenCompose={handleOpenCompose}
            onNavigateFolder={(f) => {
              setCurrentFolder(f);
              setShowAnalyticsDashboard(false);
            }}
          />
        ) : (
        <>
        {/* Message List Column - Mobile First */}
        <section className={`w-full md:w-80 lg:w-96 min-h-0 overflow-hidden bg-white border-r border-neutral-200 flex flex-col shrink-0 ${selectedMessage ? 'hidden md:flex' : 'flex'}`}>
          {/* Search Input & Filter Pills */}
          <div className="p-3 border-b border-neutral-100 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Pesquisar e-mails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-100 border border-neutral-200 rounded-xl text-xs text-neutral-900 outline-none focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-medium placeholder:text-neutral-400 transition"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playFolderSwitchSound();
                  refreshMessages();
                }}
                disabled={isRefreshingWebmail || isLoadingMessages}
                title="Atualizar mensagens"
                className="p-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl text-neutral-700 hover:text-neutral-900 transition cursor-pointer shrink-0 disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshingWebmail ? 'animate-spin text-primary-600' : ''}`} />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                className="flex items-center space-x-1.5 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Filtros</span>
                <ChevronRight className={`h-3 w-3 transition-transform ${isFiltersCollapsed ? '' : 'rotate-180'}`} />
              </button>
              
              {!isFiltersCollapsed && (
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap transition cursor-pointer border ${
                      filterType === 'all' 
                        ? 'bg-neutral-900 text-white font-bold border-neutral-900 shadow-xs' 
                        : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('unread')}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap transition cursor-pointer border ${
                      filterType === 'unread' 
                        ? 'bg-neutral-900 text-white font-bold border-neutral-900 shadow-xs' 
                        : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200'
                    }`}
                  >
                    Não lidas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('overdue')}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center space-x-1 border ${
                      filterType === 'overdue' 
                        ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-xs' 
                        : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200'
                    }`}
                    title="E-mails em atraso ou que aguardam resposta"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Em Atraso</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('attachments')}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center space-x-1 border ${
                      filterType === 'attachments' 
                        ? 'bg-neutral-900 text-white font-bold border-neutral-900 shadow-xs' 
                        : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200'
                    }`}
                  >
                    <Paperclip className="w-3 h-3" />
                    <span>Anexos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('starred')}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center space-x-1 border ${
                      filterType === 'starred' 
                        ? 'bg-neutral-900 text-white font-bold border-neutral-900 shadow-xs' 
                        : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200'
                    }`}
                  >
                    <Star className="w-3 h-3" />
                    <span>Estrela</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('pinned')}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center space-x-1 border ${
                      filterType === 'pinned' 
                        ? 'bg-neutral-900 text-white font-bold border-neutral-900 shadow-xs' 
                        : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200'
                    }`}
                  >
                    <Pin className="w-3 h-3" />
                    <span>Fixados</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('priority')}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center space-x-1 border ${
                      filterType === 'priority' 
                        ? 'bg-neutral-900 text-white font-bold border-neutral-900 shadow-xs' 
                        : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200'
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
          {/* Date & Month Filters */}
          {!isFiltersCollapsed && (
            <div className="px-3 py-2 border-b border-neutral-100 flex items-center space-x-1.5 text-[11px] font-semibold overflow-x-auto bg-white">
              <button
                type="button"
                onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
                className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition cursor-pointer border ${
                  dateFilter === 'today'
                    ? 'bg-neutral-900 text-white font-bold border-neutral-900 shadow-xs'
                    : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setDateFilter(dateFilter === 'week' ? 'all' : 'week')}
                className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition cursor-pointer border ${
                  dateFilter === 'week'
                    ? 'bg-neutral-900 text-white font-bold border-neutral-900 shadow-xs'
                    : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200'
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setDateFilter(dateFilter === 'month' ? 'all' : 'month')}
                className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition cursor-pointer border ${
                  dateFilter === 'month'
                    ? 'bg-neutral-900 text-white font-bold border-neutral-900 shadow-xs'
                    : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200'
                }`}
              >
                Este Mês
              </button>
              <select
                value={dateFilter.startsWith('m:') ? dateFilter : 'all'}
                onChange={(e) => setDateFilter(e.target.value as 'all' | `m:${number}`)}
                aria-label="Filtrar por mês"
                className={`px-2 py-1 rounded-xl border text-[11px] font-semibold outline-none cursor-pointer transition ${
                  dateFilter.startsWith('m:')
                    ? 'bg-neutral-900 text-white font-bold border-neutral-900 shadow-xs'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border-neutral-200'
                }`}
              >
                <option value="all" className="bg-white text-neutral-900">Por mês...</option>
                <option value="m:0" className="bg-white text-neutral-900">Jan</option>
                <option value="m:1" className="bg-white text-neutral-900">Fev</option>
                <option value="m:2" className="bg-white text-neutral-900">Mar</option>
                <option value="m:3" className="bg-white text-neutral-900">Abr</option>
                <option value="m:4" className="bg-white text-neutral-900">Mai</option>
                <option value="m:5" className="bg-white text-neutral-900">Jun</option>
                <option value="m:6" className="bg-white text-neutral-900">Jul</option>
                <option value="m:7" className="bg-white text-neutral-900">Ago</option>
                <option value="m:8" className="bg-white text-neutral-900">Set</option>
                <option value="m:9" className="bg-white text-neutral-900">Out</option>
                <option value="m:10" className="bg-white text-neutral-900">Nov</option>
                <option value="m:11" className="bg-white text-neutral-900">Dez</option>
              </select>
              {dateFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setDateFilter('all')}
                  className="px-2 py-1 rounded-xl text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 whitespace-nowrap transition cursor-pointer"
                  title="Limpar filtro de data"
                >
                  Limpar
                </button>
              )}
            </div>
          )}

          {/* Bulk Selection Toolbar */}
          {displayMessages.length > 0 && (
            <div className="px-3 py-2 border-b border-neutral-100 bg-neutral-50/80 flex items-center justify-between gap-2 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer select-none text-neutral-700 font-semibold hover:text-neutral-900">
                <input
                  type="checkbox"
                  checked={displayMessages.length > 0 && displayMessages.every(m => selectedIds.has(m.id))}
                  onChange={() => toggleSelectAll(displayMessages)}
                  className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-900 accent-neutral-900 cursor-pointer"
                />
                <span>
                  {selectedIds.size > 0
                    ? `${selectedIds.size} selecionado${selectedIds.size > 1 ? 's' : ''}`
                    : 'Selecionar tudo'}
                </span>
              </label>
              {selectedIds.size > 0 && (
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="px-2 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 rounded-lg transition cursor-pointer"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Eliminar ({selectedIds.size})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 relative">
            {/* Barra de Processamento / Sincronização Ativa com Contagem de Percentagem até 100% */}
            {isSyncVisible && (
              <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50/95 via-sky-50/95 to-indigo-50/95 border-b border-blue-200/80 px-4 py-2.5 flex items-center justify-between text-xs text-blue-900 shadow-xs backdrop-blur-md transition-all duration-200">
                <div className="flex items-center space-x-2 min-w-0">
                  {syncPercentage >= 100 ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 animate-in zoom-in-50" />
                  ) : (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 shrink-0" />
                  )}
                  <span className="font-bold text-[11px] tracking-tight truncate">
                    {syncPercentage >= 100 ? 'Sincronização 100% concluída!' : 'A processar e a sincronizar e-mails...'}
                  </span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md tabular-nums tracking-wider ${
                    syncPercentage >= 100 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {syncPercentage}%
                  </span>
                </div>
                <div className="flex items-center space-x-2 ml-3 shrink-0">
                  <div className="w-24 sm:w-36 h-2 bg-blue-100 border border-blue-200/60 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-200 ease-out ${
                        syncPercentage >= 100 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                          : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(8, syncPercentage))}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {isLoadingMessages && displayMessages.length === 0 ? (
              // Skeleton Loading
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 mx-2 my-2 animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="w-4 h-4 bg-neutral-200 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-neutral-200 rounded w-1/3" />
                        <div className="h-3 bg-neutral-200 rounded w-16" />
                      </div>
                      <div className="h-4 bg-neutral-200 rounded w-2/3" />
                      <div className="h-3 bg-neutral-200 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))
            ) : displayMessages.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-xs my-auto">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-neutral-600">Nenhuma mensagem nesta pasta.</p>
              </div>
            ) : (
              displayMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const hasAtt = msg.attachments && msg.attachments.length > 0;
                const securityCheck = analyzeEmailSecurity(msg, selectedAccountEmail, trustedSenders);
                const isOverdue = isMessageOverdue(msg);
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3.5 sm:p-4 cursor-pointer transition-all duration-150 flex items-start space-x-2.5 sm:space-x-3 rounded-2xl mx-2 my-1.5 ${
                      isSelected
                        ? 'bg-neutral-100 border-l-4 border-l-neutral-900 border-y border-r border-neutral-200 shadow-2xs'
                        : msg.pinned
                        ? 'bg-neutral-50 border border-neutral-200 shadow-2xs hover:bg-neutral-100/70'
                        : msg.isRead
                        ? 'bg-white hover:bg-neutral-50/80 border border-transparent'
                        : 'bg-white hover:bg-neutral-50 border border-neutral-200/90 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2 shrink-0 pt-0.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(msg.id)}
                        onChange={(e) => toggleSelectId(msg.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        title="Selecionar e-mail"
                        className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-900 accent-neutral-900 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(msg.id, e)}
                        className="text-neutral-300 hover:text-neutral-700 transition"
                        title={msg.starred ? 'Remover estrela' : 'Marcar com estrela'}
                      >
                        <Star className={`h-4 w-4 ${msg.starred ? 'fill-neutral-900 text-neutral-900' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(msg.id, e)}
                        className={`transition ${msg.pinned ? 'text-neutral-900' : 'text-neutral-300 hover:text-neutral-700'}`}
                        title={msg.pinned ? 'Desafixar mensagem do topo' : 'Fixar mensagem no topo'}
                      >
                        <Pin className={`h-3.5 w-3.5 ${msg.pinned ? 'fill-neutral-900 text-neutral-900' : ''}`} />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1.5 truncate">
                          {!msg.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0 inline-block" />
                          )}
                          <span className={`text-xs sm:text-sm truncate ${msg.isRead ? 'text-neutral-700 font-medium' : 'text-neutral-900 font-bold'}`}>
                            {msg.folder === 'scheduled' || msg.folder === 'sent'
                              ? `Para: ${msg.toEmail}`
                              : msg.fromName}
                          </span>
                          {msg.folder === 'scheduled' && msg.scheduledFor && (
                            <span
                              className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 flex items-center space-x-1"
                              title="Envio programado automaticamente"
                            >
                              <Calendar className="w-2.5 h-2.5 text-emerald-600" />
                              <span>
                                {new Date(msg.scheduledFor).toLocaleDateString('pt-MZ', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </span>
                          )}
                          {msg.pinned && (
                            <span className="bg-neutral-100 text-neutral-800 text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 border border-neutral-200 flex items-center space-x-1">
                              <Pin className="w-2.5 h-2.5" />
                              <span>Fixado</span>
                            </span>
                          )}
                          {msg.priority === 'high' && (
                            <span className="bg-neutral-900 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 flex items-center space-x-1">
                              <Flame className="w-2.5 h-2.5" />
                              <span className="hidden sm:inline">Urgente</span>
                            </span>
                          )}
                          {securityCheck.level === 'high' && (
                            <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md shrink-0 flex items-center space-x-1" title="E-mail altamente suspeito / possível phishing">
                              <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                              <span>Perigo</span>
                            </span>
                          )}
                          {securityCheck.level === 'medium' && (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 flex items-center space-x-1" title="Remetente ou conteúdo suspeito">
                              <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                              <span>Suspeito</span>
                            </span>
                          )}
                          {isOverdue && securityCheck.level === 'safe' && (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold px-1.5 py-0.2 rounded-md shrink-0 flex items-center space-x-1" title="Este e-mail aguarda a sua resposta">
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              <span className="hidden sm:inline">Sem resposta</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 ml-2 shrink-0">
                          {hasAtt && <Paperclip className="h-3.5 w-3.5 text-neutral-400" />}
                          <span className="text-[10px] sm:text-[11px] text-neutral-400 whitespace-nowrap font-medium" title={formatFullMessageDate(msg.date)}>
                            {formatFullMessageDate(msg.date)}
                          </span>
                          {/* Certo azul no canto para mensagens lidas */}
                          {msg.isRead ? (
                            <span className="inline-flex items-center text-blue-500 animate-in fade-in duration-200" title="Mensagem lida">
                              <CheckCheck className="h-3.5 w-3.5 stroke-[2.3]" />
                            </span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 inline-block" title="Não lida" />
                          )}
                        </div>
                      </div>
                      <h4 className={`text-xs sm:text-sm truncate mb-0.5 ${msg.isRead ? 'text-neutral-800 font-medium' : 'text-neutral-900 font-bold'}`}>
                        {msg.subject}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-neutral-500 truncate leading-relaxed">
                        {getSnippetText(msg.textPreview, msg.body)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Message Viewer Pane - Mobile First */}
        <main className={`w-full flex-1 min-h-0 bg-gray-50 flex flex-col overflow-y-auto ${selectedMessage ? 'flex' : 'hidden md:flex'}`}>
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
              {/* Header card (Substituído temporariamente pelo Card Cinematográfico de Boas-Vindas / Novos E-mails e depois retorna suavemente) */}
              {floatingBriefing && floatingBriefing.isOpen && mailboxPassword ? (() => {
                const { greeting, period, userName } = getDynamicUserGreeting();
                const GreetingIcon = period === 'morning' ? Sun : period === 'afternoon' ? Sunset : Moon;
                const greetingIconColor =
                  period === 'morning'
                    ? 'text-amber-400'
                    : period === 'afternoon'
                    ? 'text-orange-400'
                    : 'text-indigo-300';
                const hasPendingItems =
                  floatingBriefing.unreadCount > 0 ||
                  floatingBriefing.overdueCount > 0 ||
                  floatingBriefing.urgentCount > 0;

                return (
                  <div
                    className={`relative w-full bg-neutral-950 text-white rounded-3xl border border-emerald-500/35 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45),0_0_35px_-10px_rgba(16,185,129,0.28)] overflow-hidden ${
                      floatingBriefing.isClosing ? 'cinematic-card-exit' : 'cinematic-card-enter'
                    }`}
                  >
                    {/* Feixe de Luz Cinematográfico (Light Sweep Glint) */}
                    <div className="cinematic-light-sweep pointer-events-none absolute inset-0 z-10" />
                    <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-emerald-500/15 blur-2xl" />

                    <div className="relative z-20 px-4 py-3 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-600/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                          <Bell className="w-4 h-4 animate-bounce" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5 truncate">
                            <GreetingIcon className={`w-4 h-4 shrink-0 ${greetingIconColor}`} />
                            <span>
                              {`${greeting}, ${userName}!`}
                            </span>
                          </h3>
                          {floatingBriefing.latestSender ? (
                            <p className="text-xs text-neutral-300 truncate max-w-xs sm:max-w-md mt-0.5">
                              <span className="text-neutral-400">Mais recente: </span>
                              <strong className="text-white font-medium">{floatingBriefing.latestSender}</strong>
                              {floatingBriefing.latestSubject ? ` — ${floatingBriefing.latestSubject}` : ''}
                            </p>
                          ) : !hasPendingItems ? (
                            <p className="text-xs text-emerald-400/90 mt-0.5">Caixa de entrada 100% em dia!</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {hasPendingItems && floatingBriefing.unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentFolder('inbox');
                              setFilterType('unread');
                              const firstUnread = messages.find((m) => !m.isRead);
                              if (firstUnread) handleSelectMessage(firstUnread);
                              dismissFloatingBriefing();
                            }}
                            className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Ver Novos ({floatingBriefing.unreadCount})</span>
                          </button>
                        )}
                        {hasPendingItems && floatingBriefing.overdueCount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentFolder('inbox');
                              setFilterType('overdue');
                              const firstOverdue = messages.find((m) => isMessageOverdue(m));
                              if (firstOverdue) handleSelectMessage(firstOverdue);
                              dismissFloatingBriefing();
                            }}
                            className="py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Em Atraso ({floatingBriefing.overdueCount})</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={dismissFloatingBriefing}
                          className="text-neutral-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
                          title="Fechar notificação"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Barra de progresso visual de retorno automático ao cabeçalho normal */}
                    <div className="h-1 w-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 transition-all"
                        style={{
                          animation: 'shrinkWidth 8.5s linear forwards',
                        }}
                      />
                    </div>
                    <style>{`
                      @keyframes cinematicEnter3D {
                        0% {
                          opacity: 0;
                          transform: perspective(1100px) translate3d(0, -18px, -60px) rotateX(10deg) scale(0.96);
                          filter: blur(10px);
                        }
                        60% {
                          opacity: 1;
                          transform: perspective(1100px) translate3d(0, 2px, 6px) rotateX(-1deg) scale(1.005);
                          filter: blur(0px);
                        }
                        100% {
                          opacity: 1;
                          transform: perspective(1100px) translate3d(0, 0, 0) rotateX(0deg) scale(1);
                          filter: blur(0px);
                        }
                      }
                      @keyframes cinematicExit3D {
                        0% {
                          opacity: 1;
                          transform: perspective(1100px) translate3d(0, 0, 0) scale(1);
                          filter: blur(0px);
                        }
                        100% {
                          opacity: 0;
                          transform: perspective(1100px) translate3d(0, -14px, -45px) rotateX(8deg) scale(0.96);
                          filter: blur(8px);
                        }
                      }
                      @keyframes cinematicLightSweepAnim {
                        0% {
                          transform: translateX(-130%) skewX(-22deg);
                        }
                        100% {
                          transform: translateX(220%) skewX(-22deg);
                        }
                      }
                      @keyframes cinematicStaggerReveal {
                        0% {
                          opacity: 0;
                          transform: translateY(10px);
                          filter: blur(5px);
                        }
                        100% {
                          opacity: 1;
                          transform: translateY(0);
                          filter: blur(0px);
                        }
                      }
                      .cinematic-card-enter {
                        animation: cinematicEnter3D 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        transform-origin: top center;
                        will-change: transform, opacity, filter;
                      }
                      .cinematic-card-exit {
                        animation: cinematicExit3D 0.48s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                        transform-origin: top center;
                        will-change: transform, opacity, filter;
                      }
                      .cinematic-light-sweep {
                        background: linear-gradient(
                          110deg,
                          transparent 20%,
                          rgba(16, 185, 129, 0.16) 45%,
                          rgba(255, 255, 255, 0.28) 50%,
                          rgba(16, 185, 129, 0.12) 55%,
                          transparent 80%
                        );
                        animation: cinematicLightSweepAnim 1.3s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
                      }
                      .cinematic-stagger-1 {
                        opacity: 0;
                        animation: cinematicStaggerReveal 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
                      }
                      .cinematic-stagger-2 {
                        opacity: 0;
                        animation: cinematicStaggerReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
                      }
                      @keyframes shrinkWidth {
                        from { width: 100%; }
                        to { width: 0%; }
                      }
                    `}</style>
                  </div>
                );
              })() : (
              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-200 space-y-4 animate-in fade-in duration-300">
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
                          <Flame className="w-3 h-3 text-rose-600 fill-rose-600" />
                          <span>Alta Prioridade</span>
                        </span>
                      )}
                      {selectedMessage.priority === 'low' && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200 flex items-center space-x-1 shrink-0">
                          <Flag className="w-3 h-3 text-blue-600" />
                          <span>Baixa Prioridade</span>
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900 leading-tight break-words">
                      {translatedEmail && translatedEmail.msgId === selectedMessage.id
                        ? translatedEmail.subject
                        : selectedMessage.subject}
                    </h2>
                    {translatedEmail && translatedEmail.msgId === selectedMessage.id && translatedEmail.subject !== selectedMessage.subject && (
                      <p className="text-[11px] text-neutral-400 font-medium mt-0.5 truncate">
                        Original: {selectedMessage.subject}
                      </p>
                    )}
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
                      className="p-2.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-2xl transition cursor-pointer"
                      title="Responder"
                    >
                      <Reply className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleReplyAllMessage()}
                      className="p-2.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-2xl transition cursor-pointer"
                      title="Responder a Todos"
                    >
                      <Reply className="h-4 w-4" style={{ transform: 'scaleX(-1)' }} />
                    </button>
                    <button
                      onClick={() => handleForwardMessage()}
                      className="p-2.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-2xl transition cursor-pointer"
                      title="Encaminhar"
                    >
                      <Forward className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleToggleStar(selectedMessage.id, e)}
                      className="p-2.5 hover:bg-neutral-100 rounded-2xl transition cursor-pointer"
                    >
                      <Star className={`h-4 w-4 ${selectedMessage.starred ? 'fill-neutral-900 text-neutral-900' : 'text-neutral-400'}`} />
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="p-2.5 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 rounded-2xl transition cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-neutral-100 gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      {selectedMessage.fromName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900 text-sm block">{selectedMessage.fromName}</span>
                      <span className="text-neutral-500 font-mono text-[11px] truncate max-w-[180px] sm:max-w-none block">&lt;{selectedMessage.fromEmail}&gt;</span>
                    </div>
                  </div>

                  {/* Priority Selector Pill */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1.5 bg-neutral-100 px-2.5 py-1 rounded-xl border border-neutral-200">
                      <Flag className="w-3 h-3 text-neutral-500" />
                      <span className="text-[10px] font-bold text-neutral-500">Prioridade:</span>
                      <select
                        value={selectedMessage.priority || 'normal'}
                        onChange={(e) => handleChangePriority(selectedMessage.id, e.target.value as any)}
                        className="bg-transparent text-xs font-bold text-neutral-800 outline-none cursor-pointer"
                      >
                        <option value="normal">Normal</option>
                        <option value="high">Alta Prioridade</option>
                        <option value="low">Baixa Prioridade</option>
                      </select>
                    </div>
                    <div className="text-right text-neutral-400 font-medium text-[11px] sm:text-xs flex items-center justify-end gap-1.5">
                      <span>{formatFullMessageDate(selectedMessage.date)}</span>
                      {selectedMessage.isRead && (
                        <span className="inline-flex items-center text-blue-500" title="Mensagem lida">
                          <CheckCheck className="h-3.5 w-3.5 stroke-[2.3]" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Escudo Inteligente Anti-Phishing & Segurança WEHOSTHERE */}
              {selectedMessage.folder === 'scheduled' && selectedMessage.scheduledFor && (
                <div className="bg-emerald-50/95 border border-emerald-300 rounded-2xl p-4 sm:p-5 text-emerald-950 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Envio Programado</span>
                        </span>
                        <h3 className="text-xs sm:text-sm font-extrabold mt-0.5">
                          Agendado para{' '}
                          {new Date(selectedMessage.scheduledFor).toLocaleDateString('pt-MZ', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </h3>
                        <p className="text-[11px] text-emerald-800">
                          Para: <strong className="font-mono">{selectedMessage.toEmail}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendScheduledNow(selectedMessage)}
                        disabled={sendingMsg}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-[11px] font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sendingMsg ? 'A enviar...' : 'Enviar Agora'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditScheduledMessage(selectedMessage)}
                        className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-[11px] font-bold transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar / Reagendar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelScheduledMessage(selectedMessage)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancelar Agendamento</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {(() => {
                const sec = analyzeEmailSecurity(selectedMessage, selectedAccountEmail, trustedSenders);
                if (sec.level === 'safe') return null;
                const isHigh = sec.level === 'high';
                return (
                  <div
                    className={`rounded-2xl p-4 sm:p-5 border shadow-xs space-y-3 transition-all ${
                      isHigh
                        ? 'bg-rose-50/95 border-rose-300 text-rose-950'
                        : 'bg-amber-50/95 border-amber-300 text-amber-950'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isHigh ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                          }`}
                        >
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                isHigh
                                  ? 'bg-rose-200/80 text-rose-900'
                                  : 'bg-amber-200/80 text-amber-900'
                              }`}
                            >
                              {isHigh ? (
                                <>
                                  <ShieldAlert className="w-3 h-3 text-rose-800 shrink-0" />
                                  <span>Risco Elevado Detetado</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 text-amber-800 shrink-0" />
                                  <span>Alerta de Segurança IA</span>
                                </>
                              )}
                            </span>
                          </div>
                          <h3 className="text-xs sm:text-sm font-extrabold mt-0.5">{sec.title}</h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(selectedMessage.id)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                            isHigh
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-amber-600 hover:bg-amber-700 text-white'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar E-mail</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTrustSender(selectedMessage.fromEmail)}
                          className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-xl text-[11px] font-semibold transition cursor-pointer"
                          title="Confiar neste remetente e ocultar alertas futuros"
                        >
                          Confiar no Remetente
                        </button>
                      </div>
                    </div>

                    <div className="pl-1 space-y-1.5 text-xs">
                      <p className="font-bold text-[11px] uppercase tracking-wider opacity-80">
                        Motivos identificados pela verificação inteligente:
                      </p>
                      <ul className="space-y-1">
                        {sec.reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start space-x-2 leading-relaxed">
                            <span className={`font-bold mt-0.5 ${isHigh ? 'text-rose-600' : 'text-amber-600'}`}>•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border text-[11px] flex items-start space-x-2 ${
                        isHigh
                          ? 'bg-rose-100/70 border-rose-200 text-rose-900'
                          : 'bg-amber-100/70 border-amber-200 text-amber-900'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold block">Recomendações de Proteção WEHOSTHERE:</span>
                        <span>{sec.tips.join(' ')}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* AI Assistant Smart Bar (Clean Minimalist) */}
              <div className="bg-neutral-900 rounded-2xl px-3 py-2 text-white shadow-sm border border-neutral-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Tradução compacta (PT / EN) */}
                    <div className="flex items-center bg-white/10 border border-white/10 rounded-xl p-0.5">
                      <span className="px-1.5 text-neutral-400 flex items-center" title="Traduzir e-mail">
                        <Globe className="h-3.5 w-3.5" />
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTranslateEmail('pt')}
                        disabled={isTranslatingEmail !== null}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                          translatedEmail?.msgId === selectedMessage.id && translatedEmail?.lang === 'pt'
                            ? 'bg-white text-neutral-900'
                            : 'text-white/85 hover:bg-white/15'
                        }`}
                        title="Traduzir e-mail para Português"
                      >
                        {isTranslatingEmail === 'pt' && <Loader2 className="h-3 w-3 animate-spin" />}
                        <span>PT</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTranslateEmail('en')}
                        disabled={isTranslatingEmail !== null}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                          translatedEmail?.msgId === selectedMessage.id && translatedEmail?.lang === 'en'
                            ? 'bg-white text-neutral-900'
                            : 'text-white/85 hover:bg-white/15'
                        }`}
                        title="Traduzir e-mail para Inglês (English)"
                      >
                        {isTranslatingEmail === 'en' && <Loader2 className="h-3 w-3 animate-spin" />}
                        <span>EN</span>
                      </button>
                      {translatedEmail?.msgId === selectedMessage.id && (
                        <button
                          type="button"
                          onClick={() => setTranslatedEmail(null)}
                          className="px-1.5 py-1 rounded-lg text-[10px] font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                          title="Voltar ao idioma original"
                        >
                          Original
                        </button>
                      )}
                    </div>

                    {/* Ouvir E-mail (Ícone) */}
                    <button
                      type="button"
                      onClick={() => handleSpeakEmailText('email')}
                      className={`p-2 rounded-xl transition flex items-center justify-center cursor-pointer border ${
                        isSpeakingEmail && speakingSource === 'email'
                          ? 'bg-white text-neutral-900 border-white'
                          : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                      }`}
                      title={isSpeakingEmail && speakingSource === 'email' ? 'A ouvir e-mail...' : 'Ouvir e-mail em áudio'}
                      aria-label="Ouvir e-mail"
                    >
                      {isSpeakingEmail && speakingSource === 'email' ? (
                        <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                      ) : (
                        <Headphones className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {/* Resumir com IA (Ícone) */}
                    <button
                      type="button"
                      onClick={handleSummarizeWithAI}
                      disabled={isGeneratingSummary}
                      className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl transition flex items-center justify-center disabled:opacity-50 cursor-pointer"
                      title={isGeneratingSummary ? 'A resumir...' : 'Resumir e-mail'}
                      aria-label="Resumir e-mail"
                    >
                      {isGeneratingSummary ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleGenerateAIReply('quick_accept')}
                      disabled={isGeneratingReply}
                      className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-900 rounded-xl text-[11px] font-semibold transition shadow-xs cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>

                {/* Mini Player de Áudio do E-mail (Quando a leitura por voz está ativa) */}
                {isSpeakingEmail && speakingSource === 'email' && (
                  <div className="p-3 bg-white/[0.08] rounded-xl border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-200">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <Volume2 className={`h-4 w-4 ${!isPausedSpeech ? 'animate-pulse' : ''}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-white truncate">
                            {isPausedSpeech ? 'Leitura em Áudio Pausada' : 'A Ler E-mail em Voz Alta'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold">
                            {speechSpeed}x
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 truncate">
                          {selectedMessage.subject || '(Sem assunto)'} — {selectedMessage.fromName || selectedMessage.fromEmail}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={handleCycleSpeechSpeed}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-extrabold transition cursor-pointer border border-white/10"
                        title="Alterar velocidade de leitura (1x, 1.25x, 1.5x)"
                      >
                        {speechSpeed}x
                      </button>
                      <button
                        type="button"
                        onClick={handleTogglePauseEmailSpeech}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1"
                        title={isPausedSpeech ? 'Continuar leitura' : 'Pausar leitura'}
                      >
                        {isPausedSpeech ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3 fill-current" />}
                        <span>{isPausedSpeech ? 'Continuar' : 'Pausar'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStopEmailSpeech}
                        className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                        title="Parar leitura"
                      >
                        <Square className="h-3 w-3 fill-current" />
                        <span>Parar</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Summary Box */}
                {aiSummary && (() => {
                  const cleaned = cleanAiText(aiSummary);
                  const rawLines = cleaned
                    .split(/\n+/)
                    .map(l => l.trim())
                    .filter(Boolean);

                  const bulletLines: string[] = [];
                  let actionLine = '';

                  for (const line of rawLines) {
                    const lower = line.toLowerCase();
                    if (lower.includes('resumo inteligente da mensagem')) {
                      continue;
                    }
                    if (lower.startsWith('💡') || lower.includes('ação recomendada:')) {
                      actionLine = line.replace(/^💡\s*/i, '').replace(/^ação recomendada:\s*/i, '').trim();
                    } else {
                      bulletLines.push(line.replace(/^[•\-\*]\s*/, '').trim());
                    }
                  }

                  return (
                    <div className="p-3.5 sm:p-4 bg-white/[0.07] rounded-xl border border-white/15 text-xs text-neutral-100 relative space-y-2.5">
                      <div className="flex items-center justify-between pr-6">
                        <div className="flex items-center space-x-2">
                          <Pin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="font-bold text-white tracking-wide text-xs sm:text-[13px]">
                            Resumo Inteligente da Mensagem
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAiSummary(null)}
                          className="absolute top-3 right-3 text-white/50 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
                          title="Fechar resumo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <ul className="space-y-1.5 pl-1">
                        {bulletLines.map((item, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-neutral-200 leading-relaxed">
                            <span className="text-emerald-400 font-bold mt-0.5 shrink-0">•</span>
                            <span className="flex-1">{item}</span>
                          </li>
                        ))}
                      </ul>

                      {actionLine && (
                        <div className="pt-2 mt-2 border-t border-white/10 flex items-start space-x-2 text-[11px] sm:text-xs text-amber-200/95">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white">Ação recomendada: </span>
                            <span>{actionLine}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Body card */}
              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-2xs border border-neutral-200 flex-1 space-y-4">
                {translatedEmail && translatedEmail.msgId === selectedMessage.id ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs">
                      <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                        <Languages className="h-4 w-4 text-emerald-700 shrink-0" />
                        <span>
                          {translatedEmail.lang === 'pt'
                            ? 'E-mail traduzido para Português (PT)'
                            : 'E-mail traduzido para Inglês (EN)'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleTranslateEmail(translatedEmail.lang === 'pt' ? 'en' : 'pt')}
                          disabled={isTranslatingEmail !== null}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3 text-emerald-600" />
                          <span>{translatedEmail.lang === 'pt' ? 'Ver em Inglês' : 'Ver em Português'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTranslatedEmail(null)}
                          className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          Ver Original
                        </button>
                      </div>
                    </div>
                    <div className="whitespace-pre-line text-sm text-neutral-900 leading-relaxed font-sans font-normal">
                      {translatedEmail.body}
                    </div>
                  </div>
                ) : (() => {
                  let cleanBody = stripRawHeaders(selectedMessage.body);
                  if (cleanBody.includes('&lt;') && cleanBody.includes('&gt;')) {
                    cleanBody = decodeHtmlEntities(cleanBody);
                  }
                  const isHtml = /<[a-z][\s\S]*>/i.test(cleanBody);
                  if (isHtml) {
                    cleanBody = rewriteEmailImages(cleanBody, selectedMessage.attachments);
                  }
                  return isHtml ? (
                    <div 
                      className="prose prose-sm max-w-none text-neutral-900 font-sans break-words overflow-x-auto leading-relaxed [&_p]:my-1.5 [&_div]:my-1 [&_*]:text-neutral-900 [&_img]:max-w-full [&_img]:h-auto [&_img]:inline-block"
                      ref={(el) => {
                        // Ocultar imagens que mesmo assim não carregam (evita o ícone de imagem quebrada)
                        if (!el) return;
                        el.querySelectorAll('img').forEach((img) => {
                          img.onerror = () => { img.style.display = 'none'; };
                          if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) {
                            img.style.display = 'none';
                          }
                        });
                      }}
                      dangerouslySetInnerHTML={{ __html: cleanBody }}
                    />
                  ) : (
                    <div className="whitespace-pre-line text-sm text-neutral-900 leading-relaxed font-sans font-normal">
                      {cleanBody}
                    </div>
                  );
                })()}

                {/* Exibição de Ficheiros Anexados */}
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-neutral-100 space-y-2">
                    <span className="text-xs font-bold text-neutral-800 flex items-center space-x-1.5">
                      <Paperclip className="h-4 w-4 text-neutral-600" />
                      <span>{selectedMessage.attachments.length} Ficheiro(s) Anexado(s)</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedMessage.attachments.map((att, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const attUrl = att.url && att.url.startsWith('/api/webmail/attachment') && !att.url.includes('&password=') && mailboxPassword
                              ? `${att.url}&password=${encodeURIComponent(mailboxPassword)}`
                              : att.url;
                            setPreviewAttachment({ ...att, url: attUrl });
                          }}
                          className="p-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 flex items-center justify-between transition group cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <FileText className="h-4 w-4 text-neutral-600 shrink-0" />
                            <span className="text-xs font-bold text-neutral-800 truncate group-hover:text-black">{att.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {att.type?.startsWith('image/') && (
                              <ImageIcon className="h-3.5 w-3.5 text-neutral-400" />
                            )}
                            <Download className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-900 shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Reply Form */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-neutral-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-neutral-700 flex items-center space-x-1.5">
                    <Reply className="h-4 w-4 text-neutral-600" />
                    <span className="truncate">Resposta rápida para <span className="font-mono text-neutral-900">{selectedMessage.fromEmail}</span></span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleGenerateAIReply('smart', hasAiGeneratedReply && !!replyText.trim())}
                      disabled={isGeneratingReply}
                      className="px-3 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 border border-neutral-900 bg-neutral-900 hover:bg-black text-white shadow-2xs disabled:opacity-50 active:scale-95"
                      title={
                        hasAiGeneratedReply && replyText.trim()
                          ? 'Gerar uma versão alternativa diferente da resposta atual'
                          : 'Gerar resposta automática com base no e-mail'
                      }
                    >
                      {isGeneratingReply ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      ) : hasAiGeneratedReply && replyText.trim() ? (
                        <RefreshCw className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <Wand2 className="h-3.5 w-3.5 text-white" />
                      )}
                      <span>
                        {isGeneratingReply
                          ? 'A gerar...'
                          : hasAiGeneratedReply && replyText.trim()
                          ? `Outra (v${(aiReplyVariation % 3) + 1})`
                          : 'Gerar Resposta'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isRecordingVoice && voiceTargetMode === 'quick_reply') {
                          stopVoiceRecording();
                        } else {
                          setVoiceTranscript('');
                          setVoiceInterimTranscript('');
                          startVoiceRecording('quick_reply');
                        }
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                        isRecordingVoice && voiceTargetMode === 'quick_reply'
                          ? 'bg-neutral-900 text-white border-neutral-900 animate-pulse shadow-sm'
                          : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                      }`}
                      title="Ditar resposta por voz"
                    >
                      {isRecordingVoice && voiceTargetMode === 'quick_reply' ? (
                        <>
                          <MicOff className="h-3.5 w-3.5 text-white" />
                          <span>Parar</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-3.5 w-3.5 text-neutral-600" />
                          <span>Voz</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSpeakEmailText('quick_reply')}
                      disabled={!replyText.trim() && !(isSpeakingEmail && speakingSource === 'quick_reply')}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 border disabled:opacity-40 ${
                        isSpeakingEmail && speakingSource === 'quick_reply'
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                          : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                      }`}
                      title="Ouvir em áudio a resposta escrita"
                    >
                      {isSpeakingEmail && speakingSource === 'quick_reply' ? (
                        <>
                          <VolumeX className="h-3.5 w-3.5 animate-pulse" />
                          <span>Parar</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5 text-neutral-600" />
                          <span>Ouvir</span>
                        </>
                      )}
                    </button>
                    <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-neutral-100 p-0.5">
                      <span className="px-1.5 text-neutral-500 flex items-center" title="Traduzir resposta">
                        <Languages className="h-3 w-3" />
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTranslateQuickReply('pt')}
                        disabled={isTranslatingQuickReply !== null || !replyText.trim()}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-neutral-700 hover:bg-white hover:text-neutral-900 transition flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                        title="Traduzir esta resposta para Português"
                      >
                        {isTranslatingQuickReply === 'pt' && <Loader2 className="h-3 w-3 animate-spin text-neutral-700" />}
                        <span>PT</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTranslateQuickReply('en')}
                        disabled={isTranslatingQuickReply !== null || !replyText.trim()}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-neutral-700 hover:bg-white hover:text-neutral-900 transition flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                        title="Traduzir esta resposta para Inglês"
                      >
                        {isTranslatingQuickReply === 'en' && <Loader2 className="h-3 w-3 animate-spin text-neutral-700" />}
                        <span>EN</span>
                      </button>
                    </div>
                    <span className="text-[11px] text-neutral-400 hidden sm:inline">Shift + Enter para nova linha</span>
                  </div>
                </div>

                {/* Painel Voice-to-Email na Resposta Rápida */}
                {(voiceTargetMode === 'quick_reply' && (isRecordingVoice || voiceTranscript || voiceInterimTranscript)) && (
                  <div className="p-3 bg-neutral-950 text-white rounded-2xl border border-neutral-800 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isRecordingVoice ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                          {isRecordingVoice ? 'A ouvir a sua voz em tempo real...' : 'Voz captada — Pronta para transformar'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          stopVoiceRecording();
                          setVoiceTranscript('');
                          setVoiceInterimTranscript('');
                        }}
                        className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-neutral-200 italic bg-white/5 p-2.5 rounded-xl border border-white/10 min-h-[38px]">
                      "{`${voiceTranscript} ${voiceInterimTranscript}`.trim() || 'Fale naturalmente, ex: "Diz que já recebemos o documento e vamos aprovar hoje à tarde"...'}"
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleConvertVoiceToProfessionalEmail('quick_reply')}
                        disabled={isConvertingVoiceToEmail || !`${voiceTranscript} ${voiceInterimTranscript}`.trim()}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-neutral-950 font-extrabold text-[11px] rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        {isConvertingVoiceToEmail ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="h-3.5 w-3.5" />
                        )}
                        <span>{isConvertingVoiceToEmail ? 'A transformar em E-mail Profissional...' : 'Transformar em Resposta Profissional'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Sugestões Inteligentes de Resposta Rápida (1 Clique - Tesla Style) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-700 flex items-center space-x-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-neutral-600" />
                      <span>Sugestões Rápidas:</span>
                    </span>
                    <span className="text-[10px] text-neutral-400">Clique para preencher</span>
                  </div>
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {getSmartReplies(selectedMessage.subject, selectedMessage.body).map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplyText(sug)}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-900 text-[11px] font-semibold rounded-xl border border-neutral-200/80 shadow-2xs whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 flex items-center space-x-1.5 shrink-0"
                        title="Usar esta resposta"
                      >
                        <MessageSquare className="h-3 w-3 text-neutral-500 shrink-0" />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={Math.min(12, Math.max(3, replyText ? replyText.split('\n').length + 1 : 3))}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escreva a sua resposta ou clique em «Gerar Resposta IA»..."
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 outline-none focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-sans resize-y transition leading-relaxed"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {quickReplyStatus !== 'idle' && (
                    <span className={`text-xs font-bold ${quickReplyStatus === 'sent' ? 'text-neutral-900' : 'text-rose-600'}`}>
                      {quickReplyStatus === 'sent' ? '✅ Enviada com sucesso!' : 'Erro ao enviar.'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSendQuickReply}
                    disabled={!replyText.trim() || quickReplySending}
                    className="ml-auto px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-1.5 active:scale-98"
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
          ) : (
            <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center text-center">
              {/* Imagem de fundo */}
              <img
                src="/webbackground2.jpg"
                alt="background"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
              {/* Overlay escuro semitransparente para legibilidade */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

              {/* Indicador de processamento discreto integrado na área de fundo (glassmorphism) */}
              {(isLoadingMessages || isRefreshingWebmail) && (
                <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 flex items-center gap-2 px-3.5 py-1.5 bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-medium rounded-full shadow-lg animate-in fade-in duration-200 pointer-events-none">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400 shrink-0" />
                  <span className="drop-shadow-xs">A processar mensagens…</span>
                </div>
              )}

              {/* Conteúdo por cima */}
              <div className="relative z-10 flex flex-col items-center gap-4 px-8">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                  <Mail className="h-10 w-10 text-white/80" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg mb-1 drop-shadow-lg">Nenhum e-mail selecionado</h3>
                  <p className="text-sm text-white/70 drop-shadow max-w-xs">Selecione uma mensagem na lista à esquerda para visualizar.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCompose}
                  className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white text-sm font-medium rounded-full shadow-lg transition-all duration-200 active:scale-95"
                >
                  <Edit3 className="h-4 w-4" />
                  Escrever E-mail
                </button>
              </div>
            </div>
          )}
        </main>
        </>
        )}
      </div>

      {/* Mobile FAB: Escrever E-mail (Azul do Sistema) */}
      {!showCompose && (
        <button
          type="button"
          onClick={handleOpenCompose}
          className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 active:scale-95 border-2 border-white"
          title="Escrever E-mail"
        >
          <Edit3 className="h-6 w-6" />
        </button>
      )}
      </>
      )}

      {/* Mobile Bottom Sheet Menu */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 z-50 sm:hidden"
          onClick={() => setShowMobileMenu(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-5" />
            <h3 className="text-sm font-bold text-neutral-900 mb-4">Ações do Webmail</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { handleOpenCompose(); setShowMobileMenu(false); }}
                className="flex items-center space-x-3 p-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl transition cursor-pointer active:scale-95 shadow-xs"
              >
                <Edit3 className="h-5 w-5 text-white shrink-0" />
                <span className="text-sm font-bold text-white">Novo Email</span>
              </button>
              <button
                type="button"
                onClick={() => { setShowAgentModal(true); setShowMobileMenu(false); }}
                className={`flex items-center space-x-3 p-4 rounded-2xl transition cursor-pointer border active:scale-95 ${
                  agentActive
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border-indigo-200'
                }`}
              >
                <Bot className={`h-5 w-5 shrink-0 ${agentActive ? 'text-white' : 'text-indigo-600'}`} />
                <span className="text-sm font-bold">{agentActive ? 'Agente (ON)' : 'Agente IA'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setShowSignatureModal(true); setShowMobileMenu(false); }}
                className="flex items-center space-x-3 p-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-2xl transition cursor-pointer border border-neutral-200 active:scale-95"
              >
                <FileSignature className="h-5 w-5 text-neutral-600 shrink-0" />
                <span className="text-sm font-bold text-neutral-800">Assinatura</span>
              </button>
              <button
                type="button"
                onClick={handleOpenChangePassword}
                className="flex items-center space-x-3 p-4 bg-neutral-900 hover:bg-black text-white rounded-2xl transition cursor-pointer active:scale-95 shadow-xs"
              >
                <Key className="h-5 w-5 text-neutral-300 shrink-0" />
                <span className="text-sm font-bold text-white">Alterar Senha</span>
              </button>
              <button
                type="button"
                onClick={() => { handleWebmailLogout(); setShowMobileMenu(false); }}
                className="flex items-center space-x-3 p-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-2xl transition cursor-pointer border border-neutral-200 active:scale-95"
              >
                <LogOut className="h-5 w-5 text-neutral-600 shrink-0" />
                <span className="text-sm font-bold text-neutral-800">Sair do Webmail</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowMobileMenu(false)}
              className="mt-4 w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-sm rounded-2xl transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Escrever E-mail (Compose) */}
      {showCompose && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className={`bg-white rounded-3xl shadow-2xl p-4 sm:p-5 ${isComposeExpanded ? 'sm:max-w-4xl' : 'sm:max-w-2xl'} w-full border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto`}>
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
                <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100 mb-3">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="h-5 w-5 text-neutral-900" />
                    <h2 className="text-lg font-bold text-neutral-900">Novo E-mail</h2>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer border ${
                        showTemplateSelector 
                          ? 'bg-neutral-900 text-white border-neutral-900' 
                          : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border-neutral-200'
                      }`}
                      title="Usar Template"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs font-bold">Templates</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsComposeExpanded(!isComposeExpanded)}
                      className="hidden sm:flex p-2 hover:bg-neutral-100 text-neutral-600 rounded-xl transition cursor-pointer"
                      title={isComposeExpanded ? "Reduzir" : "Expandir"}
                    >
                      {isComposeExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseCompose}
                      className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Template Selector */}
                {showTemplateSelector && (
                  <div className="mb-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900 flex items-center space-x-2">
                          <Sparkles className="h-4 w-4 text-neutral-700" />
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
              <div className="py-10 px-4 text-center flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                {/* Glow ring & animated icon */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 animate-ping opacity-60 pointer-events-none" />
                  <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-[0_10px_30px_rgba(16,185,129,0.35)] transform transition-transform animate-in zoom-in-75 duration-300">
                    <Send className="h-7 w-7 text-white -translate-y-0.5 translate-x-0.5" />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                    {sentSuccessMsg.replace(/^[✅\s]+/, '')}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    A sua mensagem foi encriptada via TLS e despachada para o servidor de entrega com sucesso.
                  </p>
                </div>

                {/* Status chip */}
                <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-emerald-800 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Entrega Confirmada • IMAP &amp; SMTP Ativo</span>
                </div>

                {/* Progress bar animation */}
                <div className="w-48 h-1 bg-neutral-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full animate-pulse" style={{ width: '100%' }} />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-2.5">
                {composeError && (
                  <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{composeError}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setComposeError('')}
                      className="text-rose-400 hover:text-rose-700 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-0.5">
                      De (Remetente)
                    </label>
                    <input
                      type="text"
                      value={selectedAccountEmail}
                      disabled
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700">
                        Para (Destinatário)
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowCcBcc(!showCcBcc)}
                          className="text-[10px] font-bold text-primary-600 hover:text-primary-800 cursor-pointer"
                        >
                          {showCcBcc ? 'Ocultar CC/BCC' : '+ CC/BCC'}
                        </button>
                        {/* Ícone para abrir lista de contactos */}
                        <button
                          type="button"
                          onClick={() => setShowToPicker(!showToPicker)}
                          className="p-1 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition"
                          title="Selecionar contacto dos emails"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Campo de destinatários (vários e-mails) com seletor de contactos acoplado */}
                    <div className="relative">
                      <div className="pr-9">
                        <RecipientInput
                          value={composeTo}
                          onChange={setComposeTo}
                          contacts={knownContacts}
                          excludeEmails={[selectedAccountEmail]}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowToPicker(!showToPicker)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-primary-600 transition"
                        title="Ver contactos guardados"
                      >
                        <Users className="w-4 h-4" />
                      </button>

                      {/* Dropdown de selecção rápida de contactos (adiciona ao invés de substituir) */}
                      <ContactPicker
                        contacts={knownContacts}
                        value={composeTo}
                        onSelect={(email: string) => {
                          setComposeTo(normalizeRecipients(`${composeTo},${email}`));
                          setShowToPicker(false);
                        }}
                        open={showToPicker}
                        setOpen={setShowToPicker}
                      />
                    </div>
                  </div>
                </div>

                {showCcBcc && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-0.5">
                        CC (Cópia) <span className="normal-case font-medium text-gray-400">— vários e-mails</span>
                      </label>
                      <RecipientInput
                        value={composeCc}
                        onChange={setComposeCc}
                        contacts={knownContacts}
                        excludeEmails={[selectedAccountEmail]}
                        placeholder="email1@exemplo.com, email2@exemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-0.5">
                        BCC (Cópia Oculta) <span className="normal-case font-medium text-gray-400">— vários e-mails</span>
                      </label>
                      <RecipientInput
                        value={composeBcc}
                        onChange={setComposeBcc}
                        contacts={knownContacts}
                        excludeEmails={[selectedAccountEmail]}
                        placeholder="email1@exemplo.com, email2@exemplo.com"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-0.5">
                    Assunto
                  </label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Assunto da mensagem"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 font-sans"
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
                        onClick={() => {
                          setVoiceTargetMode('compose');
                          if (!showVoiceToEmailPanel) {
                            setShowVoiceToEmailPanel(true);
                            startVoiceRecording('compose');
                          } else {
                            if (isRecordingVoice) stopVoiceRecording();
                            setShowVoiceToEmailPanel(false);
                          }
                        }}
                        className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center space-x-1.5 shadow-2xs ${
                          showVoiceToEmailPanel || (isRecordingVoice && voiceTargetMode === 'compose')
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        }`}
                        title="Voice to Email: Fale e o sistema transforma a sua voz num e-mail profissional"
                      >
                        <Mic className={`w-3.5 h-3.5 ${isRecordingVoice && voiceTargetMode === 'compose' ? 'text-rose-400 animate-pulse' : 'text-rose-600'}`} />
                        <span>Voice to Email</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSpeakEmailText('compose')}
                        disabled={(!composeBody && !composeSubject) && !(isSpeakingEmail && speakingSource === 'compose')}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center space-x-1 disabled:opacity-50 ${
                          isSpeakingEmail && speakingSource === 'compose'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border-sky-200'
                        }`}
                        title="Ouvir em áudio o e-mail que escreveu antes de enviar"
                      >
                        {isSpeakingEmail && speakingSource === 'compose' ? (
                          <>
                            <VolumeX className="w-3 h-3 animate-pulse text-white" />
                            <span>Parar Áudio</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-sky-600" />
                            <span>Ouvir E-mail</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleImproveWithAI}
                        disabled={isImprovingDraft || !composeBody}
                        className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                        title="Aprimorar redação com IA"
                      >
                        {isImprovingDraft ? <Loader2 className="w-3 h-3 animate-spin text-purple-600" /> : <Sparkles className="w-3 h-3 text-purple-600" />}
                        <span>{isImprovingDraft ? 'Aprimorando...' : 'Melhorar com IA'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTranslateDraft('pt')}
                        disabled={isTranslatingDraft !== null || (!composeBody && !composeSubject)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                        title="Traduzir mensagem escrita para Português"
                      >
                        {isTranslatingDraft === 'pt' ? <Loader2 className="w-3 h-3 animate-spin text-emerald-600" /> : <Languages className="w-3 h-3 text-emerald-600" />}
                        <span>PT</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTranslateDraft('en')}
                        disabled={isTranslatingDraft !== null || (!composeBody && !composeSubject)}
                        className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200 transition cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                        title="Traduzir mensagem escrita para Inglês (English)"
                      >
                        {isTranslatingDraft === 'en' ? <Loader2 className="w-3 h-3 animate-spin text-indigo-600" /> : <Languages className="w-3 h-3 text-indigo-600" />}
                        <span>EN</span>
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

                  {/* 23. Painel Voice to Email (Falar -> Transformar em E-mail Corporativo Profissional) */}
                  {showVoiceToEmailPanel && (
                    <div className="mb-2.5 p-3.5 bg-neutral-950 text-white rounded-2xl border border-neutral-800 shadow-lg space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                            isRecordingVoice && voiceTargetMode === 'compose'
                              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse'
                              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                          }`}>
                            <Volume2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold tracking-tight text-white">
                                Voice to Email IA
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                isRecordingVoice && voiceTargetMode === 'compose'
                                  ? 'bg-rose-500 text-white animate-pulse'
                                  : 'bg-white/10 text-emerald-300'
                              }`}>
                                {isRecordingVoice && voiceTargetMode === 'compose' ? 'A Ouvir Microfone...' : 'Pronto'}
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-400">
                              Fale naturalmente (ex: "Diz ao João que já recebemos o pagamento e o serviço está ativo")
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <select
                            value={voiceTone}
                            onChange={(e) => setVoiceTone(e.target.value as any)}
                            className="px-2 py-1 bg-white/10 border border-white/15 rounded-lg text-[10px] font-bold text-white outline-none cursor-pointer"
                            title="Tom do E-mail"
                          >
                            <option value="professional" className="text-neutral-900">Tom: Corporativo</option>
                            <option value="formal" className="text-neutral-900">Tom: Executivo Formal</option>
                            <option value="friendly" className="text-neutral-900">Tom: Cordial / Próximo</option>
                          </select>
                          <select
                            value={voiceLang}
                            onChange={(e) => setVoiceLang(e.target.value as 'pt-PT' | 'en-US')}
                            className="px-2 py-1 bg-white/10 border border-white/15 rounded-lg text-[10px] font-bold text-white outline-none cursor-pointer"
                            title="Idioma da Voz"
                          >
                            <option value="pt-PT" className="text-neutral-900">Voz: PT</option>
                            <option value="en-US" className="text-neutral-900">Voice: EN</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              stopVoiceRecording();
                              setShowVoiceToEmailPanel(false);
                            }}
                            className="p-1 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
                            title="Fechar painel de voz"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {voiceError && (
                        <div className="px-2.5 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{voiceError}</span>
                        </div>
                      )}

                      <textarea
                        rows={2}
                        value={
                          voiceInterimTranscript
                            ? `${voiceTranscript}${voiceTranscript ? ' ' : ''}${voiceInterimTranscript}`
                            : voiceTranscript
                        }
                        onChange={(e) => {
                          setVoiceTranscript(e.target.value);
                          setVoiceInterimTranscript('');
                        }}
                        placeholder="A sua fala aparece aqui em tempo real (ou escreva um comando rápido como: 'Informa o cliente que a fatura foi emitida')..."
                        className="w-full px-3 py-2 bg-white/[0.07] border border-white/15 rounded-xl text-xs text-white placeholder-neutral-400 outline-none focus:border-emerald-400 resize-none font-sans"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isRecordingVoice && voiceTargetMode === 'compose') {
                                stopVoiceRecording();
                              } else {
                                startVoiceRecording('compose');
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                              isRecordingVoice && voiceTargetMode === 'compose'
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                            }`}
                          >
                            {isRecordingVoice && voiceTargetMode === 'compose' ? (
                              <>
                                <MicOff className="w-3.5 h-3.5" />
                                <span>Parar Microfone</span>
                              </>
                            ) : (
                              <>
                                <Mic className="w-3.5 h-3.5 text-rose-400" />
                                <span>{voiceTranscript ? 'Continuar a Falar' : 'Iniciar Microfone'}</span>
                              </>
                            )}
                          </button>
                          {voiceTranscript && (
                            <button
                              type="button"
                              onClick={() => {
                                setVoiceTranscript('');
                                setVoiceInterimTranscript('');
                              }}
                              className="px-2.5 py-1.5 text-[11px] font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
                            >
                              Limpar
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConvertVoiceToProfessionalEmail('compose')}
                          disabled={isConvertingVoiceToEmail || !`${voiceTranscript} ${voiceInterimTranscript}`.trim()}
                          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-extrabold text-[11px] rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md"
                        >
                          {isConvertingVoiceToEmail ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isConvertingVoiceToEmail
                              ? 'A estruturar E-mail Profissional...'
                              : 'Transformar em E-mail Profissional'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div
                    onMouseDownCapture={(e) => {
                      const target = e.target as HTMLElement | null;
                      if (target?.closest('.ql-toolbar') && !target.closest('input, select, textarea')) {
                        e.preventDefault();
                      }
                    }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement | null;
                      if (target?.closest('.ql-toolbar')) return;
                      if (typeof document !== 'undefined') {
                        const ql = document.querySelector('.webmail-quill-editor .ql-editor') as HTMLElement;
                        if (ql && document.activeElement !== ql) {
                          ql.focus();
                        }
                      }
                    }}
                    className={`bg-white border border-gray-200 rounded-2xl transition-all duration-300 text-gray-900 cursor-text ${isMessageEditorExpanded ? 'fixed inset-4 z-50 rounded-3xl shadow-2xl overflow-hidden' : ''}`}>
                    <style>{`
                      .webmail-quill-editor .ql-toolbar.ql-snow {
                        background-color: #f9fafb !important;
                        border-top-left-radius: 0.75rem !important;
                        border-top-right-radius: 0.75rem !important;
                        border-color: #e5e7eb !important;
                        padding: 6px 10px !important;
                        display: flex !important;
                        flex-wrap: wrap !important;
                        align-items: center !important;
                        gap: 2px !important;
                        position: relative !important;
                        z-index: 20 !important;
                      }
                      .webmail-quill-editor .ql-toolbar.ql-snow .ql-formats {
                        margin-right: 8px !important;
                        margin-bottom: 2px !important;
                        display: inline-flex !important;
                        align-items: center !important;
                      }
                      .webmail-quill-editor .ql-toolbar.ql-snow button,
                      .webmail-quill-editor .ql-toolbar.ql-snow .ql-picker {
                        border-radius: 6px !important;
                        transition: all 0.15s ease !important;
                      }
                      .webmail-quill-editor .ql-toolbar.ql-snow button:hover,
                      .webmail-quill-editor .ql-toolbar.ql-snow .ql-picker:hover {
                        background-color: #e5e7eb !important;
                      }
                      .webmail-quill-editor .ql-toolbar.ql-snow button.ql-active,
                      .webmail-quill-editor .ql-toolbar.ql-snow .ql-picker-label.ql-active {
                        background-color: #e0e7ff !important;
                        color: #4338ca !important;
                      }

                      /* Seletor de Família de Fonte estilo Outlook */
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font {
                        width: 145px !important;
                        background-color: #ffffff !important;
                        border: 1px solid #d1d5db !important;
                        border-radius: 6px !important;
                        height: 28px !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-label {
                        padding: 3px 8px !important;
                        font-size: 12px !important;
                        font-weight: 500 !important;
                        color: #374151 !important;
                        display: flex !important;
                        align-items: center !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-label::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-item::before {
                        content: 'Aptos (Padrão)' !important;
                        font-family: inherit !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="times-new-roman"]::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="times-new-roman"]::before {
                        content: 'Times New Roman' !important;
                        font-family: "Times New Roman", Times, Georgia, serif !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="arial"]::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="arial"]::before {
                        content: 'Arial' !important;
                        font-family: Arial, Helvetica, sans-serif !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="calibri"]::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="calibri"]::before {
                        content: 'Calibri' !important;
                        font-family: Calibri, Candara, Segoe, Arial, sans-serif !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="georgia"]::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="georgia"]::before {
                        content: 'Georgia' !important;
                        font-family: Georgia, serif !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="verdana"]::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="verdana"]::before {
                        content: 'Verdana' !important;
                        font-family: Verdana, Geneva, sans-serif !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="tahoma"]::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="tahoma"]::before {
                        content: 'Tahoma' !important;
                        font-family: Tahoma, Verdana, sans-serif !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="courier-new"]::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="courier-new"]::before {
                        content: 'Courier New' !important;
                        font-family: "Courier New", Courier, monospace !important;
                      }

                      /* Seletor de Tamanho de Fonte estilo Outlook */
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size {
                        width: 68px !important;
                        background-color: #ffffff !important;
                        border: 1px solid #d1d5db !important;
                        border-radius: 6px !important;
                        height: 28px !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-label {
                        padding: 3px 6px !important;
                        font-size: 12px !important;
                        font-weight: 500 !important;
                        color: #374151 !important;
                        display: flex !important;
                        align-items: center !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-label::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-item::before {
                        content: '14' !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="10px"]::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="10px"]::before {
                        content: '10' !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="12px"]::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="12px"]::before {
                        content: '12' !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="14px"]::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="14px"]::before {
                        content: '14' !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="16px"]::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="16px"]::before {
                        content: '16' !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="18px"]::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="18px"]::before {
                        content: '18' !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="24px"]::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="24px"]::before {
                        content: '24' !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="32px"]::before,
                      .webmail-quill-editor .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="32px"]::before {
                        content: '32' !important;
                      }

                      /* Menus Suspensos / Dropdowns */
                      .webmail-quill-editor .ql-snow .ql-picker-options {
                        background-color: #ffffff !important;
                        border: 1px solid #d1d5db !important;
                        border-radius: 8px !important;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
                        padding: 6px !important;
                        max-height: 220px !important;
                        overflow-y: auto !important;
                        z-index: 100 !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker-item {
                        padding: 5px 8px !important;
                        font-size: 12px !important;
                        border-radius: 4px !important;
                        cursor: pointer !important;
                        color: #374151 !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-picker-item:hover {
                        background-color: #f3f4f6 !important;
                        color: #111827 !important;
                      }

                      /* Paleta de Cores de Texto e Realce */
                      .webmail-quill-editor .ql-snow .ql-color-picker .ql-picker-options {
                        width: 172px !important;
                        padding: 8px !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-color-picker .ql-picker-item {
                        width: 18px !important;
                        height: 18px !important;
                        padding: 0 !important;
                        margin: 2px !important;
                        border-radius: 3px !important;
                        border: 1px solid rgba(0, 0, 0, 0.12) !important;
                        transition: transform 0.1s ease !important;
                      }
                      .webmail-quill-editor .ql-snow .ql-color-picker .ql-picker-item:hover {
                        transform: scale(1.2) !important;
                        border-color: #111827 !important;
                      }

                      /* Container e Área de Edição */
                      .webmail-quill-editor .ql-container.ql-snow {
                        background-color: #ffffff !important;
                        border-bottom-left-radius: 0.75rem !important;
                        border-bottom-right-radius: 0.75rem !important;
                        border-color: #e5e7eb !important;
                      }
                      .webmail-quill-editor .ql-editor {
                        color: #111827 !important;
                        caret-color: #111827 !important;
                        background-color: #ffffff !important;
                        font-size: 14px !important;
                        line-height: 1.6 !important;
                        min-height: ${isMessageEditorExpanded ? 'calc(100vh - 220px)' : '200px'} !important;
                        max-height: ${isMessageEditorExpanded ? 'calc(100vh - 220px)' : '340px'} !important;
                        overflow-y: auto !important;
                        cursor: text !important;
                        padding: 14px 16px !important;
                      }

                      /* Aplicação visual imediata de fontes no editor (classes e estilos inline) */
                      .webmail-quill-editor .ql-editor .ql-font-times-new-roman,
                      .webmail-quill-editor .ql-editor [style*="times-new-roman"],
                      .webmail-quill-editor .ql-editor .ql-font-serif,
                      .webmail-quill-editor .ql-editor [style*="Times New Roman"],
                      .webmail-quill-editor .ql-editor [style*="Times"] {
                        font-family: "Times New Roman", Times, Georgia, serif !important;
                      }
                      .webmail-quill-editor .ql-editor .ql-font-arial,
                      .webmail-quill-editor .ql-editor [style*="arial"],
                      .webmail-quill-editor .ql-editor [style*="Arial"] {
                        font-family: Arial, Helvetica, sans-serif !important;
                      }
                      .webmail-quill-editor .ql-editor .ql-font-calibri,
                      .webmail-quill-editor .ql-editor [style*="calibri"],
                      .webmail-quill-editor .ql-editor [style*="Calibri"] {
                        font-family: Calibri, Candara, Segoe, Arial, sans-serif !important;
                      }
                      .webmail-quill-editor .ql-editor .ql-font-georgia,
                      .webmail-quill-editor .ql-editor [style*="georgia"],
                      .webmail-quill-editor .ql-editor [style*="Georgia"] {
                        font-family: Georgia, serif !important;
                      }
                      .webmail-quill-editor .ql-editor .ql-font-verdana,
                      .webmail-quill-editor .ql-editor [style*="verdana"],
                      .webmail-quill-editor .ql-editor [style*="Verdana"] {
                        font-family: Verdana, Geneva, sans-serif !important;
                      }
                      .webmail-quill-editor .ql-editor .ql-font-tahoma,
                      .webmail-quill-editor .ql-editor [style*="tahoma"],
                      .webmail-quill-editor .ql-editor [style*="Tahoma"] {
                        font-family: Tahoma, Verdana, sans-serif !important;
                      }
                      .webmail-quill-editor .ql-editor .ql-font-courier-new,
                      .webmail-quill-editor .ql-editor [style*="courier-new"],
                      .webmail-quill-editor .ql-editor .ql-font-monospace,
                      .webmail-quill-editor .ql-editor [style*="Courier New"],
                      .webmail-quill-editor .ql-editor [style*="Courier"] {
                        font-family: "Courier New", Courier, monospace !important;
                      }

                      /* Aplicação de tamanhos de fonte no editor */
                      .webmail-quill-editor .ql-editor .ql-size-10px,
                      .webmail-quill-editor .ql-editor [style*="font-size: 10px"] { font-size: 10px !important; }
                      .webmail-quill-editor .ql-editor .ql-size-12px,
                      .webmail-quill-editor .ql-editor [style*="font-size: 12px"] { font-size: 12px !important; }
                      .webmail-quill-editor .ql-editor .ql-size-14px,
                      .webmail-quill-editor .ql-editor [style*="font-size: 14px"] { font-size: 14px !important; }
                      .webmail-quill-editor .ql-editor .ql-size-16px,
                      .webmail-quill-editor .ql-editor [style*="font-size: 16px"] { font-size: 16px !important; }
                      .webmail-quill-editor .ql-editor .ql-size-18px,
                      .webmail-quill-editor .ql-editor [style*="font-size: 18px"] { font-size: 18px !important; }
                      .webmail-quill-editor .ql-editor .ql-size-24px,
                      .webmail-quill-editor .ql-editor [style*="font-size: 24px"] { font-size: 24px !important; }
                      .webmail-quill-editor .ql-editor .ql-size-32px,
                      .webmail-quill-editor .ql-editor [style*="font-size: 32px"] { font-size: 32px !important; }

                      /* Preservar cores e realce selecionados pelo usuário */
                      .webmail-quill-editor .ql-editor [style*="color"],
                      .webmail-quill-editor .ql-editor [style*="color"] * {
                        -webkit-text-fill-color: currentColor !important;
                      }
                      .webmail-quill-editor .ql-editor [style*="background-color"] {
                        /* Realce ativo */
                      }

                      .webmail-quill-editor .ql-editor img {
                        max-width: 520px !important;
                        width: auto !important;
                        height: auto !important;
                        display: block !important;
                        border: 0 !important;
                        border-radius: 4px !important;
                        margin-top: 16px !important;
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
                        modules={quillModules}
                        className="text-xs text-gray-900 bg-white webmail-quill-editor"
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

                {/* Barra Compacta: Anexos + Prioridade da Mensagem */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg transition border border-emerald-200">
                        {uploadingAttachment ? (
                          <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                        ) : (
                          <Paperclip className="w-3 h-3 text-emerald-600" />
                        )}
                        <span>{uploadingAttachment ? 'A carregar...' : 'Anexar Ficheiro'}</span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleComposeFileUpload}
                          disabled={uploadingAttachment}
                        />
                      </label>
                      {composeAttachments.length > 0 && (
                        <span className="text-[10px] font-bold text-gray-500">
                          {composeAttachments.length}/{ATTACHMENT_MAX_COUNT} ({(composeAttachments.reduce((sum, att) => sum + (att.size || 0), 0) / (1024 * 1024)).toFixed(1)}MB)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-bold text-gray-500 mr-1 hidden sm:inline">Prioridade:</span>
                      <button
                        type="button"
                        onClick={() => setComposePriority('normal')}
                        className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer border flex items-center space-x-1 ${
                          composePriority === 'normal'
                            ? 'bg-white text-gray-900 border-gray-300 shadow-2xs'
                            : 'text-gray-500 hover:bg-gray-100 border-transparent'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        <span>Normal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setComposePriority('high')}
                        className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer border flex items-center space-x-1 ${
                          composePriority === 'high'
                            ? 'bg-rose-100 text-rose-800 border-rose-300 shadow-2xs font-extrabold'
                            : 'text-gray-500 hover:bg-rose-50 hover:text-rose-700 border-transparent'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                        <span>Alta</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setComposePriority('low')}
                        className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer border flex items-center space-x-1 ${
                          composePriority === 'low'
                            ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-2xs'
                            : 'text-gray-500 hover:bg-blue-50 hover:text-blue-700 border-transparent'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <span>Baixa</span>
                      </button>
                    </div>
                  </div>

                  {attachmentError && (
                    <div className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-lg">
                      <p className="text-[11px] font-bold text-rose-700 flex items-center space-x-1.5">
                        <AlertCircle className="w-3 h-3" />
                        <span>{attachmentError}</span>
                      </p>
                    </div>
                  )}

                  {composeAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {composeAttachments.map((att, idx) => (
                        <div key={idx} className="flex items-center space-x-1 px-2 py-0.5 bg-gray-100 border border-gray-200 rounded-md text-[11px]">
                          <FileText className="w-3 h-3 text-primary-600 shrink-0" />
                          <span className="font-bold text-gray-800 truncate max-w-[140px]">{att.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveComposeAttachment(idx)}
                            className="text-gray-400 hover:text-red-600 transition p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Painel Inteligente de Agendamento de Envio (Schedule Send) */}
                {showSchedulePicker && (
                  <div className="p-3.5 bg-neutral-950 text-white rounded-2xl border border-emerald-500/30 shadow-lg space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-white block">Programar Envio do E-mail</span>
                          <span className="text-[10px] text-neutral-400">
                            Escolha um atalho inteligente ou defina a data e hora exatas
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSchedulePicker(false);
                          setComposeScheduledFor('');
                        }}
                        className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                        title="Fechar agendamento"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Atalhos Rápidos Inteligentes */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                      {getQuickSchedulePresets().map((preset, idx) => {
                        const isSelected = composeScheduledFor === preset.value;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setComposeScheduledFor(preset.value)}
                            className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-extrabold shadow-xs'
                                : 'bg-white/[0.06] hover:bg-white/10 text-neutral-200 border-white/10'
                            }`}
                          >
                            <span className="text-[11px] font-bold block truncate">{preset.label}</span>
                            <span
                              className={`text-[10px] block truncate ${
                                isSelected ? 'text-neutral-900 font-semibold' : 'text-neutral-400'
                              }`}
                            >
                              {preset.sublabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Seletor de Data e Hora Personalizada */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-white/10">
                      <div className="flex items-center space-x-2 flex-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-[11px] font-bold text-neutral-300 whitespace-nowrap">
                          Data e hora personalizada:
                        </span>
                        <input
                          type="datetime-local"
                          value={composeScheduledFor}
                          min={formatToLocalDatetimeInput(new Date(Date.now() + 60000))}
                          onChange={(e) => setComposeScheduledFor(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-400 cursor-pointer"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleScheduleEmail()}
                        disabled={!composeScheduledFor || sendingMsg || uploadingAttachment}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Confirmar Agendamento</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCloseCompose}
                    className="sm:flex-1 py-2.5 border border-neutral-300 text-neutral-800 font-bold text-xs rounded-xl hover:bg-neutral-100 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraftManually}
                    disabled={sendingMsg || uploadingAttachment}
                    className="sm:flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-900 border border-neutral-300 font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs flex items-center justify-center space-x-2"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Salvar Rascunho</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!showSchedulePicker && !composeScheduledFor) {
                        const presets = getQuickSchedulePresets();
                        if (presets.length > 0) setComposeScheduledFor(presets[0].value);
                        setShowSchedulePicker(true);
                      } else if (showSchedulePicker && composeScheduledFor) {
                        handleScheduleEmail();
                      } else {
                        setShowSchedulePicker(!showSchedulePicker);
                      }
                    }}
                    disabled={sendingMsg || uploadingAttachment}
                    className={`sm:flex-1 py-2.5 font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5 border ${
                      showSchedulePicker || composeScheduledFor
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}
                    title="Programar o envio deste e-mail para uma data e hora específica"
                  >
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {composeScheduledFor
                        ? `Agendar (${new Date(composeScheduledFor).toLocaleDateString('pt-MZ', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })})`
                        : 'Agendar Envio'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={sendingMsg || uploadingAttachment}
                    className="sm:flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center space-x-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{sendingMsg ? 'A Enviar...' : 'Enviar Agora'}</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}
          </div>
        </div>
      )}

      {/* MODAL: Attachment Preview */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10020] p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-neutral-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{previewAttachment.name}</h3>
                  {previewAttachment.size && (
                    <span className="text-[10px] text-gray-500 font-mono">
                      {(previewAttachment.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                {/* Abrir em novo separador */}
                <a
                  href={previewBlobUrl || previewAttachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 rounded-xl transition cursor-pointer flex items-center space-x-1"
                  title="Abrir em ecrã completo / novo separador"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs font-bold">Abrir Separador</span>
                </a>
                {/* Download */}
                <a
                  href={previewAttachment.url.includes('/api/webmail/attachment') ? `${previewAttachment.url}&download=1` : (previewBlobUrl || previewAttachment.url)}
                  download={previewAttachment.name}
                  className="p-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl transition cursor-pointer flex items-center space-x-1 border border-primary-200"
                  title="Descarregar ficheiro"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs font-bold">Download</span>
                </a>
                {/* Fechar */}
                <button
                  type="button"
                  onClick={() => {
                    setPreviewAttachment(null);
                    setPreviewBlobUrl('');
                  }}
                  className="p-2 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-xl transition cursor-pointer"
                  title="Fechar visualizador"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-auto p-2 sm:p-4 bg-neutral-100/90 flex items-center justify-center min-h-[350px]">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                  <p className="text-xs font-bold text-neutral-800">A carregar documento...</p>
                  <p className="text-[11px] text-neutral-500">A preparar visualização de alta qualidade</p>
                </div>
              ) : (() => {
                const filename = previewAttachment.name || '';
                const isPdf = previewAttachment.type === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');
                const isImage = previewAttachment.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(filename);
                const isText = previewAttachment.type?.startsWith('text/') || /\.(txt|csv|log|json|xml|md)$/i.test(filename);
                const isAudio = previewAttachment.type?.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(filename);

                const activeUrl = previewBlobUrl || previewAttachment.url;

                if (isPdf) {
                  return (
                    <div className="w-full h-[78vh] flex flex-col rounded-2xl overflow-hidden shadow-sm border border-neutral-300 bg-white">
                      <object
                        data={activeUrl}
                        type="application/pdf"
                        className="w-full h-full"
                      >
                        <iframe
                          src={activeUrl}
                          className="w-full h-full border-0"
                          title={previewAttachment.name}
                        >
                          <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
                            <FileText className="w-12 h-12 text-neutral-400" />
                            <p className="text-sm font-bold text-neutral-800">{previewAttachment.name}</p>
                            <a
                              href={activeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl shadow-sm"
                            >
                              Abrir PDF em Ecrã Completo
                            </a>
                          </div>
                        </iframe>
                      </object>
                    </div>
                  );
                }

                if (isImage) {
                  return (
                    <div className="flex items-center justify-center w-full h-[78vh] p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeUrl}
                        alt={previewAttachment.name}
                        className="max-w-full max-h-[76vh] object-contain mx-auto rounded-xl shadow-md border border-neutral-200 bg-white"
                      />
                    </div>
                  );
                }

                if (isText) {
                  return (
                    <div className="w-full h-[78vh] rounded-2xl overflow-hidden shadow-sm border border-neutral-300 bg-white">
                      <iframe
                        src={activeUrl}
                        className="w-full h-full border-0 p-4 font-mono text-xs bg-white text-neutral-900"
                        title={previewAttachment.name}
                      />
                    </div>
                  );
                }

                if (isAudio) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
                      <Volume2 className="w-12 h-12 text-primary-600" />
                      <p className="text-sm font-bold text-neutral-800">{previewAttachment.name}</p>
                      <audio controls src={activeUrl} className="w-full max-w-md" />
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center max-w-md mx-auto p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">{previewAttachment.name}</h4>
                      <p className="text-xs text-neutral-500 mt-1">
                        Este formato requer download ou aplicação nativa para visualização completa.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <a
                        href={previewAttachment.url.includes('/api/webmail/attachment') ? `${previewAttachment.url}&download=1` : previewAttachment.url}
                        download={previewAttachment.name}
                        className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700 transition shadow-xs flex items-center space-x-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descarregar Ficheiro</span>
                      </a>
                      <a
                        href={activeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir Separador</span>
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Placeholder Warning */}
      {showPlaceholderWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[10005]">
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
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                  <p className="text-xs font-bold text-rose-700 flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{webmailLoginError}</span>
                  </p>
                  <a
                    href={`https://wa.me/258848335618?text=${encodeURIComponent(
                      `Olá Suporte WEHOSTHERE! Preciso de ajuda para aceder ao Webmail Corporativo${
                        webmailLoginEmail || selectedAccountEmail ? ` com a conta ${webmailLoginEmail || selectedAccountEmail}` : ''
                      } (Erro: ${webmailLoginError}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.126.557 4.199 1.613 6.028l-1.613 5.972 6.135-1.608c1.777.962 3.778 1.472 5.865 1.472 6.627 0 12-5.373 12-12s-5.373-12-12-12z"/>
                    </svg>
                    <span>Falar com o Suporte no WhatsApp</span>
                  </a>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email da Mailbox</label>
                <input
                  type="email"
                  value={webmailLoginEmail}
                  onChange={(e) => setWebmailLoginEmail(e.target.value)}
                  placeholder={`${animatedEmailPlaceholder}|`}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm placeholder:text-gray-400 placeholder:font-medium"
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

            <div className="mt-4 pt-3 border-t border-gray-100 text-center flex flex-col items-center gap-2">
              <p className="text-xs text-gray-500">
                Use o e-mail e a palavra-passe da sua conta de e-mail
              </p>
              <button
                type="button"
                onClick={handleOpenChangePassword}
                className="text-xs font-bold text-gray-800 hover:text-black underline cursor-pointer inline-flex items-center space-x-1"
              >
                <Key className="h-3.5 w-3.5 text-gray-500" />
                <span>Alterar senha desta conta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Alterar Senha de E-mail (Sincronizado com Migadu) */}
      {showChangePasswordModal && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[99999] p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setShowChangePasswordModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">Alterar Senha do E-mail</h3>
                  <p className="text-xs font-mono font-bold text-gray-600 truncate max-w-[220px] sm:max-w-none">
                    {selectedAccountEmail || webmailLoginEmail || accounts[0]?.email || 'Digite o seu e-mail abaixo'}
                  </p>
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

            <form onSubmit={handleChangePassword} className="space-y-3.5">
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
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Endereço de E-mail Corporativo
                </label>
                <input
                  type="email"
                  value={selectedAccountEmail || webmailLoginEmail}
                  onChange={(e) => {
                    setSelectedAccountEmail(e.target.value);
                    setWebmailLoginEmail(e.target.value);
                  }}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                  placeholder="colaborador@suaempresa.co.mz"
                />
              </div>

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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center z-[10010] p-2 sm:p-4 animate-in fade-in duration-200">
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

            {/* Alternador de Modo: Assinatura em Imagem vs Assinatura em Texto */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setSignatureActiveTab('image');
                  setSignatureForm(prev => ({ ...prev, signatureType: 'image' }));
                }}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition cursor-pointer ${
                  signatureActiveTab === 'image'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Assinatura em Imagem / Digital</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSignatureActiveTab('text');
                  setSignatureForm(prev => ({ ...prev, signatureType: 'text' }));
                }}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition cursor-pointer ${
                  signatureActiveTab === 'text'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dados em Texto</span>
              </button>
            </div>

            <form onSubmit={handleSaveSignature} className="space-y-3.5 text-xs">
              {/* ABA 1: ASSINATURA EM IMAGEM */}
              {signatureActiveTab === 'image' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-2xl text-[11px] text-purple-900 leading-relaxed">
                    Carregue a sua assinatura digital ou banner corporativo em imagem (PNG, JPG, WebP). Ela será anexada automaticamente ao final dos seus novos e-mails e respostas.
                  </div>

                  {signatureForm.signatureImage ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden">
                        <img
                          src={signatureForm.signatureImage}
                          alt="Assinatura Digital"
                          className="max-h-48 max-w-full object-contain rounded-lg border border-gray-200 shadow-xs bg-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-center cursor-pointer border border-purple-200 transition">
                          <span>Trocar Imagem</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleSignatureImageUpload(file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setSignatureForm(prev => ({ ...prev, signatureImage: '' }))}
                          className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl border border-rose-200 transition cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <label className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/30 hover:bg-purple-50/60 transition rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group">
                        <div className="w-12 h-12 rounded-full bg-purple-100 group-hover:bg-purple-200 text-purple-600 flex items-center justify-center mb-2 transition">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-gray-800 mb-0.5">Clique para carregar a sua imagem de assinatura</span>
                        <span className="text-[11px] text-gray-500">PNG, JPG, SVG ou WebP (máx. 2MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSignatureImageUpload(file);
                          }}
                        />
                      </label>

                      <div>
                        <label className="block text-gray-600 font-semibold mb-1 text-[11px]">Ou cole a URL direta de uma imagem hospedada:</label>
                        <input
                          type="text"
                          value={signatureForm.signatureImage}
                          onChange={(e) => setSignatureForm(prev => ({ ...prev, signatureImage: e.target.value, signatureType: 'image' }))}
                          placeholder="https://exemplo.com/minha-assinatura.png"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 2: DADOS EM TEXTO */}
              {signatureActiveTab === 'text' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Nome Completo</label>
                      <input
                        type="text"
                        value={signatureForm.fullName}
                        onChange={(e) => setSignatureForm({ ...signatureForm, fullName: e.target.value })}
                        placeholder="Seu Nome"
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
                </div>
              )}

              {/* OPÇÕES: Inserir automaticamente */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-800 block text-xs">Inserção Automática</span>
                  <span className="text-[11px] text-gray-500">Adicionar automaticamente a novos e-mails e respostas</span>
                </div>
                <input
                  type="checkbox"
                  checked={signatureForm.autoInsert}
                  onChange={(e) => setSignatureForm(prev => ({ ...prev, autoInsert: e.target.checked }))}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {/* Live Signature Preview */}
              <div className="pt-1">
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Pré-visualização:</label>
                {signatureForm.signatureType === 'image' && signatureForm.signatureImage ? (
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex justify-center overflow-hidden">
                    <img
                      src={signatureForm.signatureImage}
                      alt="Pré-visualização"
                      className="max-h-28 object-contain rounded"
                    />
                  </div>
                ) : (
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1 text-gray-800 font-sans border-l-4 border-l-purple-600">
                    <div className="font-bold text-sm text-gray-900">{signatureForm.fullName || 'Seu Nome'}</div>
                    <div className="text-gray-600 text-xs">
                      {signatureForm.jobTitle ? `${signatureForm.jobTitle} • ` : ''}{signatureForm.companyName || 'Sua Empresa'}
                    </div>
                    {signatureForm.phone && (
                      <div className="text-gray-500 text-[11px]">📞 {signatureForm.phone}</div>
                    )}
                  </div>
                )}
              </div>
              

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignatureModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingSignature || (!signatureForm.fullName && !signatureForm.signatureImage)}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
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
                onClick={() => deleteConfirmModal.msgIds && deleteConfirmModal.msgIds.length > 0 ? executeBulkDelete(deleteConfirmModal.msgIds) : executeDeleteMessage(deleteConfirmModal.msgId)}
                className={`flex-1 py-3 text-white font-black text-xs rounded-2xl transition cursor-pointer shadow-md flex items-center justify-center space-x-2 ${deleteConfirmModal.isPermanent ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                <Trash2 className="h-4 w-4" />
                <span>{deleteConfirmModal.isPermanent ? 'Sim, Eliminar' : 'Sim, Mover para Lixeira'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Interno Corporativo por Domínio (Sem Enviar E-mail) */}
      <InternalDomainChat
        currentEmail={selectedAccountEmail || webmailLoginEmail || accounts[0]?.email || user?.email || 'equipa@wehosthere.com'}
        currentUserName={getDynamicUserGreeting().userName}
        isOpen={showInternalChat}
        onToggleOpen={setShowInternalChat}
        onUnreadChange={(unread, online) => {
          setInternalChatUnread(unread);
          setInternalChatOnline(online);
        }}
        onProfileChange={(avUrl) => {
          setUserAvatarUrl(avUrl);
        }}
      />

      {showAgentModal && isWehosthereAccount && (
        <EmailAgentControl
          variant="modal"
          targetEmail={selectedAccountEmail || webmailLoginEmail || accounts[0]?.email || 'info@wehosthere.com'}
          initialImapPassword={mailboxPassword}
          onClose={() => setShowAgentModal(false)}
          onStatusChange={(active) => setAgentActive(active)}
        />
      )}

      {/* Modal de Gestão e Conexão de Contas de E-mail Externas (IMAP/SMTP) */}
      <ExternalAccountsModal
        isOpen={showExternalAccountsModal}
        onClose={() => {
          setShowExternalAccountsModal(false);
          const currentOwner = selectedAccountEmail || webmailLoginEmail || accounts[0]?.email;
          if (currentOwner) {
            fetch(`/api/webmail/external-accounts?ownerEmail=${encodeURIComponent(currentOwner)}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success && Array.isArray(data.accounts)) {
                  setExternalAccountsCount(data.accounts.length);
                }
              })
              .catch(() => {});
          }
        }}
        ownerEmail={selectedAccountEmail || webmailLoginEmail || accounts[0]?.email || 'geral@wehosthere.com'}
        domain={selectedAccountEmail && selectedAccountEmail.includes('@') ? selectedAccountEmail.split('@')[1].toLowerCase() : ''}
        onOpenAnalytics={() => {
          setShowExternalAccountsModal(false);
          setShowAnalyticsDashboard(true);
        }}
        lastSyncedTime={lastSyncedTime}
        isOnline={isOnline}
        isRefreshing={isRefreshingWebmail}
        onRefresh={() => {
          setIsRefreshingWebmail(true);
          refreshMessages();
          setTimeout(() => setIsRefreshingWebmail(false), 800);
        }}
        onLogout={handleWebmailLogout}
        onSwitchAccount={async (externalEmail) => {
          try {
            const currentOwner = selectedAccountEmail || webmailLoginEmail || accounts[0]?.email || 'geral@wehosthere.com';
            const res = await fetch('/api/webmail/external-accounts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'switch_session',
                ownerEmail: currentOwner,
                email: externalEmail,
              }),
            });
            const data = await res.json();
            if (data.success && data.account) {
              setSelectedAccountEmail(data.account.email);
              setMailboxPassword(data.account.password);
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('wm_active_email', data.account.email);
                sessionStorage.setItem(`wm_pwd_${data.account.email.toLowerCase()}`, data.account.password);
              }
              setIsRefreshingWebmail(true);
              refreshMessages();
              setTimeout(() => setIsRefreshingWebmail(false), 800);
            }
          } catch (err) {
            console.error('Failed to switch to external account:', err);
          }
        }}
      />
    </div>
  );
}

export default function WebmailPage() {
  return (
    <Suspense fallback={<PageLoader text="A carregar inLook..." />}>
      <WebmailContent />
    </Suspense>
  );
}


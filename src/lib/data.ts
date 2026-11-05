import { auth } from './auth';
import { apiEndpoint } from './siteConfig';
import { sanitizeDomainName } from './domains';

export interface SocialProof {
  id: string;
  userName: string;
  location: string;
  action: string;
  timeAgo: string;
  active: boolean;
}

export interface UserFeedback {
  id: string;
  userId: string;
  userName?: string;
  userEmail: string;
  type: 'course' | 'lesson' | 'platform' | 'general' | 'service';
  targetId?: string; // courseId ou lessonId se aplicável
  rating: number; // 1-5
  comment: string;
  category?: 'content' | 'structure' | 'support' | 'bug' | 'suggestion' | 'other';
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  userName?: string;
  userEmail?: string;
  serviceName: string;
  amount: number;
  valorFaturado: number;
  valorPorFaturar: number;
  paymentMethod: 'mpesa' | 'emola' | 'card' | 'bank_transfer';
  proofUrl?: string;
  proofName?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'suspended';
  reference?: string; // Referência do pagamento para rastreamento do webhook
  createdAt: string;
}

export interface SystemForRent {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  image: string;
  demoUrl?: string;
  features: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  setupFee?: number;
  isActive: boolean;
  isFree?: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  developerEmail?: string;
  developerName?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentalRequest {
  id: string;
  systemId: string;
  systemName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  paymentMethod: 'mpesa' | 'emola' | 'card' | 'bank_transfer';
  proofUrl?: string;
  proofName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface SystemAccess {
  id: string;
  systemId: string;
  systemName: string;
  clientEmail: string;
  clientName: string;
  credentials: {
    username?: string;
    password?: string;
    url?: string;
    apiKey?: string;
    notes?: string;
  };
  status: 'active' | 'expired' | 'suspended' | 'cancelled';
  startDate: string;
  endDate: string;
  billingCycle: 'monthly' | 'yearly';
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Academy/Course Management
export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  duration: string;
  outcome: string;
  thumbnail?: string;
  accessType: 'free' | 'paid' | 'preview';
  price?: number;
  currency?: string;
  order: number;
  active: boolean;
  freeLessonsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  objective: string;
  hasVideo: boolean;
  videoUrl?: string;
  videoTitle?: string;
  videoDescription?: string;
  hasMaterial: boolean;
  materialUrl?: string;
  materialTitle?: string;
  materialType?: 'pdf' | 'document' | 'link';
  order: number;
  active: boolean;
  isFree?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  hasVideo: boolean;
  videoUrl?: string;
  videoTitle?: string;
  videoDescription?: string;
  hasMaterial: boolean;
  materialUrl?: string;
  materialTitle?: string;
  materialType?: 'pdf' | 'document' | 'link';
  order: number;
  active: boolean;
  isFree?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  id: string;
  userId: string;
  courseId: string;
  completedLessons: string[];
  currentModuleId?: string;
  currentLessonId?: string;
  completedAt?: string;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'completed' | 'cancelled';
  enrolledAt: string;
  completedAt?: string;
  paymentId?: string;
}

export interface WebhookEvent {
  id: string;
  eventId: string; // ID do evento da Kivora
  eventType: 'payment.created' | 'payment.pending' | 'payment.completed' | 'payment.failed' | 'b2c.created' | 'b2c.completed' | 'b2c.failed';
  paymentId?: string;
  reference?: string;
  status?: string;
  amount?: number;
  currency?: string;
  clientName?: string;
  clientEmail?: string;
  serviceName?: string;
  processed: boolean; // Se foi processado com sucesso
  errorMessage?: string; // Erro se falhou ao processar
  failureReason?: string; // Motivo da falha do pagamento (ex: falta de saldo, PIN incorreto)
  failureCode?: string; // Código da falha do pagamento
  createdAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  completionDate: string;
  certificateNumber: string;
  verificationUrl: string;
  createdAt: string;
}

export interface SystemRating {
  id: string;
  systemId: string;
  systemName: string;
  clientEmail: string;
  clientName: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerEmail: string;
  referrerName: string;
  referralCode: string;
  referredEmail?: string;
  referredName?: string;
  status: 'active' | 'inactive';
  totalReferrals: number;
  totalCommissions: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralCommission {
  id: string;
  referrerEmail: string;
  referrerName: string;
  referredEmail: string;
  referredName: string;
  systemId?: string;
  systemName?: string;
  amount: number;
  percentage: number; // 30%
  billingCycle: 'monthly' | 'yearly';
  status: 'pending' | 'paid' | 'cancelled';
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  storage: number;
  bandwidth: number;
  userEmail?: string;
}

export interface EmailAccount {
  id: string;
  email: string;
  domain?: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  storage: number;
  storageUsed?: number;
  userEmail?: string;
}

export interface HostingPlan {
  id: string;
  name: string;
  price: number;
  priceAnnual: number;
  features: {
    sites: number;
    emails: number;
    storage: number;
    bandwidth: string;
    ssl: boolean;
    cdn: boolean;
  };
}

export const hostingPlans: HostingPlan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 550,
    priceAnnual: 5500,
    features: {
      sites: 1,
      emails: 5,
      storage: 10,
      bandwidth: 'Ilimitado',
      ssl: false,
      cdn: false
    }
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: 2500,
    priceAnnual: 25000,
    features: {
      sites: 5,
      emails: 20,
      storage: 50,
      bandwidth: 'Ilimitado',
      ssl: true,
      cdn: false
    }
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    price: 6200,
    priceAnnual: 62000,
    features: {
      sites: -1, // -1 significa ilimitado
      emails: -1,
      storage: 200,
      bandwidth: 'Ilimitado',
      ssl: true,
      cdn: true
    }
  },
  {
    id: 'website_creation',
    name: 'Criação de Site Profissional',
    price: 25000,
    priceAnnual: 25000,
    features: {
      sites: 1,
      emails: -1,
      storage: 100,
      bandwidth: 'Ilimitado',
      ssl: true,
      cdn: true
    }
  }
];

export interface WebsiteType {
  id: string;
  name: string;
  emoji: string;
  shortDesc: string;
  description: string;
  examples: string[];
  basePrice: number;
  priceNote: string;
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  deliveryDays: number;
}

export const websiteTypes: WebsiteType[] = [
  {
    id: 'institutional',
    name: 'Website Institucional',
    emoji: '🏢',
    shortDesc: 'Apresentação da empresa, equipa e serviços',
    description: 'Apresenta uma empresa, organização ou profissional. Inclui serviços, equipa, contactos, localização e portfólio.',
    examples: ['Página de Sobre', 'Serviços', 'Equipa', 'Portfólio', 'Contactos', 'Localização'],
    basePrice: 25000,
    priceNote: 'Investimento único',
    complexity: 'simple',
    deliveryDays: 14
  },
  {
    id: 'ecommerce',
    name: 'Loja Virtual (E-commerce)',
    emoji: '🛒',
    shortDesc: 'Venda de produtos e serviços online',
    description: 'Venda de produtos e serviços online com carrinho de compras, pagamentos, gestão de encomendas e stock.',
    examples: ['Catálogo de produtos', 'Carrinho', 'Pagamentos M-Pesa/eMola', 'Gestão de stock', 'Encomendas'],
    basePrice: 65000,
    priceNote: 'Investimento único',
    complexity: 'complex',
    deliveryDays: 30
  },
  {
    id: 'webapp',
    name: 'Sistema Web (Aplicação)',
    emoji: '⚙️',
    shortDesc: 'Plataformas para automatizar processos empresariais',
    description: 'Plataformas personalizadas para automatizar processos internos ou externos da sua empresa.',
    examples: ['CRM', 'ERP', 'Gestão Escolar', 'Gestão Hospitalar', 'Sistema de Empréstimos', 'Gestão Empresarial'],
    basePrice: 150000,
    priceNote: 'Preço sob orçamento',
    complexity: 'enterprise',
    deliveryDays: 90
  },
  {
    id: 'landing',
    name: 'Landing Page',
    emoji: '🎯',
    shortDesc: 'Página focada numa única ação ou campanha',
    description: 'Página focada numa única ação. Ideal para campanhas de marketing, geração de leads e venda de produtos.',
    examples: ['Geração de leads', 'Venda de produto', 'Campanha de marketing', 'Captura de emails'],
    basePrice: 12000,
    priceNote: 'Investimento único',
    complexity: 'simple',
    deliveryDays: 7
  },
  {
    id: 'saas',
    name: 'Website de Assinaturas (SaaS)',
    emoji: '💻',
    shortDesc: 'Software acessado pela internet via subscrição',
    description: 'Software acessado pela internet mediante subscrição mensal ou anual.',
    examples: ['CRM', 'Faturação', 'Gestão Financeira', 'Automação', 'Gestão de Projetos'],
    basePrice: 200000,
    priceNote: 'Preço sob orçamento',
    complexity: 'enterprise',
    deliveryDays: 120
  },
  {
    id: 'realestate',
    name: 'Website Imobiliário',
    emoji: '🏠',
    shortDesc: 'Venda e arrendamento de imóveis online',
    description: 'Plataforma para venda e arrendamento de imóveis com pesquisa avançada, filtros e mapas.',
    examples: ['Listagem de imóveis', 'Pesquisa avançada', 'Filtros', 'Mapas', 'Contacto com consultores'],
    basePrice: 75000,
    priceNote: 'Investimento único',
    complexity: 'complex',
    deliveryDays: 45
  },
  {
    id: 'events',
    name: 'Website de Eventos',
    emoji: '🎪',
    shortDesc: 'Divulgação, bilhetes e inscrições para eventos',
    description: 'Divulgação e gestão de eventos com venda de bilhetes, inscrições online, check-in com QR Code e emissão de certificados.',
    examples: ['Venda de bilhetes', 'Inscrições', 'Check-in QR Code', 'Certificados', 'Agenda de eventos'],
    basePrice: 55000,
    priceNote: 'Investimento único',
    complexity: 'medium',
    deliveryDays: 30
  },
  {
    id: 'elearning',
    name: 'Plataforma de Cursos (E-learning)',
    emoji: '🎓',
    shortDesc: 'Venda e gestão de cursos online',
    description: 'Plataforma para venda e gestão de cursos online com vídeos, avaliações, certificados e acompanhamento de alunos.',
    examples: ['Cursos em vídeo', 'Avaliações', 'Certificados', 'Acompanhamento de alunos', 'Pagamentos'],
    basePrice: 90000,
    priceNote: 'Investimento único',
    complexity: 'complex',
    deliveryDays: 60
  },
  {
    id: 'health',
    name: 'Website de Saúde',
    emoji: '🏥',
    shortDesc: 'Clínicas, hospitais e laboratórios online',
    description: 'Plataforma digital para clínicas, hospitais e laboratórios com agendamento de consultas, resultados de exames e telemedicina.',
    examples: ['Agendamento de consultas', 'Resultados de exames', 'Telemedicina', 'Perfil de médicos'],
    basePrice: 80000,
    priceNote: 'Investimento único',
    complexity: 'complex',
    deliveryDays: 45
  },
  {
    id: 'tourism',
    name: 'Website de Turismo',
    emoji: '✈️',
    shortDesc: 'Hotéis, agências e reservas online',
    description: 'Plataforma para hotéis, agências de viagens e passeios com reservas online.',
    examples: ['Reservas online', 'Galeria de destinos', 'Listagem de pacotes', 'Pagamento', 'Avaliações'],
    basePrice: 60000,
    priceNote: 'Investimento único',
    complexity: 'medium',
    deliveryDays: 30
  },
  {
    id: 'education',
    name: 'Website Educacional',
    emoji: '📚',
    shortDesc: 'Escolas, universidades e centros de formação',
    description: 'Plataforma digital para escolas, universidades e centros de formação com matrículas e área do aluno.',
    examples: ['Matrículas online', 'Área do aluno', 'Calendário escolar', 'Notícias', 'Corpo docente'],
    basePrice: 55000,
    priceNote: 'Investimento único',
    complexity: 'medium',
    deliveryDays: 30
  },
  {
    id: 'jobs',
    name: 'Website de Empregos',
    emoji: '💼',
    shortDesc: 'Divulgação de vagas e candidaturas online',
    description: 'Plataforma para divulgação de vagas, candidaturas online e gestão de currículos.',
    examples: ['Listagem de vagas', 'Candidaturas online', 'Gestão de currículos', 'Alertas de emprego'],
    basePrice: 50000,
    priceNote: 'Investimento único',
    complexity: 'medium',
    deliveryDays: 21
  },
  {
    id: 'portfolio',
    name: 'Portfólio',
    emoji: '🎨',
    shortDesc: 'Apresentação de trabalhos para freelancers',
    description: 'Apresentação de trabalhos. Muito utilizado por freelancers e profissionais criativos.',
    examples: ['Galeria de trabalhos', 'Sobre mim', 'Serviços', 'Contacto', 'Blog'],
    basePrice: 15000,
    priceNote: 'Investimento único',
    complexity: 'simple',
    deliveryDays: 10
  },
  {
    id: 'blog',
    name: 'Blog',
    emoji: '✍️',
    shortDesc: 'Publicação de artigos e marketing de conteúdo',
    description: 'Plataforma para publicação de artigos com SEO e marketing de conteúdo.',
    examples: ['Publicação de artigos', 'Categorias', 'SEO', 'Comentários', 'Newsletter'],
    basePrice: 18000,
    priceNote: 'Investimento único',
    complexity: 'simple',
    deliveryDays: 10
  },
  {
    id: 'streaming',
    name: 'Website de Streaming',
    emoji: '📺',
    shortDesc: 'Vídeos, música e transmissões ao vivo',
    description: 'Plataforma de streaming de vídeos, música e transmissões ao vivo com sistema de assinaturas.',
    examples: ['Player de vídeo', 'Músicas', 'Live streaming', 'Assinaturas', 'Biblioteca de conteúdos'],
    basePrice: 120000,
    priceNote: 'Preço sob orçamento',
    complexity: 'enterprise',
    deliveryDays: 90
  },
  {
    id: 'news',
    name: 'Portal de Notícias',
    emoji: '📰',
    shortDesc: 'Notícias organizadas por categorias',
    description: 'Portal de notícias organizadas por categorias com publicidade e assinaturas.',
    examples: ['Notícias por categoria', 'Publicidade', 'Assinaturas', 'Comentários', 'Pesquisa'],
    basePrice: 45000,
    priceNote: 'Investimento único',
    complexity: 'medium',
    deliveryDays: 25
  },
  {
    id: 'government',
    name: 'Website Governamental',
    emoji: '🏛️',
    shortDesc: 'Serviços públicos e informações institucionais',
    description: 'Plataforma para serviços públicos com formulários e informações institucionais.',
    examples: ['Serviços públicos', 'Formulários online', 'Informações', 'Notícias oficiais', 'Documentos'],
    basePrice: 85000,
    priceNote: 'Preço sob orçamento',
    complexity: 'complex',
    deliveryDays: 60
  },
  {
    id: 'ngo',
    name: 'Website de ONGs e Associações',
    emoji: '🤝',
    shortDesc: 'Projetos sociais, doações e voluntariado',
    description: 'Plataforma para organizações sociais com projetos, doações online e programas de voluntariado.',
    examples: ['Projetos sociais', 'Doações online', 'Voluntariado', 'Relatórios', 'Galeria'],
    basePrice: 30000,
    priceNote: 'Investimento único',
    complexity: 'medium',
    deliveryDays: 21
  }
];

// Simulação de armazenamento em localStorage
export interface SecurityLog {
  id: string;
  email: string;
  type: 'failed_login' | 'account_locked' | 'suspended_attempt';
  message: string;
  ipAddress?: string;
  country?: string;
  createdAt: string;
}

const SECURITY_LOGS_KEY = 'wehosthere_security_logs';
const SITES_KEY = 'wehosthere_sites';
const EMAILS_KEY = 'wehosthere_emails';

// Returns a user-specific email storage key to strictly isolate accounts per user
const getEmailsKey = (userEmail?: string): string => {
  if (userEmail) return `wehosthere_emails_${userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  return EMAILS_KEY;
};

// Clears email data that doesn't belong to the current user's domains from localStorage
const cleanupStaleEmails = (currentUserEmail: string): void => {
  if (typeof window === 'undefined') return;
  const cleanEmail = currentUserEmail.trim().toLowerCase();
  const userSites = dataManager.getSites(cleanEmail);
  const allowedDomains = new Set(userSites.map(s => (s.domain || '').toLowerCase().trim()).filter(Boolean));
  if (cleanEmail.includes('@')) {
    allowedDomains.add(cleanEmail.split('@')[1].trim().toLowerCase());
  }

  const userKey = getEmailsKey(cleanEmail);
  const existing = localStorage.getItem(userKey);
  if (existing) {
    try {
      const list: EmailAccount[] = JSON.parse(existing);
      const cleanList = list.filter(e => {
        const d = (e.domain || e.email.split('@')[1] || '').trim().toLowerCase();
        return allowedDomains.has(d);
      });
      localStorage.setItem(userKey, JSON.stringify(cleanList));
    } catch { /* ignore */ }
  }
};

export const dataManager = {
  // Sites
  getSites: (userEmail?: string): Site[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(SITES_KEY);
    const sites: Site[] = data ? JSON.parse(data) : [];
    if (userEmail) {
      const cleanEmail = userEmail.trim().toLowerCase();
      // ISOLAMENTO ESTRITO: Apenas sites pertencentes ao e-mail deste cliente
      return sites.filter(s => s.userEmail && s.userEmail.trim().toLowerCase() === cleanEmail);
    }
    return sites;
  },

  fetchSitesAsync: async (currentUserEmail?: string): Promise<Site[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/sites'));
      if (res.ok) {
        const data = await res.json();
        if (data.sites && Array.isArray(data.sites)) {
          const serverSites: Site[] = data.sites;
          const localSites = dataManager.getSites();

          const localSiteMap = new Map<string, Site>();
          localSites.forEach(s => {
            const key = (s.domain || s.id).toLowerCase();
            if (!s.userEmail && currentUserEmail) {
              s.userEmail = currentUserEmail;
            }
            localSiteMap.set(key, s);
          });

          const serverKeySet = new Set(serverSites.map(s => (s.domain || s.id).toLowerCase()));

          const updatedSites: Site[] = serverSites.map(serverSite => {
            const key = (serverSite.domain || serverSite.id).toLowerCase();
            const localMatch = localSiteMap.get(key);
            if (localMatch) {
              if (currentUserEmail) {
                // CLIENT: servidor tem prioridade — aprovações do admin propagam-se instantaneamente
                return {
                  ...localMatch,
                  ...serverSite,
                  status: serverSite.status || localMatch.status || 'pending',
                  userEmail: serverSite.userEmail || localMatch.userEmail || currentUserEmail
                };
              } else {
                // ADMIN: localStorage local tem prioridade — mudanças manuais do admin persistem mesmo após restart do servidor
                const effectiveStatus = localMatch.status || serverSite.status || 'pending';
                // Ressincronizar com o servidor se houver discordância
                if (serverSite.status !== effectiveStatus) {
                  fetch(apiEndpoint('/api/sites'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'update_status',
                      siteId: serverSite.id,
                      domain: serverSite.domain,
                      status: effectiveStatus,
                      userEmail: localMatch.userEmail || serverSite.userEmail
                    })
                  }).catch(() => {});
                }
                return {
                  ...serverSite,
                  ...localMatch,
                  status: effectiveStatus,
                  userEmail: serverSite.userEmail || localMatch.userEmail
                };
              }
            }
            return {
              ...serverSite,
              userEmail: serverSite.userEmail || currentUserEmail
            };
          });

          // Preserve only newly created local sites that haven't synced to server yet (< 15 seconds old)
          localSites.forEach(localSite => {
            const key = (localSite.domain || localSite.id).toLowerCase();
            if (!serverKeySet.has(key)) {
              const createdAtTime = new Date(localSite.createdAt).getTime();
              const isJustCreated = !isNaN(createdAtTime) && (Date.now() - createdAtTime < 15000);
              if (isJustCreated) {
                updatedSites.push(localSite);
                fetch(apiEndpoint('/api/sites'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ site: localSite })
                }).catch(() => {});
              }
            }
          });

          if (typeof window !== 'undefined') {
            localStorage.setItem(SITES_KEY, JSON.stringify(updatedSites));
          }

          if (currentUserEmail) {
            const cleanUserEmail = currentUserEmail.trim().toLowerCase();
            // ISOLAMENTO ESTRITO: Retorna apenas sites pertencentes a este cliente
            return updatedSites.filter(s => s.userEmail && s.userEmail.trim().toLowerCase() === cleanUserEmail);
          }
          return updatedSites;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar sites da API:', e);
    }
    return currentUserEmail ? dataManager.getSites(currentUserEmail) : dataManager.getSites();
  },


  addSiteAsync: async (site: Omit<Site, 'id' | 'createdAt'>): Promise<Site> => {
    const cleanDomain = site.domain.trim().toLowerCase();
    if (!cleanDomain) {
      throw new Error('Por favor, insira um nome de domínio válido.');
    }
    const currentUser = auth.getCurrentUser();
    const newSite: Site = {
      ...site,
      domain: cleanDomain,
      userEmail: site.userEmail || currentUser?.email,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    // Database-First: Enviar primeiro ao MongoDB Atlas
    try {
      const res = await fetch(apiEndpoint('/api/sites'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: newSite })
      });
      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Erro ao gravar domínio no banco de dados.');
      }
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error('Falha de ligação ao servidor ao registar domínio.');
    }

    const sites = dataManager.getSites();
    sites.push(newSite);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SITES_KEY, JSON.stringify(sites));
    }
    return newSite;
  },

  addSite: (site: Omit<Site, 'id' | 'createdAt'>): Site => {
    const cleanDomain = site.domain.trim().toLowerCase();
    if (!cleanDomain) {
      throw new Error('Por favor, insira um nome de domínio válido.');
    }
    const currentUser = auth.getCurrentUser();
    const sites = dataManager.getSites();
    const newSite: Site = {
      ...site,
      domain: cleanDomain,
      userEmail: site.userEmail || currentUser?.email,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    sites.push(newSite);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SITES_KEY, JSON.stringify(sites));

      fetch(apiEndpoint('/api/sites'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: newSite })
      }).catch(err => console.error('Erro de sync de site no servidor:', err));
    }
    return newSite;
  },

  deleteSite: (id: string, domain?: string): void => {
    const targetDomain = (domain || id).toLowerCase();
    const sites = dataManager.getSites().filter(
      s => s.id !== id && (s.domain || '').toLowerCase() !== targetDomain
    );
    if (typeof window !== 'undefined') {
      localStorage.setItem(SITES_KEY, JSON.stringify(sites));

      fetch(apiEndpoint('/api/sites'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', siteId: id, domain: targetDomain })
      }).catch(err => console.error('Erro de exclusão de site no servidor:', err));

      // Auto-delete any associated emails for this domain locally and on server
      if (targetDomain) {
        // 1. Local cascade delete
        const emails = dataManager.getEmails();
        const emailsToDelete = emails.filter(e => {
          const domainOfEmail = e.email.includes('@') ? e.email.split('@')[1].toLowerCase() : '';
          return domainOfEmail === targetDomain || e.email.toLowerCase().endsWith(`@${targetDomain}`);
        });
        emailsToDelete.forEach(e => {
          dataManager.deleteEmail(e.id, e.userEmail, e.email);
        });

        // 2. Server API cascade delete for all emails of this domain
        fetch(apiEndpoint('/api/emails'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', domain: targetDomain })
        }).catch(err => console.error('Erro de exclusão de emails do domínio no servidor:', err));
      }
    }
  },


  updateSiteStatus: (id: string, status: Site['status']): void => {
    const sites = dataManager.getSites().map(s => 
      (s.id === id || (s.domain && s.domain.toLowerCase() === id.toLowerCase())) ? { ...s, status } : s
    );
    const targetSite = sites.find(s => s.id === id || (s.domain && s.domain.toLowerCase() === id.toLowerCase()));

    if (typeof window !== 'undefined') {
      localStorage.setItem(SITES_KEY, JSON.stringify(sites));

      fetch(apiEndpoint('/api/sites'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update_status', 
          siteId: id, 
          domain: targetSite?.domain || id, 
          status,
          userEmail: targetSite?.userEmail
        })
      }).catch(err => console.error('Erro de sync de status de site:', err));
    }
  },

  // Emails - uses per-user key for strict isolation
  getEmails: (userEmail?: string): EmailAccount[] => {
    if (typeof window === 'undefined') return [];
    if (userEmail) {
      const cleanUserEmail = userEmail.trim().toLowerCase();
      const userKey = getEmailsKey(cleanUserEmail);
      const data = localStorage.getItem(userKey);
      const list: EmailAccount[] = data ? JSON.parse(data) : [];

      const userSites = dataManager.getSites(cleanUserEmail);
      const allowedDomains = new Set(userSites.map(s => (s.domain || '').toLowerCase().trim()).filter(Boolean));
      if (cleanUserEmail.includes('@')) {
        allowedDomains.add(cleanUserEmail.split('@')[1].trim().toLowerCase());
      }

      // Filtrar estritamente: NUNCA retornar contas de domínios que o cliente não possui
      const filtered = list.filter(e => {
        const d = (e.domain || e.email.split('@')[1] || '').trim().toLowerCase();
        return allowedDomains.has(d);
      });

      // Se havia emails estranhos (como hinguiliartes), purgar do localStorage imediatamente
      if (filtered.length !== list.length) {
        localStorage.setItem(userKey, JSON.stringify(filtered));
      }

      return filtered;
    }
    const data = localStorage.getItem(EMAILS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Initialize email storage for a user (call on login)
  initUserEmails: (userEmail: string): void => {
    if (typeof window === 'undefined') return;
    cleanupStaleEmails(userEmail);
  },

  fetchEmailsAsync: async (currentUserEmail?: string): Promise<EmailAccount[]> => {
    try {
      const queryParam = currentUserEmail ? `?userEmail=${encodeURIComponent(currentUserEmail.trim().toLowerCase())}` : '';
      const res = await fetch(apiEndpoint(`/api/emails${queryParam}`));
      if (res.ok) {
        const data = await res.json();
        if (data.emails && Array.isArray(data.emails)) {
          const serverEmails: EmailAccount[] = data.emails;

          if (currentUserEmail) {
            const cleanUserEmail = currentUserEmail.trim().toLowerCase();
            const userSites = dataManager.getSites(currentUserEmail);
            const userDomainNames = new Set(userSites.map(s => (s.domain || '').toLowerCase().trim()).filter(Boolean));
            if (cleanUserEmail.includes('@')) {
              userDomainNames.add(cleanUserEmail.split('@')[1].trim().toLowerCase());
            }

            // Match emails ONLY if their domain belongs to userDomainNames
            const myServerEmails = serverEmails.filter(e => {
              const d = (e.domain || e.email?.split('@')[1] || '').trim().toLowerCase();
              return d && userDomainNames.has(d);
            });

            const userKey = getEmailsKey(currentUserEmail);
            const localData = localStorage.getItem(userKey);
            const localEmails: EmailAccount[] = localData ? JSON.parse(localData) : [];

            const updated: EmailAccount[] = [];
            const processedKeys = new Set<string>();

            // 1. Preservar apenas e-mails locais pertencentes a domínios do cliente
            localEmails.forEach(local => {
              const d = (local.domain || local.email.split('@')[1] || '').trim().toLowerCase();
              if (!userDomainNames.has(d)) return; // DESCARTA e-mails de terceiros como hinguiliartes

              const key = local.email.toLowerCase();
              processedKeys.add(key);

              const serverMatch = myServerEmails.find(
                s => s.email.toLowerCase() === key || s.id === local.id
              );

              if (serverMatch) {
                updated.push({
                  ...local,
                  ...serverMatch,
                  status: serverMatch.status || local.status,
                  userEmail: serverMatch.userEmail || local.userEmail || currentUserEmail
                });
              } else {
                // Preservar e-mails locais do cliente e enviar ao servidor
                updated.push({
                  ...local,
                  userEmail: local.userEmail || currentUserEmail
                });

                fetch(apiEndpoint('/api/emails'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: { ...local, userEmail: local.userEmail || currentUserEmail } })
                }).catch(() => {});
              }
            });

            // 2. Adicionar e-mails do servidor que ainda não constam no localStorage local
            myServerEmails.forEach(serverEmail => {
              const key = serverEmail.email.toLowerCase();
              if (!processedKeys.has(key)) {
                processedKeys.add(key);
                updated.push(serverEmail);
              }
            });

            localStorage.setItem(userKey, JSON.stringify(updated));

            // Sincronizar também no storage global do Admin para visibilidade imediata
            const sharedData = localStorage.getItem(EMAILS_KEY);
            const sharedEmails: EmailAccount[] = sharedData ? JSON.parse(sharedData) : [];
            const sharedMap = new Map<string, EmailAccount>();
            sharedEmails.forEach(e => sharedMap.set(e.email.toLowerCase(), e));
            updated.forEach(e => sharedMap.set(e.email.toLowerCase(), e));
            localStorage.setItem(EMAILS_KEY, JSON.stringify(Array.from(sharedMap.values())));

            return updated;
          }

          // Admin use: merge server emails with local — local status has priority (admin decisions persist)
          if (typeof window !== 'undefined') {
            const localAdminEmails: EmailAccount[] = JSON.parse(localStorage.getItem(EMAILS_KEY) || '[]');
            const localAdminMap = new Map<string, EmailAccount>();
            localAdminEmails.forEach(e => localAdminMap.set(e.email.toLowerCase(), e));

            const merged: EmailAccount[] = serverEmails.map(serverEmail => {
              const key = serverEmail.email.toLowerCase();
              const localMatch = localAdminMap.get(key);
              if (localMatch) {
                const effectiveStatus = localMatch.status || serverEmail.status || 'pending';
                // Re-sync server if admin had a different status stored locally
                if (serverEmail.status !== effectiveStatus) {
                  fetch(apiEndpoint('/api/emails'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update_status', emailId: serverEmail.id, emailStr: serverEmail.email, status: effectiveStatus })
                  }).catch(() => {});
                }
                return { ...serverEmail, ...localMatch, status: effectiveStatus };
              }
              return serverEmail;
            });

            // Preserve local emails not in server yet
            localAdminEmails.forEach(local => {
              if (!serverEmails.find(s => s.email.toLowerCase() === local.email.toLowerCase())) {
                merged.push(local);
                fetch(apiEndpoint('/api/emails'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: local })
                }).catch(() => {});
              }
            });

            localStorage.setItem(EMAILS_KEY, JSON.stringify(merged));
            return merged;
          }
          return serverEmails;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar e-mails da API:', e);
    }
    return currentUserEmail ? dataManager.getEmails(currentUserEmail) : dataManager.getEmails();
  },

  addEmail: (email: Omit<EmailAccount, 'id' | 'createdAt'>): EmailAccount => {
    const userEmailOwner = email.userEmail;
    const targetAddress = email.email.trim().toLowerCase();
    const allEmails = dataManager.getEmails();
    const exists = allEmails.find(e => e.email.trim().toLowerCase() === targetAddress);
    if (exists) {
      throw new Error(`A conta de e-mail "${email.email}" já se encontra registada no sistema. Por favor, escolha outro prefixo ou endereço.`);
    }

    const emails = userEmailOwner ? dataManager.getEmails(userEmailOwner) : dataManager.getEmails();
    const newEmail: EmailAccount = {
      ...email,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    emails.push(newEmail);
    if (typeof window !== 'undefined') {
      // Save to user-specific key if we know the owner
      const storageKey = userEmailOwner ? getEmailsKey(userEmailOwner) : EMAILS_KEY;
      localStorage.setItem(storageKey, JSON.stringify(emails));

      // Also add to shared EMAILS_KEY for admin visibility
      const sharedData = localStorage.getItem(EMAILS_KEY);
      const sharedEmails: EmailAccount[] = sharedData ? JSON.parse(sharedData) : [];
      if (!sharedEmails.find(e => e.email.toLowerCase() === newEmail.email.toLowerCase())) {
        sharedEmails.push(newEmail);
        localStorage.setItem(EMAILS_KEY, JSON.stringify(sharedEmails));
      }

      fetch(apiEndpoint('/api/emails'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      }).catch(err => console.error('Erro de sync de e-mail no servidor:', err));
    }
    return newEmail;
  },

  addEmailAsync: async (email: Omit<EmailAccount, 'id' | 'createdAt'>, userEmailOwner?: string): Promise<EmailAccount> => {
    // 1. Trava de unicidade de e-mail no servidor antes de criar
    const allEmails = await dataManager.fetchEmailsAsync();
    const targetEmailStr = email.email.trim().toLowerCase();
    const existing = allEmails.find(e => e.email.trim().toLowerCase() === targetEmailStr);
    if (existing) {
      throw new Error(`A conta de e-mail "${email.email}" já se encontra registada no sistema. Por favor, escolha outro prefixo ou endereço.`);
    }

    const newEmail: EmailAccount = {
      ...email,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    // 2. Database-First: Enviar primeiro ao MongoDB Atlas
    try {
      const res = await fetch(apiEndpoint('/api/emails'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      });
      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Erro ao criar conta de e-mail no banco de dados do servidor.');
      }
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error('Falha de ligação ao servidor ao criar conta de e-mail.');
    }

    // 3. Gravar na cache local após confirmação do servidor
    const emails = userEmailOwner ? dataManager.getEmails(userEmailOwner) : dataManager.getEmails();
    emails.push(newEmail);
    if (typeof window !== 'undefined') {
      const storageKey = userEmailOwner ? getEmailsKey(userEmailOwner) : EMAILS_KEY;
      localStorage.setItem(storageKey, JSON.stringify(emails));

      const sharedData = localStorage.getItem(EMAILS_KEY);
      const sharedEmails: EmailAccount[] = sharedData ? JSON.parse(sharedData) : [];
      if (!sharedEmails.find(e => e.email.toLowerCase() === newEmail.email.toLowerCase())) {
        sharedEmails.push(newEmail);
        localStorage.setItem(EMAILS_KEY, JSON.stringify(sharedEmails));
      }
    }
    return newEmail;
  },

  deleteEmail: (id: string, ownerEmail?: string, emailStr?: string): void => {
    const targetEmailStr = (emailStr || '').toLowerCase();
    
    if (typeof window !== 'undefined') {
      // 1. Delete from user-specific storage (if ownerEmail is known)
      if (ownerEmail) {
        const userKey = getEmailsKey(ownerEmail);
        const userEmails: EmailAccount[] = JSON.parse(localStorage.getItem(userKey) || '[]');
        const filteredUser = userEmails.filter(e => e.id !== id && (!targetEmailStr || e.email.toLowerCase() !== targetEmailStr));
        localStorage.setItem(userKey, JSON.stringify(filteredUser));
      }

      // 2. Scan ALL localStorage keys for user-specific email stores and purge from each
      // This ensures deletion propagates even if ownerEmail is unknown
      const keysToCheck: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('wehosthere_emails_')) {
          keysToCheck.push(key);
        }
      }
      keysToCheck.forEach(key => {
        try {
          const stored: EmailAccount[] = JSON.parse(localStorage.getItem(key) || '[]');
          const filtered = stored.filter(e => e.id !== id && (!targetEmailStr || e.email.toLowerCase() !== targetEmailStr));
          if (filtered.length !== stored.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        } catch { /* ignore */ }
      });

      // 3. Delete from shared storage (admin key)
      const sharedData = localStorage.getItem(EMAILS_KEY);
      if (sharedData) {
        const sharedEmails: EmailAccount[] = JSON.parse(sharedData);
        const filteredShared = sharedEmails.filter(e => e.id !== id && (!targetEmailStr || e.email.toLowerCase() !== targetEmailStr));
        localStorage.setItem(EMAILS_KEY, JSON.stringify(filteredShared));
      }

      // 4. Delete from Server API
      fetch(apiEndpoint('/api/emails'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', emailId: id, emailStr: targetEmailStr })
      }).catch(err => console.error('Erro de exclusão de e-mail no servidor:', err));
    }
  },


  updateEmail: (id: string, updates: Partial<EmailAccount>): EmailAccount | null => {
    const emails = dataManager.getEmails();
    const index = emails.findIndex(e => e.id === id || e.email === id);
    if (index !== -1) {
      emails[index] = { ...emails[index], ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(EMAILS_KEY, JSON.stringify(emails));

        fetch(apiEndpoint('/api/emails'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emails[index] })
        }).catch(err => console.error('Erro de sync de e-mail:', err));
      }
      return emails[index];
    }
    return null;
  },

  updateEmailStatus: (id: string, status: EmailAccount['status']): void => {
    const sharedEmails = dataManager.getEmails().map(e => 
      (e.id === id || (e.email && e.email.toLowerCase() === id.toLowerCase())) ? { ...e, status } : e
    );
    const targetEmail = sharedEmails.find(e => e.id === id || (e.email && e.email.toLowerCase() === id.toLowerCase()));

    if (typeof window !== 'undefined') {
      // 1. Update shared admin key
      localStorage.setItem(EMAILS_KEY, JSON.stringify(sharedEmails));

      // 2. Also update per-user keys so client sees change immediately
      const keysToUpdate: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('wehosthere_emails_')) {
          keysToUpdate.push(key);
        }
      }
      keysToUpdate.forEach(key => {
        try {
          const stored: EmailAccount[] = JSON.parse(localStorage.getItem(key) || '[]');
          const updated = stored.map(e =>
            (e.id === id || (e.email && e.email.toLowerCase() === id.toLowerCase())) ? { ...e, status } : e
          );
          localStorage.setItem(key, JSON.stringify(updated));
        } catch { /* ignore */ }
      });

      // 3. Sync to server
      fetch(apiEndpoint('/api/emails'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update_status', 
          emailId: id, 
          emailStr: targetEmail?.email || id, 
          status,
          emails: sharedEmails 
        })
      }).catch(err => console.error('Erro de sync de status de email:', err));
    }
  },


  // Pedidos de Serviços
  getOrders: (clientEmail?: string): ServiceOrder[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_orders');
    const orders: ServiceOrder[] = data ? JSON.parse(data) : [];
    if (clientEmail) {
      return orders.filter(o => !o.clientEmail || o.clientEmail.toLowerCase() === clientEmail.toLowerCase());
    }
    return orders;
  },

  // Função otimizada para verificar pagamentos de cursos específicos
  hasPaidForCourse: async (userEmail: string, courseTitle: string): Promise<boolean> => {
    try {
      // Busca apenas pedidos de cursos do usuário (filtro no servidor)
      const res = await fetch(apiEndpoint('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_course_payment',
          email: userEmail,
          courseTitle: courseTitle
        })
      });

      if (res.ok) {
        const data = await res.json();
        return data.hasPaid === true;
      }
    } catch (e) {
      console.error('Erro ao verificar pagamento do curso:', e);
    }

    // Fallback: verificar localmente (apenas se API falhar)
    const orders = dataManager.getOrders(userEmail);
    return orders.some(o => 
      o.status === 'completed' && 
      (
        o.serviceName?.toLowerCase().includes('curso') || 
        o.serviceName?.toLowerCase().includes(courseTitle.toLowerCase())
      )
    );
  },

  fetchOrdersAsync: async (): Promise<ServiceOrder[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/orders'));
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          const serverOrders: ServiceOrder[] = data.orders;
          const localOrders = dataManager.getOrders();
          const serverKeySet = new Set(serverOrders.map(o => o.id));

          const merged: ServiceOrder[] = [...serverOrders];

          // Preserve only newly created local orders (< 15s old) not yet on server
          localOrders.forEach(local => {
            if (!serverKeySet.has(local.id)) {
              const createdAtTime = new Date(local.createdAt || '').getTime();
              const isJustCreated = !isNaN(createdAtTime) && (Date.now() - createdAtTime < 15000);
              if (isJustCreated) {
                merged.push(local);
              }
            }
          });

          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_orders', JSON.stringify(merged));
          }
          return merged;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar pedidos da API:', e);
    }
    return dataManager.getOrders();
  },

  addOrder: (order: Omit<ServiceOrder, 'id' | 'createdAt'>): ServiceOrder => {
    const orders = dataManager.getOrders();
    const newOrder: ServiceOrder = {
      ...order,
      id: `ORD-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString()
    };
    orders.unshift(newOrder);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_orders', JSON.stringify(orders));

      fetch(apiEndpoint('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      }).catch(err => console.error('Erro de sync de pedido no servidor:', err));
    }
    return newOrder;
  },

  deleteOrder: (id: string): void => {
    const orders = dataManager.getOrders().filter(o => o.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_orders', JSON.stringify(orders));

      fetch(apiEndpoint('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', orderId: id })
      }).catch(err => console.error('Erro de exclusão de pedido no servidor:', err));
    }
  },

  updateOrderStatus: (id: string, status: ServiceOrder['status'], forceAdmin: boolean = true): void => {
    const orders = dataManager.getOrders().map(o => o.id === id ? { ...o, status } : o);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_orders', JSON.stringify(orders));

      fetch(apiEndpoint('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', orderId: id, status, forceAdmin: true })
      }).catch(err => console.error('Erro de sync de status de pedido:', err));
    }
  },

  // Webhook Events
  getWebhookEvents: (): WebhookEvent[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_webhook_events');
    return data ? JSON.parse(data) : [];
  },

  addWebhookEvent: (event: Omit<WebhookEvent, 'id' | 'createdAt'>): WebhookEvent => {
    const events = dataManager.getWebhookEvents();
    const newEvent: WebhookEvent = {
      ...event,
      id: `WEB-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString()
    };
    events.unshift(newEvent);
    // Manter apenas os últimos 100 eventos
    if (events.length > 100) {
      events.pop();
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_webhook_events', JSON.stringify(events));
    }
    return newEvent;
  },

  clearWebhookEvents: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_webhook_events', JSON.stringify([]));
    }
  },

  getTickets: (): SupportTicket[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_tickets');
    return data ? JSON.parse(data) : [];
  },

  fetchTicketsAsync: async (): Promise<SupportTicket[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/tickets'));
      if (res.ok) {
        const data = await res.json();
        if (data.tickets && Array.isArray(data.tickets)) {
          const serverTickets: SupportTicket[] = data.tickets;
          const localTickets = dataManager.getTickets();
          const serverKeySet = new Set(serverTickets.map(t => t.id));

          const merged: SupportTicket[] = [...serverTickets];

          // Preserve only newly created local tickets (< 15s old) not yet on server
          localTickets.forEach(local => {
            if (!serverKeySet.has(local.id)) {
              const createdAtTime = new Date(local.createdAt || '').getTime();
              const isJustCreated = !isNaN(createdAtTime) && (Date.now() - createdAtTime < 15000);
              if (isJustCreated) {
                merged.push(local);
              }
            }
          });

          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_tickets', JSON.stringify(merged));
          }
          return merged;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar tickets da API:', e);
    }
    return dataManager.getTickets();
  },

  addTicket: (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'> & { initialMessage: string; initialAttachments?: TicketAttachment[] }): SupportTicket => {
    const tickets = dataManager.getTickets();
    const now = new Date().toISOString();
    const newTicket: SupportTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: ticketData.userId,
      userName: ticketData.userName,
      userEmail: ticketData.userEmail,
      subject: ticketData.subject,
      category: ticketData.category,
      priority: ticketData.priority,
      status: ticketData.status || 'open',
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'client',
          senderName: ticketData.userName,
          message: ticketData.initialMessage,
          timestamp: now,
          attachments: ticketData.initialAttachments || []
        }
      ]
    };
    tickets.unshift(newTicket);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_tickets', JSON.stringify(tickets));

      fetch(apiEndpoint('/api/tickets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ticket: newTicket })
      }).catch(err => console.error('Erro de sync de ticket no servidor:', err));
    }
    return newTicket;
  },

  addTicketReply: (ticketId: string, sender: 'client' | 'support' | 'admin', senderName: string, message: string, newStatus?: SupportTicket['status'], attachments?: TicketAttachment[]): SupportTicket | null => {
    const tickets = dataManager.getTickets();
    const index = tickets.findIndex(t => t.id === ticketId);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const newMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      sender,
      senderName,
      message,
      timestamp: now,
      attachments: attachments || []
    };

    const updatedTicket: SupportTicket = {
      ...tickets[index],
      updatedAt: now,
      status: newStatus || (sender === 'client' ? 'open' : 'answered'),
      messages: [...tickets[index].messages, newMessage]
    };

    tickets[index] = updatedTicket;
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_tickets', JSON.stringify(tickets));

      fetch(apiEndpoint('/api/tickets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', ticketId, message: newMessage, newStatus: updatedTicket.status })
      }).catch(err => console.error('Erro de sync de resposta de ticket no servidor:', err));
    }
    return updatedTicket;
  },

  updateTicketStatus: (ticketId: string, status: SupportTicket['status'], priority?: SupportTicket['priority']): void => {
    const tickets = dataManager.getTickets().map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status,
          priority: priority || t.priority,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_tickets', JSON.stringify(tickets));

      fetch(apiEndpoint('/api/tickets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', ticketId, status, priority })
      }).catch(err => console.error('Erro de sync de status de ticket:', err));
    }
  },

  // Security Audit Logs
  getSecurityLogs: (): SecurityLog[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(SECURITY_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  fetchSecurityLogsAsync: async (): Promise<SecurityLog[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/security/logs'));
      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(data.logs));
          }
          return data.logs;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar logs de segurança:', e);
    }
    return dataManager.getSecurityLogs();
  },

  addSecurityLog: (email: string, type: 'failed_login' | 'account_locked' | 'suspended_attempt', message: string, ipAddress?: string, country?: string): SecurityLog => {
    const logs = dataManager.getSecurityLogs();
    const newLog: SecurityLog = {
      id: Date.now().toString(),
      email: email.trim().toLowerCase(),
      type,
      message,
      ipAddress,
      country,
      createdAt: new Date().toISOString()
    };
    const updated = [newLog, ...logs].slice(0, 50);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(updated));

      fetch(apiEndpoint('/api/security/logs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: newLog })
      }).catch(() => {});
    }
    return newLog;
  },

  // Systems for Rent
  getSystemsForRent: (): SystemForRent[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_systems');
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  fetchSystemsForRentAsync: async (): Promise<SystemForRent[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/systems'));
      if (res.ok) {
        const data = await res.json();
        if (data.systems && Array.isArray(data.systems)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_systems', JSON.stringify(data.systems));
          }
          return data.systems;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar sistemas:', e);
    }
    return dataManager.getSystemsForRent();
  },

  addSystemForRent: (systemData: Omit<SystemForRent, 'id' | 'createdAt' | 'updatedAt'>): SystemForRent => {
    const systems = dataManager.getSystemsForRent();
    const now = new Date().toISOString();
    const newSystem: SystemForRent = {
      ...systemData,
      id: `SYS-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: now,
      updatedAt: now
    };
    systems.unshift(newSystem);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_systems', JSON.stringify(systems));

      fetch(apiEndpoint('/api/systems'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', system: newSystem })
      }).catch(err => console.error('Erro de sync de sistema no servidor:', err));
    }
    return newSystem;
  },

  updateSystemForRent: (systemId: string, updates: Partial<SystemForRent>): void => {
    const systems = dataManager.getSystemsForRent().map(s => {
      if (s.id === systemId) {
        return { ...s, ...updates, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_systems', JSON.stringify(systems));

      fetch(apiEndpoint('/api/systems'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', systemId, updates })
      }).catch(err => console.error('Erro de sync de atualização de sistema:', err));
    }
  },

  deleteSystemForRent: (systemId: string): void => {
    const systems = dataManager.getSystemsForRent().filter(s => s.id !== systemId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_systems', JSON.stringify(systems));

      fetch(apiEndpoint('/api/systems'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', systemId })
      }).catch(err => console.error('Erro de sync de remoção de sistema:', err));
    }
  },

  // Rental Requests
  getRentalRequests: (): RentalRequest[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_rental_requests');
    return data ? JSON.parse(data) : [];
  },

  fetchRentalRequestsAsync: async (): Promise<RentalRequest[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/rental-requests'));
      if (res.ok) {
        const data = await res.json();
        if (data.requests && Array.isArray(data.requests)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_rental_requests', JSON.stringify(data.requests));
          }
          return data.requests;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar pedidos de aluguer:', e);
    }
    return dataManager.getRentalRequests();
  },

  addRentalRequest: (requestData: Omit<RentalRequest, 'id' | 'createdAt'>): RentalRequest => {
    const requests = dataManager.getRentalRequests();
    const now = new Date().toISOString();
    const newRequest: RentalRequest = {
      ...requestData,
      id: `RQ-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: now
    };
    requests.unshift(newRequest);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_rental_requests', JSON.stringify(requests));

      fetch(apiEndpoint('/api/rental-requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', request: newRequest })
      }).catch(err => console.error('Erro de sync de pedido de aluguer no servidor:', err));
    }
    return newRequest;
  },

  updateRentalRequest: (requestId: string, updates: Partial<RentalRequest>): void => {
    const requests = dataManager.getRentalRequests().map(r => {
      if (r.id === requestId) {
        return { ...r, ...updates };
      }
      return r;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_rental_requests', JSON.stringify(requests));

      fetch(apiEndpoint('/api/rental-requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', requestId, updates })
      }).catch(err => console.error('Erro de sync de atualização de pedido de aluguer:', err));
    }
  },

  // System Access
  getSystemAccesses: (): SystemAccess[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_system_accesses');
    return data ? JSON.parse(data) : [];
  },

  fetchSystemAccessesAsync: async (): Promise<SystemAccess[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/system-accesses'));
      if (res.ok) {
        const data = await res.json();
        if (data.accesses && Array.isArray(data.accesses)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_system_accesses', JSON.stringify(data.accesses));
          }
          return data.accesses;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar acessos de sistemas:', e);
    }
    return dataManager.getSystemAccesses();
  },

  addSystemAccess: (accessData: Omit<SystemAccess, 'id' | 'createdAt'>): SystemAccess => {
    const accesses = dataManager.getSystemAccesses();
    const now = new Date().toISOString();
    const newAccess: SystemAccess = {
      ...accessData,
      id: `ACC-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: now
    };
    accesses.unshift(newAccess);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_system_accesses', JSON.stringify(accesses));

      fetch(apiEndpoint('/api/system-accesses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', access: newAccess })
      }).catch(err => console.error('Erro de sync de acesso de sistema no servidor:', err));
    }
    return newAccess;
  },

  updateSystemAccess: (accessId: string, updates: Partial<SystemAccess>): void => {
    const accesses = dataManager.getSystemAccesses().map(a => {
      if (a.id === accessId) {
        return { ...a, ...updates };
      }
      return a;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_system_accesses', JSON.stringify(accesses));

      fetch(apiEndpoint('/api/system-accesses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', accessId, updates })
      }).catch(err => console.error('Erro de sync de atualização de acesso de sistema:', err));
    }
  },

  getClientSystemAccesses: (clientEmail: string): SystemAccess[] => {
    return dataManager.getSystemAccesses().filter(a => 
      a.clientEmail.toLowerCase() === clientEmail.toLowerCase()
    );
  },

  // System Ratings
  getSystemRatings: (): SystemRating[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_system_ratings');
    return data ? JSON.parse(data) : [];
  },

  fetchSystemRatingsAsync: async (): Promise<SystemRating[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/system-ratings'));
      if (res.ok) {
        const data = await res.json();
        if (data.ratings && Array.isArray(data.ratings)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_system_ratings', JSON.stringify(data.ratings));
          }
          return data.ratings;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar avaliações:', e);
    }
    return dataManager.getSystemRatings();
  },

  addSystemRating: (ratingData: Omit<SystemRating, 'id' | 'createdAt'>): SystemRating => {
    const ratings = dataManager.getSystemRatings();
    const now = new Date().toISOString();
    const newRating: SystemRating = {
      ...ratingData,
      id: `RT-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: now
    };
    ratings.unshift(newRating);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_system_ratings', JSON.stringify(ratings));

      fetch(apiEndpoint('/api/system-ratings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', rating: newRating })
      }).catch(err => console.error('Erro de sync de avaliação no servidor:', err));
    }
    return newRating;
  },

  getSystemRatingsBySystemId: (systemId: string): SystemRating[] => {
    return dataManager.getSystemRatings().filter(r => r.systemId === systemId);
  },

  getAverageRating: (systemId: string): number => {
    const ratings = dataManager.getSystemRatingsBySystemId(systemId);
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  },

  getSocialProofs: (): SocialProof[] => {
    const DEFAULT_SOCIAL_PROOFS: SocialProof[] = [
      { id: 'sp-1', userName: 'Carlos M.', location: 'Maputo', action: 'contratou o plano Profissional SSD', timeAgo: 'há 3 min', active: true },
      { id: 'sp-2', userName: 'Ana S.', location: 'Matola', action: 'registou o domínio empresa.co.mz', timeAgo: 'há 7 min', active: true },
      { id: 'sp-3', userName: 'Nelson B.', location: 'Beira', action: 'alugou o Sistema ERP de Vendas', timeAgo: 'há 12 min', active: true },
      { id: 'sp-4', userName: 'Fátima Z.', location: 'Nampula', action: 'solicitou a criação de Loja E-commerce', timeAgo: 'há 18 min', active: true },
      { id: 'sp-5', userName: 'Sousa J.', location: 'Tete', action: 'subiu para o plano Empresarial', timeAgo: 'há 25 min', active: true },
      { id: 'sp-6', userName: 'Mélio A.', location: 'Chimoio', action: 'configurou 5 contas de Email Corporativo', timeAgo: 'há 34 min', active: true }
    ];

    if (typeof window === 'undefined') return DEFAULT_SOCIAL_PROOFS;
    const data = localStorage.getItem('wehosthere_social_proofs');
    return data ? JSON.parse(data) : DEFAULT_SOCIAL_PROOFS;
  },

  addSocialProof: (proof: Omit<SocialProof, 'id'>): SocialProof => {
    const proofs = dataManager.getSocialProofs();
    const newProof: SocialProof = {
      ...proof,
      id: `sp-${Date.now()}`
    };
    proofs.unshift(newProof);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehost_social_proofs', JSON.stringify(proofs));
    }
    return newProof;
  },

  toggleSocialProof: (id: string): SocialProof[] => {
    const proofs = dataManager.getSocialProofs();
    const updated = proofs.map(p => p.id === id ? { ...p, active: !p.active } : p);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehost_social_proofs', JSON.stringify(updated));
    }
    return updated;
  },

  deleteSocialProof: (id: string): SocialProof[] => {
    const proofs = dataManager.getSocialProofs();
    const filtered = proofs.filter(p => p.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehost_social_proofs', JSON.stringify(filtered));
    }
    return filtered;
  },

  // Referrals
  getReferrals: (): Referral[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_referrals');
    return data ? JSON.parse(data) : [];
  },

  fetchReferralsAsync: async (): Promise<Referral[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/referrals'));
      if (res.ok) {
        const data = await res.json();
        if (data.referrals && Array.isArray(data.referrals)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_referrals', JSON.stringify(data.referrals));
          }
          return data.referrals;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar referrals:', e);
    }
    return dataManager.getReferrals();
  },

  createReferral: (referrerEmail: string, referrerName: string): Referral => {
    const referrals = dataManager.getReferrals();
    const existing = referrals.find(r => r.referrerEmail === referrerEmail);
    if (existing) return existing;

    const now = new Date().toISOString();
    const referralCode = `WH${referrerEmail.substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
    const newReferral: Referral = {
      id: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      referrerEmail,
      referrerName,
      referralCode,
      status: 'active',
      totalReferrals: 0,
      totalCommissions: 0,
      createdAt: now,
      updatedAt: now
    };
    referrals.unshift(newReferral);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_referrals', JSON.stringify(referrals));

      fetch(apiEndpoint('/api/referrals'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', referral: newReferral })
      }).catch(err => console.error('Erro de sync de referral no servidor:', err));
    }
    return newReferral;
  },

  // Partners methods
  getPartners: (): Partner[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_partners');
    return data ? JSON.parse(data) : [];
  },

  fetchPartnersAsync: async (): Promise<Partner[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/partners'));
      if (res.ok) {
        const data = await res.json();
        if (data.partners && Array.isArray(data.partners)) {
          const serverPartners: Partner[] = data.partners;
          if (typeof window !== 'undefined') {
            const localPartners = dataManager.getPartners();
            // If local storage has partners created prior to API availability, sync them to server
            if (localPartners.length > 0) {
              const missingOnServer = localPartners.filter(lp => !serverPartners.some(sp => sp.id === lp.id));
              if (missingOnServer.length > 0) {
                const merged = [...serverPartners, ...missingOnServer];
                fetch(apiEndpoint('/api/partners'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'sync_all', partners: merged })
                }).catch(err => console.error('Erro de sync_all partner:', err));
                localStorage.setItem('wehosthere_partners', JSON.stringify(merged));
                return merged;
              }
            }
            localStorage.setItem('wehosthere_partners', JSON.stringify(serverPartners));
          }
          return serverPartners;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar partners:', e);
    }
    return dataManager.getPartners();
  },

  createPartner: (name: string, logoUrl: string, websiteUrl?: string): Partner => {
    const partners = dataManager.getPartners();
    const now = new Date().toISOString();
    const maxOrder = partners.length > 0 ? Math.max(...partners.map(p => p.order)) : 0;
    const newPartner: Partner = {
      id: `PART-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      logoUrl,
      websiteUrl,
      order: maxOrder + 1,
      active: true,
      createdAt: now,
      updatedAt: now
    };
    partners.push(newPartner);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_partners', JSON.stringify(partners));
      fetch(apiEndpoint('/api/partners'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', partner: newPartner })
      }).catch(err => console.error('Erro de sync de partner no servidor:', err));
    }
    return newPartner;
  },

  createPartnerAsync: async (name: string, logoUrl: string, websiteUrl?: string): Promise<Partner> => {
    const newPartner = dataManager.createPartner(name, logoUrl, websiteUrl);
    try {
      await fetch(apiEndpoint('/api/partners'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', partner: newPartner })
      });
    } catch (err) {
      console.error('Erro de sync de partner async:', err);
    }
    return newPartner;
  },

  updatePartner: (id: string, updates: Partial<Partner>): Partner | null => {
    const partners = dataManager.getPartners();
    const index = partners.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    partners[index] = {
      ...partners[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_partners', JSON.stringify(partners));
      fetch(apiEndpoint('/api/partners'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', partner: partners[index], partnerId: id, updates })
      }).catch(err => console.error('Erro de sync de partner no servidor:', err));
    }
    return partners[index];
  },

  updatePartnerAsync: async (id: string, updates: Partial<Partner>): Promise<Partner | null> => {
    const updated = dataManager.updatePartner(id, updates);
    if (updated) {
      try {
        await fetch(apiEndpoint('/api/partners'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update', partner: updated, partnerId: id, updates })
        });
      } catch (err) {
        console.error('Erro de update async partner:', err);
      }
    }
    return updated;
  },

  deletePartner: (id: string): boolean => {
    const partners = dataManager.getPartners();
    const index = partners.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    partners.splice(index, 1);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_partners', JSON.stringify(partners));
      fetch(apiEndpoint('/api/partners'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', partnerId: id })
      }).catch(err => console.error('Erro de sync de partner no servidor:', err));
    }
    return true;
  },

  deletePartnerAsync: async (id: string): Promise<boolean> => {
    const result = dataManager.deletePartner(id);
    try {
      await fetch(apiEndpoint('/api/partners'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', partnerId: id })
      });
    } catch (err) {
      console.error('Erro de delete async partner:', err);
    }
    return result;
  },

  getActivePartners: (): Partner[] => {
    return dataManager.getPartners()
      .filter(p => p.active)
      .sort((a, b) => a.order - b.order);
  },

  getReferralByCode: (code: string): Referral | null => {
    const referrals = dataManager.getReferrals();
    return referrals.find(r => r.referralCode === code) || null;
  },

  getReferralByReferrerEmail: (email: string): Referral | null => {
    const referrals = dataManager.getReferrals();
    return referrals.find(r => r.referrerEmail === email) || null;
  },

  updateReferralStats: (referralId: string, newReferralCount: number, newCommissionAmount: number): boolean => {
    const referrals = dataManager.getReferrals();
    const index = referrals.findIndex(r => r.id === referralId);
    if (index === -1) return false;

    referrals[index].totalReferrals = newReferralCount;
    referrals[index].totalCommissions = newCommissionAmount;
    referrals[index].updatedAt = new Date().toISOString();

    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_referrals', JSON.stringify(referrals));
      fetch(apiEndpoint('/api/referrals'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', referral: referrals[index] })
      }).catch(err => console.error('Erro de sync de referral no servidor:', err));
    }
    return true;
  },

  getReferralCommissions: (): ReferralCommission[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_referral_commissions');
    return data ? JSON.parse(data) : [];
  },

  fetchReferralCommissionsAsync: async (): Promise<ReferralCommission[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/referral-commissions'));
      if (res.ok) {
        const data = await res.json();
        if (data.commissions && Array.isArray(data.commissions)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_referral_commissions', JSON.stringify(data.commissions));
          }
          return data.commissions;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar referral commissions:', e);
    }
    return dataManager.getReferralCommissions();
  },

  createReferralCommission: (commission: Omit<ReferralCommission, 'id' | 'createdAt' | 'updatedAt'>): ReferralCommission => {
    const commissions = dataManager.getReferralCommissions();
    const now = new Date().toISOString();
    const newCommission: ReferralCommission = {
      ...commission,
      id: `RCOM-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: now,
      updatedAt: now
    };
    commissions.unshift(newCommission);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_referral_commissions', JSON.stringify(commissions));
      fetch(apiEndpoint('/api/referral-commissions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', commission: newCommission })
      }).catch(err => console.error('Erro de sync de commission no servidor:', err));
    }
    return newCommission;
  },

  getReferralCommissionsByReferrer: (referrerEmail: string): ReferralCommission[] => {
    return dataManager.getReferralCommissions().filter(c => c.referrerEmail === referrerEmail);
  },

  updateReferralCommissionStatus: (commissionId: string, status: ReferralCommission['status']): boolean => {
    const commissions = dataManager.getReferralCommissions();
    const index = commissions.findIndex(c => c.id === commissionId);
    if (index === -1) return false;

    commissions[index].status = status;
    commissions[index].updatedAt = new Date().toISOString();

    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_referral_commissions', JSON.stringify(commissions));
      fetch(apiEndpoint('/api/referral-commissions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', commission: commissions[index] })
      }).catch(err => console.error('Erro de sync de commission no servidor:', err));
    }
    return true;
  },

  // Academy/Course Management
  clearAcademyData: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('wehosthere_courses');
    localStorage.removeItem('wehosthere_modules');
    localStorage.removeItem('wehosthere_lessons');
    console.log('[DataManager] Dados de academy do localStorage limpos');
  },

  getCourses: (): Course[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_courses');
    return data ? JSON.parse(data) : [];
  },

  fetchCoursesAsync: async (): Promise<Course[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/courses'));
      if (res.ok) {
        const data = await res.json();
        if (data.courses && Array.isArray(data.courses)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_courses', JSON.stringify(data.courses));
          }
          return data.courses;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar courses:', e);
    }
    // Se falhar, retorna dados do localStorage (que podem vir do seed)
    return dataManager.getCourses();
  },

  createCourse: async (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course | null> => {
    try {
      // Primeiro criar no servidor
      const res = await fetch(apiEndpoint('/api/courses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', course })
      });
      
      if (!res.ok) {
        console.error('[DataManager] Erro ao criar curso no servidor:', res.status);
        return null;
      }
      
      const data = await res.json();
      
      // Limpar completamente o localStorage para garantir consistência
      dataManager.clearAcademyData();
      
      // Buscar dados frescos do servidor
      await dataManager.fetchCoursesAsync();
      
      console.log('[DataManager] Curso criado com sucesso e dados sincronizados');
      return data.course;
    } catch (err) {
      console.error('[DataManager] Erro ao criar curso:', err);
      return null;
    }
  },

  updateCourse: async (id: string, updates: Partial<Course>): Promise<boolean> => {
    try {
      // Primeiro atualizar no servidor
      const res = await fetch(apiEndpoint('/api/courses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', course: { ...updates, id } })
      });
      
      if (!res.ok) {
        console.error('[DataManager] Erro ao atualizar curso no servidor:', res.status);
        return false;
      }
      
      // Limpar completamente o localStorage para garantir consistência
      dataManager.clearAcademyData();
      
      // Buscar dados frescos do servidor
      await dataManager.fetchCoursesAsync();
      
      console.log('[DataManager] Curso atualizado com sucesso e dados sincronizados');
      return true;
    } catch (err) {
      console.error('[DataManager] Erro ao atualizar curso:', err);
      return false;
    }
  },

  deleteCourse: async (id: string): Promise<boolean> => {
    try {
      // Primeiro deletar do servidor (que faz cascade delete de módulos e lições)
      const res = await fetch(apiEndpoint('/api/courses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', courseId: id })
      });
      
      if (!res.ok) {
        console.error('[DataManager] Erro ao deletar curso do servidor:', res.status);
        return false;
      }
      
      // Limpar completamente o localStorage para garantir consistência
      dataManager.clearAcademyData();
      
      // Buscar dados frescos do servidor
      await Promise.all([
        dataManager.fetchCoursesAsync(),
        dataManager.fetchModulesAsync(),
        dataManager.fetchLessonsAsync()
      ]);
      
      console.log('[DataManager] Curso deletado com sucesso e dados sincronizados');
      return true;
    } catch (err) {
      console.error('[DataManager] Erro ao deletar curso:', err);
      return false;
    }
  },

  // Module methods
  getModules: (courseId?: string): Module[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_modules');
    const modules = data ? JSON.parse(data) : [];
    return courseId ? modules.filter((m: Module) => m.courseId === courseId) : modules;
  },

  fetchModulesAsync: async (): Promise<Module[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/modules'));
      if (res.ok) {
        const data = await res.json();
        if (data.modules && Array.isArray(data.modules)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_modules', JSON.stringify(data.modules));
          }
          return data.modules;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar modules:', e);
    }
    // Se falhar, retorna dados do localStorage (que podem vir do seed)
    return dataManager.getModules();
  },

  createModule: async (module: Omit<Module, 'id' | 'createdAt' | 'updatedAt'>): Promise<Module | null> => {
    try {
      // Primeiro criar no servidor
      const res = await fetch(apiEndpoint('/api/modules'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', module })
      });
      
      if (!res.ok) {
        console.error('[DataManager] Erro ao criar módulo no servidor:', res.status);
        return null;
      }
      
      const data = await res.json();
      
      // Limpar completamente o localStorage para garantir consistência
      dataManager.clearAcademyData();
      
      // Buscar dados frescos do servidor
      await dataManager.fetchModulesAsync();
      
      console.log('[DataManager] Módulo criado com sucesso e dados sincronizados');
      return data.module;
    } catch (err) {
      console.error('[DataManager] Erro ao criar módulo:', err);
      return null;
    }
  },

  updateModule: async (id: string, updates: Partial<Module>): Promise<boolean> => {
    try {
      // Limpar campos de video/material apenas se hasVideo/hasMaterial for false explicitamente
      const cleanUpdates: Partial<Module> = { ...updates };
      if (updates.hasVideo === false) {
        cleanUpdates.videoUrl = undefined;
        cleanUpdates.videoTitle = undefined;
        cleanUpdates.videoDescription = undefined;
      }
      if (updates.hasMaterial === false) {
        cleanUpdates.materialUrl = undefined;
        cleanUpdates.materialTitle = undefined;
        cleanUpdates.materialType = undefined;
      }

      // Primeiro atualizar no servidor
      const res = await fetch(apiEndpoint('/api/modules'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', module: { ...cleanUpdates, id } })
      });
      
      if (!res.ok) {
        console.error('[DataManager] Erro ao atualizar módulo no servidor:', res.status);
        return false;
      }
      
      // Limpar completamente o localStorage para garantir consistência
      dataManager.clearAcademyData();
      
      // Buscar dados frescos do servidor
      await dataManager.fetchModulesAsync();
      
      console.log('[DataManager] Módulo atualizado com sucesso e dados sincronizados');
      return true;
    } catch (err) {
      console.error('[DataManager] Erro ao atualizar módulo:', err);
      return false;
    }
  },

  deleteModule: async (id: string): Promise<boolean> => {
    try {
      // Primeiro deletar do servidor (que faz cascade delete de lições)
      const res = await fetch(apiEndpoint('/api/modules'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', moduleId: id })
      });
      
      if (!res.ok) {
        console.error('[DataManager] Erro ao deletar módulo do servidor:', res.status);
        return false;
      }
      
      // Limpar completamente o localStorage para garantir consistência
      dataManager.clearAcademyData();
      
      // Buscar dados frescos do servidor
      await Promise.all([
        dataManager.fetchModulesAsync(),
        dataManager.fetchLessonsAsync()
      ]);
      
      console.log('[DataManager] Módulo deletado com sucesso e dados sincronizados');
      return true;
    } catch (err) {
      console.error('[DataManager] Erro ao deletar módulo:', err);
      return false;
    }
  },

  // Lesson methods
  getLessons: (moduleId?: string): Lesson[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_lessons');
    const lessons = data ? JSON.parse(data) : [];
    return moduleId ? lessons.filter((l: Lesson) => l.moduleId === moduleId) : lessons;
  },

  fetchLessonsAsync: async (): Promise<Lesson[]> => {
    try {
      const res = await fetch(apiEndpoint('/api/lessons'));
      if (res.ok) {
        const data = await res.json();
        if (data.lessons && Array.isArray(data.lessons)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_lessons', JSON.stringify(data.lessons));
          }
          return data.lessons;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar lessons:', e);
    }
    // Se falhar, retorna dados do localStorage (que podem vir do seed)
    return dataManager.getLessons();
  },

  createLesson: async (lesson: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lesson | null> => {
    try {
      // Primeiro criar no servidor
      const res = await fetch(apiEndpoint('/api/lessons'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', lesson })
      });
      
      if (!res.ok) {
        console.error('[DataManager] Erro ao criar lição no servidor:', res.status);
        return null;
      }
      
      const data = await res.json();
      
      // Limpar completamente o localStorage para garantir consistência
      dataManager.clearAcademyData();
      
      // Buscar dados frescos do servidor
      await dataManager.fetchLessonsAsync();
      
      console.log('[DataManager] Lição criada com sucesso e dados sincronizados');
      return data.lesson;
    } catch (err) {
      console.error('[DataManager] Erro ao criar lição:', err);
      return null;
    }
  },

  updateLesson: async (id: string, updates: Partial<Lesson>): Promise<boolean> => {
    try {
      // Limpar campos de video/material se hasVideo/hasMaterial for false
      const cleanUpdates: Partial<Lesson> = { ...updates };
      if (updates.hasVideo === false) {
        cleanUpdates.videoUrl = undefined;
        cleanUpdates.videoTitle = undefined;
        cleanUpdates.videoDescription = undefined;
      }
      if (updates.hasMaterial === false) {
        cleanUpdates.materialUrl = undefined;
        cleanUpdates.materialTitle = undefined;
        cleanUpdates.materialType = undefined;
      }

      // Primeiro atualizar no servidor
      const res = await fetch(apiEndpoint('/api/lessons'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', lesson: { ...cleanUpdates, id } })
      });
      
      if (!res.ok) {
        console.error('[DataManager] Erro ao atualizar lição no servidor:', res.status);
        return false;
      }
      
      // Limpar completamente o localStorage para garantir consistência
      dataManager.clearAcademyData();
      
      // Buscar dados frescos do servidor
      await dataManager.fetchLessonsAsync();
      
      console.log('[DataManager] Lição atualizada com sucesso e dados sincronizados');
      return true;
    } catch (err) {
      console.error('[DataManager] Erro ao atualizar lição:', err);
      return false;
    }
  },

  deleteLesson: async (id: string): Promise<boolean> => {
    try {
      // Deletar do servidor
      const res = await fetch(apiEndpoint('/api/lessons'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', lessonId: id })
      });
      
      if (!res.ok) {
        console.error('[DataManager] Erro ao deletar lição do servidor:', res.status);
        return false;
      }
      
      // Limpar completamente o localStorage para garantir consistência
      dataManager.clearAcademyData();
      
      // Buscar dados frescos do servidor
      await dataManager.fetchLessonsAsync();
      
      console.log('[DataManager] Lição deletada com sucesso e dados sincronizados');
      return true;
    } catch (err) {
      console.error('[DataManager] Erro ao deletar lição:', err);
      return false;
    }
  },

  // Course Progress methods
  getCourseProgress: (userId: string, courseId: string): CourseProgress | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem('wehosthere_course_progress');
    const progress = data ? JSON.parse(data) : [];
    return progress.find((p: CourseProgress) => p.userId === userId && p.courseId === courseId) || null;
  },

  fetchCourseProgressAsync: async (userId: string, courseId: string): Promise<CourseProgress | null> => {
    try {
      const res = await fetch(apiEndpoint(`/api/course-progress?userId=${userId}&courseId=${courseId}`));
      if (res.ok) {
        const data = await res.json();
        if (data.progress && Array.isArray(data.progress) && data.progress.length > 0) {
          const serverProgress = data.progress[0];
          
          // Update localStorage with server data
          if (typeof window !== 'undefined') {
            const localData = localStorage.getItem('wehosthere_course_progress');
            const localProgress = localData ? JSON.parse(localData) : [];
            const existingIndex = localProgress.findIndex((p: CourseProgress) => p.userId === userId && p.courseId === courseId);
            
            if (existingIndex !== -1) {
              localProgress[existingIndex] = serverProgress;
            } else {
              localProgress.push(serverProgress);
            }
            localStorage.setItem('wehosthere_course_progress', JSON.stringify(localProgress));
          }
          
          return serverProgress;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar progresso do servidor:', e);
    }
    return dataManager.getCourseProgress(userId, courseId);
  },

  updateCourseProgress: (userId: string, courseId: string, lessonId: string, moduleId?: string): CourseProgress => {
    const data = localStorage.getItem('wehosthere_course_progress');
    const progressList = data ? JSON.parse(data) : [];
    const existingIndex = progressList.findIndex((p: CourseProgress) => p.userId === userId && p.courseId === courseId);
    
    const now = new Date().toISOString();
    let progress: CourseProgress;
    
    if (existingIndex !== -1) {
      progress = progressList[existingIndex];
      if (!progress.completedLessons.includes(lessonId)) {
        progress.completedLessons.push(lessonId);
      }
      progress.currentModuleId = moduleId;
      progress.currentLessonId = lessonId;
      progress.lastAccessedAt = now;
      progress.updatedAt = now;
      progressList[existingIndex] = progress;
    } else {
      progress = {
        id: `PROG-${Math.floor(1000 + Math.random() * 9000)}`,
        userId,
        courseId,
        completedLessons: [lessonId],
        currentModuleId: moduleId,
        currentLessonId: lessonId,
        lastAccessedAt: now,
        createdAt: now,
        updatedAt: now
      };
      progressList.push(progress);
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_course_progress', JSON.stringify(progressList));
      fetch(apiEndpoint('/api/course-progress'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'complete_lesson', 
          progress: {
            userId,
            courseId,
            lessonId,
            currentLessonId: lessonId,
            currentModuleId: moduleId
          }
        })
      }).catch(err => console.error('Erro de sync de progress no servidor:', err));
    }
    
    return progress;
  },

  // Course Enrollment methods
  getEnrollments: (userId?: string): CourseEnrollment[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_enrollments');
    const enrollments = data ? JSON.parse(data) : [];
    return userId ? enrollments.filter((e: CourseEnrollment) => e.userId === userId) : enrollments;
  },

  enrollInCourse: (userId: string, courseId: string, paymentId?: string): CourseEnrollment => {
    const enrollments = dataManager.getEnrollments();
    const now = new Date().toISOString();
    const newEnrollment: CourseEnrollment = {
      id: `ENROLL-${Math.floor(1000 + Math.random() * 9000)}`,
      userId,
      courseId,
      status: 'active',
      enrolledAt: now,
      paymentId
    };
    enrollments.unshift(newEnrollment);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_enrollments', JSON.stringify(enrollments));
      fetch(apiEndpoint('/api/enrollments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', enrollment: newEnrollment })
      }).catch(err => console.error('Erro de sync de enrollment no servidor:', err));
    }
    return newEnrollment;
  },

  // Certificate methods
  getCertificates: (userId?: string): Certificate[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_certificates');
    const certificates = data ? JSON.parse(data) : [];
    return userId ? certificates.filter((c: Certificate) => c.userId === userId) : certificates;
  },

  fetchCertificatesAsync: async (userId?: string): Promise<Certificate[]> => {
    try {
      const url = userId ? apiEndpoint(`/api/certificates?userId=${userId}`) : apiEndpoint('/api/certificates');
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.certificates && Array.isArray(data.certificates)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_certificates', JSON.stringify(data.certificates));
          }
          return data.certificates;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar certificados do servidor:', e);
    }
    return dataManager.getCertificates(userId);
  },

  createCertificate: async (userId: string, userName: string, userEmail: string, courseId: string, courseTitle: string): Promise<Certificate | null> => {
    try {
      const completionDate = new Date().toISOString();
      const certificateNumber = `WH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const verificationUrl = `${window.location.origin}/verify-certificate?code=${certificateNumber}`;
      
      const certificateData = {
        userId,
        userName,
        userEmail,
        courseId,
        courseTitle,
        completionDate,
        certificateNumber,
        verificationUrl
      };

      const res = await fetch(apiEndpoint('/api/certificates'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', certificate: certificateData })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.certificate) {
          // Disparar e-mail com o Certificado Oficial de Conclusão
          fetch(apiEndpoint('/api/send-email'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'course_completion',
              to: userEmail,
              userName: userName || userEmail,
              courseTitle,
              certificateNumber,
              verificationUrl
            })
          }).catch(err => console.error('Erro ao enviar email de certificado:', err));

          // Update localStorage
          if (typeof window !== 'undefined') {
            const localData = localStorage.getItem('wehosthere_certificates');
            const localCertificates = localData ? JSON.parse(localData) : [];
            localCertificates.push(data.certificate);
            localStorage.setItem('wehosthere_certificates', JSON.stringify(localCertificates));
          }
          return data.certificate;
        }
      }
    } catch (e) {
      console.error('Erro ao criar certificado:', e);
    }
    return null;
  },

  verifyCertificate: async (certificateNumber: string): Promise<{ valid: boolean; certificate?: Certificate; message?: string }> => {
    try {
      const res = await fetch(apiEndpoint('/api/certificates'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', certificateNumber })
      });

      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.error('Erro ao verificar certificado:', e);
    }
    return { valid: false, message: 'Erro ao verificar certificado' };
  },

  isEnrolled: (userId: string, courseId: string): boolean => {
    const enrollments = dataManager.getEnrollments(userId);
    return enrollments.some((e: CourseEnrollment) => e.courseId === courseId && e.status === 'active');
  },

  // User Feedback methods
  getFeedbacks: (): UserFeedback[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('wehosthere_feedbacks');
    return data ? JSON.parse(data) : [];
  },

  getFeedbacksByUser: (userId: string): UserFeedback[] => {
    return dataManager.getFeedbacks().filter((f: UserFeedback) => f.userId === userId);
  },

  getFeedbacksByTarget: (targetId: string): UserFeedback[] => {
    return dataManager.getFeedbacks().filter((f: UserFeedback) => f.targetId === targetId);
  },

  createFeedback: (feedback: Omit<UserFeedback, 'id' | 'createdAt' | 'updatedAt'>): UserFeedback => {
    const feedbacks = dataManager.getFeedbacks();
    const now = new Date().toISOString();
    const newFeedback: UserFeedback = {
      ...feedback,
      id: `FEEDBACK-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: now,
      updatedAt: now
    };
    feedbacks.unshift(newFeedback);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_feedbacks', JSON.stringify(feedbacks));
    }
    return newFeedback;
  },

  updateFeedback: (id: string, updates: Partial<UserFeedback>): boolean => {
    const feedbacks = dataManager.getFeedbacks();
    const index = feedbacks.findIndex((f: UserFeedback) => f.id === id);
    if (index === -1) return false;
    feedbacks[index] = { ...feedbacks[index], ...updates, updatedAt: new Date().toISOString() };
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_feedbacks', JSON.stringify(feedbacks));
    }
    return true;
  },

  deleteFeedback: (id: string): boolean => {
    const feedbacks = dataManager.getFeedbacks();
    const index = feedbacks.findIndex((f: UserFeedback) => f.id === id);
    if (index === -1) return false;
    feedbacks.splice(index, 1);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wehosthere_feedbacks', JSON.stringify(feedbacks));
    }
    return true;
  }
};

export interface TicketAttachment {
  url: string;
  name: string;
  type: 'image' | 'pdf' | 'file';
  bytes?: number;
}

export interface TicketMessage {
  id: string;
  sender: 'client' | 'support' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
  attachments?: TicketAttachment[];
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'technical' | 'billing' | 'domain' | 'vps' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'answered' | 'closed';
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

// Sem dados padrão — todos os dados são carregados do MongoDB Atlas
const DEFAULT_ORDERS: ServiceOrder[] = [];
export const DEFAULT_TICKETS: SupportTicket[] = [];

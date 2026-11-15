import { connectDB } from '@/lib/mongodb';
import RevistaStory, { IRevistaStory } from '@/models/RevistaStory';

export interface StoryItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: {
    name: string;
    email?: string;
    bio?: string;
    avatar?: string;
    website?: string;
    socials?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
      instagram?: string;
    };
  };
  category: string;
  tags: string[];
  status: 'draft' | 'pending' | 'published' | 'archived';
  featured: boolean;
  views: number;
  claps?: number;
  commentsCount?: number;
  reactions?: {
    fire?: number;
    insight?: number;
    heart?: number;
    rocket?: number;
  };
  readingTime?: number;
  highlightText?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  submission?: {
    isCommunity?: boolean;
    submitterEmail?: string;
    submitterName?: string;
    submittedAt?: string;
    reviewNotes?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
  };
}

export const INITIAL_STORIES: StoryItem[] = [
  {
    id: 'seed-story-1',
    title: 'Como construí o meu primeiro SaaS com Next.js em 30 dias',
    slug: 'primeiro-saas-nextjs-30-dias',
    highlightText: 'primeiro SaaS',
    excerpt:
      'Saí do zero, sem investimento externo, e em 30 dias lancei um produto que hoje paga as minhas contas. Aqui está o que aprendi.',
    content: `## O Início de Tudo

Tinha 23 anos, um portátil velho e uma ideia que não saia da cabeça. Não tinha dinheiro para servidores caros nem para contratar uma equipa. Tinha apenas código e tempo.

> "A melhor forma de aprender a construir produtos é construindo produtos."

## A Ideia

Comecei por identificar um problema real: pequenas empresas em Moçambique não tinham uma forma simples de gerir as suas facturas digitalmente. A solução parecia óbvia - uma aplicação web simples, rápida, bonita e em português.

## A Stack Escolhida

Escolhi tecnologias modernas e eficientes:

* **Next.js** - para o frontend e rotas de API com alta performance
* **MongoDB** - base de dados flexível e gratuita no Atlas
* **Tailwind CSS** - estilização ultra rápida e consistente
* **Vercel** - deploy contínuo, escalável e instantâneo

## Os Primeiros 10 Dias

Os primeiros dias foram os mais desafiantes. Não pelos problemas técnicos, mas pelo silêncio. Não havia utilizadores, não havia feedback, apenas eu e o terminal no quarto.

> "Quando não tens utilizadores, os teus maiores críticos são os teus próprios pensamentos."

## O Momento de Viragem

No dia 18, partilhei o produto num grupo de WhatsApp de empreendedores e criadores de Maputo. Em 24 horas, já tínhamos 47 utilizadores registados e a enviar feedback valioso. Foi o momento em que percebi que valia a pena.

## O Que Aprendi

* Lança cedo, mesmo que sintas que ainda faltam detalhes
* O feedback dos primeiros clientes vale mais que 100 horas a desenhar no Figma
* A tecnologia é apenas 20% do trabalho - os outros 80% são distribuição, produto e atendimento

## O Resultado

30 dias depois do primeiro commit: mais de 200 utilizadores activos, os primeiros clientes pagantes satisfeitos, e a certeza de que vale a pena continuar a codar histórias que transformam a nossa realidade.`,
    author: {
      name: 'Afonso Domingos',
      email: 'afonso@wehosthere.com',
      bio: 'Fundador da WEHOSTHERE. Apaixonado por tecnologia, ecossistemas digitais e empreendedorismo em Moçambique.',
      avatar: '',
      website: 'https://wehosthere.com',
      socials: {
        linkedin: 'https://linkedin.com/company/wehosthere',
        twitter: 'https://twitter.com/wehosthere',
        instagram: 'https://instagram.com/wehosthere',
      },
    },
    category: 'startups',
    tags: ['nextjs', 'saas', 'empreendedorismo', 'mozambique', 'dev'],
    status: 'published',
    featured: true,
    views: 0,
    readingTime: 5,
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    seo: {
      metaTitle: 'Como construí o meu primeiro SaaS com Next.js em 30 dias',
      metaDescription: 'Aprenda como lançar um SaaS do zero em Moçambique sem investimento.',
      keywords: 'saas, nextjs, empreendedorismo tech mocambique',
    },
  },
  {
    id: 'seed-story-2',
    title: 'APIs REST vs GraphQL: o que escolher para o teu próximo projecto',
    slug: 'rest-vs-graphql-escolha-certa',
    highlightText: 'REST vs GraphQL',
    excerpt:
      'Dois anos a trabalhar com ambas as tecnologias em produção. Aqui está a minha perspectiva honesta sobre quando usar cada uma.',
    content: `## A Questão Que Toda a Gente Faz

Quando começas um novo projecto, uma das primeiras decisões de arquitectura é: vamos usar REST clássico ou adoptar GraphQL? É uma decisão que impacta tanto o backend quanto o consumo no cliente móvel ou web.

> "A melhor tecnologia não é a mais moderna - é a que resolve o teu problema com menor atrito."

## REST: O Clássico Que Funciona

REST é simples, previsível e praticamente qualquer programador júnior consegue integrar sem curva de aprendizagem íngreme.

* Fácil de monitorar, auditar e debugar com ferramentas standard
* Excelente suporte a caching HTTP nativo (Edge, CDN, Varnish)
* Padrão consagrado para integrações entre plataformas terceiras

## GraphQL: O Poder da Flexibilidade

GraphQL brilha especialmente quando a aplicação possui interfaces complexas com dezenas de componentes aninhados e relações entre entidades.

* Elimina completamente problemas de over-fetching ou under-fetching
* Um único endpoint que devolve exactamente o formato solicitado
* Óptimo para conexões com limite de dados em redes móveis

## Conclusão Prática

Se estás a construir um MVP ou serviço directo: começa com REST. Se sentires que as telas móveis estão a fazer 5 requisições em cascata para montar uma página inicial, considera GraphQL para o BFF (Backend for Frontend).`,
    author: {
      name: 'Equipa WEHOSTHERE',
      email: 'info@wehosthere.com',
      bio: 'Engenharia de software e infraestrutura na WEHOSTHERE.',
      avatar: '',
    },
    category: 'codigo',
    tags: ['api', 'rest', 'graphql', 'backend', 'arquitectura'],
    status: 'published',
    featured: false,
    views: 0,
    readingTime: 4,
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-story-3',
    title: 'Carreira tech em Moçambique: como consegui o meu primeiro emprego remoto',
    slug: 'carreira-tech-mocambique-emprego-remoto',
    highlightText: 'primeiro emprego remoto',
    excerpt:
      'Com 24 anos, sem experiência formal e a partir de Maputo, consegui um emprego remoto para uma empresa portuguesa. Aqui está o caminho.',
    content: `## O Contexto

Maputo, 2023. Acabei de terminar o curso de Engenharia Informática. O mercado local corporativo tinha vagas escassas e processos burocráticos. Mas a internet quebrou as barreiras geográficas.

> "A geografia já não define o teu tecto profissional. A tua dedicação e portfólio real, sim."

## O Plano em 3 Etapas

1. **Portfólio com Projectos Reais no GitHub:** Não apenas tutoriais clonados do YouTube, mas aplicações completas com utilizadores reais e README bem documentado.
2. **Inglês e Comunicação Assíncrona:** Capacidade de explicar código, abrir pull requests claros e comunicar decisões técnicas com clareza.
3. **Candidaturas Focadas:** Personalizar propostas em plataformas como LinkedIn, Wellfound e comunidades de desenvolvedores.

## O Resultado

Após dezenas de candidaturas e testes técnicos, recebi uma proposta internacional para trabalhar remotamente em euros a partir de Moçambique. O talento africano é competitivo em qualquer parte do mundo.`,
    author: {
      name: 'Carlos Nhantumbo',
      email: 'info@wehosthere.com',
      bio: 'Lead Developer moçambicano a trabalhar remotamente para startups globais.',
      avatar: '',
      website: 'https://carlosnhantumbo.dev',
      socials: {
        github: 'https://github.com/carlosnhantumbo',
        linkedin: 'https://linkedin.com/in/carlosnhantumbo',
        twitter: 'https://twitter.com/carlosnhantumbo',
      },
    },
    category: 'carreira',
    tags: ['carreira', 'remoto', 'emprego', 'mozambique'],
    status: 'published',
    featured: false,
    views: 0,
    readingTime: 5,
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-story-4',
    title: 'Design para programadores: os 5 princípios que transformaram o meu trabalho',
    slug: 'design-para-programadores-5-principios',
    highlightText: '5 princípios',
    excerpt:
      'Não precisas de ser designer profissional para criar interfaces bonitas, modernas e intuitivas. Só precisas de entender estes fundamentos.',
    content: `## Programadores Também Podem Criar Boas Interfaces

Durante muito tempo achei que o design visual era um dom exclusivo de designers gráficos. Mas ao criar aplicações autónomas, percebi que o bom design segue regras de lógica e harmonia.

> "Bom design não é sobre ornamentos desnecessários. É sobre clareza, hierarquia e facilidade de uso."

## Os 5 Fundamentos

1. **Hierarquia Visual Forte:** Um elemento principal evidente, subtítulos com contraste e texto de apoio mais suave.
2. **Espaço em Branco (Whitespace):** Não preenchas todos os cantos da tela. Deixa o conteúdo respirar.
3. **Paleta Restrita:** 1 cor primária de destaque (como o azul #0ea5e9 da WEHOSTHERE), tons neutros de fundo e cinzas para texto.
4. **Alinhamento e Grelhas:** Mantém tudo rigorosamente alinhado em eixos consistentes.
5. **Micro-interacções e Feedback:** Estados de hover, animações suaves e loading states que informam o utilizador sobre o que está a acontecer.`,
    author: {
      name: 'Equipa WEHOSTHERE',
      email: 'info@wehosthere.com',
      bio: 'Designers e programadores na WEHOSTHERE.',
      avatar: '',
    },
    category: 'design',
    tags: ['design', 'ui', 'ux', 'frontend'],
    status: 'published',
    featured: false,
    views: 0,
    readingTime: 4,
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Fallback in-memory storage para desenvolvimento local quando MongoDB não estiver configurado
let fallbackStories: StoryItem[] = [...INITIAL_STORIES];

export async function getStoriesList(options?: {
  status?: string;
  category?: string;
  featured?: boolean;
  limit?: number;
  page?: number;
}) {
  const status = options?.status || 'published';
  const category = options?.category;
  const featured = options?.featured;
  const limit = options?.limit || 30;
  const page = options?.page || 1;
  const skip = (page - 1) * limit;

  // Tenta MongoDB se estiver configurado
  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
      // Se a base de dados estiver vazia, adiciona as histórias iniciais
      const count = await RevistaStory.countDocuments();
      if (count === 0) {
        for (const story of INITIAL_STORIES) {
          const { id: _, ...storyData } = story;
          await RevistaStory.create(storyData).catch(() => {});
        }
      }

      const filter: Record<string, unknown> = {};
      if (status !== 'all') filter.status = status;
      if (category && category !== 'all') filter.category = category;
      if (featured !== undefined) filter.featured = featured;

      const docs = await RevistaStory.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await RevistaStory.countDocuments(filter);

      return {
        stories: docs.map((s: any) => ({
          id: s._id?.toString(),
          title: s.title,
          slug: s.slug,
          excerpt: s.excerpt,
          content: s.content,
          coverImage: s.coverImage,
          author: s.author,
          category: s.category,
          tags: s.tags || [],
          status: s.status,
          featured: s.featured,
          views: s.views || 0,
          claps: s.claps || 0,
          reactions: s.reactions || { fire: 0, insight: 0, heart: 0, rocket: 0 },
          readingTime: s.readingTime || Math.ceil((s.content?.split(/\s+/).length || 200) / 200),
          highlightText: s.highlightText,
          publishedAt: s.publishedAt ? new Date(s.publishedAt).toISOString() : undefined,
          createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : undefined,
          updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : undefined,
          submission: s.submission ? {
            isCommunity: s.submission.isCommunity,
            submitterEmail: s.submission.submitterEmail,
            submitterName: s.submission.submitterName,
            submittedAt: s.submission.submittedAt ? new Date(s.submission.submittedAt).toISOString() : undefined,
            reviewNotes: s.submission.reviewNotes,
          } : undefined,
          seo: s.seo,
        })),
        total,
      };
    } catch (dbErr) {
      console.warn('[RevistaData] Falha ao consultar MongoDB, a usar dados de fallback:', dbErr);
    }
  }

  // Fallback in-memory
  let result = [...fallbackStories];
  if (status !== 'all') {
    result = result.filter(s => s.status === status);
  }
  if (category && category !== 'all') {
    result = result.filter(s => s.category === category);
  }
  if (featured !== undefined) {
    result = result.filter(s => s.featured === featured);
  }

  result.sort((a, b) => {
    const da = new Date(a.publishedAt || a.createdAt || 0).getTime();
    const db = new Date(b.publishedAt || b.createdAt || 0).getTime();
    return db - da;
  });

  const paginated = result.slice(skip, skip + limit);
  return {
    stories: paginated,
    total: result.length,
  };
}

export async function getStoryBySlug(slug: string) {
  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
      const s = await RevistaStory.findOneAndUpdate(
        { slug },
        { $inc: { views: 1 } },
        { new: true }
      ).lean();

      if (s) {
        return {
          id: (s as any)._id?.toString(),
          title: s.title,
          slug: s.slug,
          excerpt: s.excerpt,
          content: s.content,
          coverImage: s.coverImage,
          author: s.author,
          category: s.category,
          tags: s.tags || [],
          status: s.status,
          featured: s.featured,
          views: s.views || 0,
          claps: s.claps || 0,
          reactions: s.reactions || { fire: 0, insight: 0, heart: 0, rocket: 0 },
          readingTime: s.readingTime || Math.ceil((s.content?.split(/\s+/).length || 200) / 200),
          highlightText: s.highlightText,
          publishedAt: s.publishedAt ? new Date(s.publishedAt).toISOString() : undefined,
          createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : undefined,
          updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : undefined,
          submission: s.submission ? {
            isCommunity: s.submission.isCommunity,
            submitterEmail: s.submission.submitterEmail,
            submitterName: s.submission.submitterName,
            submittedAt: s.submission.submittedAt ? new Date(s.submission.submittedAt).toISOString() : undefined,
            reviewNotes: s.submission.reviewNotes,
          } : undefined,
          seo: s.seo,
        };
      }
    } catch (err) {
      console.warn('[RevistaData] Erro ao buscar história por slug no MongoDB:', err);
    }
  }

  // Fallback
  const found = fallbackStories.find(s => s.slug === slug);
  if (found) {
    found.views = (found.views || 0) + 1;
    return found;
  }
  return null;
}

export async function getStoryById(id: string) {
  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
      const s = await RevistaStory.findById(id).lean();
      if (s) {
        return {
          id: (s as any)._id?.toString(),
          title: s.title,
          slug: s.slug,
          excerpt: s.excerpt,
          content: s.content,
          coverImage: s.coverImage,
          author: s.author,
          category: s.category,
          tags: s.tags || [],
          status: s.status,
          featured: s.featured,
          views: s.views || 0,
          readingTime: s.readingTime,
          highlightText: s.highlightText,
          publishedAt: s.publishedAt ? new Date(s.publishedAt).toISOString() : undefined,
          createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : undefined,
          updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : undefined,
          seo: s.seo,
        };
      }
    } catch (err) {
      console.warn('[RevistaData] Erro ao buscar história por ID no MongoDB:', err);
    }
  }

  return fallbackStories.find(s => s.id === id) || null;
}

export async function createStory(data: Partial<StoryItem>) {
  let slug = data.slug ? data.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-') : '';
  if (!slug && data.title) {
    slug = data.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  if (!slug) slug = `historia-${Date.now()}`;

  const words = (data.content || '').split(/\s+/).length;
  const readingTime = Math.ceil(words / 200);
  const publishedDate = data.publishedAt ? new Date(data.publishedAt) : (data.status === 'published' ? new Date() : undefined);

  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
      const existing = await RevistaStory.findOne({ slug });
      if (existing) slug = `${slug}-${Date.now()}`;

      const created = await RevistaStory.create({
        ...data,
        slug,
        views: data.views !== undefined ? Number(data.views) : 0,
        readingTime,
        publishedAt: publishedDate,
      });

      return {
        id: created._id.toString(),
        title: created.title,
        slug: created.slug,
        status: created.status,
      };
    } catch (err) {
      console.warn('[RevistaData] Erro ao criar história no MongoDB, salvando no fallback:', err);
    }
  }

  const newStory: StoryItem = {
    id: `local-${Date.now()}`,
    title: data.title || '',
    slug: slug || `historia-${Date.now()}`,
    excerpt: data.excerpt || '',
    content: data.content || '',
    coverImage: data.coverImage,
    author: data.author || { name: 'WEHOSTHERE', email: 'info@wehosthere.com' },
    category: data.category || 'codigo',
    tags: data.tags || [],
    status: (data.status as any) || 'draft',
    featured: data.featured || false,
    views: 0,
    readingTime,
    highlightText: data.highlightText,
    publishedAt: data.status === 'published' ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seo: data.seo,
  };

  fallbackStories.unshift(newStory);
  return {
    id: newStory.id,
    title: newStory.title,
    slug: newStory.slug,
    status: newStory.status,
  };
}

export async function updateStory(id: string, data: Partial<StoryItem>) {
  if (data.slug) {
    data.slug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-');
  }

  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
      const existing = await RevistaStory.findById(id);
      if (existing) {
        if (data.slug && data.slug !== existing.slug) {
          const conflict = await RevistaStory.findOne({ slug: data.slug, _id: { $ne: id } });
          if (conflict) {
            return { success: false, error: 'Este link/slug já está a ser utilizado por outra história.' };
          }
        }
        if (!data.publishedAt && data.status === 'published' && existing.status !== 'published') {
          (data as any).publishedAt = new Date();
        } else if (data.publishedAt) {
          (data as any).publishedAt = new Date(data.publishedAt);
        }
        if (data.content) {
          const words = data.content.split(/\s+/).length;
          data.readingTime = Math.ceil(words / 200);
        }
        const updateData = { ...data };
        if (updateData.views === undefined) {
          delete updateData.views;
        }
        const updated = await RevistaStory.findByIdAndUpdate(id, updateData, { new: true });
        if (updated) {
          return { success: true, story: updated };
        }
      }
    } catch (err: any) {
      console.warn('[RevistaData] Erro ao atualizar no MongoDB:', err);
      return { success: false, error: err.message };
    }
  }

  const idx = fallbackStories.findIndex(s => s.id === id);
  if (idx !== -1) {
    if (data.slug && data.slug !== fallbackStories[idx].slug) {
      const conflict = fallbackStories.find(s => s.slug === data.slug && s.id !== id);
      if (conflict) {
        return { success: false, error: 'Este link/slug já está a ser utilizado por outra história.' };
      }
    }
    if (!data.publishedAt && data.status === 'published' && fallbackStories[idx].status !== 'published') {
      data.publishedAt = new Date().toISOString();
    } else if (data.publishedAt) {
      data.publishedAt = new Date(data.publishedAt).toISOString();
    }
    if (data.content) {
      const words = data.content.split(/\s+/).length;
      data.readingTime = Math.ceil(words / 200);
    }
    const updateData = { ...data };
    if (updateData.views === undefined) {
      delete updateData.views;
    }
    fallbackStories[idx] = {
      ...fallbackStories[idx],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, story: fallbackStories[idx] };
  }

  return { success: false, error: 'História não encontrada' };
}

export async function deleteStory(id: string) {
  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
      await RevistaStory.findByIdAndDelete(id);
      return { success: true };
    } catch (err) {
      console.warn('[RevistaData] Erro ao deletar no MongoDB:', err);
    }
  }

  fallbackStories = fallbackStories.filter(s => s.id !== id);
  return { success: true };
}

export async function reactToStory(slug: string, type: 'clap' | 'fire' | 'insight' | 'heart' | 'rocket', count: number = 1) {
  const incAmount = Math.max(1, Math.min(count, 50));

  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
      const incField = type === 'clap' ? 'claps' : `reactions.${type}`;
      const updated = await RevistaStory.findOneAndUpdate(
        { slug },
        { $inc: { [incField]: incAmount } },
        { new: true }
      ).lean();

      if (updated) {
        return {
          success: true,
          claps: updated.claps || 0,
          reactions: (updated as any).reactions || { fire: 0, insight: 0, heart: 0, rocket: 0 },
        };
      }
    } catch (err) {
      console.warn('[RevistaData] Erro ao reagir no MongoDB:', err);
    }
  }

  // Fallback in-memory
  const s = fallbackStories.find(st => st.slug === slug);
  if (s) {
    if (type === 'clap') {
      s.claps = (s.claps || 0) + incAmount;
    } else {
      s.reactions = s.reactions || { fire: 0, insight: 0, heart: 0, rocket: 0 };
      s.reactions[type] = (s.reactions[type] || 0) + incAmount;
    }
    return {
      success: true,
      claps: s.claps || 0,
      reactions: s.reactions,
    };
  }

  return { success: false, error: 'História não encontrada' };
}

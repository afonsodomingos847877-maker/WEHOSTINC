import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/siteConfig';
import { connectDB } from '@/lib/mongodb';

const BASE_URL = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const staticPages: MetadataRoute.Sitemap = [
    // Página principal - mais importante
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Páginas públicas importantes
    {
      url: `${BASE_URL}/register`,
      lastModified: oneWeekAgo,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/site-quote`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/systems`,
      lastModified: oneWeekAgo,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/sistema-erp`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // NOTA SEO: /login, /forgot-password, /confirm-email, /checkout e /webmail
    // foram removidos do sitemap propositadamente:
    //  - /login tem noindex explícito no layout
    //  - /forgot-password e /confirm-email são páginas de autenticação sem conteúdo indexável
    //  - /checkout é uma página de compra dinâmica (client-side) sem conteúdo estático
    //  - /webmail redireciona para serviço externo
    // Páginas legais
    {
      url: `${BASE_URL}/terms`,
      lastModified: threeMonthsAgo,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: threeMonthsAgo,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // Blog principal
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // Revista Digital
    {
      url: `${BASE_URL}/revista`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/revista/submeter`,
      lastModified: oneMonthAgo,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Páginas SEO - Domínios
    {
      url: `${BASE_URL}/dominios`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/dominio-co-mz`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Páginas SEO - Hospedagem
    {
      url: `${BASE_URL}/hospedagem`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/hospedagem-wordpress`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/vps`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Páginas SEO - Email
    {
      url: `${BASE_URL}/email-profissional`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/email-corporativo`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Páginas SEO - Criação de Sites
    {
      url: `${BASE_URL}/criar-site`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Páginas SEO - E-commerce
    {
      url: `${BASE_URL}/loja-online`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/vendas-online`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/dropshipping`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Páginas SEO - Produtos Digitais
    {
      url: `${BASE_URL}/produtos-digitais`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/plr`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Páginas SEO - Inteligência Artificial & AI Builder
    {
      url: `${BASE_URL}/inteligencia-artificial`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/ai-website-builder`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Páginas SEO - Pagamentos
    {
      url: `${BASE_URL}/pagamentos-online`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/scalepay`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Buscar posts do blog dinamicamente
  let blogPosts: MetadataRoute.Sitemap = [];
  try {
    await connectDB();
    const BlogPost = (await import('@/lib/models/BlogPost')).default;
    const posts = await BlogPost.find({ status: 'published' })
      .select('slug updatedAt publishedAt')
      .lean();

    blogPosts = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt || now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('[Sitemap] Erro ao buscar posts do blog:', error);
  }

  // Buscar histórias da revista dinamicamente
  let revistaStories: MetadataRoute.Sitemap = [];
  try {
    await connectDB();
    const RevistaStory = (await import('@/models/RevistaStory')).default;
    const stories = await RevistaStory.find({ status: 'published' })
      .select('slug updatedAt publishedAt')
      .lean();

    revistaStories = stories.map((story: any) => ({
      url: `${BASE_URL}/revista/${story.slug}`,
      lastModified: story.updatedAt || story.publishedAt || now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('[Sitemap] Erro ao buscar histórias da revista:', error);
  }

  return [...staticPages, ...blogPosts, ...revistaStories];
}

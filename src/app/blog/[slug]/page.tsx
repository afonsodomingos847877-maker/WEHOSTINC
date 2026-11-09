import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPostClient, { BlogPostData } from './BlogPostClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string } | Promise<{ slug: string }>;
}

async function fetchPostData(slug: string): Promise<{ post: any; relatedPosts: BlogPostData[] } | null> {
  const cleanSlug = decodeURIComponent(slug).trim();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wehostinc.onrender.com';

  // 1. Tentar buscar pelo backend (Render / API)
  try {
    const res = await fetch(`${backendUrl}/api/blog/${encodeURIComponent(cleanSlug)}`, {
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.post) {
        return {
          post: data.post,
          relatedPosts: data.relatedPosts || []
        };
      }
    }
  } catch (err) {
    console.warn('[Blog] Falha ao consultar Render API, tentando conexão direta MongoDB:', err);
  }

  // 2. Fallback direto ao MongoDB
  try {
    const { connectDB } = await import('@/lib/mongodb');
    await connectDB();
    const BlogPostModel = (await import('@/lib/models/BlogPost')).default;
    const post: any = await BlogPostModel.findOne({ slug: cleanSlug, status: 'published' }).lean();

    if (post) {
      let relatedPosts: BlogPostData[] = [];
      try {
        const rawRelated = await BlogPostModel.find({
          status: 'published',
          slug: { $ne: cleanSlug },
          $or: [
            { category: post.category },
            { tags: { $in: post.tags || [] } }
          ]
        })
          .limit(3)
          .lean();

        relatedPosts = rawRelated.map((p: any) => ({
          id: p._id?.toString() || p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          content: p.content,
          coverImage: p.coverImage || '',
          author: { name: p.author?.name || 'WEHOSTHERE' },
          category: p.category,
          tags: p.tags || [],
          publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : '',
          views: p.views || 0,
          featured: Boolean(p.featured),
        }));
      } catch (_) {}

      return {
        post: {
          id: post._id?.toString() || post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          author: post.author,
          category: post.category,
          tags: post.tags,
          status: post.status,
          publishedAt: post.publishedAt,
          views: post.views,
          featured: post.featured,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          seo: post.seo
        },
        relatedPosts
      };
    }
  } catch (err) {
    console.error('[Blog] Falha na conexão MongoDB fallback:', err);
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const data = await fetchPostData(resolvedParams.slug);

  if (!data || !data.post) {
    return {
      title: 'Post Não Encontrado | WEHOSTHERE Blog',
    };
  }

  const { post } = data;
  const title = post.seo?.metaTitle || `${post.title} | WEHOSTHERE Blog`;
  const description = post.seo?.metaDescription || post.excerpt;
  const url = `https://www.wehosthere.com/blog/${post.slug}`;
  const ogImage = post.coverImage || 'https://www.wehosthere.com/servidores-banner.png';

  return {
    title,
    description,
    keywords: post.seo?.keywords?.length ? post.seo.keywords : post.tags,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      locale: 'pt_MZ',
      url,
      title,
      description,
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      authors: [post.author?.name || 'WEHOSTHERE'],
      tags: post.tags,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const data = await fetchPostData(resolvedParams.slug);

  if (!data || !data.post) {
    notFound();
  }

  const { post, relatedPosts } = data;

  // Schema.org BlogPosting estruturado
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || 'https://www.wehosthere.com/servidores-banner.png',
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    author: {
      '@type': 'Person',
      name: post.author?.name || 'WEHOSTHERE',
    },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://www.wehosthere.com/#organization',
      name: 'WEHOSTHERE',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.wehosthere.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.wehosthere.com/blog/${post.slug}`,
    },
    keywords: post.tags?.join(', ') || '',
    articleSection: post.category || 'Tecnologia',
    inLanguage: 'pt',
    isPartOf: {
      '@type': 'Blog',
      '@id': 'https://www.wehosthere.com/blog',
      name: 'Blog WEHOSTHERE',
    },
  };

  // GEO: BreadcrumbList — sinaliza hierarquia de conteúdo a LLMs e Google
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: 'https://www.wehosthere.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://www.wehosthere.com/blog',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://www.wehosthere.com/blog/${post.slug}`,
      },
    ],
  };

  const initialPost: BlogPostData = {
    id: post.id || post._id?.toString() || '',
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage || '',
    author: { name: post.author?.name || 'WEHOSTHERE' },
    category: post.category,
    tags: post.tags || [],
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : '',
    views: post.views || 0,
    featured: Boolean(post.featured),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <BlogPostClient initialPost={initialPost} initialRelatedPosts={relatedPosts} />
    </>
  );
}

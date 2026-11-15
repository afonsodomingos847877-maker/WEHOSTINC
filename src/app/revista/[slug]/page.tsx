import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoryBySlug } from '@/lib/revistaData';
import RevistaStoryClient from './RevistaStoryClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const story = await getStoryBySlug(slug);
    if (!story) {
      return {
        title: 'História Não Encontrada | Codando Histórias',
      };
    }

    const title = story.seo?.metaTitle || story.title;
    const description = story.seo?.metaDescription || story.excerpt;
    const url = `https://www.wehosthere.com/revista/${story.slug}`;
    const ogImage = story.coverImage || 'https://www.wehosthere.com/servidores-banner.png';

    return {
      title,
      description,
      keywords: story.tags?.length ? story.tags : ['revista tech', 'programação', 'startups'],
      alternates: {
        canonical: url,
      },
      openGraph: {
        type: 'article',
        locale: 'pt_MZ',
        url,
        title,
        description,
        publishedTime: story.publishedAt,
        modifiedTime: story.updatedAt || story.publishedAt,
        authors: [story.author?.name || 'WEHOSTHERE'],
        tags: story.tags,
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
  } catch (e) {
    return {
      title: 'Codando Histórias - Revista Digital WEHOSTHERE',
    };
  }
}

export default async function RevistaStoryPage({ params }: Props) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);

  if (!story) {
    notFound();
  }

  // Schema.org Article estruturado (GEO-enriched)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: story.title,
    description: story.excerpt,
    image: story.coverImage || 'https://www.wehosthere.com/servidores-banner.png',
    datePublished: story.publishedAt,
    dateModified: story.updatedAt || story.publishedAt,
    inLanguage: 'pt',
    articleSection: story.category || 'Tecnologia',
    keywords: story.tags?.join(', ') || 'tecnologia, programação, moçambique',
    author: {
      '@type': 'Person',
      name: story.author?.name || 'WEHOSTHERE',
    },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://www.wehosthere.com/#organization',
      name: 'WEHOSTHERE - Codando Histórias',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.wehosthere.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.wehosthere.com/revista/${story.slug}`,
    },
    isPartOf: {
      '@type': 'Periodical',
      '@id': 'https://www.wehosthere.com/revista',
      name: 'Codando Histórias',
      issn: '',
    },
  };

  // GEO: BreadcrumbList - hierarquia de conteúdo para LLMs e Google
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
        name: 'Codando Histórias',
        item: 'https://www.wehosthere.com/revista',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: story.title,
        item: `https://www.wehosthere.com/revista/${story.slug}`,
      },
    ],
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
      <RevistaStoryClient initialStory={story as any} />
    </>
  );
}

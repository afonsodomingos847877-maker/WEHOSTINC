import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

interface Props {
  params: { slug: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const DEFAULT_IMAGE = `${SITE_URL}/servidores-banner.png`;
  const canonicalUrl = `${SITE_URL}/revista/${params.slug}`;

  try {
    const { connectDB } = await import('@/lib/mongodb');
    await connectDB();
    const RevistaStory = (await import('@/models/RevistaStory')).default;
    const story: any = await RevistaStory.findOne({ slug: params.slug, status: 'published' }).lean();

    if (story) {
      // A foto que deve aparecer na partilha (WhatsApp/redes) é a foto do autor; se não definida, usa a capa da história
      const authorImg = story.author?.avatar?.trim();
      const coverImg = story.coverImage?.trim();
      const selectedImg = authorImg || coverImg;

      const imageUrl = selectedImg?.startsWith('http')
        ? selectedImg
        : selectedImg?.startsWith('/')
        ? `${SITE_URL}${selectedImg}`
        : DEFAULT_IMAGE;

      const title = story.seo?.metaTitle || `${story.title} | Codando Histórias`;
      const description =
        story.seo?.metaDescription ||
        story.excerpt ||
        'Histórias reais de código, startups, design e carreira tech em Moçambique na revista digital WEHOSTHERE.';

      return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
          type: 'article',
          locale: 'pt_MZ',
          url: canonicalUrl,
          siteName: 'Codando Histórias - Revista Digital WEHOSTHERE',
          title,
          description,
          publishedTime: story.publishedAt ? new Date(story.publishedAt).toISOString() : undefined,
          authors: story.author?.name ? [story.author.name] : ['WEHOSTHERE'],
          images: [
            {
              url: imageUrl,
              secureUrl: imageUrl,
              width: 1200,
              height: 630,
              alt: story.title,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [imageUrl],
          creator: '@wehosthere',
        },
      };
    }
  } catch (err) {
    console.error('[Revista] Erro ao gerar metadata para história:', err);
  }

  return {
    title: 'Codando Histórias | Revista Digital WEHOSTHERE',
    description: 'Histórias reais de código, startups, design e carreira tech em Moçambique.',
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      locale: 'pt_MZ',
      url: canonicalUrl,
      siteName: 'Codando Histórias - Revista Digital WEHOSTHERE',
      title: 'Codando Histórias | Revista Digital WEHOSTHERE',
      description: 'Histórias reais de código, startups, design e carreira tech em Moçambique.',
      images: [
        {
          url: DEFAULT_IMAGE,
          secureUrl: DEFAULT_IMAGE,
          width: 1200,
          height: 630,
          alt: 'Codando Histórias - WEHOSTHERE',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Codando Histórias | Revista Digital WEHOSTHERE',
      images: [DEFAULT_IMAGE],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';
import { connectDB } from '@/lib/mongodb';
import { CourseModel } from '@/lib/models/CourseModel';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const rawSlug = decodeURIComponent(params.slug || '');
  const fallbackUrl = `${SITE_URL}/academy/courses/${encodeURIComponent(rawSlug)}`;

  try {
    await connectDB();
    const course = (await CourseModel.findOne({
      $or: [{ slug: rawSlug }, { id: rawSlug }],
    })
      .select('id slug title shortDescription description category thumbnail')
      .lean()) as {
      id?: string;
      slug?: string;
      title?: string;
      shortDescription?: string;
      description?: string;
      category?: string;
      thumbnail?: string;
    } | null;

    if (!course || !course.title) {
      return {
        title: 'Curso | Academia WEHOSTHERE',
        description:
          'Formação prática na Academia WEHOSTHERE em Moçambique com certificado oficial.',
        alternates: { canonical: fallbackUrl },
      };
    }

    const canonicalSlug = course.slug || course.id || rawSlug;
    const canonicalUrl = `${SITE_URL}/academy/courses/${canonicalSlug}`;
    const desc = (course.shortDescription || course.description || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);
    const ogImage = course.thumbnail || `${SITE_URL}/servidores-banner.png`;

    return {
      title: `${course.title} | Academia WEHOSTHERE`,
      description:
        desc ||
        `Curso prático de ${course.title} na Academia WEHOSTHERE em Moçambique com certificado oficial.`,
      keywords: [
        course.title,
        course.category || 'Cursos Online',
        'Academia WEHOSTHERE',
        'curso online Moçambique',
      ],
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        type: 'website',
        locale: 'pt_MZ',
        url: canonicalUrl,
        title: `${course.title} | Academia WEHOSTHERE`,
        description:
          desc ||
          `Curso prático de ${course.title} na Academia WEHOSTHERE em Moçambique.`,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: course.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${course.title} | Academia WEHOSTHERE`,
        description: desc || `Aprende ${course.title} na Academia WEHOSTHERE.`,
        images: [ogImage],
      },
    };
  } catch {
    return {
      title: 'Curso | Academia WEHOSTHERE',
      description:
        'Formação prática na Academia WEHOSTHERE em Moçambique com certificado oficial.',
      alternates: { canonical: fallbackUrl },
    };
  }
}

export default function CourseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

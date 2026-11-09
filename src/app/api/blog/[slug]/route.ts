import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    const BlogPost = (await import('@/lib/models/BlogPost')).default;
    const rawSlug = params.slug;
    const slug = decodeURIComponent(rawSlug).trim();

    const post: any = await BlogPost.findOne({
      slug,
      status: 'published'
    }).lean();

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post não encontrado' },
        { status: 404 }
      );
    }

    // Buscar posts relacionados (mesma categoria ou tags)
    let relatedPosts: any[] = [];
    try {
      const rawRelated = await BlogPost.find({
        status: 'published',
        slug: { $ne: slug },
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

    return NextResponse.json({
      success: true,
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
        seo: post.seo,
      },
      relatedPosts,
    });
  } catch (err: any) {
    console.error('[API Blog Slug] Erro:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}


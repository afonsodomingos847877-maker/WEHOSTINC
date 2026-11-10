import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/serverAuth';

// GET - Listar posts (público apenas para publicados; rascunhos/todos exigem admin)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'published';

    if (status !== 'published') {
      const auth = await requireAdmin(req);
      if (auth.error) return auth.error;
    }

    await connectDB();
    
    const BlogPost = (await import('@/lib/models/BlogPost')).default;
    
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    const filter: any = {};
    if (status !== 'all') {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }
    if (featured === 'true') {
      filter.featured = true;
    }
    
    const posts = await BlogPost.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await BlogPost.countDocuments(filter);
    
    return NextResponse.json({
      success: true,
      posts: posts.map((post: any) => ({
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
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('[Blog Posts GET] Erro:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

// POST - Criar novo post
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    
    const BlogPost = (await import('@/lib/models/BlogPost')).default;
    const body = await req.json();
    
    const { title, excerpt, content, coverImage, author, category, tags, status, featured, seo } = body;
    
    if (!title || !excerpt || !content) {
      return NextResponse.json({ 
        error: 'Título, resumo e conteúdo são obrigatórios' 
      }, { status: 400 });
    }

    // Gerar slug automaticamente se não fornecido
    let slug = body.slug;
    if (!slug) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Verificar se slug já existe
      const BlogPostCheck = (await import('@/lib/models/BlogPost')).default;
      const existing = await BlogPostCheck.findOne({ slug });
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }
    }
    
    const post = await BlogPost.create({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      author: author || { name: 'Afonso Domingos', email: 'afonso@wehosthere.com' },
      category: category || 'news',
      tags: tags || [],
      status: status || 'draft',
      featured: featured || false,
      seo: seo || {}
    });

    // Se post foi publicado, criar notificação e enviar emails para todos os usuários
    if (status === 'published') {
      try {
        const { addAdminNotification, notifyAllUsersAboutNewPost } = await import('@/lib/notifications');
        
        // Notificação para admin
        await addAdminNotification({
          title: 'Novo Post Publicado no Blog',
          message: `O post "${title}" foi publicado no blog.`,
          type: 'blog_post',
          link: `/blog/${post.slug}`,
          metadata: {
            postId: post._id.toString(),
            category: post.category
          }
        });

        // Enviar emails para todos os usuários ativos
        const notificationResult = await notifyAllUsersAboutNewPost({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          coverImage: post.coverImage,
          publishedAt: post.publishedAt || new Date()
        });

        console.log('[Blog] Notificações enviadas:', notificationResult);
      } catch (error) {
        console.error('[Blog] Erro ao criar notificação ou enviar emails:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      post: {
        id: post._id.toString(),
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
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
      }
    });
  } catch (err: any) {
    console.error('[Blog Posts POST] Erro:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

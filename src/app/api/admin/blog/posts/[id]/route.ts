import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/serverAuth';

// GET - Buscar post por ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    
    const BlogPost = (await import('@/lib/models/BlogPost')).default;
    
    const post = await BlogPost.findById(params.id).lean();
    
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      post: {
        id: (post as any)._id?.toString() || (post as any).id,
        title: (post as any).title,
        slug: (post as any).slug,
        excerpt: (post as any).excerpt,
        content: (post as any).content,
        coverImage: (post as any).coverImage,
        author: (post as any).author,
        category: (post as any).category,
        tags: (post as any).tags,
        status: (post as any).status,
        publishedAt: (post as any).publishedAt,
        views: (post as any).views,
        featured: (post as any).featured,
        createdAt: (post as any).createdAt,
        updatedAt: (post as any).updatedAt,
        seo: (post as any).seo
      }
    });
  } catch (err: any) {
    console.error('[Blog Post GET] Erro:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

// PUT - Atualizar post
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    
    const BlogPost = (await import('@/lib/models/BlogPost')).default;
    const body = await req.json();
    
    const post = await BlogPost.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean();
    
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      post: {
        id: (post as any)._id?.toString() || (post as any).id,
        title: (post as any).title,
        slug: (post as any).slug,
        excerpt: (post as any).excerpt,
        content: (post as any).content,
        coverImage: (post as any).coverImage,
        author: (post as any).author,
        category: (post as any).category,
        tags: (post as any).tags,
        status: (post as any).status,
        publishedAt: (post as any).publishedAt,
        views: (post as any).views,
        featured: (post as any).featured,
        createdAt: (post as any).createdAt,
        updatedAt: (post as any).updatedAt,
        seo: (post as any).seo
      }
    });
  } catch (err: any) {
    console.error('[Blog Post PUT] Erro:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

// DELETE - Remover post
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    
    const BlogPost = (await import('@/lib/models/BlogPost')).default;
    
    const post = await BlogPost.findByIdAndDelete(params.id);
    
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Post removido com sucesso'
    });
  } catch (err: any) {
    console.error('[Blog Post DELETE] Erro:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

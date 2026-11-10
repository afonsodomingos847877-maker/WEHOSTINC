import { NextResponse } from 'next/server';
import { getStoriesList, createStory } from '@/lib/revistaData';
import { connectDB } from '@/lib/mongodb';
import RevistaDownload from '@/models/RevistaDownload';
import { requireAdmin } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'published';
    if (status !== 'published') {
      const auth = await requireAdmin(req);
      if (auth.error) return auth.error;
    }
    const category = searchParams.get('category') || undefined;
    const featured = searchParams.get('featured') === 'true' ? true : undefined;
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const { stories, total } = await getStoriesList({
      status,
      category,
      featured,
      limit,
      page,
    });

    let pdfDownloadsCount = 0;
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        pdfDownloadsCount = await RevistaDownload.countDocuments();
      } catch (err) {
        console.warn('[Admin Stories] Erro ao contar downloads de PDF:', err);
      }
    }

    return NextResponse.json({
      success: true,
      stories,
      pdfDownloadsCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    console.error('[Revista GET]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { title, excerpt, content } = body;

    if (!title || !excerpt || !content) {
      return NextResponse.json(
        { error: 'Título, resumo e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    if (title.trim().length > 100) {
      return NextResponse.json({ error: 'O título não pode exceder 100 caracteres.' }, { status: 400 });
    }
    if (excerpt.trim().length > 500) {
      return NextResponse.json({ error: 'O resumo não pode exceder 500 caracteres.' }, { status: 400 });
    }
    if (content.trim().length > 5000) {
      return NextResponse.json({ error: 'O conteúdo não pode exceder 5.000 caracteres.' }, { status: 400 });
    }
    if (body.author?.bio && body.author.bio.trim().length > 500) {
      return NextResponse.json({ error: 'A bio do autor não pode exceder 500 caracteres.' }, { status: 400 });
    }

    const story = await createStory(body);

    return NextResponse.json({
      success: true,
      story,
    });
  } catch (err: any) {
    console.error('[Revista POST]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

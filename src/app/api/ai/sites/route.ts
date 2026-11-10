import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AiSiteModel from '@/lib/models/AiSite';
import { getSessionUser, isAdminRole, requireAuth } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

function generateSlug(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base || 'site'}-${randomSuffix}`;
}

// GET - Listar todos os sites gerados pelo utilizador (ou pré-visualizar site publicado por slug)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    await connectDB();

    const sessionUser = await getSessionUser(request);
    const isAdmin = isAdminRole(sessionUser?.role);

    // Se estiver a procurar por slug (para visualização pública de sites publicados, ou dono/admin para rascunhos)
    if (slug && !id) {
      const site = await AiSiteModel.findOne({ slug: slug.toLowerCase() }).lean() as any;
      if (!site) {
        return NextResponse.json({ error: 'Site não encontrado' }, { status: 404 });
      }
      if (site.status !== 'published' && (!sessionUser || (!isAdmin && site.userEmail !== sessionUser.email))) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
      }
      return NextResponse.json({ success: true, site });
    }

    if (!sessionUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Se estiver a procurar por id específico
    if (id) {
      const site = await AiSiteModel.findOne({ id }).lean() as any;
      if (!site) {
        return NextResponse.json({ error: 'Site não encontrado' }, { status: 404 });
      }
      if (!isAdmin && site.userEmail !== sessionUser.email) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
      return NextResponse.json({ success: true, site });
    }

    const targetEmail = isAdmin && userEmail ? userEmail.toLowerCase() : sessionUser.email;
    const sites = await AiSiteModel.find({ userEmail: targetEmail })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, sites });
  } catch (error: any) {
    console.error('[AI Sites GET Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar sites', details: error?.message }, { status: 500 });
  }
}

// POST - Criar, Atualizar ou Publicar um site
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const {
      id,
      userEmail,
      userName,
      title = 'Meu Site',
      slug: customSlug,
      subdomain,
      htmlContent,
      documentJson,
      promptHistory = [],
      versions = [],
      status = 'draft',
      customDomain
    } = body;

    if (!htmlContent) {
      return NextResponse.json({ error: 'htmlContent é obrigatório' }, { status: 400 });
    }

    await connectDB();

    const isAdmin = isAdminRole(auth.user.role);
    const cleanEmail = (isAdmin && userEmail ? String(userEmail) : auth.user.email).toLowerCase().trim();
    const siteId = id || `site_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (id) {
      const existing = await AiSiteModel.findOne({ id: siteId }).lean() as any;
      if (existing && !isAdmin && existing.userEmail !== auth.user.email) {
        return NextResponse.json({ error: 'Acesso negado para editar este site' }, { status: 403 });
      }
    }
    const finalSlug = customSlug || generateSlug(title);
    const finalSubdomain = subdomain || finalSlug;

    const updateData: any = {
      title,
      htmlContent,
      promptHistory,
      versions,
      status,
      slug: finalSlug,
      subdomain: finalSubdomain,
      userEmail: cleanEmail,
      userName,
      customDomain: customDomain ? customDomain.trim().toLowerCase() : undefined,
      updatedAt: new Date().toISOString(),
    };

    if (documentJson !== undefined) {
      updateData.documentJson = documentJson;
    }

    if (status === 'published') {
      updateData.publishedAt = new Date().toISOString();
    }

    // Se o registo já existe, atualiza. Se não, cria.
    const site = await AiSiteModel.findOneAndUpdate(
      { id: siteId },
      {
        $set: updateData,
        $setOnInsert: {
          id: siteId,
          createdAt: new Date().toISOString(),
          views: 0
        }
      },
      { upsert: true, new: true, lean: true }
    );

    return NextResponse.json({
      success: true,
      site,
      message: status === 'published' ? 'Site publicado com sucesso!' : 'Site guardado com sucesso!'
    });
  } catch (error: any) {
    console.error('[AI Sites POST Error]:', error);
    return NextResponse.json({ error: 'Erro ao guardar site', details: error?.message }, { status: 500 });
  }
}

// DELETE - Apagar um site
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    await connectDB();

    const isAdmin = isAdminRole(auth.user.role);
    const query = isAdmin ? { id } : { id, userEmail: auth.user.email };
    const deleted = await AiSiteModel.deleteOne(query);
    if (deleted.deletedCount === 0) {
      return NextResponse.json({ error: 'Site não encontrado ou sem permissão' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Site eliminado com sucesso' });
  } catch (error: any) {
    console.error('[AI Sites DELETE Error]:', error);
    return NextResponse.json({ error: 'Erro ao eliminar site', details: error?.message }, { status: 500 });
  }
}

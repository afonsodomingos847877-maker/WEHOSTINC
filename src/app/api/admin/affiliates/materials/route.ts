import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import MarketingMaterial from '@/lib/models/MarketingMaterial';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();

    const materials = await MarketingMaterial.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      materials,
    });
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar materiais',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();

    const body = await request.json();
    const {
      title,
      description,
      type,
      content,
      imageUrl,
      imageUrlDark,
      dimensions,
      platform,
      category,
      language,
      createdBy,
    } = body;

    const effectiveCreatedBy =
      createdBy ||
      (adminAuth as any).user?.id ||
      (adminAuth as any).user?.email ||
      'admin';

    if (!title || !description || !type || !content || !category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Preencha todos os campos obrigatórios (Título, Descrição, Tipo, Categoria e Conteúdo).',
        },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const docData: Record<string, any> = {
      title: String(title).trim(),
      description: String(description).trim(),
      type: String(type).trim(),
      content: String(content).trim(),
      imageUrl: imageUrl || '',
      imageUrlDark: imageUrlDark || '',
      dimensions: dimensions || undefined,
      platform: platform ? String(platform).trim() : undefined,
      category: String(category).trim(),
      language: language || 'pt',
      isActive: true,
      createdBy: String(effectiveCreatedBy),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    let material: any;
    try {
      material = await MarketingMaterial.create(docData);
    } catch (schemaErr) {
      console.warn('Fallback insertOne for MarketingMaterial:', schemaErr);
      const result = await MarketingMaterial.collection.insertOne(docData);
      material = { _id: result.insertedId, ...docData };
    }

    return NextResponse.json(
      {
        success: true,
        material,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao criar material:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Erro ao criar material',
      },
      { status: 500 }
    );
  }
}

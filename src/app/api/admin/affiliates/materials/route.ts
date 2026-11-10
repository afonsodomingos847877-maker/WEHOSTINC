import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import MarketingMaterial from '@/lib/models/MarketingMaterial';

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const materials = await MarketingMaterial.find()
      .sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true, 
      materials
    });

  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar materiais' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const body = await request.json();
    console.log('POST /api/admin/affiliates/materials - Body:', body);
    
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
      createdBy 
    } = body;

    console.log('POST /api/admin/affiliates/materials - Fields check:', {
      title: !!title,
      description: !!description,
      type: !!type,
      content: !!content,
      category: !!category,
      createdBy: !!createdBy
    });

    if (!title || !description || !type || !content || !category || !createdBy) {
      console.error('POST /api/admin/affiliates/materials - Missing required fields');
      return NextResponse.json({ 
        success: false, 
        error: 'Campos obrigatórios: title, description, type, content, category, createdBy' 
      }, { status: 400 });
    }

    const material = await MarketingMaterial.create({
      title,
      description,
      type,
      content,
      imageUrl,
      imageUrlDark,
      dimensions,
      platform,
      category,
      language: language || 'pt',
      isActive: true,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      material 
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar material:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao criar material' 
    }, { status: 500 });
  }
}

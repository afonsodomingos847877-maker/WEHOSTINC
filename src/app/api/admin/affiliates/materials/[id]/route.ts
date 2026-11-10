import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import MarketingMaterial from '@/lib/models/MarketingMaterial';

export async function PATCH(request: NextRequest,
  { params }: { params: { id: string } }) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const body = await request.json();
    const { id } = params;

    const material = await MarketingMaterial.findByIdAndUpdate(
      id,
      { 
        ...body, 
        updatedAt: new Date().toISOString() 
      },
      { new: true }
    );

    if (!material) {
      return NextResponse.json({ success: false, error: 'Material não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, material });

  } catch (error) {
    console.error('Erro ao atualizar material:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar material' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest,
  { params }: { params: { id: string } }) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const { id } = params;

    const material = await MarketingMaterial.findByIdAndDelete(id);

    if (!material) {
      return NextResponse.json({ success: false, error: 'Material não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Material excluído com sucesso' });

  } catch (error) {
    console.error('Erro ao excluir material:', error);
    return NextResponse.json({ success: false, error: 'Erro ao excluir material' }, { status: 500 });
  }
}

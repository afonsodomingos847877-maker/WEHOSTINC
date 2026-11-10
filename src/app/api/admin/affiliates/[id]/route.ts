import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';

export async function PATCH(request: NextRequest,
  { params }: { params: { id: string } }) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const body = await request.json();
    const { id } = params;

    const affiliate = await Affiliate.findByIdAndUpdate(
      id,
      { 
        ...body, 
        updatedAt: new Date().toISOString() 
      },
      { new: true }
    );

    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'Afiliado não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, affiliate });

  } catch (error) {
    console.error('Erro ao atualizar afiliado:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar afiliado' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest,
  { params }: { params: { id: string } }) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const { id } = params;

    const affiliate = await Affiliate.findByIdAndDelete(id);

    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'Afiliado não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Afiliado excluído com sucesso' });

  } catch (error) {
    console.error('Erro ao excluir afiliado:', error);
    return NextResponse.json({ success: false, error: 'Erro ao excluir afiliado' }, { status: 500 });
  }
}

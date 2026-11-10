import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import CashvibeClient from '@/models/CashvibeClient';
import CashvibeLoan from '@/models/CashvibeLoan';
import CashvibePayment from '@/models/CashvibePayment';

// GET /api/admin/cashvibe/clients/[id] - Obter detalhes do cliente
export async function GET(request: NextRequest,
  { params }: { params: { id: string } }) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const { id } = params;

    const client = await CashvibeClient.findOne({ id }).lean();
    if (!client) {
      return NextResponse.json({ success: false, error: 'Cliente não encontrado' }, { status: 404 });
    }

    const loans = await CashvibeLoan.find({ clientId: id }).sort({ createdAt: -1 }).lean();
    const payments = await CashvibePayment.find({ clientId: id }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      client,
      loans,
      payments,
    });
  } catch (error: any) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados do cliente', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/cashvibe/clients/[id] - Atualizar cliente
export async function PUT(request: NextRequest,
  { params }: { params: { id: string } }) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();

    const updatedClient = await CashvibeClient.findOneAndUpdate(
      { id },
      { $set: body },
      { new: true }
    );

    if (!updatedClient) {
      return NextResponse.json({ success: false, error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, client: updatedClient });
  } catch (error: any) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao atualizar cliente', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/cashvibe/clients/[id] - Remover cliente
export async function DELETE(request: NextRequest,
  { params }: { params: { id: string } }) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const { id } = params;

    // Verificar se tem empréstimos ativos
    const activeLoan = await CashvibeLoan.findOne({
      clientId: id,
      status: { $in: ['active', 'overdue', 'pending'] },
    });

    if (activeLoan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não é possível remover um cliente com empréstimos ativos ou pendentes. Liquidou ou cancele os empréstimos primeiro.',
        },
        { status: 400 }
      );
    }

    await CashvibeClient.findOneAndDelete({ id });
    return NextResponse.json({ success: true, message: 'Cliente removido com sucesso' });
  } catch (error: any) {
    console.error('Erro ao remover cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao remover cliente', details: error.message },
      { status: 500 }
    );
  }
}

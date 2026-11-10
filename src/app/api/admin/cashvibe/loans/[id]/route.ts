import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import CashvibeLoan from '@/models/CashvibeLoan';
import CashvibePayment from '@/models/CashvibePayment';

// GET /api/admin/cashvibe/loans/[id] - Obter detalhes do empréstimo
export async function GET(request: NextRequest,
  { params }: { params: { id: string } }) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const { id } = params;

    const loan = await CashvibeLoan.findOne({ id }).lean();
    if (!loan) {
      return NextResponse.json({ success: false, error: 'Empréstimo não encontrado' }, { status: 404 });
    }

    const payments = await CashvibePayment.find({ loanId: id }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, loan, payments });
  } catch (error: any) {
    console.error('Erro ao buscar empréstimo:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao buscar empréstimo', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/cashvibe/loans/[id] - Atualizar dados ou status do empréstimo
export async function PUT(request: NextRequest,
  { params }: { params: { id: string } }) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();

    const updatedLoan = await CashvibeLoan.findOneAndUpdate(
      { id },
      { $set: body },
      { new: true }
    );

    if (!updatedLoan) {
      return NextResponse.json({ success: false, error: 'Empréstimo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, loan: updatedLoan });
  } catch (error: any) {
    console.error('Erro ao atualizar empréstimo:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao atualizar empréstimo', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/cashvibe/loans/[id] - Excluir empréstimo
export async function DELETE(request: NextRequest,
  { params }: { params: { id: string } }) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const { id } = params;

    const loan = await CashvibeLoan.findOne({ id });
    if (!loan) {
      return NextResponse.json({ success: false, error: 'Empréstimo não encontrado' }, { status: 404 });
    }

    if (loan.totalPaid > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não é possível excluir um empréstimo com histórico de pagamentos amortizados. Altere o status para "cancelado" se necessário.',
        },
        { status: 400 }
      );
    }

    await CashvibeLoan.findOneAndDelete({ id });
    await CashvibePayment.deleteMany({ loanId: id });

    return NextResponse.json({ success: true, message: 'Empréstimo excluído com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir empréstimo:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao excluir empréstimo', details: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import CashvibeLoan from '@/models/CashvibeLoan';
import CashvibePayment from '@/models/CashvibePayment';

// GET /api/admin/cashvibe/loans/[id]/payments - Listar pagamentos de um empréstimo
export async function GET(request: NextRequest,
  { params }: { params: { id: string } }) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const { id } = params;

    const payments = await CashvibePayment.find({ loanId: id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    console.error('Erro ao buscar pagamentos:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao buscar pagamentos', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/cashvibe/loans/[id]/payments - Registrar amortização / pagamento
export async function POST(request: NextRequest,
  { params }: { params: { id: string } }) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();

    const {
      amount,
      installmentNumber,
      paymentMethod = 'mpesa',
      transactionReference = '',
      receivedBy = 'Admin Cashvibe',
      paymentDate = new Date().toISOString().split('T')[0],
      notes = '',
    } = body;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valor do pagamento deve ser maior que zero.' },
        { status: 400 }
      );
    }

    const loan = await CashvibeLoan.findOne({ id });
    if (!loan) {
      return NextResponse.json({ success: false, error: 'Empréstimo não encontrado.' }, { status: 404 });
    }

    // Gerar número de recibo oficial
    const countPayments = await CashvibePayment.countDocuments();
    const year = new Date().getFullYear();
    const receiptNumber = `REC-CV-${year}-${String(countPayments + 1).padStart(5, '0')}`;
    const paymentId = receiptNumber;

    // Distribuir valor nas parcelas (da mais antiga não liquidada em diante)
    let amountToDistribute = paymentAmount;
    const installments = [...loan.installments];

    if (installmentNumber && installments.find((inst: any) => inst.number === installmentNumber)) {
      // Amortizar parcela específica primeiro
      const targetInst = installments.find((inst: any) => inst.number === installmentNumber)!;
      const need = targetInst.remainingAmount;
      const payForThis = Math.min(amountToDistribute, need);
      targetInst.paidAmount += payForThis;
      targetInst.remainingAmount -= payForThis;
      if (targetInst.remainingAmount <= 0) {
        targetInst.status = 'paid';
        targetInst.paidAt = paymentDate;
      } else {
        targetInst.status = 'partial';
      }
      amountToDistribute -= payForThis;
    }

    // Se ainda sobrar valor, amortizar as parcelas restantes sequencialmente
    if (amountToDistribute > 0) {
      for (const inst of installments) {
        if (amountToDistribute <= 0) break;
        if (inst.status !== 'paid' && inst.remainingAmount > 0) {
          const need = inst.remainingAmount;
          const payForThis = Math.min(amountToDistribute, need);
          inst.paidAmount += payForThis;
          inst.remainingAmount -= payForThis;
          if (inst.remainingAmount <= 0) {
            inst.status = 'paid';
            inst.paidAt = paymentDate;
          } else {
            inst.status = 'partial';
          }
          amountToDistribute -= payForThis;
        }
      }
    }

    // Recalcular totais do empréstimo
    const newTotalPaid = loan.totalPaid + paymentAmount;
    const newTotalRemaining = Math.max(0, loan.totalAmount - newTotalPaid);
    const isFullyPaid = newTotalRemaining <= 0;

    loan.totalPaid = newTotalPaid;
    loan.totalRemaining = newTotalRemaining;
    loan.installments = installments;
    if (isFullyPaid) {
      loan.status = 'paid';
    } else {
      // Se não venceu nenhuma outra parcela, manter ativo
      const todayStr = new Date().toISOString().split('T')[0];
      const hasOverdue = installments.some((i: any) => i.status === 'overdue' || (i.remainingAmount > 0 && i.dueDate < todayStr));
      loan.status = hasOverdue ? 'overdue' : 'active';
    }

    await loan.save();

    // Criar registro de pagamento
    const payment = await CashvibePayment.create({
      id: paymentId,
      loanId: loan.id,
      clientId: loan.clientId,
      clientName: loan.clientName,
      installmentNumber: installmentNumber || undefined,
      amount: paymentAmount,
      principalPaid: Math.round((paymentAmount * loan.principalAmount) / loan.totalAmount),
      interestPaid: Math.round((paymentAmount * loan.interestAmount) / loan.totalAmount),
      lateFeePaid: 0,
      paymentDate,
      paymentMethod,
      transactionReference,
      receiptNumber,
      receivedBy,
      notes,
    });

    return NextResponse.json({
      success: true,
      payment,
      loanSummary: {
        loanId: loan.id,
        clientName: loan.clientName,
        totalAmount: loan.totalAmount,
        totalPaid: loan.totalPaid,
        totalRemaining: loan.totalRemaining,
        status: loan.status,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao registrar pagamento:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao registrar pagamento', details: error.message },
      { status: 500 }
    );
  }
}

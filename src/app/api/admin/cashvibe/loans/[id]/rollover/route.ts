import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import CashvibeLoan from '@/models/CashvibeLoan';
import CashvibePayment from '@/models/CashvibePayment';

// POST /api/admin/cashvibe/loans/[id]/rollover - Aplicar Prorrogação / Rollover de Prazo
export async function POST(request: NextRequest,
  { params }: { params: { id: string } }) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();

    const {
      rolloverFee = 300,
      extensionDays = 30,
      paymentMethod = 'mpesa',
      transactionReference = '',
      receivedBy = 'Admin Cashvibe',
      paymentDate = new Date().toISOString().split('T')[0],
      notes = '',
    } = body;

    const feeAmount = Number(rolloverFee);
    const daysToAdd = Number(extensionDays) || 30;

    if (feeAmount < 0) {
      return NextResponse.json(
        { success: false, error: 'A taxa de rollover não pode ser negativa.' },
        { status: 400 }
      );
    }

    const loan = await CashvibeLoan.findOne({ id });
    if (!loan) {
      return NextResponse.json({ success: false, error: 'Empréstimo não encontrado.' }, { status: 404 });
    }

    if (loan.status === 'paid' || loan.totalRemaining <= 0) {
      return NextResponse.json(
        { success: false, error: 'Este empréstimo já se encontra liquidado. Não é possível aplicar rollover.' },
        { status: 400 }
      );
    }

    // Gerar número de recibo oficial para a taxa de rollover
    const countPayments = await CashvibePayment.countDocuments();
    const year = new Date().getFullYear();
    const receiptNumber = `REC-CV-${year}-${String(countPayments + 1).padStart(5, '0')}`;

    // Calcular nova data final de vencimento
    const currentFinalDate = new Date(loan.finalDueDate || paymentDate);
    const newFinalDate = new Date(currentFinalDate);
    newFinalDate.setDate(newFinalDate.getDate() + daysToAdd);
    const newFinalDateStr = newFinalDate.toISOString().split('T')[0];

    // Atualizar parcelas pendentes ou em atraso para o novo prazo
    const installments = loan.installments.map((inst: any) => {
      if (inst.status !== 'paid') {
        const instDue = new Date(inst.dueDate);
        instDue.setDate(instDue.getDate() + daysToAdd);
        return {
          ...inst,
          dueDate: instDue.toISOString().split('T')[0],
          status: 'pending', // Reseta status de overdue já que foi estendido
        };
      }
      return inst;
    });

    // Criar o registro de pagamento exclusivo da taxa de juro / rollover
    const payment = await CashvibePayment.create({
      id: receiptNumber,
      loanId: loan.id,
      clientId: loan.clientId,
      clientName: loan.clientName,
      installmentNumber: undefined,
      amount: feeAmount,
      principalPaid: 0,
      interestPaid: feeAmount,
      lateFeePaid: 0,
      paymentDate,
      paymentMethod,
      transactionReference,
      receiptNumber,
      receivedBy,
      notes: `Rollover/Prorrogação de ${daysToAdd} dias aplicada. ${notes}`.trim(),
    });

    // Atualizar empréstimo: novo prazo e status ativo
    loan.finalDueDate = newFinalDateStr;
    loan.installments = installments;
    loan.status = 'active'; // Zera status overdue
    loan.notes = `${loan.notes ? loan.notes + ' | ' : ''}Rollover de ${daysToAdd}d concedido em ${paymentDate} (Recibo: ${receiptNumber})`;

    await loan.save();

    return NextResponse.json({
      success: true,
      message: `Rollover de ${daysToAdd} dias aplicado com sucesso!`,
      payment,
      receiptNumber,
      updatedLoan: loan,
    });
  } catch (error: any) {
    console.error('Erro ao aplicar rollover:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao processar rollover', details: error.message },
      { status: 500 }
    );
  }
}

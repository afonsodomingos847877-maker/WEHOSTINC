import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import CashvibeLoan, { IInstallment } from '@/models/CashvibeLoan';
import CashvibeClient from '@/models/CashvibeClient';

// Helper para somar dias a uma data
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Helper para somar meses a uma data
function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

// GET /api/admin/cashvibe/loans - Listar empréstimos
export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const clientId = searchParams.get('clientId') || '';
    const search = searchParams.get('search')?.trim() || '';

    const filter: Record<string, any> = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (clientId) {
      filter.clientId = clientId;
    }
    if (search) {
      filter.$or = [
        { id: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { clientPhone: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } },
      ];
    }

    const loans = await CashvibeLoan.find(filter).sort({ createdAt: -1 }).lean();

    const todayStr = new Date().toISOString().split('T')[0];

    // Atualização dinâmica de status de atraso caso tenha parcelas vencidas
    const updatedLoans = loans.map((loan: any) => {
      let isOverdue = false;
      const updatedInstallments = (loan.installments || []).map((inst: any) => {
        if (['pending', 'partial'].includes(inst.status) && inst.dueDate < todayStr) {
          isOverdue = true;
          return { ...inst, status: 'overdue' };
        }
        return inst;
      });

      let currentStatus = loan.status;
      if (currentStatus === 'active' && isOverdue) {
        currentStatus = 'overdue';
      }

      return {
        ...loan,
        status: currentStatus,
        installments: updatedInstallments,
      };
    });

    return NextResponse.json({ success: true, loans: updatedLoans });
  } catch (error: any) {
    console.error('Erro ao buscar empréstimos:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao buscar empréstimos', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/cashvibe/loans - Conceder novo empréstimo
export async function POST(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const body = await request.json();

    const {
      clientId,
      principalAmount,
      interestRate = 30, // 30% padrão Cashvibe
      durationValue = 1,
      durationUnit = 'months',
      installmentsCount = 1,
      disbursementDate = new Date().toISOString().split('T')[0],
      purpose = 'Capital de Giro',
      collateral = '',
      lateFeeDaily = 50,
      notes = '',
    } = body;

    if (!clientId || !principalAmount || principalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Cliente e valor do capital são obrigatórios.' },
        { status: 400 }
      );
    }

    // Buscar dados do cliente
    const client = await CashvibeClient.findOne({ id: clientId });
    if (!client) {
      return NextResponse.json({ success: false, error: 'Cliente não encontrado.' }, { status: 404 });
    }

    const principal = Number(principalAmount);
    const rate = Number(interestRate);
    const interest = Math.round((principal * rate) / 100);
    const total = principal + interest;
    const numInstallments = Math.max(1, Number(installmentsCount));
    const installmentAmount = Math.round(total / numInstallments);

    // Gerar ID do empréstimo (ex: CV-2026-0001)
    const count = await CashvibeLoan.countDocuments();
    const year = new Date().getFullYear();
    const id = `CV-${year}-${String(count + 1).padStart(4, '0')}`;

    // Gerar cronograma de parcelas
    const installments: IInstallment[] = [];
    let currentDue = disbursementDate;

    for (let i = 1; i <= numInstallments; i++) {
      if (durationUnit === 'weeks') {
        currentDue = addDays(currentDue, 7);
      } else if (durationUnit === 'days') {
        const intervalDays = Math.max(1, Math.floor(Number(durationValue) / numInstallments));
        currentDue = addDays(currentDue, intervalDays);
      } else {
        // months
        currentDue = addMonths(currentDue, 1);
      }

      // Ajustar última parcela para compensar arredondamento
      const isLast = i === numInstallments;
      const amount = isLast
        ? total - installmentAmount * (numInstallments - 1)
        : installmentAmount;

      installments.push({
        number: i,
        dueDate: currentDue,
        amount,
        paidAmount: 0,
        remainingAmount: amount,
        status: 'pending',
      });
    }

    const firstDueDate = installments[0]?.dueDate || currentDue;
    const finalDueDate = installments[installments.length - 1]?.dueDate || currentDue;

    const newLoan = await CashvibeLoan.create({
      id,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      clientDocumentNumber: client.documentNumber,
      principalAmount: principal,
      interestRate: rate,
      interestAmount: interest,
      totalAmount: total,
      totalPaid: 0,
      totalRemaining: total,
      durationValue: Number(durationValue),
      durationUnit,
      installmentsCount: numInstallments,
      disbursementDate,
      firstDueDate,
      finalDueDate,
      lateFeeDaily: Number(lateFeeDaily),
      status: 'active',
      purpose,
      collateral: collateral || client.collateralDescription || '',
      contractSigned: true,
      installments,
      notes,
    });

    return NextResponse.json({ success: true, loan: newLoan }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao conceder empréstimo:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao conceder empréstimo', details: error.message },
      { status: 500 }
    );
  }
}

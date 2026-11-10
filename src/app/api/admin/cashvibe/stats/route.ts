import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import CashvibeClient from '@/models/CashvibeClient';
import CashvibeLoan from '@/models/CashvibeLoan';
import CashvibePayment from '@/models/CashvibePayment';

// GET /api/admin/cashvibe/stats - Indicadores Financeiros do Microcrédito Cashvibe
export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();

    const todayStr = new Date().toISOString().split('T')[0];

    const [clientsCount, loans, payments] = await Promise.all([
      CashvibeClient.countDocuments(),
      CashvibeLoan.find().lean(),
      CashvibePayment.find().lean(),
    ]);

    let totalPrincipalDisbursed = 0;
    let totalInterestProjected = 0;
    let totalCollected = 0;
    let totalOutstandingDebt = 0;
    let totalOverdueDebt = 0;

    let activeLoansCount = 0;
    let overdueLoansCount = 0;
    let paidLoansCount = 0;

    const upcomingInstallments: any[] = [];
    const overdueInstallments: any[] = [];

    // Data daqui a 7 dias
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    const next7DaysStr = next7Days.toISOString().split('T')[0];

    loans.forEach((loan: any) => {
      totalPrincipalDisbursed += loan.principalAmount || 0;
      totalInterestProjected += loan.interestAmount || 0;
      totalCollected += loan.totalPaid || 0;
      totalOutstandingDebt += loan.totalRemaining || 0;

      let loanHasOverdue = false;

      (loan.installments || []).forEach((inst: any) => {
        if (inst.status !== 'paid' && inst.remainingAmount > 0) {
          if (inst.dueDate < todayStr) {
            // Em atraso
            loanHasOverdue = true;
            totalOverdueDebt += inst.remainingAmount;

            // Calcular dias de atraso
            const dueD = new Date(inst.dueDate);
            const todayD = new Date(todayStr);
            const diffTime = Math.abs(todayD.getTime() - dueD.getTime());
            const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const calculatedLateFee = daysOverdue * (loan.lateFeeDaily || 50);

            overdueInstallments.push({
              loanId: loan.id,
              clientName: loan.clientName,
              clientPhone: loan.clientPhone,
              installmentNumber: inst.number,
              amount: inst.amount,
              remainingAmount: inst.remainingAmount,
              dueDate: inst.dueDate,
              daysOverdue,
              calculatedLateFee,
              totalWithLateFee: inst.remainingAmount + calculatedLateFee,
            });
          } else if (inst.dueDate <= next7DaysStr) {
            // A vencer nos próximos 7 dias
            upcomingInstallments.push({
              loanId: loan.id,
              clientName: loan.clientName,
              clientPhone: loan.clientPhone,
              installmentNumber: inst.number,
              amount: inst.amount,
              remainingAmount: inst.remainingAmount,
              dueDate: inst.dueDate,
            });
          }
        }
      });

      if (loan.status === 'paid' || loan.totalRemaining <= 0) {
        paidLoansCount++;
      } else if (loanHasOverdue || loan.status === 'overdue') {
        overdueLoansCount++;
      } else if (['active', 'approved'].includes(loan.status)) {
        activeLoansCount++;
      }
    });

    const defaultRate = totalOutstandingDebt > 0
      ? Math.round((totalOverdueDebt / totalOutstandingDebt) * 100)
      : 0;

    // Lucro realizado (proporcional aos pagamentos já efetuados)
    const profitCollected = payments.reduce((sum: number, p: any) => sum + (p.interestPaid || 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalClients: clientsCount,
        totalLoans: loans.length,
        activeLoansCount,
        overdueLoansCount,
        paidLoansCount,
        totalPrincipalDisbursed,
        totalInterestProjected,
        totalCollected,
        profitCollected,
        totalOutstandingDebt,
        totalOverdueDebt,
        defaultRate,
      },
      upcomingInstallments: upcomingInstallments.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      overdueInstallments: overdueInstallments.sort((a, b) => b.daysOverdue - a.daysOverdue),
    });
  } catch (error: any) {
    console.error('Erro ao calcular estatísticas Cashvibe:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao buscar estatísticas', details: error.message },
      { status: 500 }
    );
  }
}

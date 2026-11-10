import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import CashvibeLoan from '@/models/CashvibeLoan';
import CashvibePayment from '@/models/CashvibePayment';
import CashvibeClient from '@/models/CashvibeClient';
import { generateFinancialReportPdf } from '@/lib/cashvibePdfGenerator';

// GET /api/admin/cashvibe/reports/financial-pdf - Gerar Relatório Executivo e DRE em PDF
export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

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
    let pddAmount = 0;

    const weeks = [
      { id: 'w1', label: 'Semana 1 (Próx. 7 dias)', daysStart: 0, daysEnd: 7, principal: 0, interest: 0, total: 0, count: 0 },
      { id: 'w2', label: 'Semana 2 (8 a 14 dias)', daysStart: 8, daysEnd: 14, principal: 0, interest: 0, total: 0, count: 0 },
      { id: 'w3', label: 'Semana 3 (15 a 21 dias)', daysStart: 15, daysEnd: 21, principal: 0, interest: 0, total: 0, count: 0 },
      { id: 'w4', label: 'Semana 4 (22 a 30 dias)', daysStart: 22, daysEnd: 30, principal: 0, interest: 0, total: 0, count: 0 },
    ];

    loans.forEach((loan: any) => {
      totalPrincipalDisbursed += loan.principalAmount || 0;
      totalInterestProjected += loan.interestAmount || 0;
      totalCollected += loan.totalPaid || 0;
      totalOutstandingDebt += loan.totalRemaining || 0;

      const principalRatio = loan.totalAmount > 0 ? (loan.principalAmount / loan.totalAmount) : 0.77;
      const interestRatio = loan.totalAmount > 0 ? (loan.interestAmount / loan.totalAmount) : 0.23;

      (loan.installments || []).forEach((inst: any) => {
        if (inst.status !== 'paid' && inst.remainingAmount > 0) {
          const dueDate = new Date(inst.dueDate);
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            totalOverdueDebt += inst.remainingAmount;
            if (Math.abs(diffDays) > 30) {
              pddAmount += inst.remainingAmount;
            }
          } else {
            for (const week of weeks) {
              if (diffDays >= week.daysStart && diffDays <= week.daysEnd) {
                const p = Math.round(inst.remainingAmount * principalRatio);
                const i = Math.round(inst.remainingAmount * interestRatio);
                week.principal += p;
                week.interest += i;
                week.total += inst.remainingAmount;
                week.count += 1;
                break;
              }
            }
          }
        }
      });
    });

    const realizedInterest = payments.reduce((sum: number, p: any) => sum + (p.interestPaid || 0), 0);
    const realizedPrincipal = payments.reduce((sum: number, p: any) => sum + (p.principalPaid || 0), 0);
    const netOperatingProfit = Math.max(0, realizedInterest - pddAmount);

    const pdfBytes = await generateFinancialReportPdf({
      dre: {
        totalDisbursed: totalPrincipalDisbursed,
        totalProjectedInterest: totalInterestProjected,
        totalCollected,
        realizedPrincipal,
        realizedInterest,
        totalOutstanding: totalOutstandingDebt,
        totalOverdue: totalOverdueDebt,
        pddAmount,
        netOperatingProfit,
        recoveryRate: totalPrincipalDisbursed > 0 ? Math.round((totalCollected / totalPrincipalDisbursed) * 100) : 0,
      },
      weeks,
      stats: {
        totalPrincipalDisbursed,
        totalCollected,
        totalOutstandingDebt,
        totalOverdueDebt,
      },
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Balancete-Financeiro-Cashvibe-${todayStr}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar balancete financeiro em PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao gerar relatório PDF', details: error.message },
      { status: 500 }
    );
  }
}

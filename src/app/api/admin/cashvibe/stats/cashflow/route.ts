import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import CashvibeLoan from '@/models/CashvibeLoan';
import CashvibePayment from '@/models/CashvibePayment';

// GET /api/admin/cashvibe/stats/cashflow - Projeção de Fluxo de Caixa & DRE
export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const [loans, payments] = await Promise.all([
      CashvibeLoan.find().lean(),
      CashvibePayment.find().lean(),
    ]);

    // Definição das 4 semanas de projeção
    const weeks = [
      { id: 'w1', label: 'Semana 1 (Próx. 7 dias)', daysStart: 0, daysEnd: 7, principal: 0, interest: 0, total: 0, count: 0 },
      { id: 'w2', label: 'Semana 2 (8 a 14 dias)', daysStart: 8, daysEnd: 14, principal: 0, interest: 0, total: 0, count: 0 },
      { id: 'w3', label: 'Semana 3 (15 a 21 dias)', daysStart: 15, daysEnd: 21, principal: 0, interest: 0, total: 0, count: 0 },
      { id: 'w4', label: 'Semana 4 (22 a 30 dias)', daysStart: 22, daysEnd: 30, principal: 0, interest: 0, total: 0, count: 0 },
    ];

    let totalDisbursed = 0;
    let totalProjectedInterest = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let pddAmount = 0; // Provisão para Devedores Duvidosos (> 30 dias)

    loans.forEach((loan: any) => {
      totalDisbursed += loan.principalAmount || 0;
      totalProjectedInterest += loan.interestAmount || 0;
      totalCollected += loan.totalPaid || 0;
      totalOutstanding += loan.totalRemaining || 0;

      const principalRatio = loan.totalAmount > 0 ? (loan.principalAmount / loan.totalAmount) : 0.77;
      const interestRatio = loan.totalAmount > 0 ? (loan.interestAmount / loan.totalAmount) : 0.23;

      (loan.installments || []).forEach((inst: any) => {
        if (inst.status !== 'paid' && inst.remainingAmount > 0) {
          const dueDate = new Date(inst.dueDate);
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            // Em atraso
            totalOverdue += inst.remainingAmount;
            if (Math.abs(diffDays) > 30) {
              pddAmount += inst.remainingAmount; // Risco de perda superior a 30 dias
            }
          } else {
            // Futuro dentro do horizonte de 30 dias
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

    // Realizado de pagamentos
    const realizedInterest = payments.reduce((sum: number, p: any) => sum + (p.interestPaid || 0), 0);
    const realizedPrincipal = payments.reduce((sum: number, p: any) => sum + (p.principalPaid || 0), 0);
    const netOperatingProfit = Math.max(0, realizedInterest - pddAmount);

    return NextResponse.json({
      success: true,
      dre: {
        totalDisbursed,
        totalProjectedInterest,
        totalCollected,
        realizedPrincipal,
        realizedInterest,
        totalOutstanding,
        totalOverdue,
        pddAmount,
        netOperatingProfit,
        recoveryRate: totalDisbursed > 0 ? Math.round((totalCollected / totalDisbursed) * 100) : 0,
      },
      weeks,
    });
  } catch (error: any) {
    console.error('Erro ao calcular fluxo de caixa Cashvibe:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao calcular fluxo de caixa', details: error.message },
      { status: 500 }
    );
  }
}

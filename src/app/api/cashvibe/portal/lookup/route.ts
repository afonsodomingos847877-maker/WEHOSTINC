import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import CashvibeClient from '@/models/CashvibeClient';
import CashvibeLoan from '@/models/CashvibeLoan';
import CashvibePayment from '@/models/CashvibePayment';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';
import { setCashvibePortalCookie } from '@/lib/serverAuth';

// POST /api/cashvibe/portal/lookup - Consulta pública de crédito para mutuários
export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rl = rateLimit(getRateLimitIdentifier(clientIp, 'cashvibe_portal'), 10, 60000);
    if (!rl.success) {
      return NextResponse.json({ success: false, error: 'Muitas consultas. Aguarde um minuto.' }, { status: 429 });
    }

    await connectDB();
    const body = await request.json();

    const { phone, documentNumber } = body;

    if (!phone && !documentNumber) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe o seu número de telefone ou número de BI/Documento.' },
        { status: 400 }
      );
    }

    const cleanPhone = (phone || '').replace(/\D/g, '');
    const cleanDoc = (documentNumber || '').trim().toUpperCase();

    // Buscar cliente pelo telefone ou documento
    const query: any = { $or: [] };
    if (cleanPhone.length >= 7) {
      const last8 = cleanPhone.slice(-8).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or.push({ phone: { $regex: last8 } });
      query.$or.push({ secondaryPhone: { $regex: last8 } });
    }
    if (cleanDoc.length >= 4) {
      const escapedDoc = cleanDoc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or.push({ documentNumber: { $regex: `^${escapedDoc}$`, $options: 'i' } });
    }

    if (query.$or.length === 0) {
      return NextResponse.json({ success: false, error: 'Dados insuficientes para consulta.' }, { status: 400 });
    }

    const client: any = await CashvibeClient.findOne(query).lean();
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Nenhum registo de crédito encontrado com os dados informados. Verifique o número digitado ou fale com o nosso suporte.' },
        { status: 404 }
      );
    }

    // Buscar empréstimos do mutuário
    const loans = await CashvibeLoan.find({ clientId: client.id }).sort({ createdAt: -1 }).lean();
    const payments = await CashvibePayment.find({ clientId: client.id }).sort({ paymentDate: -1 }).lean();

    const activeLoan = loans.find((l: any) => ['active', 'overdue', 'pending'].includes(l.status)) || null;
    const completedLoans = loans.filter((l: any) => l.status === 'paid');

    const res = NextResponse.json({
      success: true,
      client: {
        name: client.name,
        phone: client.phone,
        documentType: client.documentType,
        documentNumber: client.documentNumber ? `***${client.documentNumber.slice(-4)}` : '',
        status: client.status,
        rating: client.rating,
      },
      activeLoan: activeLoan ? {
        id: activeLoan.id,
        principalAmount: activeLoan.principalAmount,
        interestAmount: activeLoan.interestAmount,
        totalAmount: activeLoan.totalAmount,
        totalPaid: activeLoan.totalPaid,
        totalRemaining: activeLoan.totalRemaining,
        installmentsCount: activeLoan.installmentsCount,
        disbursementDate: activeLoan.disbursementDate,
        finalDueDate: activeLoan.finalDueDate,
        status: activeLoan.status,
        lateFeeDaily: activeLoan.lateFeeDaily,
        installments: activeLoan.installments,
      } : null,
      completedLoansCount: completedLoans.length,
      recentPayments: payments.slice(0, 5).map((p: any) => ({
        id: p.id,
        receiptNumber: p.receiptNumber,
        amount: p.amount,
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        transactionReference: p.transactionReference,
      })),
      paymentInstructions: {
        companyName: 'Cashvibe Microcrédito (WeHost Inc.)',
        mpesaAccount: '84 567 8901',
        mpesaName: 'WEHOST INC - CASHVIBE',
        emolaAccount: '86 567 8901',
        bciAccount: '0004 0000 123456789 10',
        supportWhatsApp: '+258845678901',
      },
    });
    return setCashvibePortalCookie(res, String(client.id));
  } catch (error: any) {
    console.error('Erro na consulta do portal do mutuário:', error);
    return NextResponse.json(
      { success: false, error: 'Falha temporária ao consultar dados', details: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import CashvibePayment from '@/models/CashvibePayment';
import CashvibeLoan from '@/models/CashvibeLoan';
import { generatePaymentReceiptPdf } from '@/lib/cashvibePdfGenerator';
import { getCashvibePortalClientId, getSessionUser, isAdminRole } from '@/lib/serverAuth';

// GET /api/admin/cashvibe/payments/[id]/pdf - Baixar PDF do Recibo Oficial
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const portalClientId = getCashvibePortalClientId(request);
    const sessionUser = await getSessionUser(request);
    const isAdmin = isAdminRole(sessionUser?.role);

    if (!isAdmin && !portalClientId) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();
    const { id } = params;

    // Buscar por id ou receiptNumber
    const payment: any = await CashvibePayment.findOne({
      $or: [{ id }, { receiptNumber: id }],
    }).lean();

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Recibo não encontrado' }, { status: 404 });
    }

    if (!isAdmin && String(payment.clientId) !== portalClientId) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const loan: any = await CashvibeLoan.findOne({ id: payment.loanId }).lean();

    const pdfBytes = await generatePaymentReceiptPdf(payment, loan);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Recibo-${payment.receiptNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar PDF do recibo:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao gerar PDF de recibo', details: error.message },
      { status: 500 }
    );
  }
}

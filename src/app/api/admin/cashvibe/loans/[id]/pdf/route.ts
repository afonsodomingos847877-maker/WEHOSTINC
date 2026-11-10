import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import CashvibeLoan from '@/models/CashvibeLoan';
import CashvibeClient from '@/models/CashvibeClient';
import { generateLoanContractPdf } from '@/lib/cashvibePdfGenerator';
import { getCashvibePortalClientId, getSessionUser, isAdminRole } from '@/lib/serverAuth';

// GET /api/admin/cashvibe/loans/[id]/pdf - Baixar PDF do Contrato
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

    const loan: any = await CashvibeLoan.findOne({ id }).lean();
    if (!loan) {
      return NextResponse.json({ success: false, error: 'Empréstimo não encontrado' }, { status: 404 });
    }

    if (!isAdmin && String(loan.clientId) !== portalClientId) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const client: any = await CashvibeClient.findOne({ id: loan.clientId }).lean();

    const pdfBytes = await generateLoanContractPdf(loan, client);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Contrato-Cashvibe-${loan.id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar PDF de contrato:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao gerar PDF de contrato', details: error.message },
      { status: 500 }
    );
  }
}

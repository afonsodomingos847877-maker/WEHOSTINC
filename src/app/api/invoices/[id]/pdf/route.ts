import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import InvoiceModel from '@/lib/models/Invoice';
import UserModel from '@/lib/models/User';
import { generateInvoicePdf } from '@/lib/invoiceGenerator';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Identificar usuário/admin de forma resiliente
    let userEmail = '';
    let isAdmin = false;

    try {
      const session = await getServerSession();
      if (session?.user) {
        userEmail = ((session.user as any)?.email || '').toLowerCase();
        isAdmin = (session.user as any)?.role === 'admin' || (session.user as any)?.role === 'super_admin';
      }
    } catch {}

    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const isSameOrigin = 
      !origin || 
      origin.includes('wehosthere.com') || 
      origin.includes('localhost') || 
      (referer && (referer.includes('wehosthere.com') || referer.includes('localhost')));

    const candidateEmail = req.headers.get('x-user-email')?.toLowerCase()?.trim();
    if (isSameOrigin && candidateEmail) {
      userEmail = candidateEmail;
      const dbUser = await UserModel.findOne({ email: candidateEmail }).lean();
      if (dbUser && (dbUser.role === 'admin' || dbUser.role === 'super_admin' || dbUser.email === 'admin@wehosthere.com')) {
        isAdmin = true;
      }
    }

    if (isSameOrigin && referer && referer.includes('/admin')) {
      isAdmin = true;
    }

    if (!isAdmin && !userEmail) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const invoiceId = params.id;
    const invoice = await InvoiceModel.findOne({ id: invoiceId }).lean();
    
    if (!invoice || Array.isArray(invoice)) {
      return NextResponse.json({ success: false, error: 'Fatura não encontrada' }, { status: 404 });
    }

    // Verificar permissão: admin ou cliente dono da fatura
    if (!isAdmin && invoice.customerEmail?.toLowerCase() !== userEmail) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
    }

    // Gerar PDF
    const pdfBase64 = await generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      invoiceRef: invoice.id,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone,
      issuedAt: invoice.issuedAt,
      servicePeriodStart: invoice.servicePeriodStart,
      servicePeriodEnd: invoice.servicePeriodEnd,
      dueDate: invoice.dueDate,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      items: invoice.items as any,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      total: invoice.total,
      currency: invoice.currency,
      notes: invoice.notes
    });

    // Converter base64 para buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Fatura-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (e) {
    console.error('[API/invoices/pdf] Erro ao gerar PDF:', e);
    return NextResponse.json({ success: false, error: 'Erro ao gerar PDF' }, { status: 500 });
  }
}

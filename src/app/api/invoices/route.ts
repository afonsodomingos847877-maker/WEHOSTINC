import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import InvoiceModel, { IInvoice, InvoiceItem } from '@/lib/models/Invoice';
import UserModel from '@/lib/models/User';
import ManualClientModel from '@/lib/models/ManualClient';

export const dynamic = 'force-dynamic';

// Helper para gerar número de fatura único
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}-${timestamp}-${random}`;
}

// GET - Listar faturas (admin: todas, cliente: apenas as suas)
export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const invoiceId = searchParams.get('id');

    // Verificar se é admin
    const isAdmin = (session.user as any)?.role === 'admin' || (session.user as any)?.role === 'super_admin';

    // Se pedindo uma fatura específica
    if (invoiceId) {
      const invoice = await InvoiceModel.findOne({ id: invoiceId }).lean();
      if (!invoice || Array.isArray(invoice)) {
        return NextResponse.json({ success: false, error: 'Fatura não encontrada' }, { status: 404 });
      }

      // Verificar permissão: admin ou cliente dono da fatura
      const userEmail = (session.user as any)?.email?.toLowerCase();
      
      if (!isAdmin && invoice.customerEmail?.toLowerCase() !== userEmail) {
        return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
      }

      return NextResponse.json({ success: true, invoice });
    }

    // Se cliente normal, filtrar pelas suas faturas
    if (!isAdmin) {
      const userEmail = (session.user as any)?.email?.toLowerCase();
      const invoices = await InvoiceModel.find({ customerEmail: userEmail })
        .sort({ issuedAt: -1 })
        .lean();
      return NextResponse.json({ success: true, invoices: invoices || [] });
    }

    // Admin: pode filtrar por cliente ou ver todas
    if (customerId) {
      const invoices = await InvoiceModel.find({ customerId })
        .sort({ issuedAt: -1 })
        .lean();
      return NextResponse.json({ success: true, invoices: invoices || [] });
    }

    // Admin: todas as faturas
    const invoices = await InvoiceModel.find({})
      .sort({ issuedAt: -1 })
      .lean();
    return NextResponse.json({ success: true, invoices: invoices || [] });
  } catch (e) {
    console.error('[API/invoices] Erro ao buscar faturas:', e);
    return NextResponse.json({ success: false, error: 'Erro ao buscar faturas' }, { status: 500 });
  }
}

// POST - Criar nova fatura (apenas admin)
export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Apenas administradores podem criar faturas' }, { status: 403 });
    }

    const body = await req.json();
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      issuedAt,
      servicePeriodStart,
      servicePeriodEnd,
      dueDate,
      status,
      paymentMethod,
      items,
      notes
    } = body;

    // Validações básicas
    if (!customerId || !customerName || !customerEmail) {
      return NextResponse.json({ success: false, error: 'Cliente é obrigatório' }, { status: 400 });
    }

    if (!issuedAt) {
      return NextResponse.json({ success: false, error: 'Data de emissão é obrigatória' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Pelo menos um item é obrigatório' }, { status: 400 });
    }

    // Validação de consistência do período de prestação
    if (servicePeriodStart && servicePeriodEnd) {
      if (servicePeriodEnd < servicePeriodStart) {
        return NextResponse.json({
          success: false,
          error: 'Data inconsistente: a data de fim do período de prestação não pode ser anterior à data de início.'
        }, { status: 400 });
      }
    }

    // Verificar se o cliente existe (User ou ManualClient)
    const user = await UserModel.findOne({ id: customerId }).lean();
    const manualClient = await ManualClientModel.findOne({ id: customerId }).lean();
    
    if (!user && !manualClient) {
      return NextResponse.json({ success: false, error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Calcular subtotal e total
    let subtotal = 0;
    const validatedItems: InvoiceItem[] = items.map((item: any) => {
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;
      const itemSubtotal = (quantity * unitPrice) - discount;
      subtotal += itemSubtotal;
      
      return {
        service: item.service || 'Serviço',
        description: item.description || '',
        quantity,
        unitPrice,
        discount,
        subtotal: itemSubtotal
      };
    });

    const discount = Number(body.discount) || 0;
    const total = subtotal - discount;

    // Gerar ID e número de fatura
    const id = `INV-${Date.now().toString().slice(-6)}`;
    let invoiceNumber = body.invoiceNumber || generateInvoiceNumber();

    // Verificar se o número de fatura já existe
    const existingInvoice = await InvoiceModel.findOne({ invoiceNumber }).lean();
    if (existingInvoice) {
      // Gerar novo número
      invoiceNumber = generateInvoiceNumber();
    }

    const createdBy = (session.user as any)?.email || 'admin';

    const newInvoice = {
      id,
      invoiceNumber,
      customerId,
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      customerPhone,
      issuedAt,
      servicePeriodStart,
      servicePeriodEnd,
      dueDate,
      paidAt: status === 'paid' ? new Date().toISOString() : undefined,
      status: status || 'draft',
      paymentMethod,
      paymentSource: 'manual',
      items: validatedItems,
      subtotal,
      discount,
      total,
      currency: 'MZN',
      notes,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await InvoiceModel.create(newInvoice);

    return NextResponse.json({ success: true, invoice: newInvoice });
  } catch (e) {
    console.error('[API/invoices] Erro ao criar fatura:', e);
    return NextResponse.json({ success: false, error: 'Erro ao criar fatura' }, { status: 500 });
  }
}

// PUT - Atualizar fatura (apenas admin)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Apenas administradores podem editar faturas' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID da fatura é obrigatório' }, { status: 400 });
    }

    const existingInvoice = await InvoiceModel.findOne({ id }).lean();
    if (!existingInvoice || Array.isArray(existingInvoice)) {
      return NextResponse.json({ success: false, error: 'Fatura não encontrada' }, { status: 404 });
    }

    // Validação de consistência do período de prestação
    const finalStart = updateData.servicePeriodStart !== undefined ? updateData.servicePeriodStart : (existingInvoice as any).servicePeriodStart;
    const finalEnd = updateData.servicePeriodEnd !== undefined ? updateData.servicePeriodEnd : (existingInvoice as any).servicePeriodEnd;
    if (finalStart && finalEnd && finalEnd < finalStart) {
      return NextResponse.json({
        success: false,
        error: 'Data inconsistente: a data de fim do período de prestação não pode ser anterior à data de início.'
      }, { status: 400 });
    }

    // Se items foram atualizados, recalcular subtotal e total
    if (updateData.items && Array.isArray(updateData.items)) {
      let subtotal = 0;
      const validatedItems = updateData.items.map((item: any) => {
        const quantity = Number(item.quantity) || 1;
        const unitPrice = Number(item.unitPrice) || 0;
        const discount = Number(item.discount) || 0;
        const itemSubtotal = (quantity * unitPrice) - discount;
        subtotal += itemSubtotal;
        
        return {
          service: item.service || 'Serviço',
          description: item.description || '',
          quantity,
          unitPrice,
          discount,
          subtotal: itemSubtotal
        };
      });

      updateData.items = validatedItems;
      updateData.subtotal = subtotal;
      updateData.discount = Number(updateData.discount) || 0;
      updateData.total = subtotal - updateData.discount;
    }

    // Se status mudou para paid, definir paidAt
    if (updateData.status === 'paid' && (existingInvoice as any).status !== 'paid') {
      updateData.paidAt = new Date().toISOString();
    }

    updateData.updatedAt = new Date().toISOString();

    const updatedInvoice = await InvoiceModel.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true }
    ).lean();

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (e) {
    console.error('[API/invoices] Erro ao atualizar fatura:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar fatura' }, { status: 500 });
  }
}

// DELETE - Excluir fatura (apenas admin)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Apenas administradores podem excluir faturas' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID da fatura é obrigatório' }, { status: 400 });
    }

    const deletedInvoice = await InvoiceModel.findOneAndDelete({ id }).lean();
    if (!deletedInvoice) {
      return NextResponse.json({ success: false, error: 'Fatura não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Fatura excluída com sucesso' });
  } catch (e) {
    console.error('[API/invoices] Erro ao excluir fatura:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir fatura' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import InvoiceModel, { IInvoice, InvoiceItem } from '@/lib/models/Invoice';
import UserModel from '@/lib/models/User';
import ManualClientModel from '@/lib/models/ManualClient';

export const dynamic = 'force-dynamic';

// Helper para verificar autorização admin/user de forma resiliente
async function getAuthContext(req: Request, body?: any): Promise<{ isAuthenticated: boolean; isAdmin: boolean; email: string }> {
  await connectDB();

  // 1. Tentar ler sessão do NextAuth (Google OAuth)
  try {
    const session = await getServerSession();
    if (session?.user) {
      const email = (session.user as any)?.email?.toLowerCase();
      const role = (session.user as any)?.role;
      if (role === 'admin' || role === 'super_admin') {
        return { isAuthenticated: true, isAdmin: true, email: email || '' };
      }
      if (email) {
        const dbUser = await UserModel.findOne({ email }).lean();
        if (dbUser && (dbUser.role === 'admin' || dbUser.role === 'super_admin' || dbUser.email === 'admin@wehosthere.com')) {
          return { isAuthenticated: true, isAdmin: true, email };
        }
        return { isAuthenticated: true, isAdmin: false, email };
      }
    }
  } catch {}

  // 2. Token interno para chamadas server-side
  const internalSecret = process.env.NEXTAUTH_SECRET || '';
  const authHeader = req.headers.get('x-internal-auth');
  if (internalSecret && authHeader === internalSecret) {
    return { isAuthenticated: true, isAdmin: true, email: 'system@wehosthere.com' };
  }

  // 3. Header do usuário autenticado no cliente (x-user-email) ou body (adminEmail / createdBy)
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const isSameOrigin = 
    !origin || 
    origin.includes('wehosthere.com') || 
    origin.includes('localhost') || 
    (referer && (referer.includes('wehosthere.com') || referer.includes('localhost')));

  const candidateEmail = 
    req.headers.get('x-user-email')?.toLowerCase()?.trim() || 
    body?.adminEmail?.toLowerCase()?.trim() || 
    body?.createdBy?.toLowerCase()?.trim();

  if (isSameOrigin && candidateEmail) {
    const dbUser = await UserModel.findOne({ email: candidateEmail }).lean();
    if (dbUser) {
      const isAdmin = dbUser.role === 'admin' || dbUser.role === 'super_admin' || dbUser.email === 'admin@wehosthere.com';
      return { isAuthenticated: true, isAdmin, email: dbUser.email };
    }
    if (candidateEmail === 'admin@wehosthere.com') {
      return { isAuthenticated: true, isAdmin: true, email: candidateEmail };
    }
  }

  // 4. Se a chamada é same-origin da área de administração (/admin)
  if (isSameOrigin && referer && referer.includes('/admin')) {
    return { isAuthenticated: true, isAdmin: true, email: candidateEmail || 'admin@wehosthere.com' };
  }

  return { isAuthenticated: false, isAdmin: false, email: '' };
}

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
    const authCtx = await getAuthContext(req);
    if (!authCtx.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const invoiceId = searchParams.get('id');

    // Se pedindo uma fatura específica
    if (invoiceId) {
      const invoice = await InvoiceModel.findOne({ id: invoiceId }).lean();
      if (!invoice || Array.isArray(invoice)) {
        return NextResponse.json({ success: false, error: 'Fatura não encontrada' }, { status: 404 });
      }

      // Verificar permissão: admin ou cliente dono da fatura
      if (!authCtx.isAdmin && invoice.customerEmail?.toLowerCase() !== authCtx.email) {
        return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
      }

      return NextResponse.json({ success: true, invoice });
    }

    // Se cliente normal, filtrar pelas suas faturas
    if (!authCtx.isAdmin) {
      const invoices = await InvoiceModel.find({ customerEmail: authCtx.email })
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
    const body = await req.json();
    const authCtx = await getAuthContext(req, body);
    if (!authCtx.isAdmin) {
      return NextResponse.json({ success: false, error: 'Apenas administradores podem criar faturas' }, { status: 403 });
    }

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

    const createdBy = authCtx.email || 'admin';

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
    const body = await req.json();
    const authCtx = await getAuthContext(req, body);
    if (!authCtx.isAdmin) {
      return NextResponse.json({ success: false, error: 'Apenas administradores podem editar faturas' }, { status: 403 });
    }

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
    const authCtx = await getAuthContext(req);
    if (!authCtx.isAdmin) {
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

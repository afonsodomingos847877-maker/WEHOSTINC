import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import CashvibeClient from '@/models/CashvibeClient';
import CashvibeLoan from '@/models/CashvibeLoan';

// GET /api/admin/cashvibe/clients - Listar todos os clientes
export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || '';

    const filter: Record<string, any> = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { documentNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const clients = await CashvibeClient.find(filter).sort({ createdAt: -1 }).lean();

    // Buscar empréstimos ativos para cada cliente para enriquecer o payload
    const clientIds = clients.map((c: any) => c.id);
    const loans = await CashvibeLoan.find({ clientId: { $in: clientIds } }).lean();

    const enrichedClients = clients.map((client: any) => {
      const clientLoans = loans.filter((l: any) => l.clientId === client.id);
      const activeLoans = clientLoans.filter((l: any) => ['active', 'overdue'].includes(l.status));
      const totalBorrowed = clientLoans.reduce((sum: number, l: any) => sum + (l.principalAmount || 0), 0);
      const totalDebt = activeLoans.reduce((sum: number, l: any) => sum + (l.totalRemaining || 0), 0);
      const hasOverdue = clientLoans.some((l: any) => l.status === 'overdue');

      return {
        ...client,
        totalLoansCount: clientLoans.length,
        activeLoansCount: activeLoans.length,
        totalBorrowed,
        totalDebt,
        hasOverdue,
      };
    });

    return NextResponse.json({ success: true, clients: enrichedClients });
  } catch (error: any) {
    console.error('Erro ao buscar clientes Cashvibe:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao buscar clientes', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/cashvibe/clients - Cadastrar novo cliente
export async function POST(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const body = await request.json();

    const {
      name,
      documentType = 'BI',
      documentNumber,
      phone,
      secondaryPhone,
      email,
      address,
      occupation,
      workplace,
      monthlyIncome,
      guarantor,
      collateralDescription,
      rating = 'A',
      notes,
    } = body;

    if (!name || !phone || !documentNumber) {
      return NextResponse.json(
        { success: false, error: 'Nome, documento e telefone são obrigatórios.' },
        { status: 400 }
      );
    }

    // Gerar ID sequencial / único
    const count = await CashvibeClient.countDocuments();
    const year = new Date().getFullYear();
    const id = `CLI-${year}-${String(count + 1).padStart(4, '0')}`;

    const newClient = await CashvibeClient.create({
      id,
      name,
      documentType,
      documentNumber,
      phone,
      secondaryPhone,
      email,
      address: address || { province: 'Maputo', city: 'Maputo', neighborhood: '', street: '' },
      occupation,
      workplace,
      monthlyIncome: Number(monthlyIncome) || 0,
      guarantor: guarantor || { name: '', phone: '', relationship: '', documentNumber: '' },
      collateralDescription,
      biPhotoUrl: body.biPhotoUrl || '',
      collateralPhotoUrl: body.collateralPhotoUrl || '',
      rating,
      notes,
      status: 'active',
    });

    return NextResponse.json({ success: true, client: newClient }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar cliente Cashvibe:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao registrar cliente', details: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import { SiteQuoteLead } from '@/models/SiteQuoteLead';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
    const filterStatus = searchParams.get('status') || 'all'; // all | new | contacted | negotiating | closed | lost
    const filterChannel = searchParams.get('channel') || 'all'; // all | whatsapp_quote | checkout_started | checkout_completed
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const isExport = searchParams.get('export') === 'true';

    const query: any = {};

    if (filterStatus !== 'all') query.status = filterStatus;
    if (filterChannel !== 'all') query.channel = filterChannel;
    if (q) {
      query.$or = [
        { projectName: { $regex: q, $options: 'i' } },
        { domain: { $regex: q, $options: 'i' } },
        { userName: { $regex: q, $options: 'i' } },
        { userEmail: { $regex: q, $options: 'i' } },
        { userPhone: { $regex: q, $options: 'i' } },
      ];
    }

    const sortOrder: any = { [sortBy]: -1 };
    const effectiveLimit = isExport ? 2000 : limit;
    const skip = isExport ? 0 : (page - 1) * limit;

    const [leads, total] = await Promise.all([
      SiteQuoteLead.find(query).sort(sortOrder).skip(skip).limit(effectiveLimit).lean(),
      SiteQuoteLead.countDocuments(query),
    ]);

    // Estatísticas gerais
    const [
      totalQuotes,
      totalWhatsApp,
      totalCheckoutStarted,
      totalClosed,
      pipelineValueResult,
    ] = await Promise.all([
      SiteQuoteLead.countDocuments({}),
      SiteQuoteLead.countDocuments({ channel: 'whatsapp_quote' }),
      SiteQuoteLead.countDocuments({ channel: 'checkout_started' }),
      SiteQuoteLead.countDocuments({ channel: 'checkout_completed' }),
      SiteQuoteLead.aggregate([
        { $match: { status: { $ne: 'lost' } } },
        { $group: { _id: null, totalValue: { $sum: '$basePrice' } } },
      ]),
    ]);

    const pipelineValue = pipelineValueResult[0]?.totalValue || 0;

    return NextResponse.json({
      leads,
      pagination: {
        page: isExport ? 1 : page,
        limit: effectiveLimit,
        total,
        totalPages: Math.ceil(total / effectiveLimit),
      },
      stats: {
        totalQuotes,
        totalWhatsApp,
        totalCheckoutStarted,
        totalClosed,
        pipelineValue,
      },
    });
  } catch (error: any) {
    console.error('[AdminSiteQuotes] Erro ao carregar cotações:', error);
    return NextResponse.json({ error: 'Erro ao carregar cotações de sites.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do lead é obrigatório' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await SiteQuoteLead.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!updated) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    console.error('[AdminSiteQuotes] Erro ao atualizar lead:', error);
    return NextResponse.json({ error: 'Erro ao atualizar lead' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await SiteQuoteLead.findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: 'Lead removido' });
    } else {
      await SiteQuoteLead.deleteMany({});
      return NextResponse.json({ success: true, message: 'Todos os registos de cotações foram limpos' });
    }
  } catch (error: any) {
    console.error('[AdminSiteQuotes] Erro ao remover lead:', error);
    return NextResponse.json({ error: 'Erro ao remover lead' }, { status: 500 });
  }
}

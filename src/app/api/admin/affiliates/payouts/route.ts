import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import Commission from '@/lib/models/Commission';

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status) {
      query.payoutStatus = status;
    }

    // Find affiliates with pending payouts
    const affiliates = await Affiliate.find({
      $or: [
        { payoutStatus: { $exists: true } },
        { availableBalance: { $gte: 1000 } }
      ]
    }).sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true, 
      affiliates 
    });

  } catch (error) {
    console.error('Erro ao buscar saques:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar saques' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const body = await request.json();
    const { affiliateId, payoutStatus, payoutNotes } = body;

    if (!affiliateId || !payoutStatus) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID do afiliado e status são obrigatórios' 
      }, { status: 400 });
    }

    // Find affiliate
    const affiliate = await Affiliate.findById(affiliateId);
    if (!affiliate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Afiliado não encontrado' 
      }, { status: 404 });
    }

    // Update payout status
    affiliate.payoutStatus = payoutStatus;
    affiliate.payoutNotes = payoutNotes;
    affiliate.payoutProcessedAt = new Date().toISOString();
    await affiliate.save();

    // If approved, mark commissions as paid
    if (payoutStatus === 'approved') {
      await Commission.updateMany(
        { 
          affiliateId: affiliate.userId,
          status: 'paid'
        },
        {
          $push: {
            statusHistory: {
              status: 'paid',
              changedAt: new Date().toISOString(),
              changedBy: 'admin',
              note: 'Saque processado pelo admin'
            }
          }
        }
      );
    }

    return NextResponse.json({ 
      success: true, 
      affiliate 
    });

  } catch (error) {
    console.error('Erro ao processar saque:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao processar saque' 
    }, { status: 500 });
  }
}

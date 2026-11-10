import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import Commission from '@/lib/models/Commission';
import Affiliate from '@/lib/models/Affiliate';
import User from '@/lib/models/User';
import { dispatchMessage } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const affiliateId = searchParams.get('affiliateId');

    const query: any = {};
    if (status) query.status = status;
    if (affiliateId) query.affiliateId = affiliateId;

    const commissions = await Commission.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ 
      success: true, 
      commissions
    });

  } catch (error) {
    console.error('Erro ao buscar comissões:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar comissões' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const body = await request.json();
    const { commissionId, status, note, changedBy } = body;

    if (!commissionId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'commissionId e status são obrigatórios' 
      }, { status: 400 });
    }

    const commission = await Commission.findById(commissionId);
    if (!commission) {
      return NextResponse.json({ success: false, error: 'Comissão não encontrada' }, { status: 404 });
    }

    // Update status
    commission.status = status;
    commission.statusHistory.push({
      status,
      changedAt: new Date().toISOString(),
      changedBy,
      note,
    });

    if (status === 'approved') {
      commission.approvedAt = new Date().toISOString();
    } else if (status === 'paid') {
      commission.paidAt = new Date().toISOString();
    }

    await commission.save();

    // Update affiliate balance if approved
    if (status === 'approved') {
      const Affiliate = (await import('@/lib/models/Affiliate')).default;
      await Affiliate.findByIdAndUpdate(
        commission.affiliateId,
        {
          $inc: { 
            availableBalance: commission.commissionAmount,
            totalEarnings: commission.commissionAmount,
            totalConversions: 1
          }
        }
      );

      // Send email notification to affiliate about approved commission
      const affiliate = await Affiliate.findById(commission.affiliateId);
      const affiliateUser = await User.findOne({ id: commission.affiliateId });
      
      if (affiliate && affiliateUser) {
        await dispatchMessage({
          recipientEmail: affiliateUser.email,
          recipientName: affiliateUser.name,
          templateId: 'affiliate-commission-approved',
          variables: {
            nome_afiliado: affiliateUser.name,
            valor_comissao: commission.commissionAmount.toFixed(2),
            saldo_disponivel: affiliate.availableBalance.toFixed(2),
            numero_pedido: commission.orderId,
            data_aprovacao: new Date().toLocaleDateString('pt-MZ'),
          },
          isAutomatic: true,
          eventType: 'affiliate_commission_approved'
        });
      }
    }

    return NextResponse.json({ success: true, commission });

  } catch (error) {
    console.error('Erro ao atualizar comissão:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar comissão' }, { status: 500 });
  }
}

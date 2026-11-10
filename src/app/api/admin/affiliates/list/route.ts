import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import Commission from '@/lib/models/Commission';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status) query.status = status;

    const affiliates = await Affiliate.find(query).sort({ createdAt: -1 });

    // Get user details for each affiliate
    const affiliatesWithUsers = await Promise.all(
      affiliates.map(async (affiliate) => {
        const user = await User.findOne({ id: affiliate.userId });
        const commissions = await Commission.find({ affiliateId: affiliate.userId });
        
        return {
          ...affiliate.toObject(),
          userName: user?.name || 'N/A',
          userEmail: user?.email || 'N/A',
          totalCommissions: commissions.length,
          pendingCommissions: commissions.filter(c => c.status === 'pending').length,
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      affiliates: affiliatesWithUsers
    });

  } catch (error) {
    console.error('Erro ao buscar afiliados:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar afiliados' 
    }, { status: 500 });
  }
}

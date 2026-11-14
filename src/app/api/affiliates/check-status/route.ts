import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request).catch(() => null);

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        isAffiliate: false,
      });
    }

    await connectDB();

    // Verificar se o utilizador autenticado já é afiliado
    const affiliate = await Affiliate.findOne({
      $or: [
        { userId: user.id },
        { userId: user.email.toLowerCase() },
      ],
      status: { $in: ['active', 'pending'] },
    }).select('affiliateCode status');

    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      email: user.email,
      name: user.name || '',
      isAffiliate: !!affiliate,
      affiliateStatus: affiliate?.status || null,
      affiliateCode: affiliate?.affiliateCode || null,
    });
  } catch (error) {
    console.error('[Affiliate Check-Status Error]:', error);
    return NextResponse.json({
      authenticated: false,
      isAffiliate: false,
    });
  }
}

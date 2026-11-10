import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import Affiliate from '@/lib/models/Affiliate';
import Commission from '@/lib/models/Commission';
import AffiliateClick from '@/lib/models/AffiliateClick';

export async function POST(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    console.log('Iniciando reset de registros de afiliados...');
    await connectDB();

    // Contar registros antes de apagar
    const affiliateCount = await Affiliate.countDocuments();
    const commissionCount = await Commission.countDocuments();
    const clickCount = await AffiliateClick.countDocuments();

    console.log(`Registros encontrados: ${affiliateCount} afiliados, ${commissionCount} comissões, ${clickCount} cliques`);

    // Apagar todos os registros relacionados a afiliados
    await Affiliate.deleteMany({});
    await Commission.deleteMany({});
    await AffiliateClick.deleteMany({});

    console.log('Registros de afiliados apagados com sucesso');

    return NextResponse.json({ 
      success: true, 
      message: 'Registros de afiliados apagados com sucesso',
      stats: {
        deletedAffiliates: affiliateCount,
        deletedCommissions: commissionCount,
        deletedClicks: clickCount
      }
    });

  } catch (error) {
    console.error('Erro ao apagar registros de afiliados:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao apagar registros de afiliados' 
    }, { status: 500 });
  }
}

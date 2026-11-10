import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { 
  validateAffiliateConsistency, 
  validateAllAffiliatesConsistency,
  runAutomaticConsistencyCheck 
} from '@/lib/affiliateConsistency';
import affiliateAlertManager from '@/lib/affiliateAlerts';

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('affiliateId');
    const mode = searchParams.get('mode') || 'single'; // 'single' | 'all' | 'auto'

    if (mode === 'auto') {
      // Executa validação automática e corrige problemas
      const result = await runAutomaticConsistencyCheck();
      
      // Processar alertas automaticamente
      await affiliateAlertManager.processConsistencyReport(result);
      
      return NextResponse.json({ 
        success: true, 
        mode: 'automatic',
        result
      });
    }

    if (mode === 'all') {
      // Valida todos os afiliados
      const result = await validateAllAffiliatesConsistency();
      
      // Processar alertas automaticamente
      await affiliateAlertManager.processConsistencyReport(result);
      
      return NextResponse.json({ 
        success: true, 
        mode: 'all',
        result
      });
    }

    // Valida um afiliado específico (default)
    if (!affiliateId) {
      return NextResponse.json({ 
        success: false, 
        error: 'affiliateId é obrigatório para validação individual' 
      }, { status: 400 });
    }

    const report = await validateAffiliateConsistency(affiliateId);
    
    return NextResponse.json({ 
      success: true, 
      mode: 'single',
      report
    });

  } catch (error) {
    console.error('Erro ao validar consistência:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao validar consistência' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    const body = await request.json();
    const { affiliateId, commissionId } = body;

    if (commissionId) {
      // Validar comissão específica
      const { validateCommissionConsistency } = await import('@/lib/affiliateConsistency');
      const result = await validateCommissionConsistency(commissionId);
      
      return NextResponse.json({ 
        success: true, 
        type: 'commission',
        result
      });
    }

    if (affiliateId) {
      // Validar afiliado específico
      const report = await validateAffiliateConsistency(affiliateId);
      
      return NextResponse.json({ 
        success: true, 
        type: 'affiliate',
        report
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'affiliateId ou commissionId é obrigatório' 
    }, { status: 400 });

  } catch (error) {
    console.error('Erro ao validar consistência:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao validar consistência' 
    }, { status: 500 });
  }
}

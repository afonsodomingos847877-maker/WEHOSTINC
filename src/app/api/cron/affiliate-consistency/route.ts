// API endpoint para validação automática de consistência via cron job
// Pode ser configurado em Vercel Cron Jobs ou outros serviços de agendamento

import { NextRequest, NextResponse } from 'next/server';
import { runAutomaticConsistencyCheck } from '@/lib/affiliateConsistency';
import { requireCronSecret } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
  const cronAuthError = requireCronSecret(request);
  if (cronAuthError) return cronAuthError;

  try {

    console.log('[Cron] Iniciando validação automática de consistência de afiliados');
    
    const result = await runAutomaticConsistencyCheck();
    
    console.log('[Cron] Validação concluída:', result);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Validação de consistência concluída com sucesso',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Cron] Erro na validação automática:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro na validação automática' 
    }, { status: 500 });
  }
}

// Método POST para disparar validação manualmente (para testes)
export async function POST(request: NextRequest) {
  const cronAuthError = requireCronSecret(request);
  if (cronAuthError) return cronAuthError;

  try {

    console.log('[Cron] Disparando validação manual de consistência');
    
    const result = await runAutomaticConsistencyCheck();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Validação manual concluída com sucesso',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Cron] Erro na validação manual:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro na validação manual' 
    }, { status: 500 });
  }
}

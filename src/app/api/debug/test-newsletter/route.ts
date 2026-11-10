import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import NewsletterModel from '@/lib/models/Newsletter';
import { blockInProduction } from '@/lib/serverAuth';

export async function GET(req: Request) {
  const blocked = blockInProduction();
  if (blocked) return blocked;
  try {
    console.log('[Test Newsletter] Iniciando teste...');
    
    // Test 1: Conexão MongoDB
    console.log('[Test Newsletter] Testando conexão MongoDB...');
    await connectDB();
    console.log('[Test Newsletter] ✅ MongoDB conectado');
    
    // Test 2: Verificar modelo
    console.log('[Test Newsletter] Verificando modelo Newsletter...');
    if (!NewsletterModel) {
      console.error('[Test Newsletter] ❌ NewsletterModel não definido');
      return NextResponse.json({ 
        success: false, 
        error: 'NewsletterModel não definido' 
      });
    }
    console.log('[Test Newsletter] ✅ NewsletterModel disponível');
    
    // Test 3: Criar subscrição de teste
    console.log('[Test Newsletter] Tentando criar subscrição de teste...');
    const testEmail = `test-${Date.now()}@wehosthere.com`;
    const testSubscription = await NewsletterModel.create({
      email: testEmail,
      name: 'Test User',
      source: 'popup',
      status: 'active'
    });
    console.log('[Test Newsletter] ✅ Subscrição criada:', testSubscription._id);
    
    // Test 4: Buscar subscrição
    console.log('[Test Newsletter] Buscando subscrição criada...');
    const found = await NewsletterModel.findOne({ email: testEmail });
    console.log('[Test Newsletter] ✅ Subscrição encontrada:', found ? 'Sim' : 'Não');
    
    // Test 5: Limpar teste
    console.log('[Test Newsletter] Removendo subscrição de teste...');
    await NewsletterModel.deleteOne({ email: testEmail });
    console.log('[Test Newsletter] ✅ Subscrição removida');
    
    return NextResponse.json({
      success: true,
      message: 'Todos os testes passaram com sucesso',
      tests: {
        mongodb: '✅ Conectado',
        model: '✅ Disponível',
        create: '✅ Funcionando',
        read: '✅ Funcionando',
        delete: '✅ Funcionando'
      }
    });
    
  } catch (error: any) {
    console.error('[Test Newsletter] ❌ Erro:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

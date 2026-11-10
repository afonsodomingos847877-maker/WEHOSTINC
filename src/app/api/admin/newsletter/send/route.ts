import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import { sendNewsletterEmail } from '@/lib/sendgrid';

export async function POST(req: Request) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    console.log('[Admin Newsletter Send] ========== INICIANDO ENVIO ==========');
    console.log('[Admin Newsletter Send] Timestamp:', new Date().toISOString());
    
    const body = await req.json();
    const { subject, content } = body;

    console.log('[Admin Newsletter Send] Dados recebidos:', { 
      subject: subject?.substring(0, 50) + '...', 
      contentLength: content?.length 
    });

    if (!subject || !content) {
      console.log('[Admin Newsletter Send] Dados inválidos');
      return NextResponse.json({ error: 'Assunto e conteúdo são obrigatórios.' }, { status: 400 });
    }

    console.log('[Admin Newsletter Send] Conectando ao MongoDB...');
    await connectDB();
    console.log('[Admin Newsletter Send] ✅ MongoDB conectado');

    // Importar modelo dinamicamente
    console.log('[Admin Newsletter Send] Importando modelo Newsletter...');
    const NewsletterModel = (await import('@/lib/models/Newsletter')).default;
    console.log('[Admin Newsletter Send] ✅ Modelo importado');

    // Buscar todos os subscritores ativos
    console.log('[Admin Newsletter Send] Buscando subscritores ativos...');
    const subscribers = await NewsletterModel.find({ status: 'active' }).lean();
    console.log('[Admin Newsletter Send] Subscritores encontrados:', subscribers.length);

    if (subscribers.length === 0) {
      console.log('[Admin Newsletter Send] Nenhum subscritor ativo');
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhum subscritor ativo encontrado.',
        sent: 0
      });
    }

    // Enviar newsletter para cada subscritor
    console.log('[Admin Newsletter Send] Iniciando envio para', subscribers.length, 'subscritores...');
    const results = await Promise.allSettled(
      subscribers.map(async (subscriber) => {
        const unsubscribeUrl = `${process.env.NEXTAUTH_URL || 'https://wehosthere.com'}/api/newsletter/unsubscribe?email=${subscriber.email}`;
        
        try {
          console.log('[Admin Newsletter Send] Enviando para:', subscriber.email);
          await sendNewsletterEmail(
            subscriber.email,
            subject,
            content,
            unsubscribeUrl
          );
          console.log('[Admin Newsletter Send] ✅ Enviado para:', subscriber.email);
          return { email: subscriber.email, success: true };
        } catch (error) {
          console.error(`[Admin Newsletter Send] ❌ Erro ao enviar para ${subscriber.email}:`, error);
          return { email: subscriber.email, success: false, error: String(error) };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    console.log('[Admin Newsletter Send] ========== RESULTADO ==========');
    console.log('[Admin Newsletter Send] Total:', subscribers.length);
    console.log('[Admin Newsletter Send] Sucesso:', successful);
    console.log('[Admin Newsletter Send] Falhas:', failed);

    return NextResponse.json({ 
      success: true, 
      message: `Newsletter enviada para ${successful} subscritores. ${failed} falharam.`,
      sent: successful,
      failed,
      total: subscribers.length
    });

  } catch (error) {
    console.error('[Admin Newsletter Send] ❌ ERRO:', error);
    return NextResponse.json({ 
      error: 'Erro ao enviar newsletter.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    // Importar modelo dinamicamente
    const NewsletterModel = (await import('@/lib/models/Newsletter')).default;
    
    const subscribers = await NewsletterModel.find({}).sort({ subscribedAt: -1 }).lean();
    
    return NextResponse.json({ 
      success: true, 
      subscribers: subscribers.map((s: any) => ({
        email: s.email,
        name: s.name,
        status: s.status,
        subscribedAt: s.subscribedAt,
        unsubscribedAt: s.unsubscribedAt,
        source: s.source
      }))
    });

  } catch (error) {
    console.error('[Admin Newsletter List] Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao listar subscritores.' 
    }, { status: 500 });
  }
}

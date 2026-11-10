import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { sendPushToAdmins } from '@/lib/pushService';

export async function POST(req: Request) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    const result = await sendPushToAdmins({
      title: '🔔 Teste de Notificação Móvel',
      message: 'Excelente! O seu telemóvel está configurado para receber alertas em tempo real da WEHOSTHERE.',
      url: '/admin?tab=orders',
      tag: 'test-push'
    });

    return NextResponse.json({
      success: true,
      message: 'Notificação de teste enviada!',
      details: result
    });
  } catch (error) {
    console.error('[Admin Push Test] Erro:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

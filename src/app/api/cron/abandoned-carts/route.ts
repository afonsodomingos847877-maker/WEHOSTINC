import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';
import { dispatchMessage } from '@/lib/notifications';
import { requireCronSecret } from '@/lib/serverAuth';

// Vercel Cron will hit this route using GET
export async function GET(req: Request) {
  const cronAuthError = requireCronSecret(req);
  if (cronAuthError) return cronAuthError;

  try {

    await connectDB();

    // Find orders that are:
    // 1. Pending
    // 2. Older than 2 hours
    // 3. Not older than 24 hours
    // 4. Have not received a recovery email yet
    
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const abandonedOrders = await OrderModel.find({
      status: 'pending',
      createdAt: { $lte: twoHoursAgo, $gte: twentyFourHoursAgo },
      $or: [{ cartRecoverySent: false }, { cartRecoverySent: { $exists: false } }]
    });

    console.log(`[Cron] Encontrados ${abandonedOrders.length} carrinhos abandonados.`);

    let sentCount = 0;

    for (const order of abandonedOrders) {
      if (order.clientEmail) {
        try {
          await dispatchMessage({
            recipientEmail: order.clientEmail,
            recipientName: order.clientName,
            templateId: 'abandoned-cart',
            variables: {
              numero_pedido: order.id,
              valor: `${Number(order.amount).toLocaleString('pt-MZ')} MT`
            },
            isAutomatic: true,
            eventType: 'abandoned_cart_recovery'
          });

          // Mark as sent
          order.cartRecoverySent = true;
          await order.save();
          sentCount++;
          
        } catch (err) {
          console.error(`[Cron] Erro ao enviar recuperação para o pedido ${order.id}:`, err);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Recuperação processada. E-mails enviados: ${sentCount} de ${abandonedOrders.length}` 
    });

  } catch (error) {
    console.error('[Cron] Erro no job de carrinhos abandonados:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

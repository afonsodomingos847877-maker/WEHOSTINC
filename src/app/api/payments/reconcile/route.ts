import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';
import { kivora } from '@/lib/kivora';
import { requireAdmin, requireCronSecret } from '@/lib/serverAuth';

// Sistema de reconciliação de pagamentos
// Verifica pagamentos M-Pesa/eMola pendentes e reconcilia via Kivora

export async function POST(req: Request) {
  const cronDenied = requireCronSecret(req);
  if (cronDenied) {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;
  }

  try {
    console.log('[PAYMENT RECONCILIATION] Iniciando reconciliação de pagamentos');

    await connectDB();

    // Buscar pedidos pendentes M-Pesa/eMola que já têm ID Kivora associado
    const pendingOrders = await OrderModel.find({
      status: { $in: ['pending', 'in_progress'] },
      kivoraPaymentId: { $exists: true, $ne: '' },
      paymentMethod: { $in: ['mpesa', 'emola'] }
    }).lean();

    console.log(`[PAYMENT RECONCILIATION] Encontrados ${pendingOrders.length} pedidos M-Pesa/eMola pendentes com ID Kivora`);

    let reconciledCount = 0;
    let failedCount = 0;
    const results: any[] = [];

    for (const order of pendingOrders) {
      try {
        const paymentId = (order as any).kivoraPaymentId as string;
        console.log(`[PAYMENT RECONCILIATION] Verificando pedido ${order.id} com Kivora paymentId: ${paymentId}`);

        // Consultar status real do pagamento na Kivora
        const paymentStatus = await kivora.getC2BPayment(paymentId);
        console.log(`[PAYMENT RECONCILIATION] Status Kivora para ${paymentId}:`, paymentStatus.status);

        if (paymentStatus.status === 'paid' && order.status !== 'completed') {
          console.log(`[PAYMENT RECONCILIATION] Reconciliando pedido ${order.id} — pagamento confirmado na Kivora`);

          await OrderModel.findOneAndUpdate({ id: order.id }, { status: 'completed' });

          if ((order as any).clientEmail) {
            await sendReconciliationNotification(
              (order as any).clientEmail,
              (order as any).clientName || 'Cliente',
              (order as any).serviceName || 'Serviço',
              (order as any).amount || 0,
              order.id
            );
          }

          reconciledCount++;
          results.push({
            orderId: order.id,
            kivoraPaymentId: paymentId,
            previousStatus: order.status,
            newStatus: 'completed',
            reconciled: true
          });

        } else if (paymentStatus.status === 'failed' && order.status !== 'cancelled') {
          console.log(`[PAYMENT RECONCILIATION] Cancelando pedido ${order.id} — pagamento falhou na Kivora`);

          await OrderModel.findOneAndUpdate({ id: order.id }, { status: 'cancelled' });

          failedCount++;
          results.push({
            orderId: order.id,
            kivoraPaymentId: paymentId,
            previousStatus: order.status,
            newStatus: 'cancelled',
            reconciled: true
          });

        } else {
          console.log(`[PAYMENT RECONCILIATION] Pedido ${order.id} sem alteração — Kivora: ${paymentStatus.status}, local: ${order.status}`);
          results.push({
            orderId: order.id,
            kivoraPaymentId: paymentId,
            kivoraStatus: paymentStatus.status,
            localStatus: order.status,
            reconciled: false,
            reason: 'No status change needed'
          });
        }
      } catch (error) {
        console.error(`[PAYMENT RECONCILIATION] Erro ao reconciliar pedido ${order.id}:`, error);
        results.push({
          orderId: order.id,
          reconciled: false,
          reason: 'Error during reconciliation',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`[PAYMENT RECONCILIATION] Concluído: ${reconciledCount} reconciliados, ${failedCount} falhados`);

    return NextResponse.json({
      success: true,
      totalChecked: pendingOrders.length,
      reconciled: reconciledCount,
      failed: failedCount,
      results
    });

  } catch (error) {
    console.error('[PAYMENT RECONCILIATION] Erro na reconciliação:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// Notificação de reconciliação automática ao cliente
async function sendReconciliationNotification(
  email: string,
  clientName: string,
  serviceName: string,
  amount: number,
  reference: string
) {
  try {
    const subject = 'Pagamento Confirmado - WEHOSTHERE (Reconciliação Automática)';
    const message = `Olá ${clientName},\n\nO seu pagamento de ${amount} MZN para "${serviceName}" foi confirmado automaticamente pelo nosso sistema.\n\nReferência: ${reference}\n\nO seu pedido está sendo processado.\n\nObrigado pela preferência!\nEquipe WEHOSTHERE`;

    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email, subject, text: message })
    });

    console.log(`[PAYMENT RECONCILIATION] Notificação enviada para ${email}`);
  } catch (error) {
    console.error('[PAYMENT RECONCILIATION] Erro ao enviar notificação:', error);
  }
}

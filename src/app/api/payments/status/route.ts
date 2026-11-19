import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';

export const dynamic = 'force-dynamic';

function mapKivoraStatus(rawStatus?: string): 'completed' | 'cancelled' | 'pending' {
  const s = String(rawStatus || '').toLowerCase().trim();
  if (s === 'paid' || s === 'completed' || s === 'success' || s === 'succeeded') {
    return 'completed';
  }
  if (s === 'failed' || s === 'cancelled' || s === 'canceled' || s === 'rejected' || s === 'expired') {
    return 'cancelled';
  }
  return 'pending';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const reference = searchParams.get('reference');
    const kivoraPaymentIdParam = searchParams.get('kivoraPaymentId');

    if (!orderId && !reference && !kivoraPaymentIdParam) {
      return NextResponse.json(
        { error: 'orderId, reference ou kivoraPaymentId é obrigatório' },
        { status: 400 }
      );
    }

    await connectDB();

    const queryConditions: any[] = [];

    if (orderId) {
      queryConditions.push({ id: orderId });
    }

    if (kivoraPaymentIdParam) {
      queryConditions.push({ kivoraPaymentId: kivoraPaymentIdParam });
    }

    if (reference) {
      queryConditions.push({ reference });
      queryConditions.push({ kivoraPaymentId: reference });
      const cleanRef = reference.replace(/^REF_|^ORDER_/i, '').trim();
      if (cleanRef && cleanRef !== reference && /^[a-zA-Z0-9_-]{3,64}$/.test(cleanRef)) {
        const escapedRef = cleanRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        queryConditions.push({ reference: { $regex: new RegExp(escapedRef, 'i') } });
        queryConditions.push({ id: { $regex: new RegExp(escapedRef, 'i') } });
      }
    }

    const order: any =
      queryConditions.length > 0
        ? await OrderModel.findOne({ $or: queryConditions }).lean()
        : null;

    const effectiveKivoraId = order?.kivoraPaymentId || kivoraPaymentIdParam || null;

    // Se o pedido ainda não existe no MongoDB ou ainda está pending, consultar a Kivora diretamente em tempo real
    if ((!order || order.status === 'pending') && effectiveKivoraId) {
      try {
        const { kivora } = await import('@/lib/kivora');
        const liveKivora = await kivora.getC2BPayment(effectiveKivoraId);
        if (liveKivora) {
          const mapped = mapKivoraStatus(liveKivora.status);
          if (mapped === 'completed') {
            if (order?.id) {
              await OrderModel.findOneAndUpdate(
                { id: order.id },
                {
                  status: 'completed',
                  valorFaturado: order.amount || liveKivora.amount || 0,
                  valorPorFaturar: 0,
                  paidAt: new Date().toISOString(),
                }
              );
              order.status = 'completed';
            } else {
              return NextResponse.json({
                orderId: orderId || reference || effectiveKivoraId,
                reference: reference || liveKivora.reference || effectiveKivoraId,
                status: 'completed',
                failureReason: null,
                amount: liveKivora.amount,
                paymentMethod: 'mpesa',
                createdAt: liveKivora.createdAt || new Date().toISOString(),
              });
            }
          } else if (mapped === 'cancelled') {
            if (order?.id) {
              await OrderModel.findOneAndUpdate({ id: order.id }, { status: 'cancelled' });
              order.status = 'cancelled';
            } else {
              return NextResponse.json({
                orderId: orderId || reference || effectiveKivoraId,
                reference: reference || liveKivora.reference || effectiveKivoraId,
                status: 'cancelled',
                failureReason: 'Pagamento recusado ou cancelado no telemóvel',
                amount: liveKivora.amount,
                paymentMethod: 'mpesa',
              });
            }
          }
        }
      } catch (kivoraErr) {
        console.warn('[PAYMENT STATUS] Consulta direta à Kivora falhou (vai tentar novamente):', kivoraErr);
      }
    }

    if (!order) {
      return NextResponse.json({
        orderId: orderId || null,
        reference: reference || effectiveKivoraId || null,
        status: 'pending',
        failureReason: null,
      });
    }

    return NextResponse.json({
      orderId: order.id,
      reference: order.reference,
      status: order.status,
      failureReason: order.failureReason || null,
      amount: order.amount,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error('[PAYMENT STATUS] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar status do pagamento', status: 'pending' },
      { status: 500 }
    );
  }
}

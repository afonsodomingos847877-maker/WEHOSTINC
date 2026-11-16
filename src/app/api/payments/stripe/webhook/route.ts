import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';

function verifyStripeSignature(payload: string, sigHeader: string, secret: string): boolean {
  const parts = sigHeader.split(',').reduce<Record<string, string>>((acc, item) => {
    const [k, v] = item.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    const sigHeader = request.headers.get('stripe-signature') || '';

    if (webhookSecret) {
      if (!sigHeader || !verifyStripeSignature(rawBody, sigHeader, webhookSecret)) {
        return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data?.object;
      const orderRef = session?.client_reference_id || session?.metadata?.orderReference;
      if (orderRef && session?.payment_status === 'paid') {
        try {
          await connectDB();
          await OrderModel.updateOne(
            { reference: orderRef },
            {
              $set: {
                status: 'completed',
                paymentMethod: 'card',
              },
            }
          );
        } catch (dbErr) {
          console.warn('[Stripe Webhook] DB update warning:', dbErr);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json({ error: error?.message || 'Webhook error' }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { blockInProduction } from '@/lib/serverAuth';

export async function POST(request: NextRequest) {
  const blocked = blockInProduction();
  if (blocked) return blocked;
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, email, amount = 5000, planName = 'Plano Pro', items = [] } = body;

    if (!userId && !email) {
      return NextResponse.json({ error: 'User ID or email is required' }, { status: 400 });
    }

    // Buscar usuário por ID ou email
    let user;
    if (userId) {
      user = await User.findById(userId);
    }
    
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase() });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Gerar dados de pedido simulado
    const orderId = `TEST-${Date.now().toString().slice(-5)}`;
    const orderNumber = orderId;
    const timestamp = new Date().toISOString();

    // Enviar notificação de venda
    const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'com://localhost:3000'}/api/notifications/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        orderId,
        orderNumber,
        type: 'new_sale',
        title: '🎉 Nova Venda Realizada (Simulação)',
        message: `Pedido #${orderNumber} confirmado com sucesso. Valor: ${amount.toLocaleString('pt-MZ')} MZN`,
        amount,
        currency: 'MZN',
        items: items.length > 0 ? items : [{
          name: planName,
          quantity: 1,
          price: amount
        }],
        metadata: {
          customerName: user.name || 'Cliente Teste',
          customerEmail: user.email,
          paymentMethod: 'M-Pesa (Simulado)',
          isTest: true
        },
        channels: { email: true, push: true, sms: false }
      })
    });

    const notificationData = await notificationResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Pagamento simulado com sucesso',
      simulationDetails: {
        orderId,
        orderNumber,
        amount,
        currency: 'MZN',
        planName,
        timestamp,
        customerEmail: user.email,
        customerName: user.name
      },
      notification: {
        sent: notificationData.success,
        details: notificationData
      }
    });

  } catch (error) {
    console.error('[Simulate Payment] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

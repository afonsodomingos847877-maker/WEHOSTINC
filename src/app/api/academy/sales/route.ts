import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';
import EnrollmentModel from '@/lib/models/Enrollment';
import { CourseModel } from '@/lib/models/CourseModel';
import { sendCoursePurchaseEmail, sendEmail } from '@/lib/sendgrid';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Filter for course orders
    const query: any = {
      serviceName: { $regex: 'curso', $options: 'i' }
    };

    if (status && status !== 'all') {
      if (status === 'failed') {
        query.status = { $in: ['cancelled', 'suspended', 'failed'] };
      } else {
        query.status = status;
      }
    }

    const orders = await OrderModel.find(query).sort({ createdAt: -1 }).lean();
    const enrollments = await EnrollmentModel.find({}).sort({ enrolledAt: -1 }).lean();

    // Calculate business metrics
    const completedOrders = orders.filter(o => o.status === 'completed');
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'in_progress');
    const failedOrders = orders.filter(o => o.status === 'cancelled' || o.status === 'suspended');

    const totalRevenue = completedOrders.reduce((acc, o) => acc + (o.amount || 0), 0);
    const lostRevenue = failedOrders.reduce((acc, o) => acc + (o.amount || 0), 0);
    const pendingRevenue = pendingOrders.reduce((acc, o) => acc + (o.amount || 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        lostRevenue,
        pendingRevenue,
        completedCount: completedOrders.length,
        pendingCount: pendingOrders.length,
        failedCount: failedOrders.length,
        totalLeads: orders.length
      },
      orders,
      enrollments
    });
  } catch (error: any) {
    console.error('[API Academy Sales GET Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao carregar vendas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, orderId, courseId, price, originalPrice, accessType, reason } = body;

    // Quick Update Course Price
    if (action === 'update_price' && courseId) {
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };
      if (price !== undefined) updateData.price = Number(price);
      if (originalPrice !== undefined) updateData.originalPrice = Number(originalPrice);
      if (accessType) updateData.accessType = accessType;

      const updated = await CourseModel.findOneAndUpdate(
        { id: courseId },
        { $set: updateData },
        { new: true }
      );

      return NextResponse.json({ success: true, course: updated });
    }

    // Manual Approve Order & Generate Enrollment
    if (action === 'manual_approve' && orderId) {
      const order = await OrderModel.findOne({ id: orderId });
      if (!order) {
        return NextResponse.json({ success: false, error: 'Pedido não encontrado' }, { status: 404 });
      }

      order.status = 'completed';
      order.valorFaturado = order.amount;
      order.valorPorFaturar = 0;
      await order.save();

      // Create enrollment
      const cleanTitle = (order.serviceName || '').replace(/^curso:\s*/i, '').trim();
      let enrollment = await EnrollmentModel.findOne({
        studentEmail: order.clientEmail.toLowerCase().trim(),
        courseTitle: { $regex: cleanTitle, $options: 'i' },
        status: 'active'
      });

      let claimToken = enrollment?.claimToken;
      if (!enrollment) {
        claimToken = 'CLM_' + crypto.randomBytes(16).toString('hex');
        enrollment = await EnrollmentModel.create({
          id: 'ENR_' + Date.now().toString().slice(-6) + '_' + Math.floor(100 + Math.random() * 900),
          courseId: 'COURSE_MANUAL',
          courseTitle: cleanTitle || order.serviceName,
          studentEmail: order.clientEmail.toLowerCase().trim(),
          studentName: order.clientName || 'Aluno',
          studentPhone: order.clientPhone || '',
          orderId: order.id,
          paymentReference: order.reference || order.id,
          amountPaid: order.amount || 0,
          paymentMethod: order.paymentMethod || 'mpesa',
          claimToken,
          claimed: false,
          status: 'active',
          enrolledAt: new Date().toISOString()
        });
      }

      // Send email
      try {
        await sendCoursePurchaseEmail(
          order.clientEmail,
          order.clientName,
          order.serviceName,
          order.amount,
          claimToken
        );
      } catch (mailErr) {
        console.warn('Erro ao enviar email de aprovação manual:', mailErr);
      }

      return NextResponse.json({ success: true, order, enrollment });
    }

    // Mark as Cancelled / Failed (for tracking lost sales)
    if (action === 'mark_failed' && orderId) {
      const updated = await OrderModel.findOneAndUpdate(
        { id: orderId },
        { status: 'cancelled' },
        { new: true }
      );
      return NextResponse.json({ success: true, order: updated });
    }

    // Send Recovery Email to Lead
    if (action === 'send_recovery_email' && orderId) {
      const order = await OrderModel.findOne({ id: orderId });
      if (!order) {
        return NextResponse.json({ success: false, error: 'Pedido não encontrado' }, { status: 404 });
      }

      const retryUrl = `https://wehosthere.com/checkout?service=course&name=${encodeURIComponent(order.serviceName)}&amount=${order.amount}&continuePayment=${order.id}`;

      await sendEmail({
        to: order.clientEmail,
        subject: `👋 ${order.clientName}, precisa de ajuda com o seu curso na WEHOSTHERE?`,
        text: `Olá ${order.clientName},\n\nNotámos que tentou adquirir o curso "${order.serviceName}", mas o processo de pagamento não foi concluído.\n\nSe teve alguma dúvida ou problema com o M-Pesa / e-Mola, pode retomar o seu pedido facilmente com o link abaixo:\n${retryUrl}\n\nSe preferir pagar por transferência bancária ou tiver dúvidas, responda diretamente a este e-mail ou fale connosco pelo WhatsApp (+258 84 833 5618).\n\nAtenciosamente,\nEquipa WEHOSTHERE`
      });

      order.cartRecoverySent = true;
      await order.save();

      return NextResponse.json({ success: true, message: 'E-mail de recuperação enviado com sucesso!' });
    }

    return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('[API Academy Sales POST Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao processar ação' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import EnrollmentModel from '@/lib/models/Enrollment';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const courseId = searchParams.get('courseId');
    const orderId = searchParams.get('orderId');

    const filter: any = {};
    if (userId) filter.userId = userId;
    if (email) filter.studentEmail = email.toLowerCase().trim();
    if (courseId) filter.courseId = courseId;
    if (orderId) filter.orderId = orderId;

    const enrollments = await EnrollmentModel.find(filter).sort({ enrolledAt: -1 });
    return NextResponse.json({ success: true, enrollments });
  } catch (error: any) {
    console.error('[API Enrollments GET Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao carregar matrículas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, enrollment, courseId, email, userId } = body;

    // Check specific course enrollment
    if (action === 'check') {
      if (!courseId || (!email && !userId)) {
        return NextResponse.json({ hasAccess: false, reason: 'Parâmetros insuficientes' }, { status: 400 });
      }

      const query: any = { courseId, status: 'active' };
      if (userId && email) {
        query.$or = [{ userId }, { studentEmail: email.toLowerCase().trim() }];
      } else if (userId) {
        query.userId = userId;
      } else {
        query.studentEmail = email.toLowerCase().trim();
      }

      const match = await EnrollmentModel.findOne(query);
      return NextResponse.json({
        success: true,
        hasAccess: !!match,
        enrollment: match || null
      });
    }

    // Create or find enrollment (Idempotent)
    if (action === 'enroll' || action === 'create') {
      const data = enrollment || body;
      const studentEmail = (data.studentEmail || data.email || '').toLowerCase().trim();
      const targetCourseId = data.courseId;

      if (!studentEmail || !targetCourseId) {
        return NextResponse.json({ success: false, error: 'E-mail do aluno e ID do curso são obrigatórios.' }, { status: 400 });
      }

      // Check if already active
      let existing = await EnrollmentModel.findOne({
        courseId: targetCourseId,
        studentEmail,
        status: 'active'
      });

      if (existing) {
        // Se estiver a pagar a 2ª Parcela do curso
        if (data.installmentNumber === 2 || data.isSecondInstallment) {
          existing.amountPaid = (existing.amountPaid || 0) + (data.amountPaid || data.amount || 0);
          existing.installmentsPaid = 2;
          existing.remainingAmount = 0;
          if (data.orderId) existing.orderId = data.orderId;
          if (data.paymentReference) existing.paymentReference = data.paymentReference;
          await existing.save();
          return NextResponse.json({ success: true, enrollment: existing, updatedInstallment: true });
        }

        // If it was claimed or has new userId, update it
        if (data.userId && !existing.userId) {
          existing.userId = data.userId;
          existing.claimed = true;
          existing.claimedAt = new Date().toISOString();
          await existing.save();
        }
        return NextResponse.json({ success: true, enrollment: existing, existing: true });
      }

      // Generate unique claim token
      const claimToken = `CLM_${crypto.randomBytes(16).toString('hex')}`;
      const enrollmentId = `ENR_${Date.now().toString().slice(-6)}_${Math.floor(100 + Math.random() * 900)}`;

      const is2x = data.paymentPlan === 'installments_2x' || data.installments === 2 || data.installmentsTotal === 2;
      const amountPaid = data.amountPaid || data.amount || 0;
      const totalAmount = data.totalCourseAmount || data.totalPrice || (is2x ? (amountPaid * 2) : amountPaid);
      const remaining = data.remainingAmount !== undefined 
        ? Number(data.remainingAmount) 
        : (is2x ? Math.max(0, totalAmount - amountPaid) : 0);

      const newEnrollment = new EnrollmentModel({
        id: enrollmentId,
        courseId: targetCourseId,
        courseTitle: data.courseTitle || 'Curso WEHOSTHERE',
        studentEmail,
        studentName: data.studentName || data.name || 'Aluno',
        studentPhone: data.studentPhone || data.phone || '',
        userId: data.userId || undefined,
        orderId: data.orderId || undefined,
        paymentReference: data.paymentReference || data.reference || undefined,
        amountPaid: amountPaid,
        paymentMethod: data.paymentMethod || 'mpesa',
        paymentPlan: is2x ? 'installments_2x' : 'full',
        installmentsTotal: is2x ? 2 : 1,
        installmentsPaid: data.installmentNumber || 1,
        totalCourseAmount: totalAmount,
        remainingAmount: remaining,
        claimToken,
        claimed: !!data.userId,
        claimedAt: data.userId ? new Date().toISOString() : undefined,
        status: 'active',
        enrolledAt: new Date().toISOString()
      });

      await newEnrollment.save();
      return NextResponse.json({ success: true, enrollment: newEnrollment });
    }

    // Link/Sync all unlinked enrollments for a user upon login/registration
    if (action === 'claim_all_for_user') {
      if (!email || !userId) {
        return NextResponse.json({ success: false, error: 'Email e userId necessários' }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const updated = await EnrollmentModel.updateMany(
        { studentEmail: normalizedEmail, userId: { $in: [null, undefined, ''] } },
        { $set: { userId, claimed: true, claimedAt: new Date().toISOString() } }
      );

      return NextResponse.json({ success: true, updatedCount: updated.modifiedCount });
    }

    // Admin status update (Revoke / Re-activate)
    if (action === 'update_status') {
      const { enrollmentId, status } = body;
      if (!enrollmentId || !status) {
        return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
      }

      const updated = await EnrollmentModel.findOneAndUpdate(
        { id: enrollmentId },
        { status },
        { new: true }
      );

      return NextResponse.json({ success: true, enrollment: updated });
    }

    return NextResponse.json({ success: false, error: 'Ação desconhecida' }, { status: 400 });
  } catch (error: any) {
    console.error('[API Enrollments POST Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao processar matrícula' }, { status: 500 });
  }
}


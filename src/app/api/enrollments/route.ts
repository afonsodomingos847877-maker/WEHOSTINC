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
    const courseId = searchParams.get('courseId');
    const email = searchParams.get('email');
    
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (courseId) filter.courseId = courseId;
    if (email) filter.studentEmail = email.toLowerCase().trim();
    
    const enrollments = await EnrollmentModel.find(filter).sort({ enrolledAt: -1 }).lean();
    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error('Erro ao buscar inscrições:', error);
    return NextResponse.json({ error: 'Erro ao buscar inscrições' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, enrollment } = body;

    if (action === 'create' && enrollment) {
      const email = (enrollment.studentEmail || enrollment.userId || enrollment.email || '').toLowerCase().trim();
      const courseId = enrollment.courseId;

      // Idempotency: check if already exists
      let existing = await EnrollmentModel.findOne({
        courseId,
        studentEmail: email,
        status: 'active'
      });

      if (existing) {
        return NextResponse.json({ enrollment: existing, existing: true });
      }

      const claimToken = `CLM_${crypto.randomBytes(16).toString('hex')}`;
      const newEnrollment = new EnrollmentModel({
        id: `ENR_${Date.now().toString().slice(-6)}_${Math.floor(100 + Math.random() * 900)}`,
        courseId,
        courseTitle: enrollment.courseTitle || 'Curso WEHOSTHERE',
        studentEmail: email,
        studentName: enrollment.studentName || enrollment.userName || 'Aluno',
        studentPhone: enrollment.studentPhone || '',
        userId: enrollment.userId?.includes('@') ? undefined : enrollment.userId,
        orderId: enrollment.orderId || enrollment.paymentId || undefined,
        paymentReference: enrollment.paymentReference || undefined,
        amountPaid: enrollment.amountPaid || enrollment.amount || 0,
        paymentMethod: enrollment.paymentMethod || 'mpesa',
        claimToken,
        claimed: !!(enrollment.userId && !enrollment.userId.includes('@')),
        status: 'active',
        enrolledAt: new Date().toISOString()
      });

      await newEnrollment.save();
      return NextResponse.json({ enrollment: newEnrollment });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar requisição de inscrição:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}

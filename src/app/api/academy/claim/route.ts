import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import EnrollmentModel from '@/lib/models/Enrollment';
import UserModel from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token de resgate ausente.' }, { status: 400 });
    }

    const enrollment = await EnrollmentModel.findOne({ claimToken: token, status: 'active' });

    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Matrícula não encontrada ou token inválido.' }, { status: 404 });
    }

    // Check if user already exists with this email
    const existingUser = await UserModel.findOne({ email: enrollment.studentEmail.toLowerCase().trim() });

    return NextResponse.json({
      success: true,
      enrollment: {
        id: enrollment.id,
        courseId: enrollment.courseId,
        courseTitle: enrollment.courseTitle,
        studentEmail: enrollment.studentEmail,
        studentName: enrollment.studentName,
        enrolledAt: enrollment.enrolledAt,
        claimed: enrollment.claimed
      },
      hasExistingAccount: !!existingUser
    });
  } catch (error: any) {
    console.error('[API Academy Claim GET]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao validar token.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { token, userId, password } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token não fornecido.' }, { status: 400 });
    }

    const enrollment = await EnrollmentModel.findOne({ claimToken: token, status: 'active' });
    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Matrícula não encontrada ou já expirada.' }, { status: 404 });
    }

    let finalUserId = userId;

    // If userId not provided, but password provided, create user or link existing
    if (!finalUserId && password) {
      let existingUser = await UserModel.findOne({ email: enrollment.studentEmail.toLowerCase().trim() });
      if (!existingUser) {
        // Create new account
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserId = `usr_${Date.now().toString().slice(-6)}`;
        existingUser = new UserModel({
          id: newUserId,
          name: enrollment.studentName,
          email: enrollment.studentEmail.toLowerCase().trim(),
          password: hashedPassword,
          phone: enrollment.studentPhone || '',
          role: 'user',
          status: 'active',
          emailConfirmed: true,
          plan: 'none',
          createdAt: new Date().toISOString()
        });
        await existingUser.save();
      }
      finalUserId = existingUser.id || existingUser._id?.toString();
    }

    // Link enrollment
    if (finalUserId) {
      enrollment.userId = finalUserId;
      enrollment.claimed = true;
      enrollment.claimedAt = new Date().toISOString();
      await enrollment.save();

      // Also claim any other pending enrollments with same email
      await EnrollmentModel.updateMany(
        { studentEmail: enrollment.studentEmail, userId: { $in: [null, undefined, ''] } },
        { $set: { userId: finalUserId, claimed: true, claimedAt: new Date().toISOString() } }
      );
    }

    return NextResponse.json({
      success: true,
      courseId: enrollment.courseId,
      message: 'Matrícula associada com sucesso!',
      studentEmail: enrollment.studentEmail
    });
  } catch (error: any) {
    console.error('[API Academy Claim POST]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao associar matrícula.' }, { status: 500 });
  }
}


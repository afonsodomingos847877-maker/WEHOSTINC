import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import EnrollmentModel from '@/lib/models/Enrollment';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, userId } = body;

    if (!email || !userId) {
      return NextResponse.json({ success: false, error: 'Email e userId são obrigatórios.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Link any enrollments with this studentEmail that are unclaimed or missing userId
    const result = await EnrollmentModel.updateMany(
      {
        studentEmail: normalizedEmail,
        $or: [{ userId: { $exists: false } }, { userId: null }, { userId: '' }, { claimed: false }]
      },
      {
        $set: {
          userId,
          claimed: true,
          claimedAt: new Date().toISOString()
        }
      }
    );

    return NextResponse.json({
      success: true,
      syncedCount: result.modifiedCount
    });
  } catch (error: any) {
    console.error('[API Sync Enrollments Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao sincronizar matrículas.' }, { status: 500 });
  }
}


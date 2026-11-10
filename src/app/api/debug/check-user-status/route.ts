import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import { blockInProduction } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
  const blocked = blockInProduction();
  if (blocked) return blocked;
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    await connectDB();

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Retornar apenas informações relevantes para debug (sem senha)
    const debugInfo = {
      email: user.email,
      name: user.name,
      status: user.status,
      plan: user.plan,
      role: user.role,
      createdAt: user.createdAt,
      hasConfirmationCode: !!user.confirmationCode,
      confirmationCodeExpiresAt: user.confirmationCodeExpiresAt,
      avatar: user.avatar
    };

    return NextResponse.json({ success: true, user: debugInfo });
  } catch (error) {
    console.error('[Debug User Status] Error:', error);
    return NextResponse.json({ error: 'Error checking user status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const blocked = blockInProduction();
  if (blocked) return blocked;
  try {
    const body = await request.json();
    const email = body.email;

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    await connectDB();

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Retornar apenas informações relevantes para debug (sem senha)
    const debugInfo = {
      email: user.email,
      name: user.name,
      status: user.status,
      plan: user.plan,
      role: user.role,
      createdAt: user.createdAt,
      hasConfirmationCode: !!user.confirmationCode,
      confirmationCodeExpiresAt: user.confirmationCodeExpiresAt,
      avatar: user.avatar
    };

    return NextResponse.json({ success: true, user: debugInfo });
  } catch (error) {
    console.error('[Debug User Status] Error:', error);
    return NextResponse.json({ error: 'Error checking user status' }, { status: 500 });
  }
}

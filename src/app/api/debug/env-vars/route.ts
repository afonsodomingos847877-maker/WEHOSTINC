import { NextRequest, NextResponse } from 'next/server';
import { blockInProduction } from '@/lib/serverAuth';

// Debug route to check if environment variables are being read by Node.js
export async function GET(request: NextRequest) {
  const blocked = blockInProduction();
  if (blocked) return blocked;
  try {
    const allEnvVars = {
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
      MIGADU_USERNAME: process.env.MIGADU_USERNAME,
      MIGADU_API_KEY: process.env.MIGADU_API_KEY ? 'EXISTS' : 'MISSING',
      MIGADU_API_KEY_LENGTH: process.env.MIGADU_API_KEY?.length || 0,
      MIGADU_API_URL: process.env.MIGADU_API_URL,
      NODE_ENV: process.env.NODE_ENV,
      // Check if they exist
      EMAIL_PROVIDER_EXISTS: !!process.env.EMAIL_PROVIDER,
      MIGADU_USERNAME_EXISTS: !!process.env.MIGADU_USERNAME,
      MIGADU_API_KEY_EXISTS: !!process.env.MIGADU_API_KEY,
    };

    return NextResponse.json({
      success: true,
      envVars: allEnvVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

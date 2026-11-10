import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { blockInProduction } from '@/lib/serverAuth';

// Debug route to check email provider configuration
export async function GET(request: NextRequest) {
  const blocked = blockInProduction();
  if (blocked) return blocked;
  try {
    const config = {
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'NOT SET',
      MIGADU_USERNAME: process.env.MIGADU_USERNAME ? 'SET' : 'NOT SET',
      MIGADU_API_KEY: process.env.MIGADU_API_KEY ? 'SET' : 'NOT SET',
      MIGADU_API_URL: process.env.MIGADU_API_URL || 'NOT SET',
      MIGADU_USERNAME_LENGTH: process.env.MIGADU_USERNAME?.length || 0,
      MIGADU_API_KEY_LENGTH: process.env.MIGADU_API_KEY?.length || 0,
    };

    const provider = getEmailProvider();
    const providerConfigured = provider.isConfigured();

    return NextResponse.json({
      success: true,
      environment: config,
      providerConfigured,
      providerType: provider.constructor.name
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: String(error)
    }, { status: 500 });
    }
}

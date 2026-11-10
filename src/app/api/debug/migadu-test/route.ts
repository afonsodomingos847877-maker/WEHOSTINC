import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import { blockInProduction } from '@/lib/serverAuth';

// Debug route to test Migadu API connection
export async function GET(request: NextRequest) {
  const blocked = blockInProduction();
  if (blocked) return blocked;
  try {
    console.log('[Migadu Test] Starting Migadu API test');
    
    const provider = getEmailProvider();
    console.log('[Migadu Test] Provider configured:', provider.isConfigured());
    
    if (!provider.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Provider not configured',
        details: 'MIGADU_USERNAME or MIGADU_API_KEY is missing'
      }, { status: 500 });
    }

    console.log('[Migadu Test] Attempting to list domains...');
    
    try {
      const domains = await provider.listDomains();
      
      return NextResponse.json({
        success: true,
        message: 'Migadu API connection successful',
        domainsCount: domains.length,
        domains: domains.map(d => ({
          domainName: d.domainName,
          status: d.status,
          customerId: d.customerId
        }))
      });
    } catch (apiError: any) {
      console.error('[Migadu Test] API Error:', apiError);
      
      return NextResponse.json({
        success: false,
        error: 'Migadu API call failed',
        details: {
          message: apiError.message,
          name: apiError.name,
          code: apiError.code,
          statusCode: apiError.statusCode,
          stack: apiError.stack
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Migadu Test] General Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

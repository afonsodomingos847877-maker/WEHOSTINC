import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  let mailProxyStatus = 'not_configured';
  let mailProxyDetails: any = null;

  if (process.env.MAIL_PROXY_URL) {
    try {
      const targetUrl = new URL('/health', process.env.MAIL_PROXY_URL);
      const res = await fetch(targetUrl.toString(), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        mailProxyStatus = 'healthy';
        mailProxyDetails = await res.json().catch(() => null);
      } else {
        mailProxyStatus = `degraded_${res.status}`;
      }
    } catch {
      mailProxyStatus = 'unreachable';
    }
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      backend: 'healthy',
      mailProxy: {
        status: mailProxyStatus,
        binding: process.env.MAIL_PROXY_URL ? 'bound' : 'unbound',
        details: mailProxyDetails,
      },
    },
  });
}


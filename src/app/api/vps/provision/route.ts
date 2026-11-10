import { NextRequest, NextResponse } from 'next/server';
import { provisionWebsiteOnVPS, createEmailAccountOnVPS, issueSSLOnVPS } from '@/lib/vps';
import { requireAdmin } from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { action, domain, clientEmail, planId, emailUser, password } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domínio é obrigatório' }, { status: 400 });
    }

    if (action === 'create_email') {
      const res = await createEmailAccountOnVPS({ domain, emailUser, password });
      return NextResponse.json(res);
    }

    if (action === 'issue_ssl') {
      const res = await issueSSLOnVPS(domain);
      return NextResponse.json(res);
    }

    // Ação padrão: Provisionar site na VPS
    const result = await provisionWebsiteOnVPS({
      domain,
      clientEmail: clientEmail || 'cliente@wehosthere.co.mz',
      planId: planId || 'pro'
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro na API VPS Provision:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno no servidor de automação VPS',
      error: error.message
    }, { status: 500 });
  }
}

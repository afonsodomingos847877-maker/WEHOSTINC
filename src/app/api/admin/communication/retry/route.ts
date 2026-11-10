import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import { sendEmail } from '@/lib/sendgrid';

export async function POST(req: Request) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    await connectDB();
    
    const CommunicationLog = (await import('@/lib/models/CommunicationLog')).default;
    const body = await req.json();
    const { logId } = body;

    if (!logId) {
      return NextResponse.json({ error: 'ID do log é obrigatório' }, { status: 400 });
    }

    // Buscar o log falhado
    const log = await CommunicationLog.findById(logId);
    
    if (!log) {
      return NextResponse.json({ error: 'Log não encontrado' }, { status: 404 });
    }

    if (log.status === 'sent') {
      return NextResponse.json({ error: 'Este email já foi enviado com sucesso' }, { status: 400 });
    }

    // Verificar limite de retries
    if (log.retryCount >= 3) {
      return NextResponse.json({ error: 'Limite de retries atingido' }, { status: 400 });
    }

    // Tentar reenviar
    try {
      await sendEmail({
        to: log.recipientEmail,
        subject: log.subject,
        text: log.body,
        html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;line-height:1.7;">
          <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px 24px 24px;border-radius:12px 12px 0 0;text-align:center;">
            <img
              src="https://wehosthere.com/logo.png"
              alt="WEHOSTHERE"
              width="160"
              style="max-width:160px;height:auto;display:block;margin:0 auto;"
              onerror="this.style.display='none';document.getElementById('wh-logo-text').style.display='block';"
            />
            <span id="wh-logo-text" style="display:none;color:white;font-size:22px;font-weight:800;letter-spacing:1px;">WEHOSTHERE</span>
            <p style="color:#bfdbfe;margin:10px 0 0;font-size:13px;">Hospedagem &amp; Serviços de Nuvem</p>
          </div>
          <div style="background:#ffffff;padding:32px 24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <div style="white-space:pre-line;font-size:15px;color:#334155;line-height:1.8;">${log.body}</div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px;">
            <div style="text-align:center;">
              <img src="https://wehosthere.com/logo.png" alt="WEHOSTHERE" width="80" style="max-width:80px;height:auto;opacity:0.35;margin-bottom:10px;" />
              <p style="color:#64748b;font-size:12px;margin:0 0 12px;font-weight:600;">Siga-nos nas redes sociais</p>
              <div style="display:flex;justify-content:center;gap:16px;margin-bottom:14px;">
                <a href="https://www.facebook.com/profile.php?id=61592497206566" target="_blank" rel="noopener noreferrer"
                   style="display:inline-flex;align-items:center;gap:6px;background:#1877F2;color:white;text-decoration:none;font-size:12px;font-weight:700;padding:7px 14px;border-radius:8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  Facebook
                </a>
                <a href="https://www.linkedin.com/company/wehosthere" target="_blank" rel="noopener noreferrer"
                   style="display:inline-flex;align-items:center;gap:6px;background:#0A66C2;color:white;text-decoration:none;font-size:12px;font-weight:700;padding:7px 14px;border-radius:8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                  LinkedIn
                </a>
              </div>
              <hr style="border:none;border-top:1px solid #f1f5f9;margin:0 0 10px;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">WEHOSTHERE &mdash; Suporte &amp; Comunicação Automática</p>
              <p style="color:#cbd5e1;font-size:11px;margin:4px 0 0;"><a href="https://wehosthere.com" style="color:#3b82f6;text-decoration:none;">wehosthere.com</a></p>
            </div>
          </div>
        </div>`
      });

      // Atualizar log como enviado
      await CommunicationLog.findByIdAndUpdate(logId, {
        status: 'sent',
        error: null,
        retryCount: log.retryCount + 1,
        nextRetryAt: null
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Email reenviado com sucesso' 
      });
    } catch (error: any) {
      // Falhou novamente - agendar próximo retry
      const nextRetryAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
      
      await CommunicationLog.findByIdAndUpdate(logId, {
        status: 'retrying',
        error: error.message,
        retryCount: log.retryCount + 1,
        nextRetryAt
      });

      return NextResponse.json({ 
        success: false, 
        error: 'Falha ao reenviar email',
        nextRetryAt,
        retryCount: log.retryCount + 1
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Communication Retry] Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar retry',
      details: error.message 
    }, { status: 500 });
  }
}

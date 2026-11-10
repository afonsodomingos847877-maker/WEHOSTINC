import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import { connectDB } from '@/lib/mongodb';
import CommunicationLogModel from '@/lib/models/CommunicationLog';
import { dispatchMessage, DEFAULT_TEMPLATES, replaceTemplateVariables } from '@/lib/notifications';

let serverCommunicationTemplates: any[] = [...DEFAULT_TEMPLATES];

export async function GET(req: Request) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  if (type === 'templates') {
    return NextResponse.json({
      success: true,
      templates: serverCommunicationTemplates
    });
  }

  let logs: any[] = [];
  try {
    await connectDB();
    logs = await CommunicationLogModel.find({})
      .sort({ sentAt: -1, createdAt: -1 })
      .limit(200)
      .lean();
  } catch (err) {
    console.error('[Communication API GET] Erro ao buscar logs do MongoDB:', err);
  }

  return NextResponse.json({
    success: true,
    logs,
    templates: serverCommunicationTemplates
  });
}

export async function POST(req: Request) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.error) return adminAuth.error;

  try {
    const body = await req.json();
    const { action } = body;

    // Ação: Guardar / Atualizar Template
    if (action === 'save_template') {
      const { template } = body;
      const index = serverCommunicationTemplates.findIndex(t => t.id === template.id);
      const now = new Date().toISOString();

      if (index >= 0) {
        serverCommunicationTemplates[index] = {
          ...serverCommunicationTemplates[index],
          ...template,
          updatedAt: now
        };
      } else {
        serverCommunicationTemplates.push({
          ...template,
          id: template.id || `tpl_${Date.now()}`,
          createdAt: now,
          updatedAt: now
        });
      }

      return NextResponse.json({
        success: true,
        templates: serverCommunicationTemplates
      });
    }

    // Ação: Envio em Massa (Bulk Send)
    if (action === 'send_bulk') {
      const { recipients, templateId, subject, body: customBody, variables } = body;

      if (!Array.isArray(recipients) || recipients.length === 0) {
        return NextResponse.json({ success: false, error: 'Lista de destinatários vazia.' }, { status: 400 });
      }

      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (const recipient of recipients) {
        const res = await dispatchMessage({
          recipientEmail: recipient.email,
          recipientName: recipient.name || recipient.email.split('@')[0],
          templateId,
          subject,
          body: customBody,
          variables: {
            ...variables,
            nome_cliente: recipient.name || recipient.email.split('@')[0],
            email: recipient.email,
            plano: recipient.plan || 'Padrão',
            status: recipient.status || 'Ativo'
          },
          isAutomatic: false
        });

        if (res.success) successCount++;
        else failCount++;

        results.push({ email: recipient.email, ...res });
      }

      return NextResponse.json({
        success: true,
        summary: {
          total: recipients.length,
          success: successCount,
          failed: failCount
        },
        results
      });
    }

    // Ação Padrão: Envio de Mensagem Única / Direta
    const { recipientEmail, recipientName, templateId, subject, body: customBody, variables, isAutomatic, eventType } = body;

    if (!recipientEmail) {
      return NextResponse.json({ success: false, error: 'E-mail do destinatário obrigatório.' }, { status: 400 });
    }

    const result = await dispatchMessage({
      recipientEmail,
      recipientName: recipientName || recipientEmail.split('@')[0],
      templateId,
      subject,
      body: customBody,
      variables,
      isAutomatic: !!isAutomatic,
      eventType
    });

    return NextResponse.json({
      success: result.success,
      error: result.error
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

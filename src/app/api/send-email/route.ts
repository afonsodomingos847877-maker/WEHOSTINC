import { NextResponse } from 'next/server';
import { 
  sendEmail, 
  sendWebmailMessage, 
  sendCourseEnrollmentEmail, 
  sendCoursePurchaseEmail, 
  sendCourseCompletionEmail, 
  sendRoleChangeEmail,
  sendInvoiceEmail
} from '@/lib/sendgrid';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, from, to, subject, body: msgBody, text, html, userName, courseTitle, amount, certificateNumber, verificationUrl, role, invoiceRef, plan, claimToken } = body;

    // Validação básica para tipos específicos ou genéricos
    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Campo obrigatório: to' },
        { status: 400 }
      );
    }

    let result;

    if (type === 'invoice') {
      result = await sendInvoiceEmail(to, userName || 'Cliente', invoiceRef || 'FAT-001', `${(amount || 0).toLocaleString('pt-MZ')} MT`, plan || 'Serviços WEHOSTHERE');
    } else if (type === 'order-pending') {
      result = await sendEmail({
        to,
        fromEmail: 'info@wehosthere.com',
        subject: `📦 Encomenda Recebida - ${body.orderRef || 'WEHOSTHERE'}`,
        text: `Olá ${userName || 'Cliente'},\n\nRecebemos a sua encomenda ${body.orderRef || 'N/A'} com sucesso!\n\nDetalhes da Encomenda:\n• Referência: ${body.orderRef || 'N/A'}\n• Serviço: ${plan || 'Serviços WEHOSTHERE'}\n• Valor a Pagar: ${(amount || 0).toLocaleString('pt-MZ')} MT\n• Estado: Pagamento Pendente\n\nPara ativar o seu serviço, por favor conclua o pagamento. Pode fazê-lo através do seu painel de cliente.\n\nAtenciosamente,\nEquipa WEHOSTHERE`,
      });
    } else if (type === 'course_enrollment') {
      result = await sendCourseEnrollmentEmail(to, userName || 'Aluno', courseTitle || 'Curso');
    } else if (type === 'course_purchase') {
      result = await sendCoursePurchaseEmail(to, userName || 'Aluno', courseTitle || 'Curso', amount || 500, claimToken);
    } else if (type === 'course_completion') {
      result = await sendCourseCompletionEmail(to, userName || 'Aluno', courseTitle || 'Curso', certificateNumber || 'WH-CERT', verificationUrl || '');
    } else if (type === 'role_change') {
      result = await sendRoleChangeEmail(to, userName || 'Utilizador', role || 'user');
    } else if (type === 'webmail') {
      if (!from) {
        return NextResponse.json(
          { success: false, error: 'Remetente (from) é obrigatório para Webmail.' },
          { status: 400 }
        );
      }
      result = await sendWebmailMessage(from, to, subject || '(Sem assunto)', msgBody || text || '');
    } else {
      // Tipo: e-mail transacional genérico
      result = await sendEmail({
        to,
        fromEmail: from,
        subject: subject || '(Sem assunto)',
        text: typeof msgBody === 'string' ? msgBody : text,
        html: html,
      });
    }

    if (result.success) {
      return NextResponse.json({ success: true, message: 'E-mail enviado com sucesso via Resend.' });
    } else {
      // Fallback gracioso — regista o erro mas não quebra a UI
      console.warn('[API/send-email] Resend falhou:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Erro desconhecido no Resend.',
        fallback: true,
        message: 'E-mail registado localmente. Verifica as variáveis RESEND_API_KEY e EMAIL_USER no .env.local.',
      }, { status: 200 });
    }
  } catch (err) {
    console.error('[API/send-email] Erro interno:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}

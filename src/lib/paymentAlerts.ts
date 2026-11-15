import { addAdminNotification } from '@/lib/notifications';

export interface PaymentFailureNotificationInput {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceName?: string;
  paymentMethod?: string;
  amount?: number;
  reference?: string;
  reason: string;
}

/**
 * Notifica o administrador (painel admin, e-mail e push) quando uma tentativa
 * de pagamento no checkout falha ou o gateway devolve erro.
 * Uso exclusivo em rotas de servidor (API Routes / Server Actions).
 */
export async function notifyAdminPaymentError(
  input: PaymentFailureNotificationInput
): Promise<void> {
  const clientName = input.clientName?.trim() || 'Cliente';
  const clientEmail = input.clientEmail?.trim() || 'Não informado';
  const clientPhone = input.clientPhone?.trim() || 'Não informado';
  const serviceName = input.serviceName?.trim() || 'Serviço';
  const paymentMethod = (input.paymentMethod || 'mpesa').toUpperCase();
  const amountText =
    typeof input.amount === 'number' && !Number.isNaN(input.amount)
      ? `${input.amount.toLocaleString('pt-MZ')} MT`
      : 'N/A';
  const reference = input.reference?.trim() || 'N/A';
  const reason = input.reason?.trim() || 'Erro desconhecido no pagamento';

  const title = `⚠️ Erro no Pagamento (${paymentMethod}): ${clientName} - ${amountText}`;
  const shortMessage = `${clientName} (${clientPhone}) tentou pagar ${amountText} para "${serviceName}" via ${paymentMethod} e falhou. Motivo: ${reason}. Ref: ${reference}`;

  const tasks: Promise<unknown>[] = [];

  // 1. Notificação no painel admin (MongoDB)
  tasks.push(
    (async () => {
      const { connectDB } = await import('@/lib/mongodb');
      await connectDB();
      await addAdminNotification({
        title,
        message: shortMessage,
        type: 'payment_failed',
        userEmail: clientEmail !== 'Não informado' ? clientEmail : undefined,
        userName: clientName,
        link: '/admin?tab=orders',
        metadata: {
          clientPhone,
          serviceName,
          paymentMethod,
          amount: input.amount,
          reference,
          reason
        }
      });
    })()
  );

  // 2. E-mail para o administrador
  tasks.push(
    (async () => {
      const { sendEmail } = await import('@/lib/sendgrid');
      const adminEmail =
        process.env.ADMIN_NOTIFICATION_EMAIL ||
        process.env.ADMIN_EMAIL ||
        'info@wehosthere.com';
      const text = [
        'Olá Administrador,',
        '',
        'Um cliente tentou efetuar um pagamento no checkout e ocorreu um erro:',
        '',
        `• Cliente: ${clientName}`,
        `• E-mail: ${clientEmail}`,
        `• Telefone / WhatsApp: ${clientPhone}`,
        `• Método: ${paymentMethod}`,
        `• Serviço: ${serviceName}`,
        `• Valor: ${amountText}`,
        `• Referência: ${reference}`,
        `• Erro / Motivo: ${reason}`,
        `• Data: ${new Date().toLocaleString('pt-MZ')}`,
        '',
        'Pode acompanhar ou contactar o cliente diretamente pelo painel admin.',
        'Equipe WEHOSTHERE'
      ].join('\n');

      await sendEmail({
        to: adminEmail,
        subject: title,
        text
      });
    })()
  );

  // 3. Push notification para os administradores
  tasks.push(
    (async () => {
      const { sendPushToAdmins } = await import('@/lib/pushService');
      await sendPushToAdmins({
        title,
        message: shortMessage,
        url: '/admin?tab=orders',
        tag: `payment-error-${reference}`
      });
    })()
  );

  const results = await Promise.allSettled(tasks);
  results.forEach((res, idx) => {
    if (res.status === 'rejected') {
      console.error(`[notifyAdminPaymentError] Canal ${idx} falhou:`, res.reason);
    }
  });
}

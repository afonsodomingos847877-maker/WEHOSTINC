import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import SiteModel from '@/lib/models/Site';
import CommunicationLog from '@/lib/models/CommunicationLog';
import { dispatchMessage } from '@/lib/notifications';
import { requireCronSecret } from '@/lib/serverAuth';

export async function GET(request: Request) {
  const cronAuthError = requireCronSecret(request);
  if (cronAuthError) return cronAuthError;

  try {

    await connectDB();

    const today = new Date();
    const currentDay = today.getDate();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // 1. Filtrar APENAS utilizadores ativos que possuam um PLANO PAGO contratado ('basic', 'pro', 'enterprise')
    // Utilizadores com plano 'none' ou contas gratuitas NUNCA devem receber faturas de renovação
    const activePaidUsers = await UserModel.find({
      status: 'active',
      role: { $ne: 'admin' },
      email: { $ne: 'admin@wehosthere.com' },
      plan: { $in: ['basic', 'pro', 'enterprise'] }
    }).lean();

    const processed = [];

    const planPrices: Record<string, string> = {
      basic: '500 MT',
      pro: '1.500 MT',
      enterprise: '3.500 MT'
    };

    for (const user of activePaidUsers) {
      // Se por algum motivo o plano for 'none', ignorar imediatamente
      if (!user.plan || user.plan === 'none') {
        continue;
      }

      // 2. Verificar e obter o site/serviço ativo do utilizador para determinar o dia exato de ativação
      const userSite = await SiteModel.findOne({
        userEmail: user.email.toLowerCase().trim(),
        status: { $in: ['active', 'pending'] }
      }).sort({ createdAt: 1 }).lean();

      if (!userSite) {
        continue;
      }

      // O dia de vencimento mensal corresponde ao dia real de ativação do serviço (ou dueDate personalizado)
      let dueDay = user.dueDate;
      if (!dueDay && userSite.createdAt) {
        dueDay = new Date(userSite.createdAt).getDate();
      }
      if (!dueDay) {
        dueDay = 29;
      }
      
      let daysUntilExpiry = 0;
      if (dueDay >= currentDay) {
        daysUntilExpiry = dueDay - currentDay;
      } else {
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
        const diffTime = nextMonth.getTime() - today.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Enviar alerta automático APENAS quando faltar 3 dias, 1 dia ou no dia do vencimento (0)
      if (daysUntilExpiry <= 3 && daysUntilExpiry >= 0) {
        // 3. Evitar envio duplicado no mesmo dia para o mesmo utilizador
        const alreadySentToday = await CommunicationLog.exists({
          recipientEmail: user.email.toLowerCase().trim(),
          eventType: 'due_date_reminder',
          sentAt: { $gte: startOfToday }
        });

        if (alreadySentToday) {
          continue;
        }

        const valorPlano = planPrices[user.plan] || '500 MT';
        const userShortId = (user.id || user._id?.toString() || '0000').slice(-4);
        const numeroPedido = `FAT-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}-${userShortId}`;

        try {
          await dispatchMessage({
            recipientEmail: user.email,
            recipientName: user.name || user.email.split('@')[0],
            templateId: 'payment-pending',
            variables: {
              nome_cliente: user.name || user.email.split('@')[0],
              numero_pedido: numeroPedido,
              valor: valorPlano,
              data: `Dia ${dueDay} (${daysUntilExpiry === 0 ? 'Hoje' : `em ${daysUntilExpiry} dia(s)`})`
            },
            isAutomatic: true,
            eventType: 'due_date_reminder'
          });

          processed.push({
            email: user.email,
            plan: user.plan,
            dueDay,
            daysUntilExpiry,
            valor: valorPlano,
            status: 'notified'
          });
        } catch (dispatchErr) {
          console.warn(`[Cron Due Date] Erro ao notificar ${user.email}:`, dispatchErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activePaidUsersChecked: activePaidUsers.length,
      notificationsSent: processed.length,
      details: processed
    });
  } catch (error: any) {
    console.error('[Cron Due Date] Error:', error);
    return NextResponse.json({ error: error?.message || 'Erro no processamento de vencimentos' }, { status: 500 });
  }
}


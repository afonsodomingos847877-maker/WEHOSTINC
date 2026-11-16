import { connectDB } from '@/lib/mongodb';
import AnalyticsVisitModel from '@/lib/models/AnalyticsVisit';
import AnalyticsMilestoneModel from '@/lib/models/AnalyticsMilestone';
import AdminNotification from '@/lib/models/AdminNotification';
import { sendAnalyticsMilestoneEmail } from '@/lib/sendgrid';

let isChecking = false;

/**
 * Verifica se os marcos de visualizações (+100) ou visitantes únicos (+10) foram alcançados.
 * Se sim, envia e-mail comemorativo ao administrador e cria notificação no painel.
 */
export async function checkAndNotifyMilestones(): Promise<{
  triggeredViews?: number;
  triggeredUnique?: number;
}> {
  // Evitar execuções sobrepostas simultâneas
  if (isChecking) return {};
  isChecking = true;

  try {
    await connectDB();

    const [totalViews, distinctSessions] = await Promise.all([
      AnalyticsVisitModel.countDocuments(),
      AnalyticsVisitModel.distinct('sessionId')
    ]);

    const uniqueVisitors = Array.isArray(distinctSessions) ? distinctSessions.length : 0;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'info@wehosthere.com';

    let triggeredViews: number | undefined;
    let triggeredUnique: number | undefined;

    // Helper para obter top 4 páginas
    const getTopPages = async () => {
      try {
        const recentVisits = await AnalyticsVisitModel.find().sort({ timestamp: -1 }).limit(1000).lean();
        const counts = recentVisits.reduce((acc: Record<string, number>, v: any) => {
          if (v.page) acc[v.page] = (acc[v.page] || 0) + 1;
          return acc;
        }, {});
        return Object.entries(counts)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 4)
          .map(([page, count]) => ({ page, count: count as number }));
      } catch {
        return [];
      }
    };

    // ── 1. MARCO DE VISUALIZAÇÕES (+100) ──
    const viewsStep = 100;
    let viewsRecord = await AnalyticsMilestoneModel.findOne({ key: 'page_views' });

    if (!viewsRecord) {
      // Primeira inicialização: fixa a base no múltiplo de 100 mais próximo
      const baseMilestone = Math.floor(totalViews / viewsStep) * viewsStep;
      viewsRecord = await AnalyticsMilestoneModel.create({
        key: 'page_views',
        lastMilestone: baseMilestone,
        step: viewsStep,
        lastNotifiedAt: new Date(),
        history: [{
          milestone: baseMilestone,
          reachedAt: new Date(),
          notifiedTo: 'initial_setup'
        }]
      });
      console.log(`[AnalyticsMilestone] Base de visualizações inicializada em: ${baseMilestone} vistas.`);
    } else {
      const targetViewsMilestone = Math.floor(totalViews / viewsStep) * viewsStep;

      if (targetViewsMilestone > viewsRecord.lastMilestone) {
        // Atualização atómica condicional para prevenir duplicações de e-mail em concorrência
        const updated = await AnalyticsMilestoneModel.findOneAndUpdate(
          { key: 'page_views', lastMilestone: { $lt: targetViewsMilestone } },
          {
            $set: { lastMilestone: targetViewsMilestone, lastNotifiedAt: new Date() },
            $push: {
              history: {
                milestone: targetViewsMilestone,
                reachedAt: new Date(),
                notifiedTo: adminEmail
              }
            }
          },
          { new: true }
        );

        if (updated) {
          triggeredViews = targetViewsMilestone;
          const topPages = await getTopPages();

          console.log(`[AnalyticsMilestone] 🚀 Novo marco de visualizações alcançado: ${targetViewsMilestone}! Enviando e-mail...`);

          // 1. Enviar E-mail
          await sendAnalyticsMilestoneEmail({
            type: 'page_views',
            milestone: targetViewsMilestone,
            totalPageViews: totalViews,
            totalUniqueVisitors: uniqueVisitors,
            topPages
          }).catch(err => console.error('[AnalyticsMilestone] Erro ao enviar e-mail de views:', err));

          // 2. Criar Notificação no Painel de Administração
          await AdminNotification.create({
            title: `🎯 Novo Marco: ${targetViewsMilestone.toLocaleString('pt-MZ')} Visualizações!`,
            message: `O seu site ultrapassou a marca de ${targetViewsMilestone.toLocaleString('pt-MZ')} páginas vistas (+100 visualizações). Total atual: ${totalViews.toLocaleString('pt-MZ')} vistas.`,
            type: 'system',
            link: '/admin',
            userEmail: adminEmail,
            metadata: { milestone: targetViewsMilestone, type: 'page_views', totalViews, uniqueVisitors }
          }).catch(err => console.error('[AnalyticsMilestone] Erro ao criar notificação no painel:', err));
        }
      }
    }

    // ── 2. MARCO DE VISITANTES ÚNICOS (+10) ──
    const uniqueStep = 100;
    let uniqueRecord = await AnalyticsMilestoneModel.findOne({ key: 'unique_visitors' });

    if (!uniqueRecord) {
      // Primeira inicialização: fixa a base no múltiplo de 10 mais próximo
      const baseMilestone = Math.floor(uniqueVisitors / uniqueStep) * uniqueStep;
      uniqueRecord = await AnalyticsMilestoneModel.create({
        key: 'unique_visitors',
        lastMilestone: baseMilestone,
        step: uniqueStep,
        lastNotifiedAt: new Date(),
        history: [{
          milestone: baseMilestone,
          reachedAt: new Date(),
          notifiedTo: 'initial_setup'
        }]
      });
      console.log(`[AnalyticsMilestone] Base de visitantes únicos inicializada em: ${baseMilestone} pessoas.`);
    } else {
      const targetUniqueMilestone = Math.floor(uniqueVisitors / uniqueStep) * uniqueStep;

      if (targetUniqueMilestone > uniqueRecord.lastMilestone) {
        // Atualização atómica condicional
        const updated = await AnalyticsMilestoneModel.findOneAndUpdate(
          { key: 'unique_visitors', lastMilestone: { $lt: targetUniqueMilestone } },
          {
            $set: { lastMilestone: targetUniqueMilestone, lastNotifiedAt: new Date() },
            $push: {
              history: {
                milestone: targetUniqueMilestone,
                reachedAt: new Date(),
                notifiedTo: adminEmail
              }
            }
          },
          { new: true }
        );

        if (updated) {
          triggeredUnique = targetUniqueMilestone;
          const topPages = await getTopPages();

          console.log(`[AnalyticsMilestone] 👥 Novo marco de visitantes únicos alcançado: ${targetUniqueMilestone}! Enviando e-mail...`);

          // 1. Enviar E-mail
          await sendAnalyticsMilestoneEmail({
            type: 'unique_visitors',
            milestone: targetUniqueMilestone,
            totalPageViews: totalViews,
            totalUniqueVisitors: uniqueVisitors,
            topPages
          }).catch(err => console.error('[AnalyticsMilestone] Erro ao enviar e-mail de visitantes únicos:', err));

          // 2. Criar Notificação no Painel de Administração
          await AdminNotification.create({
            title: `👥 Novo Marco: ${targetUniqueMilestone.toLocaleString('pt-MZ')} Visitantes Únicos!`,
            message: `O seu site recebeu +100 novos visitantes únicos, atingindo o marco de ${targetUniqueMilestone.toLocaleString('pt-MZ')} pessoas/sessões distintas!`,
            type: 'system',
            link: '/admin',
            userEmail: adminEmail,
            metadata: { milestone: targetUniqueMilestone, type: 'unique_visitors', totalViews, uniqueVisitors }
          }).catch(err => console.error('[AnalyticsMilestone] Erro ao criar notificação no painel:', err));
        }
      }
    }

    return { triggeredViews, triggeredUnique };
  } catch (err) {
    console.error('[AnalyticsMilestone] Erro ao verificar marcos de analytics:', err);
    return {};
  } finally {
    isChecking = false;
  }
}

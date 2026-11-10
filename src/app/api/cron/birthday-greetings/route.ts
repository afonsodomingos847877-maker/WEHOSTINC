import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import CommunicationLog from '@/lib/models/CommunicationLog';
import { sendBirthdayEmail } from '@/lib/sendgrid';
import { requireCronSecret } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de Cron Automático Diário para envio de felicitações de aniversário.
 * Rota: GET /api/cron/birthday-greetings
 *
 * Suporta também teste imediato (autenticado com CRON_SECRET):
 * GET /api/cron/birthday-greetings?testEmail=exemplo@gmail.com&testName=Afonso
 */
export async function GET(request: Request) {
  const cronAuthError = requireCronSecret(request);
  if (cronAuthError) return cronAuthError;

  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('testEmail');
    const testName = searchParams.get('testName');

    // ── MODO TESTE RÁPIDO ──────────────────────────────────────────────────
    if (testEmail) {
      const cleanEmail = testEmail.trim().toLowerCase();
      const cleanName = (testName || 'Amigo(a) da WEHOSTHERE').trim();

      const result = await sendBirthdayEmail({
        toEmail: cleanEmail,
        userName: cleanName,
        customMessage: 'Este é um disparo de teste da automação de felicitações de aniversário da plataforma WEHOSTHERE.',
      });

      return NextResponse.json({
        success: result.success,
        mode: 'test',
        recipient: cleanEmail,
        name: cleanName,
        error: result.error,
        message: result.success
          ? `E-mail de felicitações de teste enviado com sucesso para ${cleanEmail}!`
          : `Falha ao enviar e-mail de teste: ${result.error}`,
      });
    }

    // ── MODO AUTOMÁTICO DIÁRIO ─────────────────────────────────────────────
    await connectDB();

    // Data de hoje no fuso horário de Moçambique (Africa/Maputo = UTC+2)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Maputo',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(now);
    const currentYear = parseInt(parts.find(p => p.type === 'year')?.value || `${now.getFullYear()}`, 10);
    const currentMonth = parseInt(parts.find(p => p.type === 'month')?.value || `${now.getMonth() + 1}`, 10);
    const currentDay = parseInt(parts.find(p => p.type === 'day')?.value || `${now.getDate()}`, 10);

    console.log(`[BirthdayCron] 🎂 Verificando aniversariantes para a data: ${currentDay}/${currentMonth}/${currentYear} (Maputo Time)`);

    // Buscar utilizadores ativos com data de nascimento definida
    const users = await UserModel.find({
      status: 'active',
      birthdate: { $exists: true, $nin: [null, ''] },
    }).lean();

    let processedCount = 0;
    let sentCount = 0;
    let skippedAlreadySent = 0;
    const sentTo: Array<{ email: string; name: string }> = [];
    const errors: Array<{ email: string; error: string }> = [];

    for (const user of users as any[]) {
      if (!user.birthdate || typeof user.birthdate !== 'string') continue;

      // Parse da data de nascimento (suporta YYYY-MM-DD, DD/MM/YYYY, etc.)
      const rawDate = user.birthdate.trim();
      let birthDay: number | null = null;
      let birthMonth: number | null = null;

      if (rawDate.includes('-')) {
        const segs = rawDate.split('-');
        if (segs.length === 3) {
          // YYYY-MM-DD
          birthMonth = parseInt(segs[1], 10);
          birthDay = parseInt(segs[2], 10);
        } else if (segs.length === 2) {
          // MM-DD
          birthMonth = parseInt(segs[0], 10);
          birthDay = parseInt(segs[1], 10);
        }
      } else if (rawDate.includes('/')) {
        const segs = rawDate.split('/');
        if (segs.length >= 2) {
          // DD/MM ou DD/MM/YYYY
          birthDay = parseInt(segs[0], 10);
          birthMonth = parseInt(segs[1], 10);
        }
      }

      if (!birthDay || !birthMonth) continue;

      // Verificar se faz anos hoje (dia e mês coincidem)
      const isBirthdayToday = birthDay === currentDay && birthMonth === currentMonth;

      if (!isBirthdayToday) continue;

      processedCount++;

      // Verificar se já enviamos neste ano para evitar duplicações
      if (user.lastBirthdayGreetingYear === currentYear) {
        skippedAlreadySent++;
        continue;
      }

      try {
        const result = await sendBirthdayEmail({
          toEmail: user.email,
          userName: user.name || 'Cliente',
        });

        // Registar no CommunicationLog
        try {
          await CommunicationLog.create({
            recipientEmail: user.email,
            recipientName: user.name || user.email,
            subject: `🎂 Parabéns pelo seu Aniversário! 🎉 | WEHOSTHERE`,
            body: `Mensagem personalizada de felicitações enviada para ${user.name} com a imagem comemorativa oficial.`,
            templateName: 'birthday-greeting',
            eventType: `birthday-greeting-${currentYear}`,
            channel: 'email',
            isAutomatic: true,
            status: result.success ? 'sent' : 'failed',
            error: result.success ? null : (result.error || 'Erro desconhecido'),
            sentAt: new Date(),
          });
        } catch (logErr) {
          console.error('[BirthdayCron] Erro ao registar CommunicationLog:', logErr);
        }

        if (result.success) {
          // Atualizar o ano do último envio no utilizador
          await UserModel.updateOne(
            { _id: user._id },
            { $set: { lastBirthdayGreetingYear: currentYear } }
          );

          sentCount++;
          sentTo.push({ email: user.email, name: user.name });
          console.log(`[BirthdayCron] ✅ Felicitações enviadas com sucesso para: ${user.name} (${user.email})`);
        } else {
          errors.push({ email: user.email, error: result.error || 'Falha ao enviar' });
        }
      } catch (sendErr: any) {
        console.error(`[BirthdayCron] ❌ Erro ao enviar para ${user.email}:`, sendErr);
        errors.push({ email: user.email, error: sendErr.message || String(sendErr) });
      }
    }

    return NextResponse.json({
      success: true,
      dateChecked: `${currentDay}/${currentMonth}/${currentYear}`,
      matchedBirthdaysToday: processedCount,
      sentCount,
      skippedAlreadySent,
      sentTo,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[BirthdayCron] ❌ Erro crítico no cron de aniversários:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}

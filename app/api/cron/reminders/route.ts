import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppProactive } from '@/lib/twilio/send-message';
import { formatCOPColoquial } from '@/lib/utils/currency';
import { getCurrentWeekRange } from '@/lib/utils/dates';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  // Fail-closed: sin CRON_SECRET no autorizamos (evita que 'Bearer undefined' pase)
  if (!process.env.CRON_SECRET) {
    console.error('[cron] CRON_SECRET no configurado');
    return new Response('Server misconfigured', { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const hourUTC = now.getUTCHours();
  const dayUTC = now.getUTCDay(); // 0 = Sunday
  // El cron se programa a las 01:00 UTC (8pm Bogotá) pero en el plan gratuito
  // puede correr tarde; aceptamos 1 o 2 UTC (el dedupe de 20h evita dobles).
  const inSendWindow = hourUTC === 1 || hourUTC === 2;

  // Fecha/hora en Bogotá (UTC-5) para evaluar recordatorios personalizados
  const bogotaNow = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const bDayOfMonth = bogotaNow.getUTCDate();
  const bDayOfWeek  = bogotaNow.getUTCDay();
  const bDateStr    = bogotaNow.toISOString().split('T')[0];
  // Último día del mes actual en Bogotá (para "cada mes el día 31" en meses cortos)
  const bLastDayOfMonth = new Date(Date.UTC(bogotaNow.getUTCFullYear(), bogotaNow.getUTCMonth() + 1, 0)).getUTCDate();

  // Limpieza: desactivar recordatorios "una vez" cuya fecha ya pasó
  await supabase
    .from('reminders')
    .update({ is_active: false })
    .eq('reminder_type', 'custom')
    .eq('frequency', 'once')
    .eq('is_active', true)
    .lt('run_date', bDateStr);

  const { data: reminders } = await supabase
    .from('reminders')
    .select('id, user_id, reminder_type, last_sent_at, title, frequency, day_of_month, day_of_week, run_date')
    .eq('is_active', true);

  if (!reminders?.length) return Response.json({ sent: 0 });

  let sent = 0;

  for (const reminder of reminders) {
    // Avoid duplicate within same day
    if (reminder.last_sent_at) {
      const hoursSince = (now.getTime() - new Date(reminder.last_sent_at).getTime()) / 3_600_000;
      if (hoursSince < 20) continue;
    }

    // Check schedule — ventana de envío = 8pm Bogotá (01–02 UTC)
    const isDailyTime  = reminder.reminder_type === 'daily_summary'  && inSendWindow;
    // dayUTC===1 (lunes UTC) = domingo 8pm Bogota — corrección de zona horaria
    const isWeeklyTime = reminder.reminder_type === 'weekly_summary' && dayUTC === 1 && inSendWindow;
    // Mensual "día N": dispara el día N, o el último día del mes si N no existe (feb, meses de 30)
    const monthlyMatch = reminder.frequency === 'monthly' && reminder.day_of_month != null && (
      reminder.day_of_month === bDayOfMonth ||
      (reminder.day_of_month > bLastDayOfMonth && bDayOfMonth === bLastDayOfMonth)
    );
    const isCustomTime = reminder.reminder_type === 'custom' && inSendWindow && (
      monthlyMatch ||
      (reminder.frequency === 'weekly' && reminder.day_of_week === bDayOfWeek) ||
      (reminder.frequency === 'once'   && reminder.run_date    === bDateStr)
    );
    if (!isDailyTime && !isWeeklyTime && !isCustomTime) continue;

    // Get user phone
    const { data: user } = await supabase
      .from('users')
      .select('phone_number')
      .eq('id', reminder.user_id)
      .single();

    if (!user?.phone_number) continue;

    const to = `whatsapp:${user.phone_number}`;
    let message: string | null = null;

    if (reminder.reminder_type === 'daily_summary') {
      message = await buildDailySummary(reminder.user_id, supabase);
    } else if (reminder.reminder_type === 'weekly_summary') {
      message = await buildWeeklySummary(reminder.user_id, supabase);
    } else if (reminder.reminder_type === 'custom' && reminder.title) {
      message = reminder.title;
    }

    if (!message) continue;

    try {
      // Mensaje iniciado por Luca (no es respuesta a algo que el usuario
      // escribió recientemente) — requiere la plantilla aprobada por WhatsApp.
      await sendWhatsAppProactive(to, message);
      const patch: { last_sent_at: string; is_active?: boolean } = { last_sent_at: now.toISOString() };
      // Un recordatorio "una vez" se desactiva tras enviarse
      if (reminder.reminder_type === 'custom' && reminder.frequency === 'once') {
        patch.is_active = false;
      }
      await supabase.from('reminders').update(patch).eq('id', reminder.id);
      sent++;
    } catch (err) {
      console.error(`[cron] Failed to send to ${to}:`, err);
    }
  }

  return Response.json({ sent });
}

async function buildDailySummary(
  userId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  // Cron fires at 01:00 UTC = 20:00 Bogotá (UTC-5).
  // "Today in Bogotá" starts at 05:00 UTC and ends at 05:00 UTC next day.
  const now = new Date();
  const bogotaOffsetMs = 5 * 60 * 60 * 1000;
  const bogotaNow = new Date(now.getTime() - bogotaOffsetMs);
  const bogotaDay = bogotaNow.toISOString().split('T')[0]; // YYYY-MM-DD in Bogotá
  const start = `${bogotaDay}T05:00:00.000Z`; // midnight Bogotá in UTC
  const end   = new Date(new Date(start).getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { data: txs } = await supabase
    .from('transactions')
    .select('amount, merchant, description')
    .eq('user_id', userId)
    .eq('transaction_type', 'expense')
    .gte('occurred_at', start)
    .lt('occurred_at', end);

  const dashboardUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://finance-tracker.xyz';

  if (!txs?.length) {
    return `📊 *Resumen de hoy*\n\nAún no registraste gastos hoy — ¡buen día de ahorro! 🌟\n\nSi tuviste algún gasto, cuéntaselo a Luca por WhatsApp.\n👉 ${dashboardUrl}/overview`;
  }

  const total = txs.reduce((s, t) => s + t.amount, 0);
  const lines = txs
    .slice(0, 5)
    .map((t) => `• ${t.merchant || t.description || 'Gasto'}: ${formatCOPColoquial(t.amount)}`)
    .join('\n');

  return `📊 *Resumen de hoy*\n\n${lines}${txs.length > 5 ? `\n• +${txs.length - 5} más…` : ''}\n\n💸 Total del día: *${formatCOPColoquial(total)}*\n\n¡Buen trabajo registrando tus gastos! 💪\n👉 ${dashboardUrl}/overview`;
}

async function buildWeeklySummary(
  userId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  const { start, end } = getCurrentWeekRange();

  const { data: txs } = await supabase
    .from('transactions')
    .select('amount, transaction_type, category_id')
    .eq('user_id', userId)
    .gte('occurred_at', start)
    .lte('occurred_at', end);

  const expenses = (txs ?? []).filter((t) => t.transaction_type === 'expense');
  const income = (txs ?? []).filter((t) => t.transaction_type === 'income');

  if (!expenses.length) return null;

  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const savings = totalIncome - totalExpenses;
  const savingsLine = totalIncome > 0
    ? `\n💰 Ahorro neto: *${formatCOPColoquial(savings)}*`
    : '';

  const dashboardUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://finance-tracker.xyz';
  return `📅 *Resumen semanal de Luca*\n\n💸 Gastos esta semana: *${formatCOPColoquial(totalExpenses)}*${savingsLine}\n\n${totalExpenses > 0 ? '¡Sigue así! 💪' : 'Sin gastos esta semana — ¡excelente!'}\n\n👉 ${dashboardUrl}/overview`;
}

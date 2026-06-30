import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppMessage } from '@/lib/twilio/send-message';
import { formatCOPColoquial } from '@/lib/utils/currency';
import { getCurrentWeekRange } from '@/lib/utils/dates';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const hourUTC = now.getUTCHours();
  const dayUTC = now.getUTCDay(); // 0 = Sunday

  const { data: reminders } = await supabase
    .from('reminders')
    .select('id, user_id, reminder_type, last_sent_at')
    .eq('is_active', true);

  if (!reminders?.length) return Response.json({ sent: 0 });

  let sent = 0;

  for (const reminder of reminders) {
    // Avoid duplicate within same day
    if (reminder.last_sent_at) {
      const hoursSince = (now.getTime() - new Date(reminder.last_sent_at).getTime()) / 3_600_000;
      if (hoursSince < 20) continue;
    }

    // Check schedule
    // Cron runs at 01:00 UTC = 8pm Bogota (UTC-5)
    const isDailyTime  = reminder.reminder_type === 'daily_summary'  && hourUTC === 1;
    // dayUTC===1 (lunes UTC) = domingo 8pm Bogota — corrección de zona horaria
    const isWeeklyTime = reminder.reminder_type === 'weekly_summary' && dayUTC === 1 && hourUTC === 1;
    if (!isDailyTime && !isWeeklyTime) continue;

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
    } else {
      message = await buildWeeklySummary(reminder.user_id, supabase);
    }

    if (!message) continue;

    try {
      await sendWhatsAppMessage(to, message);
      await supabase
        .from('reminders')
        .update({ last_sent_at: now.toISOString() })
        .eq('id', reminder.id);
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

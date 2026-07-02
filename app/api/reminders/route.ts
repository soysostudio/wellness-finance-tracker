import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/reminders — create or update a reminder toggle
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    reminder_type: 'daily_summary' | 'weekly_summary' | 'custom';
    is_active?: boolean;
    id?: string;
    // custom-only
    title?: string;
    frequency?: 'once' | 'weekly' | 'monthly';
    day_of_month?: number;
    day_of_week?: number;
    run_date?: string;
  };

  if (!body.reminder_type) {
    return NextResponse.json({ error: 'reminder_type required' }, { status: 400 });
  }

  // ── Custom reminder: crear ────────────────────────────────
  if (body.reminder_type === 'custom' && !body.id) {
    if (!body.title?.trim() || !body.frequency) {
      return NextResponse.json({ error: 'title y frequency son requeridos' }, { status: 400 });
    }
    const { error } = await supabase.from('reminders').insert({
      user_id:       user.id,
      reminder_type: 'custom',
      is_active:     true,
      title:         body.title.trim(),
      frequency:     body.frequency,
      day_of_month:  body.frequency === 'monthly' ? body.day_of_month ?? 1 : null,
      day_of_week:   body.frequency === 'weekly'  ? body.day_of_week  ?? 1 : null,
      run_date:      body.frequency === 'once'    ? body.run_date ?? null : null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── Toggle diario/semanal — idempotente por (user_id, reminder_type) ──
  // Buscamos la fila existente en vez de depender del id del cliente, para que
  // apagar (sin id conocido) nunca sea un no-op silencioso.
  const { data: existing } = await supabase
    .from('reminders')
    .select('id')
    .eq('user_id', user.id)
    .eq('reminder_type', body.reminder_type)
    .maybeSingle();

  let error = null;
  if (existing) {
    const result = await supabase
      .from('reminders')
      .update({ is_active: body.is_active ?? false })
      .eq('id', existing.id);
    error = result.error;
  } else if (body.is_active) {
    const result = await supabase.from('reminders').insert({
      user_id:       user.id,
      reminder_type: body.reminder_type,
      is_active:     true,
    });
    error = result.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// DELETE /api/reminders?id=... — borrar un recordatorio personalizado
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

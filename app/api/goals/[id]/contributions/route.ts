import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/goals/[id]/contributions — registrar aporte (+) o retiro (−)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: goalId } = await params;
  const body = await request.json() as { amount?: number; note?: string };

  if (!body.amount || body.amount === 0) {
    return NextResponse.json({ error: 'amount es requerido' }, { status: 400 });
  }

  // Verificar propiedad + obtener estado actual
  const { data: goal } = await supabase
    .from('goals')
    .select('id, current_amount, target_amount, status')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single();

  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Nuevo saldo (no baja de 0)
  const newAmount = Math.max(0, Number(goal.current_amount) + body.amount);

  const { error: insertErr } = await supabase.from('goal_contributions').insert({
    goal_id: goalId,
    user_id: user.id,
    amount:  body.amount,
    note:    body.note?.trim() || null,
  });

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Autocompletar al alcanzar la meta (sin reactivar si baja)
  const reachedGoal = newAmount >= Number(goal.target_amount);
  const nextStatus =
    reachedGoal && goal.status === 'active' ? 'completed' :
    !reachedGoal && goal.status === 'completed' ? 'active' :
    goal.status;

  const { data: updated, error: updateErr } = await supabase
    .from('goals')
    .update({ current_amount: newAmount, status: nextStatus })
    .eq('id', goalId)
    .select('id, current_amount, status')
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ success: true, goal: updated });
}

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

  if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount === 0) {
    return NextResponse.json({ error: 'El monto debe ser un número distinto de 0' }, { status: 400 });
  }

  // Aporte/retiro atómico: inserta el movimiento y actualiza el saldo en una
  // sola transacción, rechazando retiros que dejen saldo negativo (ver migración 016).
  const { data: updated, error } = await supabase.rpc('apply_goal_contribution', {
    p_goal_id: goalId,
    p_amount:  body.amount,
    p_note:    body.note?.trim() || null,
  });

  if (error) {
    if (error.message.includes('INSUFFICIENT_BALANCE'))
      return NextResponse.json({ error: 'El retiro supera el saldo de la meta.' }, { status: 400 });
    if (error.message.includes('GOAL_NOT_FOUND'))
      return NextResponse.json({ error: 'Meta no encontrada' }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, goal: updated });
}

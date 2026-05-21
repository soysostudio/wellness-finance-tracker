import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/budgets/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as {
    amount_limit?: number;
    alert_at?: number;
    period?: string;
    is_active?: boolean;
  };

  // Verify ownership
  const { data: budget } = await supabase
    .from('budgets')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!budget) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.amount_limit !== undefined) updates.amount_limit = body.amount_limit;
  if (body.alert_at !== undefined)     updates.alert_at     = body.alert_at;
  if (body.period !== undefined)       updates.period       = body.period;
  if (body.is_active !== undefined)    updates.is_active    = body.is_active;

  const { data: updated, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .select('id, amount_limit, alert_at, period')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, budget: updated });
}

// DELETE /api/budgets/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Verify ownership
  const { data: budget } = await supabase
    .from('budgets')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!budget) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

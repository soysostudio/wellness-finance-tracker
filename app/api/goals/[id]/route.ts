import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/goals/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as {
    name?: string;
    description?: string;
    target_amount?: number;
    current_amount?: number;
    target_date?: string | null;
    status?: string;
    icon?: string;
  };

  // Verify ownership
  const { data: goal } = await supabase
    .from('goals')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined)           updates.name           = body.name;
  if (body.description !== undefined)    updates.description    = body.description;
  if (body.target_amount !== undefined)  updates.target_amount  = body.target_amount;
  if (body.current_amount !== undefined) updates.current_amount = body.current_amount;
  if (body.target_date !== undefined)    updates.target_date    = body.target_date;
  if (body.status !== undefined)         updates.status         = body.status;
  if (body.icon !== undefined)           updates.icon           = body.icon;

  const { data: updated, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select('id, name, target_amount, current_amount, status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, goal: updated });
}

// DELETE /api/goals/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Verify ownership
  const { data: goal } = await supabase
    .from('goals')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

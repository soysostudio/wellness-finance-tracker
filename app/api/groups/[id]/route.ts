import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/groups/[id] — update group name/icon/color (owner only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as { name?: string; icon?: string; color?: string };

  const { error } = await supabase
    .from('expense_groups')
    .update({
      ...(body.name  ? { name: body.name.trim() } : {}),
      ...(body.icon  ? { icon: body.icon }        : {}),
      ...(body.color ? { color: body.color }      : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', user.id); // RLS + explicit check

  if (error) return NextResponse.json({ error: 'Could not update group' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/groups/[id] — delete group (owner only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase
    .from('expense_groups')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) return NextResponse.json({ error: 'Could not delete group' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

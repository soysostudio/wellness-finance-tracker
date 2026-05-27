import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
  const admin = createAdminClient();

  // Verify ownership first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group } = await (admin as any)
    .from('expense_groups')
    .select('owner_id')
    .eq('id', id)
    .single();

  if (!group || group.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not found or not owner' }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('expense_groups')
    .update({
      ...(body.name  ? { name: body.name.trim() } : {}),
      ...(body.icon  ? { icon: body.icon }        : {}),
      ...(body.color ? { color: body.color }      : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

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
  const admin = createAdminClient();

  // Verify ownership first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group } = await (admin as any)
    .from('expense_groups')
    .select('owner_id')
    .eq('id', id)
    .single();

  if (!group || group.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not found or not owner' }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('expense_groups')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[DELETE /api/groups/[id]] error:', error);
    return NextResponse.json({ error: 'Could not delete group' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

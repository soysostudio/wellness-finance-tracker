import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE /api/groups/[id]/members/[userId]
// - Owner can remove any member
// - A member can remove themselves (leave group)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: groupId, userId: targetUserId } = await params;

  // Verify the group exists and get owner
  const { data: group } = await supabase
    .from('expense_groups')
    .select('owner_id')
    .eq('id', groupId)
    .single();

  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  const isOwner    = group.owner_id === user.id;
  const isSelf     = targetUserId === user.id;

  if (!isOwner && !isSelf) {
    return NextResponse.json({ error: 'No tienes permiso para hacer esto' }, { status: 403 });
  }

  if (targetUserId === group.owner_id) {
    return NextResponse.json({ error: 'El owner no puede salir del grupo' }, { status: 400 });
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', targetUserId);

  if (error) return NextResponse.json({ error: 'No se pudo eliminar el miembro' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

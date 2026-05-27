import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/groups — list all groups the current user owns or belongs to
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Groups where user is owner
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ownedGroups } = await (supabase as any)
    .from('expense_groups')
    .select('id, name, icon, color, owner_id, created_at, group_members(user_id, role, users(full_name, phone_number))')
    .eq('owner_id', user.id);

  // Groups where user is a member (not owner)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberOf } = await (supabase as any)
    .from('group_members')
    .select('group_id, role, expense_groups(id, name, icon, color, owner_id, created_at, group_members(user_id, role, users(full_name, phone_number)))')
    .eq('user_id', user.id)
    .neq('expense_groups.owner_id', user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberGroups = ((memberOf as any[]) ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any) => m.expense_groups)
    .filter(Boolean);

  // Deduplicate (owner rows also appear in group_members)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allGroupIds = new Set<string>((ownedGroups as any[] ?? []).map((g: any) => String(g.id)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniqueMemberGroups = memberGroups.filter((g) => g && !allGroupIds.has((g as any).id));

  return NextResponse.json({
    owned:  ownedGroups  ?? [],
    member: uniqueMemberGroups,
  });
}

// POST /api/groups — create a new group
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { name?: string; icon?: string; color?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  // Create the group
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupErr } = await (supabase as any)
    .from('expense_groups')
    .insert({
      name:     body.name.trim(),
      icon:     body.icon ?? '👨‍👩‍👧',
      color:    body.color ?? '#6366F1',
      owner_id: user.id,
    })
    .select('id, name, icon, color, owner_id, created_at')
    .single();

  if (groupErr || !group) {
    console.error('[POST /api/groups] insert error:', groupErr);
    return NextResponse.json({ error: groupErr?.message ?? 'Could not create group' }, { status: 500 });
  }

  // Auto-add owner as member with role 'owner'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('group_members').insert({
    group_id: group.id,
    user_id:  user.id,
    role:     'owner',
  });

  return NextResponse.json(group, { status: 201 });
}

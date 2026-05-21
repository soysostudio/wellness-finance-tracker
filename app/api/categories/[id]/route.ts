import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE /api/categories/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Verify ownership — system categories have user_id = null, users can't delete those
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// PATCH /api/categories/[id]
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
    icon?: string;
    color?: string;
    is_income?: boolean;
  };

  // Verify ownership
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined)      updates.name      = body.name;
  if (body.icon !== undefined)      updates.icon      = body.icon;
  if (body.color !== undefined)     updates.color     = body.color;
  if (body.is_income !== undefined) updates.is_income = body.is_income;

  const { data: updated, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select('id, name, slug, icon, color, is_income')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, category: updated });
}

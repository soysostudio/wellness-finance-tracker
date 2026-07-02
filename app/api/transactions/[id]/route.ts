import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveCategoryId } from '@/lib/utils/resolve-category';

// DELETE /api/transactions/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Verify ownership before deleting
  const { data: tx } = await supabase
    .from('transactions')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// PATCH /api/transactions/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as {
    amount?: number;
    description?: string;
    merchant?: string;
    occurred_at?: string;
    category_slug?: string;
  };

  // Verify ownership
  const { data: tx } = await supabase
    .from('transactions')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Build update payload
  const updates: Record<string, unknown> = {};
  if (body.amount !== undefined)      updates.amount      = body.amount;
  if (body.description !== undefined) updates.description = body.description;
  if (body.merchant !== undefined)    updates.merchant    = body.merchant;
  if (body.occurred_at !== undefined) updates.occurred_at = body.occurred_at;

  // Resolve category slug → id (prefiere la categoría propia si hay colisión de slug)
  if (body.category_slug) {
    const categoryId = await resolveCategoryId(supabase, body.category_slug, user.id);
    if (categoryId) updates.category_id = categoryId;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select('id, amount, description, merchant, occurred_at, transaction_type')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, transaction: updated });
}

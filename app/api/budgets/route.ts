import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveCategoryId } from '@/lib/utils/resolve-category';
import { getBudgetPeriodDates } from '@/lib/utils/dates';

// POST /api/budgets — create a new budget
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    category_slug: string;
    amount_limit: number;
    alert_at?: number;
    period?: string;
  };

  if (!body.category_slug || !body.amount_limit) {
    return NextResponse.json({ error: 'category_slug and amount_limit are required' }, { status: 400 });
  }

  // Resolve category slug → id (prefers the user's own category on slug collisions)
  const categoryId = await resolveCategoryId(supabase, body.category_slug, user.id);

  if (!categoryId) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

  // Prevent duplicate active budgets for the same category
  const { data: existing } = await supabase
    .from('budgets')
    .select('id')
    .eq('user_id', user.id)
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'Ya tienes un presupuesto activo para esta categoría. Edítalo en vez de crear otro.' },
      { status: 409 },
    );
  }

  const period = body.period ?? 'monthly';
  const { period_start, period_end } = getBudgetPeriodDates(period);

  const { data: budget, error } = await supabase
    .from('budgets')
    .insert({
      user_id:      user.id,
      category_id:  categoryId,
      amount_limit: body.amount_limit,
      alert_at:     body.alert_at ?? 0.8,
      period,
      period_start,
      period_end,
      is_active:    true,
    })
    .select('id, amount_limit, alert_at, period')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, budget });
}

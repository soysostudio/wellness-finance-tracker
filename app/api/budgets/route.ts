import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  // Resolve category slug → id
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', body.category_slug)
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .single();

  if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

  const { data: budget, error } = await supabase
    .from('budgets')
    .insert({
      user_id:      user.id,
      category_id:  cat.id,
      amount_limit: body.amount_limit,
      alert_at:     body.alert_at ?? 0.8,
      period:       body.period ?? 'monthly',
      is_active:    true,
    })
    .select('id, amount_limit, alert_at, period')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, budget });
}

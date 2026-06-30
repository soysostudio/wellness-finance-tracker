import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveCategoryId } from '@/lib/utils/resolve-category';

// GET /api/transactions?offset=0&limit=50
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);
  const limit  = parseInt(searchParams.get('limit')  ?? '50', 10);
  const type     = searchParams.get('type');     // 'expense' | 'income' | null
  const category = searchParams.get('category');  // category slug | null

  let query = supabase
    .from('transactions')
    .select('id, amount, transaction_type, description, merchant, occurred_at, categories(name, slug, color, icon)')
    .eq('user_id', user.id);

  if (type === 'expense' || type === 'income') {
    query = query.eq('transaction_type', type);
  }

  if (category) {
    const categoryId = await resolveCategoryId(supabase, category, user.id);
    // Unknown slug → no matches rather than silently ignoring the filter
    if (!categoryId) {
      return NextResponse.json({ transactions: [], hasMore: false });
    }
    query = query.eq('category_id', categoryId);
  }

  const { data: transactions, error } = await query
    .order('occurred_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    transactions: transactions ?? [],
    hasMore: (transactions?.length ?? 0) === limit,
  });
}

// POST /api/transactions — create a new transaction manually
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    amount: number;
    transaction_type: 'expense' | 'income';
    description?: string;
    merchant?: string;
    category_slug?: string;
    occurred_at?: string;
  };

  if (!body.amount || !body.transaction_type) {
    return NextResponse.json({ error: 'amount y transaction_type son requeridos' }, { status: 400 });
  }

  // Resolve category slug → id (prefers the user's own category on slug collisions)
  let categoryId: string | null = null;
  if (body.category_slug) {
    categoryId = await resolveCategoryId(supabase, body.category_slug, user.id);
  }

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      user_id:          user.id,
      amount:           body.amount,
      transaction_type: body.transaction_type,
      description:      body.description || null,
      merchant:         body.merchant || null,
      category_id:      categoryId,
      occurred_at:      body.occurred_at || new Date().toISOString(),
    })
    .select('id, amount, transaction_type, description, merchant, occurred_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, transaction });
}

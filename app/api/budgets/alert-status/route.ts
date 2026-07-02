import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentMonthRange } from '@/lib/utils/dates';

// GET /api/budgets/alert-status — ¿algún presupuesto activo está cerca/superado?
// Se consulta desde el cliente (SidebarNav/MobileNav) para no bloquear el
// renderizado del layout del dashboard con esta consulta secundaria.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: budgets } = await supabase
    .from('budgets')
    .select('category_id, amount_limit, alert_at')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (!budgets?.length) return NextResponse.json({ alert: false });

  const { start: monthStart, end: monthEnd } = getCurrentMonthRange();
  const categoryIds = budgets.map((b) => b.category_id).filter(Boolean);

  const { data: txs } = await supabase
    .from('transactions')
    .select('amount, category_id')
    .eq('user_id', user.id)
    .eq('transaction_type', 'expense')
    .in('category_id', categoryIds)
    .gte('occurred_at', monthStart)
    .lte('occurred_at', monthEnd);

  const spent: Record<string, number> = {};
  for (const tx of txs ?? []) {
    if (tx.category_id) spent[tx.category_id] = (spent[tx.category_id] ?? 0) + tx.amount;
  }

  const alert = budgets.some(
    (b) => b.category_id && (spent[b.category_id] ?? 0) / b.amount_limit >= (b.alert_at ?? 0.8)
  );

  return NextResponse.json({ alert });
}

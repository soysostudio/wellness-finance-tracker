import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/goals — create a new goal
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    name: string;
    description?: string;
    icon?: string;
    target_amount: number;
    current_amount?: number;
    target_date?: string | null;
  };

  if (!body.name?.trim() || !body.target_amount) {
    return NextResponse.json({ error: 'name y target_amount son requeridos' }, { status: 400 });
  }

  const { data: goal, error } = await supabase
    .from('goals')
    .insert({
      user_id:        user.id,
      name:           body.name.trim(),
      description:    body.description || null,
      icon:           body.icon || '🎯',
      target_amount:  body.target_amount,
      current_amount: body.current_amount ?? 0,
      target_date:    body.target_date || null,
      status:         'active',
    })
    .select('id, name, target_amount')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, goal });
}

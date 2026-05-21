import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/reminders — create or update a reminder toggle
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    reminder_type: 'daily_summary' | 'weekly_summary';
    is_active: boolean;
    id?: string;
  };

  if (!body.reminder_type) {
    return NextResponse.json({ error: 'reminder_type required' }, { status: 400 });
  }

  let error = null;

  if (body.id) {
    // Update existing reminder
    const result = await supabase
      .from('reminders')
      .update({ is_active: body.is_active })
      .eq('id', body.id)
      .eq('user_id', user.id);
    error = result.error;
  } else if (body.is_active) {
    // Only create if turning on and no record exists yet
    const result = await supabase.from('reminders').insert({
      user_id:       user.id,
      reminder_type: body.reminder_type,
      is_active:     true,
    });
    error = result.error;
  }
  // If turning off and no id → nothing to do

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

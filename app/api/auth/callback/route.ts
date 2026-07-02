import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/overview';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Persist name from signup metadata. El teléfono NO se guarda aquí:
      // debe verificarse por WhatsApp entrante (ver /api/phone/verify/start).
      const meta = data.user.user_metadata ?? {};
      const updates: Record<string, string> = {};
      if (meta.full_name) updates.full_name = meta.full_name;

      const [profileResult] = await Promise.all([
        Object.keys(updates).length > 0
          ? supabase.from('users').update(updates).eq('id', data.user.id)
          : Promise.resolve(null),
        // Auto-create default daily reminder for new users (idempotent — skips if exists)
        supabase.from('reminders').select('id').eq('user_id', data.user.id).eq('reminder_type', 'daily_summary').maybeSingle()
          .then(({ data: existing }) => {
            if (!existing) {
              return supabase.from('reminders').insert({
                user_id:       data.user.id,
                reminder_type: 'daily_summary',
                is_active:     true,
              });
            }
          }),
      ]);
      void profileResult;

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

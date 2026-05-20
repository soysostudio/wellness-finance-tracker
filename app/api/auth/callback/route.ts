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
      // Persist name + phone from signup metadata server-side.
      // This works regardless of which browser/device opens the magic link,
      // unlike the localStorage approach.
      const meta = data.user.user_metadata ?? {};
      const updates: Record<string, string> = {};
      if (meta.full_name)    updates.full_name    = meta.full_name;
      if (meta.phone_number) updates.phone_number = meta.phone_number;

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('users')
          .update(updates)
          .eq('id', data.user.id);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

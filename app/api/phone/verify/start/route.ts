import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/utils/phone';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://finance-tracker.xyz';
// Número de WhatsApp de Luca (sandbox/producción de Twilio)
const LUCA_WHATSAPP = process.env.NEXT_PUBLIC_LUCA_WHATSAPP ?? '+1 555 961 3540';

// POST /api/phone/verify/start — genera un código para verificar propiedad del número.
// No envía nada saliente: el usuario debe enviar el código a Luca DESDE ese número.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { phone?: string };
  if (!body.phone?.trim()) {
    return NextResponse.json({ error: 'Ingresa un número' }, { status: 400 });
  }

  const phone = normalizePhone(body.phone);

  // ¿Ya está vinculado a OTRA cuenta?
  const { data: taken } = await supabase
    .from('users')
    .select('id')
    .eq('phone_number', phone)
    .maybeSingle();

  if (taken && taken.id !== user.id) {
    return NextResponse.json(
      { error: 'Ese número ya está vinculado a otra cuenta de Luca.' },
      { status: 409 },
    );
  }

  // Código corto y legible (evita 0/O, 1/I)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = 'LUCA-' + Array.from({ length: 4 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

  // Reemplaza cualquier código pendiente de este usuario
  await supabase.from('phone_verifications').delete().eq('user_id', user.id);
  const { error } = await supabase.from('phone_verifications').insert({
    user_id:      user.id,
    phone_number: phone,
    code,
    expires_at:   expiresAt,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    code,
    phone,
    whatsapp: LUCA_WHATSAPP,
    wa_link: `https://wa.me/${LUCA_WHATSAPP.replace(/\D/g, '')}?text=${encodeURIComponent(code)}`,
    base_url: BASE_URL,
  });
}

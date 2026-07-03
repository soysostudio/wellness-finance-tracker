import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWhatsAppProactive } from '@/lib/twilio/send-message';
import { normalizePhone } from '@/lib/utils/phone';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://finance-tracker.xyz';

// POST /api/groups/[id]/members — add a member by phone number (owner only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: groupId } = await params;

  // Verify requester is the group owner
  const { data: group } = await supabase
    .from('expense_groups')
    .select('id, name, icon, owner_id')
    .eq('id', groupId)
    .eq('owner_id', user.id)
    .single();

  if (!group) return NextResponse.json({ error: 'Group not found or not owner' }, { status: 404 });

  const body = await request.json() as { phone_number?: string };
  if (!body.phone_number?.trim()) {
    return NextResponse.json({ error: 'phone_number is required' }, { status: 400 });
  }

  const phone = normalizePhone(body.phone_number);

  // Find the target user by phone number
  const { data: targetUser } = await supabase
    .from('users')
    .select('id, full_name, phone_number')
    .eq('phone_number', phone)
    .maybeSingle();

  if (targetUser && targetUser.id === user.id) {
    return NextResponse.json({ error: 'No puedes agregarte a ti mismo' }, { status: 400 });
  }

  // Nombre del dueño para el mensaje de invitación
  const { data: ownerProfile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single();
  const ownerName = ownerProfile?.full_name?.split(' ')[0] ?? 'Alguien';

  // Respuesta genérica: nunca revelamos si el número está registrado (evita oráculo)
  const genericOk = NextResponse.json(
    { success: true, message: 'Listo. Si el número usa Luca se agregará; si no, le llegará una invitación.' },
    { status: 200 },
  );

  if (targetUser) {
    // Ya usa Luca → agregar si no es miembro (idempotente) e invitar por WhatsApp
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', targetUser.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from('group_members').insert({ group_id: groupId, user_id: targetUser.id, role: 'member' });
      const memberName = targetUser.full_name?.split(' ')[0] ?? 'tú';
      if (targetUser.phone_number) {
        // Invitación proactiva — requiere plantilla aprobada por WhatsApp
        sendWhatsAppProactive(
          `whatsapp:${targetUser.phone_number}`,
          `👋 ¡Hola, ${memberName}! *${ownerName}* te agregó al grupo *${group.icon} ${group.name}* en Luca.\n\n` +
          `Para registrar gastos del grupo, solo mencionalo:\n` +
          `_"40 mil en mercado para ${group.name}"_\n\n` +
          `Ver el grupo: ${BASE_URL}/groups/${group.id}`
        ).catch(console.error);
      }
    }
    return genericOk;
  }

  // No usa Luca todavía → guardar invitación pendiente (se une al registrarse)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('pending_group_invitations')
    .upsert({ phone_number: phone, group_id: groupId, invited_by: user.id }, { onConflict: 'phone_number,group_id' })
    .then(() => {}, () => {});

  return genericOk;
}

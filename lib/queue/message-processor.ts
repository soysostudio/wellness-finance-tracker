import { createAdminClient } from '@/lib/supabase/admin';
import { extractFromMessage } from '@/lib/openai/extract-transaction';
import { buildContextWindow, compressConversationIfNeeded } from '@/lib/openai/conversation-memory';
import { transcribeAudio } from '@/lib/openai/transcribe-audio';
import { sendWhatsAppMessage } from '@/lib/twilio/send-message';
import { formatCOPColoquial } from '@/lib/utils/currency';
import { getCurrentMonthRange } from '@/lib/utils/dates';
import { SYSTEM_CATEGORIES } from '@/lib/utils/categories';
import type { TwilioWebhookPayload } from '@/types/whatsapp';
import type { AdminClient } from '@/lib/supabase/admin';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://finance-tracker.xyz';

const ONBOARDING_MESSAGE = `¡Hola! 👋 Soy Luca, tu asistente de finanzas personales.

Para empezar, crea tu cuenta gratis en: ${BASE_URL}/signup

Solo toma 2 minutos. Después me cuentas tus gastos y yo me encargo del resto. ¡Te espero! 💪`;

export async function processIncomingMessage(payload: TwilioWebhookPayload): Promise<void> {
  const supabase = createAdminClient();
  const phoneNumber = payload.From.replace('whatsapp:', '');

  // 1. Find user by phone number
  const { data: userRaw } = await supabase
    .from('users')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();
  const user = userRaw as import('@/types/database').User | null;

  if (!user) {
    await sendWhatsAppMessage(payload.From, ONBOARDING_MESSAGE);
    return;
  }

  // 1b. Handle voice note — transcribe and confirm with user before processing
  const hasAudio = payload.NumMedia > 0 && payload.MediaContentType0?.startsWith('audio') && payload.MediaUrl0;
  if (hasAudio) {
    try {
      const transcription = await transcribeAudio(payload.MediaUrl0!);
      if (!transcription) {
        await sendWhatsAppMessage(payload.From, 'No pude entender la nota de voz 😕 ¿Me lo escribes?');
        return;
      }
      // Confirm transcription with user, then process as text
      const confirmMsg = `🎤 Entendí: _"${transcription}"_\n\n¿Lo registro? Responde *sí* para confirmarlo o corrígeme si me equivoqué.`;
      await sendWhatsAppMessage(payload.From, confirmMsg);
      // Store transcription as the pending body for next message (via conversation context)
      // For now, save it as an inbound message so the next "sí" has context
      payload.Body = transcription;
    } catch (err) {
      console.error('[message-processor] Audio transcription error:', err);
      await sendWhatsAppMessage(payload.From, 'No pude procesar la nota de voz 😕 ¿Me lo escribes?');
      return;
    }
  }

  // 2. Load or create conversation + fetch category rules + custom categories + user groups in parallel
  const [convResult, rulesResult, customCatsResult, groupsResult] = await Promise.all([
    supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .eq('phone_number', phoneNumber)
      .single(),
    supabase
      .from('category_rules')
      .select('keyword, category_slug')
      .eq('user_id', user.id),
    supabase
      .from('categories')
      .select('id, slug, name, is_income')
      .eq('user_id', user.id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('group_members')
      .select('expense_groups(id, name, icon)')
      .eq('user_id', user.id),
  ]);

  type CustomCatRow = { id: string; slug: string; name: string; is_income: boolean | null };
  type GroupRow = { id: string; name: string; icon: string };
  const categoryRules    = rulesResult.data ?? [];
  const customCategories = (customCatsResult.data ?? []) as CustomCatRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userGroups: GroupRow[] = ((groupsResult as any).data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any) => m.expense_groups)
    .filter((g: GroupRow | null): g is GroupRow => !!g);
  let conversationId: string;

  if (convResult.data) {
    conversationId = convResult.data.id;
    void Promise.resolve(
      supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId)
    ).catch(console.error);
  } else {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        phone_number: phoneNumber,
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    conversationId = newConv!.id;
  }

  // 3. Save inbound message
  const { data: savedMessage } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      user_id: user.id,
      twilio_sid: payload.MessageSid,
      direction: 'inbound',
      body: payload.Body,
    })
    .select('id')
    .single();

  // 3b. Onboarding flow — if user has never been onboarded, guide them first
  if (!user.onboarded_at) {
    const handled = await handleOnboarding(user, payload.Body, conversationId, supabase, phoneNumber);
    if (handled) {
      await Promise.all([
        supabase.from('messages').insert({
          conversation_id: conversationId,
          user_id: user.id,
          direction: 'outbound',
          body: handled,
          processed_at: new Date().toISOString(),
        }),
        sendWhatsAppMessage(payload.From, handled),
      ]);
      return;
    }
    // If onboarding just completed, fall through to normal processing
  }

  // 4. Build context + call AI
  const context = await buildContextWindow(conversationId, supabase);
  let replyText: string;

  try {
    const result = await extractFromMessage(payload.Body, context.messages, user, {
      categoryRules,
      customCategories,
      userGroups,
    });

    // 5. Execute intent
    switch (result.intent) {
      case 'log_expense':
      case 'log_income': {
        if (!result.transaction) {
          replyText = result.reply_draft;
          break;
        }

        // ── Category resolution ─────────────────────────────────────────────
        // Helper: lowercase + strip accents for flexible comparison
        const normCat = (s: string) =>
          s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

        const aiSlug           = (result.transaction.category_slug ?? 'otros').toLowerCase();
        const normalizedAiSlug = normCat(aiSlug.replace(/-/g, ' '));

        // 1. Match against already-loaded user custom categories (in memory, 0 extra DB calls).
        //    Compares both slug and name with accent-normalization to tolerate AI slug variations
        //    (e.g. AI says "deporte" but user has "Deportes", or "futbol" vs "Fútbol").
        type CustomCat = { id: string; slug: string; name: string; is_income: boolean | null };
        const matchedCustom = (customCategories as CustomCat[]).find((cat) =>
          normCat(cat.slug.replace(/-/g, ' ')) === normalizedAiSlug ||
          normCat(cat.name) === normalizedAiSlug
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let categoryId: any = (matchedCustom?.id as string | undefined) ?? null;

        // 2. No custom match — check system categories (user_id IS NULL)
        if (!categoryId) {
          const { data: sysCat } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', aiSlug)
            .is('user_id', null)
            .maybeSingle();
          categoryId = sysCat?.id ?? null;
        }

        // 3. Still nothing — create a new custom category
        if (!categoryId && aiSlug && aiSlug !== 'otros') {
          const newSlug  = aiSlug.replace(/\s+/g, '-');
          const newName  = newSlug.charAt(0).toUpperCase() + newSlug.slice(1).replace(/-/g, ' ');
          const PALETTE  = ['#D4E8A0', '#C8CAD8', '#E8673C', '#4A7C6F', '#F5C540', '#FEFF6E', '#FFB0FF', '#ADDEFF'];
          const { data: newCat } = await supabase
            .from('categories')
            .insert({
              user_id:   user.id,
              slug:      newSlug,
              name:      newName,
              icon:      result.transaction.category_icon ?? '📦',
              color:     PALETTE[Math.floor(Math.random() * PALETTE.length)],
              is_income: result.intent === 'log_income',
            })
            .select('id')
            .maybeSingle();
          categoryId = (newCat?.id as string | undefined) ?? null;
        }

        // ── Inline group resolution ─────────────────────────────────────────
        // If the AI detected a group mention inline (e.g. "para familia"),
        // fuzzy-match it against the user's groups and use that group_id.
        const normStr = (s: string) =>
          s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

        let resolvedGroupId: string | null = null;
        let resolvedGroup: GroupRow | null  = null;

        if (result.transaction.group_name) {
          const targetName = normStr(result.transaction.group_name);
          const inlineMatch = userGroups.find(
            (g) => normStr(g.name) === targetName ||
                   normStr(g.name).includes(targetName) ||
                   targetName.includes(normStr(g.name))
          );
          if (inlineMatch) {
            resolvedGroupId = inlineMatch.id;
            resolvedGroup   = inlineMatch;
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from('transactions').insert({
          user_id:          user.id,
          category_id:      categoryId,
          amount:           result.transaction.amount,
          currency:         result.transaction.currency,
          description:      result.transaction.description,
          merchant:         result.transaction.merchant,
          transaction_type: result.intent === 'log_income' ? 'income' : 'expense',
          source:           'whatsapp',
          raw_input:        payload.Body,
          occurred_at:      result.transaction.occurred_at,
          message_id:       savedMessage?.id ?? null,
          confidence:       result.confidence,
          is_recurring:     result.transaction.is_recurring,
          group_id:         resolvedGroupId,
        } as any);

        // Check budget threshold (personal only)
        if (result.intent === 'log_expense' && categoryId && !resolvedGroupId) {
          await checkBudgetAlert(user.id, categoryId, result.transaction.amount, supabase, payload.From);
        }

        // If expense was tagged to a group, mention it in the reply
        if (resolvedGroup) {
          replyText = result.reply_draft.replace(
            /Ver resumen:.*$/,
            `Anotado para *${resolvedGroup.icon} ${resolvedGroup.name}* 👥 Ver grupo: ${BASE_URL}/overview`
          );
          if (replyText === result.reply_draft) {
            replyText = `${result.reply_draft}\nAnotado para *${resolvedGroup.icon} ${resolvedGroup.name}* 👥`;
          }
        } else {
          replyText = result.reply_draft;
        }
        break;
      }

      case 'clarify_merchant': {
        // Store the pending transaction temporarily in the reply and wait for user confirmation
        replyText = result.reply_draft;
        break;
      }

      case 'clarify_category': {
        // Luca asks the user where to classify an ambiguous item.
        // Also save a category_rule so next time the same item goes straight to this category.
        if (result.clarification?.original && result.transaction?.category_slug) {
          void Promise.resolve(
            (supabase.from('category_rules') as ReturnType<typeof supabase.from>).upsert({
              user_id:       user.id,
              keyword:       result.clarification.original.toLowerCase(),
              category_slug: result.transaction.category_slug,
            }, { onConflict: 'user_id,keyword' })
          ).catch(console.error);
        }
        replyText = result.reply_draft;
        break;
      }

      case 'delete_last_transaction': {
        // Find the most recent expense transaction for this user
        const { data: lastTx } = await supabase
          .from('transactions')
          .select('id, amount, description, merchant')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!lastTx) {
          replyText = 'No encontré ningún gasto reciente para borrar 🤔';
          break;
        }

        await supabase.from('transactions').delete().eq('id', lastTx.id);
        const label = lastTx.merchant || lastTx.description || 'ese gasto';
        replyText = `¡Listo! Borré ${formatCOPColoquial(lastTx.amount)} de ${label} 🗑️`;
        break;
      }

      case 'edit_last_transaction': {
        const { data: lastTx } = await supabase
          .from('transactions')
          .select('id, amount, description, merchant, category_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!lastTx || !result.edit) {
          replyText = result.reply_draft;
          break;
        }

        if (result.edit.field === 'amount' && result.edit.new_value) {
          await supabase
            .from('transactions')
            .update({ amount: Number(result.edit.new_value) })
            .eq('id', lastTx.id);
          replyText = `¡Actualizado! El gasto quedó en ${formatCOPColoquial(Number(result.edit.new_value))} ✏️`;
        } else if (result.edit.field === 'description' && result.edit.new_value) {
          const newDesc = String(result.edit.new_value);
          await supabase
            .from('transactions')
            .update({ description: newDesc, merchant: newDesc })
            .eq('id', lastTx.id);
          replyText = `¡Corregido! Lo dejé como "${newDesc}" ✏️`;
        } else if (result.edit.field === 'category' && result.edit.new_value) {
          const { data: cat } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', String(result.edit.new_value))
            .or(`user_id.is.null,user_id.eq.${user.id}`)
            .single();
          if (cat) {
            await supabase
              .from('transactions')
              .update({ category_id: cat.id })
              .eq('id', lastTx.id);
            const catName = SYSTEM_CATEGORIES.find((c) => c.slug === result.edit!.new_value)?.name ?? result.edit.new_value;
            replyText = `¡Listo! Moví ese gasto a ${catName} ✏️`;
          } else {
            replyText = result.reply_draft;
          }
        } else {
          replyText = result.reply_draft;
        }
        break;
      }

      case 'query_spending':
      case 'query_balance': {
        const range = getCurrentMonthRange();

        type TxRow = { amount: number; categories: { slug: string; name: string } | { slug: string; name: string }[] | null };
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, categories(slug, name)')
          .eq('user_id', user.id)
          .eq('transaction_type', 'expense')
          .gte('occurred_at', range.start)
          .lte('occurred_at', range.end) as { data: TxRow[] | null; error: unknown };

        const total = transactions?.reduce((sum, t) => sum + t.amount, 0) ?? 0;

        // Build top-3 category breakdown
        const byCat: Record<string, { name: string; total: number }> = {};
        for (const t of transactions ?? []) {
          const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
          const slug = cat?.slug ?? 'otros';
          const name = cat?.name ?? 'Otros';
          if (!byCat[slug]) byCat[slug] = { name, total: 0 };
          byCat[slug].total += t.amount;
        }

        const top3 = Object.values(byCat)
          .sort((a, b) => b.total - a.total)
          .slice(0, 3);

        const breakdown = top3.length > 0
          ? '\n' + top3.map((c) => {
              const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
              return `• ${c.name}: ${formatCOPColoquial(c.total)} (${pct}%)`;
            }).join('\n')
          : '';

        const period = result.query?.period === 'today' ? 'hoy'
          : result.query?.period === 'this_week' ? 'esta semana'
          : 'este mes';

        replyText = `${period === 'hoy' ? 'Hoy' : period === 'esta semana' ? 'Esta semana' : 'Este mes'} llevas ${formatCOPColoquial(total)} en gastos 📊${breakdown}\n\nVer detalle: ${BASE_URL}/overview`;
        break;
      }

      case 'set_goal': {
        if (!result.goal) {
          replyText = result.reply_draft;
          break;
        }

        await supabase.from('goals').insert({
          user_id: user.id,
          name: result.goal.name,
          target_amount: result.goal.target_amount,
          target_date: result.goal.target_date ?? null,
        });

        replyText = result.reply_draft;
        break;
      }

      case 'set_budget': {
        if (!result.budget) {
          replyText = result.reply_draft;
          break;
        }

        // Resolve category_id
        const { data: budgetCat } = await supabase
          .from('categories')
          .select('id, name')
          .eq('slug', result.budget.category_slug)
          .or(`user_id.is.null,user_id.eq.${user.id}`)
          .single();

        if (!budgetCat) {
          replyText = `No reconocí esa categoría. ¿Me puedes dar más detalles? 🤔`;
          break;
        }

        // Upsert: replace active budget for same category if one already exists
        const { data: existing } = await supabase
          .from('budgets')
          .select('id')
          .eq('user_id', user.id)
          .eq('category_id', budgetCat.id)
          .eq('is_active', true)
          .single();

        if (existing) {
          await supabase
            .from('budgets')
            .update({
              amount_limit: result.budget.amount_limit,
              alert_at: result.budget.alert_at ?? 0.8,
            })
            .eq('id', existing.id);
        } else {
          const { start: pStart, end: pEnd } = getCurrentMonthRange();
          await supabase.from('budgets').insert({
            user_id:      user.id,
            category_id:  budgetCat.id,
            amount_limit: result.budget.amount_limit,
            period:       result.budget.period ?? 'monthly',
            period_start: pStart,
            period_end:   pEnd,
            alert_at:     result.budget.alert_at ?? 0.8,
            is_active:    true,
          });
        }

        const action = existing ? 'actualicé' : 'creé';
        replyText = `¡Listo! ${action === 'creé' ? 'Creé' : 'Actualicé'} tu presupuesto de ${budgetCat.name}: ${formatCOPColoquial(result.budget.amount_limit)} al mes 📊 Ver presupuestos: ${BASE_URL}/budgets`;
        break;
      }

      case 'create_group': {
        if (!result.new_group?.name) {
          replyText = result.reply_draft;
          break;
        }

        // PASO 1: pending = true → Luca está recolectando info, no crear aún
        if (result.new_group.pending) {
          replyText = result.reply_draft;
          break;
        }

        // PASO 2: pending = false → crear el grupo con toda la info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newGroup, error: createErr } = await (supabase as any)
          .from('expense_groups')
          .insert({
            name:     result.new_group.name,
            icon:     result.new_group.icon ?? '👥',
            color:    '#6366F1',
            owner_id: user.id,
            budget:   result.new_group.budget   ?? null,
            end_date: result.new_group.end_date  ?? null,
          })
          .select('id, name, icon')
          .single() as { data: GroupRow | null; error: unknown };

        if (createErr || !newGroup) {
          console.error('[message-processor] create_group error:', createErr);
          replyText = 'No pude crear el grupo 😕 Intenta desde tu dashboard: ' + BASE_URL + '/groups';
          break;
        }

        // Auto-add owner as member
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('group_members').insert({
          group_id: newGroup.id,
          user_id:  user.id,
          role:     'owner',
        });

        // Invite members by phone number (fire-and-forget, best effort)
        const memberPhones = result.new_group.members ?? [];
        let membersAdded = 0;
        let membersPending = 0;
        const ownerName = user.full_name?.split(' ')[0] ?? 'Alguien';

        for (const phone of memberPhones) {
          const { data: memberUser } = await supabase
            .from('users')
            .select('id, full_name, phone_number')
            .eq('phone_number', phone)
            .maybeSingle();

          if (memberUser) {
            // User already has a Luca account → add directly to group
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: memErr } = await (supabase as any).from('group_members').insert({
              group_id: newGroup.id,
              user_id:  memberUser.id,
              role:     'member',
            });

            if (!memErr) {
              membersAdded++;
              const memberName = memberUser.full_name?.split(' ')[0] ?? 'tú';
              sendWhatsAppMessage(
                `whatsapp:${phone}`,
                `👋 ¡Hola, ${memberName}! *${ownerName}* te agregó al grupo *${newGroup.icon} ${newGroup.name}* en Luca.\n\nPara registrar gastos del grupo escríbeme:\n_"40 mil en [gasto] para ${newGroup.name}"_\n\nVer el grupo: ${BASE_URL}/groups`
              ).catch(console.error);
            }
          } else {
            // User doesn't have a Luca account yet → store pending invite + send signup invite
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from('pending_group_invitations')
              .upsert(
                { phone_number: phone, group_id: newGroup.id, invited_by: user.id },
                { onConflict: 'phone_number,group_id' }
              )
              .catch(console.error);

            membersPending++;
            sendWhatsAppMessage(
              `whatsapp:${phone}`,
              `👋 ¡Hola! *${ownerName}* te invitó al grupo *${newGroup.icon} ${newGroup.name}* en Luca, su asistente de finanzas por WhatsApp.\n\n` +
              `Crea tu cuenta gratis (solo 2 minutos) y te unirás automáticamente al grupo:\n${BASE_URL}/signup\n\n` +
              `Con Luca puedes registrar gastos por chat, ver reportes y llevar tus finanzas sin esfuerzo 💚`
            ).catch(console.error);
          }
        }

        const memberLine = (membersAdded + membersPending) > 0
          ? `\n\n${membersAdded > 0 ? `✅ Ya agregué a ${membersAdded} ${membersAdded === 1 ? 'miembro' : 'miembros'} con cuenta Luca.` : ''}${membersPending > 0 ? `\n📲 Le envié invitación de registro a ${membersPending} ${membersPending === 1 ? 'persona' : 'personas'} — se unirán automáticamente cuando creen su cuenta.` : ''}`
          : '';

        replyText = `¡Listo! Creé el grupo *${newGroup.icon} ${newGroup.name}* 🎉${memberLine}\n\nPara anotar gastos del grupo, solo mencionalo:\n_"40 mil en mercado para ${newGroup.name}"_\n\nVer grupo: ${BASE_URL}/groups`;
        break;
      }

default:
        replyText = result.reply_draft;
    }

    void Promise.resolve(
      savedMessage?.id
        ? supabase
            .from('messages')
            .update({ intent: result.intent, processed_at: new Date().toISOString() })
            .eq('id', savedMessage.id)
        : Promise.resolve()
    ).catch(console.error);

  } catch (err) {
    console.error('[message-processor] AI error:', err);
    replyText = 'Uy, tuve un problema procesando eso. ¿Me lo repites? 😅';
  }

  // 6. Save outbound message + send WhatsApp reply in parallel
  await Promise.all([
    supabase.from('messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      direction: 'outbound',
      body: replyText,
      processed_at: new Date().toISOString(),
    }),
    sendWhatsAppMessage(payload.From, replyText),
  ]);

  // 7. Compress conversation if needed (fire-and-forget)
  compressConversationIfNeeded(conversationId, supabase).catch(console.error);
}

/**
 * Multi-step onboarding flow for new users.
 * Returns the reply to send, or null if onboarding is complete and normal flow should proceed.
 * Steps are tracked by counting prior inbound messages in the conversation.
 */
async function handleOnboarding(
  user: { id: string; full_name: string | null },
  inboundText: string,
  conversationId: string,
  supabase: AdminClient,
  phoneNumber: string
): Promise<string | null> {
  const firstName = user.full_name?.split(' ')[0] ?? 'tú';

  // Count prior inbound messages to determine step
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('direction', 'inbound');

  const step = count ?? 0; // 0 = first message, 1 = income answer, 2 = categories, 3 = goal

  if (step === 0) {
    // Step 1: Welcome + ask for monthly income
    return `¡Hola, ${firstName}! 🎉 Ya tienes tu cuenta lista en Luca.

Voy a hacerte 3 preguntas rápidas para personalizarte la experiencia. Primero: ¿cuánto ganas aproximadamente al mes? (ej: "2 millones", "1.5 millones", "800 mil")`;
  }

  if (step === 1) {
    // Step 2: Parse income from answer and ask about main categories
    const incomeMatch = inboundText.match(/[\d.,]+/);
    let income = 0;
    if (incomeMatch) {
      const raw = incomeMatch[0].replace(/\./g, '').replace(',', '.');
      income = parseFloat(raw);
      // Handle "millones" / "mil"
      if (/millón|millon/i.test(inboundText)) income *= 1_000_000;
      else if (/mil/i.test(inboundText) && income < 1_000) income *= 1_000;
    }

    if (income > 0) {
      void Promise.resolve(
        supabase.from('users').update({ monthly_income: income }).eq('id', user.id)
      ).catch(console.error);
    }

    return `Perfecto 💪 ¿En qué sueles gastar más? Cuéntame las 2-3 categorías principales (comida, transporte, entretenimiento, hogar, etc.)`;
  }

  if (step === 2) {
    // Step 3: Acknowledge categories + ask for savings goal
    return `Genial, ya tengo una idea de tu perfil 📊 Última pregunta: ¿tienes alguna meta de ahorro? (ej: "vacaciones a Cartagena", "fondo de emergencia", "cambiar el carro") Si no, escribe "ninguna".`;
  }

  if (step === 3) {
    // Step 4: Save goal if mentioned + mark onboarding complete
    const noGoal = /ninguna|no|nada|sin meta/i.test(inboundText);
    if (!noGoal && inboundText.trim().length > 3) {
      void Promise.resolve(
        supabase.from('goals').insert({
          user_id: user.id,
          name: inboundText.trim(),
          target_amount: 0, // amount TBD by user later
        })
      ).catch(console.error);
    }

    // Mark onboarded
    await supabase
      .from('users')
      .update({ onboarded_at: new Date().toISOString() })
      .eq('id', user.id);

    // Check for pending group invitations and auto-join
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingInvites } = await (supabase as any)
      .from('pending_group_invitations')
      .select('group_id, expense_groups(name, icon), invited_by, users!invited_by(full_name)')
      .eq('phone_number', phoneNumber);

    let groupJoinLine = '';
    if (pendingInvites && pendingInvites.length > 0) {
      const joinedNames: string[] = [];
      for (const invite of pendingInvites as any[]) {
        const group = invite.expense_groups;
        if (!group) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('group_members').insert({
          group_id: invite.group_id,
          user_id:  user.id,
          role:     'member',
        }).catch(console.error);

        joinedNames.push(`${group.icon} ${group.name}`);
      }

      // Clean up pending invites
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('pending_group_invitations')
        .delete()
        .eq('phone_number', phoneNumber)
        .catch(console.error);

      if (joinedNames.length > 0) {
        groupJoinLine = `\n\n🎉 Por cierto, te uní automáticamente a ${joinedNames.length === 1 ? 'este grupo' : 'estos grupos'}: *${joinedNames.join('*, *')}*. Ya puedes registrar gastos para ellos.`;
      }
    }

    return `¡Listo, ${firstName}! Ya estoy configurado para ti 🚀

Desde ahora solo escríbeme tus gastos e ingresos y yo me encargo del resto. Por ejemplo: _"gasté 45 mil en Rappi"_ o _"recibí mi quincena, 2.5 millones"_.${groupJoinLine}

Ver tu dashboard: ${BASE_URL}/overview`;
  }

  // Step > 3 but onboarded_at still null — edge case, just complete onboarding
  await supabase
    .from('users')
    .update({ onboarded_at: new Date().toISOString() })
    .eq('id', user.id);

  return null; // fall through to normal processing
}

async function checkBudgetAlert(
  userId: string,
  categoryId: string,
  newAmount: number,
  supabase: AdminClient,
  to: string
): Promise<void> {
  const { start, end } = getCurrentMonthRange();

  const { data: budget } = await supabase
    .from('budgets')
    .select('id, amount_limit, alert_at')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .single();

  if (!budget) return;

  const { data: txs } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('transaction_type', 'expense')
    .gte('occurred_at', start)
    .lte('occurred_at', end);

  const spent = (txs?.reduce((s, t) => s + t.amount, 0) ?? 0) + newAmount;
  const ratio = spent / budget.amount_limit;

  if (ratio >= (budget.alert_at ?? 0.8) && ratio < 1) {
    const pct = Math.round(ratio * 100);
    await sendWhatsAppMessage(
      to,
      `⚠️ Ojo: ya llevas el ${pct}% de tu presupuesto en esta categoría (${formatCOPColoquial(spent)} de ${formatCOPColoquial(budget.amount_limit)}).\n\nVer presupuestos: ${BASE_URL}/budgets`
    );
  } else if (ratio >= 1) {
    await sendWhatsAppMessage(
      to,
      `🚨 ¡Superaste tu presupuesto en esta categoría! Llevas ${formatCOPColoquial(spent)} de ${formatCOPColoquial(budget.amount_limit)}.\n\nVer presupuestos: ${BASE_URL}/budgets`
    );
  }
}

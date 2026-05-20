import type { AdminClient } from '@/lib/supabase/admin';
import type OpenAI from 'openai';
import { getOpenAIClient } from './client';
import { COMPRESSION_PROMPT } from './prompts';

const MAX_RECENT_MESSAGES = 8;
const COMPRESSION_THRESHOLD = 20;

export interface ConversationContext {
  messages: OpenAI.ChatCompletionMessageParam[];
}

export async function buildContextWindow(
  conversationId: string,
  supabase: AdminClient
): Promise<ConversationContext> {
  const [{ data: conversation }, { data: recentMessages }] = await Promise.all([
    supabase
      .from('conversations')
      .select('context_summary')
      .eq('id', conversationId)
      .single(),
    supabase
      .from('messages')
      .select('direction, body, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(MAX_RECENT_MESSAGES),
  ]);

  const messages: OpenAI.ChatCompletionMessageParam[] = [];

  if (conversation?.context_summary) {
    messages.push({
      role: 'system',
      content: `Resumen de conversaciones anteriores: ${conversation.context_summary}`,
    });
  }

  for (const msg of (recentMessages ?? []).reverse()) {
    messages.push({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.body,
    });
  }

  return { messages };
}

export async function compressConversationIfNeeded(
  conversationId: string,
  supabase: AdminClient
): Promise<void> {
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId);

  if (!count || count <= COMPRESSION_THRESHOLD) return;

  const { data: oldMessages } = await supabase
    .from('messages')
    .select('direction, body')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .range(0, COMPRESSION_THRESHOLD - 1);

  if (!oldMessages?.length) return;

  const transcript = oldMessages
    .map((m) => `${m.direction === 'inbound' ? 'Usuario' : 'Luca'}: ${m.body}`)
    .join('\n');

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    max_tokens: 200,
    messages: [
      { role: 'system', content: COMPRESSION_PROMPT },
      { role: 'user', content: transcript },
    ],
  });

  const summary = response.choices[0]?.message?.content ?? '';
  if (!summary) return;

  await supabase
    .from('conversations')
    .update({ context_summary: summary })
    .eq('id', conversationId);
}

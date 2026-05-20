import { getOpenAIClient } from './client';
import { buildSystemPrompt } from './prompts';
import type { MessageIntent } from '@/types/database';
import type { User } from '@/types/database';
import type OpenAI from 'openai';

export interface ExtractionResult {
  intent: MessageIntent;
  confidence: number;
  transaction?: {
    amount: number;
    currency: string;
    description: string;
    merchant: string | null;
    category_slug: string;
    occurred_at: string;
    is_recurring: boolean;
  };
  query?: {
    period?: 'today' | 'this_week' | 'this_month' | 'last_month';
    category_slug?: string;
  };
  goal?: {
    name: string;
    target_amount: number;
    target_date?: string;
  };
  reply_draft: string;
}

export async function extractFromMessage(
  userMessage: string,
  contextMessages: OpenAI.ChatCompletionMessageParam[],
  user: User
): Promise<ExtractionResult> {
  const openai = getOpenAIClient();

  const systemPrompt = buildSystemPrompt({
    userName: user.full_name ?? 'Usuario',
    currency: user.currency,
    timezone: user.timezone,
    monthlyIncome: user.monthly_income,
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 500,
    messages: [
      { role: 'system', content: systemPrompt },
      ...contextMessages,
      { role: 'user', content: userMessage },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as ExtractionResult;

  return {
    intent: parsed.intent ?? 'unknown',
    confidence: parsed.confidence ?? 0,
    transaction: parsed.transaction ?? undefined,
    query: parsed.query ?? undefined,
    goal: parsed.goal ?? undefined,
    reply_draft: parsed.reply_draft ?? 'Uy, no entendí bien. ¿Me lo repites? 😅',
  };
}

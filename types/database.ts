export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionSource = 'whatsapp' | 'manual' | 'import';
export type GoalStatus = 'active' | 'completed' | 'paused';
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageIntent =
  | 'log_expense'
  | 'log_income'
  | 'query_balance'
  | 'query_spending'
  | 'set_goal'
  | 'set_budget'
  | 'spending_summary'
  | 'clarify_merchant'
  | 'clarify_category'
  | 'delete_last_transaction'
  | 'edit_last_transaction'
  | 'switch_group_context'
  | 'chat'
  | 'unknown';

export interface User {
  id: string;
  email: string | null;
  full_name: string | null;
  phone_number: string | null;
  currency: string;
  timezone: string;
  monthly_income: number | null;
  onboarded_at: string | null;
  active_group_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  is_income: boolean;
  sort_order: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  description: string | null;
  merchant: string | null;
  transaction_type: TransactionType;
  source: TransactionSource;
  raw_input: string | null;
  occurred_at: string;
  message_id: string | null;
  confidence: number | null;
  is_recurring: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount_limit: number;
  period: BudgetPeriod;
  period_start: string;
  period_end: string;
  alert_at: number;
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string | null;
  color: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  channel: string;
  phone_number: string;
  status: string;
  last_message_at: string | null;
  context_summary: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  twilio_sid: string | null;
  direction: MessageDirection;
  body: string;
  intent: MessageIntent | null;
  processed_at: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  reminder_type: string;
  schedule_cron: string | null;
  is_active: boolean;
  last_sent_at: string | null;
  created_at: string;
}

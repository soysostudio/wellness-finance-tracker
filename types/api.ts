export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

export interface CreateTransactionBody {
  amount: number;
  currency?: string;
  description?: string;
  merchant?: string;
  transaction_type?: 'expense' | 'income' | 'transfer';
  category_id?: string;
  occurred_at?: string;
  notes?: string;
}

export interface CreateGoalBody {
  name: string;
  description?: string;
  target_amount: number;
  target_date?: string;
  icon?: string;
  color?: string;
}

export interface CreateBudgetBody {
  category_id: string;
  amount_limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  period_start: string;
  period_end: string;
  alert_at?: number;
}

-- ============================================================
-- 003: transactions table
-- NUMERIC(14,2) for COP (amounts reach tens of millions)
-- ============================================================

CREATE TABLE public.transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount           NUMERIC(14,2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'COP',
  description      TEXT,
  merchant         TEXT,
  transaction_type TEXT NOT NULL DEFAULT 'expense'
                   CHECK (transaction_type IN ('expense', 'income', 'transfer')),
  source           TEXT NOT NULL DEFAULT 'manual'
                   CHECK (source IN ('whatsapp', 'manual', 'import')),
  raw_input        TEXT,
  occurred_at      TIMESTAMPTZ NOT NULL,
  message_id       UUID,  -- FK to messages added after messages table is created
  confidence       NUMERIC(3,2) CHECK (confidence BETWEEN 0 AND 1),
  is_recurring     BOOLEAN NOT NULL DEFAULT false,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_occurred
  ON public.transactions(user_id, occurred_at DESC);

CREATE INDEX idx_transactions_category
  ON public.transactions(category_id);

CREATE INDEX idx_transactions_source
  ON public.transactions(user_id, source);

CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select own transactions"
  ON public.transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert own transactions"
  ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own transactions"
  ON public.transactions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users can delete own transactions"
  ON public.transactions FOR DELETE USING (auth.uid() = user_id);

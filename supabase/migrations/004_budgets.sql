-- ============================================================
-- 004: budgets table
-- ============================================================

CREATE TABLE public.budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id   UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  amount_limit  NUMERIC(14,2) NOT NULL,
  period        TEXT NOT NULL DEFAULT 'monthly'
                CHECK (period IN ('weekly', 'monthly', 'yearly')),
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  alert_at      NUMERIC(3,2) NOT NULL DEFAULT 0.80
                CHECK (alert_at BETWEEN 0 AND 1),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_budgets_user_active
  ON public.budgets(user_id, is_active);

-- RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select own budgets"
  ON public.budgets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert own budgets"
  ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own budgets"
  ON public.budgets FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users can delete own budgets"
  ON public.budgets FOR DELETE USING (auth.uid() = user_id);

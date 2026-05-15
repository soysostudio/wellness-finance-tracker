-- ============================================================
-- 005: goals table
-- ============================================================

CREATE TABLE public.goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  target_amount  NUMERIC(14,2) NOT NULL,
  current_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  target_date    DATE,
  icon           TEXT,
  color          TEXT,
  status         TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'completed', 'paused')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_goals_user_status
  ON public.goals(user_id, status);

CREATE TRIGGER set_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select own goals"
  ON public.goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert own goals"
  ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own goals"
  ON public.goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users can delete own goals"
  ON public.goals FOR DELETE USING (auth.uid() = user_id);

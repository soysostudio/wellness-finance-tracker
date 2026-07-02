-- ============================================================
-- 014: goal_contributions — historial de aportes/retiros de metas
-- amount positivo = aporte, negativo = retiro
-- ============================================================

CREATE TABLE public.goal_contributions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id     UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount      NUMERIC(14,2) NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_goal_contributions_goal
  ON public.goal_contributions(goal_id, created_at DESC);

ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select own goal_contributions"
  ON public.goal_contributions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert own goal_contributions"
  ON public.goal_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete own goal_contributions"
  ON public.goal_contributions FOR DELETE USING (auth.uid() = user_id);

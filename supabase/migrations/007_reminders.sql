-- ============================================================
-- 007: reminders table
-- ============================================================

CREATE TABLE public.reminders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL
                CHECK (reminder_type IN ('daily_summary', 'budget_alert', 'goal_milestone', 'custom')),
  schedule_cron TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_sent_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_user_active
  ON public.reminders(user_id, is_active);

-- RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select own reminders"
  ON public.reminders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert own reminders"
  ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own reminders"
  ON public.reminders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users can delete own reminders"
  ON public.reminders FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 013: add weekly_summary to reminders reminder_type check
-- The original constraint was missing this type, causing inserts
-- from the settings page to fail silently at the DB level.
-- ============================================================

ALTER TABLE public.reminders
  DROP CONSTRAINT IF EXISTS reminders_reminder_type_check;

ALTER TABLE public.reminders
  ADD CONSTRAINT reminders_reminder_type_check
    CHECK (reminder_type IN ('daily_summary', 'weekly_summary', 'budget_alert', 'goal_milestone', 'custom'));

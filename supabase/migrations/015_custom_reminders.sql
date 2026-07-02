-- ============================================================
-- 015: recordatorios personalizados
-- El usuario define un texto + recurrencia; se entregan en el slot 8pm.
-- (hour_local queda para futura granularidad por hora con cron horario.)
-- ============================================================

ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS title        TEXT,
  ADD COLUMN IF NOT EXISTS frequency    TEXT CHECK (frequency IN ('once', 'weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS day_of_month INT  CHECK (day_of_month BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS day_of_week  INT  CHECK (day_of_week BETWEEN 0 AND 6),
  ADD COLUMN IF NOT EXISTS run_date     DATE,
  ADD COLUMN IF NOT EXISTS hour_local   INT  CHECK (hour_local BETWEEN 0 AND 23);

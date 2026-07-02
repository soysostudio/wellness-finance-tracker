-- ============================================================
-- 017: un solo daily_summary / weekly_summary por usuario
-- Primero elimina duplicados existentes (deja la fila más reciente por ctid),
-- luego crea un índice único parcial que previene duplicados a futuro.
-- ============================================================

DELETE FROM public.reminders r
USING public.reminders r2
WHERE r.user_id = r2.user_id
  AND r.reminder_type = r2.reminder_type
  AND r.reminder_type IN ('daily_summary', 'weekly_summary')
  AND r.ctid < r2.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reminders_user_summary_type
  ON public.reminders(user_id, reminder_type)
  WHERE reminder_type IN ('daily_summary', 'weekly_summary');

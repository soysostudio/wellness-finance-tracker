-- ============================================================
-- 016: apply_goal_contribution — aporte/retiro atómico
-- Inserta el movimiento y actualiza goals.current_amount en una sola
-- transacción, bloqueando la fila (evita carreras) y rechazando retiros
-- que dejen el saldo negativo. Respeta RLS (SECURITY INVOKER + auth.uid()).
-- ============================================================

CREATE OR REPLACE FUNCTION public.apply_goal_contribution(
  p_goal_id UUID,
  p_amount  NUMERIC,
  p_note    TEXT
)
RETURNS public.goals
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  g          public.goals;
  new_amount NUMERIC;
BEGIN
  SELECT * INTO g
  FROM public.goals
  WHERE id = p_goal_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'GOAL_NOT_FOUND';
  END IF;

  new_amount := g.current_amount + p_amount;
  IF new_amount < 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  INSERT INTO public.goal_contributions (goal_id, user_id, amount, note)
  VALUES (p_goal_id, auth.uid(), p_amount, p_note);

  UPDATE public.goals
  SET current_amount = new_amount,
      status = CASE
        WHEN new_amount >= target_amount AND status = 'active'    THEN 'completed'
        WHEN new_amount <  target_amount AND status = 'completed' THEN 'active'
        ELSE status
      END
  WHERE id = p_goal_id
  RETURNING * INTO g;

  RETURN g;
END;
$$;

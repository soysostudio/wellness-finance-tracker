-- ============================================================
-- 018: phone_verifications — verificación de propiedad del número
-- El usuario pide un código, y debe enviarlo a Luca por WhatsApp DESDE ese
-- número. El webhook (admin) confirma que code + phone_number coinciden.
-- ============================================================

CREATE TABLE public.phone_verifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  code         TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_verifications_lookup
  ON public.phone_verifications(code, phone_number);

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select own phone_verifications"
  ON public.phone_verifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert own phone_verifications"
  ON public.phone_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete own phone_verifications"
  ON public.phone_verifications FOR DELETE USING (auth.uid() = user_id);

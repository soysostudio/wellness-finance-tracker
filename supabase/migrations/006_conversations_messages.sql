-- ============================================================
-- 006: conversations + messages tables
-- One conversation per (user, phone_number) pair.
-- context_summary stores AI-compressed rolling memory.
-- ============================================================

CREATE TABLE public.conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel         TEXT NOT NULL DEFAULT 'whatsapp',
  phone_number    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  last_message_at TIMESTAMPTZ,
  context_summary TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_conversations_user_phone
  ON public.conversations(user_id, phone_number);

CREATE INDEX idx_conversations_user_last
  ON public.conversations(user_id, last_message_at DESC);

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select own conversations"
  ON public.conversations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can update own conversations"
  ON public.conversations FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================

CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  twilio_sid      TEXT UNIQUE,
  direction       TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body            TEXT NOT NULL,
  intent          TEXT,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_created
  ON public.messages(conversation_id, created_at DESC);

CREATE INDEX idx_messages_user
  ON public.messages(user_id, created_at DESC);

-- RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select own messages"
  ON public.messages FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- Add FK from transactions.message_id → messages.id
-- (deferred because messages table didn't exist yet)
-- ============================================================
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_message_id_fkey
  FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE SET NULL;

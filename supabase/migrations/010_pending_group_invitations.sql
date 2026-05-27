-- Pending invitations for users who don't have a Luca account yet
CREATE TABLE IF NOT EXISTS pending_group_invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number  text NOT NULL,
  group_id      uuid NOT NULL REFERENCES expense_groups(id) ON DELETE CASCADE,
  invited_by    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (phone_number, group_id)
);

-- No RLS needed — only accessed by admin client (service role)

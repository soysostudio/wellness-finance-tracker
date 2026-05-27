-- ── Expense Groups ──────────────────────────────────────────────────────
-- Shared expense groups (e.g. "Presupuesto familiar", "Viaje a NY")

CREATE TABLE expense_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '👨‍👩‍👧',
  color       TEXT NOT NULL DEFAULT '#6366F1',
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Members of a group (only registered Luca users)
CREATE TABLE group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES expense_groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member',  -- 'owner' | 'member'
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Link transactions to a group (NULL = personal)
ALTER TABLE transactions
  ADD COLUMN group_id UUID REFERENCES expense_groups(id) ON DELETE SET NULL;

-- Per-user active WhatsApp group context (NULL = personal mode)
ALTER TABLE users
  ADD COLUMN active_group_id UUID REFERENCES expense_groups(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_expense_groups_owner    ON expense_groups(owner_id);
CREATE INDEX idx_group_members_user      ON group_members(user_id);
CREATE INDEX idx_group_members_group     ON group_members(group_id);
CREATE INDEX idx_transactions_group      ON transactions(group_id) WHERE group_id IS NOT NULL;

-- ── RLS ─────────────────────────────────────────────────────────────────

ALTER TABLE expense_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members  ENABLE ROW LEVEL SECURITY;

-- expense_groups: readable by owner or any member
CREATE POLICY "expense_groups_select" ON expense_groups FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = expense_groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "expense_groups_insert" ON expense_groups FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "expense_groups_update" ON expense_groups FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "expense_groups_delete" ON expense_groups FOR DELETE
  USING (owner_id = auth.uid());

-- group_members: readable by members of that group; writable by owner
CREATE POLICY "group_members_select" ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "group_members_insert" ON group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expense_groups
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "group_members_delete" ON group_members FOR DELETE
  USING (
    user_id = auth.uid() OR  -- member can leave
    EXISTS (
      SELECT 1 FROM expense_groups
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );

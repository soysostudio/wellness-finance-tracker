-- Enable RLS on pending_group_invitations
ALTER TABLE public.pending_group_invitations ENABLE ROW LEVEL SECURITY;

-- Group owners can view invitations for their groups
CREATE POLICY "group_owners_can_view_invitations"
  ON public.pending_group_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM expense_groups
      WHERE expense_groups.id = pending_group_invitations.group_id
        AND expense_groups.owner_id = auth.uid()
    )
  );

-- Group owners can create invitations for their groups
CREATE POLICY "group_owners_can_insert_invitations"
  ON public.pending_group_invitations
  FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM expense_groups
      WHERE expense_groups.id = pending_group_invitations.group_id
        AND expense_groups.owner_id = auth.uid()
    )
  );

-- Group owners can delete invitations for their groups
CREATE POLICY "group_owners_can_delete_invitations"
  ON public.pending_group_invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM expense_groups
      WHERE expense_groups.id = pending_group_invitations.group_id
        AND expense_groups.owner_id = auth.uid()
    )
  );

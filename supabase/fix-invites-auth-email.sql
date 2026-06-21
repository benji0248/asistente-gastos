-- Parche: políticas de household_invites leían auth.users → 42501 permission denied
-- Ejecutar en AssistLife (SQL Editor) si ya corriste rls-and-rpc.sql antes de este fix

CREATE OR REPLACE FUNCTION public.my_auth_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT lower(email) FROM auth.users WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.my_auth_email() TO authenticated;

DROP POLICY IF EXISTS household_invites_select ON household_invites;
CREATE POLICY household_invites_select ON household_invites FOR SELECT
  USING (
    household_id = public.my_household_id()
    OR invitee_user_id = auth.uid()
    OR lower(invitee_email) = public.my_auth_email()
  );

DROP POLICY IF EXISTS household_invites_update ON household_invites;
CREATE POLICY household_invites_update ON household_invites FOR UPDATE
  USING (
    household_id = public.my_household_id()
    OR invitee_user_id = auth.uid()
    OR lower(invitee_email) = public.my_auth_email()
  );

NOTIFY pgrst, 'reload schema';

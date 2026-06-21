-- REVERTIR rls-and-rpc.sql si lo corriste en el proyecto / DB equivocado
-- Ejecutar en el SQL Editor de ESE proyecto (la DB donde fue el error)
--
-- Qué hace: quita políticas y funciones del script, desactiva RLS en tablas
-- que antes no lo tenían. NO borra datos (expenses, accounts, etc. siguen intactos).
--
-- profiles mantiene RLS como en schema.sql original.

-- =============================================================================
-- Políticas creadas por rls-and-rpc.sql
-- =============================================================================

DROP POLICY IF EXISTS expenses_select ON expenses;
DROP POLICY IF EXISTS expenses_insert ON expenses;
DROP POLICY IF EXISTS expenses_update ON expenses;
DROP POLICY IF EXISTS expenses_delete ON expenses;

DROP POLICY IF EXISTS accounts_select ON accounts;
DROP POLICY IF EXISTS accounts_insert ON accounts;
DROP POLICY IF EXISTS accounts_update ON accounts;
DROP POLICY IF EXISTS accounts_delete ON accounts;

DROP POLICY IF EXISTS categories_select ON categories;
DROP POLICY IF EXISTS categories_insert ON categories;
DROP POLICY IF EXISTS categories_update ON categories;
DROP POLICY IF EXISTS categories_delete ON categories;

DROP POLICY IF EXISTS statements_select ON credit_card_statements;
DROP POLICY IF EXISTS statements_insert ON credit_card_statements;
DROP POLICY IF EXISTS statements_update ON credit_card_statements;
DROP POLICY IF EXISTS statements_delete ON credit_card_statements;

DROP POLICY IF EXISTS households_select ON households;
DROP POLICY IF EXISTS households_insert ON households;
DROP POLICY IF EXISTS households_update ON households;

DROP POLICY IF EXISTS household_members_select ON household_members;
DROP POLICY IF EXISTS household_members_insert ON household_members;
DROP POLICY IF EXISTS household_members_update ON household_members;
DROP POLICY IF EXISTS household_members_delete ON household_members;

DROP POLICY IF EXISTS household_invites_select ON household_invites;
DROP POLICY IF EXISTS household_invites_insert ON household_invites;
DROP POLICY IF EXISTS household_invites_update ON household_invites;

DROP POLICY IF EXISTS recurring_select ON household_recurring_expenses;
DROP POLICY IF EXISTS recurring_insert ON household_recurring_expenses;
DROP POLICY IF EXISTS recurring_update ON household_recurring_expenses;
DROP POLICY IF EXISTS recurring_delete ON household_recurring_expenses;

DROP POLICY IF EXISTS profiles_select_household ON profiles;

-- Restaurar política original de profiles (schema.sql)
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- =============================================================================
-- Desactivar RLS (estado previo a rls-and-rpc.sql para estas tablas)
-- profiles sigue con RLS activo
-- =============================================================================

ALTER TABLE IF EXISTS expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS credit_card_statements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS households DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS household_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS household_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS household_recurring_expenses DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Funciones RPC y helpers del script
-- =============================================================================

DROP FUNCTION IF EXISTS public.ensure_recurring_expenses();
DROP FUNCTION IF EXISTS public.set_shared_cash(BOOLEAN);
DROP FUNCTION IF EXISTS public.invite_household_member(TEXT);
DROP FUNCTION IF EXISTS public.transfer_funds(INTEGER, INTEGER, DECIMAL);
DROP FUNCTION IF EXISTS public.adjust_account_balance(INTEGER, DECIMAL);
DROP FUNCTION IF EXISTS public.complete_expense(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.pay_expense(INTEGER, DECIMAL, INTEGER);
DROP FUNCTION IF EXISTS public.get_expenses_month_summary(INT, INT);

DROP FUNCTION IF EXISTS public.my_auth_email();
DROP FUNCTION IF EXISTS public.can_access_expense(INTEGER);
DROP FUNCTION IF EXISTS public.can_access_account(INTEGER);
DROP FUNCTION IF EXISTS public.my_shared_cash();
DROP FUNCTION IF EXISTS public.my_visible_user_ids();
DROP FUNCTION IF EXISTS public.my_household_id();

NOTIFY pgrst, 'reload schema';

-- RLS + helpers + RPC para acceso directo desde el frontend (Supabase JS)
-- Ejecutar en Supabase SQL Editor DESPUÉS de schema.sql y migraciones

-- =============================================================================
-- Helpers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.my_household_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hm.household_id
  FROM household_members hm
  WHERE hm.user_id = auth.uid()
    AND hm.status = 'accepted'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.my_visible_user_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(hm.user_id),
    ARRAY[auth.uid()]
  )
  FROM household_members hm
  WHERE hm.household_id = public.my_household_id()
    AND hm.status = 'accepted';
$$;

CREATE OR REPLACE FUNCTION public.my_shared_cash()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT h.shared_cash FROM households h WHERE h.id = public.my_household_id()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_account(p_account_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM accounts a
    WHERE a.id = p_account_id
      AND (
        (a.user_id = ANY(public.my_visible_user_ids()) AND a.household_id IS NULL)
        OR (
          a.household_id = public.my_household_id()
          AND public.my_shared_cash()
          AND a.type = 'cash'
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_expense(p_expense_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM expenses e
    WHERE e.id = p_expense_id
      AND e.user_id = ANY(public.my_visible_user_ids())
  );
$$;

-- Email del usuario logueado (auth.users no es legible por authenticated directamente)
CREATE OR REPLACE FUNCTION public.my_auth_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT lower(email) FROM auth.users WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.my_household_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_visible_user_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_shared_cash() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_account(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_expense(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_auth_email() TO authenticated;

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
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

-- Expenses
CREATE POLICY expenses_select ON expenses FOR SELECT
  USING (user_id = ANY(public.my_visible_user_ids()));

CREATE POLICY expenses_insert ON expenses FOR INSERT
  WITH CHECK (user_id = ANY(public.my_visible_user_ids()));

CREATE POLICY expenses_update ON expenses FOR UPDATE
  USING (user_id = ANY(public.my_visible_user_ids()));

CREATE POLICY expenses_delete ON expenses FOR DELETE
  USING (user_id = ANY(public.my_visible_user_ids()));

-- Accounts
CREATE POLICY accounts_select ON accounts FOR SELECT
  USING (
    (user_id = ANY(public.my_visible_user_ids()) AND household_id IS NULL)
    OR (
      household_id = public.my_household_id()
      AND public.my_shared_cash()
      AND type = 'cash'
    )
  );

CREATE POLICY accounts_insert ON accounts FOR INSERT
  WITH CHECK (
    household_id IS NULL
    AND user_id = ANY(public.my_visible_user_ids())
  );

CREATE POLICY accounts_update ON accounts FOR UPDATE
  USING (public.can_access_account(id));

CREATE POLICY accounts_delete ON accounts FOR DELETE
  USING (user_id = auth.uid() AND household_id IS NULL);

-- Categories (own + household members for shared picker)
CREATE POLICY categories_select ON categories FOR SELECT
  USING (user_id = ANY(public.my_visible_user_ids()));

CREATE POLICY categories_insert ON categories FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY categories_update ON categories FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY categories_delete ON categories FOR DELETE
  USING (user_id = auth.uid());

-- Credit card statements
CREATE POLICY statements_select ON credit_card_statements FOR SELECT
  USING (user_id = ANY(public.my_visible_user_ids()));

CREATE POLICY statements_insert ON credit_card_statements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY statements_update ON credit_card_statements FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY statements_delete ON credit_card_statements FOR DELETE
  USING (user_id = auth.uid());

-- Households
CREATE POLICY households_select ON households FOR SELECT
  USING (id = public.my_household_id());

CREATE POLICY households_insert ON households FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY households_update ON households FOR UPDATE
  USING (id = public.my_household_id());

-- Household members
CREATE POLICY household_members_select ON household_members FOR SELECT
  USING (household_id = public.my_household_id());

CREATE POLICY household_members_insert ON household_members FOR INSERT
  WITH CHECK (
    household_id = public.my_household_id()
    OR user_id = auth.uid()
  );

CREATE POLICY household_members_update ON household_members FOR UPDATE
  USING (household_id = public.my_household_id() OR user_id = auth.uid());

CREATE POLICY household_members_delete ON household_members FOR DELETE
  USING (household_id = public.my_household_id() OR user_id = auth.uid());

-- Invites
CREATE POLICY household_invites_select ON household_invites FOR SELECT
  USING (
    household_id = public.my_household_id()
    OR invitee_user_id = auth.uid()
    OR lower(invitee_email) = public.my_auth_email()
  );

CREATE POLICY household_invites_insert ON household_invites FOR INSERT
  WITH CHECK (household_id = public.my_household_id() AND invited_by = auth.uid());

CREATE POLICY household_invites_update ON household_invites FOR UPDATE
  USING (
    household_id = public.my_household_id()
    OR invitee_user_id = auth.uid()
    OR lower(invitee_email) = public.my_auth_email()
  );

-- Recurring expenses
CREATE POLICY recurring_select ON household_recurring_expenses FOR SELECT
  USING (household_id = public.my_household_id());

CREATE POLICY recurring_insert ON household_recurring_expenses FOR INSERT
  WITH CHECK (household_id = public.my_household_id());

CREATE POLICY recurring_update ON household_recurring_expenses FOR UPDATE
  USING (household_id = public.my_household_id());

CREATE POLICY recurring_delete ON household_recurring_expenses FOR DELETE
  USING (household_id = public.my_household_id());

-- Profiles: allow reading household member profiles
DROP POLICY IF EXISTS profiles_select_household ON profiles;
CREATE POLICY profiles_select_household ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR id = ANY(public.my_visible_user_ids())
  );

-- =============================================================================
-- RPC: month summary
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_expenses_month_summary(p_month INT, p_year INT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_pending_count INT := 0;
  v_paid_total DECIMAL := 0;
  v_pending_total DECIMAL := 0;
  v_amount DECIMAL;
  v_amount_paid DECIMAL;
  r RECORD;
BEGIN
  v_start := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
  v_end := (date_trunc('month', v_start) + interval '1 month' - interval '1 second');

  FOR r IN
    SELECT amount, amount_paid, is_paid FROM expenses
    WHERE user_id = ANY(public.my_visible_user_ids())
      AND created_at >= v_start AND created_at <= v_end
  LOOP
    v_amount := COALESCE(r.amount, 0);
    v_amount_paid := COALESCE(r.amount_paid, 0);
    IF r.is_paid THEN
      v_paid_total := v_paid_total + v_amount;
    ELSE
      v_pending_count := v_pending_count + 1;
      v_paid_total := v_paid_total + v_amount_paid;
      v_pending_total := v_pending_total + GREATEST(0, v_amount - v_amount_paid);
    END IF;
  END LOOP;

  RETURN json_build_object(
    'pendingCount', v_pending_count,
    'paidTotal', v_paid_total,
    'pendingTotal', v_pending_total,
    'monthTotal', v_paid_total + v_pending_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_expenses_month_summary(INT, INT) TO authenticated;

-- =============================================================================
-- RPC: pay expense (partial or complete remaining)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.pay_expense(
  p_expense_id INTEGER,
  p_payment_amount DECIMAL,
  p_account_id INTEGER
)
RETURNS expenses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expense expenses%ROWTYPE;
  v_total DECIMAL;
  v_already_paid DECIMAL;
  v_remaining DECIMAL;
  v_new_paid DECIMAL;
  v_is_paid BOOLEAN;
BEGIN
  IF NOT public.can_access_expense(p_expense_id) THEN
    RAISE EXCEPTION 'El gasto no pertenece al hogar';
  END IF;
  IF NOT public.can_access_account(p_account_id) THEN
    RAISE EXCEPTION 'La cuenta no pertenece al hogar';
  END IF;

  SELECT * INTO v_expense FROM expenses WHERE id = p_expense_id FOR UPDATE;
  v_total := COALESCE(v_expense.amount, 0);
  v_already_paid := COALESCE(v_expense.amount_paid, 0);
  v_remaining := v_total - v_already_paid;

  IF p_payment_amount <= 0 OR p_payment_amount > v_remaining + 0.001 THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_AMOUNT';
  END IF;

  v_new_paid := LEAST(v_total, v_already_paid + p_payment_amount);
  v_is_paid := v_new_paid >= v_total;

  UPDATE expenses SET
    amount_paid = v_new_paid,
    is_paid = v_is_paid,
    account_id = p_account_id,
    payment_date = CASE WHEN v_is_paid THEN NOW() ELSE payment_date END
  WHERE id = p_expense_id;

  UPDATE accounts SET balance = balance - p_payment_amount WHERE id = p_account_id;

  SELECT * INTO v_expense FROM expenses WHERE id = p_expense_id;
  RETURN v_expense;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_expense(
  p_expense_id INTEGER,
  p_account_id INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expense expenses%ROWTYPE;
  v_remaining DECIMAL;
BEGIN
  SELECT * INTO v_expense FROM expenses WHERE id = p_expense_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  v_remaining := COALESCE(v_expense.amount, 0) - COALESCE(v_expense.amount_paid, 0);

  IF v_remaining <= 0 THEN
    UPDATE expenses SET is_paid = true, payment_date = NOW() WHERE id = p_expense_id;
    RETURN;
  END IF;

  PERFORM public.pay_expense(p_expense_id, v_remaining, p_account_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.pay_expense(INTEGER, DECIMAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_expense(INTEGER, INTEGER) TO authenticated;

-- =============================================================================
-- RPC: account balance ops
-- =============================================================================

CREATE OR REPLACE FUNCTION public.adjust_account_balance(
  p_account_id INTEGER,
  p_delta DECIMAL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_access_account(p_account_id) THEN
    RAISE EXCEPTION 'No se consiguio la fuente de fondos';
  END IF;
  UPDATE accounts SET balance = balance + p_delta WHERE id = p_account_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.transfer_funds(
  p_from_id INTEGER,
  p_to_id INTEGER,
  p_amount DECIMAL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Monto inválido';
  END IF;
  IF NOT public.can_access_account(p_from_id) OR NOT public.can_access_account(p_to_id) THEN
    RAISE EXCEPTION 'No se consiguio la fuente de fondos';
  END IF;
  UPDATE accounts SET balance = balance - p_amount WHERE id = p_from_id;
  UPDATE accounts SET balance = balance + p_amount WHERE id = p_to_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.adjust_account_balance(INTEGER, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_funds(INTEGER, INTEGER, DECIMAL) TO authenticated;

-- =============================================================================
-- RPC: invite member (username lookup only; email stored as invitee_email)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.invite_household_member(p_identifier TEXT)
RETURNS household_invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_invitee_id UUID;
  v_normalized TEXT;
  v_invite household_invites%ROWTYPE;
BEGIN
  v_household_id := public.my_household_id();
  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Primero tenés que crear un hogar';
  END IF;

  v_normalized := trim(p_identifier);

  SELECT id INTO v_invitee_id
  FROM profiles
  WHERE lower(username) = lower(v_normalized)
  LIMIT 1;

  IF v_invitee_id IS NOT NULL AND v_invitee_id = ANY(public.my_visible_user_ids()) THEN
    RAISE EXCEPTION 'La persona ya pertenece a tu hogar';
  END IF;

  INSERT INTO household_invites (household_id, invited_by, invitee_user_id, invitee_email)
  VALUES (
    v_household_id,
    auth.uid(),
    v_invitee_id,
    CASE WHEN v_invitee_id IS NULL THEN lower(v_normalized) ELSE NULL END
  )
  RETURNING * INTO v_invite;

  RETURN v_invite;
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_household_member(TEXT) TO authenticated;

-- =============================================================================
-- RPC: set shared cash (simplified port)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_shared_cash(p_enabled BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_member_ids UUID[];
  v_role TEXT;
  v_pooled DECIMAL := 0;
  v_shared accounts%ROWTYPE;
  v_per_member DECIMAL;
  r RECORD;
BEGIN
  v_household_id := public.my_household_id();
  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Primero tenés que crear un hogar';
  END IF;

  SELECT role INTO v_role FROM household_members
  WHERE household_id = v_household_id AND user_id = auth.uid();
  IF v_role IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'Solo el dueño del hogar puede cambiar esta opción';
  END IF;

  SELECT array_agg(user_id) INTO v_member_ids
  FROM household_members
  WHERE household_id = v_household_id AND status = 'accepted';

  IF array_length(v_member_ids, 1) < 2 THEN
    RAISE EXCEPTION 'Necesitás al menos 2 miembros en el hogar';
  END IF;

  IF p_enabled THEN
    FOR r IN SELECT * FROM accounts WHERE user_id = ANY(v_member_ids) AND type = 'cash' AND household_id IS NULL
    LOOP
      v_pooled := v_pooled + COALESCE(r.balance, 0);
      UPDATE accounts SET balance = 0 WHERE id = r.id;
    END LOOP;

    SELECT * INTO v_shared FROM accounts
    WHERE household_id = v_household_id AND type = 'cash' LIMIT 1;

    IF FOUND THEN
      UPDATE accounts SET balance = COALESCE(v_shared.balance, 0) + v_pooled WHERE id = v_shared.id;
    ELSE
      INSERT INTO accounts (user_id, household_id, type, balance, description)
      VALUES (auth.uid(), v_household_id, 'cash', v_pooled, 'Efectivo compartido');
    END IF;

    UPDATE households SET shared_cash = true WHERE id = v_household_id;
  ELSE
    SELECT * INTO v_shared FROM accounts
    WHERE household_id = v_household_id AND type = 'cash' LIMIT 1;

    v_per_member := CASE WHEN array_length(v_member_ids, 1) > 0
      THEN COALESCE(v_shared.balance, 0) / array_length(v_member_ids, 1) ELSE 0 END;

    FOR r IN SELECT * FROM accounts WHERE user_id = ANY(v_member_ids) AND type = 'cash' AND household_id IS NULL
    LOOP
      UPDATE accounts SET balance = v_per_member WHERE id = r.id;
    END LOOP;

    IF FOUND AND v_shared.id IS NOT NULL THEN
      UPDATE accounts SET balance = 0 WHERE id = v_shared.id;
    END IF;

    UPDATE households SET shared_cash = false WHERE id = v_household_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_shared_cash(BOOLEAN) TO authenticated;

-- =============================================================================
-- RPC: ensure recurring expenses for current month
-- =============================================================================

CREATE OR REPLACE FUNCTION public.ensure_recurring_expenses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_month INT;
  v_year INT;
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  rec RECORD;
  v_amount DECIMAL;
  v_exists BOOLEAN;
BEGIN
  v_household_id := public.my_household_id();
  IF v_household_id IS NULL THEN RETURN; END IF;

  v_month := EXTRACT(MONTH FROM NOW())::INT;
  v_year := EXTRACT(YEAR FROM NOW())::INT;
  v_start := make_timestamptz(v_year, v_month, 1, 0, 0, 0, 'UTC');
  v_end := (date_trunc('month', v_start) + interval '1 month' - interval '1 second');

  FOR rec IN SELECT * FROM household_recurring_expenses WHERE household_id = v_household_id
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM expenses
      WHERE household_recurring_expense_id = rec.id
        AND created_at >= v_start AND created_at <= v_end
    ) INTO v_exists;

    IF v_exists THEN CONTINUE; END IF;

    v_amount := COALESCE(rec.fixed_amount, 0);

    INSERT INTO expenses (
      title, amount, amount_paid, is_paid, user_id, category_id,
      account_id, household_recurring_expense_id, created_at
    ) VALUES (
      rec.title, v_amount, 0, false, rec.created_by, rec.category_id,
      NULL, rec.id, v_start
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_recurring_expenses() TO authenticated;

-- Refrescar cache de PostgREST para que exponga las RPC nuevas
NOTIFY pgrst, 'reload schema';

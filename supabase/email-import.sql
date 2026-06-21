-- Importación automática de gastos desde correos bancarios (Gmail + Edge Function)
-- Ejecutar en Supabase SQL Editor DESPUÉS de schema.sql y rls-and-rpc.sql

CREATE TABLE IF NOT EXISTS email_import_settings (
  user_id             UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  import_token        TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  default_account_id  INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  allowed_senders     TEXT[] NOT NULL DEFAULT '{}',
  enabled             BOOLEAN NOT NULL DEFAULT false,
  gmail_label         TEXT NOT NULL DEFAULT 'AsistenteGastos',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_import_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  TEXT NOT NULL UNIQUE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expense_id  INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
  status      TEXT NOT NULL CHECK (status IN ('created', 'skipped', 'duplicate')),
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_import_log_user_id ON email_import_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_import_settings_token ON email_import_settings(import_token);

-- Realtime para refrescar gastos en la app
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
  END IF;
END $$;

ALTER TABLE email_import_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_import_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_import_settings_select ON email_import_settings;
DROP POLICY IF EXISTS email_import_settings_insert ON email_import_settings;
DROP POLICY IF EXISTS email_import_settings_update ON email_import_settings;
DROP POLICY IF EXISTS email_import_log_select ON email_import_log;

CREATE POLICY email_import_settings_select ON email_import_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY email_import_settings_insert ON email_import_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY email_import_settings_update ON email_import_settings
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY email_import_log_select ON email_import_log
  FOR SELECT USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON TABLE public.email_import_settings TO authenticated;
GRANT SELECT ON TABLE public.email_import_log TO authenticated;
GRANT ALL ON TABLE public.email_import_settings TO service_role;
GRANT ALL ON TABLE public.email_import_log TO service_role;

-- Inserta gasto pagado + descuenta balance (solo service_role vía Edge Function)
CREATE OR REPLACE FUNCTION public.create_paid_expense_from_import(
  p_user_id UUID,
  p_account_id INTEGER,
  p_title TEXT,
  p_amount DECIMAL,
  p_category_id INTEGER,
  p_message_id TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expense_id INTEGER;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  IF p_message_id IS NULL OR length(trim(p_message_id)) = 0 THEN
    RAISE EXCEPTION 'INVALID_MESSAGE_ID';
  END IF;

  IF EXISTS (SELECT 1 FROM email_import_log WHERE message_id = p_message_id) THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM accounts a
    WHERE a.id = p_account_id
      AND a.user_id = p_user_id
      AND a.household_id IS NULL
  ) THEN
    RAISE EXCEPTION 'INVALID_ACCOUNT';
  END IF;

  INSERT INTO expenses (
    title,
    amount,
    amount_paid,
    payment_date,
    is_paid,
    user_id,
    category_id,
    account_id
  ) VALUES (
    left(trim(p_title), 255),
    p_amount,
    p_amount,
    NOW(),
    true,
    p_user_id,
    p_category_id,
    p_account_id
  )
  RETURNING id INTO v_expense_id;

  UPDATE accounts
  SET balance = balance - p_amount
  WHERE id = p_account_id;

  INSERT INTO email_import_log (message_id, user_id, expense_id, status, reason)
  VALUES (p_message_id, p_user_id, v_expense_id, 'created', NULL);

  RETURN v_expense_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_paid_expense_from_import(UUID, INTEGER, TEXT, DECIMAL, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_paid_expense_from_import(UUID, INTEGER, TEXT, DECIMAL, INTEGER, TEXT) TO service_role;

-- Resúmenes de tarjeta de crédito (varios por usuario y mes, visible en el hogar)
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS credit_card_statements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  statement_data  JSONB NOT NULL,
  file_name       TEXT,
  expense_id      INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
  statement_month DATE NOT NULL DEFAULT date_trunc('month', NOW())::date,
  imported_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_card_statements_user_id
  ON credit_card_statements(user_id);

CREATE INDEX IF NOT EXISTS idx_credit_card_statements_user_month
  ON credit_card_statements(user_id, statement_month);

CREATE INDEX IF NOT EXISTS idx_credit_card_statements_month
  ON credit_card_statements(statement_month);

GRANT ALL ON TABLE public.credit_card_statements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.credit_card_statements TO authenticated;

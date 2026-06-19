-- Resúmenes de tarjeta de crédito (uno activo por usuario, visible en el hogar)
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS credit_card_statements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  statement_data JSONB NOT NULL,
  file_name      TEXT,
  imported_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT credit_card_statements_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_credit_card_statements_user_id
  ON credit_card_statements(user_id);

GRANT ALL ON TABLE public.credit_card_statements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.credit_card_statements TO authenticated;

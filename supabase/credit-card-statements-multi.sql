-- Varios resúmenes por usuario, agrupados por mes de importación.
-- Ejecutar en el SQL Editor de Supabase.

ALTER TABLE credit_card_statements
  DROP CONSTRAINT IF EXISTS credit_card_statements_user_id_key;

ALTER TABLE credit_card_statements
  ADD COLUMN IF NOT EXISTS statement_month DATE;

UPDATE credit_card_statements
SET statement_month = date_trunc('month', imported_at)::date
WHERE statement_month IS NULL;

ALTER TABLE credit_card_statements
  ALTER COLUMN statement_month SET NOT NULL,
  ALTER COLUMN statement_month SET DEFAULT date_trunc('month', NOW())::date;

CREATE INDEX IF NOT EXISTS idx_credit_card_statements_user_month
  ON credit_card_statements(user_id, statement_month);

CREATE INDEX IF NOT EXISTS idx_credit_card_statements_month
  ON credit_card_statements(statement_month);

NOTIFY pgrst, 'reload schema';

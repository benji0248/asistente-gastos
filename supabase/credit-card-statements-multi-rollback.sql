-- Revertir credit-card-statements-multi.sql
-- ADVERTENCIA: si hay más de un resumen por usuario, el rollback fallará al recrear UNIQUE(user_id).

DROP INDEX IF EXISTS idx_credit_card_statements_user_month;
DROP INDEX IF EXISTS idx_credit_card_statements_month;

ALTER TABLE credit_card_statements
  DROP COLUMN IF EXISTS statement_month;

ALTER TABLE credit_card_statements
  ADD CONSTRAINT credit_card_statements_user_id_key UNIQUE (user_id);

NOTIFY pgrst, 'reload schema';

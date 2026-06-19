-- Pagos parciales en gastos + vínculo resumen ↔ gasto
-- Ejecutar en Supabase SQL Editor

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE credit_card_statements
  ADD COLUMN IF NOT EXISTS expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL;

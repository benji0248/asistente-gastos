-- Monto obligatorio para fijos y estimados (fixed_amount = monto de referencia / actual)
-- Ejecutar en Supabase SQL Editor si ya creaste household_recurring_expenses

ALTER TABLE household_recurring_expenses
  DROP CONSTRAINT IF EXISTS household_recurring_fixed_amount_check;

ALTER TABLE household_recurring_expenses
  ADD CONSTRAINT household_recurring_amount_check
  CHECK (fixed_amount IS NOT NULL AND fixed_amount > 0);

-- Estimados existentes sin monto: completar manualmente o borrar y recrear
-- UPDATE household_recurring_expenses SET fixed_amount = 0 WHERE ... (no aplicar)

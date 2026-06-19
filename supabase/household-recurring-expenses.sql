-- Gastos recurrentes del hogar (plantillas mensuales)
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS household_recurring_expenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  amount_type  TEXT NOT NULL,
  fixed_amount DECIMAL(10, 2),
  category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  created_by   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT household_recurring_amount_type_check
    CHECK (amount_type IN ('fixed', 'estimated')),
  CONSTRAINT household_recurring_amount_check
    CHECK (fixed_amount IS NOT NULL AND fixed_amount > 0)
);

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS household_recurring_expense_id UUID
  REFERENCES household_recurring_expenses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_household_recurring_household_id
  ON household_recurring_expenses(household_id);

CREATE INDEX IF NOT EXISTS idx_expenses_household_recurring_id
  ON expenses(household_recurring_expense_id);

GRANT ALL ON TABLE public.household_recurring_expenses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.household_recurring_expenses TO authenticated;

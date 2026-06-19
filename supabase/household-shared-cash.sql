-- Efectivo compartido del hogar: un pool único en lugar de cuentas cash por miembro.

ALTER TABLE households
  ADD COLUMN IF NOT EXISTS shared_cash BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_one_shared_cash_per_household
  ON accounts(household_id)
  WHERE household_id IS NOT NULL AND type = 'cash';

CREATE INDEX IF NOT EXISTS idx_accounts_household_id ON accounts(household_id);

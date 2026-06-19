-- AssistLife + Supabase Auth
-- Ejecutar en Supabase SQL Editor (proyecto nuevo o resetear tablas públicas)

-- Perfil de app vinculado a auth.users (UUID)
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT NOT NULL UNIQUE,
  role       INTEGER DEFAULT 1712,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS households (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_cash BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS household_members (
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member',
  status       TEXT NOT NULL DEFAULT 'accepted',
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (household_id, user_id),
  CONSTRAINT household_members_role_check CHECK (role IN ('owner', 'member')),
  CONSTRAINT household_members_status_check CHECK (status IN ('accepted', 'left'))
);

CREATE TABLE IF NOT EXISTS household_invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invited_by      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_email   TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  responded_at    TIMESTAMPTZ,
  CONSTRAINT household_invites_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  CONSTRAINT household_invites_target_check CHECK (invitee_user_id IS NOT NULL OR invitee_email IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS accounts (
  id           SERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  type         VARCHAR(50),
  balance      DECIMAL(10, 2) DEFAULT 0,
  description  VARCHAR(255),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_system  BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS expenses (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(255),
  amount       DECIMAL(10, 2),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  payment_date TIMESTAMPTZ,
  is_paid      BOOLEAN DEFAULT FALSE,
  amount_paid  DECIMAL(10, 2) NOT NULL DEFAULT 0,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  account_id   INTEGER REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS credit_card_statements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  statement_data JSONB NOT NULL,
  file_name      TEXT,
  expense_id     INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
  imported_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT credit_card_statements_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_statements_user_id ON credit_card_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_household_members_one_active_user
  ON household_members(user_id)
  WHERE status = 'accepted';
CREATE INDEX IF NOT EXISTS idx_household_invites_invitee_user_id ON household_invites(invitee_user_id);
CREATE INDEX IF NOT EXISTS idx_household_invites_invitee_email ON household_invites(invitee_email);
CREATE INDEX IF NOT EXISTS idx_household_invites_household_id ON household_invites(household_id);

-- Al registrarse en Supabase Auth → crear perfil + cuenta "efectivo"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );

  INSERT INTO public.accounts (user_id, type, balance, description)
  VALUES (NEW.id, 'cash', 0, 'efectivo');

  INSERT INTO public.categories (user_id, name, is_system, is_enabled)
  SELECT NEW.id, seed.name, true, true
  FROM (
    VALUES
      ('Alimentación'),
      ('Transporte'),
      ('Vivienda'),
      ('Salud'),
      ('Entretenimiento'),
      ('Educación'),
      ('Servicios'),
      ('Ropa'),
      ('Conveniencia'),
      ('Otros')
  ) AS seed(name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: el frontend puede leer el propio perfil vía supabase-js
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Permisos para PostgREST (backend con service_role, frontend con authenticated)
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.households TO service_role;
GRANT ALL ON TABLE public.household_members TO service_role;
GRANT ALL ON TABLE public.household_invites TO service_role;
GRANT ALL ON TABLE public.accounts TO service_role;
GRANT ALL ON TABLE public.categories TO service_role;
GRANT ALL ON TABLE public.expenses TO service_role;
GRANT ALL ON TABLE public.credit_card_statements TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.households TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.household_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.household_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.credit_card_statements TO authenticated;

-- Admin panel: user moderation + last login tracking
-- Apply on app DB (profiles) and ensure identity-api updates last_login_at on login.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON profiles(is_blocked);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at ON profiles(last_login_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);

-- Example: promote first admin (replace UUID)
-- UPDATE profiles SET role = 1701 WHERE username = 'tu_usuario';

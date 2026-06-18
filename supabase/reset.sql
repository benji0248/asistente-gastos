-- Solo si ya tenías el schema viejo (users/tokens con INTEGER).
-- Ejecutar en SQL Editor si empezás de cero con Supabase Auth.

DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Luego ejecutar supabase/schema.sql completo

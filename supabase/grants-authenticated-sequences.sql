-- Fix: permission denied for sequence expenses_id_seq al insertar gastos desde el frontend
-- Ejecutar en Supabase SQL Editor

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

NOTIFY pgrst, 'reload schema';

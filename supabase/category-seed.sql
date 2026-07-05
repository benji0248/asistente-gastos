-- Migración: flags de categoría (sin seed)
-- Ejecutar en Supabase SQL Editor

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

-- Migración: flags de categoría + seed para usuarios existentes
-- Ejecutar en Supabase SQL Editor

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

-- Seed de categorías base para usuarios que aún no tienen categorías del sistema
INSERT INTO categories (user_id, name, is_system, is_enabled)
SELECT p.id, seed.name, true, true
FROM profiles p
CROSS JOIN (
  VALUES
    ('Comida'),
    ('Transporte'),
    ('Hogar'),
    ('Salud'),
    ('Entretenimiento'),
    ('Educación'),
    ('Servicios'),
    ('Ropa'),
    ('Otros'),
    ('Supermercado'),
    ('Farmacia'),
    ('Alquiler'),
    ('Obra Social'),
    ('Tarjeta de crédito'),
) AS seed(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories c
  WHERE c.user_id = p.id AND c.is_system = true
);

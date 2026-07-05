-- Eliminar categorías del seed y compartir categorías entre miembros del hogar
-- Ejecutar en Supabase SQL Editor

-- Quitar categorías base predefinidas (los gastos quedan sin categoría vía ON DELETE SET NULL)
DELETE FROM categories WHERE is_system = true;

-- Miembros del hogar pueden editar y eliminar categorías de cualquier integrante
DROP POLICY IF EXISTS categories_update ON categories;
CREATE POLICY categories_update ON categories FOR UPDATE
  USING (user_id = ANY(public.my_visible_user_ids()));

DROP POLICY IF EXISTS categories_delete ON categories;
CREATE POLICY categories_delete ON categories FOR DELETE
  USING (user_id = ANY(public.my_visible_user_ids()));

NOTIFY pgrst, 'reload schema';

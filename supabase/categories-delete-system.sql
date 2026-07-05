-- Permitir eliminar categorías propias y del hogar desde el perfil
-- Ejecutar en Supabase SQL Editor
-- (Superseded by categories-household-sharing.sql; kept for reference)

DROP POLICY IF EXISTS categories_delete ON categories;

CREATE POLICY categories_delete ON categories FOR DELETE
  USING (user_id = ANY(public.my_visible_user_ids()));

NOTIFY pgrst, 'reload schema';

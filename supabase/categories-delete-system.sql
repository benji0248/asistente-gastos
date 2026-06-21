-- Permitir eliminar categorías base (is_system) propias desde el perfil
-- Ejecutar en Supabase SQL Editor

DROP POLICY IF EXISTS categories_delete ON categories;

CREATE POLICY categories_delete ON categories FOR DELETE
  USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';

-- Permisos para PostgREST / Supabase JS (service_role en el backend)
-- Ejecutar en Supabase SQL Editor si ves "permission denied for table ..."

GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.households TO service_role;
GRANT ALL ON TABLE public.household_members TO service_role;
GRANT ALL ON TABLE public.household_invites TO service_role;
GRANT ALL ON TABLE public.accounts TO service_role;
GRANT ALL ON TABLE public.categories TO service_role;
GRANT ALL ON TABLE public.expenses TO service_role;
GRANT ALL ON TABLE public.household_recurring_expenses TO service_role;
GRANT ALL ON TABLE public.credit_card_statements TO service_role;
GRANT ALL ON TABLE public.email_import_settings TO service_role;
GRANT ALL ON TABLE public.email_import_log TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Frontend con anon/authenticated (RLS sigue aplicando)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.households TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.household_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.household_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.household_recurring_expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.credit_card_statements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.email_import_settings TO authenticated;
GRANT SELECT ON TABLE public.email_import_log TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

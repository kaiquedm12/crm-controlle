-- Multi-tenant RLS baseline for shared schema strategy.
-- Uses JWT claims:
--   tenant_id: tenant scope
--   role: SUPER_ADMIN | TENANT_ADMIN | USER

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() ->> 'tenant_id', '');
$$;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt() ->> 'role', '');
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_app_role() = 'SUPER_ADMIN';
$$;

ALTER TABLE public."Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Pipeline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Stage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Deal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Cadence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CadenceStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CadenceExecution" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LeadTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RefreshToken" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_self_or_superadmin ON public."Tenant";
CREATE POLICY tenant_self_or_superadmin
ON public."Tenant"
FOR ALL
USING (
  public.is_super_admin() OR id::text = public.current_tenant_id()
)
WITH CHECK (
  public.is_super_admin() OR id::text = public.current_tenant_id()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User', 'Pipeline', 'Stage', 'Lead', 'Deal', 'Message', 'Activity',
    'Cadence', 'CadenceStep', 'CadenceExecution', 'Tag', 'LeadTag', 'RefreshToken'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'tenant_isolation_' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (public.is_super_admin() OR "tenantId"::text = public.current_tenant_id()) WITH CHECK (public.is_super_admin() OR "tenantId"::text = public.current_tenant_id());',
      'tenant_isolation_' || t,
      t
    );
  END LOOP;
END $$;

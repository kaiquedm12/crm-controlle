-- Supabase RLS policies for CRM tables
-- Full model: service_role + app-level role/ownership policies.
-- Expected JWT custom claims for authenticated users:
--   app_user_id: text (matches table "User".id)
--   app_role: ADMIN | MANAGER | SELLER

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Pipeline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Stage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Deal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Cadence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CadenceStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CadenceExecution" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LeadTag" ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
	SELECT NULLIF(auth.jwt() ->> 'app_user_id', '');
$$;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
	SELECT COALESCE(auth.jwt() ->> 'app_role', '');
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
	SELECT public.current_app_role() IN ('ADMIN', 'MANAGER');
$$;

CREATE OR REPLACE FUNCTION public.can_access_lead(lead_id text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
	SELECT
		auth.role() = 'service_role'
		OR public.is_admin_or_manager()
		OR EXISTS (
			SELECT 1
			FROM public."Lead" l
			WHERE l.id = lead_id
				AND l."ownerId" = public.current_app_user_id()
		);
$$;

-- Clear previous policies
DROP POLICY IF EXISTS "service_role_all_User" ON public."User";
DROP POLICY IF EXISTS "service_role_all_RefreshToken" ON public."RefreshToken";
DROP POLICY IF EXISTS "service_role_all_Pipeline" ON public."Pipeline";
DROP POLICY IF EXISTS "service_role_all_Stage" ON public."Stage";
DROP POLICY IF EXISTS "service_role_all_Lead" ON public."Lead";
DROP POLICY IF EXISTS "service_role_all_Deal" ON public."Deal";
DROP POLICY IF EXISTS "service_role_all_Cadence" ON public."Cadence";
DROP POLICY IF EXISTS "service_role_all_CadenceStep" ON public."CadenceStep";
DROP POLICY IF EXISTS "service_role_all_CadenceExecution" ON public."CadenceExecution";
DROP POLICY IF EXISTS "service_role_all_Message" ON public."Message";
DROP POLICY IF EXISTS "service_role_all_Activity" ON public."Activity";
DROP POLICY IF EXISTS "service_role_all_Tag" ON public."Tag";
DROP POLICY IF EXISTS "service_role_all_LeadTag" ON public."LeadTag";

-- USER
DROP POLICY IF EXISTS "user_select_self_or_manager" ON public."User";
CREATE POLICY "user_select_self_or_manager"
ON public."User"
FOR SELECT
USING (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
	OR id = public.current_app_user_id()
);

DROP POLICY IF EXISTS "user_insert_admin_only" ON public."User";
CREATE POLICY "user_insert_admin_only"
ON public."User"
FOR INSERT
WITH CHECK (
	auth.role() = 'service_role'
	OR public.current_app_role() = 'ADMIN'
);

DROP POLICY IF EXISTS "user_update_self_or_admin" ON public."User";
CREATE POLICY "user_update_self_or_admin"
ON public."User"
FOR UPDATE
USING (
	auth.role() = 'service_role'
	OR public.current_app_role() = 'ADMIN'
	OR id = public.current_app_user_id()
)
WITH CHECK (
	auth.role() = 'service_role'
	OR public.current_app_role() = 'ADMIN'
	OR id = public.current_app_user_id()
);

DROP POLICY IF EXISTS "user_delete_admin_only" ON public."User";
CREATE POLICY "user_delete_admin_only"
ON public."User"
FOR DELETE
USING (
	auth.role() = 'service_role'
	OR public.current_app_role() = 'ADMIN'
);

-- REFRESH TOKEN
DROP POLICY IF EXISTS "refresh_token_owner_or_service" ON public."RefreshToken";
CREATE POLICY "refresh_token_owner_or_service"
ON public."RefreshToken"
FOR ALL
USING (
	auth.role() = 'service_role'
	OR "userId" = public.current_app_user_id()
)
WITH CHECK (
	auth.role() = 'service_role'
	OR "userId" = public.current_app_user_id()
);

-- LEAD
DROP POLICY IF EXISTS "lead_select_owner_or_manager" ON public."Lead";
CREATE POLICY "lead_select_owner_or_manager"
ON public."Lead"
FOR SELECT
USING (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
	OR "ownerId" = public.current_app_user_id()
);

DROP POLICY IF EXISTS "lead_insert_owner_or_manager" ON public."Lead";
CREATE POLICY "lead_insert_owner_or_manager"
ON public."Lead"
FOR INSERT
WITH CHECK (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
	OR "ownerId" = public.current_app_user_id()
);

DROP POLICY IF EXISTS "lead_update_owner_or_manager" ON public."Lead";
CREATE POLICY "lead_update_owner_or_manager"
ON public."Lead"
FOR UPDATE
USING (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
	OR "ownerId" = public.current_app_user_id()
)
WITH CHECK (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
	OR "ownerId" = public.current_app_user_id()
);

DROP POLICY IF EXISTS "lead_delete_owner_or_manager" ON public."Lead";
CREATE POLICY "lead_delete_owner_or_manager"
ON public."Lead"
FOR DELETE
USING (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
	OR "ownerId" = public.current_app_user_id()
);

-- DEAL
DROP POLICY IF EXISTS "deal_all_by_lead_access" ON public."Deal";
CREATE POLICY "deal_all_by_lead_access"
ON public."Deal"
FOR ALL
USING (
	auth.role() = 'service_role'
	OR public.can_access_lead("leadId")
)
WITH CHECK (
	auth.role() = 'service_role'
	OR public.can_access_lead("leadId")
);

-- MESSAGE
DROP POLICY IF EXISTS "message_all_by_lead_access" ON public."Message";
CREATE POLICY "message_all_by_lead_access"
ON public."Message"
FOR ALL
USING (
	auth.role() = 'service_role'
	OR public.can_access_lead("leadId")
)
WITH CHECK (
	auth.role() = 'service_role'
	OR public.can_access_lead("leadId")
);

-- ACTIVITY
DROP POLICY IF EXISTS "activity_all_by_lead_access" ON public."Activity";
CREATE POLICY "activity_all_by_lead_access"
ON public."Activity"
FOR ALL
USING (
	auth.role() = 'service_role'
	OR public.can_access_lead("leadId")
)
WITH CHECK (
	auth.role() = 'service_role'
	OR public.can_access_lead("leadId")
);

-- LEAD TAG
DROP POLICY IF EXISTS "leadtag_all_by_lead_access" ON public."LeadTag";
CREATE POLICY "leadtag_all_by_lead_access"
ON public."LeadTag"
FOR ALL
USING (
	auth.role() = 'service_role'
	OR public.can_access_lead("leadId")
)
WITH CHECK (
	auth.role() = 'service_role'
	OR public.can_access_lead("leadId")
);

-- PIPELINE / STAGE / CADENCE / CADENCE STEP / CADENCE EXECUTION / TAG
DROP POLICY IF EXISTS "pipeline_select_all_authenticated" ON public."Pipeline";
CREATE POLICY "pipeline_select_all_authenticated"
ON public."Pipeline"
FOR SELECT
USING (auth.role() IN ('service_role', 'authenticated'));

DROP POLICY IF EXISTS "pipeline_write_manager_or_admin" ON public."Pipeline";
CREATE POLICY "pipeline_write_manager_or_admin"
ON public."Pipeline"
FOR ALL
USING (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
)
WITH CHECK (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
);

DROP POLICY IF EXISTS "stage_select_all_authenticated" ON public."Stage";
CREATE POLICY "stage_select_all_authenticated"
ON public."Stage"
FOR SELECT
USING (auth.role() IN ('service_role', 'authenticated'));

DROP POLICY IF EXISTS "stage_write_manager_or_admin" ON public."Stage";
CREATE POLICY "stage_write_manager_or_admin"
ON public."Stage"
FOR ALL
USING (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
)
WITH CHECK (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
);

DROP POLICY IF EXISTS "cadence_select_all_authenticated" ON public."Cadence";
CREATE POLICY "cadence_select_all_authenticated"
ON public."Cadence"
FOR SELECT
USING (auth.role() IN ('service_role', 'authenticated'));

DROP POLICY IF EXISTS "cadence_write_manager_or_admin" ON public."Cadence";
CREATE POLICY "cadence_write_manager_or_admin"
ON public."Cadence"
FOR ALL
USING (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
)
WITH CHECK (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
);

DROP POLICY IF EXISTS "cadencestep_select_all_authenticated" ON public."CadenceStep";
CREATE POLICY "cadencestep_select_all_authenticated"
ON public."CadenceStep"
FOR SELECT
USING (auth.role() IN ('service_role', 'authenticated'));

DROP POLICY IF EXISTS "cadencestep_write_manager_or_admin" ON public."CadenceStep";
CREATE POLICY "cadencestep_write_manager_or_admin"
ON public."CadenceStep"
FOR ALL
USING (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
)
WITH CHECK (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
);

DROP POLICY IF EXISTS "cadenceexec_all_by_lead_access" ON public."CadenceExecution";
CREATE POLICY "cadenceexec_all_by_lead_access"
ON public."CadenceExecution"
FOR ALL
USING (
	auth.role() = 'service_role'
	OR public.can_access_lead("leadId")
)
WITH CHECK (
	auth.role() = 'service_role'
	OR public.can_access_lead("leadId")
);

DROP POLICY IF EXISTS "tag_select_all_authenticated" ON public."Tag";
CREATE POLICY "tag_select_all_authenticated"
ON public."Tag"
FOR SELECT
USING (auth.role() IN ('service_role', 'authenticated'));

DROP POLICY IF EXISTS "tag_write_manager_or_admin" ON public."Tag";
CREATE POLICY "tag_write_manager_or_admin"
ON public."Tag"
FOR ALL
USING (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
)
WITH CHECK (
	auth.role() = 'service_role'
	OR public.is_admin_or_manager()
);

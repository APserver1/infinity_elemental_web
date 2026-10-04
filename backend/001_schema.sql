BEGIN;
CREATE TABLE IF NOT EXISTS public.ie_profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 nickname text NOT NULL CHECK (nickname ~ '^[a-zA-Z0-9_]{3,24}$'),
 display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 60),
 bio text NOT NULL DEFAULT '' CHECK (char_length(bio)<=500),
 avatar_url text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ie_profiles_nickname_unique ON public.ie_profiles(lower(nickname));
CREATE TABLE IF NOT EXISTS public.ie_admins (user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE);
CREATE OR REPLACE FUNCTION public.ie_is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.ie_admins WHERE user_id = (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid);
$$;
CREATE TABLE IF NOT EXISTS public.ie_releases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL CHECK(char_length(title) BETWEEN 1 AND 150),
 version text NOT NULL CHECK(char_length(version) BETWEEN 1 AND 40), summary text NOT NULL CHECK(char_length(summary)<=500),
 content text NOT NULL DEFAULT '',cover_url text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
 author_id uuid REFERENCES auth.users(id),created_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz,
 CHECK(status='draft' OR published_at IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS public.ie_release_assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),release_id uuid NOT NULL REFERENCES public.ie_releases(id) ON DELETE CASCADE,
 name text NOT NULL,platform text NOT NULL,url text NOT NULL,size bigint NOT NULL CHECK(size>=0),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ie_assets_release_idx ON public.ie_release_assets(release_id);
CREATE TABLE IF NOT EXISTS public.ie_bug_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 release_id uuid REFERENCES public.ie_releases(id) ON DELETE SET NULL,title text NOT NULL CHECK(char_length(title) BETWEEN 1 AND 140),
 description text NOT NULL CHECK(char_length(description) BETWEEN 15 AND 5000),steps text NOT NULL CHECK(char_length(steps) BETWEEN 10 AND 5000),
 platform text NOT NULL,attachment_url text,status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved','closed')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ie_bugs_user_idx ON public.ie_bug_reports(user_id);
ALTER TABLE public.ie_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ie_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ie_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ie_release_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ie_bug_reports ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE ON public.ie_profiles TO authenticated;
GRANT SELECT ON public.ie_admins TO authenticated;
GRANT SELECT ON public.ie_releases,public.ie_release_assets TO anon,authenticated;
GRANT INSERT,UPDATE,DELETE ON public.ie_releases,public.ie_release_assets TO authenticated;
GRANT SELECT,INSERT ON public.ie_bug_reports TO authenticated;
GRANT UPDATE(status) ON public.ie_bug_reports TO authenticated;
CREATE POLICY ie_profile_read ON public.ie_profiles FOR SELECT TO authenticated USING (id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid);
CREATE POLICY ie_profile_create ON public.ie_profiles FOR INSERT TO authenticated WITH CHECK(id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid);
CREATE POLICY ie_profile_edit ON public.ie_profiles FOR UPDATE TO authenticated USING(id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid) WITH CHECK(id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid);
CREATE POLICY ie_admin_self ON public.ie_admins FOR SELECT TO authenticated USING(user_id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid);
CREATE POLICY ie_release_read ON public.ie_releases FOR SELECT TO anon,authenticated USING(status='published' OR public.ie_is_admin());
CREATE POLICY ie_release_admin ON public.ie_releases FOR ALL TO authenticated USING(public.ie_is_admin()) WITH CHECK(public.ie_is_admin());
CREATE POLICY ie_assets_read ON public.ie_release_assets FOR SELECT TO anon,authenticated USING(EXISTS(SELECT 1 FROM public.ie_releases r WHERE r.id=release_id AND (r.status='published' OR public.ie_is_admin())));
CREATE POLICY ie_assets_admin ON public.ie_release_assets FOR ALL TO authenticated USING(public.ie_is_admin()) WITH CHECK(public.ie_is_admin());
CREATE POLICY ie_bug_read ON public.ie_bug_reports FOR SELECT TO authenticated USING(user_id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid OR public.ie_is_admin());
CREATE POLICY ie_bug_create ON public.ie_bug_reports FOR INSERT TO authenticated WITH CHECK(user_id=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid AND status='open');
CREATE POLICY ie_bug_admin_update ON public.ie_bug_reports FOR UPDATE TO authenticated USING(public.ie_is_admin()) WITH CHECK(public.ie_is_admin());
REVOKE ALL ON FUNCTION public.ie_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ie_is_admin() TO anon,authenticated,project_admin;
NOTIFY pgrst,'reload schema';
COMMIT;

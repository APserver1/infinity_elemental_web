CREATE OR REPLACE FUNCTION public.ie_assign_owner() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF lower(NEW.email)='a.pvovapaypal@gmail.com' AND NEW.email_verified THEN
   INSERT INTO public.ie_admins(user_id) VALUES(NEW.id) ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.ie_assign_owner() FROM PUBLIC;
CREATE TRIGGER ie_owner_after_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.ie_assign_owner();
INSERT INTO public.ie_admins(user_id) SELECT id FROM auth.users WHERE lower(email)='a.pvovapaypal@gmail.com' AND email_verified ON CONFLICT DO NOTHING;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
CREATE POLICY ie_storage_read ON storage.objects FOR SELECT TO anon,authenticated USING (
 bucket IN ('ie-media','ie-builds') OR
 (bucket='ie-bug-attachments' AND (uploaded_by=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub') OR public.ie_is_admin()))
);
CREATE POLICY ie_storage_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (
 (bucket IN ('ie-media','ie-builds') AND public.ie_is_admin()) OR
 (bucket='ie-bug-attachments' AND uploaded_by=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub') AND split_part(key,'/',1)=uploaded_by AND size<=10485760 AND mime_type IN ('image/png','image/jpeg','image/webp'))
);
CREATE POLICY ie_storage_update ON storage.objects FOR UPDATE TO authenticated USING (
 (bucket IN ('ie-media','ie-builds') AND public.ie_is_admin()) OR
 (bucket='ie-bug-attachments' AND (uploaded_by=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub') OR public.ie_is_admin()))
) WITH CHECK (
 (bucket IN ('ie-media','ie-builds') AND public.ie_is_admin()) OR
 (bucket='ie-bug-attachments' AND uploaded_by=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub') AND size<=10485760 AND mime_type IN ('image/png','image/jpeg','image/webp'))
);
CREATE POLICY ie_storage_delete ON storage.objects FOR DELETE TO authenticated USING (
 (bucket IN ('ie-media','ie-builds') AND public.ie_is_admin()) OR
 (bucket='ie-bug-attachments' AND (uploaded_by=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub') OR public.ie_is_admin()))
);

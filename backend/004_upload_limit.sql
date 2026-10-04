BEGIN;
ALTER TABLE storage.config DROP CONSTRAINT IF EXISTS config_max_file_size_mb_check;
-- El parser multipart corta al alcanzar exactamente su límite. Reservamos
-- 1 MB de margen de transporte; la política del bucket limita el archivo a 500 MB.
ALTER TABLE storage.config ADD CONSTRAINT config_max_file_size_mb_check CHECK(max_file_size_mb BETWEEN 1 AND 501);
UPDATE storage.config SET max_file_size_mb=501,updated_at=now();
ALTER POLICY ie_storage_insert ON storage.objects WITH CHECK (
 (bucket='ie-media' AND public.ie_is_admin()) OR
 (bucket='ie-builds' AND public.ie_is_admin() AND size<=524288000) OR
 (bucket='ie-bug-attachments' AND uploaded_by=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub') AND split_part(key,'/',1)=uploaded_by AND size<=10485760 AND mime_type IN ('image/png','image/jpeg','image/webp'))
);
ALTER POLICY ie_storage_update ON storage.objects WITH CHECK (
 (bucket='ie-media' AND public.ie_is_admin()) OR
 (bucket='ie-builds' AND public.ie_is_admin() AND size<=524288000) OR
 (bucket='ie-bug-attachments' AND uploaded_by=(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub') AND size<=10485760 AND mime_type IN ('image/png','image/jpeg','image/webp'))
);
COMMIT;

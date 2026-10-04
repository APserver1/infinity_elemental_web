import { createClient } from "@insforge/sdk";
export const backend = createClient({
  baseUrl: import.meta.env.VITE_INSFORGE_URL || "https://insforge.cineasta.org",
  anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY || undefined,
});
export const MAX_BUILD_BYTES = 500 * 1024 * 1024;
const PUBLIC_UPLOAD_BYTES = 90 * 1024 * 1024;
export async function uploadBuild(key: string, file: File) {
  if (file.size > MAX_BUILD_BYTES)
    throw new Error("Cada archivo debe ser de 500 MB o menos.");
  if (file.size <= PUBLIC_UPLOAD_BYTES)
    return check(await backend.storage.from("ie-builds").upload(key, file))!;
  const uploadUrl = import.meta.env.VITE_INSFORGE_UPLOAD_URL;
  if (!uploadUrl)
    throw new Error(
      "Falta configurar la conexión de carga de archivos grandes.",
    );
  const token = await backend.getHttpClient().getValidAccessToken(120);
  if (!token)
    throw new Error("Vuelve a iniciar sesión para cargar el archivo.");
  const uploadClient = createClient({
    baseUrl: uploadUrl,
    accessToken: token,
    timeout: 15 * 60 * 1000,
    retryCount: 0,
  });
  const result = await uploadClient.storage.from("ie-builds").upload(key, file);
  if (result.error) {
    if (
      result.error.statusCode === 0 ||
      /fetch|network|timeout/i.test(result.error.message)
    ) {
      throw new Error(
        "No se pudo completar la carga privada. Mantén Tailscale conectado y permite el acceso a la red local si tu navegador lo solicita.",
      );
    }
    throw result.error;
  }
  const uploaded = result.data!;
  const publicOrigin = new URL(backend.getHttpClient().baseUrl).origin;
  const fileUrl = new URL(uploaded.url);
  return { ...uploaded, url: publicOrigin + fileUrl.pathname + fileUrl.search };
}
export type Profile = {
  id: string;
  nickname: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
};
export type Release = {
  id: string;
  title: string;
  version: string;
  summary: string;
  content: string;
  cover_url: string;
  status: string;
  created_at: string;
  published_at: string | null;
};
export type Asset = {
  id: string;
  release_id: string;
  name: string;
  platform: string;
  url: string;
  size: number;
};
export function check<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}
export function message(error: unknown) {
  const detail = error as { code?: string; error?: string; message?: string };
  if (detail?.code === "23505")
    return "Ese nickname ya está en uso. Elige otro.";
  if (detail?.error === "INVALID_CREDENTIALS")
    return "El correo o la contraseña no son correctos.";
  if (detail?.error === "STORAGE_PERMISSION_DENIED")
    return "Tu cuenta no tiene permiso para cargar ese archivo.";
  if (detail?.code === "42501")
    return "Tu cuenta no tiene permisos para esta acción.";
  return error instanceof Error
    ? error.message
    : (error as { message?: string })?.message ||
        "No se pudo completar la operación. Inténtalo de nuevo.";
}

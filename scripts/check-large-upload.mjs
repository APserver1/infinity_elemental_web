import { createAdminClient } from "@insforge/sdk";
const admin = createAdminClient({
  baseUrl: process.env.INSFORGE_UPLOAD_URL || "https://insforge.cineasta.org",
  apiKey: process.env.INSFORGE_API_KEY,
  timeout: 15 * 60 * 1000,
  retryCount: 0,
});
const sizeMb = Number(process.argv[2] || 51);
const key = `upload-limit-test/${crypto.randomUUID()}-${sizeMb}mb.bin`;
const file = new Blob([new Uint8Array(sizeMb * 1024 * 1024)], {
  type: "application/octet-stream",
});
const start = Date.now();
const result = await admin.storage.from("ie-builds").upload(key, file);
console.log(
  JSON.stringify({
    sizeMb,
    seconds: Math.round((Date.now() - start) / 1000),
    uploadedBytes: result.data?.size,
    error: result.error
      ? { message: result.error.message, status: result.error.statusCode }
      : null,
  }),
);
if (result.data) {
  const removed = await admin.storage.from("ie-builds").remove(key);
  console.log("Test file removed:", !removed.error);
} else process.exitCode = 1;

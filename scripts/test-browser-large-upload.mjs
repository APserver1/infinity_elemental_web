import { chromium } from "@playwright/test";
import { createClient, createAdminClient } from "@insforge/sdk";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import assert from "node:assert/strict";
const baseUrl = "https://insforge.cineasta.org";
const anonKey = fs
  .readFileSync(".env.local", "utf8")
  .match(/VITE_INSFORGE_ANON_KEY=(.*)/)[1]
  .trim();
const admin = createAdminClient({
  baseUrl,
  apiKey: process.env.INSFORGE_API_KEY,
});
const userClient = createClient({ baseUrl, anonKey });
const email = `ie-test-upload-${Date.now()}@example.com`;
const password = "TestInfinity_92!";
const signup = await userClient.auth.signUp({
  email,
  password,
  name: "UploadTest",
});
assert.equal(signup.error, null);
const id = signup.data.user.id;
const key = `${id}/${crypto.randomUUID()}-browser-110mb.bin`;
let browser;
try {
  fs.writeFileSync(
    ".backend/browser-upload-grant.json",
    JSON.stringify({
      query: `INSERT INTO public.ie_admins(user_id) VALUES('${id}') ON CONFLICT DO NOTHING;`,
    }),
  );
  const grant = spawnSync(
    process.execPath,
    [
      "scripts/backend.mjs",
      "run-raw-sql",
      ".backend/browser-upload-grant.json",
    ],
    { env: process.env, encoding: "utf8", timeout: 60000 },
  );
  assert.equal(grant.status, 0);
  assert.ok(!grant.stdout.includes("isError"));
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:5173");
  const outcome = await page.evaluate(
    async ({ email, password, key }) => {
      const module = await import("/src/backend.ts");
      const session = await module.backend.auth.signInWithPassword({
        email,
        password,
      });
      if (session.error) throw Error(session.error.message);
      const file = new File(
        [new Uint8Array(110 * 1024 * 1024)],
        "browser-110mb.bin",
        { type: "application/octet-stream" },
      );
      const uploaded = await module.uploadBuild(key, file);
      return { size: uploaded.size, url: uploaded.url };
    },
    { email, password, key },
  );
  assert.equal(outcome.size, 110 * 1024 * 1024);
  assert.equal(new URL(outcome.url).origin, baseUrl);
  const download = await page.request.get(outcome.url, {
    headers: { Range: "bytes=0-1023" },
  });
  assert.ok([200, 206].includes(download.status()));
  console.log(
    "PASS: browser authenticated as a site administrator, 110 MB upload through private HTTPS, public download URL and download access.",
  );
} finally {
  await browser?.close();
  await admin.storage.from("ie-builds").remove(key);
  const deleted = await fetch(`${baseUrl}/api/auth/users`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${process.env.INSFORGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userIds: [id] }),
  });
  console.log("Temporary test account removed:", deleted.ok);
}

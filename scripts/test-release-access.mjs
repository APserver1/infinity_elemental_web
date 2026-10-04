import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";

const baseUrl = process.env.TEST_BASE_URL || "http://localhost:5173";
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let signedIn = false;
  let releaseQueries = 0;
  const user = { id: "access-test", email: "access-test@example.com" };
  const accessToken = [
    Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url"),
    Buffer.from(
      JSON.stringify({
        sub: user.id,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString("base64url"),
    "mock-signature",
  ].join(".");
  const release = {
    id: "release-test",
    title: "Versión de prueba",
    version: "0.1",
    summary: "Notas de la versión.",
    content: "## Cambios\n\nUn nuevo mundo.",
    cover_url: "/images/river.png",
    published_at: "2026-10-04T12:00:00Z",
  };
  await page.route("**/api/auth/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/sessions" && route.request().method() === "POST")
      signedIn = true;
    await route.fulfill(
      signedIn
        ? { json: { user, accessToken } }
        : {
            status: 401,
            json: {
              error: "AUTH_INVALID_CREDENTIALS",
              message: "No token provided",
            },
          },
    );
  });
  await page.route("**/api/database/records/**", async (route) => {
    const url = new URL(route.request().url());
    let data;
    if (url.pathname.endsWith("/ie_releases")) {
      releaseQueries++;
      data = url.searchParams.has("id") ? release : [release];
    } else if (url.pathname.endsWith("/ie_release_assets")) {
      releaseQueries++;
      data = [
        {
          id: "asset-test",
          platform: "Windows",
          name: "game.zip",
          size: 1024,
          url: "https://example.com/game.zip",
        },
      ];
    } else if (url.pathname.endsWith("/ie_profiles"))
      data = { ...user, nickname: "Player" };
    else data = [];
    await route.fulfill({ json: data });
  });
  for (const [path, title] of [
    ["/versiones", "Inicia sesión para ver las versiones."],
    ["/descargas", "Inicia sesión para descargar el juego."],
    [
      "/versiones/release-test#archivos",
      "Inicia sesión para ver y descargar esta versión.",
    ],
  ]) {
    await page.goto(baseUrl + path);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".release-card, .download-row")).toHaveCount(0);
    assert.equal(releaseQueries, 0, "Guests must not query release data");
  }
  await page
    .locator(".release-access")
    .getByRole("link", { name: "Iniciar sesión" })
    .click();
  await page.getByRole("link", { name: "Regístrate", exact: true }).click();
  await page.getByRole("link", { name: "Inicia sesión", exact: true }).click();
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill("Mock-password-123");
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page).toHaveURL(baseUrl + "/versiones/release-test#archivos");
  await expect(
    page.getByRole("heading", { name: release.title, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".download-row")).toHaveCount(1);
  for (const path of ["/versiones", "/descargas"]) {
    await page.goto(baseUrl + path);
    await expect(page.locator(".release-card")).toHaveCount(1);
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: guest notices, no guest queries, login return path, authenticated versions and downloads",
  );
} finally {
  await browser.close();
}

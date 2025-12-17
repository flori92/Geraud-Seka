import type { APIRequestContext, Page } from "@playwright/test";

export async function loginIfNeeded(page: Page, request: APIRequestContext) {
  const accessToken = process.env.SEKA_E2E_ACCESS_TOKEN;
  const refreshToken = process.env.SEKA_E2E_REFRESH_TOKEN;
  const email = process.env.SEKA_E2E_EMAIL;
  const password = process.env.SEKA_E2E_PASSWORD;
  const apiBaseUrl = process.env.SEKA_E2E_API_BASE_URL ?? "http://localhost:8000";

  if (!accessToken && (!email || !password)) {
    throw new Error(
      "Pré-requis E2E manquant: définis soit SEKA_E2E_ACCESS_TOKEN (optionnellement SEKA_E2E_REFRESH_TOKEN), soit SEKA_E2E_EMAIL + SEKA_E2E_PASSWORD"
    );
  }

  if (accessToken) {
    await page.goto("/");
    await page.evaluate(
      ({ at, rt }) => {
        localStorage.setItem("seka_access_token", at);
        if (rt) localStorage.setItem("seka_refresh_token", rt);
        localStorage.setItem("seka_view_mode", "accounting");
      },
      { at: accessToken, rt: refreshToken ?? "" }
    );
    return;
  }

  if (!email || !password) {
    throw new Error("SEKA_E2E_EMAIL/SEKA_E2E_PASSWORD manquants");
  }

  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  const response = await request.post(`${apiBaseUrl}/api/v1/auth/login`, {
    data: body.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!response.ok()) {
    const text = await response.text().catch(() => "");
    throw new Error(`Login API failed (${response.status()}): ${text}`);
  }

  const tokens = (await response.json()) as { access_token: string; refresh_token?: string };

  await page.goto("/");
  await page.evaluate(
    ({ at, rt }) => {
      localStorage.setItem("seka_access_token", at);
      if (rt) localStorage.setItem("seka_refresh_token", rt);
      localStorage.setItem("seka_view_mode", "accounting");
    },
    { at: tokens.access_token, rt: tokens.refresh_token ?? "" }
  );
}

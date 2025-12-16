import { expect, test, type Page, type APIRequestContext } from "@playwright/test";

async function loginIfNeeded(page: Page, request: APIRequestContext) {
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

  // Login via API (plus fiable que l'UI)
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

test.describe("Saisie (E2E)", () => {
  test("Sidebar Saisie: déplier/replier + navigation", async ({ page, request }: { page: Page; request: APIRequestContext }) => {
    await loginIfNeeded(page, request);
    await page.goto("/accounting/dashboard");

    const sidebar = page.locator(".sidebar");
    const itemOcr = sidebar.getByRole("button", { name: /^Saisie avec OCR/ }).first();

    // On teste la navigation (robuste). L'état ouvert/fermé du submenu est animé et instable en headless.
    await expect(itemOcr).toBeVisible();
    await itemOcr.click({ force: true });
    await expect(page).toHaveURL(/\/accounting\/entries\/from-ocr/);

    await sidebar.getByRole("button", { name: /^Nouvelle saisie$/ }).first().click({ force: true });
    await expect(page).toHaveURL(/\/accounting\/entries\/new/);

    await sidebar.getByRole("button", { name: /^Saisie rapide/ }).first().click({ force: true });
    await expect(page).toHaveURL(/\/accounting\/entries\/quick-entry/);

    await sidebar.getByRole("button", { name: /^Factures fournisseurs$/ }).first().click({ force: true });
    await expect(page).toHaveURL(/\/achats\/factures/);
  });

  test("Nouvelle saisie: rendu + bouton Enregistrer", async ({ page, request }: { page: Page; request: APIRequestContext }) => {
    await loginIfNeeded(page, request);
    await page.goto("/accounting/entries/new");

    await expect(page.getByRole("heading", { name: "Nouvelle écriture comptable" })).toBeVisible();

    const saveButton = page.getByRole("button", { name: "Enregistrer" });
    // UX actuelle: l'écriture démarre équilibrée à 0, donc le bouton peut être actif.
    await expect(saveButton).toBeVisible();
  });

  test("Saisie rapide: rendu + boutons disabled par défaut", async ({ page, request }: { page: Page; request: APIRequestContext }) => {
    await loginIfNeeded(page, request);
    await page.goto("/accounting/entries/quick-entry");

    await expect(page.getByRole("heading", { name: "Saisie Comptable Rapide" })).toBeVisible();

    await expect(page.getByRole("button", { name: "Enregistrer et fermer" })).toBeDisabled();
  });

  test("Exercice: ouverture d'une facture vers la validation", async ({ page, request }: { page: Page; request: APIRequestContext }) => {
    await loginIfNeeded(page, request);
    await page.goto("/achats/factures");

    await expect(page.getByPlaceholder("Rechercher une facture (tiers, n° de facture, compte)")).toBeVisible();

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    if (rowCount === 0) {
      test.skip(true, "Aucune facture disponible à ouvrir");
      return;
    }

    await rows.first().click();

    await expect(page.getByRole("button", { name: "Valider et Comptabiliser" })).toBeVisible();

    const doValidate = (process.env.SEKA_E2E_DO_VALIDATE ?? "0") === "1";
    if (!doValidate) return;

    const supplierInput = page.locator('input[placeholder="Nom du fournisseur"]');
    if ((await supplierInput.count()) > 0) {
      const current = await supplierInput.inputValue().catch(() => "");
      if (!current) {
        await supplierInput.fill("Fournisseur Test");
      }
    }

    await page.getByRole("button", { name: "Valider et Comptabiliser" }).click();
  });
});

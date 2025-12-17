import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { loginIfNeeded } from "./utils/auth";

test.describe("Journaux (E2E)", () => {
  test("Accès aux journaux + changement d'onglet", async ({
    page,
    request,
  }: {
    page: Page;
    request: APIRequestContext;
  }) => {
    await loginIfNeeded(page, request);

    await page.goto("/accounting/journals");

    const main = page.locator("main");

    await expect(main.getByRole("heading", { name: "Journaux comptables" })).toBeVisible();

    // Le libellé existe aussi dans la sidebar: on prend le dernier match (onglet dans le contenu)
    const tabAchats = main.getByRole("button", { name: "Journal des achats" }).last();
    const tabVentes = main.getByRole("button", { name: "Journal des ventes" }).last();

    await expect(tabAchats).toBeVisible();
    await expect(tabVentes).toBeVisible();

    await tabVentes.click({ force: true });
    await expect(page).toHaveURL(/\/accounting\/journals\?type=VTE/);
  });
});

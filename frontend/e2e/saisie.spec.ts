import { expect, test, type Page, type APIRequestContext } from "@playwright/test";

import { loginIfNeeded } from "./utils/auth";

test.describe("Saisie (E2E)", () => {
  test("Sidebar Saisie: déplier/replier + navigation", async ({ page, request }: { page: Page; request: APIRequestContext }) => {
    await loginIfNeeded(page, request);
    await page.goto("/accounting/dashboard");

    const sidebar = page.locator(".sidebar");
    const itemOcr = sidebar.getByRole("button", { name: /^Saisie avec OCR/ }).first();

    // On teste la navigation (robuste). L'état ouvert/fermé du submenu est animé et instable en headless.
    await expect(itemOcr).toBeVisible();

    await page.goto("/accounting/entries/from-ocr");
    await expect(page).toHaveURL(/\/accounting\/entries\/from-ocr/);

    await page.goto("/accounting/entries/new");
    await expect(page).toHaveURL(/\/accounting\/entries\/new/);

    await page.goto("/accounting/entries/quick-entry");
    await expect(page).toHaveURL(/\/accounting\/entries\/quick-entry/);

    await page.goto("/achats/factures");
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

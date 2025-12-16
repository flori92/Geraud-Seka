import { expect, test, type Page } from "@playwright/test";

async function loginIfNeeded(page: Page) {
  const email = process.env.SEKA_E2E_EMAIL;
  const password = process.env.SEKA_E2E_PASSWORD;

  if (!email || !password) {
    test.skip(true, "SEKA_E2E_EMAIL/SEKA_E2E_PASSWORD non définis");
    return;
  }

  await page.goto("/dashboard");
  if (page.url().includes("/login")) {
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL(/\/dashboard/);
  }
}

test.describe("Saisie (E2E)", () => {
  test("Sidebar Saisie: déplier/replier + navigation", async ({ page }: { page: Page }) => {
    await loginIfNeeded(page);

    await page.getByRole("button", { name: "Comptabilité" }).click();

    const menuSaisie = page.getByRole("button", { name: "Saisie" });
    await menuSaisie.click();

    const itemOcr = page.getByRole("button", { name: "Saisie avec OCR" });
    await expect(itemOcr).toBeVisible();

    await menuSaisie.click();
    await expect(itemOcr).toBeHidden();

    await menuSaisie.click();
    await itemOcr.click();
    await expect(page).toHaveURL(/\/accounting\/entries\/from-ocr/);

    await page.getByRole("button", { name: "Nouvelle saisie" }).click();
    await expect(page).toHaveURL(/\/accounting\/entries\/new/);

    await page.getByRole("button", { name: "Saisie rapide" }).click();
    await expect(page).toHaveURL(/\/accounting\/entries\/quick-entry/);

    await page.getByRole("button", { name: "Factures fournisseurs" }).click();
    await expect(page).toHaveURL(/\/achats\/factures/);
  });

  test("Nouvelle saisie: rendu + bouton Enregistrer", async ({ page }: { page: Page }) => {
    await loginIfNeeded(page);
    await page.goto("/accounting/entries/new");

    await expect(page.getByRole("heading", { name: "Nouvelle écriture comptable" })).toBeVisible();

    const saveButton = page.getByRole("button", { name: "Enregistrer" });
    await expect(saveButton).toBeDisabled();
  });

  test("Saisie rapide: rendu + boutons disabled par défaut", async ({ page }: { page: Page }) => {
    await loginIfNeeded(page);
    await page.goto("/accounting/entries/quick-entry");

    await expect(page.getByRole("heading", { name: "Saisie Comptable Rapide" })).toBeVisible();

    await expect(page.getByRole("button", { name: "Enregistrer et fermer" })).toBeDisabled();
  });

  test("Exercice: ouverture d'une facture vers la validation", async ({ page }: { page: Page }) => {
    await loginIfNeeded(page);
    await page.goto("/achats/factures");

    await expect(page.getByRole("heading", { name: "Factures fournisseurs" })).toBeVisible();

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

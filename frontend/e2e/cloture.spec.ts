import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { loginIfNeeded } from "./utils/auth";

test.describe("Clôture (E2E)", () => {
  test("Accès pages clôture", async ({
    page,
    request,
  }: {
    page: Page;
    request: APIRequestContext;
  }) => {
    await loginIfNeeded(page, request);

    await page.goto("/accounting/closing-entries");
    await expect(page.getByRole("heading", { name: "Écritures de clôture" })).toBeVisible();

    await page.goto("/accounting/inventory");
    await expect(page.getByRole("heading", { name: "Inventaire" })).toBeVisible();

    await page.goto("/accounting/provisions");
    await expect(page.getByRole("heading", { name: "Provisions" })).toBeVisible();

    await page.goto("/accounting/depreciations");
    await expect(page.getByRole("heading", { name: "Amortissements" })).toBeVisible();

    await page.goto("/accounting/period-validation");
    await expect(page.getByRole("heading", { name: "Validation période" })).toBeVisible();
  });
});

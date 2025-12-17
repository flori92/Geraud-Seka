import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { loginIfNeeded } from "./utils/auth";

test.describe("Révision (E2E)", () => {
  test("Accès balance / grand livre / lettrage / contrôles", async ({
    page,
    request,
  }: {
    page: Page;
    request: APIRequestContext;
  }) => {
    await loginIfNeeded(page, request);

    await page.goto("/accounting/balance");
    await expect(page.getByRole("heading", { name: "Balance générale" })).toBeVisible();

    await page.goto("/accounting/ledger");
    await expect(page.getByRole("heading", { name: "Grand livre" })).toBeVisible();

    await page.goto("/accounting/lettering");
    await expect(page.getByRole("heading", { name: "Lettrage" })).toBeVisible();

    await page.goto("/accounting/consistency-checks");
    await expect(page.getByRole("heading", { name: "Contrôles de cohérence" })).toBeVisible();
  });
});

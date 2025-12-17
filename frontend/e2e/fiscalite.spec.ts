import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { loginIfNeeded } from "./utils/auth";

test.describe("Fiscalité (E2E)", () => {
  test("Accès TVA / liasse / IS-IR / autres taxes / export FEC", async ({
    page,
    request,
  }: {
    page: Page;
    request: APIRequestContext;
  }) => {
    await loginIfNeeded(page, request);

    await page.goto("/tax/tva-declaration");
    await expect(page.getByRole("heading", { name: "Déclaration TVA" })).toBeVisible();

    await page.goto("/tax/liasse-fiscale");
    await expect(page.getByRole("heading", { name: "Liasse fiscale" })).toBeVisible();

    await page.goto("/tax/is-ir");
    await expect(page.getByRole("heading", { name: "IS / IR" })).toBeVisible();

    await page.goto("/tax/other-taxes");
    await expect(page.getByRole("heading", { name: "Taxes diverses" })).toBeVisible();

    await page.goto("/accounting/export-fec");
    await expect(page.getByRole("heading", { name: "Export FEC" })).toBeVisible();
  });
});

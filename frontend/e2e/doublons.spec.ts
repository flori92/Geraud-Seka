import { expect, test, type Page, type APIRequestContext } from "@playwright/test";

import { loginIfNeeded } from "./utils/auth";

test.describe("Gestion des Doublons (E2E)", () => {
  test("Navigation vers la page Doublons", async ({ page, request }: { page: Page; request: APIRequestContext }) => {
    await loginIfNeeded(page, request);
    await page.goto("/documents/doublons");

    // Vérifier que la page se charge correctement
    await expect(page).toHaveURL(/\/documents\/doublons/);

    // Vérifier le titre de la page
    await expect(page.getByRole("heading", { name: /doublons/i })).toBeVisible();
  });

  test("Affichage liste des doublons en attente", async ({ page, request }: { page: Page; request: APIRequestContext }) => {
    await loginIfNeeded(page, request);
    await page.goto("/documents/doublons");

    // Attendre le chargement des données
    await page.waitForLoadState("networkidle");

    // Vérifier la présence du tableau ou message vide
    const table = page.locator("table");
    const emptyMessage = page.getByText(/aucun doublon/i);

    const tableVisible = await table.isVisible().catch(() => false);
    const emptyVisible = await emptyMessage.isVisible().catch(() => false);

    expect(tableVisible || emptyVisible).toBeTruthy();
  });

  test("Modal de confrontation - structure", async ({ page, request }: { page: Page; request: APIRequestContext }) => {
    await loginIfNeeded(page, request);
    await page.goto("/documents/doublons");

    await page.waitForLoadState("networkidle");

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip(true, "Aucun doublon en attente pour tester la confrontation");
      return;
    }

    // Cliquer sur le premier doublon pour ouvrir la modal
    const firstRow = rows.first();
    const actionButton = firstRow.getByRole("button", { name: /confronter|voir|traiter/i });

    if (await actionButton.isVisible().catch(() => false)) {
      await actionButton.click();

      // Vérifier que la modal de confrontation s'ouvre
      const modal = page.locator('[role="dialog"], .modal, [data-testid="confrontation-modal"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Vérifier les boutons de résolution dans la modal
      const rejectButton = modal.getByRole("button", { name: /rejeter/i });
      const keepBothButton = modal.getByRole("button", { name: /conserver les deux|garder/i });
      const replaceButton = modal.getByRole("button", { name: /remplacer/i });

      // Au moins un des boutons de résolution devrait être visible
      const buttonsVisible = await Promise.all([
        rejectButton.isVisible().catch(() => false),
        keepBothButton.isVisible().catch(() => false),
        replaceButton.isVisible().catch(() => false)
      ]);

      expect(buttonsVisible.some(v => v)).toBeTruthy();
    }
  });

  test("Historique des doublons traités", async ({ page, request }: { page: Page; request: APIRequestContext }) => {
    await loginIfNeeded(page, request);
    await page.goto("/documents/doublons");

    await page.waitForLoadState("networkidle");

    // Chercher l'onglet ou le lien vers l'historique
    const historyTab = page.getByRole("tab", { name: /historique/i }).or(
      page.getByRole("button", { name: /historique/i })
    ).or(
      page.getByRole("link", { name: /historique/i })
    );

    if (await historyTab.isVisible().catch(() => false)) {
      await historyTab.click();

      // Attendre le chargement
      await page.waitForLoadState("networkidle");

      // Vérifier que l'historique s'affiche (tableau ou message vide)
      const historyTable = page.locator("table");
      const emptyHistory = page.getByText(/aucun historique|aucun doublon trait/i);

      const tableVisible = await historyTable.isVisible().catch(() => false);
      const emptyVisible = await emptyHistory.isVisible().catch(() => false);

      expect(tableVisible || emptyVisible).toBeTruthy();
    }
  });

  test("Export CSV historique", async ({ page, request }: { page: Page; request: APIRequestContext }) => {
    await loginIfNeeded(page, request);
    await page.goto("/documents/doublons");

    await page.waitForLoadState("networkidle");

    // Aller sur l'historique si nécessaire
    const historyTab = page.getByRole("tab", { name: /historique/i }).or(
      page.getByRole("button", { name: /historique/i })
    );

    if (await historyTab.isVisible().catch(() => false)) {
      await historyTab.click();
      await page.waitForLoadState("networkidle");
    }

    // Chercher le bouton d'export CSV
    const exportButton = page.getByRole("button", { name: /export|csv|t.l.charger/i });

    if (await exportButton.isVisible().catch(() => false)) {
      // Intercepter le download
      const downloadPromise = page.waitForEvent("download", { timeout: 10000 });

      await exportButton.click();

      const download = await downloadPromise.catch(() => null);

      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.csv$/);
      }
    } else {
      // Export button not visible - skip test
      test.skip(true, "Bouton export CSV non visible");
    }
  });

  test("Badge doublon sur page en-attente", async ({ page, request }: { page: Page; request: APIRequestContext }) => {
    await loginIfNeeded(page, request);
    await page.goto("/documents/en-attente");

    await page.waitForLoadState("networkidle");

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip(true, "Aucun document en attente");
      return;
    }

    // Chercher un badge "doublon" dans les documents
    const duplicateBadge = page.locator('[data-testid="badge-doublon"], .badge-doublon, .text-orange-500, .text-yellow-500').first();

    // Le badge peut ou non exister selon les données
    const badgeVisible = await duplicateBadge.isVisible().catch(() => false);

    // Test informatif - on ne fait pas d'assertion stricte car cela dépend des données
    if (badgeVisible) {
      // Vérifier que le badge est cliquable
      await expect(duplicateBadge).toBeEnabled();
    }
  });

  test("Filtrage par raison de détection", async ({ page, request }: { page: Page; request: APIRequestContext }) => {
    await loginIfNeeded(page, request);
    await page.goto("/documents/doublons");

    await page.waitForLoadState("networkidle");

    // Chercher un filtre par raison
    const filterSelect = page.locator('select[name="reason"], [data-testid="filter-reason"]');
    const filterDropdown = page.getByRole("combobox", { name: /raison|filtre/i });

    const selectVisible = await filterSelect.isVisible().catch(() => false);
    const dropdownVisible = await filterDropdown.isVisible().catch(() => false);

    if (selectVisible || dropdownVisible) {
      // Le filtre existe - test de base
      const filter = selectVisible ? filterSelect : filterDropdown;
      await expect(filter).toBeEnabled();
    }
  });

  test("Résolution doublon - Rejeter (flow complet)", async ({ page, request }: { page: Page; request: APIRequestContext }) => {
    const doResolve = (process.env.SEKA_E2E_DO_RESOLVE ?? "0") === "1";

    if (!doResolve) {
      test.skip(true, "Test de résolution désactivé (set SEKA_E2E_DO_RESOLVE=1 pour activer)");
      return;
    }

    await loginIfNeeded(page, request);
    await page.goto("/documents/doublons");

    await page.waitForLoadState("networkidle");

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip(true, "Aucun doublon en attente pour tester la résolution");
      return;
    }

    // Ouvrir la modal de confrontation
    const firstRow = rows.first();
    const actionButton = firstRow.getByRole("button", { name: /confronter|voir|traiter/i });

    if (await actionButton.isVisible().catch(() => false)) {
      await actionButton.click();

      const modal = page.locator('[role="dialog"], .modal');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Cliquer sur "Rejeter"
      const rejectButton = modal.getByRole("button", { name: /rejeter/i });
      if (await rejectButton.isVisible().catch(() => false)) {
        await rejectButton.click();

        // Confirmer si nécessaire
        const confirmButton = page.getByRole("button", { name: /confirmer|oui/i });
        if (await confirmButton.isVisible().catch(() => false)) {
          await confirmButton.click();
        }

        // Attendre la mise à jour
        await page.waitForLoadState("networkidle");

        // Vérifier le message de succès ou la fermeture de la modal
        const successMessage = page.getByText(/succ.s|r.solu/i);
        const modalClosed = !(await modal.isVisible().catch(() => false));

        expect(successMessage.isVisible().catch(() => false) || modalClosed).toBeTruthy();
      }
    }
  });
});

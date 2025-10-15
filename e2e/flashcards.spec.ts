import { test, expect } from "@playwright/test";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FlashcardsPage } from "./pages/FlashcardsPage";

test.describe("Zarządzanie fiszkami", () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
    await authPage.login();
  });

  test("użytkownik nawiguje do widoku fiszek z dashboardu", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.goto();

    await test.step("Kliknij kafelek Moje fiszki", async () => {
      await expect(dashboardPage.menuTileFlashcards).toBeVisible();
      await dashboardPage.menuTileFlashcards.click();
    });

    await test.step("Sprawdź czy jesteśmy na stronie fiszek", async () => {
      await expect(page).toHaveURL(/\/flashcards$/);
    });
  });

  test("użytkownik otwiera i wypełnia formularz dodawania fiszki", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const flashcardsPage = new FlashcardsPage(page);

    await test.step("Przejdź z dashboardu do fiszek", async () => {
      await dashboardPage.menuTileFlashcards.click();
      await expect(page).toHaveURL(/\/flashcards$/);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Otwórz formularz dodawania fiszki", async () => {
      await flashcardsPage.addButton.click();
      await expect(flashcardsPage.dialog).toBeVisible({ timeout: 10_000 });
    });

    await test.step("Wypełnij formularz", async () => {
      const timestamp = Date.now();
      const frontInput = flashcardsPage.dialog.getByLabel(/Przód fiszki/);
      const backTextarea = flashcardsPage.dialog.getByLabel(/Tył fiszki/);

      await frontInput.fill(`Test przód ${timestamp}`);
      await backTextarea.fill(`Test tył ${timestamp}`);

      // Sprawdź czy pola są wypełnione
      await expect(frontInput).toHaveValue(`Test przód ${timestamp}`);
      await expect(backTextarea).toHaveValue(`Test tył ${timestamp}`);
    });

    await test.step("Sprawdź czy przycisk Zapisz jest aktywny", async () => {
      const saveButton = flashcardsPage.dialog.getByRole("button", { name: /Zapisz/i });
      await expect(saveButton).toBeEnabled();
    });
  });

  test("strona fiszek wyświetla toolbar", async ({ page }) => {
    const flashcardsPage = new FlashcardsPage(page);

    await flashcardsPage.goto();
    await page.waitForLoadState("networkidle");

    await test.step("Sprawdź widoczność toolbara", async () => {
      await expect(flashcardsPage.toolbar).toBeVisible();
      await expect(flashcardsPage.addButton).toBeVisible();
    });
  });

  test("strona fiszek ładuje się poprawnie", async ({ page }) => {
    const flashcardsPage = new FlashcardsPage(page);

    await flashcardsPage.goto();
    await page.waitForLoadState("networkidle");

    await test.step("Sprawdź że strona się załadowała", async () => {
      await expect(flashcardsPage.viewRoot).toBeVisible();
      await expect(flashcardsPage.toolbar).toBeVisible();
    });

    await test.step("Poczekaj aż skeleton zniknie", async () => {
      await page.waitForTimeout(1000);
      const skeletonVisible = await flashcardsPage.gridSkeleton.isVisible().catch(() => false);
      expect(skeletonVisible).toBe(false);
    });
  });

  test("formularz dodawania fiszki ma wszystkie pola", async ({ page }) => {
    const flashcardsPage = new FlashcardsPage(page);

    await flashcardsPage.goto();
    await page.waitForLoadState("networkidle");

    await test.step("Otwórz formularz", async () => {
      await flashcardsPage.addButton.click();
      await expect(flashcardsPage.dialog).toBeVisible();
    });

    await test.step("Sprawdź pola formularza", async () => {
      const frontInput = flashcardsPage.dialog.getByLabel("Przód fiszki");
      const backTextarea = flashcardsPage.dialog.getByLabel("Tył fiszki");

      await expect(frontInput).toBeVisible();
      await expect(backTextarea).toBeVisible();
    });

    await test.step("Zamknij formularz", async () => {
      await page.keyboard.press("Escape");
      await expect(flashcardsPage.dialog).toBeHidden();
    });
  });
});


import { test, expect } from "@playwright/test";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { StudyPage } from "./pages/StudyPage";

const { E2E_USERNAME } = process.env;

test.describe("Sesja nauki", () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
    await authPage.login();
  });

  test("użytkownik rozpoczyna i kończy sesję nauki", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const studyPage = new StudyPage(page);

    await dashboardPage.menuTileStudy.click();
    await expect(page).toHaveURL(/\/study$/);

    // Poczekaj na załadowanie strony i sprawdź czy są fiszki
    await page.waitForLoadState("networkidle");

    // Sprawdź czy jest empty state (brak fiszek)
    const hasFlashcards = await studyPage.emptyState
      .isVisible()
      .then((visible) => !visible)
      .catch(() => true);

    if (!hasFlashcards) {
      test.skip(`Brak fiszek do nauki dla użytkownika ${E2E_USERNAME}`);
    }

    await expect(studyPage.loadingState)
      .toBeHidden({ timeout: 10_000 })
      .catch(() => false);
    await expect(studyPage.activeState).toBeVisible({ timeout: 10_000 });

    await studyPage.flipCard();
    await studyPage.rateCard("Dobre");

    await studyPage.flipCard();
    await studyPage.rateCard("Łatwe");

    await expect(studyPage.completedState).toBeVisible({ timeout: 10_000 });
  });
});

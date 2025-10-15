import { test, expect } from "@playwright/test";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GeneratePage } from "./pages/GeneratePage";

const LONG_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(50);

test.describe("Generowanie fiszek", () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
    await authPage.login();
  });

  test("generowanie i zapis propozycji", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const generatePage = new GeneratePage(page);

    await test.step("Przejdź z dashboardu na /generate", async () => {
      await dashboardPage.menuTileGenerate.click();
      await expect(page).toHaveURL(/\/generate$/);
    });

    await test.step("Wypełnij formularz i wyślij", async () => {
      await generatePage.fillSourceText(LONG_TEXT);
      await generatePage.submitGeneration();
      // Wskaźnik ładowania może pojawić się bardzo szybko, nie sprawdzamy go
    });

    await test.step("Poczekaj na propozycje i zaznacz wszystko", async () => {
      // Poczekaj na propozycje lub error (timeout 60s dla AI generation)
      await expect(generatePage.proposalSection).toBeVisible({ timeout: 60_000 });
      await generatePage.selectAllProposals();
      await expect(generatePage.proposalCards.first()).toBeVisible();
    });

    await test.step("Zapisz wybrane fiszki", async () => {
      await generatePage.saveSelected();
      await expect(page.getByText(/Fiszki zostały zapisane/)).toBeVisible();
    });
  });
});

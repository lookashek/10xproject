import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

test.describe("Strona główna", () => {
  test("renderuje hero i CTA", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.heroTitle).toBeVisible();
    await expect(home.registerLink).toBeVisible();

    await expect(page).toHaveScreenshot({ fullPage: true });
  });
});



import { test, expect } from "@playwright/test";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";

const { E2E_USERNAME, E2E_PASSWORD } = process.env;

test.describe("Autoryzacja", () => {
  test("użytkownik loguje się i wylogowuje", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);

    await authPage.gotoLogin();
    await authPage.login(E2E_USERNAME!, E2E_PASSWORD!);

    await expect(dashboardPage.welcomeHeading).toBeVisible();
    await dashboardPage.openUserMenu();
    await expect(dashboardPage.settingsItem).toBeVisible();

    await dashboardPage.logout();
    await expect(authPage.loginForm).toBeVisible();
  });
});

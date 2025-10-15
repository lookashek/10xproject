import type { Locator, Page } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly welcomeHeading: Locator;
  readonly statsSection: Locator;
  readonly menuTileGenerate: Locator;
  readonly menuTileFlashcards: Locator;
  readonly menuTileStudy: Locator;
  readonly menuTileGenerations: Locator;
  readonly toggleTheme: Locator;
  readonly userMenuTrigger: Locator;
  readonly logoutItem: Locator;
  readonly settingsItem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeHeading = page.getByRole("heading", { name: /Witaj/i });
    this.statsSection = page.getByTestId("stats-section");
    this.menuTileGenerate = page.getByTestId("menu-tile-generuj-fiszki");
    this.menuTileFlashcards = page.getByTestId("menu-tile-moje-fiszki");
    this.menuTileStudy = page.getByTestId("menu-tile-sesja-nauki");
    this.menuTileGenerations = page.getByTestId("menu-tile-historia-generacji");
    this.toggleTheme = page.getByTestId("toggle-theme");
    this.userMenuTrigger = page.getByTestId("user-menu-trigger");
    this.logoutItem = page.getByRole("menuitem", { name: /Wyloguj się/i });
    this.settingsItem = page.getByRole("menuitem", { name: /Ustawienia konta/i });
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async openUserMenu() {
    await this.userMenuTrigger.click({ force: true });
  }

  async logout() {
    await this.openUserMenu();
    await this.logoutItem.click({ force: true });
  }

  async openSettings() {
    await this.openUserMenu();
    await this.settingsItem.click();
  }
}

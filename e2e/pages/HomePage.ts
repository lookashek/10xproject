import type { Locator, Page } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly heroTitle: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroTitle = page.getByRole("heading", { name: /10x cards/i });
    this.registerLink = page.getByRole("link", { name: /Zarejestruj się za darmo/i });
  }

  async goto() {
    await this.page.goto("/");
  }
}

export default HomePage;



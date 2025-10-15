import type { Locator, Page } from "@playwright/test";

export class GenerationsPage {
  readonly page: Page;
  readonly list: Locator;
  readonly rows: Locator;
  readonly pagination: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.list = page.getByTestId("generation-list");
    this.rows = page.locator('[data-testid^="generation-row-"]');
    this.pagination = page.getByRole("navigation", { name: /Paginacja/i });
    this.emptyState = page.getByText(/Brak generacji/i);
  }

  async goto() {
    await this.page.goto("/generations");
  }

  async openGenerationByIndex(index = 0) {
    await this.rows.nth(index).click();
  }
}

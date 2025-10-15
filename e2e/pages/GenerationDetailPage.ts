import type { Locator, Page } from "@playwright/test";

export class GenerationDetailPage {
  readonly page: Page;
  readonly header: Locator;
  readonly statsGrid: Locator;
  readonly flashcardsSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId("generation-detail-header");
    this.statsGrid = page.getByTestId("generation-stats-grid");
    this.flashcardsSection = page.getByTestId("generation-flashcards");
  }

  async goto(id: number) {
    await this.page.goto(`/generations/${id}`);
  }
}

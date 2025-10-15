import type { Locator, Page } from "@playwright/test";

export class StudyPage {
  readonly page: Page;
  readonly emptyState: Locator;
  readonly loadingState: Locator;
  readonly activeState: Locator;
  readonly card: Locator;
  readonly flipButton: Locator;
  readonly controls: Locator;
  readonly completedState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emptyState = page.getByTestId("study-empty");
    this.activeState = page.getByTestId("study-active");
    this.card = page.getByTestId("study-card");
    this.flipButton = page.getByTestId("flip-card-btn");
    this.controls = page.getByTestId("study-controls");
    this.completedState = page.getByTestId("study-completed");
    this.loadingState = page.getByRole("status", { name: /Ładowanie/i });
  }

  async goto() {
    await this.page.goto("/study");
  }

  async flipCard() {
    await this.flipButton.click();
  }

  async rateCard(label: string) {
    await this.controls.getByRole("button", { name: new RegExp(label, "i") }).click();
  }
}

import type { Locator, Page } from "@playwright/test";

export class GeneratePage {
  readonly page: Page;
  readonly form: Locator;
  readonly textarea: Locator;
  readonly charCounter: Locator;
  readonly generateButton: Locator;
  readonly loadingIndicator: Locator;
  readonly proposalSection: Locator;
  readonly proposalList: Locator;
  readonly proposalCards: Locator;
  readonly proposalControls: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId("generate-form");
    this.textarea = this.form.getByRole("textbox");
    this.charCounter = page.getByTestId("character-counter");
    this.generateButton = this.form.getByRole("button", { name: /Generuj fiszki/i });
    this.loadingIndicator = page.getByTestId("generate-loading");
    this.proposalSection = page.getByTestId("proposal-section");
    this.proposalList = page.getByTestId("proposal-list");
    this.proposalCards = page.locator("[data-testid^='proposal-card-']");
    this.proposalControls = page.getByTestId("proposal-controls");
    this.saveButton = page.getByTestId("save-proposals-btn");
  }

  async goto() {
    await this.page.goto("/generate");
  }

  async fillSourceText(text: string) {
    await this.textarea.fill(text);
  }

  async submitGeneration() {
    await this.generateButton.click();
  }

  async acceptFirstProposal() {
    const firstCard = this.proposalCards.first();
    const checkbox = firstCard.getByRole("checkbox");
    await checkbox.check();
  }

  async deselectAllProposals() {
    await this.proposalControls.getByRole("button", { name: /Odznacz wszystkie/i }).click();
  }

  async selectAllProposals() {
    await this.proposalControls.getByRole("button", { name: /Zaznacz wszystkie/i }).click();
  }

  async saveSelected() {
    await this.saveButton.click();
  }
}

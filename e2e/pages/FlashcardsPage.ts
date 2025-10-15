import type { Locator, Page } from "@playwright/test";

export class FlashcardsPage {
  readonly page: Page;
  readonly viewRoot: Locator;
  readonly toolbar: Locator;
  readonly addButton: Locator;
  readonly sourceFilter: Locator;
  readonly grid: Locator;
  readonly gridSkeleton: Locator;
  readonly emptyState: Locator;
  readonly dialog: Locator;
  readonly deleteDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.viewRoot = page.getByTestId("flashcards-view");
    this.toolbar = page.getByTestId("flashcard-toolbar");
    this.addButton = page.getByTestId("add-flashcard-btn");
    this.sourceFilter = page.getByTestId("flashcard-source-filter");
    this.grid = page.getByTestId("flashcard-grid");
    this.gridSkeleton = page.getByTestId("flashcard-grid-skeleton");
    this.emptyState = page.getByTestId("flashcard-empty-state");
    this.dialog = page.getByTestId("flashcard-dialog");
    this.deleteDialog = page.getByTestId("flashcard-delete-dialog");
  }

  async goto() {
    await this.page.goto("/flashcards");
  }

  async openCreateDialog() {
    await this.addButton.click();
    await this.dialog.waitFor({ state: "visible" });
  }

  async fillFlashcardForm(front: string, back: string) {
    const frontInput = this.dialog.getByLabel("Przód fiszki");
    const backTextarea = this.dialog.getByLabel("Tył fiszki");
    await frontInput.fill(front);
    await backTextarea.fill(back);
  }

  async submitFlashcard() {
    await this.dialog.getByRole("button", { name: /Zapisz/i }).click();
    await this.dialog.waitFor({ state: "hidden" });
  }

  async openFirstCardActions(cardIndex = 0) {
    const card = this.page.locator(`[data-testid^='flashcard-']`).nth(cardIndex);
    await card.hover();
    return card;
  }

  async getCardId(cardIndex = 0) {
    const card = this.page.locator(`[data-testid^='flashcard-']`).nth(cardIndex);
    const testId = await card.getAttribute("data-testid");
    return testId?.replace("flashcard-", "") || "";
  }

  async openEditForCard(cardIndex = 0) {
    const card = await this.openFirstCardActions(cardIndex);
    const cardId = await this.getCardId(cardIndex);
    const editButton = this.page.getByTestId(`edit-flashcard-${cardId}`);
    await editButton.click({ force: true });
    await this.dialog.waitFor({ state: "visible" });
  }

  async openDeleteForCard(cardIndex = 0) {
    const card = await this.openFirstCardActions(cardIndex);
    const cardId = await this.getCardId(cardIndex);
    const deleteButton = this.page.getByTestId(`delete-flashcard-${cardId}`);
    await deleteButton.click({ force: true });
    await this.deleteDialog.waitFor({ state: "visible" });
  }

  async confirmDelete() {
    await this.deleteDialog.getByRole("button", { name: /Usuń/i }).click();
    await this.deleteDialog.waitFor({ state: "hidden" });
  }
}

import type { Locator, Page } from "@playwright/test";

export class SettingsPage {
  readonly page: Page;
  readonly view: Locator;
  readonly changePasswordForm: Locator;
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly changePasswordSubmit: Locator;
  readonly deleteSection: Locator;
  readonly deleteButton: Locator;
  readonly deleteDialog: Locator;
  readonly confirmationInput: Locator;
  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.view = page.getByTestId("settings-view");
    this.changePasswordForm = page.getByTestId("change-password-form");
    this.currentPasswordInput = this.changePasswordForm.getByLabel("Aktualne hasło");
    this.newPasswordInput = this.changePasswordForm.getByLabel("Nowe hasło");
    this.confirmPasswordInput = this.changePasswordForm.getByLabel("Powtórz nowe hasło");
    this.changePasswordSubmit = this.changePasswordForm.getByRole("button", { name: /Zmień hasło/i });
    this.deleteSection = page.getByTestId("delete-account-section");
    this.deleteButton = this.deleteSection.getByRole("button", { name: /Usuń konto/i });
    this.deleteDialog = page.getByTestId("delete-account-dialog");
    this.confirmationInput = this.deleteDialog.getByPlaceholder("Wpisz DELETE");
    this.confirmDeleteButton = this.deleteDialog.getByRole("button", { name: /Usuń konto na zawsze/i });
  }

  async goto() {
    await this.page.goto("/settings");
  }

  async changePassword(current: string, next: string) {
    await this.currentPasswordInput.fill(current);
    await this.newPasswordInput.fill(next);
    await this.confirmPasswordInput.fill(next);
    await this.changePasswordSubmit.click();
  }

  async openDeleteAccount() {
    await this.deleteButton.click();
    await this.deleteDialog.waitFor({ state: "visible" });
  }

  async confirmDeleteAccount() {
    await this.confirmationInput.fill("DELETE");
    await this.confirmDeleteButton.click();
  }
}

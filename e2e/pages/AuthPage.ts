import type { Locator, Page } from "@playwright/test";

export class AuthPage {
  readonly page: Page;
  readonly heroTitle: Locator;
  readonly registerLink: Locator;
  readonly loginForm: Locator;
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginSubmitButton: Locator;
  readonly loginErrorAlert: Locator;
  readonly registerEmailInput: Locator;
  readonly registerPasswordInput: Locator;
  readonly registerConfirmPasswordInput: Locator;
  readonly registerSubmitButton: Locator;
  readonly registerErrorAlert: Locator;
  readonly forgotPasswordLink: Locator;
  readonly resetPasswordHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroTitle = page.getByRole("heading", { name: /10x cards/i });
    this.registerLink = page.getByRole("link", { name: /Zarejestruj się za darmo/i });

    this.loginForm = page.getByTestId("login-form");
    this.loginEmailInput = this.loginForm.getByLabel("Email");
    this.loginPasswordInput = this.loginForm.getByTestId("password-input");
    this.loginSubmitButton = this.loginForm.getByTestId("login-submit");
    this.loginErrorAlert = this.loginForm.getByTestId("login-error");

    this.registerEmailInput = page.getByLabel("Email");
    this.registerPasswordInput = page.getByLabel("Hasło");
    this.registerConfirmPasswordInput = page.getByLabel("Powtórz hasło");
    this.registerSubmitButton = page.getByRole("button", { name: /Utwórz konto/i });
    this.registerErrorAlert = page.getByTestId("register-error");

    this.forgotPasswordLink = page.getByRole("link", { name: /Zapomniałeś hasła\?/i });
    this.resetPasswordHeading = page.getByRole("heading", { name: /Ustaw nowe hasło/i });
  }

  async gotoLogin() {
    await this.page.goto("/login");
  }

  async gotoRegister() {
    await this.page.goto("/register");
  }

  async gotoForgotPassword() {
    await this.page.goto("/forgot-password");
  }

  async gotoResetPassword(token: string) {
    await this.page.goto(`/reset-password?token=${token}`);
  }

  async login(email: string = process.env.E2E_USERNAME!, password: string = process.env.E2E_PASSWORD!) {
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);
    await this.loginSubmitButton.click();
  }

  async register(email: string, password: string) {
    await this.registerEmailInput.fill(email);
    await this.registerPasswordInput.fill(password);
    await this.registerConfirmPasswordInput.fill(password);
    await this.registerSubmitButton.click();
  }

  async expectLoginError(message: RegExp | string) {
    await this.loginErrorAlert.getByText(message).waitFor();
  }

  async expectRegisterError(message: RegExp | string) {
    await this.registerErrorAlert.getByText(message).waitFor();
  }
}

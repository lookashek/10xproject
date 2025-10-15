/**
 * Validation schemas for authentication endpoints
 *
 * Defines Zod schemas for validating auth-related requests:
 * - Login credentials
 * - Registration data
 * - Password change requests
 */

import { z } from "zod";

/**
 * Wspólne reguły walidacji hasła
 * - Minimum 8 znaków
 * - Minimum 1 wielka litera
 * - Minimum 1 cyfra
 */
const passwordValidation = z
  .string()
  .min(8, "Hasło musi mieć minimum 8 znaków")
  .regex(/[A-Z]/, "Hasło musi zawierać przynajmniej jedną wielką literę")
  .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę");

/**
 * Schema dla logowania
 */
export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * Schema dla rejestracji
 */
export const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: passwordValidation,
});

/**
 * Schema dla zmiany hasła
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Obecne hasło jest wymagane"),
  newPassword: passwordValidation,
});

/**
 * Schema dla żądania resetu hasła (forgot password)
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
});

/**
 * Schema dla resetu hasła (nowe hasło)
 */
export const resetPasswordSchema = z.object({
  password: passwordValidation,
});

/**
 * Type exports dla TypeScript
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

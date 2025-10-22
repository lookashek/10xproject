/**
 * ChangePasswordForm - Formularz zmiany hasła
 *
 * Komponent do zmiany hasła dla zalogowanego użytkownika.
 * Wymaga podania obecnego hasła dla bezpieczeństwa.
 */

import { useState, useCallback, useMemo, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, CircleAlert, Check, X } from "lucide-react";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Walidacja nowego hasła
  const passwordValidation = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
    };
  }, [newPassword]);

  const isNewPasswordValid =
    passwordValidation.minLength && passwordValidation.hasUppercase && passwordValidation.hasNumber;

  const passwordsMatch = newPassword === confirmNewPassword && confirmNewPassword.length > 0;

  // Walidacja formularza
  const canSubmit = currentPassword.length > 0 && isNewPasswordValid && passwordsMatch && !isLoading;

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!canSubmit) return;

      setError(null);
      setIsLoading(true);

      try {
        const response = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Błąd zmiany hasła");
        }

        toast.success("Hasło zostało pomyślnie zmienione!");

        // Reset formularza
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
        setError(message);
        toast.error("Nie udało się zmienić hasła", {
          description: message,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [canSubmit]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zmiana hasła</CardTitle>
        <CardDescription>Zaktualizuj swoje hasło. Wymagane jest podanie obecnego hasła.</CardDescription>
      </CardHeader>
      <CardContent>
        <form data-testid="change-password-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Obecne hasło</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={showCurrentPassword ? "Ukryj hasło" : "Pokaż hasło"}
                disabled={isLoading}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? "Ukryj hasło" : "Pokaż hasło"}
                disabled={isLoading}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            {/* Password Requirements */}
            {newPassword.length > 0 && (
              <div className="space-y-1 text-sm">
                <PasswordRequirement met={passwordValidation.minLength} text="Minimum 8 znaków" />
                <PasswordRequirement met={passwordValidation.hasUppercase} text="Przynajmniej jedna wielka litera" />
                <PasswordRequirement met={passwordValidation.hasNumber} text="Przynajmniej jedna cyfra" />
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Powtórz nowe hasło</Label>
            <div className="relative">
              <Input
                id="confirmNewPassword"
                name="confirmNewPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={isLoading}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {confirmNewPassword.length > 0 && !passwordsMatch && (
              <p className="text-sm text-destructive">Hasła nie są identyczne</p>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <CircleAlert className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" disabled={!canSubmit}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zmień hasło
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Helper component
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 ${met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
      {met ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      <span>{text}</span>
    </div>
  );
}

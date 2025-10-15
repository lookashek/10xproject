/**
 * ForgotPasswordForm - Formularz resetowania hasła
 *
 * Komponent React z formularzem do wysłania linku resetującego hasło.
 * Po wysłaniu użytkownik otrzymuje email z linkiem.
 */

import { useState, useCallback, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CircleAlert, Mail } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Walidacja email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(email);

  // Walidacja formularza
  const canSubmit = email.length > 0 && isValidEmail && !isLoading && !isSuccess;

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!canSubmit) return;

      setError(null);
      setIsLoading(true);

      try {
        // Wywołanie API forgot password
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Obsługa błędów API
          const errorMessage = data.error?.message || "Błąd wysyłania emaila";
          throw new Error(errorMessage);
        }

        // Sukces - wyświetl komunikat
        setIsSuccess(true);
        toast.success("Email wysłany!", {
          description: "Sprawdź swoją skrzynkę pocztową",
        });
      } catch (err: any) {
        const message = err.message || "Wystąpił nieoczekiwany błąd";
        setError(message);
        toast.error("Nie udało się wysłać emaila", {
          description: message,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [email, canSubmit]
  );

  // Sukces - pokaż komunikat zamiast formularza
  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Sprawdź email</h1>
          <p className="text-muted-foreground">Wysłaliśmy link do resetowania hasła na adres:</p>
          <p className="text-sm font-medium">{email}</p>
        </div>

        <Alert>
          <AlertDescription className="text-sm">
            <p className="mb-2">Link będzie ważny przez 1 godzinę.</p>
            <p>Nie otrzymałeś emaila? Sprawdź folder spam lub spróbuj ponownie.</p>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={() => setIsSuccess(false)}>
            Wyślij ponownie
          </Button>

          <div className="text-center">
            <a href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Powrót do logowania
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Zapomniałeś hasła?</h1>
        <p className="text-muted-foreground">Podaj swój adres email, a wyślemy Ci link do resetowania hasła</p>
      </div>

      <form data-testid="forgot-password-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="twoj@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            aria-invalid={email.length > 0 && !isValidEmail}
            aria-describedby={email.length > 0 && !isValidEmail ? "email-error" : undefined}
          />
          {email.length > 0 && !isValidEmail && (
            <p id="email-error" className="text-sm text-destructive">
              Nieprawidłowy format adresu email
            </p>
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
        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Wyślij link resetujący
        </Button>
      </form>

      {/* Back to Login Link */}
      <div className="text-center text-sm">
        <a href="/login" className="text-muted-foreground hover:text-primary transition-colors">
          Powrót do logowania
        </a>
      </div>
    </div>
  );
}

/**
 * LoginForm - Formularz logowania
 * 
 * Komponent React z formularzem logowania użytkownika.
 * Zawiera walidację client-side i obsługę błędów.
 */

import { useState, useCallback, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, CircleAlert } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Walidacja email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(email);

  // Walidacja formularza
  const canSubmit = email.length > 0 && password.length > 0 && isValidEmail && !isLoading;

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!canSubmit) return;

    setError(null);
    setIsLoading(true);

    try {
      // Wywołanie API logowania
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Obsługa błędów API
        const errorMessage = data.error?.message || 'Błąd logowania';
        throw new Error(errorMessage);
      }

      // Sukces - wyświetl toast i przekieruj
      toast.success('Zalogowano pomyślnie!');
      
      // Redirect do dashboardu lub zapisanego URL
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect') || data.redirectTo || '/dashboard';
      window.location.href = redirectTo;
      
    } catch (err: any) {
      const message = err.message || 'Wystąpił nieoczekiwany błąd';
      setError(message);
      toast.error('Nie udało się zalogować', {
        description: message
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, canSubmit]);

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Logowanie</h1>
        <p className="text-muted-foreground">
          Zaloguj się do swojego konta 10x cards
        </p>
      </div>

      <form
        data-testid="login-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
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
            aria-describedby={email.length > 0 && !isValidEmail ? 'email-error' : undefined}
          />
          {email.length > 0 && !isValidEmail && (
            <p id="email-error" className="text-sm text-destructive">
              Nieprawidłowy format adresu email
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
        <Label htmlFor="password">Hasło</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="pr-10"
              data-testid="password-input"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" data-testid="login-error">
            <CircleAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full"
          disabled={!canSubmit}
          data-testid="login-submit"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Zaloguj się
        </Button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <a
            href="/forgot-password"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            data-testid="forgot-password-link"
          >
            Zapomniałeś hasła?
          </a>
        </div>
      </form>

      {/* Register Link */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Nie masz konta? </span>
        <a
          href="/register"
          className="font-medium text-primary hover:underline"
          data-testid="register-link"
        >
          Zarejestruj się
        </a>
      </div>
    </div>
  );
}


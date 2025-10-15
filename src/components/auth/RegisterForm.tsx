/**
 * RegisterForm - Formularz rejestracji
 * 
 * Komponent React z formularzem rejestracji nowego użytkownika.
 * MVP: Auto-login po rejestracji (bez email verification).
 */

import { useState, useCallback, useMemo, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, CircleAlert, Check, X } from 'lucide-react';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Walidacja email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(email);

  // Walidacja hasła
  const passwordValidation = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
  }, [password]);

  const isPasswordValid = 
    passwordValidation.minLength && 
    passwordValidation.hasUppercase && 
    passwordValidation.hasNumber;

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Walidacja formularza
  const canSubmit = 
    email.length > 0 && 
    isValidEmail && 
    isPasswordValid && 
    passwordsMatch && 
    !isLoading;

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!canSubmit) return;

    setError(null);
    setIsLoading(true);

    try {
      // Wywołanie API rejestracji
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Obsługa błędów API
        const errorMessage = data.error?.message || 'Błąd rejestracji';
        throw new Error(errorMessage);
      }

      // Sukces - wyświetl toast i przekieruj
      toast.success('Konto utworzone pomyślnie!', {
        description: 'Zostałeś automatycznie zalogowany'
      });
      
      // Redirect do dashboardu (auto-login w MVP)
      window.location.href = '/dashboard';
      
    } catch (err: any) {
      const message = err.message || 'Wystąpił nieoczekiwany błąd';
      setError(message);
      toast.error('Nie udało się zarejestrować', {
        description: message
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, canSubmit]);

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Rejestracja</h1>
        <p className="text-muted-foreground">
          Utwórz nowe konto 10x cards
        </p>
      </div>

      <form
        data-testid="register-form"
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
          
          {/* Password Requirements */}
          {password.length > 0 && (
            <div className="space-y-1 text-sm">
              <PasswordRequirement 
                met={passwordValidation.minLength}
                text="Minimum 8 znaków"
              />
              <PasswordRequirement 
                met={passwordValidation.hasUppercase}
                text="Przynajmniej jedna wielka litera"
              />
              <PasswordRequirement 
                met={passwordValidation.hasNumber}
                text="Przynajmniej jedna cyfra"
              />
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Powtórz hasło</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              aria-label={showConfirmPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-sm text-destructive">
              Hasła nie są identyczne
            </p>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" data-testid="register-error">
            <CircleAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full" 
          disabled={!canSubmit}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Utwórz konto
        </Button>
      </form>

      {/* Login Link */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Masz już konto? </span>
        <a 
          href="/login" 
          className="font-medium text-primary hover:underline"
        >
          Zaloguj się
        </a>
      </div>
    </div>
  );
}

// Helper component
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 ${met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
      {met ? (
        <Check className="h-4 w-4" />
      ) : (
        <X className="h-4 w-4" />
      )}
      <span>{text}</span>
    </div>
  );
}


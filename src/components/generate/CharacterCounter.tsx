/**
 * CharacterCounter - Komponent licznika znaków
 * 
 * Wyświetla licznik znaków w czasie rzeczywistym z wizualną informacją
 * o poprawności długości tekstu.
 */

import { cn } from '@/lib/utils';
import type { CharacterCounterProps } from '@/lib/viewModels/generateView.types';

export function CharacterCounter({ 
  current, 
  min, 
  max, 
  isValid 
}: CharacterCounterProps) {
  const getStatusText = () => {
    if (current < min) {
      return `Minimum ${min.toLocaleString('pl-PL')} znaków`;
    }
    if (current > max) {
      return `Maksimum ${max.toLocaleString('pl-PL')} znaków`;
    }
    return 'Długość poprawna';
  };

  return (
    <div
      className={cn(
        "flex justify-between text-sm mt-2",
        isValid ? "text-muted-foreground" : "text-destructive"
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="character-counter"
    >
      <span>{getStatusText()}</span>
      <span className="font-mono">
        {current.toLocaleString('pl-PL')} / {max.toLocaleString('pl-PL')}
      </span>
    </div>
  );
}


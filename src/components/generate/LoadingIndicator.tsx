/**
 * LoadingIndicator - Wskaźnik ładowania
 * 
 * Komponent wyświetlany podczas generowania fiszek przez AI.
 * Pokazuje spinner i tekst informujący o trwającej operacji.
 */

import { Loader2 } from 'lucide-react';
import type { LoadingIndicatorProps } from '@/lib/viewModels/generateView.types';

export function LoadingIndicator({ 
  text = 'Generowanie fiszek...', 
  subtext = 'To może potrwać kilka sekund' 
}: LoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="text-center space-y-2">
        <p className="text-lg font-medium">{text}</p>
        <p className="text-sm text-muted-foreground">
          {subtext}
        </p>
      </div>
    </div>
  );
}


/**
 * Komponent pustego stanu dla listy generacji
 * 
 * Wyświetlany gdy użytkownik nie ma jeszcze żadnych generacji.
 * Zawiera ilustrację, tekst zachęcający i CTA do rozpoczęcia generowania.
 */

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function GenerationsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Sparkles className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        Brak historii generacji
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Nie masz jeszcze żadnych generacji. Zacznij od wygenerowania fiszek z tekstu!
      </p>
      <Button asChild>
        <a href="/generate">
          <Sparkles className="mr-2 h-4 w-4" />
          Generuj fiszki
        </a>
      </Button>
    </div>
  );
}


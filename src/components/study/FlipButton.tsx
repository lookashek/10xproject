/**
 * FlipButton - Przycisk do pokazania odpowiedzi
 *
 * Wyświetlany gdy pokazany jest tylko przód fiszki.
 * Zachęca użytkownika do sprawdzenia odpowiedzi.
 */

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlipButtonProps } from "@/types";

export function FlipButton({ onFlip }: FlipButtonProps) {
  return (
    <div className="flex flex-col items-center gap-3 mt-8 animate-slide-up">
      <Button
        size="lg"
        onClick={onFlip}
        className="gap-2 min-w-[200px] text-lg animate-pulse-subtle"
        data-testid="flip-card-btn"
      >
        <Eye className="h-5 w-5" />
        Pokaż odpowiedź
      </Button>
      <p className="text-sm text-muted-foreground">
        lub naciśnij <kbd className="px-2 py-1 bg-muted rounded font-mono text-xs">Spacja</kbd>
      </p>
    </div>
  );
}

/**
 * useKeyboardShortcuts - Hook obsługujący keyboard shortcuts dla sesji nauki
 *
 * Obsługiwane skróty:
 * - Spacja: Flip karty (pokazanie odpowiedzi)
 * - 1: Ocena "Again" (nie pamiętam)
 * - 2: Ocena "Hard" (trudne)
 * - 3: Ocena "Good" (dobre)
 * - 4: Ocena "Easy" (łatwe)
 * - Escape: Wyjście z sesji
 */

import { useEffect } from "react";
import type { SM2Quality } from "@/types";

export function useKeyboardShortcuts(
  isActive: boolean,
  isFlipped: boolean,
  onFlip: () => void,
  onRate: (quality: SM2Quality) => void,
  onExit: () => void
) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignoruj jeśli user pisze w input/textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case " ":
          event.preventDefault();
          if (!isFlipped) {
            onFlip();
          }
          break;

        case "1":
          event.preventDefault();
          if (isFlipped) {
            onRate(0); // Again
          }
          break;

        case "2":
          event.preventDefault();
          if (isFlipped) {
            onRate(1); // Hard
          }
          break;

        case "3":
          event.preventDefault();
          if (isFlipped) {
            onRate(2); // Good
          }
          break;

        case "4":
          event.preventDefault();
          if (isFlipped) {
            onRate(3); // Easy
          }
          break;

        case "Escape":
          event.preventDefault();
          onExit();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [isActive, isFlipped, onFlip, onRate, onExit]);
}

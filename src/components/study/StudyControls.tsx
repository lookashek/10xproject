/**
 * StudyControls - Przyciski oceny fiszki
 *
 * 4 poziomy oceny:
 * - Again (0) - nie pamiętam
 * - Hard (1) - trudne
 * - Good (2) - dobre
 * - Easy (3) - łatwe
 */

import { X, AlertCircle, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudyControlsProps, SM2Quality } from "@/types";

const ratingButtons = [
  {
    quality: 0 as SM2Quality,
    label: "Powtórz",
    description: "Nie pamiętam",
    color: "destructive",
    icon: X,
    keyboardShortcut: "1",
  },
  {
    quality: 1 as SM2Quality,
    label: "Trudne",
    description: "Z trudnością",
    color: "outline",
    icon: AlertCircle,
    keyboardShortcut: "2",
  },
  {
    quality: 2 as SM2Quality,
    label: "Dobre",
    description: "Pamiętam",
    color: "default",
    icon: Check,
    keyboardShortcut: "3",
  },
  {
    quality: 3 as SM2Quality,
    label: "Łatwe",
    description: "Bardzo dobrze",
    color: "default",
    icon: Star,
    keyboardShortcut: "4",
  },
] as const;

export function StudyControls({ isFlipped, onRate, isProcessing }: StudyControlsProps) {
  const handleRate = (quality: SM2Quality) => {
    if (!isFlipped || isProcessing) return;
    onRate(quality);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 animate-slide-up" data-testid="study-controls">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ratingButtons.map(({ quality, label, description, color, icon: Icon, keyboardShortcut }) => (
          <Button
            key={quality}
            variant={color as "destructive" | "outline" | "default"}
            size="lg"
            onClick={() => handleRate(quality)}
            disabled={!isFlipped || isProcessing}
            aria-label={`Ocena: ${label} - ${description}`}
            aria-disabled={!isFlipped || isProcessing}
            className={`flex flex-col gap-2 h-auto py-4 transition-all focus-visible:ring-2 focus-visible:ring-offset-2 ${
              quality === 2
                ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white focus-visible:ring-green-600"
                : ""
            } ${
              quality === 3
                ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white focus-visible:ring-blue-600"
                : ""
            } ${
              quality === 1
                ? "border-orange-500 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-400 dark:hover:bg-orange-950/20 focus-visible:ring-orange-500"
                : ""
            }`}
          >
            <Icon className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">{label}</div>
              <div className="text-xs opacity-80">{description}</div>
            </div>
            <kbd className="text-xs opacity-60 font-mono">{keyboardShortcut}</kbd>
          </Button>
        ))}
      </div>

      {/* Keyboard hints */}
      {isFlipped && !isProcessing && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Użyj klawiszy <kbd className="px-2 py-1 bg-muted rounded font-mono text-xs">1</kbd>-
          <kbd className="px-2 py-1 bg-muted rounded font-mono text-xs">4</kbd> do szybkiej oceny
        </p>
      )}
    </div>
  );
}

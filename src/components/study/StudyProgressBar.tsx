/**
 * StudyProgressBar - Wizualny pasek postępu sesji nauki
 *
 * Wyświetla:
 * - Progress bar z procentowym uzupełnieniem
 * - Tekst "Fiszka X z Y"
 */

import { Progress } from "@/components/ui/progress";
import type { StudyProgressBarProps } from "@/types";

export function StudyProgressBar({ current, total }: StudyProgressBarProps) {
  // Zabezpieczenie przed dzieleniem przez zero
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-muted-foreground">
          Fiszka {current} z {total}
        </span>
        <span className="font-medium text-muted-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

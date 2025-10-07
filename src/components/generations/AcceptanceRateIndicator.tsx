/**
 * Komponent wskaźnika akceptacji fiszek
 * 
 * Wyświetla progress bar z procentem akceptacji oraz tooltip ze szczegółami.
 * Kolor progress bar zależy od wartości:
 * - Czerwony: < 50%
 * - Żółty: 50-74%
 * - Zielony: >= 75%
 */

import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { calculateAcceptanceRate } from '@/lib/viewModels/generationViewModels';
import type { AcceptanceRateIndicatorProps } from '@/types';

export function AcceptanceRateIndicator({
  generatedCount,
  acceptedUnedited,
  acceptedEdited,
}: AcceptanceRateIndicatorProps) {
  const rate = calculateAcceptanceRate({
    generated_count: generatedCount,
    accepted_unedited_count: acceptedUnedited,
    accepted_edited_count: acceptedEdited,
  } as any);

  // Kolory progress bar w zależności od wariantu
  const progressColorClass = {
    low: 'bg-red-500',
    medium: 'bg-yellow-500',
    high: 'bg-green-500',
  }[rate.variant];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Progress 
                value={rate.percentage} 
                className="h-2"
                indicatorClassName={progressColorClass}
              />
            </div>
            <span className="text-sm font-medium min-w-[3rem] text-right">
              {rate.percentage}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">
              {rate.totalAccepted} z {generatedCount} fiszek zaakceptowano ({rate.percentage}%)
            </p>
            <p className="text-sm text-muted-foreground">
              Bez edycji: {rate.acceptedUnedited}
            </p>
            <p className="text-sm text-muted-foreground">
              Z edycją: {rate.acceptedEdited}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


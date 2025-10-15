/**
 * GenerationStatsGrid - Grid z kartami statystyk generacji
 * 
 * Wyświetla kluczowe metryki generacji: liczba wygenerowanych, zaakceptowanych,
 * wskaźnik akceptacji, długość tekstu, czas generowania.
 */

import { Sparkles, Check, Edit3, Percent, FileText, Clock } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { calculateAcceptanceRate, formatTextLength, formatGenerationDuration } from '@/lib/viewModels/generationViewModels';
import type { GenerationStatsGridProps } from '@/types';

export function GenerationStatsGrid({ generation }: GenerationStatsGridProps) {
  const acceptanceRate = calculateAcceptanceRate(generation);

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
      data-testid="generation-stats-grid"
    >
      <StatsCard
        icon={<Sparkles className="w-full h-full" />}
        value={generation.generated_count}
        label="Wygenerowanych fiszek"
        variant="highlight"
      />
      
      <StatsCard
        icon={<Check className="w-full h-full" />}
        value={acceptanceRate.acceptedUnedited}
        label="Zaakceptowano bez edycji"
      />
      
      <StatsCard
        icon={<Edit3 className="w-full h-full" />}
        value={acceptanceRate.acceptedEdited}
        label="Zaakceptowano z edycją"
      />
      
      <StatsCard
        icon={<Percent className="w-full h-full" />}
        value={`${acceptanceRate.percentage}%`}
        label="Wskaźnik akceptacji"
        variant={acceptanceRate.percentage >= 75 ? 'highlight' : 'default'}
      />
      
      <StatsCard
        icon={<FileText className="w-full h-full" />}
        value={formatTextLength(generation.source_text_length)}
        label="Długość tekstu źródłowego"
      />
      
      <StatsCard
        icon={<Clock className="w-full h-full" />}
        value={formatGenerationDuration(generation.generation_duration)}
        label="Czas generowania"
      />
    </div>
  );
}


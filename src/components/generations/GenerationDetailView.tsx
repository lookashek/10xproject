/**
 * GenerationDetailView - Główny widok szczegółów generacji
 * 
 * Zarządza stanem szczegółów pojedynczej generacji i wyświetla
 * wszystkie informacje wraz z powiązanymi fiszkami.
 */

import { useGenerationDetail } from '@/lib/hooks';
import { GenerationDetailHeader } from './GenerationDetailHeader';
import { GenerationStatsGrid } from './GenerationStatsGrid';
import { SourceTextSection } from './SourceTextSection';
import { AssociatedFlashcardsSection } from './AssociatedFlashcardsSection';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import type { GenerationDetailViewProps } from '@/types';

function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-12 w-12 rounded-full mb-4" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function GenerationDetailView({ generationId }: GenerationDetailViewProps) {
  const { generation, isLoading, error, refetch } = useGenerationDetail(generationId);

  const handleBackClick = () => {
    window.location.href = '/generations';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={handleBackClick}
        className="mb-6 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Wróć do listy generacji
      </Button>

      {/* Error State */}
      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <p>{error.message}</p>
            {error.code === 'NOT_FOUND' ? (
              <Button 
                onClick={handleBackClick}
                variant="outline"
                size="sm"
                className="self-start"
              >
                Wróć do listy
              </Button>
            ) : (
              <Button 
                onClick={refetch}
                variant="outline"
                size="sm"
                className="self-start"
              >
                Spróbuj ponownie
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && <DetailSkeleton />}

      {/* Content State */}
      {generation && !isLoading && (
        <div data-testid="generation-detail">
          <GenerationDetailHeader generation={generation} />
          
          <div data-testid="generation-detail-stats">
            <GenerationStatsGrid generation={generation} />
          </div>
          
          <SourceTextSection
            sourceTextHash={generation.source_text_hash}
            sourceTextLength={generation.source_text_length}
          />
          
          <AssociatedFlashcardsSection flashcards={generation.flashcards} />
        </div>
      )}
    </div>
  );
}


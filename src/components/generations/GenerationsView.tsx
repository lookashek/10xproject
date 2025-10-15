/**
 * GenerationsView - Główny widok listy generacji
 * 
 * Zarządza stanem listy generacji, paginacją i obsługą błędów.
 * Wyświetla conditional rendering w zależności od stanu (loading/empty/error/list).
 */

import { useGenerationsList } from '@/lib/hooks';
import { GenerationList } from './GenerationList';
import { GenerationsListSkeleton } from './GenerationsListSkeleton';
import { GenerationsEmptyState } from './GenerationsEmptyState';
import Pagination from '@/components/flashcards/Pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import type { GenerationsViewProps } from '@/types';

export function GenerationsView({ initialPage = 1 }: GenerationsViewProps) {
  const { generations, pagination, isLoading, error, refetch } = useGenerationsList(initialPage);

  const handlePageChange = (newPage: number) => {
    // Update URL query params
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    window.history.pushState({}, '', url);
    
    // Refetch data
    refetch(newPage);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRowClick = (id: number) => {
    window.location.href = `/generations/${id}`;
  };

  // Error state
  if (error && !isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Historia generacji</h1>
          <p className="text-muted-foreground">
            Przeglądaj wszystkie wykonane generacje fiszek AI wraz ze statystykami.
          </p>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <p>{error.message}</p>
            <Button 
              onClick={() => refetch(pagination?.page || initialPage)} 
              variant="outline"
              size="sm"
              className="self-start"
            >
              Spróbuj ponownie
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4" data-testid="generations-view">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Historia generacji</h1>
        <p className="text-muted-foreground">
          Przeglądaj wszystkie wykonane generacje fiszek AI wraz ze statystykami.
        </p>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <GenerationsListSkeleton />
      ) : !generations.length ? (
        <GenerationsEmptyState />
      ) : (
        <>
          <GenerationList 
            generations={generations} 
            onRowClick={handleRowClick}
          />
          
          {pagination && pagination.total_pages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.total_pages}
              totalItems={pagination.total}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}


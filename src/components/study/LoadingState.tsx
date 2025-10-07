/**
 * LoadingState - Skeleton UI podczas ładowania fiszek
 * 
 * Wyświetlany podczas:
 * - Pobierania fiszek z API
 * - Inicjalizacji algorytmu SM-2
 */

import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingState() {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-2 w-full" />
        </div>

        {/* Card skeleton */}
        <Card className="min-h-[400px] flex items-center justify-center">
          <CardContent className="p-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              Przygotowuję sesję nauki...
            </p>
          </CardContent>
        </Card>

        {/* Controls skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    </div>
  );
}


/**
 * EmptyState - Displayed when user has no flashcards
 */

import { Plus, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddClick: () => void;
}

export default function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-6 text-gray-400 dark:text-gray-600">
        <BookOpen className="size-24" strokeWidth={1.5} />
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Brak fiszek
      </h2>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
        Nie masz jeszcze żadnych fiszek. Dodaj swoją pierwszą fiszkę ręcznie lub wygeneruj zestaw przy użyciu AI.
      </p>
      
      <div className="flex gap-3">
        <Button onClick={onAddClick} variant="default">
          <Plus className="size-4" />
          Dodaj fiszkę
        </Button>
        <Button asChild variant="outline">
          <a href="/generate">
            <Sparkles className="size-4" />
            Generuj z AI
          </a>
        </Button>
      </div>
    </div>
  );
}


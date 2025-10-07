/**
 * FlashcardCard - Interactive card with flip 3D effect
 */

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FlashcardDTO, FlashcardSource } from '@/types';

interface FlashcardCardProps {
  flashcard: FlashcardDTO;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

function getSourceLabel(source: FlashcardSource): string {
  switch (source) {
    case 'ai-full':
      return 'AI';
    case 'ai-edited':
      return 'AI (edytowane)';
    case 'manual':
      return 'Ręczne';
  }
}

function getSourceBadgeVariant(source: FlashcardSource): 'default' | 'secondary' | 'outline' {
  switch (source) {
    case 'ai-full':
      return 'default';
    case 'ai-edited':
      return 'secondary';
    case 'manual':
      return 'outline';
  }
}

export default function FlashcardCard({
  flashcard,
  onEditClick,
  onDeleteClick,
}: FlashcardCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlipClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div className="perspective-1000 h-[240px]">
      <div 
        className={cn(
          "relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer",
          isFlipped && "rotate-y-180"
        )}
        onClick={handleFlipClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Fiszka: ${flashcard.front}`}
        aria-pressed={isFlipped}
      >
        {/* Front side */}
        <div className="absolute inset-0 backface-hidden">
          <div className="h-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <Badge variant={getSourceBadgeVariant(flashcard.source)}>
                {getSourceLabel(flashcard.source)}
              </Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400">Przód</span>
            </div>
            <p className="flex-1 text-base text-gray-900 dark:text-gray-100 break-words overflow-y-auto">
              {flashcard.front}
            </p>
          </div>
        </div>
        
        {/* Back side */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="h-full p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-md border border-blue-200 dark:border-blue-800 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs text-blue-600 dark:text-blue-400">Tył</span>
            </div>
            <p className="flex-1 text-base text-gray-900 dark:text-gray-100 break-words overflow-y-auto">
              {flashcard.back}
            </p>
          </div>
        </div>
        
        {/* Hover overlay with actions */}
        <div 
          className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="secondary"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            aria-label="Edytuj fiszkę"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick();
            }}
            aria-label="Usuń fiszkę"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}


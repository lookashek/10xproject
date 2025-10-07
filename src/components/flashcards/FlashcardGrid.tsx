/**
 * FlashcardGrid - Responsive grid displaying flashcard cards
 */

import type { FlashcardDTO } from '@/types';

interface FlashcardGridProps {
  flashcards: FlashcardDTO[];
  onEditClick: (flashcard: FlashcardDTO) => void;
  onDeleteClick: (flashcard: FlashcardDTO) => void;
}

export default function FlashcardGrid({
  flashcards,
  onEditClick,
  onDeleteClick,
}: FlashcardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* FlashcardCard components will be rendered here */}
    </div>
  );
}


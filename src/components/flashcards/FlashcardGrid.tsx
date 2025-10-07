/**
 * FlashcardGrid - Responsive grid displaying flashcard cards
 */

import FlashcardCard from './FlashcardCard';
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
      {flashcards.map((flashcard) => (
        <FlashcardCard
          key={flashcard.id}
          flashcard={flashcard}
          onEditClick={() => onEditClick(flashcard)}
          onDeleteClick={() => onDeleteClick(flashcard)}
        />
      ))}
    </div>
  );
}


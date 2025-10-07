/**
 * ActiveSession - Widok aktywnej sesji nauki
 * 
 * Łączy:
 * - StudyCard (centralna karta)
 * - FlipButton (gdy !isFlipped)
 * - StudyControls (gdy isFlipped)
 */

import { StudyCard } from './StudyCard';
import { FlipButton } from './FlipButton';
import { StudyControls } from './StudyControls';
import type { FlashcardWithProgress, SM2Quality } from '@/types';

interface ActiveSessionProps {
  currentCard: FlashcardWithProgress;
  isFlipped: boolean;
  isProcessing: boolean;
  onFlip: () => void;
  onRate: (quality: SM2Quality) => void;
}

export function ActiveSession({
  currentCard,
  isFlipped,
  isProcessing,
  onFlip,
  onRate,
}: ActiveSessionProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <StudyCard
        flashcard={currentCard.flashcard}
        isFlipped={isFlipped}
        onFlip={onFlip}
      />

      {!isFlipped && (
        <FlipButton onFlip={onFlip} />
      )}

      {isFlipped && (
        <StudyControls
          isFlipped={isFlipped}
          onRate={onRate}
          isProcessing={isProcessing}
        />
      )}

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isProcessing && 'Przechodzę do następnej fiszki...'}
      </div>
    </div>
  );
}


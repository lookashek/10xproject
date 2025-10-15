/**
 * StudyCard - Centralna karta wyświetlająca fiszkę
 * 
 * Obsługuje:
 * - Wyświetlanie przodu lub tyłu fiszki
 * - Flip animation
 * - Responsive font sizing
 * - Długie teksty z scrollem
 */

import { Card, CardContent } from '@/components/ui/card';
import type { StudyCardProps } from '@/types';

export function StudyCard({ flashcard, isFlipped, onFlip }: StudyCardProps) {
  const content = isFlipped ? flashcard.back : flashcard.front;
  const label = isFlipped ? 'Odpowiedź' : 'Pytanie';

  // Responsive font size based on content length
  const getFontSizeClass = (text: string) => {
    if (text.length < 50) return 'text-3xl md:text-4xl';
    if (text.length < 100) return 'text-2xl md:text-3xl';
    if (text.length < 200) return 'text-xl md:text-2xl';
    if (text.length < 500) return 'text-base md:text-lg';
    return 'text-sm md:text-base'; // dla bardzo długich tekstów
  };

  // Check if content is very long (needs scroll)
  const isLongContent = content.length > 500;

  return (
    <article
      className="w-full max-w-3xl mx-auto animate-fade-in"
      aria-label="Fiszka do nauki"
      data-testid="study-card"
    >
      <Card 
        className="min-h-[300px] md:min-h-[400px] max-h-[600px] flex items-center justify-center cursor-pointer hover:shadow-lg transition-all duration-300"
        onClick={onFlip}
      >
        <CardContent className={`p-8 md:p-12 w-full ${isLongContent ? 'overflow-y-auto max-h-[500px]' : ''}`}>
          <div className="text-center space-y-4">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </div>
            <div 
              className={`font-medium leading-relaxed ${getFontSizeClass(content)}`}
              style={{ 
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto'
              }}
            >
              {content}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screen reader announcement */}
      {isFlipped && (
        <div className="sr-only" aria-live="polite">
          Odpowiedź: {flashcard.back}
        </div>
      )}
    </article>
  );
}


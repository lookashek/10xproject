/**
 * FlashcardToolbar - Toolbar with add button and source filter
 */

import type { FlashcardSource } from '@/types';

interface FlashcardToolbarProps {
  onAddClick: () => void;
  sourceFilter: FlashcardSource | 'all';
  onSourceFilterChange: (source: FlashcardSource | 'all') => void;
}

export default function FlashcardToolbar({
  onAddClick,
  sourceFilter,
  onSourceFilterChange,
}: FlashcardToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-6 gap-4">
      <p>Toolbar placeholder</p>
    </div>
  );
}


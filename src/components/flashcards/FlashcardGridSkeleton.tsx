/**
 * FlashcardGridSkeleton - Grid of skeletons displayed during loading
 */

import FlashcardCardSkeleton from "./FlashcardCardSkeleton";

export default function FlashcardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {Array.from({ length: 9 }).map((_, index) => (
        <FlashcardCardSkeleton key={index} />
      ))}
    </div>
  );
}

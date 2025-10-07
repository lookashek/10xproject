/**
 * FlashcardCardSkeleton - Placeholder during loading
 */

export default function FlashcardCardSkeleton() {
  return (
    <div className="h-[240px] p-6 bg-card rounded-lg shadow-md border border-border animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-5 w-20 bg-muted rounded" />
        <div className="h-4 w-12 bg-muted rounded" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>
    </div>
  );
}


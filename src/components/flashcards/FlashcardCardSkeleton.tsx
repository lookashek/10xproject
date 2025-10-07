/**
 * FlashcardCardSkeleton - Placeholder during loading
 */

export default function FlashcardCardSkeleton() {
  return (
    <div className="h-[240px] p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-5 w-20 bg-gray-300 dark:bg-gray-600 rounded" />
        <div className="h-4 w-12 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full" />
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6" />
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6" />
      </div>
    </div>
  );
}


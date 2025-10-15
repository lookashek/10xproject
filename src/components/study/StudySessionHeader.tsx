/**
 * StudySessionHeader - Kompaktowy header widoczny przez całą sesję
 *
 * Zawiera:
 * - Progress bar
 * - Statystyki (pozostałe, przejrzane)
 * - Przycisk "Zakończ sesję"
 */

import { X, BookOpen, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudyProgressBar } from "./StudyProgressBar";
import type { StudySessionHeaderProps } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function StudySessionHeader({
  currentIndex,
  totalCards,
  reviewedCount,
  remainingCount,
  onExit,
}: StudySessionHeaderProps) {
  const showConfirmation = reviewedCount > 0;

  const handleExit = () => {
    onExit();
  };

  const exitButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={showConfirmation ? undefined : handleExit}
      className="gap-2"
      data-testid="study-exit-btn"
    >
      <X className="h-4 w-4" />
      Zakończ sesję
    </Button>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{remainingCount}</span>
              <span className="text-muted-foreground">pozostało</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">{reviewedCount}</span>
              <span className="text-muted-foreground">przejrzanych</span>
            </div>
          </div>

          {showConfirmation ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>{exitButton}</AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Czy na pewno chcesz zakończyć sesję?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Twój postęp został zapisany. Możesz wrócić do nauki w każdej chwili.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={handleExit}>Zakończ</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            exitButton
          )}
        </div>

        <StudyProgressBar current={currentIndex + 1} total={totalCards} />
      </div>
    </header>
  );
}

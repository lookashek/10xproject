/**
 * StudySessionView - Główny kontener widoku sesji nauki
 *
 * Integruje:
 * - useStudySession hook (zarządzanie stanem)
 * - useKeyboardShortcuts hook (keyboard navigation)
 * - Wszystkie podkomponenty (Header, ActiveSession, EmptyState, etc.)
 * - Error handling z toast notifications
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useStudySession } from "@/lib/hooks/useStudySession";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { StudySessionHeader } from "./StudySessionHeader";
import { ActiveSession } from "./ActiveSession";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { CompletedState } from "./CompletedState";
import { StudyErrorBoundary } from "./ErrorBoundary";

function StudySessionViewInner() {
  const {
    sessionState,
    currentIndex,
    totalCards,
    reviewedCount,
    remainingCount,
    isFlipped,
    flipCard,
    rateCard,
    exitSession,
    restartSession,
    error,
  } = useStudySession();

  const [isProcessing, setIsProcessing] = useState(false);

  // Keyboard shortcuts - aktywne tylko w active state
  useKeyboardShortcuts(sessionState.type === "active", isFlipped, flipCard, rateCard, exitSession);

  // Error handling z toast
  useEffect(() => {
    if (error) {
      toast.error(error.message, {
        description: "Spróbuj odświeżyć stronę lub wrócić do panelu.",
        action: {
          label: "Powrót do panelu",
          onClick: () => {
            window.location.href = "/dashboard";
          },
        },
      });
    }
  }, [error]);

  // Wrapper dla rateCard z processing state (smooth transitions)
  const handleRate = async (quality: Parameters<typeof rateCard>[0]) => {
    setIsProcessing(true);

    // Małe opóźnienie dla smooth UX
    setTimeout(() => {
      rateCard(quality);
      setIsProcessing(false);
    }, 300);
  };

  // Conditional rendering based on session state
  if (sessionState.type === "initializing") {
    return <LoadingState />;
  }

  if (sessionState.type === "empty") {
    return <EmptyState data-testid="study-empty" />;
  }

  if (sessionState.type === "completed") {
    return <CompletedState stats={sessionState.stats} onRestart={restartSession} onExit={exitSession} />;
  }

  // Active session
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed header */}
      <StudySessionHeader
        currentIndex={currentIndex}
        totalCards={totalCards}
        reviewedCount={reviewedCount}
        remainingCount={remainingCount}
        onExit={exitSession}
      />

      {/* Main content - with padding-top for fixed header */}
      <main className="pt-32 pb-12 px-4" role="main" aria-label="Sesja nauki">
        <ActiveSession
          currentCard={sessionState.currentCard}
          isFlipped={isFlipped}
          isProcessing={isProcessing}
          onFlip={flipCard}
          onRate={handleRate}
        />
      </main>

      {/* Global screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Fiszka {currentIndex + 1} z {totalCards}
      </div>
    </div>
  );
}

/**
 * Wrapper z ErrorBoundary
 */
export function StudySessionView() {
  return (
    <StudyErrorBoundary>
      <StudySessionViewInner />
    </StudyErrorBoundary>
  );
}

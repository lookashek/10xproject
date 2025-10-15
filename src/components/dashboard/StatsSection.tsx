import { StatsGrid } from "./StatsGrid";
import { StatsSkeleton } from "./StatsSkeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { DashboardStats } from "@/types";

interface StatsSectionProps {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
}

export function StatsSection({ stats, isLoading, error, onRetry }: StatsSectionProps) {
  // Loading state
  if (isLoading) {
    return (
      <section className="space-y-4" aria-busy="true" aria-label="Ładowanie statystyk" data-testid="stats-section">
        <StatsSkeleton />
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="space-y-4" role="alert" aria-live="assertive" data-testid="stats-section">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>Nie udało się załadować statystyk</span>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                Spróbuj ponownie
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  // Empty state
  if (!stats) {
    return (
      <section className="space-y-4" role="status" data-testid="stats-section">
        <div className="text-center py-8 text-muted-foreground">Brak danych do wyświetlenia</div>
      </section>
    );
  }

  // Success state
  return (
    <section className="space-y-4" aria-label="Statystyki użytkownika" data-testid="stats-section">
      <StatsGrid stats={stats} />
    </section>
  );
}

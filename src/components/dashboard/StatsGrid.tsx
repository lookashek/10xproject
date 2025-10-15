import { StatsCard } from "./StatsCard";
import { BookOpen, Sparkles, TrendingUp, Calendar } from "lucide-react";
import type { DashboardStats } from "@/types";

interface StatsGridProps {
  stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  // Wyświetlanie "—" zamiast "0%" gdy brak generacji
  const acceptanceRateDisplay = stats.totalGenerations === 0 ? "—" : `${stats.acceptanceRate}%`;

  // Dla MVP - placeholder dla fiszek do nauki
  const flashcardsDueDisplay = "Wkrótce";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatsCard
        icon={<BookOpen className="w-6 h-6" />}
        value={stats.totalFlashcards}
        label="Wszystkie fiszki"
        variant="default"
      />
      <StatsCard
        icon={<Sparkles className="w-6 h-6" />}
        value={stats.totalGenerations}
        label="Generacje AI"
        variant="default"
      />
      <StatsCard
        icon={<TrendingUp className="w-6 h-6" />}
        value={acceptanceRateDisplay}
        label="Wskaźnik akceptacji"
        variant="highlight"
      />
      <StatsCard
        icon={<Calendar className="w-6 h-6" />}
        value={flashcardsDueDisplay}
        label="Do nauki dzisiaj"
        variant="default"
      />
    </div>
  );
}

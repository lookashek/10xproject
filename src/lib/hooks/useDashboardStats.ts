import { useState, useEffect } from 'react';
import type { DashboardStats, FlashcardListResponse, GenerationListResponse } from '../../types';

type UseDashboardStatsReturn = {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Równoległe wywołania API
      const [flashcardsRes, generationsRes] = await Promise.all([
        fetch('/api/flashcards?limit=1'),
        fetch('/api/generations?limit=50'), // zwiększony limit dla dokładniejszych statystyk
      ]);

      if (!flashcardsRes.ok || !generationsRes.ok) {
        throw new Error('Błąd podczas pobierania statystyk');
      }

      const flashcardsData: FlashcardListResponse = await flashcardsRes.json();
      const generationsData: GenerationListResponse = await generationsRes.json();

      // Obliczenia statystyk
      const totalFlashcards = flashcardsData.pagination.total;
      const totalGenerations = generationsData.pagination.total;
      
      // Obliczanie wskaźnika akceptacji
      let acceptanceRate = 0;
      if (generationsData.data.length > 0) {
        const totalGenerated = generationsData.data.reduce(
          (sum, gen) => sum + gen.generated_count, 
          0
        );
        const totalAccepted = generationsData.data.reduce(
          (sum, gen) => sum + (gen.accepted_unedited_count || 0) + (gen.accepted_edited_count || 0),
          0
        );
        acceptanceRate = totalGenerated > 0 
          ? Math.round((totalAccepted / totalGenerated) * 100) 
          : 0;
      }

      // Fiszki do nauki - na MVP placeholder
      const flashcardsDueForStudy = 0;

      setStats({
        totalFlashcards,
        totalGenerations,
        acceptanceRate,
        flashcardsDueForStudy,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Nieznany błąd'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}


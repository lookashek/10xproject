/**
 * CompletedState - Ekran gratulacyjny po zakończeniu sesji
 * 
 * Wyświetla:
 * - Statystyki sesji
 * - Breakdown ocen
 * - Czas nauki
 * - Opcje: powrót lub restart
 */

import { useState, useEffect } from 'react';
import { Trophy, Clock, RotateCw, Home, X, AlertCircle, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { CompletedStateProps } from '@/types';

export function CompletedState({ stats, onRestart, onExit }: CompletedStateProps) {
  const [countdown, setCountdown] = useState(10);

  // Auto-redirect countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onExit]);

  // Format duration (seconds to mm:ss)
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const ratingIcons = {
    again: { icon: X, label: 'Powtórz', color: 'text-red-600 dark:text-red-400' },
    hard: { icon: AlertCircle, label: 'Trudne', color: 'text-orange-600 dark:text-orange-400' },
    good: { icon: Check, label: 'Dobre', color: 'text-green-600 dark:text-green-400' },
    easy: { icon: Star, label: 'Łatwe', color: 'text-blue-600 dark:text-blue-400' },
  };

  return (
    <div className="container mx-auto px-4 py-24" data-testid="study-completed">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center space-y-8">
            {/* Trophy icon */}
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Trophy className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">
                Świetna robota!
              </h1>
              <p className="text-lg text-muted-foreground">
                Ukończyłeś sesję nauki
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1">
                <div className="text-4xl font-bold">
                  {stats.totalReviewed}
                </div>
                <div className="text-sm text-muted-foreground">
                  przejrzanych fiszek
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-bold flex items-center justify-center gap-2">
                  <Clock className="h-8 w-8" />
                  {formatDuration(stats.durationSeconds)}
                </div>
                <div className="text-sm text-muted-foreground">
                  czas nauki
                </div>
              </div>
            </div>

            {/* Ratings breakdown */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Twoje oceny
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(ratingIcons).map(([key, { icon: Icon, label, color }]) => {
                  const count = stats.ratings[key as keyof typeof stats.ratings];
                  return (
                    <div key={key} className="space-y-2">
                      <Icon className={`h-6 w-6 mx-auto ${color}`} />
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={onExit}
                className="gap-2"
              >
                <Home className="h-5 w-5" />
                Powrót do panelu
              </Button>
              <Button
                size="lg"
                onClick={onRestart}
                className="gap-2"
              >
                <RotateCw className="h-5 w-5" />
                Rozpocznij nową sesję
              </Button>
            </div>

            {/* Auto-redirect countdown */}
            <p className="text-sm text-muted-foreground">
              Automatyczne przekierowanie za {countdown}s
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


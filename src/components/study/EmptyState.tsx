/**
 * EmptyState - Ekran gdy brak fiszek do nauki
 * 
 * Zachęca użytkownika do:
 * - Dodania fiszek ręcznie
 * - Wygenerowania fiszek przez AI
 */

import { BookOpen, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { HTMLAttributes } from 'react';

export function EmptyState(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="container mx-auto px-4 py-24" {...props}>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                Brak fiszek do nauki
              </h2>
              <p className="text-muted-foreground">
                Nie masz jeszcze żadnych fiszek. Stwórz je ręcznie lub wygeneruj za pomocą AI.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <a href="/flashcards">
                  <Plus className="h-5 w-5" />
                  Dodaj fiszkę
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                className="gap-2"
              >
                <a href="/generate">
                  <Sparkles className="h-5 w-5" />
                  Generuj fiszki
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


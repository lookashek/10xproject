/**
 * AssociatedFlashcardsSection - Sekcja z powiązanymi fiszkami
 *
 * Wyświetla listę fiszek zaakceptowanych z tej generacji.
 * Pokazuje front, back i badge ze statusem (AI - bez edycji / AI - edytowana).
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AssociatedFlashcardsSectionProps } from "@/types";

export function AssociatedFlashcardsSection({ flashcards }: AssociatedFlashcardsSectionProps) {
  return (
    <Card data-testid="generation-flashcards">
      <CardHeader>
        <CardTitle>Powiązane fiszki ({flashcards.length})</CardTitle>
        <CardDescription>Fiszki zaakceptowane z tej generacji</CardDescription>
      </CardHeader>
      <CardContent>
        {flashcards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="generation-flashcards-empty">
            <p>Brak zaakceptowanych fiszek z tej generacji.</p>
            <p className="text-sm mt-1">Wszystkie propozycje zostały odrzucone.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flashcards.map((flashcard) => (
              <Card key={flashcard.id} className="border-l-4 border-l-primary/30" data-testid="generation-flashcard">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <dt className="text-xs font-medium text-muted-foreground mb-1">Przód</dt>
                      <dd className="text-sm font-medium">{flashcard.front}</dd>
                    </div>
                    <Badge variant={flashcard.source === "ai-full" ? "default" : "secondary"}>
                      {flashcard.source === "ai-full" ? "AI - bez edycji" : "AI - edytowana"}
                    </Badge>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-muted-foreground mb-1">Tył</dt>
                    <dd className="text-sm text-muted-foreground">{flashcard.back}</dd>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

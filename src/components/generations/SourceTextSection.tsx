/**
 * SourceTextSection - Sekcja z informacjami o tekście źródłowym
 *
 * Wyświetla hash tekstu źródłowego i jego długość.
 * API nie zwraca pełnego tekstu ze względów bezpieczeństwa i wydajności.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTextLength } from "@/lib/viewModels/generationViewModels";
import type { SourceTextSectionProps } from "@/types";

export function SourceTextSection({ sourceTextHash, sourceTextLength }: SourceTextSectionProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Tekst źródłowy</CardTitle>
        <CardDescription>Informacje o tekście użytym do generacji fiszek</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground mb-1">Długość tekstu</dt>
            <dd className="text-lg font-semibold">{formatTextLength(sourceTextLength)}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground mb-1">Hash SHA-256</dt>
            <dd className="text-sm font-mono break-all bg-muted p-3 rounded-md">{sourceTextHash}</dd>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

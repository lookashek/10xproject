/**
 * Komponent listy generacji
 *
 * Renderuje responsywną tabelę z listą generacji wykorzystując komponenty Table z shadcn/ui.
 */

import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GenerationRow } from "./GenerationRow";
import type { GenerationListProps } from "@/types";

export function GenerationList({ generations, onRowClick }: GenerationListProps) {
  return (
    <div className="rounded-md border" data-testid="generation-list">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data utworzenia</TableHead>
            <TableHead>Długość tekstu</TableHead>
            <TableHead className="text-center">Wygenerowano</TableHead>
            <TableHead>Zaakceptowano</TableHead>
            <TableHead>Wskaźnik akceptacji</TableHead>
            <TableHead>Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {generations.map((generation) => (
            <GenerationRow key={generation.id} generation={generation} onRowClick={onRowClick} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

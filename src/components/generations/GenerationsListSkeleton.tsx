/**
 * Komponent skeleton UI dla listy generacji
 * 
 * Wyświetlany podczas ładowania listy generacji.
 * Symuluje strukturę tabeli z 5 wierszami.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export function GenerationsListSkeleton() {
  return (
    <div className="rounded-md border">
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
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-8 mx-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-full max-w-[200px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-32" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


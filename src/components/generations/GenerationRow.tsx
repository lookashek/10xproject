/**
 * Komponent pojedynczego wiersza w tabeli generacji
 * 
 * Wyświetla dane pojedynczej generacji w formie wiersza tabeli.
 * Jest klikalny - po kliknięciu nawiguje do szczegółów generacji.
 */

import { format, formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { AcceptanceRateIndicator } from './AcceptanceRateIndicator';
import { formatTextLength, formatAcceptedCounts } from '@/lib/viewModels/generationViewModels';
import type { GenerationRowProps } from '@/types';

export function GenerationRow({ generation, onRowClick }: GenerationRowProps) {
  const createdDate = new Date(generation.created_at);
  const formattedDate = formatDistanceToNow(createdDate, { addSuffix: true, locale: pl });
  const fullDate = format(createdDate, 'PPp', { locale: pl });

  const handleClick = () => {
    onRowClick(generation.id);
  };

  return (
    <TableRow 
      onClick={handleClick}
      className="cursor-pointer hover:bg-muted/50 transition-colors"
    >
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm">{formattedDate}</span>
          <span className="text-xs text-muted-foreground">{fullDate}</span>
        </div>
      </TableCell>
      <TableCell>
        {formatTextLength(generation.source_text_length)}
      </TableCell>
      <TableCell className="text-center">
        {generation.generated_count}
      </TableCell>
      <TableCell>
        {formatAcceptedCounts(generation.accepted_unedited_count, generation.accepted_edited_count)}
      </TableCell>
      <TableCell>
        <AcceptanceRateIndicator
          generatedCount={generation.generated_count}
          acceptedUnedited={generation.accepted_unedited_count}
          acceptedEdited={generation.accepted_edited_count}
        />
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRowClick(generation.id);
          }}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Zobacz szczegóły
        </Button>
      </TableCell>
    </TableRow>
  );
}


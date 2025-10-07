/**
 * GenerationDetailHeader - Nagłówek widoku szczegółów generacji
 * 
 * Wyświetla tytuł z ID generacji, datę utworzenia i podstawowe informacje.
 */

import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { GenerationDetailHeaderProps } from '@/types';

export function GenerationDetailHeader({ generation }: GenerationDetailHeaderProps) {
  const createdDate = new Date(generation.created_at);
  const formattedDate = format(createdDate, 'PPp', { locale: pl });

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold">Generacja #{generation.id}</h1>
        <Badge variant="secondary">{formattedDate}</Badge>
      </div>
      <p className="text-muted-foreground">
        Szczegóły generacji z {format(createdDate, 'PP', { locale: pl })}
      </p>
    </div>
  );
}


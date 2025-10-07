/**
 * Pagination - Pagination controls for flashcard list
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

function getPluralForm(count: number, singular: string, plural2to4: string, plural5Plus: string): string {
  if (count === 1) return singular;
  if (count >= 2 && count <= 4) return plural2to4;
  return plural5Plus;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const delta = 1; // ile stron po każdej stronie bieżącej
  const range: (number | string)[] = [];
  
  if (totalPages <= 1) return [1];
  
  // Zawsze pokazuj pierwszą stronę
  range.push(1);
  
  // Dodaj ellipsis lub strony przed bieżącą
  if (currentPage - delta > 2) {
    range.push('...');
  }
  
  for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
    range.push(i);
  }
  
  // Dodaj ellipsis lub strony po bieżącej
  if (currentPage + delta < totalPages - 1) {
    range.push('...');
  }
  
  // Zawsze pokazuj ostatnią stronę (jeśli więcej niż 1 strona)
  if (totalPages > 1) {
    range.push(totalPages);
  }
  
  return range;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: PaginationProps) {
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="default"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Poprzednia strona"
        >
          <ChevronLeft className="size-4" />
          Poprzednia
        </Button>
        
        {pageNumbers.map((pageNum, index) => {
          if (pageNum === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            );
          }
          
          const page = Number(pageNum);
          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(page)}
              aria-label={`Strona ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          );
        })}
        
        <Button
          variant="outline"
          size="default"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Następna strona"
        >
          Następna
          <ChevronRight className="size-4" />
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Strona {currentPage} z {totalPages} ({totalItems} {getPluralForm(totalItems, 'fiszka', 'fiszki', 'fiszek')})
      </p>
    </div>
  );
}


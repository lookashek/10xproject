/**
 * ProposalCard - Karta pojedynczej propozycji fiszki
 * 
 * Pojedyncza karta propozycji fiszki z możliwością zaznaczenia,
 * inline edycji i wizualnym wskaźnikiem źródła (badge "AI").
 */

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { ProposalCardProps } from '@/lib/viewModels/generateView.types';

export function ProposalCard({
  proposal,
  index,
  isSelected,
  editedValues,
  onToggleSelect,
  onEdit,
}: ProposalCardProps) {
  const currentFront = editedValues?.front ?? proposal.front;
  const currentBack = editedValues?.back ?? proposal.back;

  const handleFrontChange = (value: string) => {
    onEdit(index, 'front', value);
  };

  const handleBackChange = (value: string) => {
    onEdit(index, 'back', value);
  };

  return (
    <Card 
      className={cn(
        "p-4 transition-all",
        isSelected ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      <div className="flex gap-3">
        {/* Checkbox */}
        <div className="pt-1">
          <Checkbox
            id={`proposal-${index}`}
            checked={isSelected}
            onCheckedChange={(checked) => onToggleSelect(index, checked as boolean)}
            aria-label={`Zaznacz propozycję ${index + 1}`}
          />
        </div>

        {/* Treść */}
        <div className="flex-1 space-y-3">
          {/* Header z numerem i badge */}
          <div className="flex items-center justify-between">
            <Label htmlFor={`proposal-${index}`} className="text-sm font-medium cursor-pointer">
              Fiszka {index + 1}
            </Label>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI
            </Badge>
          </div>

          {/* Front (Pytanie) */}
          <div className="space-y-1.5">
            <Label htmlFor={`front-${index}`} className="text-xs text-muted-foreground">
              Przód (pytanie)
            </Label>
            <Input
              id={`front-${index}`}
              value={currentFront}
              onChange={(e) => handleFrontChange(e.target.value)}
              maxLength={200}
              disabled={!isSelected}
              className={cn(!isSelected && "opacity-50")}
              aria-describedby={`front-counter-${index}`}
            />
            <div 
              id={`front-counter-${index}`}
              className="text-xs text-muted-foreground text-right"
            >
              {currentFront.length} / 200
            </div>
          </div>

          {/* Back (Odpowiedź) */}
          <div className="space-y-1.5">
            <Label htmlFor={`back-${index}`} className="text-xs text-muted-foreground">
              Tył (odpowiedź)
            </Label>
            <Textarea
              id={`back-${index}`}
              value={currentBack}
              onChange={(e) => handleBackChange(e.target.value)}
              maxLength={500}
              rows={3}
              disabled={!isSelected}
              className={cn(!isSelected && "opacity-50")}
              aria-describedby={`back-counter-${index}`}
            />
            <div 
              id={`back-counter-${index}`}
              className="text-xs text-muted-foreground text-right"
            >
              {currentBack.length} / 500
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}


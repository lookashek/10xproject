/**
 * FlashcardToolbar - Toolbar with add button and source filter
 */

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FlashcardSource } from "@/types";

interface FlashcardToolbarProps {
  onAddClick: () => void;
  sourceFilter: FlashcardSource | "all";
  onSourceFilterChange: (source: FlashcardSource | "all") => void;
}

export default function FlashcardToolbar({ onAddClick, sourceFilter, onSourceFilterChange }: FlashcardToolbarProps) {
  return (
    <div
      className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4"
      data-testid="flashcard-toolbar"
    >
      <div className="flex items-center gap-2">
        <label htmlFor="source-filter" className="text-sm font-medium text-foreground">
          Filtr:
        </label>
        <Select
          value={sourceFilter}
          onValueChange={(value) => onSourceFilterChange(value as FlashcardSource | "all")}
          data-testid="flashcard-source-filter"
        >
          <SelectTrigger id="source-filter" className="w-[180px]">
            <SelectValue placeholder="Wszystkie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="ai-full">AI</SelectItem>
            <SelectItem value="ai-edited">AI (edytowane)</SelectItem>
            <SelectItem value="manual">Ręczne</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={onAddClick} variant="default" data-testid="add-flashcard-btn">
        <Plus className="size-4" />
        Dodaj fiszkę
      </Button>
    </div>
  );
}

/**
 * ProposalList - Lista propozycji fiszek
 *
 * Lista propozycji fiszek z kontrolkami do zaznaczania wszystkich/żadnych
 * oraz przyciskiem zapisu. Zarządza stanem zaznaczenia i edycji każdej propozycji.
 */

import { useState, useCallback } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProposalCard } from "./ProposalCard";
import type { ProposalListProps, ProposalListState } from "@/lib/viewModels/generateView.types";
import type { FlashcardCreateCommand } from "@/types";

export function ProposalList({ proposals, generationId, onSave }: ProposalListProps) {
  // Stan: Domyślnie wszystkie zaznaczone
  const [state, setState] = useState<ProposalListState>({
    selectedIds: new Set(proposals.map((_, index) => index)),
    editedProposals: new Map(),
    isSaving: false,
  });

  const selectedCount = state.selectedIds.size;
  const totalCount = proposals.length;

  const handleSelectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedIds: new Set(proposals.map((_, i) => i)),
    }));
  }, [proposals]);

  const handleDeselectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedIds: new Set(),
    }));
  }, []);

  const handleToggleSelect = useCallback((index: number, checked: boolean) => {
    setState((prev) => {
      const newSet = new Set(prev.selectedIds);
      if (checked) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      return {
        ...prev,
        selectedIds: newSet,
      };
    });
  }, []);

  const handleEdit = useCallback((index: number, field: "front" | "back", value: string) => {
    setState((prev) => {
      const newMap = new Map(prev.editedProposals);
      const currentEdit = newMap.get(index) || {};
      newMap.set(index, {
        ...currentEdit,
        [field]: value,
      });
      return {
        ...prev,
        editedProposals: newMap,
      };
    });
  }, []);

  const handleSave = async () => {
    if (selectedCount === 0 || state.isSaving) {
      return;
    }

    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      // Przygotowanie danych do zapisu
      const flashcardsToSave: FlashcardCreateCommand[] = [];

      for (const index of state.selectedIds) {
        const proposal = proposals[index];
        const edits = state.editedProposals.get(index);

        // Określenie czy fiszka była edytowana
        const wasEdited = edits && (edits.front !== undefined || edits.back !== undefined);

        flashcardsToSave.push({
          front: edits?.front ?? proposal.front,
          back: edits?.back ?? proposal.back,
          source: wasEdited ? "ai-edited" : "ai-full",
          generation_id: generationId,
        });
      }

      await onSave(flashcardsToSave);
    } finally {
      setState((prev) => ({ ...prev, isSaving: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Kontrolki zaznaczania */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg" data-testid="proposal-controls">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={state.isSaving}>
            Zaznacz wszystkie
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeselectAll} disabled={state.isSaving}>
            Odznacz wszystkie
          </Button>
        </div>
        <div className="text-sm font-medium">
          Zaznaczono: <span className="text-primary">{selectedCount}</span> z {totalCount}
        </div>
      </div>

      {/* Lista propozycji */}
      <div className="space-y-3" data-testid="proposal-list">
        {proposals.map((proposal, index) => (
          <ProposalCard
            key={index}
            proposal={proposal}
            index={index}
            isSelected={state.selectedIds.has(index)}
            editedValues={state.editedProposals.get(index)}
            onToggleSelect={handleToggleSelect}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {/* Przycisk zapisu */}
      <div className="flex justify-end pt-4">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={selectedCount === 0 || state.isSaving}
          className="min-w-[200px]"
          data-testid="save-proposals-btn"
        >
          {state.isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Zapisz wybrane ({selectedCount})
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

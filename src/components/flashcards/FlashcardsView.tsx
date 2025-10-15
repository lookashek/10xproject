/**
 * FlashcardsView - Main container component for flashcard list view
 * Manages state, pagination, filtering, and CRUD operations
 */

import { useState, useEffect } from "react";
import { useFlashcardList } from "@/lib/hooks/useFlashcardList";
import { useFlashcardQueryParams } from "@/lib/hooks/useFlashcardQueryParams";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import type { FlashcardDTO, FlashcardListResponse, FlashcardSource, FlashcardFormData } from "@/types";
import FlashcardToolbar from "./FlashcardToolbar";
import FlashcardGrid from "./FlashcardGrid";
import FlashcardGridSkeleton from "./FlashcardGridSkeleton";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";
import FlashcardDialog from "./FlashcardDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { toast } from "sonner";

interface FlashcardsViewProps {
  initialData: FlashcardListResponse;
  initialPage: number;
  initialSource?: FlashcardSource;
}

function FlashcardsViewInner({ initialData }: FlashcardsViewProps) {
  const { page, source, updateQueryParams } = useFlashcardQueryParams();
  const {
    flashcards,
    pagination,
    isLoading,
    error,
    fetchFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
  } = useFlashcardList(initialData, page, source);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedFlashcard, setSelectedFlashcard] = useState<FlashcardDTO | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState<FlashcardDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Source filter state
  const [sourceFilter, setSourceFilter] = useState<FlashcardSource | "all">(source || "all");

  // Fetch flashcards when page or source changes
  useEffect(() => {
    fetchFlashcards(page, source);
  }, [page, source, fetchFlashcards]);

  // Handlers
  const handleAddClick = () => {
    setDialogMode("create");
    setSelectedFlashcard(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (flashcard: FlashcardDTO) => {
    setDialogMode("edit");
    setSelectedFlashcard(flashcard);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (flashcard: FlashcardDTO) => {
    setFlashcardToDelete(flashcard);
    setIsDeleteDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedFlashcard(null);
  };

  const handleDialogSave = async (data: FlashcardFormData) => {
    setIsSaving(true);
    try {
      if (dialogMode === "create") {
        await createFlashcard(data);
        toast.success("Fiszka została utworzona");
      } else if (selectedFlashcard) {
        await updateFlashcard(selectedFlashcard.id, data);
        toast.success("Fiszka została zaktualizowana");
      }
      handleDialogClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wystąpił błąd");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!flashcardToDelete) return;

    setIsDeleting(true);
    try {
      await deleteFlashcard(flashcardToDelete.id);
      toast.success("Fiszka została usunięta");
      setIsDeleteDialogOpen(false);
      setFlashcardToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się usunąć fiszki");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setFlashcardToDelete(null);
  };

  const handleSourceFilterChange = (newSource: FlashcardSource | "all") => {
    setSourceFilter(newSource);
    updateQueryParams({ page: 1, source: newSource });
  };

  const handlePageChange = (newPage: number) => {
    updateQueryParams({ page: newPage });
  };

  return (
    <div className="min-h-screen bg-background" data-testid="flashcards-view">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Moje fiszki</h1>

        <FlashcardToolbar
          onAddClick={handleAddClick}
          sourceFilter={sourceFilter}
          onSourceFilterChange={handleSourceFilterChange}
        />

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
            <p>{error.message}</p>
          </div>
        )}

        {isLoading ? (
          <FlashcardGridSkeleton data-testid="flashcard-grid-skeleton" />
        ) : flashcards.length === 0 ? (
          <EmptyState onAddClick={handleAddClick} data-testid="flashcard-empty-state" />
        ) : (
          <>
            <FlashcardGrid flashcards={flashcards} onEditClick={handleEditClick} onDeleteClick={handleDeleteClick} />

            {pagination.total_pages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                totalItems={pagination.total}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}

        <FlashcardDialog
          open={isDialogOpen}
          mode={dialogMode}
          flashcard={selectedFlashcard}
          onClose={handleDialogClose}
          onSave={handleDialogSave}
          isSaving={isSaving}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          flashcardFront={flashcardToDelete?.front}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}

export default function FlashcardsView(props: FlashcardsViewProps) {
  return (
    <ThemeProvider>
      <FlashcardsViewInner {...props} />
    </ThemeProvider>
  );
}

/**
 * DeleteConfirmDialog - Confirmation dialog for deleting flashcards
 */

import { Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface DeleteConfirmDialogProps {
  open: boolean;
  flashcardFront?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export default function DeleteConfirmDialog({
  open,
  flashcardFront,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent data-testid="flashcard-delete-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć tę fiszkę?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta operacja jest nieodwracalna. Fiszka zostanie trwale usunięta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {flashcardFront && (
          <div className="bg-muted p-4 rounded-md border border-border">
            <p className="text-sm text-muted-foreground line-clamp-2">
              <strong>Przód:</strong> {flashcardFront}
            </p>
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Anuluj
          </AlertDialogCancel>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            variant="destructive"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Usuń
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


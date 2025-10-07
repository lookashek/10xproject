/**
 * FlashcardDialog - Dialog for creating and editing flashcards
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import FlashcardForm from './FlashcardForm';
import type { FlashcardDTO, FlashcardFormData } from '@/types';

interface FlashcardDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  flashcard: FlashcardDTO | null;
  onClose: () => void;
  onSave: (data: FlashcardFormData) => Promise<void>;
  isSaving: boolean;
}

export default function FlashcardDialog({
  open,
  mode,
  flashcard,
  onClose,
  onSave,
  isSaving,
}: FlashcardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Dodaj nową fiszkę' : 'Edytuj fiszkę'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Stwórz nową fiszkę ręcznie, wpisując przód i tył.'
              : 'Edytuj treść fiszki. Jeśli fiszka pochodzi z AI, zostanie oznaczona jako edytowana.'}
          </DialogDescription>
        </DialogHeader>
        
        <FlashcardForm
          initialData={flashcard}
          onSubmit={onSave}
          onCancel={onClose}
          isSaving={isSaving}
        />
      </DialogContent>
    </Dialog>
  );
}


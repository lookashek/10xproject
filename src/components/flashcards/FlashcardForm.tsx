/**
 * FlashcardForm - Form for creating/editing flashcard content
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { flashcardFormSchema } from '@/lib/validation/flashcard.schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FlashcardDTO, FlashcardFormData } from '@/types';
import { useState } from 'react';

interface FlashcardFormProps {
  initialData: FlashcardDTO | null;
  onSubmit: (data: FlashcardFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export default function FlashcardForm({
  initialData,
  onSubmit,
  onCancel,
  isSaving,
}: FlashcardFormProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<FlashcardFormData>({
    resolver: zodResolver(flashcardFormSchema),
    mode: 'onChange',
    defaultValues: {
      front: initialData?.front ?? '',
      back: initialData?.back ?? '',
    },
  });

  const watchFront = watch('front', '');
  const watchBack = watch('back', '');

  const onSubmitInternal = async (data: FlashcardFormData) => {
    setError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas zapisywania');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitInternal)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="front">
          Przód fiszki
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="front"
          {...register('front')}
          placeholder="Co chcesz zapamiętać?"
          maxLength={200}
          aria-invalid={!!errors.front}
          aria-describedby="front-error front-counter"
        />
        {errors.front && (
          <p id="front-error" className="text-sm text-destructive">
            {errors.front.message}
          </p>
        )}
        <p id="front-counter" className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {watchFront.length}/200
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="back">
          Tył fiszki
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Textarea
          id="back"
          {...register('back')}
          placeholder="Jaka jest odpowiedź?"
          maxLength={500}
          rows={5}
          aria-invalid={!!errors.back}
          aria-describedby="back-error back-counter"
        />
        {errors.back && (
          <p id="back-error" className="text-sm text-destructive">
            {errors.back.message}
          </p>
        )}
        <p id="back-counter" className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {watchBack.length}/500
        </p>
      </div>
      
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Anuluj
        </Button>
        <Button
          type="submit"
          variant="default"
          disabled={isSaving || !isValid}
        >
          {isSaving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            'Zapisz'
          )}
        </Button>
      </div>
    </form>
  );
}


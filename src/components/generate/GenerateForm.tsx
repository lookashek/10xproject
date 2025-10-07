/**
 * GenerateForm - Formularz do wprowadzania tekstu źródłowego
 * 
 * Formularz do wprowadzania tekstu źródłowego dla generowania fiszek.
 * Zawiera textarea z walidacją długości tekstu (1000-10000 znaków),
 * licznik znaków w czasie rzeczywistym oraz przycisk generowania.
 */

import { useState, useCallback, type FormEvent, type ChangeEvent, type KeyboardEvent } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CharacterCounter } from './CharacterCounter';
import type { GenerateFormProps, GenerateFormState } from '@/lib/viewModels/generateView.types';

export function GenerateForm({ 
  onGenerate, 
  isLoading,
  initialValue = '' 
}: GenerateFormProps) {
  const [formState, setFormState] = useState<GenerateFormState>({
    sourceText: initialValue,
    charCount: initialValue.trim().length,
    isValid: false,
    validationError: null,
  });

  const validateText = useCallback((text: string): boolean => {
    const trimmed = text.trim();
    const length = trimmed.length;
    
    if (length === 0) {
      setFormState(prev => ({
        ...prev,
        charCount: length,
        isValid: false,
        validationError: 'Wprowadź tekst źródłowy',
      }));
      return false;
    }
    
    if (length < 1000) {
      setFormState(prev => ({
        ...prev,
        charCount: length,
        isValid: false,
        validationError: `Tekst musi mieć minimum 1000 znaków (aktualnie: ${length})`,
      }));
      return false;
    }
    
    if (length > 10000) {
      setFormState(prev => ({
        ...prev,
        charCount: length,
        isValid: false,
        validationError: `Tekst może mieć maksymalnie 10000 znaków (aktualnie: ${length})`,
      }));
      return false;
    }
    
    setFormState(prev => ({
      ...prev,
      charCount: length,
      isValid: true,
      validationError: null,
    }));
    return true;
  }, []);

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setFormState(prev => ({
      ...prev,
      sourceText: newText,
    }));
    validateText(newText);
  }, [validateText]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formState.isValid || isLoading) {
      return;
    }
    
    await onGenerate(formState.sourceText.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter dla szybkiego submitu
    if (e.ctrlKey && e.key === 'Enter' && formState.isValid && !isLoading) {
      e.preventDefault();
      onGenerate(formState.sourceText.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="source-text">
          Tekst źródłowy
          <span className="text-muted-foreground"> (1000-10000 znaków)</span>
        </Label>
        <Textarea
          id="source-text"
          value={formState.sourceText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki..."
          className="min-h-[300px] mt-2"
          disabled={isLoading}
          aria-describedby="char-counter char-error"
          aria-invalid={!formState.isValid && formState.charCount > 0}
        />
        <CharacterCounter 
          current={formState.charCount} 
          min={1000} 
          max={10000}
          isValid={formState.isValid}
        />
        {formState.validationError && formState.charCount > 0 && (
          <p id="char-error" className="text-sm text-destructive mt-1">
            {formState.validationError}
          </p>
        )}
      </div>
      
      <Button 
        type="submit" 
        disabled={!formState.isValid || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generowanie...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generuj fiszki
          </>
        )}
      </Button>
    </form>
  );
}


/**
 * GenerateView - Główny kontener widoku generowania fiszek
 * 
 * Główny komponent React zarządzający całym przepływem widoku generowania fiszek.
 * Odpowiada za orkiestrację stanu aplikacji, wywołania API oraz koordynację podkomponentów.
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { GenerateForm } from './GenerateForm';
import { LoadingIndicator } from './LoadingIndicator';
import { ProposalSection } from './ProposalSection';
import { generateFlashcardsFromText, saveAcceptedFlashcards } from '@/lib/api/generations';
import { handleGenerateError, handleSaveError } from '@/lib/utils/errorHandlers';
import type { 
  GenerateViewState, 
  GenerateViewProps 
} from '@/lib/viewModels/generateView.types';
import type { FlashcardCreateCommand } from '@/types';

export function GenerateView({ initialText }: GenerateViewProps) {
  const [viewState, setViewState] = useState<GenerateViewState>({
    phase: 'input',
    generationData: null,
    isLoading: false,
    error: null,
  });

  /**
   * Obsługa generowania fiszek z AI
   */
  const handleGenerate = useCallback(async (sourceText: string) => {
    // Rozpoczęcie generowania
    setViewState({
      phase: 'loading',
      generationData: null,
      isLoading: true,
      error: null,
    });

    try {
      const data = await generateFlashcardsFromText(sourceText);
      
      // Sukces - przejście do fazy przeglądania
      setViewState({
        phase: 'reviewing',
        generationData: data,
        isLoading: false,
        error: null,
      });

      toast.success('Fiszki zostały wygenerowane!', {
        description: `Wygenerowano ${data.proposals.length} propozycji fiszek`,
      });
    } catch (error: any) {
      // Błąd - powrót do fazy input
      setViewState({
        phase: 'input',
        generationData: null,
        isLoading: false,
        error: {
          type: error.code === 'NETWORK_ERROR' ? 'network' : 'llm_error',
          message: error.message,
          details: error.details,
        },
      });

      handleGenerateError(error);
    }
  }, []);

  /**
   * Obsługa zapisywania zaakceptowanych fiszek
   */
  const handleSave = useCallback(async (flashcards: FlashcardCreateCommand[]) => {
    setViewState(prev => ({
      ...prev,
      phase: 'saving',
    }));

    try {
      await saveAcceptedFlashcards(flashcards);
      
      // Sukces - reset widoku
      setViewState({
        phase: 'input',
        generationData: null,
        isLoading: false,
        error: null,
      });

      toast.success('Fiszki zostały zapisane!', {
        description: `Zapisano ${flashcards.length} ${flashcards.length === 1 ? 'fiszkę' : 'fiszek'}`,
      });
    } catch (error: any) {
      // Błąd - powrót do fazy reviewing
      setViewState(prev => ({
        ...prev,
        phase: 'reviewing',
      }));

      handleSaveError(error);
    }
  }, []);

  /**
   * Reset widoku (opcjonalnie dostępny przez UI)
   */
  const handleReset = useCallback(() => {
    setViewState({
      phase: 'input',
      generationData: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Generuj fiszki AI</h1>
        <p className="text-muted-foreground">
          Wklej tekst źródłowy (artykuł, notatki, dokumentację), a AI wygeneruje dla Ciebie 
          gotowe fiszki edukacyjne. Możesz je następnie przeglądnąć, edytować i wybrać te, 
          które chcesz zapisać.
        </p>
      </header>
      
      {/* Formularz - zawsze widoczny, disabled gdy loading */}
      <div className="mb-8">
        <GenerateForm 
          onGenerate={handleGenerate}
          isLoading={viewState.isLoading}
          initialValue={initialText}
        />
      </div>
      
      {/* Loading indicator */}
      {viewState.phase === 'loading' && (
        <LoadingIndicator />
      )}
      
      {/* Propozycje fiszek */}
      {(viewState.phase === 'reviewing' || viewState.phase === 'saving') && viewState.generationData && (
        <ProposalSection
          generationData={viewState.generationData}
          onSave={handleSave}
        />
      )}
    </div>
  );
}


/**
 * Centralne funkcje obsługi błędów dla widoków aplikacji
 * 
 * Zawiera funkcje do obsługi błędów API i wyświetlania
 * przyjaznych komunikatów dla użytkowników.
 */

import { toast } from 'sonner';
import type { ApiError } from '../api/generations';

/**
 * Obsługuje błędy generowania fiszek
 * Wyświetla odpowiedni toast notification w zależności od typu błędu
 * 
 * @param error - Błąd ApiError z endpointu generowania
 */
export function handleGenerateError(error: ApiError): void {
  switch (error.code) {
    case 'UNPROCESSABLE_ENTITY':
      toast.error(error.message);
      break;

    case 'CONFLICT': {
      const generationId = error.details?.existing_generation_id;
      if (generationId) {
        toast.error(
          'Ta treść została już wygenerowana.',
          {
            duration: 10000,
            description: `Zobacz istniejącą generację`,
            action: {
              label: 'Zobacz',
              onClick: () => {
                window.location.href = `/generations/${generationId}`;
              },
            },
          }
        );
      } else {
        toast.error('Ta treść została już wygenerowana.');
      }
      break;
    }

    case 'SERVICE_UNAVAILABLE':
      toast.error(
        'Serwis AI jest chwilowo niedostępny. Spróbuj ponownie za kilka minut.',
        { duration: 8000 }
      );
      break;

    case 'INTERNAL_SERVER_ERROR':
      toast.error('Nie udało się wygenerować fiszek. Spróbuj ponownie.', {
        action: {
          label: 'Odśwież',
          onClick: () => window.location.reload(),
        },
      });
      break;

    case 'NETWORK_ERROR':
      toast.error('Sprawdź połączenie internetowe i spróbuj ponownie.');
      break;

    default:
      toast.error('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
  }
}

/**
 * Obsługuje błędy zapisywania fiszek
 * Wyświetla odpowiedni toast notification w zależności od typu błędu
 * 
 * @param error - Błąd ApiError z endpointu zapisywania
 */
export function handleSaveError(error: ApiError): void {
  switch (error.code) {
    case 'CONFLICT':
      toast.error(
        'Jedna lub więcej fiszek już istnieje w Twojej kolekcji.'
      );
      break;

    case 'UNPROCESSABLE_ENTITY':
      toast.error(error.message);
      break;

    case 'NETWORK_ERROR':
      toast.error('Sprawdź połączenie internetowe i spróbuj ponownie.');
      break;

    default:
      toast.error('Nie udało się zapisać fiszek. Spróbuj ponownie.');
  }
}


/**
 * ToasterProvider - Provider dla toast notifications
 * 
 * Komponent React montujący Toaster z biblioteki sonner.
 * Wyświetla toast notifications w prawym górnym rogu ekranu.
 */

import { Toaster } from 'sonner';

export function ToasterProvider() {
  return (
    <Toaster 
      position="top-right" 
      richColors 
      closeButton
      duration={4000}
    />
  );
}


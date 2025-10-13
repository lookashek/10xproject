/**
 * DeleteAccountSection - Sekcja usuwania konta
 * 
 * Komponent z interfejsem do trwałego usunięcia konta użytkownika.
 * Wymaga potwierdzenia przez wpisanie "DELETE".
 */

import { useState, useCallback, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';

const CONFIRMATION_TEXT = 'DELETE';

export function DeleteAccountSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed = confirmationText === CONFIRMATION_TEXT;

  const handleDelete = useCallback(async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);

    try {
      // TODO: Implementacja wywołania API
      // const response = await fetch('/api/auth/delete-account', {
      //   method: 'DELETE',
      // });

      // const data = await response.json();

      // if (!response.ok) {
      //   throw new Error(data.error?.message || 'Błąd usuwania konta');
      // }

      // toast.success('Konto zostało trwale usunięte');
      
      // // Wylogowanie i redirect do strony głównej
      // window.location.href = '/';

      // Tymczasowo - symulacja
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Usuwanie konta - funkcja do zaimplementowania');
      setIsDialogOpen(false);
      setConfirmationText('');
      
    } catch (err: any) {
      const message = err.message || 'Wystąpił nieoczekiwany błąd';
      toast.error('Nie udało się usunąć konta', {
        description: message
      });
    } finally {
      setIsDeleting(false);
    }
  }, [isConfirmed, isDeleting]);

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Strefa niebezpieczna</CardTitle>
        <CardDescription>
          Trwałe usunięcie konta i wszystkich danych
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Usunięcie konta jest <strong>nieodwracalne</strong>. Wszystkie twoje fiszki, 
            generacje i dane zostaną trwale usunięte.
          </AlertDescription>
        </Alert>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full sm:w-auto">
              <Trash2 className="mr-2 h-4 w-4" />
              Usuń konto
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>
                    Ta akcja jest <strong className="text-destructive">nieodwracalna</strong>. 
                    Wszystkie twoje dane zostaną trwale usunięte:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Wszystkie fiszki</li>
                    <li>Historia generacji</li>
                    <li>Postępy w nauce</li>
                    <li>Ustawienia konta</li>
                  </ul>
                  <div className="space-y-2 pt-4">
                    <Label htmlFor="confirmation">
                      Aby potwierdzić, wpisz <span className="font-mono font-bold">{CONFIRMATION_TEXT}</span>
                    </Label>
                    <Input
                      id="confirmation"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      placeholder="Wpisz DELETE"
                      disabled={isDeleting}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!isConfirmed || isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Usuń konto na zawsze
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}


/**
 * ProposalSection - Sekcja z propozycjami fiszek
 * 
 * Sekcja zawierająca listę wygenerowanych propozycji wraz z kontrolkami
 * do zaznaczania i zapisywania. Renderowana tylko po pomyślnym wygenerowaniu.
 */

import { ProposalList } from './ProposalList';
import type { ProposalSectionProps } from '@/lib/viewModels/generateView.types';

export function ProposalSection({ 
  generationData, 
  onSave 
}: ProposalSectionProps) {
  return (
    <section className="space-y-6" data-testid="proposal-section">
      <header>
        <h2 className="text-2xl font-semibold">Wygenerowane propozycje</h2>
        <p className="text-muted-foreground mt-1">
          Przejrzyj propozycje, edytuj jeśli potrzeba i wybierz, które chcesz zapisać
        </p>
      </header>
      
      <ProposalList
        proposals={generationData.proposals}
        generationId={generationData.generation.id}
        onSave={onSave}
      />
    </section>
  );
}


import { MenuTile } from './MenuTile';
import { Wand2, Library, GraduationCap, History } from 'lucide-react';

export function MenuGrid() {
  return (
    <nav aria-label="Główna nawigacja">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <MenuTile
          icon={<Wand2 className="w-10 h-10" />}
          title="Generuj fiszki"
          description="Stwórz fiszki z tekstu przy pomocy AI"
          href="/generate"
          variant="primary"
        />
        <MenuTile
          icon={<Library className="w-10 h-10" />}
          title="Moje fiszki"
          description="Przeglądaj i zarządzaj swoimi fiszkami"
          href="/flashcards"
          variant="default"
        />
        <MenuTile
          icon={<GraduationCap className="w-10 h-10" />}
          title="Sesja nauki"
          description="Rozpocznij naukę z algorytmem powtórek"
          href="/study"
          variant="default"
        />
        <MenuTile
          icon={<History className="w-10 h-10" />}
          title="Historia generacji"
          description="Zobacz historię generowania fiszek"
          href="/generations"
          variant="default"
        />
      </div>
    </nav>
  );
}


import { useAuth, useDashboardStats } from "@/lib/hooks";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import { DashboardHeader } from "./DashboardHeader";
import { WelcomeSection } from "./WelcomeSection";
import { StatsSection } from "./StatsSection";
import { NavigationSection } from "./NavigationSection";
import type { UserProfile } from "@/types";

interface DashboardContentProps {
  initialUser?: UserProfile;
}

function DashboardContentInner({ initialUser }: DashboardContentProps) {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const { stats, isLoading: isStatsLoading, error, refetch } = useDashboardStats();

  // Użyj initialUser jeśli jest dostępny, w przeciwnym razie czekaj na useAuth
  const currentUser = user || initialUser;

  // Loading state dla auth
  if (isAuthLoading && !initialUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Ładowanie...</div>
        </div>
      </div>
    );
  }

  // Brak użytkownika - nie powinno się zdarzyć jeśli middleware działa
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Musisz być zalogowany</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Przejdź do głównej zawartości
      </a>

      <DashboardHeader user={currentUser} onLogout={logout} />

      <main id="main-content" className="flex-1" tabIndex={-1}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <WelcomeSection user={currentUser} />

          <div className="space-y-6 sm:space-y-8">
            <StatsSection stats={stats} isLoading={isStatsLoading} error={error} onRetry={refetch} />

            <NavigationSection />
          </div>
        </div>
      </main>
    </div>
  );
}

export function DashboardContent(props: DashboardContentProps) {
  return (
    <ThemeProvider>
      <DashboardContentInner {...props} />
    </ThemeProvider>
  );
}

import { useState, useEffect } from "react";
import { supabaseClient } from "../../db/supabase.client";
import { toast } from "sonner";
import type { UserProfile } from "../../types";

interface UseAuthReturn {
  user: UserProfile | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isTestMode = import.meta.env.MODE === "test";

    const loadUser = async () => {
      if (isTestMode && import.meta.env.E2E_USERNAME) {
        setUser({
          id: import.meta.env.E2E_USERNAME_ID ?? "test-user-id",
          email: import.meta.env.E2E_USERNAME,
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabaseClient.auth.getUser();
      if (data.user && !error) {
        setUser({
          id: data.user.id,
          email: data.user.email ?? "",
          username: data.user.user_metadata?.username,
          avatar_url: data.user.user_metadata?.avatar_url,
        });
      }
      setIsLoading(false);
    };

    void loadUser();

    // Subskrypcja zmian stanu auth
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          username: session.user.user_metadata?.username,
          avatar_url: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    try {
      // Wywołanie API logout
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Błąd wylogowania");
      }

      // Redirect do strony głównej
      window.location.href = "/login";
    } catch {
      // Logout error
      toast.error("Nie udało się wylogować", {
        description: "Spróbuj ponownie",
      });
    }
  };

  return { user, isLoading, logout };
}

import { useState, useEffect } from 'react';
import { supabaseClient } from '../../db/supabase.client';
import { toast } from 'sonner';
import type { UserProfile } from '../../types';

type UseAuthReturn = {
  user: UserProfile | null;
  isLoading: boolean;
  logout: () => Promise<void>;
};

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Pobranie aktualnego użytkownika
    supabaseClient.auth.getUser().then(({ data, error }) => {
      if (data.user && !error) {
        setUser({
          id: data.user.id,
          email: data.user.email!,
          username: data.user.user_metadata?.username,
          avatar_url: data.user.user_metadata?.avatar_url,
        });
      }
      setIsLoading(false);
    });

    // Subskrypcja zmian stanu auth
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            username: session.user.user_metadata?.username,
            avatar_url: session.user.user_metadata?.avatar_url,
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    try {
      // Wywołanie API logout
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Błąd wylogowania');
      }

      // Redirect do strony głównej
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Nie udało się wylogować', {
        description: 'Spróbuj ponownie'
      });
    }
  };

  return { user, isLoading, logout };
}


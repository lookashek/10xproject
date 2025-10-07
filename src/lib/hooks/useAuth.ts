import { useState, useEffect } from 'react';
import { supabaseClient } from '../../db/supabase.client';
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
    // DEVELOPMENT MODE: pomiń sprawdzanie auth z Supabase
    // Używamy initialUser przekazanego z serwera
    setIsLoading(false);
    
    // WYŁĄCZONE NA CZAS DEVELOPMENTU
    // Pobranie aktualnego użytkownika
    // supabaseClient.auth.getUser().then(({ data, error }) => {
    //   if (data.user && !error) {
    //     setUser({
    //       id: data.user.id,
    //       email: data.user.email!,
    //       username: data.user.user_metadata?.username,
    //       avatar_url: data.user.user_metadata?.avatar_url,
    //     });
    //   }
    //   setIsLoading(false);
    // });

    // Subskrypcja zmian stanu auth
    // const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
    //   (event, session) => {
    //     if (session?.user) {
    //       setUser({
    //         id: session.user.id,
    //         email: session.user.email!,
    //         username: session.user.user_metadata?.username,
    //         avatar_url: session.user.user_metadata?.avatar_url,
    //       });
    //     } else {
    //       setUser(null);
    //     }
    //   }
    // );

    // return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    // WYŁĄCZONE NA CZAS DEVELOPMENTU
    // await supabaseClient.auth.signOut();
    window.location.href = '/';
  };

  return { user, isLoading, logout };
}


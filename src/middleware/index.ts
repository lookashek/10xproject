import { defineMiddleware } from 'astro:middleware';

import { supabaseClient } from '../db/supabase.client.ts';

/**
 * Middleware dla ochrony route'ów i zarządzania sesją użytkownika
 * 
 * Funkcjonalności:
 * - Dodaje supabaseClient do context.locals
 * - Sprawdza autoryzację dla chronionych ścieżek
 * - Przekierowuje do /login jeśli brak tokenu
 * - Przekierowuje do /dashboard jeśli użytkownik jest zalogowany i próbuje wejść na /login
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { request, redirect, locals } = context;
  
  // Dodaj supabaseClient do locals
  locals.supabase = supabaseClient;
  
  // Pobierz URL ścieżki
  const url = new URL(request.url);
  
  // Publiczne ścieżki (dostępne bez logowania)
  const publicPaths = ['/', '/login', '/register'];
  const isPublicPath = publicPaths.includes(url.pathname);
  
  // Sprawdź czy użytkownik jest zalogowany
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  const isAuthenticated = !!session && !error;
  
  // Jeśli użytkownik niezalogowany próbuje dostać się do chronionej ścieżki
  // WYŁĄCZONE NA CZAS DEVELOPMENTU
  // if (!isAuthenticated && !isPublicPath) {
  //   return redirect('/login');
  // }
  
  // Jeśli użytkownik zalogowany próbuje wejść na /login
  // WYŁĄCZONE NA CZAS DEVELOPMENTU
  // if (isAuthenticated && url.pathname === '/login') {
  //   return redirect('/dashboard');
  // }
  
  // Dodaj informacje o użytkowniku do locals (jeśli zalogowany)
  if (isAuthenticated && session?.user) {
    locals.user = {
      id: session.user.id,
      email: session.user.email!,
      username: session.user.user_metadata?.username,
      avatar_url: session.user.user_metadata?.avatar_url,
    };
  } else {
    // DEVELOPMENT MODE: dodaj fake użytkownika jeśli nie jest zalogowany
    // Używamy tego samego ID co PLACEHOLDER_USER_ID w API endpoints
    locals.user = {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'dev@example.com',
      username: 'Dev User',
      avatar_url: undefined,
    };
  }
  
  return next();
});


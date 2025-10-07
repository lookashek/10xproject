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
  if (!isAuthenticated && !isPublicPath) {
    return redirect('/login');
  }
  
  // Jeśli użytkownik zalogowany próbuje wejść na /login
  if (isAuthenticated && url.pathname === '/login') {
    return redirect('/dashboard');
  }
  
  // Dodaj informacje o użytkowniku do locals (jeśli zalogowany)
  if (isAuthenticated && session?.user) {
    locals.user = {
      id: session.user.id,
      email: session.user.email!,
      username: session.user.user_metadata?.username,
      avatar_url: session.user.user_metadata?.avatar_url,
    };
  }
  
  return next();
});


import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

/**
 * Middleware dla ochrony route'ów i zarządzania sesją użytkownika
 *
 * Funkcjonalności:
 * - Dodaje supabaseClient do context.locals
 * - Sprawdza autoryzację dla chronionych ścieżek
 * - Przekierowuje do /login jeśli brak autoryzacji
 * - Przekierowuje do /dashboard jeśli użytkownik jest zalogowany i próbuje wejść na /login lub /register
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { request, redirect, locals } = context;

  // Dodaj supabaseClient do locals (potrzebne też w testach)
  locals.supabase = supabaseClient;

  // W trybie test pomiń sprawdzanie autoryzacji
  if (import.meta.env.MODE === "test") {
    return next();
  }

  // Pobierz URL ścieżki
  const url = new URL(request.url);

  // Publiczne ścieżki (dostępne bez logowania)
  const publicPaths = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  const isPublicPath = publicPaths.includes(url.pathname);

  // Auth API endpoints są zawsze publiczne
  const isAuthAPI = url.pathname.startsWith("/api/auth/");

  // Sprawdź sesję użytkownika
  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();
  const isAuthenticated = !!session && !error;

  if (isAuthenticated && session?.user) {
    // Użytkownik zalogowany - dodaj do locals
    locals.user = {
      id: session.user.id,
      email: session.user.email!,
      username: session.user.user_metadata?.username,
      avatar_url: session.user.user_metadata?.avatar_url,
    };

    // Jeśli zalogowany próbuje wejść na /login lub /register
    if (url.pathname === "/login" || url.pathname === "/register") {
      return redirect("/dashboard");
    }
  } else {
    // Użytkownik NIE zalogowany

    // Jeśli próbuje dostać się do chronionej strony
    if (!isPublicPath && !isAuthAPI) {
      // Zapisz oryginalny URL jako redirect parameter
      const redirectTo = url.pathname + url.search;
      return redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
    }
  }

  return next();
});

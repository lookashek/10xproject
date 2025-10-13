<architecture_analysis>

- Strony (Astro): `/` (`index.astro`), `/login` (nowa), `/register` (nowa), `/settings` (nowa), oraz chronione: `/dashboard`, `/generate`, `/flashcards`, `/study`, `/generations`, `/generations/[id]`.
- Komponenty autentykacji (React): `LoginForm.tsx`, `RegisterForm.tsx`, `SettingsView.tsx`, `ChangePasswordForm.tsx`, `DeleteAccountSection.tsx`.
- Wspólne UI/stan: `Layout.astro`, `DashboardHeader.tsx` (z `onLogout`), `ToasterProvider.tsx`, `ThemeContext`, `useAuth.ts`, komponenty `shadcn/ui`.
- Middleware/Auth: `src/middleware/index.ts` (aktualnie dev-mock; docelowo: redirect + `locals.user`), `src/db/supabase.client.ts`.
- API auth (docelowo): `POST /api/auth/{register,login,logout,change-password}`, `DELETE /api/auth/delete-account`.
- API zasobów (istniejące): `/api/flashcards/*`, `/api/generations/*` – obecnie z `PLACEHOLDER_USER_ID`; docelowo tylko `locals.user.id` + RLS.
- Przepływ danych:
  - Formularze (`LoginForm`, `RegisterForm`) → API Auth → Supabase Auth (JWT w HttpOnly cookies) → Middleware ustawia `locals.user` → redirect do `/generate`/`/dashboard`.
  - `SettingsView` → `ChangePasswordForm`/`DeleteAccountSection` → API Auth → Supabase.
  - Chronione strony i API zasobów wymagają `locals.user` (RLS: `user_id = auth.uid()`).
  - `DashboardHeader` wywołuje logout → API → redirect do `/login`.

</architecture_analysis>

<mermaid_diagram>

```mermaid
flowchart TD

%% Klasy stylów
classDef public fill:#F9F0FF,stroke:#722ED1,stroke-width:1px;
classDef protected fill:#E6F7FF,stroke:#1890ff,stroke-width:1px;
classDef component fill:#FFF7E6,stroke:#FA8C16,stroke-width:1px;
classDef shared fill:#F0F5FF,stroke:#2F54EB,stroke-width:1px;
classDef middleware fill:#F6FFED,stroke:#52C41A,stroke-width:1px;
classDef api fill:#FFF1F0,stroke:#F5222D,stroke-width:1px;
classDef updated fill:#FFFBE6,stroke:#FAAD14,stroke-width:1px;

%% Public pages
subgraph Publiczne strony (Astro)
  Index["/ (index.astro)"]:::public
  Login["/login (login.astro)"]:::public
  Register["/register (register.astro)"]:::public
end

%% Protected pages
subgraph Chronione strony (Astro)
  Dashboard["/dashboard (dashboard.astro)"]:::protected
  Generate["/generate (generate.astro)"]:::protected
  Flashcards["/flashcards (flashcards.astro)"]:::protected
  Study["/study (study.astro)"]:::protected
  Generations["/generations (generations.astro)"]:::protected
  GenerationDetails["/generations/[id]"]:::protected
  Settings["/settings (settings.astro)"]:::protected
end

%% Auth components
subgraph Komponenty autentykacji (React)
  LoginForm["LoginForm.tsx"]:::component
  RegisterForm["RegisterForm.tsx"]:::component
  SettingsView["SettingsView.tsx"]:::component
  ChangePasswordForm["ChangePasswordForm.tsx"]:::component
  DeleteAccount["DeleteAccountSection.tsx"]:::component
end

%% Shared UI & State
subgraph Wspólne UI i stan
  Layout["Layout.astro"]:::shared
  DashboardHeader["DashboardHeader.tsx (Logout)"]:::shared
  Toaster["ToasterProvider.tsx"]:::shared
  UI["Komponenty shadcn/ui"]:::shared
  Theme["ThemeContext"]:::shared
  UseAuth["useAuth.ts"]:::shared
end

%% Middleware & client
subgraph Middleware i Auth
  Middleware["src/middleware/index.ts"]:::middleware
  SupabaseClient["src/db/supabase.client.ts"]:::middleware
end

%% API - Auth
subgraph API — Auth
  ApiRegister["POST /api/auth/register"]:::api
  ApiLogin["POST /api/auth/login"]:::api
  ApiLogout["POST /api/auth/logout"]:::api
  ApiChangePassword["POST /api/auth/change-password"]:::api
  ApiDeleteAccount["DELETE /api/auth/delete-account"]:::api
end

%% API - Resources
subgraph API — Zasoby
  ApiFlashcards["/api/flashcards/*"]:::api
  ApiGenerations["/api/generations/*"]:::api
end

%% Supabase & DB
subgraph Supabase i DB
  SupabaseAuth["Supabase Auth (JWT cookies)"]:::api
  Postgres["PostgreSQL + RLS (user_id = auth.uid())"]:::api
end

%% Layout zależności
Index --> Layout
Login --> Layout
Register --> Layout
Dashboard --> Layout
Generate --> Layout
Flashcards --> Layout
Study --> Layout
Generations --> Layout
GenerationDetails --> Layout
Settings --> Layout

%% Strony -> komponenty
Login --> LoginForm
Register --> RegisterForm
Settings --> SettingsView
SettingsView --> ChangePasswordForm
SettingsView --> DeleteAccount
Dashboard --> DashboardHeader

%% Formularze -> API Auth
LoginForm -- "submit" --> ApiLogin
RegisterForm -- "submit" --> ApiRegister
ChangePasswordForm -- "submit" --> ApiChangePassword
DeleteAccount -- "potwierdź \"DELETE\"" --> ApiDeleteAccount

%% Logout flow
DashboardHeader -.-> ApiLogout
ApiLogout -- "signOut + redirect /login" --> Login

%% API -> Supabase
ApiLogin ==> SupabaseAuth
ApiRegister ==> SupabaseAuth
ApiLogout ==> SupabaseAuth
ApiChangePassword ==> SupabaseAuth
ApiDeleteAccount ==> SupabaseAuth

%% Supabase client & middleware
SupabaseAuth ==> SupabaseClient
SupabaseClient -.-> Middleware

%% Middleware guard dla chronionych stron
Middleware -. "guard + locals.user" .-> Dashboard
Middleware -. "guard + locals.user" .-> Generate
Middleware -. "guard + locals.user" .-> Flashcards
Middleware -. "guard + locals.user" .-> Study
Middleware -. "guard + locals.user" .-> Generations
Middleware -. "guard + locals.user" .-> GenerationDetails
Middleware -. "guard + locals.user" .-> Settings

%% API zasobów -> DB
ApiFlashcards ==> Postgres
ApiGenerations ==> Postgres

%% Middleware udostępnia locals.user do API zasobów
Middleware -. "locals.user.id" .-> ApiFlashcards
Middleware -. "locals.user.id" .-> ApiGenerations

%% Toastery i stan UI
LoginForm -.-> Toaster
RegisterForm -.-> Toaster
ChangePasswordForm -.-> Toaster
DeleteAccount -.-> Toaster
DashboardHeader -.-> Toaster

%% useAuth/Theme zależności UI
UseAuth -.-> DashboardHeader
UseAuth -.-> SettingsView
Theme -.-> DashboardHeader

%% Wyróżnienie elementów wymagających aktualizacji wg spec
class Middleware,DashboardHeader,ApiFlashcards,ApiGenerations updated

```

</mermaid_diagram>



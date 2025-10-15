/**
 * SettingsView - Główny widok ustawień konta
 * 
 * Kontener dla wszystkich ustawień użytkownika (MVP - change password, delete account).
 */

import { ChangePasswordForm } from './ChangePasswordForm';
import { DeleteAccountSection } from './DeleteAccountSection';
import type { UserProfile } from '@/types';

type SettingsViewProps = {
  user: UserProfile;
};

export function SettingsView({ user }: SettingsViewProps) {
  return (
    <div
      className="container mx-auto px-4 py-8 max-w-4xl"
      data-testid="settings-view"
    >
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ustawienia konta</h1>
        <p className="text-muted-foreground">
          Zarządzaj swoim kontem i ustawieniami bezpieczeństwa
        </p>
      </header>

      {/* Account Info */}
      <div className="mb-8 p-4 rounded-lg border bg-card">
        <h2 className="font-semibold mb-2">Informacje o koncie</h2>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p><span className="font-medium text-foreground">Email:</span> {user.email}</p>
          {user.username && (
            <p><span className="font-medium text-foreground">Nazwa użytkownika:</span> {user.username}</p>
          )}
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Change Password */}
        <ChangePasswordForm />

        {/* Delete Account */}
        <DeleteAccountSection />
      </div>
    </div>
  );
}


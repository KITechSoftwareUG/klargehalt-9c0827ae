'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const MFA_REMINDER_KEY = 'mfa_reminder_dismissed_at';
const REMINDER_INTERVAL_MS = 48 * 60 * 60 * 1000; // 48 hours

export function MfaBanner() {
  const { mfaEnabled, isSignedIn, loading, refreshAuth } = useAuth();
  const [visible, setVisible] = useState(false);

  // Recalculate visibility when auth state changes
  useEffect(() => {
    if (loading || !isSignedIn || mfaEnabled) {
      setVisible(false);
      return;
    }

    const dismissedAt = localStorage.getItem(MFA_REMINDER_KEY);

    if (!dismissedAt) {
      setVisible(true);
      return;
    }

    const elapsed = Date.now() - Number(dismissedAt);
    setVisible(elapsed > REMINDER_INTERVAL_MS);
  }, [loading, isSignedIn, mfaEnabled]);

  // When user returns from the Logto account tab, refresh auth to pick up
  // newly enrolled MFA factors. This makes the banner disappear automatically.
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && visible) {
      void refreshAuth();
    }
  }, [visible, refreshAuth]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(MFA_REMINDER_KEY, String(Date.now()));
    setVisible(false);
  };

  const goToMfaSetup = () => {
    // Logto account center — MFA section is enabled with "Edit" permission
    window.open('https://auth.klargehalt.de/account', '_blank', 'noopener');
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm bg-blue-50 border-b border-blue-200 text-blue-700">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 shrink-0" />
        <span>
          Konto absichern — Zwei-Faktor-Authentifizierung aktivieren dauert 30 Sekunden.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100" onClick={goToMfaSetup}>
          Jetzt einrichten
        </Button>
        <button
          onClick={dismiss}
          className="p-1 rounded hover:bg-blue-100 transition-colors"
          aria-label="Banner schließen"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

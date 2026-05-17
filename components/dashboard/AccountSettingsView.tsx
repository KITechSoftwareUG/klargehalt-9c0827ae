'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Mail,
  User,
  Building2,
  Shield,
  Loader2,
  Save,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type AppRole =
  | 'owner'
  | 'admin'
  | 'hr_manager'
  | 'employee'
  | 'lawyer'
  | 'auditor';

const ROLE_LABELS: Record<AppRole, string> = {
  owner: 'Inhaber',
  admin: 'Administrator',
  hr_manager: 'HR-Manager',
  employee: 'Mitarbeiter',
  lawyer: 'Anwalt (extern)',
  auditor: 'Auditor',
};

// Logto account center — same target as MfaBanner. Password + MFA are
// managed by the IdP (Logto); we never implement auth ourselves
// (see .claude/docs/security.md §2 "Keine eigene Auth-Logik").
const LOGTO_ACCOUNT_URL = 'https://auth.klargehalt.de/account';

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * AccountSettingsView — the personal "Mein Konto" area.
 *
 * Phase 2: editable display name (PATCH /api/profiles/me) + read-only
 * identity summary. Email stays owned by the IdP (Logto) and is not
 * editable here. Sicherheit + Benachrichtigungen are added in later
 * phases. Visible to all portal roles — no admin gating here.
 */
export default function AccountSettingsView() {
  const { user, profile, role, organization, loading, mfaEnabled, refreshAuth } =
    useAuth();

  // When the user returns from the Logto account tab (password / MFA),
  // re-pull auth so the MFA status badge updates automatically.
  const handleVisibility = useCallback(() => {
    if (document.visibilityState === 'visible') {
      void refreshAuth();
    }
  }, [refreshAuth]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, [handleVisibility]);

  const currentName = profile?.full_name ?? user?.fullName ?? '';
  const [nameInput, setNameInput] = useState(currentName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNameInput(profile?.full_name ?? user?.fullName ?? '');
  }, [profile?.full_name, user?.fullName]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  const email =
    user?.email ?? user?.primaryEmailAddress?.emailAddress ?? '—';
  const roleLabel = role ? ROLE_LABELS[role as AppRole] ?? role : '—';
  const orgName = organization?.name ?? '—';
  const memberSince = formatDate(profile?.created_at);

  const trimmed = nameInput.trim();
  const dirty = trimmed !== currentName.trim();

  const handleSaveName = async () => {
    if (!trimmed) {
      toast.error('Der Name darf nicht leer sein');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: trimmed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? 'Speichern fehlgeschlagen');
      }
      toast.success('Name aktualisiert');
      await refreshAuth();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Speichern fehlgeschlagen';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Mein Konto</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ihre persönlichen Profil- und Kontodaten.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Profil</CardTitle>
              <CardDescription className="mt-0.5">
                Ihr Anzeigename. Die E-Mail-Adresse wird über Ihr
                Login-Konto verwaltet.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Name</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="full_name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Vor- und Nachname"
                maxLength={120}
                className="max-w-sm"
                disabled={saving}
              />
              {dirty && (
                <Button size="sm" onClick={handleSaveName} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 h-4 w-4" />
                  )}
                  Speichern
                </Button>
              )}
            </div>
          </div>

          <ReadOnlyRow
            icon={<Mail className="h-4 w-4 text-muted-foreground" />}
            label="E-Mail-Adresse"
            value={email}
          />
          <ReadOnlyRow
            icon={<Shield className="h-4 w-4 text-muted-foreground" />}
            label="Rolle"
            value={roleLabel}
          />
          <ReadOnlyRow
            icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
            label="Organisation"
            value={orgName}
          />
          {memberSince && (
            <ReadOnlyRow
              icon={<User className="h-4 w-4 text-muted-foreground" />}
              label="Mitglied seit"
              value={memberSince}
            />
          )}
        </CardContent>
      </Card>

      <SecurityCard mfaEnabled={mfaEnabled} />
    </div>
  );
}

function openLogtoAccount() {
  window.open(LOGTO_ACCOUNT_URL, '_blank', 'noopener,noreferrer');
}

interface SecurityCardProps {
  mfaEnabled: boolean;
}

function SecurityCard({ mfaEnabled }: SecurityCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">Sicherheit</CardTitle>
            <CardDescription className="mt-0.5">
              Passwort und Zwei-Faktor-Authentifizierung werden in Ihrem
              Login-Konto verwaltet.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
          <div className="flex items-center gap-3">
            {mfaEnabled ? (
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                Zwei-Faktor-Authentifizierung
              </p>
              <p className="text-xs text-muted-foreground">
                {mfaEnabled
                  ? 'Aktiv — Ihr Konto ist zusätzlich abgesichert.'
                  : 'Nicht aktiv — empfohlen, um Ihr Konto abzusichern.'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={openLogtoAccount}>
            <ShieldCheck className="mr-1.5 h-4 w-4" />
            {mfaEnabled ? '2FA verwalten' : '2FA einrichten'}
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
          <div className="flex items-center gap-3">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Passwort</p>
              <p className="text-xs text-muted-foreground">
                Passwort im Login-Konto ändern.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={openLogtoAccount}>
            <KeyRound className="mr-1.5 h-4 w-4" />
            Passwort ändern
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReadOnlyRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function ReadOnlyRow({ icon, label, value }: ReadOnlyRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
      <div className="flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

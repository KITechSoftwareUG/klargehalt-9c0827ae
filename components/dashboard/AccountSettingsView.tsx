'use client';

import { Mail, User, Building2, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
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
 * Phase 1: read-only profile summary (email visible, role, org, member-since).
 * Editability (full_name) + Sicherheit + Benachrichtigungen are added in
 * later phases. Visible to all portal roles — no admin gating here.
 */
export default function AccountSettingsView() {
  const { user, profile, role, organization, loading } = useAuth();

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
  const fullName = profile?.full_name ?? user?.fullName ?? null;
  const roleLabel = role ? ROLE_LABELS[role as AppRole] ?? role : '—';
  const orgName = organization?.name ?? '—';
  const memberSince = formatDate(profile?.created_at);

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
                Diese Daten stammen aus Ihrem Login-Konto.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReadOnlyRow
            icon={<User className="h-4 w-4 text-muted-foreground" />}
            label="Name"
            value={fullName ?? 'Nicht hinterlegt'}
          />
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
    </div>
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

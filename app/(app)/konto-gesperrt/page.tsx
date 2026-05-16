'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, RotateCcw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type StatusResponse = {
  status: 'active' | 'deletion_scheduled' | 'anonymized';
  scheduledFor: string | null;
  companyName: string | null;
  canRestore: boolean;
};

const daysUntil = (iso: string | null): number | null => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
};

export default function KontoGesperrtPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatusResponse | null>(null);
  const [denied, setDenied] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/account/status', { cache: 'no-store' });
      if (!res.ok) {
        // 403/anonymized (no active member) — nothing left to manage here.
        setDenied(true);
        return;
      }
      const json = (await res.json()) as StatusResponse;
      if (json.status === 'active') {
        router.replace('/dashboard');
        return;
      }
      setData(json);
    } catch {
      setDenied(true);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await fetch('/api/account/restore', { method: 'POST' });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(json?.error ?? 'Reaktivierung fehlgeschlagen.');
      }
      toast.success('Konto reaktiviert.');
      router.replace('/dashboard');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Fehler.');
      setRestoring(false);
    }
  };

  const signOut = () => window.location.assign('/auth/sign-out');

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Konto gesperrt</CardTitle>
              <CardDescription className="mt-0.5">
                Dieses Konto ist zur Löschung vorgemerkt.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : denied || !data || data.status === 'anonymized' ? (
            <>
              <p className="text-sm text-muted-foreground">
                Dieses Konto wurde gelöscht oder ist nicht mehr zugänglich.
              </p>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="mr-1.5 h-4 w-4" />
                Abmelden
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p>
                  <strong>{data.companyName ?? 'Ihr Unternehmen'}</strong> wird
                  {data.scheduledFor ? (
                    <>
                      {' '}am{' '}
                      <strong>
                        {new Date(data.scheduledFor).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </strong>{' '}
                      ({daysUntil(data.scheduledFor)} Tage)
                    </>
                  ) : null}{' '}
                  endgültig gelöscht. Bis dahin ist eine Reaktivierung möglich.
                </p>
              </div>

              {data.canRestore ? (
                <Button size="sm" onClick={handleRestore} disabled={restoring}>
                  {restoring ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                  )}
                  Konto reaktivieren
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nur der Konto-Inhaber kann die Löschung rückgängig machen.
                  Bitte kontaktieren Sie ihn.
                </p>
              )}

              <button
                onClick={signOut}
                className="block text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Abmelden
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

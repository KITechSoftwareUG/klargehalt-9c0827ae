'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * Headless guard: once auth is loaded, asks /api/account/status and routes a
 * locked tenant to /konto-gesperrt. The real enforcement is the server-side
 * api-guard (every data route 403s); this just gives a coherent UX instead of
 * a wall of failed requests. One lightweight GET per portal mount.
 */
export function AccountDeletionRedirect() {
  const { isSignedIn, orgId, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !isSignedIn || !orgId) return;
    if (pathname?.startsWith('/konto-gesperrt')) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/account/status', { cache: 'no-store' });
        if (!res.ok) return; // anonymized → guard 403s elsewhere; not our job
        const data = (await res.json()) as { status?: string };
        if (!cancelled && data.status && data.status !== 'active') {
          router.replace('/konto-gesperrt');
        }
      } catch {
        // Network hiccup — the server guard still enforces; ignore.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, isSignedIn, orgId, pathname, router]);

  return null;
}

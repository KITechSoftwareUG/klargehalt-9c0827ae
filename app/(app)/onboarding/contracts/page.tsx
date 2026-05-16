'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface RequiredDocument {
  key: string;
  label: string;
  href: string;
}

function ContractsInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<RequiredDocument[]>([]);
  const [acceptedAgbDse, setAcceptedAgbDse] = useState(false);
  const [acceptedAvv, setAcceptedAvv] = useState(false);

  const next = params.get('next') || '/dashboard';
  const checkoutTier = params.get('checkout');
  const checkoutInterval = params.get('interval') || 'monthly';

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/onboarding/contracts/required');
        const data = await res.json();
        if (!active) return;
        if (res.ok && data.required === false) {
          router.replace(next);
          return;
        }
        if (res.ok && Array.isArray(data.documents)) {
          setDocuments(data.documents);
        }
      } catch {
        // fall through to render the form; submit will surface errors
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (!acceptedAgbDse || !acceptedAvv || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding/contracts/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptedAgbDse: true, acceptedAvv: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Speichern fehlgeschlagen. Bitte erneut versuchen.');
        setSubmitting(false);
        return;
      }

      if (checkoutTier) {
        const co = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: checkoutTier, interval: checkoutInterval }),
        });
        const coData = await co.json().catch(() => ({}));
        if (co.ok && coData.url) {
          window.location.href = coData.url;
          return;
        }
        toast.error(coData.error || 'Checkout konnte nicht gestartet werden.');
      }
      router.replace(next);
    } catch {
      toast.error('Verbindungsfehler — bitte versuchen Sie es erneut.');
      setSubmitting(false);
    }
  }

  const agbDoc = documents.find((d) => d.key === 'agb');
  const dseDoc = documents.find((d) => d.key === 'datenschutz');
  const avvDoc = documents.find((d) => d.key === 'avv');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Vertragsbedingungen</h1>
        <p className="mt-2 text-sm text-slate-600">
          Bitte bestätigen Sie die folgenden Bedingungen, bevor Sie ein kostenpflichtiges
          Abonnement abschließen.
        </p>

        {loading ? (
          <div className="mt-8 space-y-3">
            <div className="h-12 animate-pulse rounded-md bg-slate-100" />
            <div className="h-12 animate-pulse rounded-md bg-slate-100" />
            <div className="h-10 animate-pulse rounded-md bg-slate-100" />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-slate-900"
                checked={acceptedAgbDse}
                onChange={(e) => setAcceptedAgbDse(e.target.checked)}
              />
              <span className="text-slate-700">
                Ich habe die{' '}
                <a
                  href={agbDoc?.href || 'https://klargehalt.de/agb'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-slate-900 underline"
                >
                  AGB
                </a>{' '}
                und die{' '}
                <a
                  href={dseDoc?.href || 'https://klargehalt.de/datenschutz'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-slate-900 underline"
                >
                  Datenschutzerklärung
                </a>{' '}
                gelesen und akzeptiere sie.
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-slate-900"
                checked={acceptedAvv}
                onChange={(e) => setAcceptedAvv(e.target.checked)}
              />
              <span className="text-slate-700">
                Ich schließe den{' '}
                <a
                  href={avvDoc?.href || 'https://klargehalt.de/datenschutz'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-slate-900 underline"
                >
                  Auftragsverarbeitungsvertrag (AVV)
                </a>{' '}
                gemäß Art. 28 DSGVO ab.
              </span>
            </label>

            <Button
              className="w-full"
              disabled={!acceptedAgbDse || !acceptedAvv || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Wird gespeichert…' : 'Akzeptieren und fortfahren'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContractsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <ContractsInner />
    </Suspense>
  );
}

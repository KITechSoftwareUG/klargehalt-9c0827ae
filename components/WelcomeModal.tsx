'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';

const STORAGE_KEY = 'kg_welcome_v1';

export function WelcomeModal(): JSX.Element | null {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen === '1') return;
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(true);
  }, []);

  function handleBookConsulting() {
    setOpen(false);
    router.push('/book-consulting');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Schließen</span>
        </DialogClose>

        <div className="space-y-6 py-2">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Willkommen bei KlarGehalt</h2>
              <p className="text-sm text-slate-500">Ihre 14-tägige Testphase hat begonnen</p>
            </div>
          </div>

          {/* Value statement */}
          <p className="text-sm text-slate-700 leading-relaxed">
            KlarGehalt dokumentiert Ihre Gehaltsstruktur so, dass Sie bei einer behördlichen
            Prüfung oder Klage belegen können: Jede Entscheidung war sachlich begründet.
          </p>

          {/* Steps */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">So gehen Sie vor</p>
            {[
              'Abteilungen anlegen',
              'Karrierestufen definieren',
              'Job-Profile erstellen',
              'Gehaltsbänder hinterlegen',
              'Mitarbeiter importieren',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 flex-shrink-0">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
            <p className="text-xs text-slate-500 pt-1">
              Danach steht Ihre erste Compliance-Analyse bereit — in ca. 20 Minuten.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button className="flex-1" onClick={() => setOpen(false)}>
              Einrichtung starten
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleBookConsulting}>
              Kostenloses Gespräch buchen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

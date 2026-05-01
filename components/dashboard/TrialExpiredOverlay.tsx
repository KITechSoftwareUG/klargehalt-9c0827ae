'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function TrialExpiredOverlay() {
    const [loading, setLoading] = useState(false);

    const startCheckout = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: 'professional', interval: 'monthly' }),
            });
            const data = await res.json() as { url?: string; error?: string };
            if (!res.ok) {
                toast.error(data.error || 'Checkout konnte nicht gestartet werden');
                return;
            }
            if (data.url) window.location.href = data.url;
        } catch {
            toast.error('Verbindungsfehler — bitte versuchen Sie es erneut');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Testphase abgelaufen</h2>
                <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                    Ihre 14-tägige kostenlose Testphase ist beendet. Um weiterhin alle Funktionen
                    nutzen zu können, wählen Sie jetzt einen Plan.
                </p>
                <Button onClick={startCheckout} disabled={loading} className="w-full mb-3" size="lg">
                    {loading ? 'Wird weitergeleitet...' : 'Jetzt upgraden — ab €299/Monat'}
                </Button>
                <p className="text-xs text-slate-400">
                    Ihre Daten bleiben 30 Tage nach Ablauf erhalten.
                </p>
            </div>
        </div>
    );
}

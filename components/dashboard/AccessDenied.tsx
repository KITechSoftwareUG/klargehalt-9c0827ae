'use client';

import { Shield } from 'lucide-react';

export default function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <Shield className="h-16 w-16 text-slate-200 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700">Kein Zugriff</h2>
            <p className="text-slate-400 mt-2 text-sm">Sie haben keine Berechtigung für diesen Bereich.</p>
        </div>
    );
}

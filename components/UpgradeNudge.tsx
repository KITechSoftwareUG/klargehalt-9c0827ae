'use client';

import { X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpgradeNudgeProps {
  message: string;
  onDismiss: () => void;
}

export function UpgradeNudge({ message, onDismiss }: UpgradeNudgeProps) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
      <span className="text-foreground/80">{message}</span>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => router.push('/dashboard/billing')}
          className="font-medium text-primary hover:underline flex items-center gap-1"
        >
          Plan wählen
          <ArrowRight className="w-3 h-3" />
        </button>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

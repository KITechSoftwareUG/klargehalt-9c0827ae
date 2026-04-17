'use client';

import { useLawyerReviewsByScope, VERDICT_LABELS, VERDICT_COLORS } from '@/hooks/useLawyerReviews';
import type { ReviewScopeType, ReviewVerdict } from '@/hooks/useLawyerReviews';
import { Scale } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LawyerReviewBadgeProps {
  scopeType: ReviewScopeType;
  scopeId?: string;
  /** Compact mode shows only icon + date */
  compact?: boolean;
}

const VERDICT_ICON_COLORS: Record<ReviewVerdict, string> = {
  approved: 'text-emerald-600',
  needs_remediation: 'text-amber-600',
  compliant_with_notes: 'text-blue-600',
  rejected: 'text-red-600',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function LawyerReviewBadge({ scopeType, scopeId, compact = false }: LawyerReviewBadgeProps) {
  const { reviews, loading } = useLawyerReviewsByScope(scopeType, scopeId);

  if (loading || reviews.length === 0) return null;

  // Show the most recent review
  const latest = reviews[0];
  const verdictColor = VERDICT_COLORS[latest.verdict];
  const iconColor = VERDICT_ICON_COLORS[latest.verdict];

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${iconColor}`}>
              <Scale className="h-3 w-3" />
              {formatDate(latest.signed_at)}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {VERDICT_LABELS[latest.verdict]} — {latest.reviewed_by_name}, {formatDate(latest.signed_at)}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${verdictColor}`}
          >
            <Scale className="h-3 w-3" />
            Anwaltlich geprüft
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-xs">
              {VERDICT_LABELS[latest.verdict]}
            </p>
            <p className="text-xs text-muted-foreground">
              Geprüft von {latest.reviewed_by_name}, am {formatDate(latest.signed_at)}
            </p>
            {latest.notes && (
              <p className="text-xs text-muted-foreground mt-1">{latest.notes}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

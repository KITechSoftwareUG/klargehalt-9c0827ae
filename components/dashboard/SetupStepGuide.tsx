import { type LucideIcon } from 'lucide-react';

interface SetupStepGuideProps {
  icon: LucideIcon;
  title: string;
  complianceNote: string;
  stepNumber: number;
  totalSteps: number;
}

export function SetupStepGuide({ icon: Icon, title, complianceNote, stepNumber, totalSteps }: SetupStepGuideProps): JSX.Element {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 mb-6">
      <div className="flex items-start gap-4">
        <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Schritt {stepNumber} von {totalSteps}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-800 mb-1">{title}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{complianceNote}</p>
        </div>
      </div>
    </div>
  );
}

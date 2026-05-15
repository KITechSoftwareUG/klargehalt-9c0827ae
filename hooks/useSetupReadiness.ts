'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type SetupStepId =
  | 'departments'
  | 'levels'
  | 'profiles'
  | 'bands'
  | 'employees'
  | 'decisions';

export type SetupPhaseId = 'structure' | 'compensation' | 'people' | 'documentation' | 'analysis';

export interface SetupStep {
  id: SetupStepId;
  label: string;
  description: string;
  href: string;
  count: number;
  required: number;
  done: boolean;
  complianceReason: string;
}

export interface SetupPhase {
  id: SetupPhaseId;
  number: number;
  title: string;
  subtitle: string;
  intent: string;
  stepIds: SetupStepId[];
  steps: SetupStep[];
  done: boolean;
  startable: boolean;
  /** 0..100 — percentage of inner steps done */
  percentage: number;
}

export interface SetupReadiness {
  steps: SetupStep[];
  phases: SetupPhase[];
  completedCount: number;
  /** All 5 of the original core steps satisfied → analyses unlocked */
  isAnalysisReady: boolean;
  /** ≥3 of 5 core steps done — original "minimally usable" signal */
  isMinimallyUsable: boolean;
  /** 0..100 across the 5 core steps (kept for backward compat with banner/assistant) */
  percentage: number;
  /** 0..100 across **all** steps incl. decisions — used for hub progress */
  overallPercentage: number;
  isLoading: boolean;
}

type StepConfig = Omit<SetupStep, 'count' | 'done'>;

const STEP_CONFIG: StepConfig[] = [
  {
    id: 'departments',
    label: 'Abteilungen',
    description: 'Unternehmensstruktur definieren',
    href: '/abteilungen',
    required: 1,
    complianceReason:
      'Vergleichsgruppen nach Art. 9 EU-Entgelttransparenzrichtlinie erfordern eine klare Unternehmensstruktur.',
  },
  {
    id: 'levels',
    label: 'Karrierestufen',
    description: 'Laufbahngruppen festlegen',
    href: '/karrierestufen',
    required: 1,
    complianceReason:
      'Karrierestufen sind Pflicht für die Entgeltbewertung nach Art. 10 der Richtlinie.',
  },
  {
    id: 'profiles',
    label: 'Job-Profile',
    description: 'Tätigkeitsprofile anlegen',
    href: '/jobprofile',
    required: 1,
    complianceReason:
      'Job-Profile definieren die Grundlage für gleiche und gleichwertige Arbeit nach Art. 4.',
  },
  {
    id: 'bands',
    label: 'Gehaltsbänder',
    description: 'Entgeltstruktur hinterlegen',
    href: '/gehaltsbaender',
    required: 1,
    complianceReason:
      'Gehaltsbänder dokumentieren die Entgeltstruktur nach Art. 5 — Pflicht ab 100 Mitarbeitern.',
  },
  {
    id: 'employees',
    label: 'Mitarbeiter',
    description: 'Mitarbeiterdaten erfassen',
    href: '/mitarbeiter',
    required: 3,
    complianceReason:
      'Mindestens 3 Mitarbeiter ermöglichen eine aussagekräftige Gap-Analyse nach Art. 9.',
  },
  {
    id: 'decisions',
    label: 'Gehaltsentscheidungen',
    description: 'Begründungen dokumentieren',
    href: '/mitarbeiter',
    required: 1,
    complianceReason:
      'Jede Gehaltsentscheidung mit Begründung ist die Grundlage für die Beweislastumkehr nach Art. 18 — das Produkt-Herzstück.',
  },
];

/** The 5 original core steps that gate analysis unlock. */
const CORE_STEP_IDS: ReadonlySet<SetupStepId> = new Set<SetupStepId>([
  'departments',
  'levels',
  'profiles',
  'bands',
  'employees',
]);

interface PhaseConfig {
  id: SetupPhaseId;
  number: number;
  title: string;
  subtitle: string;
  intent: string;
  stepIds: SetupStepId[];
}

const PHASE_CONFIG: PhaseConfig[] = [
  {
    id: 'structure',
    number: 1,
    title: 'Struktur',
    subtitle: 'Wie ist deine Firma aufgebaut?',
    intent:
      'Definiere zuerst die Abteilungen und Karrierestufen — die Vergleichsgruppen, auf denen alles aufbaut.',
    stepIds: ['departments', 'levels'],
  },
  {
    id: 'compensation',
    number: 2,
    title: 'Vergütung',
    subtitle: 'Welches Geld für welche Rolle?',
    intent:
      'Lege Tätigkeitsprofile und die zugehörigen Gehaltsbänder an. Pro Rolle ein Band — das macht Vergleichbarkeit möglich.',
    stepIds: ['profiles', 'bands'],
  },
  {
    id: 'people',
    number: 3,
    title: 'Mitarbeiter',
    subtitle: 'Wer arbeitet hier?',
    intent:
      'Erfasse deine Mitarbeitenden mit Gehalt, Profil und Abteilung — die Datenbasis für jede Gap-Analyse.',
    stepIds: ['employees'],
  },
  {
    id: 'documentation',
    number: 4,
    title: 'Entscheidungen dokumentieren',
    subtitle: 'Warum verdient wer was?',
    intent:
      'Halte für jede Einstellung, Gehaltserhöhung oder Beförderung die Begründung fest — das ist dein Schutz bei der Beweislastumkehr.',
    stepIds: ['decisions'],
  },
  {
    id: 'analysis',
    number: 5,
    title: 'Analyse freigeschaltet',
    subtitle: 'Wo bin ich angreifbar?',
    intent:
      'Sobald die ersten drei Phasen stehen, schaltet sich die Pay-Gap-Analyse frei — dein Compliance-Status auf einen Blick.',
    stepIds: [],
  },
];

const LOADING_STATE: SetupReadiness = {
  steps: [],
  phases: [],
  completedCount: 0,
  isAnalysisReady: false,
  isMinimallyUsable: false,
  percentage: 0,
  overallPercentage: 0,
  isLoading: true,
};

interface SetupCountsResponse {
  departments?: number;
  levels?: number;
  profiles?: number;
  bands?: number;
  employees?: number;
  salaryDecisions?: number;
}

function buildPhases(steps: SetupStep[], analysisReady: boolean): SetupPhase[] {
  const byId = new Map(steps.map((s) => [s.id, s]));
  return PHASE_CONFIG.map((cfg) => {
    if (cfg.id === 'analysis') {
      return {
        id: cfg.id,
        number: cfg.number,
        title: cfg.title,
        subtitle: cfg.subtitle,
        intent: cfg.intent,
        stepIds: cfg.stepIds,
        steps: [],
        done: analysisReady,
        startable: analysisReady,
        percentage: analysisReady ? 100 : 0,
      };
    }
    const phaseSteps = cfg.stepIds
      .map((id) => byId.get(id))
      .filter((s): s is SetupStep => s !== undefined);
    const doneCount = phaseSteps.filter((s) => s.done).length;
    const total = phaseSteps.length || 1;
    const percentage = Math.round((doneCount / total) * 100);
    return {
      id: cfg.id,
      number: cfg.number,
      title: cfg.title,
      subtitle: cfg.subtitle,
      intent: cfg.intent,
      stepIds: cfg.stepIds,
      steps: phaseSteps,
      done: doneCount === phaseSteps.length,
      startable: true,
      percentage,
    };
  });
}

export function useSetupReadiness(): SetupReadiness {
  const { orgId, loading: authLoading } = useAuth();
  const [readiness, setReadiness] = useState<SetupReadiness>(LOADING_STATE);

  const fetchCounts = useCallback(async () => {
    if (authLoading || orgId === null) {
      setReadiness(LOADING_STATE);
      return;
    }

    setReadiness((prev) => ({ ...prev, isLoading: true }));

    try {
      const res = await fetch('/api/setup-readiness');
      if (!res.ok) throw new Error('Failed to fetch setup readiness');
      const counts = (await res.json()) as SetupCountsResponse;

      const countMap: Record<SetupStepId, number> = {
        departments: counts.departments ?? 0,
        levels: counts.levels ?? 0,
        profiles: counts.profiles ?? 0,
        bands: counts.bands ?? 0,
        employees: counts.employees ?? 0,
        decisions: counts.salaryDecisions ?? 0,
      };

      const steps: SetupStep[] = STEP_CONFIG.map((config) => {
        const count = countMap[config.id];
        return {
          ...config,
          count,
          done: count >= config.required,
        };
      });

      const coreSteps = steps.filter((s) => CORE_STEP_IDS.has(s.id));
      const completedCount = coreSteps.filter((s) => s.done).length;
      const isAnalysisReady = completedCount === 5;
      const isMinimallyUsable = completedCount >= 3;
      const percentage = Math.round((completedCount / 5) * 100);
      const overallDone = steps.filter((s) => s.done).length;
      const overallPercentage = Math.round((overallDone / steps.length) * 100);
      const phases = buildPhases(steps, isAnalysisReady);

      setReadiness({
        steps,
        phases,
        completedCount,
        isAnalysisReady,
        isMinimallyUsable,
        percentage,
        overallPercentage,
        isLoading: false,
      });
    } catch {
      const steps: SetupStep[] = STEP_CONFIG.map((config) => ({
        ...config,
        count: 0,
        done: false,
      }));
      const phases = buildPhases(steps, false);

      setReadiness({
        steps,
        phases,
        completedCount: 0,
        isAnalysisReady: false,
        isMinimallyUsable: false,
        percentage: 0,
        overallPercentage: 0,
        isLoading: false,
      });
    }
  }, [orgId, authLoading]);

  useEffect(() => {
    void fetchCounts();
  }, [fetchCounts]);

  return readiness;
}

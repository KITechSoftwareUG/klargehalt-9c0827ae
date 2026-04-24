'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type SetupStepId = 'departments' | 'levels' | 'profiles' | 'bands' | 'employees';

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

export interface SetupReadiness {
  steps: SetupStep[];
  completedCount: number;
  isAnalysisReady: boolean;
  isMinimallyUsable: boolean;
  percentage: number;
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
];

const LOADING_STATE: SetupReadiness = {
  steps: [],
  completedCount: 0,
  isAnalysisReady: false,
  isMinimallyUsable: false,
  percentage: 0,
  isLoading: true,
};

export function useSetupReadiness(): SetupReadiness {
  const { supabase, orgId, loading: authLoading } = useAuth();
  const [readiness, setReadiness] = useState<SetupReadiness>(LOADING_STATE);

  const fetchCounts = useCallback(async () => {
    if (authLoading || orgId === null) {
      setReadiness(LOADING_STATE);
      return;
    }

    setReadiness((prev) => ({ ...prev, isLoading: true }));

    try {
      const [deptResult, levelsResult, profilesResult, bandsResult, employeesResult] =
        await Promise.all([
          supabase.from('departments').select('id', { count: 'exact', head: true }),
          supabase.from('job_levels').select('id', { count: 'exact', head: true }),
          supabase.from('job_profiles').select('id', { count: 'exact', head: true }),
          supabase.from('pay_bands').select('id', { count: 'exact', head: true }),
          supabase.from('employees').select('id', { count: 'exact', head: true }),
        ]);

      const counts: Record<SetupStepId, number> = {
        departments: deptResult.count ?? 0,
        levels: levelsResult.count ?? 0,
        profiles: profilesResult.count ?? 0,
        bands: bandsResult.count ?? 0,
        employees: employeesResult.count ?? 0,
      };

      const steps: SetupStep[] = STEP_CONFIG.map((config) => {
        const count = counts[config.id];
        return {
          ...config,
          count,
          done: count >= config.required,
        };
      });

      const completedCount = steps.filter((s) => s.done).length;
      const isAnalysisReady = completedCount === 5;
      const isMinimallyUsable = completedCount >= 3;
      const percentage = Math.round((completedCount / 5) * 100);

      setReadiness({
        steps,
        completedCount,
        isAnalysisReady,
        isMinimallyUsable,
        percentage,
        isLoading: false,
      });
    } catch {
      // On error, build steps with all zeros so the UI still renders
      const steps: SetupStep[] = STEP_CONFIG.map((config) => ({
        ...config,
        count: 0,
        done: false,
      }));

      setReadiness({
        steps,
        completedCount: 0,
        isAnalysisReady: false,
        isMinimallyUsable: false,
        percentage: 0,
        isLoading: false,
      });
    }
  }, [supabase, orgId, authLoading]);

  useEffect(() => {
    void fetchCounts();
  }, [fetchCounts]);

  return readiness;
}

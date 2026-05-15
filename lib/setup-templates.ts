export interface TemplateJobLevel {
  name: string;
  rank: number;
}

export interface TemplateDepartment {
  name: string;
}

export interface SetupTemplate {
  id: string;
  label: string;
  description: string;
  departments: TemplateDepartment[];
  jobLevels: TemplateJobLevel[];
}

export const SETUP_TEMPLATES = {
  'tech-startup': {
    id: 'tech-startup',
    label: 'Tech-Startup (1–50 MA)',
    description:
      'Klassische Tech-Firmen-Struktur mit funktionalen Abteilungen und 5-stufiger Karriere-Leiter.',
    departments: [
      { name: 'Engineering' },
      { name: 'Sales' },
      { name: 'Product' },
      { name: 'HR' },
    ],
    jobLevels: [
      { name: 'L1 Junior', rank: 1 },
      { name: 'L2 Professional', rank: 2 },
      { name: 'L3 Senior', rank: 3 },
      { name: 'L4 Lead', rank: 4 },
      { name: 'L5 Principal', rank: 5 },
    ],
  },
} as const satisfies Record<string, SetupTemplate>;

export type SetupTemplateId = keyof typeof SETUP_TEMPLATES;

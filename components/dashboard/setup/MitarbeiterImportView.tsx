'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Users,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRoleAccess } from '@/components/RoleGuard';
import AccessDenied from '@/components/dashboard/AccessDenied';
import { useDepartments } from '@/hooks/useDepartments';
import { useJobLevels } from '@/hooks/useJobLevels';
import { useJobProfiles } from '@/hooks/useJobProfiles';
import { useEmployees } from '@/hooks/useEmployees';
import { useSubscription } from '@/hooks/useSubscription';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

// Ordered list of fields to show in mapping step
const EMPLOYEE_FIELDS: Array<{
  key: string;
  label: string;
  required: boolean;
  description: string;
  synonyms: string[];
}> = [
  {
    key: 'first_name',
    label: 'Vorname',
    required: true,
    description: 'Pflichtfeld',
    synonyms: ['vorname', 'first name', 'firstname', 'given name'],
  },
  {
    key: 'last_name',
    label: 'Nachname',
    required: true,
    description: 'Pflichtfeld',
    synonyms: ['nachname', 'name', 'last name', 'lastname', 'surname', 'family name'],
  },
  {
    key: 'gender',
    label: 'Geschlecht',
    required: true,
    description: 'Pflichtfeld · male/female/diverse/not_specified',
    synonyms: ['geschlecht', 'gender', 'sex'],
  },
  {
    key: 'employment_type',
    label: 'Anstellungsart',
    required: true,
    description: 'Pflichtfeld · full_time/part_time/contract',
    synonyms: ['arbeitsverhältnis', 'anstellungsart', 'employment type', 'vertragsart'],
  },
  {
    key: 'hire_date',
    label: 'Einstellungsdatum',
    required: true,
    description: 'Pflichtfeld · DD.MM.YYYY oder YYYY-MM-DD',
    synonyms: ['einstellungsdatum', 'eintrittsdatum', 'hire date', 'start date', 'beginn'],
  },
  {
    key: 'base_salary',
    label: 'Grundgehalt',
    required: true,
    description: 'Pflichtfeld · Jahresbrutto in €',
    synonyms: ['gehalt', 'grundgehalt', 'bruttogehalt', 'base salary', 'salary', 'jahresgehalt'],
  },
  {
    key: 'email',
    label: 'E-Mail',
    required: false,
    description: 'Optional',
    synonyms: ['email', 'e-mail', 'mail', 'e_mail'],
  },
  {
    key: 'department_name',
    label: 'Abteilung',
    required: false,
    description: 'Optional · Name der Abteilung',
    synonyms: ['abteilung', 'department', 'dept', 'team'],
  },
  {
    key: 'job_profile_title',
    label: 'Job-Profil',
    required: false,
    description: 'Optional · Titel des Job-Profils',
    synonyms: ['position', 'rolle', 'job', 'stelle', 'jobprofil', 'job profile', 'title'],
  },
  {
    key: 'job_level_name',
    label: 'Karrierestufe',
    required: false,
    description: 'Optional · Name der Karrierestufe',
    synonyms: ['level', 'karrierestufe', 'stufe', 'rang', 'grade', 'seniorität'],
  },
  {
    key: 'employee_number',
    label: 'Mitarbeiternummer',
    required: false,
    description: 'Optional',
    synonyms: ['mitarbeiternummer', 'personalnummer', 'employee number', 'id'],
  },
  {
    key: 'birth_year',
    label: 'Geburtsjahr',
    required: false,
    description: 'Optional · z.B. 1985',
    synonyms: ['geburtsjahr', 'birth year', 'jahrgang', 'yob'],
  },
  {
    key: 'variable_pay',
    label: 'Variabler Anteil',
    required: false,
    description: 'Optional · Bonus in €',
    synonyms: ['bonus', 'variable', 'variable pay'],
  },
  {
    key: 'weekly_hours',
    label: 'Wochenstunden',
    required: false,
    description: 'Optional',
    synonyms: ['stunden', 'wochenstunden', 'weekly hours', 'hours'],
  },
  {
    key: 'location',
    label: 'Standort',
    required: false,
    description: 'Optional',
    synonyms: ['standort', 'location', 'office', 'ort'],
  },
];

// ─── Value normalizers ────────────────────────────────────────────────────────

function normalizeGender(v: string): string | null {
  const x = v.trim().toLowerCase();
  if (['m', 'male', 'mann', 'männlich', 'maennlich'].includes(x)) return 'male';
  if (['f', 'w', 'female', 'frau', 'weiblich'].includes(x)) return 'female';
  if (['d', 'diverse', 'divers'].includes(x)) return 'diverse';
  if (['', '-', 'k.a.', 'keine angabe', 'not_specified'].includes(x)) return 'not_specified';
  return null;
}

function normalizeEmploymentType(v: string): string | null {
  const x = v.trim().toLowerCase();
  if (['vollzeit', 'full', 'full_time', 'full-time', 'ft'].includes(x)) return 'full_time';
  if (['teilzeit', 'part', 'part_time', 'part-time', 'pt'].includes(x)) return 'part_time';
  if (
    ['werkvertrag', 'freier mitarbeiter', 'contract', 'freelance', 'freelancer'].includes(x)
  )
    return 'contract';
  return null;
}

function normalizeHireDate(v: string): string | null {
  const trimmed = v.trim();
  // DD.MM.YYYY
  const ddmmyyyy = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    if (!isNaN(Date.parse(iso))) return iso;
  }
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) && !isNaN(Date.parse(trimmed))) return trimmed;
  return null;
}

function normalizeSalary(v: string): number | null {
  // Strip currency symbols, spaces, "EUR"
  let s = v.trim().replace(/[€$£\sCHFEUR]/g, '');
  // de-DE format: "50.000" or "50.000,00" — dots are thousands separators, comma is decimal
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    // en-US format: "50,000" or "50,000.00"
    s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  if (isNaN(n) || n < 0) return null;
  return n;
}

function normalizeBirthYear(v: string): number | null {
  const n = parseInt(v.trim(), 10);
  if (isNaN(n)) return null;
  const currentYear = new Date().getFullYear();
  if (n < 1900 || n > currentYear - 14) return null;
  return n;
}

function normalizeNumber(v: string): number | null {
  const n = parseFloat(v.trim().replace(',', '.'));
  if (isNaN(n) || n < 0) return null;
  return n;
}

// ─── Fuzzy header auto-detect ─────────────────────────────────────────────────

function autoDetectMapping(csvHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of EMPLOYEE_FIELDS) {
    const match = csvHeaders.find((h) =>
      field.synonyms.includes(
        h
          .trim()
          .toLowerCase()
          .replace(/ä/g, 'a')
          .replace(/ö/g, 'o')
          .replace(/ü/g, 'u')
          .replace(/ß/g, 'ss')
      )
    );
    // Also try direct trimmed lowercase without umlaut normalization
    const directMatch =
      match ??
      csvHeaders.find((h) => field.synonyms.includes(h.trim().toLowerCase()));
    if (directMatch) {
      mapping[field.key] = directMatch;
    }
  }
  return mapping;
}

// ─── Row validation ───────────────────────────────────────────────────────────

interface RowError {
  field: string;
  message: string;
}

interface ParsedRow {
  index: number; // 1-based (data row number)
  raw: Record<string, string>;
  errors: RowError[];
  // Normalized values (populated only if no critical error)
  first_name?: string;
  last_name?: string;
  gender?: string;
  employment_type?: string;
  hire_date?: string;
  base_salary?: number;
  email?: string;
  department_name?: string;
  job_profile_title?: string;
  job_level_name?: string;
  employee_number?: string;
  birth_year?: number;
  variable_pay?: number;
  weekly_hours?: number;
  location?: string;
}

function validateAndNormalizeRows(
  rawRows: Record<string, string>[],
  mapping: Record<string, string>
): ParsedRow[] {
  return rawRows.map((raw, idx) => {
    const errors: RowError[] = [];
    const result: ParsedRow = { index: idx + 1, raw, errors };

    function getCell(fieldKey: string): string {
      const header = mapping[fieldKey];
      if (!header) return '';
      return (raw[header] ?? '').trim();
    }

    // first_name
    const firstName = getCell('first_name');
    if (!firstName) {
      errors.push({ field: 'Vorname', message: 'Pflichtfeld fehlt' });
    } else {
      result.first_name = firstName;
    }

    // last_name
    const lastName = getCell('last_name');
    if (!lastName) {
      errors.push({ field: 'Nachname', message: 'Pflichtfeld fehlt' });
    } else {
      result.last_name = lastName;
    }

    // gender
    const genderRaw = getCell('gender');
    if (!mapping['gender'] || !genderRaw) {
      errors.push({ field: 'Geschlecht', message: 'Pflichtfeld fehlt' });
    } else {
      const g = normalizeGender(genderRaw);
      if (!g) {
        errors.push({ field: 'Geschlecht', message: `Unbekannter Wert: "${genderRaw}"` });
      } else {
        result.gender = g;
      }
    }

    // employment_type
    const etRaw = getCell('employment_type');
    if (!mapping['employment_type'] || !etRaw) {
      errors.push({ field: 'Anstellungsart', message: 'Pflichtfeld fehlt' });
    } else {
      const et = normalizeEmploymentType(etRaw);
      if (!et) {
        errors.push({ field: 'Anstellungsart', message: `Unbekannter Wert: "${etRaw}"` });
      } else {
        result.employment_type = et;
      }
    }

    // hire_date
    const hdRaw = getCell('hire_date');
    if (!mapping['hire_date'] || !hdRaw) {
      errors.push({ field: 'Einstellungsdatum', message: 'Pflichtfeld fehlt' });
    } else {
      const hd = normalizeHireDate(hdRaw);
      if (!hd) {
        errors.push({
          field: 'Einstellungsdatum',
          message: `Format nicht erkannt: "${hdRaw}" (erwartet DD.MM.YYYY oder YYYY-MM-DD)`,
        });
      } else {
        result.hire_date = hd;
      }
    }

    // base_salary
    const salaryRaw = getCell('base_salary');
    if (!mapping['base_salary'] || !salaryRaw) {
      errors.push({ field: 'Grundgehalt', message: 'Pflichtfeld fehlt' });
    } else {
      const s = normalizeSalary(salaryRaw);
      if (s === null) {
        errors.push({ field: 'Grundgehalt', message: `Ungültiger Wert: "${salaryRaw}"` });
      } else {
        result.base_salary = s;
      }
    }

    // Optional fields
    const emailRaw = getCell('email');
    if (emailRaw) result.email = emailRaw;

    const deptName = getCell('department_name');
    if (deptName) result.department_name = deptName;

    const profileTitle = getCell('job_profile_title');
    if (profileTitle) result.job_profile_title = profileTitle;

    const levelName = getCell('job_level_name');
    if (levelName) result.job_level_name = levelName;

    const empNum = getCell('employee_number');
    if (empNum) result.employee_number = empNum;

    const byRaw = getCell('birth_year');
    if (byRaw) {
      const by = normalizeBirthYear(byRaw);
      if (by === null) {
        errors.push({ field: 'Geburtsjahr', message: `Ungültiger Wert: "${byRaw}"` });
      } else {
        result.birth_year = by;
      }
    }

    const vpRaw = getCell('variable_pay');
    if (vpRaw) {
      const vp = normalizeNumber(vpRaw);
      if (vp === null) {
        errors.push({ field: 'Variabler Anteil', message: `Ungültiger Wert: "${vpRaw}"` });
      } else {
        result.variable_pay = vp;
      }
    }

    const whRaw = getCell('weekly_hours');
    if (whRaw) {
      const wh = normalizeNumber(whRaw);
      if (wh === null) {
        errors.push({ field: 'Wochenstunden', message: `Ungültiger Wert: "${whRaw}"` });
      } else {
        result.weekly_hours = wh;
      }
    }

    const loc = getCell('location');
    if (loc) result.location = loc;

    return result;
  });
}

// ─── Template CSV generator ───────────────────────────────────────────────────

function downloadTemplateCsv(): void {
  const headers = [
    'Vorname',
    'Nachname',
    'Geschlecht',
    'Anstellungsart',
    'Einstellungsdatum',
    'Grundgehalt',
    'E-Mail',
    'Abteilung',
    'Job-Profil',
    'Karrierestufe',
    'Mitarbeiternummer',
    'Geburtsjahr',
    'Bonus',
    'Wochenstunden',
    'Standort',
  ];
  const example = [
    'Anna',
    'Müller',
    'weiblich',
    'Vollzeit',
    '01.03.2023',
    '60000',
    'anna.mueller@beispiel.de',
    'Engineering',
    'Software Engineer',
    'Senior',
    'MA-001',
    '1988',
    '5000',
    '40',
    'Berlin',
  ];
  const csv = [headers.join(','), example.join(',')].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mitarbeiter-vorlage.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Voraussetzungen' },
  { label: 'Upload' },
  { label: 'Spalten' },
  { label: 'Validierung' },
  { label: 'Import' },
  { label: 'Ergebnis' },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STEPS.map((step, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        return (
          <div key={step.label} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : isDone
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <span>{i + 1}</span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-px w-3 bg-slate-200 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 0: Prerequisite check ───────────────────────────────────────────────

interface Step0Props {
  hasDepartments: boolean;
  hasLevels: boolean;
  hasProfiles: boolean;
  onContinue: () => void;
}

function Step0Prerequisites({
  hasDepartments,
  hasLevels,
  hasProfiles,
  onContinue,
}: Step0Props) {
  const missing: string[] = [];
  if (!hasDepartments) missing.push('Abteilungen');
  if (!hasLevels) missing.push('Karrierestufen');
  if (!hasProfiles) missing.push('Job-Profile');

  const allGood = missing.length === 0;

  return (
    <div className="space-y-4">
      <Card className={`border ${allGood ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'}`}>
        <CardContent className="pt-5 pb-5 space-y-4">
          <div className="flex items-start gap-3">
            {allGood ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {allGood
                  ? 'Alle Voraussetzungen erfüllt'
                  : `Fehlende Voraussetzungen: ${missing.join(', ')}`}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {allGood
                  ? 'Abteilungen, Karrierestufen und Job-Profile sind angelegt. Du kannst Mitarbeiter importieren.'
                  : 'Für einen sinnvollen Import werden die folgenden Strukturdaten benötigt. Lege sie erst in Phase 1 und 2 an.'}
              </p>
            </div>
          </div>

          {!allGood && (
            <div className="flex flex-wrap gap-2 pl-8">
              {!hasDepartments && (
                <Link href="/einrichtung/struktur">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Abteilungen anlegen
                  </Button>
                </Link>
              )}
              {(!hasLevels || !hasProfiles) && (
                <Link href="/einrichtung/verguetung">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Vergütungs-Matrix
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onContinue} disabled={!allGood}>
          Weiter zu Upload
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 1: File upload ──────────────────────────────────────────────────────

interface Step1Props {
  onFileParsed: (headers: string[], rows: Record<string, string>[]) => void;
}

function Step1Upload({ onFileParsed }: Step1Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    setError(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      setError(
        'Excel-Dateien (.xlsx / .xls) werden nicht unterstützt. Bitte exportiere die Datei als CSV (UTF-8) aus Excel und lade sie erneut hoch.'
      );
      return;
    }
    if (ext !== 'csv' && file.type !== 'text/csv' && file.type !== 'application/csv') {
      setError('Nur CSV-Dateien (.csv) werden akzeptiert.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(
        `Die Datei ist ${(file.size / 1024 / 1024).toFixed(1)} MB groß — das Limit liegt bei 5 MB.`
      );
      return;
    }

    // Encoding-Erkennung: CSV als ArrayBuffer einlesen, dann heuristisch prüfen.
    // Viele deutsche HR-Exporte (z.B. Datev, SAGE, Excel "CSV ANSI") sind Windows-1252.
    // Wenn UTF-8 Ersetzungszeichen (U+FFFD) erzeugt, Fallback auf Windows-1252.
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result;
      if (!(buffer instanceof ArrayBuffer)) {
        setError('Fehler beim Lesen der Datei.');
        return;
      }

      // Versuche UTF-8; bei Ersetzungszeichen auf Windows-1252 wechseln.
      const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      const csvText = utf8Text.includes('�')
        ? new TextDecoder('windows-1252').decode(buffer)
        : utf8Text;

      Papa.parse<Record<string, string>>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete(results) {
          if (results.errors.length > 0 && results.data.length === 0) {
            setError(
              'Die CSV konnte nicht gelesen werden. Stelle sicher, dass die Datei UTF-8 oder Windows-1252 kodiert ist.'
            );
            return;
          }
          const headers = results.meta.fields ?? [];
          if (headers.length === 0) {
            setError('Keine Spalten erkannt. Enthält die CSV-Datei eine Kopfzeile?');
            return;
          }
          if (results.data.length === 0) {
            setError('Die Datei enthält nur eine Kopfzeile, aber keine Datenzeilen.');
            return;
          }
          onFileParsed(headers, results.data);
        },
        error() {
          setError(
            'Fehler beim Lesen der Datei. Überprüfe die Kodierung (UTF-8 oder Windows-1252).'
          );
        },
      });
    };
    reader.onerror = () => {
      setError('Fehler beim Lesen der Datei.');
    };
    reader.readAsArrayBuffer(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="space-y-4">
      {/* Template download */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Noch keine CSV-Datei? Lade die Vorlage herunter und befülle sie.
        </p>
        <Button variant="outline" size="sm" onClick={downloadTemplateCsv}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Vorlage herunterladen
        </Button>
      </div>

      {/* Drop zone */}
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="CSV-Datei hochladen"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
      >
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Upload className="h-6 w-6 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              CSV-Datei hierher ziehen oder klicken zum Auswählen
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Nur .csv · max. 5 MB · UTF-8 oder Windows-1252
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="py-3 flex items-start gap-2">
            <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Encoding hint */}
      <div className="rounded-md bg-slate-50 border border-slate-200 p-3">
        <p className="text-xs text-slate-600">
          <span className="font-medium">Hinweis zur Kodierung:</span> Excel speichert CSV-Dateien
          oft als Windows-1252 (ANSI). Für korrekte Umlaute wähle beim Export{' '}
          <span className="font-medium">"CSV UTF-8 (mit BOM)"</span> oder öffne die Datei in einem
          Texteditor und speichere sie als UTF-8.
        </p>
      </div>
    </div>
  );
}

// ─── Step 2: Column mapping ───────────────────────────────────────────────────

interface Step2Props {
  csvHeaders: string[];
  mapping: Record<string, string>;
  rowCount: number;
  onMappingChange: (mapping: Record<string, string>) => void;
  onContinue: () => void;
  onBack: () => void;
}

function Step2Mapping({
  csvHeaders,
  mapping,
  rowCount,
  onMappingChange,
  onContinue,
  onBack,
}: Step2Props) {
  const requiredFields = EMPLOYEE_FIELDS.filter((f) => f.required);
  const allRequiredMapped = requiredFields.every((f) => !!mapping[f.key]);

  function setField(fieldKey: string, csvHeader: string) {
    onMappingChange({ ...mapping, [fieldKey]: csvHeader === '__none__' ? '' : csvHeader });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <FileText className="h-4 w-4 text-slate-400" />
        <span>
          <span className="font-medium">{rowCount}</span> Datenzeilen erkannt ·{' '}
          <span className="font-medium">{csvHeaders.length}</span> Spalten
        </span>
      </div>

      <Card className="border border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 gap-0 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200 px-4 py-2">
            <span>KlarGehalt-Feld</span>
            <span>CSV-Spalte</span>
          </div>
          <div className="divide-y divide-slate-100">
            {EMPLOYEE_FIELDS.map((field) => (
              <div
                key={field.key}
                className="grid grid-cols-2 items-center gap-3 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-800">{field.label}</span>
                    {field.required && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-red-600 border-red-200">
                        Pflicht
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{field.description}</p>
                </div>
                <Select
                  value={mapping[field.key] ?? '__none__'}
                  onValueChange={(v) => setField(field.key, v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="— nicht zuordnen —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— nicht zuordnen —</SelectItem>
                    {csvHeaders.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!allRequiredMapped && (
        <Card className="border border-amber-200 bg-amber-50">
          <CardContent className="py-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              Bitte ordne alle Pflichtfelder zu, bevor du fortfährst.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Zurück
        </Button>
        <Button onClick={onContinue} disabled={!allRequiredMapped}>
          Validierung starten
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Validation preview ───────────────────────────────────────────────

interface EntityAnalysis {
  newDepartments: string[];
  newJobProfiles: string[];
  levelMismatches: string[];
  levelMatches: string[];
}

interface Step3Props {
  parsedRows: ParsedRow[];
  entityAnalysis: EntityAnalysis;
  autoCreate: boolean;
  onAutoCreateChange: (v: boolean) => void;
  currentEmployeeCount: number;
  maxEmployees: number;
  tier: string;
  onContinue: () => void;
  onBack: () => void;
}

function Step3Validation({
  parsedRows,
  entityAnalysis,
  autoCreate,
  onAutoCreateChange,
  currentEmployeeCount,
  maxEmployees,
  tier,
  onContinue,
  onBack,
}: Step3Props) {
  const [errorsExpanded, setErrorsExpanded] = useState(false);
  const validRows = parsedRows.filter((r) => r.errors.length === 0);
  const errorRows = parsedRows.filter((r) => r.errors.length > 0);

  const projectedTotal = currentEmployeeCount + validRows.length;
  const isUnlimited = maxEmployees === -1;
  const willExceedLimit = !isUnlimited && projectedTotal > maxEmployees;
  const nearLimit = !isUnlimited && tier === 'basis' && projectedTotal >= 45;

  const canProceed = validRows.length > 0 && !willExceedLimit;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border border-slate-200">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-semibold text-slate-900">{parsedRows.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Zeilen gesamt</p>
          </CardContent>
        </Card>
        <Card className="border border-emerald-200 bg-emerald-50/30">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-semibold text-emerald-700">{validRows.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Vollständig</p>
          </CardContent>
        </Card>
        <Card className={`border ${errorRows.length > 0 ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
          <CardContent className="py-4 text-center">
            <p className={`text-2xl font-semibold ${errorRows.length > 0 ? 'text-red-700' : 'text-slate-900'}`}>
              {errorRows.length}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Mit Fehlern</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan limit warning */}
      {willExceedLimit && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="py-3 flex items-start gap-2">
            <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">Plan-Limit überschritten</p>
              <p className="text-sm text-red-700 mt-0.5">
                Dieser Import würde {projectedTotal} Mitarbeiter ergeben, dein Plan erlaubt aber
                maximal {maxEmployees}. Bitte reduziere die Importmenge oder upgrade deinen Plan.
              </p>
            </div>
            <Link href="/abrechnung" className="flex-shrink-0">
              <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                Upgrade
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {nearLimit && !willExceedLimit && (
        <Card className="border border-amber-200 bg-amber-50">
          <CardContent className="py-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              Nach dem Import: {projectedTotal} von {maxEmployees} Mitarbeitern im Basis-Tarif.
              Ab {maxEmployees} greift der Übergangs-Puffer.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error list (collapsible) */}
      {errorRows.length > 0 && (
        <Card className="border border-red-200 overflow-hidden">
          <CardContent className="p-0">
            <button
              onClick={() => setErrorsExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors text-left"
              aria-expanded={errorsExpanded}
            >
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  {errorRows.length} {errorRows.length === 1 ? 'Zeile' : 'Zeilen'} mit Fehlern
                </span>
              </div>
              {errorsExpanded ? (
                <ChevronDown className="h-4 w-4 text-red-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-red-500" />
              )}
            </button>
            {errorsExpanded && (
              <div className="divide-y divide-red-100 max-h-64 overflow-y-auto">
                {errorRows.map((row) => (
                  <div key={row.index} className="px-4 py-2.5">
                    <p className="text-xs font-medium text-slate-700 mb-1">Zeile {row.index}</p>
                    <div className="space-y-0.5">
                      {row.errors.map((e, i) => (
                        <p key={i} className="text-xs text-red-600">
                          <span className="font-medium">{e.field}:</span> {e.message}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Entity auto-creation proposals */}
      {(entityAnalysis.newDepartments.length > 0 || entityAnalysis.newJobProfiles.length > 0) && (
        <Card className="border border-slate-200">
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  Fehlende Einträge automatisch anlegen
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Die folgenden Abteilungen und Job-Profile aus der CSV existieren noch nicht.
                </p>
              </div>
              <Switch
                id="auto-create"
                checked={autoCreate}
                onCheckedChange={onAutoCreateChange}
              />
              <Label htmlFor="auto-create" className="sr-only">
                Automatisch anlegen
              </Label>
            </div>

            {entityAnalysis.newDepartments.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">
                  Neue Abteilungen ({entityAnalysis.newDepartments.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {entityAnalysis.newDepartments.map((n) => (
                    <Badge key={n} variant="secondary" className="text-xs">
                      {n}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {entityAnalysis.newJobProfiles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">
                  Neue Job-Profile ({entityAnalysis.newJobProfiles.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {entityAnalysis.newJobProfiles.map((n) => (
                    <Badge key={n} variant="secondary" className="text-xs">
                      {n}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Level match info */}
      {(entityAnalysis.levelMatches.length > 0 || entityAnalysis.levelMismatches.length > 0) && (
        <Card className="border border-slate-200">
          <CardContent className="pt-4 pb-4 space-y-2">
            <p className="text-sm font-medium text-slate-900">Karrierestufen-Zuordnung</p>
            {entityAnalysis.levelMatches.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {entityAnalysis.levelMatches.map((n) => (
                  <Badge key={n} variant="outline" className="text-xs text-emerald-700 border-emerald-200 bg-emerald-50">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {n}
                  </Badge>
                ))}
              </div>
            )}
            {entityAnalysis.levelMismatches.length > 0 && (
              <div>
                <p className="text-xs text-amber-600 mb-1">Nicht zugeordnet (werden ignoriert):</p>
                <div className="flex flex-wrap gap-1">
                  {entityAnalysis.levelMismatches.map((n) => (
                    <Badge key={n} variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      {n}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Zurück
        </Button>
        <Button onClick={onContinue} disabled={!canProceed}>
          {validRows.length} {validRows.length === 1 ? 'Mitarbeiter' : 'Mitarbeiter'} importieren
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Execute ──────────────────────────────────────────────────────────

interface RowResult {
  index: number;
  name: string;
  success: boolean;
  error?: string;
}

interface Step4Props {
  onComplete: (results: RowResult[], newDeptCount: number, newProfileCount: number) => void;
  validRows: ParsedRow[];
  entityAnalysis: EntityAnalysis;
  autoCreate: boolean;
  existingDepartments: Array<{ id: string; name: string }>;
  existingProfiles: Array<{ id: string; title: string; department_id: string | null }>;
  existingLevels: Array<{ id: string; name: string }>;
}

function Step4Execute({
  onComplete,
  validRows,
  entityAnalysis,
  autoCreate,
  existingDepartments,
  existingProfiles,
  existingLevels,
}: Step4Props) {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Starte Import...');
  const [started, setStarted] = useState(false);

  const total =
    validRows.length +
    (autoCreate ? entityAnalysis.newDepartments.length + entityAnalysis.newJobProfiles.length : 0);
  const progressPct = total > 0 ? Math.round((progress / total) * 100) : 0;

  const runImport = useCallback(async () => {
    if (started) return;
    setStarted(true);

    let done = 0;
    const tick = () => {
      done++;
      setProgress(done);
    };

    // Build mutable maps for new IDs
    const deptMap = new Map<string, string>(); // lowercase name → id
    for (const d of existingDepartments) {
      deptMap.set(d.name.trim().toLowerCase(), d.id);
    }
    const profileMap = new Map<string, string>(); // lowercase title → id
    for (const p of existingProfiles) {
      profileMap.set(p.title.trim().toLowerCase(), p.id);
    }
    const levelMap = new Map<string, string>(); // lowercase name → id
    for (const l of existingLevels) {
      levelMap.set(l.name.trim().toLowerCase(), l.id);
    }

    let newDeptCount = 0;
    let newProfileCount = 0;

    // Phase 1: create missing departments
    if (autoCreate && entityAnalysis.newDepartments.length > 0) {
      setStatusMessage('Abteilungen anlegen...');
      for (const name of entityAnalysis.newDepartments) {
        try {
          const res = await fetch('/api/departments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          });
          if (res.ok) {
            const data = await res.json() as { id: string };
            deptMap.set(name.trim().toLowerCase(), data.id);
            newDeptCount++;
          }
        } catch {
          // Non-critical: continue; employee row will just have no dept_id
        }
        tick();
      }
    }

    // Phase 2: create missing job profiles
    if (autoCreate && entityAnalysis.newJobProfiles.length > 0) {
      setStatusMessage('Job-Profile anlegen...');
      for (const title of entityAnalysis.newJobProfiles) {
        try {
          const res = await fetch('/api/job-profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, is_active: true }),
          });
          if (res.ok) {
            const data = await res.json() as { id: string };
            profileMap.set(title.trim().toLowerCase(), data.id);
            newProfileCount++;
          }
        } catch {
          // Non-critical
        }
        tick();
      }
    }

    // Phase 3: create employees — ONE atomic bulk request (Risk #3 + #4).
    // Was a per-row POST loop: O(n²) snapshot trigger + non-atomic (a timeout
    // mid-loop left a silently half-imported compliance dataset). Now the
    // server inserts the whole batch in a single statement, all-or-nothing.
    setStatusMessage('Mitarbeiter importieren...');

    const buildName = (r: ParsedRow) =>
      `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim();

    const employeesPayload = validRows.map((row) => {
      const deptId = row.department_name
        ? (deptMap.get(row.department_name.trim().toLowerCase()) ?? null)
        : null;
      const profileId = row.job_profile_title
        ? (profileMap.get(row.job_profile_title.trim().toLowerCase()) ?? null)
        : null;
      const levelId = row.job_level_name
        ? (levelMap.get(row.job_level_name.trim().toLowerCase()) ?? null)
        : null;

      const payload: Record<string, unknown> = {
        first_name: row.first_name,
        last_name: row.last_name,
        gender: row.gender,
        employment_type: row.employment_type,
        hire_date: row.hire_date,
        base_salary: row.base_salary,
        is_active: true,
      };
      if (row.email) payload.email = row.email;
      if (deptId) payload.department_id = deptId;
      if (profileId) payload.job_profile_id = profileId;
      if (levelId) payload.job_level_id = levelId;
      if (row.employee_number) payload.employee_number = row.employee_number;
      if (row.birth_year !== undefined) payload.birth_year = row.birth_year;
      if (row.variable_pay !== undefined) payload.variable_pay = row.variable_pay;
      if (row.weekly_hours !== undefined) payload.weekly_hours = row.weekly_hours;
      if (row.location) payload.location = row.location;
      return payload;
    });

    let importError: string | null = null;
    try {
      const res = await fetch('/api/employees/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: employeesPayload }),
      });
      if (!res.ok) {
        let msg = `Fehler ${res.status}`;
        try {
          const parsed = (await res.json()) as { error?: string };
          if (parsed.error) msg = parsed.error;
        } catch {
          // non-JSON body — keep the status fallback
        }
        importError = msg;
      }
    } catch (err: unknown) {
      importError = err instanceof Error ? err.message : 'Netzwerkfehler';
    }

    // Atomic: every valid row was imported, or none was.
    const results: RowResult[] = validRows.map((row) => ({
      index: row.index,
      name: buildName(row),
      success: importError === null,
      ...(importError !== null ? { error: importError } : {}),
    }));

    setProgress(total);
    onComplete(results, newDeptCount, newProfileCount);
  }, [started, validRows, entityAnalysis, autoCreate, existingDepartments, existingProfiles, existingLevels, onComplete, total]);

  // Auto-start once on mount
  useEffect(() => {
    void runImport();
  }, []); // eslint-disable-line

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200">
        <CardContent className="py-8 flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-900">{statusMessage}</p>
            <p className="text-xs text-slate-500 mt-1">
              {progress} von {total} Schritten
            </p>
          </div>
          <div className="w-full max-w-sm">
            <Progress value={progressPct} className="h-2" />
          </div>
          <p className="text-sm font-semibold text-slate-700">{progressPct}%</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Step 5: Result ───────────────────────────────────────────────────────────

interface Step5Props {
  results: RowResult[];
  newDeptCount: number;
  newProfileCount: number;
  onRetryFailed: (rows: ParsedRow[]) => void;
  failedParsedRows: ParsedRow[];
}

function Step5Result({
  results,
  newDeptCount,
  newProfileCount,
  onRetryFailed,
  failedParsedRows,
}: Step5Props) {
  const [failedExpanded, setFailedExpanded] = useState(false);
  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;
  const allSuccess = failedCount === 0;

  return (
    <div className="space-y-4">
      {/* Result card */}
      <Card className={`border ${allSuccess ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'}`}>
        <CardContent className="py-6 flex flex-col items-center gap-3 text-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              allSuccess ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          >
            {allSuccess ? (
              <CheckCircle2 className="h-6 w-6 text-white" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">
              {allSuccess ? 'Import abgeschlossen' : 'Import teilweise abgeschlossen'}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              {successCount} {successCount === 1 ? 'Mitarbeiter' : 'Mitarbeiter'} angelegt
              {newDeptCount > 0 && ` · ${newDeptCount} neue Abteilung${newDeptCount > 1 ? 'en' : ''}`}
              {newProfileCount > 0 && ` · ${newProfileCount} neues Job-Profil${newProfileCount > 1 ? 'e' : ''}`}
            </p>
            {failedCount > 0 && (
              <p className="text-sm text-red-600 mt-0.5">
                {failedCount} {failedCount === 1 ? 'Zeile' : 'Zeilen'} fehlgeschlagen
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Failed rows */}
      {failedCount > 0 && (
        <Card className="border border-red-200 overflow-hidden">
          <CardContent className="p-0">
            <button
              onClick={() => setFailedExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors text-left"
              aria-expanded={failedExpanded}
            >
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  {failedCount} fehlgeschlagene {failedCount === 1 ? 'Zeile' : 'Zeilen'}
                </span>
              </div>
              {failedExpanded ? (
                <ChevronDown className="h-4 w-4 text-red-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-red-500" />
              )}
            </button>
            {failedExpanded && (
              <div className="divide-y divide-red-100 max-h-64 overflow-y-auto">
                {results
                  .filter((r) => !r.success)
                  .map((r) => (
                    <div key={r.index} className="px-4 py-2.5 flex items-start gap-3">
                      <span className="text-xs text-slate-500 flex-shrink-0 mt-0.5 tabular-nums">
                        Zeile {r.index}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 truncate">{r.name}</p>
                        <p className="text-xs text-red-600 mt-0.5">{r.error}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex gap-2">
          {failedParsedRows.length > 0 && (
            <Button variant="outline" onClick={() => onRetryFailed(failedParsedRows)}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Fehlgeschlagene erneut versuchen
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/einrichtung">
            <Button variant="outline">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Zurück zum Hub
            </Button>
          </Link>
          <Link href="/mitarbeiter">
            <Button variant="default">
              <Users className="mr-1.5 h-4 w-4" />
              Mitarbeiterliste öffnen
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded-full" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function MitarbeiterImportView() {
  const canAccess = useRoleAccess('owner', 'admin', 'hr_manager');

  const { departments, loading: depsLoading } = useDepartments();
  const { jobLevels, loading: levelsLoading } = useJobLevels();
  const { jobProfiles, loading: profilesLoading } = useJobProfiles();
  const { employees, loading: empsLoading } = useEmployees();
  const subscription = useSubscription();

  const isLoading =
    depsLoading || levelsLoading || profilesLoading || empsLoading || subscription.loading;

  // Wizard state
  const [step, setStep] = useState(0);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [autoCreate, setAutoCreate] = useState(true);
  const [importResults, setImportResults] = useState<RowResult[]>([]);
  const [newDeptCount, setNewDeptCount] = useState(0);
  const [newProfileCount, setNewProfileCount] = useState(0);

  // Derived entity analysis (memoized for step 3)
  const activeProfiles = useMemo(
    () => jobProfiles.filter((p) => p.is_active),
    [jobProfiles]
  );

  const entityAnalysis: EntityAnalysis = useMemo(() => {
    const validRows = parsedRows.filter((r) => r.errors.length === 0);

    const csvDeptNames = [
      ...new Set(
        validRows
          .map((r) => r.department_name)
          .filter((v): v is string => !!v)
          .map((v) => v.trim())
      ),
    ];
    const csvProfileTitles = [
      ...new Set(
        validRows
          .map((r) => r.job_profile_title)
          .filter((v): v is string => !!v)
          .map((v) => v.trim())
      ),
    ];
    const csvLevelNames = [
      ...new Set(
        validRows
          .map((r) => r.job_level_name)
          .filter((v): v is string => !!v)
          .map((v) => v.trim())
      ),
    ];

    const existingDeptNamesLower = new Set(departments.map((d) => d.name.trim().toLowerCase()));
    const existingProfileTitlesLower = new Set(activeProfiles.map((p) => p.title.trim().toLowerCase()));
    const existingLevelNamesLower = new Set(jobLevels.map((l) => l.name.trim().toLowerCase()));

    const newDepartments = csvDeptNames.filter(
      (n) => !existingDeptNamesLower.has(n.toLowerCase())
    );
    const newJobProfiles = csvProfileTitles.filter(
      (t) => !existingProfileTitlesLower.has(t.toLowerCase())
    );
    const levelMatches = csvLevelNames.filter((n) =>
      existingLevelNamesLower.has(n.toLowerCase())
    );
    const levelMismatches = csvLevelNames.filter(
      (n) => !existingLevelNamesLower.has(n.toLowerCase())
    );

    return { newDepartments, newJobProfiles, levelMatches, levelMismatches };
  }, [parsedRows, departments, activeProfiles, jobLevels]);

  // Failed parsed rows (for retry)
  const failedParsedRows = useMemo(() => {
    const failedIndices = new Set(
      importResults.filter((r) => !r.success).map((r) => r.index)
    );
    return parsedRows.filter((r) => failedIndices.has(r.index) && r.errors.length === 0);
  }, [importResults, parsedRows]);

  const currentEmployeeCount = employees.filter((e) => e.is_active).length;
  const maxEmployees = subscription.limits.maxEmployees;

  // ── Handlers ──

  const handleFileParsed = useCallback(
    (headers: string[], rows: Record<string, string>[]) => {
      setCsvHeaders(headers);
      setRawRows(rows);
      setMapping(autoDetectMapping(headers));
      setStep(2);
    },
    []
  );

  const handleMappingContinue = useCallback(() => {
    const rows = validateAndNormalizeRows(rawRows, mapping);
    setParsedRows(rows);
    setStep(3);
  }, [rawRows, mapping]);

  const handleExecutionComplete = useCallback(
    (results: RowResult[], depts: number, profiles: number) => {
      setImportResults(results);
      setNewDeptCount(depts);
      setNewProfileCount(profiles);
      setStep(5);
      const successCount = results.filter((r) => r.success).length;
      if (successCount > 0) {
        toast.success(`${successCount} Mitarbeiter erfolgreich importiert`);
      }
    },
    []
  );

  const handleRetryFailed = useCallback(
    (rows: ParsedRow[]) => {
      setParsedRows(rows);
      setImportResults([]);
      setNewDeptCount(0);
      setNewProfileCount(0);
      setStep(3);
    },
    []
  );

  if (!canAccess) return <AccessDenied />;
  if (isLoading) return <LoadingSkeleton />;

  const hasDepartments = departments.length > 0;
  const hasLevels = jobLevels.length > 0;
  const hasProfiles = activeProfiles.length > 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb + header */}
      <div>
        <Link
          href="/einrichtung"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Compliance-Einrichtung
        </Link>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-semibold">
            3
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Phase 3: Mitarbeiter importieren</h1>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-2xl">
              Lade eine CSV-Datei hoch und importiere deine Mitarbeiterliste in einem Schritt.
              Spalten werden automatisch erkannt, Abteilungen und Profile werden
              identifiziert und fehlende Einträge optional angelegt.
            </p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={step} />

      {/* Step content */}
      {step === 0 && (
        <Step0Prerequisites
          hasDepartments={hasDepartments}
          hasLevels={hasLevels}
          hasProfiles={hasProfiles}
          onContinue={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <Step1Upload onFileParsed={handleFileParsed} />
      )}

      {step === 2 && (
        <Step2Mapping
          csvHeaders={csvHeaders}
          mapping={mapping}
          rowCount={rawRows.length}
          onMappingChange={setMapping}
          onContinue={handleMappingContinue}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <Step3Validation
          parsedRows={parsedRows}
          entityAnalysis={entityAnalysis}
          autoCreate={autoCreate}
          onAutoCreateChange={setAutoCreate}
          currentEmployeeCount={currentEmployeeCount}
          maxEmployees={maxEmployees}
          tier={subscription.tier}
          onContinue={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && (
        <Step4Execute
          onComplete={handleExecutionComplete}
          validRows={parsedRows.filter((r) => r.errors.length === 0)}
          entityAnalysis={entityAnalysis}
          autoCreate={autoCreate}
          existingDepartments={departments}
          existingProfiles={activeProfiles}
          existingLevels={jobLevels}
        />
      )}

      {step === 5 && (
        <Step5Result
          results={importResults}
          newDeptCount={newDeptCount}
          newProfileCount={newProfileCount}
          onRetryFailed={handleRetryFailed}
          failedParsedRows={failedParsedRows}
        />
      )}
    </div>
  );
}

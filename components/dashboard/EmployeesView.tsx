import { useState, useEffect } from 'react';
import { useEmployees, Employee, EmployeeFormData } from '@/hooks/useEmployees';
import { useJobProfiles } from '@/hooks/useJobProfiles';
import { useDepartments } from '@/hooks/useDepartments';
import { useJobLevels } from '@/hooks/useJobLevels';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Users, CheckCircle, XCircle, Euro, Mail, Upload, KeyRound, AlertCircle, Scale, X } from 'lucide-react';
import { toast } from 'sonner';
import type { SalaryFactor, SalaryFactorType, SalaryJustification } from '@/lib/types/salary-justification';
import {
  SALARY_FACTOR_DISPLAY_LABELS,
  SALARY_SCORE_LABELS,
  createDefaultFactor,
  hasJustification,
} from '@/lib/types/salary-justification';

const genderLabels: Record<string, string> = {
  male: 'Männlich',
  female: 'Weiblich',
  diverse: 'Divers',
  not_specified: 'Keine Angabe',
};

const employmentTypeLabels: Record<string, string> = {
  full_time: 'Vollzeit',
  part_time: 'Teilzeit',
  contract: 'Vertrag',
};

const formatCurrency = (value: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const defaultFormData: EmployeeFormData = {
  first_name: '',
  last_name: '',
  email: '',
  employee_number: '',
  gender: 'not_specified',
  hire_date: new Date().toISOString().split('T')[0],
  employment_type: 'full_time',
  base_salary: 0,
  variable_pay: 0,
  weekly_hours: 40,
  currency: 'EUR',
  job_profile_id: '',
  job_level_id: '',
  department_id: '',
  location: '',
  is_active: true,
};

const FACTOR_TYPE_OPTIONS: { value: SalaryFactorType; label: string }[] = [
  { value: 'experience', label: SALARY_FACTOR_DISPLAY_LABELS.experience },
  { value: 'education', label: SALARY_FACTOR_DISPLAY_LABELS.education },
  { value: 'performance', label: SALARY_FACTOR_DISPLAY_LABELS.performance },
  { value: 'market_rate', label: SALARY_FACTOR_DISPLAY_LABELS.market_rate },
  { value: 'seniority', label: SALARY_FACTOR_DISPLAY_LABELS.seniority },
  { value: 'other', label: SALARY_FACTOR_DISPLAY_LABELS.other },
];

const EmployeesView = () => {
  const { employees, loading, createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const { jobProfiles } = useJobProfiles();
  const { departments } = useDepartments();
  const { jobLevels } = useJobLevels();
  const { user, supabase, orgId } = useAuth();

  // Resolve created_by user IDs to display names
  const [creatorMap, setCreatorMap] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!employees.length || !orgId) return;
    const creatorIds = [...new Set(employees.map(e => e.created_by).filter(Boolean))];
    if (!creatorIds.length) return;

    supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', creatorIds)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        for (const p of data) {
          map[p.user_id] = p.full_name || p.email || p.user_id;
        }
        setCreatorMap(map);
      });
  }, [employees, orgId, supabase]);

  const getCreatorName = (userId: string | null | undefined): string => {
    if (!userId) return '—';
    return creatorMap[userId] || userId.slice(0, 8) + '…';
  };
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({ ...defaultFormData });

  // Salary justification state
  const [justificationFactors, setJustificationFactors] = useState<SalaryFactor[]>([]);
  const [justificationSummary, setJustificationSummary] = useState('');

  // Invite state
  const [inviteLoading, setInviteLoading] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ email: string; tempPassword: string; alreadyExists: boolean } | null>(null);

  // CSV import state
  const [csvImporting, setCsvImporting] = useState(false);

  const resetForm = () => {
    setFormData({ ...defaultFormData });
    setJustificationFactors([]);
    setJustificationSummary('');
  };

  const handleInvite = async (employee: Employee) => {
    if (!employee.email) {
      toast.error('Keine E-Mail-Adresse für diesen Mitarbeiter hinterlegt.');
      return;
    }
    setInviteLoading(employee.id);
    try {
      const res = await fetch('/api/employees/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employee.id }),
      });
      const data = await res.json() as { success?: boolean; email?: string; tempPassword?: string; alreadyExists?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Einladung fehlgeschlagen');
      setInviteResult({
        email: data.email ?? employee.email,
        tempPassword: data.tempPassword ?? '',
        alreadyExists: data.alreadyExists ?? false,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Einladung fehlgeschlagen');
    } finally {
      setInviteLoading(null);
    }
  };

  const handleCsvImport = async (file: File) => {
    setCsvImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error('CSV-Datei enthält keine Daten.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
      const rows = lines.slice(1);

      const genderMap: Record<string, Employee['gender']> = {
        male: 'male', männlich: 'male', m: 'male',
        female: 'female', weiblich: 'female', w: 'female', f: 'female',
        diverse: 'diverse', divers: 'diverse', d: 'diverse',
      };

      const employmentMap: Record<string, Employee['employment_type']> = {
        full_time: 'full_time', vollzeit: 'full_time', fulltime: 'full_time',
        part_time: 'part_time', teilzeit: 'part_time', parttime: 'part_time',
        contract: 'contract', vertrag: 'contract',
      };

      let imported = 0;
      let failed = 0;

      for (const row of rows) {
        const cols = row.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const get = (name: string) => cols[headers.indexOf(name)] ?? '';

        const firstName = get('first_name') || get('vorname');
        const lastName = get('last_name') || get('nachname');
        const salary = parseFloat(get('base_salary') || get('grundgehalt') || get('salary') || '0');

        if (!firstName || !lastName || salary <= 0) { failed++; continue; }

        const genderRaw = (get('gender') || get('geschlecht') || 'not_specified').toLowerCase();
        const employmentRaw = (get('employment_type') || get('beschaeftigungsart') || 'full_time').toLowerCase();

        const employeeData: EmployeeFormData = {
          first_name: firstName,
          last_name: lastName,
          email: get('email') || undefined,
          employee_number: get('employee_number') || get('personalnummer') || undefined,
          gender: genderMap[genderRaw] ?? 'not_specified',
          hire_date: get('hire_date') || get('eintrittsdatum') || new Date().toISOString().split('T')[0],
          employment_type: employmentMap[employmentRaw] ?? 'full_time',
          base_salary: salary,
          variable_pay: parseFloat(get('variable_pay') || get('variable') || '0') || 0,
          weekly_hours: parseFloat(get('weekly_hours') || get('wochenstunden') || '40') || 40,
          currency: get('currency') || 'EUR',
          location: get('location') || get('standort') || undefined,
          is_active: true,
        };

        try {
          await createEmployee(employeeData);
          imported++;
        } catch {
          failed++;
        }
      }

      toast.success(`Import abgeschlossen: ${imported} importiert${failed > 0 ? `, ${failed} Fehler` : ''}.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Import fehlgeschlagen');
    } finally {
      setCsvImporting(false);
    }
  };

  const handleCreate = async () => {
    const submitData = { ...formData };
    if (!submitData.job_profile_id) delete submitData.job_profile_id;
    if (!submitData.job_level_id) delete submitData.job_level_id;
    if (!submitData.department_id) delete submitData.department_id;
    await createEmployee(submitData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email || '',
      employee_number: employee.employee_number || '',
      gender: employee.gender,
      hire_date: employee.hire_date,
      employment_type: employee.employment_type,
      base_salary: employee.base_salary,
      variable_pay: employee.variable_pay || 0,
      weekly_hours: employee.weekly_hours || 40,
      currency: employee.currency || 'EUR',
      job_profile_id: employee.job_profile_id || '',
      job_level_id: employee.job_level_id || '',
      department_id: employee.department_id || '',
      location: employee.location || '',
      is_active: employee.is_active,
    });
    // Load existing justification
    const justification = employee.salary_justification;
    if (justification && hasJustification(justification)) {
      setJustificationFactors([...justification.factors]);
      setJustificationSummary(justification.summary || '');
    } else {
      setJustificationFactors([]);
      setJustificationSummary('');
    }
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedEmployee) return;
    const submitData = { ...formData };
    if (!submitData.job_profile_id) delete submitData.job_profile_id;
    if (!submitData.job_level_id) delete submitData.job_level_id;
    if (!submitData.department_id) delete submitData.department_id;

    // Attach salary justification
    const justification: SalaryJustification = {
      factors: justificationFactors,
      summary: justificationSummary,
      last_reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id ?? undefined,
    };
    submitData.salary_justification = justification;
    submitData.salary_justification_updated_at = new Date().toISOString();
    submitData.salary_justification_updated_by = user?.id ?? undefined;

    await updateEmployee(selectedEmployee.id, submitData);
    setIsEditOpen(false);
    setSelectedEmployee(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    await deleteEmployee(selectedEmployee.id);
    setIsDeleteOpen(false);
    setSelectedEmployee(null);
  };

  const getProfileTitle = (profileId: string | null) => {
    if (!profileId) return '—';
    return jobProfiles.find(p => p.id === profileId)?.title || '—';
  };

  const getDeptName = (deptId: string | null) => {
    if (!deptId) return '—';
    return departments.find(d => d.id === deptId)?.name || '—';
  };

  const getLevelName = (levelId: string | null) => {
    if (!levelId) return null;
    return jobLevels.find(l => l.id === levelId)?.name || null;
  };

  const canSubmit = formData.first_name && formData.last_name && formData.gender && formData.hire_date && formData.employment_type && formData.base_salary > 0;

  const renderFormFields = () => (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="first_name">Vorname *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="Max"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="last_name">Nachname *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Mustermann"
          />
        </div>
      </div>

      {/* Email + Personalnr */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="max@firma.de"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="employee_number">Personalnummer</Label>
          <Input
            id="employee_number"
            value={formData.employee_number}
            onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
            placeholder="P-12345"
          />
        </div>
      </div>

      {/* Gender + Employment Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Geschlecht *</Label>
          <Select
            value={formData.gender}
            onValueChange={(value: EmployeeFormData['gender']) =>
              setFormData({ ...formData, gender: value })
            }
          >
            <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Männlich</SelectItem>
              <SelectItem value="female">Weiblich</SelectItem>
              <SelectItem value="diverse">Divers</SelectItem>
              <SelectItem value="not_specified">Keine Angabe</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Beschäftigungsart *</Label>
          <Select
            value={formData.employment_type}
            onValueChange={(value: EmployeeFormData['employment_type']) =>
              setFormData({ ...formData, employment_type: value })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Vollzeit</SelectItem>
              <SelectItem value="part_time">Teilzeit</SelectItem>
              <SelectItem value="contract">Vertrag</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hire date + Location */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="hire_date">Eintrittsdatum *</Label>
          <Input
            id="hire_date"
            type="date"
            value={formData.hire_date}
            onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Standort</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Berlin, München..."
          />
        </div>
      </div>

      {/* Department + Job Profile */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Abteilung</Label>
          <Select
            value={formData.department_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, department_id: value === 'none' ? '' : value })}
          >
            <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Keine —</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Job-Profil</Label>
          <Select
            value={formData.job_profile_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, job_profile_id: value === 'none' ? '' : value })}
          >
            <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Keines —</SelectItem>
              {jobProfiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>{profile.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Job Level + Weekly Hours */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Karrierestufe</Label>
          <Select
            value={formData.job_level_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, job_level_id: value === 'none' ? '' : value })}
          >
            <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Keine —</SelectItem>
              {jobLevels.map((level) => (
                <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="weekly_hours">Wochenstunden</Label>
          <Input
            id="weekly_hours"
            type="number"
            min={0}
            max={60}
            step={0.5}
            value={formData.weekly_hours ?? 40}
            onChange={(e) => setFormData({ ...formData, weekly_hours: parseFloat(e.target.value) || 40 })}
          />
        </div>
      </div>

      {/* Salary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="base_salary">Grundgehalt (jährlich) *</Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="base_salary"
              type="number"
              min={0}
              className="pl-10"
              value={formData.base_salary || ''}
              onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
              placeholder="50.000"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="variable_pay">Variable Vergütung (jährlich)</Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="variable_pay"
              type="number"
              min={0}
              className="pl-10"
              value={formData.variable_pay || ''}
              onChange={(e) => setFormData({ ...formData, variable_pay: parseFloat(e.target.value) || 0 })}
              placeholder="5.000"
            />
          </div>
        </div>
      </div>

      {/* Salary Justification (Begründung) */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Gehaltsbegründung
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setJustificationFactors([...justificationFactors, createDefaultFactor()])}
          >
            <Plus className="w-3 h-3 mr-1" />
            Faktor hinzufügen
          </Button>
        </div>

        {justificationFactors.length === 0 && (
          <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Ohne Begründung ist die Gehaltspositionierung nicht Art. 16 konform.
            </AlertDescription>
          </Alert>
        )}

        {justificationFactors.map((factor, index) => {
          const totalWeight = justificationFactors.reduce((sum, f) => sum + f.weight, 0);
          return (
            <div key={index} className="rounded-lg border p-3 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Faktor {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    const updated = justificationFactors.filter((_, i) => i !== index);
                    setJustificationFactors(updated);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label className="text-xs">Typ</Label>
                  <Select
                    value={factor.type}
                    onValueChange={(value: SalaryFactorType) => {
                      const updated = justificationFactors.map((f, i) =>
                        i === index ? { ...f, type: value } : f
                      );
                      setJustificationFactors(updated);
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FACTOR_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1">
                  <Label className="text-xs">
                    Gewichtung: {factor.weight.toFixed(2)}
                    {totalWeight > 0 && (
                      <span className={`ml-1 ${Math.abs(totalWeight - 1) > 0.05 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        (Summe: {totalWeight.toFixed(2)})
                      </span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    className="h-8 text-sm"
                    value={factor.weight}
                    onChange={(e) => {
                      const val = Math.min(1, Math.max(0, parseFloat(e.target.value) || 0));
                      const updated = justificationFactors.map((f, i) =>
                        i === index ? { ...f, weight: val } : f
                      );
                      setJustificationFactors(updated);
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-1">
                <Label className="text-xs">
                  Bewertung: {factor.score} / 5 — {SALARY_SCORE_LABELS[factor.score] || ''}
                </Label>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[factor.score]}
                  onValueChange={(value) => {
                    const updated = justificationFactors.map((f, i) =>
                      i === index ? { ...f, score: value[0] } : f
                    );
                    setJustificationFactors(updated);
                  }}
                  className="py-2"
                />
              </div>

              <div className="grid gap-1">
                <Label className="text-xs">Anmerkung</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="z.B. 8 Jahre Berufserfahrung im Fachbereich"
                  value={factor.note}
                  onChange={(e) => {
                    const updated = justificationFactors.map((f, i) =>
                      i === index ? { ...f, note: e.target.value } : f
                    );
                    setJustificationFactors(updated);
                  }}
                />
              </div>
            </div>
          );
        })}

        <div className="grid gap-1">
          <Label className="text-xs">Zusammenfassung</Label>
          <Textarea
            placeholder="Kurze Zusammenfassung der Gehaltspositionierung..."
            value={justificationSummary}
            onChange={(e) => setJustificationSummary(e.target.value)}
            rows={2}
          />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Mitarbeiter</h2>
          <p className="text-muted-foreground">Verwalten Sie die Mitarbeiterdaten Ihres Unternehmens</p>
        </div>
        <div className="flex items-center gap-2">
          {/* CSV Import */}
          <label htmlFor="csv-import" className="cursor-pointer">
            <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
              {csvImporting
                ? <><span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" /> Importiere…</>
                : <><Upload className="w-4 h-4" /> CSV importieren</>
              }
            </div>
            <input
              id="csv-import"
              type="file"
              accept=".csv"
              className="hidden"
              disabled={csvImporting}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { handleCsvImport(file); e.target.value = ''; }
              }}
            />
          </label>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Neuer Mitarbeiter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neuen Mitarbeiter anlegen</DialogTitle>
              <DialogDescription>Erfassen Sie die Stamm- und Gehaltsdaten des Mitarbeiters.</DialogDescription>
            </DialogHeader>
            {renderFormFields()}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Abbrechen</Button>
              <Button variant="hero" onClick={handleCreate} disabled={!canSubmit}>Erstellen</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Keine Mitarbeiter vorhanden</h3>
          <p className="text-muted-foreground text-center mb-4">
            Legen Sie Ihren ersten Mitarbeiter an, um Gehaltsdaten erfassen zu können.
          </p>
          <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ersten Mitarbeiter anlegen
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Personalnr.</TableHead>
                <TableHead>Abteilung</TableHead>
                <TableHead>Job-Profil</TableHead>
                <TableHead>Stufe</TableHead>
                <TableHead>Grundgehalt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt von</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    {employee.first_name} {employee.last_name}
                    <div className="text-xs text-muted-foreground">
                      {genderLabels[employee.gender]} · {employmentTypeLabels[employee.employment_type]}
                    </div>
                  </TableCell>
                  <TableCell>{employee.employee_number || '—'}</TableCell>
                  <TableCell>{getDeptName(employee.department_id)}</TableCell>
                  <TableCell>{getProfileTitle(employee.job_profile_id)}</TableCell>
                  <TableCell>
                    {getLevelName(employee.job_level_id) ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {getLevelName(employee.job_level_id)}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(employee.base_salary, employee.currency)}
                  </TableCell>
                  <TableCell>
                    {employee.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-status-ok/10 text-status-ok">
                        <CheckCircle className="w-3 h-3" />
                        Aktiv
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        <XCircle className="w-3 h-3" />
                        Inaktiv
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getCreatorName(employee.created_by)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {employee.created_at
                      ? new Date(employee.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {employee.email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInvite(employee)}
                          disabled={inviteLoading === employee.id}
                          title={employee.user_id ? 'Erneut einladen' : 'Zum Portal einladen'}
                          className={employee.user_id ? 'text-green-600' : 'text-blue-600'}
                        >
                          {inviteLoading === employee.id
                            ? <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                            : <Mail className="w-4 h-4" />}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedEmployee(employee); setIsDeleteOpen(true); }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mitarbeiter bearbeiten</DialogTitle>
            <DialogDescription>Aktualisieren Sie die Mitarbeiterdaten.</DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Abbrechen</Button>
            <Button variant="hero" onClick={handleUpdate} disabled={!canSubmit}>Speichern</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitarbeiter löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie {selectedEmployee?.first_name} {selectedEmployee?.last_name} löschen möchten?
              Alle zugehörigen Gehaltsdaten werden ebenfalls gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Result Dialog */}
      <Dialog open={inviteResult !== null} onOpenChange={() => setInviteResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Zugangsdaten bereit
            </DialogTitle>
            <DialogDescription>
              {inviteResult?.alreadyExists
                ? 'Der Nutzer existierte bereits. Das Passwort wurde zurückgesetzt.'
                : 'Das Mitarbeiterkonto wurde erstellt.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Login-URL</p>
                <p className="text-sm font-mono font-medium">{process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.klargehalt.de'}/sign-in</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">E-Mail</p>
                <p className="text-sm font-mono font-medium">{inviteResult?.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Temporäres Passwort</p>
                <p className="text-lg font-mono font-bold tracking-widest text-primary">{inviteResult?.tempPassword}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Teilen Sie diese Zugangsdaten sicher mit dem Mitarbeiter. Das Passwort sollte nach dem ersten Login geändert werden.</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setInviteResult(null)}>Schließen</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Import help dialog */}
      <Dialog open={false}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CSV-Format</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesView;

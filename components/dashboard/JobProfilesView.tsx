import { useState } from 'react';
import { useJobProfiles, JobProfile, JobProfileFormData, EvaluationMethod } from '@/hooks/useJobProfiles';
import { useAuth } from '@/hooks/useAuth';
import { useDepartments } from '@/hooks/useDepartments';
import { useRoleAccess } from '@/components/RoleGuard';
import { InlineCreateDepartmentSelect } from '@/components/ui/InlineCreateDepartmentSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Pencil, Trash2, Briefcase, Building2, CheckCircle, XCircle, Info, ExternalLink } from 'lucide-react';
import { SetupStepGuide } from '@/components/dashboard/SetupStepGuide';

const EVALUATION_METHOD_LABELS: Record<EvaluationMethod, string> = {
  hay: 'Hay-Methode',
  korn_ferry: 'Korn Ferry',
  mercer: 'Mercer',
  willis_towers_watson: 'Willis Towers Watson',
  internal: 'Interne Methode',
  other: 'Andere',
};

type EvaluationMethodInfo = {
  title: string;
  summary: string;
  details: string;
  link?: { url: string; label: string };
};

const EVALUATION_METHOD_INFO: Record<EvaluationMethod, EvaluationMethodInfo> = {
  hay: {
    title: 'Hay-Methode',
    summary: 'Punkte-basiertes Bewertungssystem — Industriestandard seit den 1950ern.',
    details:
      'Bewertet die Stelle (nicht die Person) anhand von 3 Hauptfaktoren: Know-how (fachliches und Führungswissen), Problem Solving (Komplexität der Aufgabe) und Accountability (Verantwortung) — plus Arbeitsbedingungen. Output: Hay-Points (typ. 100–2500) → Hay-Grade → Pay Band. Verbreitet in DAX-Konzernen und öffentlichen Verwaltungen.',
    link: {
      url: 'https://en.wikipedia.org/wiki/Hay_Group',
      label: 'Hay Group / Hay-Methode (Wikipedia)',
    },
  },
  korn_ferry: {
    title: 'Korn Ferry',
    summary: 'Modernisierte Hay-Methode (Korn Ferry hat die Hay Group 2015 übernommen).',
    details:
      'Basiert auf der Hay-Methode, ist aber stärker mit Korn Ferrys globalen Gehalts-Benchmark-Daten verzahnt. In der Praxis oft synonym zu "Hay" verwendet. Wenn Sie mit Korn Ferry zusammenarbeiten oder deren Pay-Daten lizenziert haben, ist das hier die richtige Wahl.',
    link: {
      url: 'https://en.wikipedia.org/wiki/Korn_Ferry',
      label: 'Korn Ferry (Wikipedia)',
    },
  },
  mercer: {
    title: 'Mercer IPE (International Position Evaluation)',
    summary: '5-Faktoren-Modell mit weltweit vergleichbaren Position-Classes.',
    details:
      'Bewertet die Stelle anhand von 5 Faktoren: Impact, Communication, Innovation, Knowledge und Risk — jeweils mit mehreren Sub-Faktoren. Output: IPE-Position-Class (typ. 40–90). Beliebt im Mittelstand und bei internationalen Firmen, oft kombiniert mit Mercers Gehalts-Benchmark (Mercer Total Remuneration Survey).',
    link: {
      url: 'https://en.wikipedia.org/wiki/Mercer_(consulting_firm)',
      label: 'Mercer (Wikipedia)',
    },
  },
  willis_towers_watson: {
    title: 'Willis Towers Watson — Global Grading / Job Levelling',
    summary: '7-Faktoren-Modell mit 25 globalen Grades — Standard in Tech-Konzernen.',
    details:
      'Bewertet die Stelle anhand von 7 Faktoren: Functional Knowledge, Business Expertise, Leadership, Problem Solving, Nature of Impact, Area of Impact und Interpersonal Skills. Output: Global Grade 1–25. Häufig in globalen Konzernen mit Matrix-Strukturen und bei Tech-Unternehmen verwendet.',
    link: {
      url: 'https://de.wikipedia.org/wiki/Willis_Towers_Watson',
      label: 'Willis Towers Watson (Wikipedia)',
    },
  },
  internal: {
    title: 'Interne Methode',
    summary: 'Eigenes, im Unternehmen entwickeltes Bewertungsschema.',
    details:
      'Erlaubt — solange Ihre Methodik Art. 4(4) der EU-Richtlinie 2023/970 erfüllt: objektiv, geschlechtsneutral und nachvollziehbar. Klassisch wird hier das 4-Faktoren-Modell der EU genutzt (Kompetenzen / Belastung / Verantwortung / Arbeitsbedingungen) — also genau die Felder, die KlarGehalt oben abfragt. Wichtig: Im Streitfall muss Ihr Schema verteidigt werden — eine externe Anwaltsprüfung (KlarGehalt Add-on) stärkt Ihre defensive Position.',
    link: {
      url: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32023L0970',
      label: 'EU-Richtlinie 2023/970 (EUR-Lex, deutsche Fassung)',
    },
  },
  other: {
    title: 'Andere Methode',
    summary: 'Tarifbasiert oder branchenspezifisches Framework.',
    details:
      'Typische Beispiele: ERA (Entgeltrahmenabkommen Metall- und Elektroindustrie), TVöD (öffentlicher Dienst), TV-L oder branchenspezifische Modelle. Bitte beschreiben Sie unten kurz, welches Modell Sie verwenden — das ist Pflicht aus Art. 16 der EU-Richtlinie und macht Ihren Audit-Trail vollständig.',
  },
};

const scoreLabels = ['—', '1 - Niedrig', '2', '3 - Mittel', '4', '5 - Hoch'];

const ScoreSelect = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (val: number | null) => void;
}) => (
  <div className="grid gap-1.5">
    <Label className="text-xs">{label}</Label>
    <Select
      value={value != null ? String(value) : 'none'}
      onValueChange={(v) => onChange(v === 'none' ? null : parseInt(v))}
    >
      <SelectTrigger className="h-9">
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">— Nicht bewertet —</SelectItem>
        {[1, 2, 3, 4, 5].map((s) => (
          <SelectItem key={s} value={String(s)}>{scoreLabels[s]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const JobProfilesView = () => {
  const { jobProfiles, loading, createJobProfile, updateJobProfile, deleteJobProfile } = useJobProfiles();
  const { user } = useAuth();
  const { departments } = useDepartments();
  const canCreateEntities = useRoleAccess('owner', 'admin', 'hr_manager');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<JobProfile | null>(null);
  const [formData, setFormData] = useState<JobProfileFormData>({
    title: '',
    description: '',
    department_id: null,
    skills_score: null,
    effort_score: null,
    responsibility_score: null,
    working_conditions_score: null,
    evaluation_method: null,
    evaluation_method_notes: null,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      department_id: null,
      skills_score: null,
      effort_score: null,
      responsibility_score: null,
      working_conditions_score: null,
      evaluation_method: null,
      evaluation_method_notes: null,
      is_active: true,
    });
  };

  const withEvaluatorAttribution = (data: JobProfileFormData): JobProfileFormData => ({
    ...data,
    evaluated_by: user?.id ?? null,
    evaluated_by_name: user?.fullName ?? user?.email ?? null,
    last_evaluated_at: new Date().toISOString(),
  });

  const handleCreate = async () => {
    await createJobProfile(withEvaluatorAttribution(formData));
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = (profile: JobProfile) => {
    setSelectedProfile(profile);
    setFormData({
      title: profile.title,
      description: profile.description || '',
      department_id: profile.department_id,
      skills_score: profile.skills_score,
      effort_score: profile.effort_score,
      responsibility_score: profile.responsibility_score,
      working_conditions_score: profile.working_conditions_score,
      evaluation_method: profile.evaluation_method,
      evaluation_method_notes: profile.evaluation_method_notes,
      is_active: profile.is_active,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedProfile) return;
    await updateJobProfile(selectedProfile.id, withEvaluatorAttribution(formData));
    setIsEditOpen(false);
    setSelectedProfile(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedProfile) return;
    await deleteJobProfile(selectedProfile.id);
    setIsDeleteOpen(false);
    setSelectedProfile(null);
  };

  const getDeptName = (deptId: string | null) => {
    if (!deptId) return '—';
    return departments.find(d => d.id === deptId)?.name || '—';
  };

  const getCompositeLabel = (profile: JobProfile): string => {
    if (profile.composite_score == null || profile.composite_score === 0) {
      const scores = [profile.skills_score, profile.effort_score, profile.responsibility_score, profile.working_conditions_score];
      if (scores.every((s) => s == null)) return '—';
    }
    return `${profile.composite_score ?? 0} / 20`;
  };

  const FormFields = () => (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid gap-2">
        <Label htmlFor="title">Titel *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="z.B. Software Engineer"
        />
      </div>
      <div className="grid gap-2">
        <Label>Abteilung</Label>
        <InlineCreateDepartmentSelect
          value={formData.department_id}
          onChange={(id) => setFormData({ ...formData, department_id: id })}
          canCreate={canCreateEntities}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Kurze Beschreibung der Position"
          rows={2}
        />
      </div>

      {/* EU Directive Scores (Article 4.4) */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <p className="text-sm font-semibold mb-1">EU-Richtlinie Art. 4.4 — Bewertungskriterien</p>
        <p className="text-xs text-muted-foreground mb-3">
          Bewerten Sie die objektiven Kriterien für gleichwertige Arbeit (1-5 Skala).
        </p>
        <div className="grid grid-cols-2 gap-3">
          <ScoreSelect
            label="Kompetenzen"
            value={formData.skills_score}
            onChange={(val) => setFormData({ ...formData, skills_score: val })}
          />
          <ScoreSelect
            label="Belastung"
            value={formData.effort_score}
            onChange={(val) => setFormData({ ...formData, effort_score: val })}
          />
          <ScoreSelect
            label="Verantwortung"
            value={formData.responsibility_score}
            onChange={(val) => setFormData({ ...formData, responsibility_score: val })}
          />
          <ScoreSelect
            label="Arbeitsbedingungen"
            value={formData.working_conditions_score}
            onChange={(val) => setFormData({ ...formData, working_conditions_score: val })}
          />
        </div>

        {/* Composite Score Display */}
        {(() => {
          const scores = [formData.skills_score, formData.effort_score, formData.responsibility_score, formData.working_conditions_score];
          const sum = scores.reduce<number>((acc, s) => acc + (s ?? 0), 0);
          const hasAny = scores.some((s) => s != null);
          if (!hasAny) return null;
          return (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Gesamtpunktzahl:</span>
              <Badge variant="secondary" className="text-sm font-semibold">{sum} / 20</Badge>
            </div>
          );
        })()}
      </div>

      {/* Evaluation Methodology (Art. 16 compliance) */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <p className="text-sm font-semibold mb-1">Bewertungsmethodik</p>
        <p className="text-xs text-muted-foreground mb-3">
          Art. 16 EU-Richtlinie: Die verwendete Bewertungsmethode muss dokumentiert werden.
        </p>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Bewertungsmethode</Label>
            <Select
              value={formData.evaluation_method ?? 'none'}
              onValueChange={(v) => setFormData({
                ...formData,
                evaluation_method: v === 'none' ? null : v as EvaluationMethod,
                evaluation_method_notes: v !== 'other' ? null : formData.evaluation_method_notes,
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Methode auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Nicht angegeben --</SelectItem>
                {(Object.entries(EVALUATION_METHOD_LABELS) as [EvaluationMethod, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.evaluation_method && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-2 text-xs">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {EVALUATION_METHOD_INFO[formData.evaluation_method].title}
                  </p>
                  <p className="text-blue-900 dark:text-blue-100">
                    {EVALUATION_METHOD_INFO[formData.evaluation_method].summary}
                  </p>
                  <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                    {EVALUATION_METHOD_INFO[formData.evaluation_method].details}
                  </p>
                  {EVALUATION_METHOD_INFO[formData.evaluation_method].link && (
                    <a
                      href={EVALUATION_METHOD_INFO[formData.evaluation_method].link!.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline dark:text-blue-300"
                    >
                      {EVALUATION_METHOD_INFO[formData.evaluation_method].link!.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {formData.evaluation_method === 'other' && (
            <div className="grid gap-1.5">
              <Label className="text-xs">Beschreibung der Methode</Label>
              <Input
                value={formData.evaluation_method_notes ?? ''}
                onChange={(e) => setFormData({ ...formData, evaluation_method_notes: e.target.value })}
                placeholder="Beschreiben Sie die verwendete Bewertungsmethode"
              />
            </div>
          )}
        </div>

        {/* Evaluator attribution (read-only display when editing) */}
        {selectedProfile?.evaluated_by && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Bewertet von: <span className="font-medium text-foreground">{selectedProfile.evaluated_by_name ?? 'Unbekannt'}</span>
              {selectedProfile.last_evaluated_at && (
                <>, am <span className="font-medium text-foreground">{new Date(selectedProfile.last_evaluated_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></>
              )}
            </p>
          </div>
        )}
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
          <h2 className="text-2xl font-bold text-foreground">Job-Profile</h2>
          <p className="text-muted-foreground">Verwalten Sie die Stellenprofile Ihres Unternehmens</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Neues Profil
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neues Job-Profil erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie ein neues Stellenprofil mit EU-Bewertungskriterien.
              </DialogDescription>
            </DialogHeader>
            {FormFields()}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Abbrechen</Button>
              <Button variant="hero" onClick={handleCreate} disabled={!formData.title}>Erstellen</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {jobProfiles.length === 0 && (
        <SetupStepGuide
          icon={Building2}
          title="Job-Profile anlegen"
          complianceNote="Job-Profile definieren Vergleichsgruppen für gleiche oder gleichwertige Arbeit nach Art. 4 der EU-Richtlinie. Sie sind die zentrale Grundlage der Gehaltsanalyse."
          stepNumber={3}
          totalSteps={5}
        />
      )}
      {jobProfiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Keine Job-Profile vorhanden</h3>
          <p className="text-muted-foreground text-center mb-4">
            Erstellen Sie Ihr erstes Job-Profil, um Gehaltsbänder definieren zu können.
          </p>
          <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Erstes Profil erstellen
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead>Abteilung</TableHead>
                <TableHead>EU-Score (Gesamt)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.title}</TableCell>
                  <TableCell>{getDeptName(profile.department_id)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {getCompositeLabel(profile)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {profile.is_active ? (
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
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(profile)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedProfile(profile); setIsDeleteOpen(true); }}
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
            <DialogTitle>Job-Profil bearbeiten</DialogTitle>
            <DialogDescription>Aktualisieren Sie die Details des Stellenprofils.</DialogDescription>
          </DialogHeader>
          <FormFields />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Abbrechen</Button>
            <Button variant="hero" onClick={handleUpdate} disabled={!formData.title}>Speichern</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Job-Profil löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie das Profil &quot;{selectedProfile?.title}&quot; löschen möchten?
              Alle zugehörigen Gehaltsbänder werden ebenfalls gelöscht.
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
    </div>
  );
};

export default JobProfilesView;

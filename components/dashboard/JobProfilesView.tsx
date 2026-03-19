import { useState } from 'react';
import { useJobProfiles, JobProfile, JobProfileFormData } from '@/hooks/useJobProfiles';
import { useDepartments } from '@/hooks/useDepartments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Plus, Pencil, Trash2, Briefcase, CheckCircle, XCircle } from 'lucide-react';

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
  const { departments } = useDepartments();
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
      is_active: true,
    });
  };

  const handleCreate = async () => {
    await createJobProfile(formData);
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
      is_active: profile.is_active,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedProfile) return;
    await updateJobProfile(selectedProfile.id, formData);
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

  const getAvgScore = (profile: JobProfile): string => {
    const scores = [profile.skills_score, profile.effort_score, profile.responsibility_score, profile.working_conditions_score].filter((s): s is number => s != null);
    if (scores.length === 0) return '—';
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
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
        <Select
          value={formData.department_id || 'none'}
          onValueChange={(value) => setFormData({ ...formData, department_id: value === 'none' ? null : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Keine —</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            <FormFields />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Abbrechen</Button>
              <Button variant="hero" onClick={handleCreate} disabled={!formData.title}>Erstellen</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                <TableHead>EU-Score (Ø)</TableHead>
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {getAvgScore(profile)}
                    </span>
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

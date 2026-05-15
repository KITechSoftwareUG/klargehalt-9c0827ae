'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Scale,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Pencil,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRoleAccess } from '@/components/RoleGuard';
import AccessDenied from '@/components/dashboard/AccessDenied';
import { useDepartments } from '@/hooks/useDepartments';
import { useJobLevels } from '@/hooks/useJobLevels';
import { useJobProfiles, usePayBands, type JobProfile, type PayBand } from '@/hooks/useJobProfiles';
import { PayBandFormModal } from '@/components/dashboard/setup/PayBandFormModal';
import { JobProfileFormModal } from '@/components/dashboard/setup/JobProfileFormModal';

// ─── Cell formatting ──────────────────────────────────────────────────────────

function formatBandRange(min: number, max: number, currency: string): string {
  const fmt = (n: number): string =>
    n >= 10000
      ? `${Math.round(n / 1000)}k`
      : new Intl.NumberFormat('de-DE').format(n);
  let sym: string;
  switch (currency) {
    case 'EUR': sym = '€'; break;
    case 'USD': sym = '$'; break;
    case 'CHF': sym = 'CHF'; break;
    case 'GBP': sym = '£'; break;
    default: sym = currency;
  }
  return `${fmt(min)}–${fmt(max)} ${sym}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CellState {
  band: PayBand | null;
  profileId: string;
  levelId: string;
}

// ─── Prerequisite empty state ─────────────────────────────────────────────────

function PrerequisiteEmptyState({
  missingDepartments,
  missingLevels,
}: {
  missingDepartments: boolean;
  missingLevels: boolean;
}) {
  const items: string[] = [];
  if (missingDepartments) items.push('Abteilungen');
  if (missingLevels) items.push('Karrierestufen');

  return (
    <Card className="border border-amber-200 bg-amber-50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Struktur zuerst anlegen
          </h3>
          <p className="text-sm text-slate-600 max-w-sm">
            Bevor du Job-Profile und Gehaltsbänder anlegen kannst, werden{' '}
            <span className="font-medium">{items.join(' und ')}</span> benötigt. Das ist die
            Grundlage für die Vergleichbarkeit nach Art.&nbsp;9&nbsp;&amp;&nbsp;10 EU-Richtlinie 2023/970.
          </p>
        </div>
        <Link href="/einrichtung/struktur">
          <Button variant="default">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Phase 1: Struktur
          </Button>
        </Link>
      </CardContent>
    </Card>
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
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

// ─── Toolbar summary ──────────────────────────────────────────────────────────

interface ToolbarProps {
  profileCount: number;
  bandCount: number;
  gapCount: number;
  showAllProfiles: boolean;
  onToggleShowAll: () => void;
  onAddProfile: () => void;
}

function MatrixToolbar({
  profileCount,
  bandCount,
  gapCount,
  showAllProfiles,
  onToggleShowAll,
  onAddProfile,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-xs font-medium">
          <Building2 className="mr-1 h-3 w-3" />
          {profileCount} {profileCount === 1 ? 'Profil' : 'Profile'}
        </Badge>
        <Badge variant="secondary" className="text-xs font-medium">
          <Scale className="mr-1 h-3 w-3" />
          {bandCount} {bandCount === 1 ? 'Band' : 'Bänder'}
        </Badge>
        {gapCount > 0 && (
          <Badge variant="outline" className="text-xs font-medium border-amber-300 text-amber-700 bg-amber-50">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {gapCount} {gapCount === 1 ? 'Lücke' : 'Lücken'}
          </Badge>
        )}
        {gapCount === 0 && bandCount > 0 && (
          <Badge variant="outline" className="text-xs font-medium border-emerald-300 text-emerald-700 bg-emerald-50">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Vollständig
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {profileCount > 0 && (
          <Button variant="outline" size="sm" onClick={onToggleShowAll}>
            {showAllProfiles ? 'Nur mit Bändern' : 'Alle Profile'}
          </Button>
        )}
        <Button variant="default" size="sm" onClick={onAddProfile}>
          <Plus className="mr-1.5 h-4 w-4" />
          Neues Profil
        </Button>
      </div>
    </div>
  );
}

// ─── Matrix cell ──────────────────────────────────────────────────────────────

interface MatrixCellProps {
  band: PayBand | null;
  profileId: string;
  levelId: string;
  onCellClick: (cell: CellState) => void;
}

function MatrixCell({ band, profileId, levelId, onCellClick }: MatrixCellProps) {
  const cell: CellState = { band, profileId, levelId };

  if (band) {
    return (
      <button
        onClick={() => onCellClick(cell)}
        className="group w-full h-full min-h-[3rem] flex items-center justify-center gap-1 px-2 py-2 rounded-md bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-colors text-center"
        title="Band bearbeiten"
        aria-label={`Gehaltsband bearbeiten: ${formatBandRange(band.min_salary, band.max_salary, band.currency)}`}
      >
        <span className="text-xs font-semibold text-emerald-800 leading-tight">
          {formatBandRange(band.min_salary, band.max_salary, band.currency)}
        </span>
        <Pencil className="h-3 w-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </button>
    );
  }

  return (
    <button
      onClick={() => onCellClick(cell)}
      className="group w-full h-full min-h-[3rem] flex items-center justify-center px-2 py-2 rounded-md border border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5 transition-colors"
      title="Band anlegen"
      aria-label="Gehaltsband anlegen"
    >
      <Plus className="h-4 w-4 text-slate-300 group-hover:text-primary/60 transition-colors" />
    </button>
  );
}

// ─── Department section ───────────────────────────────────────────────────────

interface DeptSectionProps {
  departmentName: string;
  profiles: JobProfile[];
  levels: { id: string; name: string; rank: number }[];
  bandMap: Map<string, PayBand>;
  onCellClick: (cell: CellState) => void;
  onEditProfile: (profile: JobProfile) => void;
}

function DepartmentSection({
  departmentName,
  profiles,
  levels,
  bandMap,
  onCellClick,
  onEditProfile,
}: DeptSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      {/* Section header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 border-y border-slate-200 hover:bg-slate-100 transition-colors text-left"
        aria-expanded={!collapsed}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
        )}
        <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-slate-700">{departmentName}</span>
        <Badge variant="secondary" className="text-xs ml-1">
          {profiles.length}
        </Badge>
      </button>

      {/* Rows */}
      {!collapsed && (
        <div>
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors"
            >
              {/* Profile name — sticky left on desktop */}
              <div className="flex-shrink-0 w-48 md:w-56 lg:w-64 flex items-center gap-2 px-3 py-2 border-r border-slate-100">
                <Building2 className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                <span className="text-sm text-slate-800 truncate flex-1" title={profile.title}>
                  {profile.title}
                </span>
                <button
                  onClick={() => onEditProfile(profile)}
                  className="h-6 w-6 flex items-center justify-center rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Profil bearbeiten"
                  aria-label={`Profil bearbeiten: ${profile.title}`}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>

              {/* Level cells */}
              <div className="flex flex-1 min-w-0">
                {levels.map((level) => {
                  const key = `${profile.id}::${level.id}`;
                  const band = bandMap.get(key) ?? null;
                  return (
                    <div
                      key={level.id}
                      className="flex-1 min-w-[7rem] p-1.5 border-r border-slate-100 last:border-r-0"
                    >
                      <MatrixCell
                        band={band}
                        profileId={profile.id}
                        levelId={level.id}
                        onCellClick={onCellClick}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mobile stack view ─────────────────────────────────────────────────────────

interface MobileProfileCardProps {
  profile: JobProfile;
  departmentName: string;
  levels: { id: string; name: string; rank: number }[];
  bandMap: Map<string, PayBand>;
  onCellClick: (cell: CellState) => void;
  onEditProfile: (profile: JobProfile) => void;
}

function MobileProfileCard({
  profile,
  departmentName,
  levels,
  bandMap,
  onCellClick,
  onEditProfile,
}: MobileProfileCardProps) {
  return (
    <Card className="border border-slate-200 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{profile.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{departmentName}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 flex-shrink-0"
            onClick={() => onEditProfile(profile)}
            aria-label={`Profil bearbeiten: ${profile.title}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="divide-y divide-slate-100">
          {levels.map((level) => {
            const key = `${profile.id}::${level.id}`;
            const band = bandMap.get(key) ?? null;
            return (
              <div key={level.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {level.rank}
                </div>
                <span className="text-sm text-slate-600 flex-1">{level.name}</span>
                <div className="flex-shrink-0 w-36">
                  <MatrixCell
                    band={band}
                    profileId={profile.id}
                    levelId={level.id}
                    onCellClick={onCellClick}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function VerguetungsMatrixView() {
  const canAccess = useRoleAccess('owner', 'admin', 'hr_manager');

  const { departments, loading: depsLoading } = useDepartments();
  const { jobLevels, loading: levelsLoading } = useJobLevels();
  const { jobProfiles, loading: profilesLoading, fetchJobProfiles } = useJobProfiles();
  const { payBands, loading: bandsLoading, fetchPayBands } = usePayBands();

  // Modal state
  const [payBandModal, setPayBandModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    profileId: string;
    levelId: string;
    band: PayBand | null;
  }>({ open: false, mode: 'create', profileId: '', levelId: '', band: null });

  const [profileModal, setProfileModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    profile: JobProfile | null;
    defaultDepartmentId: string;
  }>({ open: false, mode: 'create', profile: null, defaultDepartmentId: '' });

  // UI state
  const [showAllProfiles, setShowAllProfiles] = useState(false);

  const isLoading = depsLoading || levelsLoading || profilesLoading || bandsLoading;

  // Sort job levels by rank
  const sortedLevels = useMemo(
    () => [...jobLevels].sort((a, b) => a.rank - b.rank),
    [jobLevels]
  );

  // Build a fast lookup map: "profileId::levelId" → PayBand
  const bandMap = useMemo(() => {
    const m = new Map<string, PayBand>();
    for (const band of payBands) {
      if (band.is_active) {
        const key = `${band.job_profile_id}::${band.job_level_id}`;
        // If multiple bands exist for the same key, keep the most recent effective_from
        const existing = m.get(key);
        if (!existing || band.effective_from > existing.effective_from) {
          m.set(key, band);
        }
      }
    }
    return m;
  }, [payBands]);

  // Department → profiles mapping
  const departmentMap = useMemo(() => {
    const m = new Map<string, { name: string; profiles: JobProfile[] }>();

    // Initialize known departments
    for (const dept of departments) {
      m.set(dept.id, { name: dept.name, profiles: [] });
    }

    // Group profiles
    for (const profile of jobProfiles) {
      if (!profile.is_active) continue;
      const deptId = profile.department_id ?? '__none__';
      if (!m.has(deptId)) {
        m.set(deptId, { name: 'Ohne Abteilung', profiles: [] });
      }
      m.get(deptId)!.profiles.push(profile);
    }

    return m;
  }, [jobProfiles, departments]);

  // Stats
  const totalProfiles = useMemo(
    () => jobProfiles.filter((p) => p.is_active).length,
    [jobProfiles]
  );
  const totalBands = bandMap.size;
  const gapCount = useMemo(() => {
    let gaps = 0;
    for (const profile of jobProfiles) {
      if (!profile.is_active) continue;
      for (const level of sortedLevels) {
        if (!bandMap.has(`${profile.id}::${level.id}`)) gaps++;
      }
    }
    return gaps;
  }, [jobProfiles, sortedLevels, bandMap]);

  // Filter profiles when showAllProfiles is false
  const filteredDepartmentMap = useMemo(() => {
    if (showAllProfiles) return departmentMap;
    const m = new Map<string, { name: string; profiles: JobProfile[] }>();
    for (const [id, { name, profiles }] of departmentMap) {
      const filtered = profiles.filter((p) =>
        sortedLevels.some((l) => bandMap.has(`${p.id}::${l.id}`))
      );
      if (filtered.length > 0) {
        m.set(id, { name, profiles: filtered });
      }
    }
    // If filtering results in empty and there are profiles, show all anyway
    if (m.size === 0 && totalProfiles > 0) return departmentMap;
    return m;
  }, [departmentMap, showAllProfiles, sortedLevels, bandMap, totalProfiles]);

  // Cell click → open appropriate modal
  const handleCellClick = useCallback((cell: CellState) => {
    setPayBandModal({
      open: true,
      mode: cell.band ? 'edit' : 'create',
      profileId: cell.profileId,
      levelId: cell.levelId,
      band: cell.band,
    });
  }, []);

  const handlePayBandSaved = useCallback(async () => {
    await fetchPayBands();
  }, [fetchPayBands]);

  const handleProfileSaved = useCallback(async () => {
    await fetchJobProfiles();
  }, [fetchJobProfiles]);

  const handleEditProfile = useCallback((profile: JobProfile) => {
    setProfileModal({
      open: true,
      mode: 'edit',
      profile,
      defaultDepartmentId: profile.department_id ?? '',
    });
  }, []);

  if (!canAccess) {
    return <AccessDenied />;
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Prerequisite check
  const missingDepartments = departments.length === 0;
  const missingLevels = sortedLevels.length === 0;
  if (missingDepartments || missingLevels) {
    return (
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
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
              2
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Phase 2: Vergütung</h1>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-2xl">
                Lege Tätigkeitsprofile und die zugehörigen Gehaltsbänder an.
              </p>
            </div>
          </div>
        </div>
        <PrerequisiteEmptyState
          missingDepartments={missingDepartments}
          missingLevels={missingLevels}
        />
      </div>
    );
  }

  const canProceed = totalProfiles >= 1;

  // Collect all groups for rendering
  const departmentGroups = [...filteredDepartmentMap.entries()].filter(
    ([, { profiles }]) => profiles.length > 0
  );

  const allActiveProfiles = jobProfiles.filter((p) => p.is_active);

  return (
    <div className="space-y-6 max-w-5xl">
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
            2
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Phase 2: Vergütung</h1>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-2xl">
              Lege Tätigkeitsprofile und die zugehörigen Gehaltsbänder an. Die Matrix zeigt dir auf
              einen Blick, wo Lücken sind — jede Lücke ist eine Kombination aus Profil und
              Karrierestufe ohne dokumentiertes Band.
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <MatrixToolbar
        profileCount={totalProfiles}
        bandCount={totalBands}
        gapCount={gapCount}
        showAllProfiles={showAllProfiles || totalProfiles === 0}
        onToggleShowAll={() => setShowAllProfiles((v) => !v)}
        onAddProfile={() =>
          setProfileModal({ open: true, mode: 'create', profile: null, defaultDepartmentId: '' })
        }
      />

      {/* Empty profile state */}
      {totalProfiles === 0 && (
        <Card className="border border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                Noch keine Job-Profile angelegt
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Lege dein erstes Tätigkeitsprofil an — zum Beispiel &quot;Software Engineer&quot;
                oder &quot;HR Manager&quot;. Danach kannst du für jede Karrierestufe ein
                Gehaltsband hinterlegen.
              </p>
            </div>
            <Button
              variant="default"
              onClick={() =>
                setProfileModal({
                  open: true,
                  mode: 'create',
                  profile: null,
                  defaultDepartmentId: '',
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Erstes Profil anlegen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Desktop matrix (md+) */}
      {totalProfiles > 0 && (
        <div className="hidden md:block">
          <Card className="border border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              {/* Matrix header row */}
              <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
                <div className="flex-shrink-0 w-48 md:w-56 lg:w-64 flex items-center px-3 py-2.5 border-r border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Profil
                  </span>
                </div>
                <div className="flex flex-1 min-w-0">
                  {sortedLevels.map((level) => (
                    <div
                      key={level.id}
                      className="flex-1 min-w-[7rem] px-2 py-2.5 border-r border-slate-200 last:border-r-0 text-center"
                    >
                      <div className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-0.5">
                        {level.rank}
                      </div>
                      <p className="text-xs font-medium text-slate-700 truncate leading-tight">
                        {level.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department sections */}
              {departmentGroups.map(([deptId, { name, profiles }]) => (
                <DepartmentSection
                  key={deptId}
                  departmentName={name}
                  profiles={profiles}
                  levels={sortedLevels}
                  bandMap={bandMap}
                  onCellClick={handleCellClick}
                  onEditProfile={handleEditProfile}
                />
              ))}

              {departmentGroups.length === 0 && totalProfiles > 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  Alle Profile haben mindestens ein Band. Aktiviere &quot;Alle Profile&quot;, um sie anzuzeigen.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile stack (< md) */}
      {totalProfiles > 0 && (
        <div className="md:hidden space-y-3">
          {allActiveProfiles.map((profile) => {
            const deptId = profile.department_id ?? '__none__';
            const deptName = departmentMap.get(deptId)?.name ?? 'Ohne Abteilung';
            const hasBands = sortedLevels.some((l) => bandMap.has(`${profile.id}::${l.id}`));
            if (!showAllProfiles && !hasBands) return null;
            return (
              <MobileProfileCard
                key={profile.id}
                profile={profile}
                departmentName={deptName}
                levels={sortedLevels}
                bandMap={bandMap}
                onCellClick={handleCellClick}
                onEditProfile={handleEditProfile}
              />
            );
          })}
        </div>
      )}

      {/* Footer CTA */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="text-sm text-slate-500">
          {canProceed ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Profile angelegt — weiter zu Phase 3
            </span>
          ) : (
            <span>Lege mind. 1 Job-Profil an, um fortzufahren</span>
          )}
        </div>
        <Link href="/einrichtung">
          <Button disabled={!canProceed} variant={canProceed ? 'default' : 'outline'}>
            Weiter zu Phase 3 (Mitarbeiter)
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Pay Band Modal */}
      <PayBandFormModal
        mode={payBandModal.mode}
        payBand={payBandModal.band ?? undefined}
        jobProfileId={payBandModal.profileId}
        jobLevelId={payBandModal.levelId}
        open={payBandModal.open}
        onOpenChange={(open) => setPayBandModal((s) => ({ ...s, open }))}
        onSaved={handlePayBandSaved}
      />

      {/* Job Profile Modal */}
      <JobProfileFormModal
        mode={profileModal.mode}
        jobProfile={profileModal.profile ?? undefined}
        defaultDepartmentId={profileModal.defaultDepartmentId}
        departments={departments}
        open={profileModal.open}
        onOpenChange={(open) => setProfileModal((s) => ({ ...s, open }))}
        onSaved={handleProfileSaved}
      />
    </div>
  );
}

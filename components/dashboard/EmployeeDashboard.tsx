'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Briefcase, MessageSquare, ChevronRight, TrendingUp, Award, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInfoRequests } from '@/hooks/useInfoRequests';
import { InfoRequestsView } from '@/components/dashboard/InfoRequestsView';

type EmployeeSection = 'home' | 'my-profile' | 'my-level' | 'my-requests';

const JOB_LEVEL_LABELS: Record<string, string> = {
    junior: 'Junior',
    mid: 'Specialist',
    senior: 'Senior',
    lead: 'Lead',
    principal: 'Principal',
    director: 'Director',
};

/**
 * EmployeeDashboard
 * Shown to users with the `employee` role.
 * Gives access only to: own profile, band position (anonymised), own requests.
 */
export default function EmployeeDashboard() {
    const { user, role, supabase } = useAuth();
    const [section, setSection] = useState<EmployeeSection>('home');
    const [employeeData, setEmployeeData] = useState<any>(null);
    const [jobProfile, setJobProfile] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchMyData = async () => {
            if (!user) return;
            setLoadingData(true);
            try {
                // Fetch own employee record (RLS ensures only own row is returned)
                const { data: emp } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                setEmployeeData(emp);

                if (emp?.job_profile_id) {
                    const { data: jp } = await supabase
                        .from('job_profiles')
                        .select('title, description, employment_type')
                        .eq('id', emp.job_profile_id)
                        .maybeSingle();
                    setJobProfile(jp);
                }
            } catch (e) {
                console.error('Error loading employee data:', e);
            } finally {
                setLoadingData(false);
            }
        };

        fetchMyData();
    }, [user, supabase]);

    const renderSection = () => {
        switch (section) {
            case 'my-profile':
                return <MyProfileSection employee={employeeData} jobProfile={jobProfile} loading={loadingData} />;
            case 'my-level':
                return <MyLevelSection employee={employeeData} jobProfile={jobProfile} loading={loadingData} />;
            case 'my-requests':
                return <InfoRequestsView />;
            default:
                return <EmployeeHome
                    employee={employeeData}
                    jobProfile={jobProfile}
                    loading={loadingData}
                    onNavigate={setSection}
                />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Role Badge */}
            <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1">
                    Mitarbeiter-Portal
                </Badge>
            </div>

            {/* Sub-navigation */}
            <div className="flex gap-2 border-b border-slate-200 pb-0">
                {[
                    { key: 'home', label: 'Übersicht', icon: User },
                    { key: 'my-profile', label: 'Mein Profil', icon: Briefcase },
                    { key: 'my-level', label: 'Mein Niveau', icon: TrendingUp },
                    { key: 'my-requests', label: 'Meine Anfragen', icon: MessageSquare },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setSection(key as EmployeeSection)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${section === key
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>

            <div>{renderSection()}</div>
        </div>
    );
}

// ---- Sub-sections ----

function EmployeeHome({ employee, jobProfile, loading, onNavigate }: any) {
    if (loading) return <LoadingSkeleton />;

    const cards = [
        {
            icon: User,
            title: 'Mein Profil',
            description: employee
                ? `${employee.first_name} ${employee.last_name} • ${employee.department || 'Keine Abteilung'}`
                : 'Ihr Profil wurde noch nicht angelegt',
            action: 'my-profile' as const,
            color: 'from-blue-500 to-indigo-600',
        },
        {
            icon: Award,
            title: 'Mein Entgeltband',
            description: employee?.job_level
                ? `Sie befinden sich auf Level: ${JOB_LEVEL_LABELS[employee.job_level] || employee.job_level}`
                : 'Noch kein Level zugewiesen',
            action: 'my-level' as const,
            color: 'from-emerald-500 to-teal-600',
        },
        {
            icon: MessageSquare,
            title: 'Auskunftsanfragen',
            description: 'Stellen Sie Anfragen zur Gehaltstransparenz gemäß EntgTranspG',
            action: 'my-requests' as const,
            color: 'from-violet-500 to-purple-600',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    Willkommen, {employee?.first_name || 'Mitarbeiter*in'} 👋
                </h2>
                <p className="text-slate-500 mt-1">
                    Ihr persönliches Gehaltstransparenz-Portal. Hier sehen Sie Ihre Daten und können Auskünfte anfordern.
                </p>
            </div>

            {/* Info Notice */}
            <div className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-800">
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                <p>Gemäß <strong>EntgTranspG §10</strong> haben Sie das Recht auf Auskunft über Gehaltskriterien und Entgeltbänder in Ihrer Beschäftigungskategorie.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {cards.map(({ icon: Icon, title, description, action, color }) => (
                    <button
                        key={action}
                        onClick={() => onNavigate(action)}
                        className="group text-left p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200"
                    >
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform`}>
                            <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
                        <div className="flex items-center gap-1 mt-4 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            Öffnen <ChevronRight className="h-3 w-3" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

function MyProfileSection({ employee, jobProfile, loading }: any) {
    if (loading) return <LoadingSkeleton />;
    if (!employee) return (
        <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <User className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="font-medium">Ihr Mitarbeiterprofil wurde noch nicht angelegt.</p>
            <p className="text-sm mt-1">Bitte wenden Sie sich an die HR-Abteilung.</p>
        </div>
    );

    const fields = [
        { label: 'Vorname', value: employee.first_name },
        { label: 'Nachname', value: employee.last_name },
        { label: 'E-Mail', value: employee.email || '—' },
        { label: 'Personalnummer', value: employee.employee_number || '—' },
        { label: 'Abteilung', value: employee.department || '—' },
        { label: 'Standort', value: employee.location || '—' },
        { label: 'Einstellungsdatum', value: employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('de-DE') : '—' },
        { label: 'Jobprofil', value: jobProfile?.title || '—' },
        { label: 'Beschäftigungsart', value: jobProfile?.employment_type === 'full_time' ? 'Vollzeit' : jobProfile?.employment_type === 'part_time' ? 'Teilzeit' : jobProfile?.employment_type || '—' },
    ];

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Mein Profil</h3>
                <p className="text-sm text-slate-500">Ihre gespeicherten Stammdaten (schreibgeschützt)</p>
            </div>
            <dl className="divide-y divide-slate-100">
                {fields.map(({ label, value }) => (
                    <div key={label} className="px-6 py-4 flex items-center justify-between">
                        <dt className="text-sm font-medium text-slate-500 w-48 shrink-0">{label}</dt>
                        <dd className="text-sm text-slate-900 font-medium">{value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function MyLevelSection({ employee, jobProfile, loading }: any) {
    if (loading) return <LoadingSkeleton />;
    if (!employee?.job_level) return (
        <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Award className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="font-medium">Ihnen wurde noch kein Level zugewiesen.</p>
            <p className="text-sm mt-1">Bitte wenden Sie sich an Ihre HR-Abteilung.</p>
        </div>
    );

    const levels = ['junior', 'mid', 'senior', 'lead', 'principal', 'director'];
    const currentIdx = levels.indexOf(employee.job_level);

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900">Mein Entgeltband-Niveau</h3>
                    <p className="text-sm text-slate-500">
                        Gemäß EntgTranspG §10 — anonymisiert, kein Ausschluss auf Einzelpersonen möglich
                    </p>
                </div>
                <div className="p-6 space-y-6">
                    {/* Profile */}
                    {jobProfile && (
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Jobprofil</p>
                            <p className="text-base font-semibold text-slate-900">{jobProfile.title}</p>
                            {jobProfile.description && <p className="text-sm text-slate-600 mt-1">{jobProfile.description}</p>}
                        </div>
                    )}

                    {/* Level ladder */}
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Level-Einordnung</p>
                        <div className="flex items-center gap-0">
                            {levels.map((lvl, idx) => {
                                const isActive = idx === currentIdx;
                                const isPast = idx < currentIdx;
                                return (
                                    <div key={lvl} className="flex items-center flex-1">
                                        <div className={`relative flex flex-col items-center flex-1`}>
                                            <div className={`h-3 w-full ${isPast ? 'bg-emerald-500' : isActive ? 'bg-emerald-500' : 'bg-slate-200'
                                                } ${idx === 0 ? 'rounded-l-full' : ''} ${idx === levels.length - 1 ? 'rounded-r-full' : ''}`} />
                                            {isActive && (
                                                <div className="absolute -top-4 flex flex-col items-center">
                                                    <div className="h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-md" />
                                                </div>
                                            )}
                                            <p className={`mt-5 text-xs ${isActive ? 'font-bold text-emerald-700' : 'text-slate-400'}`}>
                                                {JOB_LEVEL_LABELS[lvl]}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Band position note */}
                    <div className="flex gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-800">
                        <Info className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Sie befinden sich auf Level: {JOB_LEVEL_LABELS[employee.job_level]}</p>
                            <p className="mt-0.5 text-emerald-700">Für genaue Informationen zu Ihrem Entgeltband und Ihrer Eingruppierung nutzen Sie die Auskunftsanfragen.</p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => { }}
                    >
                        <MessageSquare className="h-4 w-4" />
                        Auskunft zur Bandposition anfordern
                    </Button>
                </div>
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-slate-100" />
            ))}
        </div>
    );
}

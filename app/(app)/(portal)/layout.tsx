'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useSetupReadiness } from '@/hooks/useSetupReadiness';
import Image from 'next/image';
import Link from 'next/link';
import {
    Shield, Users, Settings, LogOut, CreditCard,
    Building2, Scale,
    Layers, ShieldCheck, Building, KeyRound, Menu, FileCheck,
    Sparkles, Handshake, Bot, Lock, Rocket,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { TrialBanner, TrialHeaderBadge } from '@/components/TrialBanner';
import { WelcomeModal } from '@/components/WelcomeModal';
import { MfaBanner } from '@/components/MfaBanner';
import TrialExpiredOverlay from '@/components/dashboard/TrialExpiredOverlay';

type AppView =
    | 'dashboard'
    | 'einrichtung'
    | 'mitarbeiter'
    | 'gehaltsbaender'
    | 'jobprofile'
    | 'karrierestufen'
    | 'abteilungen'
    | 'mein-gehalt'
    | 'abrechnung'
    | 'einstellungen'
    | 'audit'
    | 'compliance-workflow'
    | 'ki-agenten';

const ROLE_LABELS: Record<string, { label: string; dotColor: string }> = {
    owner:      { label: 'Administrator', dotColor: 'bg-emerald-400' },
    admin:      { label: 'Administrator', dotColor: 'bg-emerald-400' },
    hr_manager: { label: 'HR-Manager',    dotColor: 'bg-amber-400'   },
    employee:   { label: 'Mitarbeiter',   dotColor: 'bg-blue-400'    },
    lawyer:     { label: 'Anwalt',        dotColor: 'bg-purple-400'  },
};

const VIEW_TO_PATH: Record<AppView, string> = {
    dashboard:             '/dashboard',
    einrichtung:           '/einrichtung',
    mitarbeiter:           '/mitarbeiter',
    gehaltsbaender:        '/gehaltsbaender',
    jobprofile:            '/jobprofile',
    karrierestufen:        '/karrierestufen',
    abteilungen:           '/abteilungen',
    'mein-gehalt':         '/mein-gehalt',
    abrechnung:            '/abrechnung',
    einstellungen:         '/einstellungen',
    audit:                 '/audit',
    'compliance-workflow': '/compliance-workflow',
    'ki-agenten':          '/ki-agenten',
};

type NavItem = {
    label: string;
    icon: React.ElementType;
    view?: AppView;
    group: string;
    adminOnly?: boolean;
    disabled?: boolean;
    badge?: string;
    trialLocked?: boolean;
    proLocked?: boolean;
};

const MAIN_NAV: NavItem[] = [
    // Einrichtung (geführter Setup-Hub — erste Anlaufstelle)
    { label: 'Einrichtung',    icon: Rocket,     view: 'einrichtung',    group: 'Einrichtung' },
    // Strukturdaten
    { label: 'Abteilungen',    icon: Building,   view: 'abteilungen',    group: 'Strukturdaten' },
    { label: 'Karrierestufen', icon: Layers,     view: 'karrierestufen', group: 'Strukturdaten' },
    { label: 'Job-Profile',    icon: Building2,  view: 'jobprofile',     group: 'Strukturdaten' },
    { label: 'Gehaltsbänder',  icon: Scale,      view: 'gehaltsbaender', group: 'Strukturdaten' },
    // Mitarbeiter
    { label: 'Mitarbeiter',    icon: Users,      view: 'mitarbeiter',    group: 'Mitarbeiter' },
    // Compliance-Kern
    { label: 'Dashboard',              icon: ShieldCheck, view: 'dashboard',           group: 'Compliance' },
    { label: 'Compliance-Prüfungen',   icon: FileCheck,   view: 'compliance-workflow', group: 'Compliance', proLocked: true },
    // Premium & Services
    { label: 'Anwaltsprüfung',         icon: Scale,       view: 'compliance-workflow', group: 'Premium & Services', adminOnly: true, proLocked: true },
    { label: 'Abrechnung & Plan',      icon: CreditCard,  view: 'abrechnung',          group: 'Premium & Services', adminOnly: true },
    { label: 'Partnerschaften',         icon: Handshake,   disabled: true, badge: 'Bald verfügbar', group: 'Premium & Services', adminOnly: true },
    // KI-Agenten
    { label: 'KI-Agenten',  icon: Bot, view: 'ki-agenten', group: 'KI-Agenten', adminOnly: false, trialLocked: true, proLocked: true },
    // Konto
    { label: 'Einstellungen',  icon: Settings, view: 'einstellungen', group: 'Konto', adminOnly: true },
    { label: 'Audit-Log',      icon: Shield,   view: 'audit',         group: 'Konto', adminOnly: true },
];

const LAWYER_NAV: NavItem[] = [
    { label: 'Compliance-Prüfungen', icon: FileCheck, view: 'compliance-workflow', group: 'Anwalt' },
    { label: 'Audit-Log',            icon: Shield,    view: 'audit',               group: 'Anwalt' },
];

function getActiveView(pathname: string): AppView {
    const clean = pathname.replace(/\/$/, '');
    for (const [view, path] of Object.entries(VIEW_TO_PATH)) {
        if (clean === path) return view as AppView;
    }
    return 'dashboard';
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, role, selfReportedRole, profile, loading, isLoaded, orgId, signOut, isSuperAdmin } = useAuth();
    const { isExpired, isTrialing, tier } = useSubscription();
    const isBasis = tier === 'basis';
    const setupReadiness = useSetupReadiness();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    useEffect(() => {
        if (isLoaded && !loading && !orgId) {
            router.push('/onboarding');
        }
    }, [isLoaded, loading, orgId, router]);

    if (!isLoaded || loading || !orgId) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const displayRoleKey = selfReportedRole ?? (role === 'owner' ? 'admin' : role);
    const roleBadge = ROLE_LABELS[displayRoleKey || 'employee'];
    const activeView = getActiveView(pathname);

    const isAdmin = role === 'admin' || role === 'owner';
    const navItems =
        role === 'lawyer'
            ? LAWYER_NAV
            : MAIN_NAV.filter(item => !(item.adminOnly && !isAdmin));

    const navGroups = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
        const g = item.group;
        return { ...acc, [g]: [...(acc[g] ?? []), item] };
    }, {});

    const currentLabel =
        role === 'employee'
            ? 'Mein Portal'
            : (navItems.find(i => i.view === activeView)?.label ?? 'Dashboard');

    const SidebarNav = () => (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 px-6 py-7">
                <Image src="/brandname.svg" alt="klargehalt" width={120} height={18} className="h-5 w-auto invert" />
            </div>

            {role !== 'employee' && (
                <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
                    {Object.entries(navGroups).map(([groupName, items]) => {
                        const isPremium = groupName === 'Premium & Services';
                        const isAI = groupName === 'KI-Agenten';
                        return (
                            <div key={groupName}>
                                <p className={`px-4 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
                                    isPremium ? 'text-amber-400/80' : isAI ? 'text-purple-400/80' : 'text-slate-500'
                                }`}>
                                    {isPremium && <Sparkles className="h-3 w-3" />}
                                    {isAI && <Bot className="h-3 w-3" />}
                                    {groupName}
                                </p>
                                <div className="space-y-0.5">
                                    {items.map(item => {
                                        const isLockedByTrial = item.trialLocked && isTrialing;
                                        const isLockedByTier = item.proLocked && isBasis;

                                        if (item.disabled) {
                                            return (
                                                <div
                                                    key={item.label}
                                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium opacity-40 cursor-not-allowed text-slate-400"
                                                >
                                                    <item.icon className="h-4 w-4 shrink-0" />
                                                    <span className="truncate flex-1">{item.label}</span>
                                                    {item.badge && (
                                                        <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full shrink-0">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        }

                                        if (isLockedByTrial) {
                                            return (
                                                <Link
                                                    key={item.label}
                                                    href={item.view ? VIEW_TO_PATH[item.view] : '#'}
                                                    onClick={() => setMobileNavOpen(false)}
                                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-purple-300/50 hover:bg-purple-400/5 hover:text-purple-200/60 transition-all duration-200"
                                                >
                                                    <item.icon className="h-4 w-4 shrink-0" />
                                                    <span className="truncate flex-1">{item.label}</span>
                                                    <Lock className="h-3 w-3 shrink-0 text-purple-400/60" />
                                                </Link>
                                            );
                                        }

                                        if (isLockedByTier) {
                                            return (
                                                <Link
                                                    key={item.label}
                                                    href="/abrechnung"
                                                    onClick={() => setMobileNavOpen(false)}
                                                    title="Im Professional-Plan enthalten"
                                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-amber-300/50 hover:bg-amber-400/5 hover:text-amber-200/60 transition-all duration-200"
                                                >
                                                    <item.icon className="h-4 w-4 shrink-0" />
                                                    <span className="truncate flex-1">{item.label}</span>
                                                    <Lock className="h-3 w-3 shrink-0 text-amber-400/60" />
                                                </Link>
                                            );
                                        }

                                        const setupBadge =
                                            item.view === 'einrichtung' && !setupReadiness.isLoading
                                                ? setupReadiness.isAnalysisReady
                                                    ? { text: '✓', tone: 'emerald' as const }
                                                    : setupReadiness.overallPercentage > 0
                                                        ? { text: `${setupReadiness.overallPercentage}%`, tone: 'amber' as const }
                                                        : { text: 'Start', tone: 'amber' as const }
                                                : null;
                                        const isActive = item.view && activeView === item.view;

                                        return (
                                            <Link
                                                key={item.label}
                                                href={item.view ? VIEW_TO_PATH[item.view] : '#'}
                                                onClick={() => setMobileNavOpen(false)}
                                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                                                    isActive
                                                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                                        : isPremium
                                                            ? 'text-amber-300/70 hover:bg-amber-400/10 hover:text-amber-200'
                                                            : isAI
                                                                ? 'text-purple-300/70 hover:bg-purple-400/10 hover:text-purple-200'
                                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                            >
                                                <item.icon className="h-4 w-4 shrink-0" />
                                                <span className="truncate flex-1">{item.label}</span>
                                                {setupBadge && (
                                                    <span
                                                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums ${
                                                            isActive
                                                                ? 'bg-white/20 text-white'
                                                                : setupBadge.tone === 'emerald'
                                                                    ? 'bg-emerald-500/20 text-emerald-300'
                                                                    : 'bg-amber-500/20 text-amber-300'
                                                        }`}
                                                    >
                                                        {setupBadge.text}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            )}

            {isSuperAdmin && (
                <div className="px-4 pb-2">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Super Admin
                    </p>
                    <Link
                        href="/admin"
                        onClick={() => setMobileNavOpen(false)}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                            pathname === '/admin'
                                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <KeyRound className="h-4 w-4 shrink-0" />
                        <span className="truncate">User Management</span>
                    </Link>
                </div>
            )}

            {role === 'employee' && <div className="flex-1" />}

            <div className="border-t border-white/10 px-4 py-4 mt-auto">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary/80 to-purple-500/80 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                        {(profile?.full_name || user?.firstName)?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-white leading-tight">
                            {profile?.full_name || user?.fullName || user?.firstName || user?.email?.split('@')[0]}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${roleBadge?.dotColor}`} />
                            <span className="text-xs text-slate-400 truncate">{roleBadge?.label}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => void signOut()}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                        title="Abmelden"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    const mainContent = role === 'employee' ? (
        <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Shield className="mx-auto mb-4 h-10 w-10 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">Mitarbeiterzugriff deaktiviert</h2>
            <p className="mt-2 text-sm text-slate-500">
                KlarGehalt ist ein Compliance-Werkzeug für HR, Management und externe Rechtsberater.
                Interne Gehaltstransparenz und Mitarbeiter-Self-Service sind in diesem Produkt nicht aktiviert.
            </p>
        </div>
    ) : children;

    return (
        <div className="min-h-screen bg-slate-50/50">
            <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-[#0F172A] text-white overflow-y-auto hidden lg:block">
                <SidebarNav />
            </aside>

            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetContent side="left" className="w-72 p-0 bg-[#0F172A] text-white overflow-y-auto border-r-0">
                    <SidebarNav />
                </SheetContent>
            </Sheet>

            <main className="lg:pl-72 transition-all duration-300">
                <TrialBanner />
                <MfaBanner />
                {isExpired && <TrialExpiredOverlay />}
                <WelcomeModal />
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl px-4 sm:px-8 py-4">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMobileNavOpen(true)}
                                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                                aria-label="Navigation öffnen"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                                    {currentLabel}
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
                                    {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <TrialHeaderBadge />
                        </div>
                    </div>
                </header>

                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    {mainContent}
                </div>
            </main>
        </div>
    );
}

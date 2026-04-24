'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import Image from 'next/image';
import Link from 'next/link';
import {
    Shield, Users, Settings, LogOut, CreditCard,
    Building2, Scale, LayoutDashboard,
    Layers, ShieldCheck, Building, KeyRound, Menu,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { TrialBanner, TrialHeaderBadge } from '@/components/TrialBanner';
import { WelcomeModal } from '@/components/WelcomeModal';
import { MfaBanner } from '@/components/MfaBanner';
import TrialExpiredOverlay from '@/components/dashboard/TrialExpiredOverlay';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';

type AppView =
    | 'dashboard'
    | 'mitarbeiter'
    | 'gehaltsbaender'
    | 'jobprofile'
    | 'karrierestufen'
    | 'abteilungen'
    | 'mein-gehalt'
    | 'abrechnung'
    | 'einstellungen'
    | 'audit';

const ROLE_LABELS: Record<string, { label: string; dotColor: string }> = {
    admin:      { label: 'Administrator', dotColor: 'bg-emerald-400' },
    hr_manager: { label: 'HR-Manager',    dotColor: 'bg-amber-400'   },
    employee:   { label: 'Mitarbeiter',   dotColor: 'bg-blue-400'    },
    lawyer:     { label: 'Anwalt',        dotColor: 'bg-purple-400'  },
};

const VIEW_TO_PATH: Record<AppView, string> = {
    dashboard:      '/dashboard',
    mitarbeiter:    '/mitarbeiter',
    gehaltsbaender: '/gehaltsbaender',
    jobprofile:     '/jobprofile',
    karrierestufen: '/karrierestufen',
    abteilungen:    '/abteilungen',
    'mein-gehalt':  '/mein-gehalt',
    abrechnung:     '/abrechnung',
    einstellungen:  '/einstellungen',
    audit:          '/audit',
};

type NavItem = {
    label: string;
    icon: React.ElementType;
    view: AppView;
    group: string;
    adminOnly?: boolean;
};

const MAIN_NAV: NavItem[] = [
    // Schritt 1: System befüllen
    { label: 'Abteilungen',    icon: Building,       view: 'abteilungen',    group: 'System aufbauen' },
    { label: 'Karrierestufen', icon: Layers,          view: 'karrierestufen', group: 'System aufbauen' },
    { label: 'Job-Profile',    icon: Building2,       view: 'jobprofile',     group: 'System aufbauen' },
    { label: 'Gehaltsbänder',  icon: Scale,           view: 'gehaltsbaender', group: 'System aufbauen' },
    { label: 'Mitarbeiter',    icon: Users,           view: 'mitarbeiter',    group: 'System aufbauen' },
    // Compliance-Kern
    { label: 'Dashboard',      icon: ShieldCheck,     view: 'dashboard',      group: 'Compliance'      },
    // Admin
    { label: 'Abrechnung',     icon: CreditCard,      view: 'abrechnung',     group: 'Admin', adminOnly: true },
    { label: 'Einstellungen',  icon: Settings,        view: 'einstellungen',  group: 'Admin', adminOnly: true },
    { label: 'Audit-Log',      icon: Shield,          view: 'audit',          group: 'Admin', adminOnly: true },
];

const LAWYER_NAV: NavItem[] = [
    { label: 'Audit-Log', icon: Shield, view: 'audit', group: 'Anwalt' },
];

const SUPER_ADMIN_USER_ID = 'zqf0ih9ji1m1';

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
    const { user, role, loading, isLoaded, orgId, signOut } = useAuth();
    const { isExpired } = useSubscription();
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

    const roleBadge = ROLE_LABELS[role || 'employee'];
    const activeView = getActiveView(pathname);

    const navItems =
        role === 'lawyer'
            ? LAWYER_NAV
            : MAIN_NAV.filter(item => !(item.adminOnly && role !== 'admin'));

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
                    {Object.entries(navGroups).map(([groupName, items]) => (
                        <div key={groupName}>
                            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                {groupName}
                            </p>
                            <div className="space-y-0.5">
                                {items.map(item => (
                                    <Link
                                        key={item.view}
                                        href={VIEW_TO_PATH[item.view]}
                                        onClick={() => setMobileNavOpen(false)}
                                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                                            activeView === item.view
                                                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <item.icon className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            )}

            {user?.id === SUPER_ADMIN_USER_ID && (
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

            {role === 'employee' && (
                <nav className="flex-1 px-4 py-4">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mein Portal</p>
                    <Link
                        href="/mein-gehalt"
                        onClick={() => setMobileNavOpen(false)}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                            activeView === 'mein-gehalt'
                                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <LayoutDashboard className="h-4 w-4 shrink-0" />
                        <span className="truncate">Mein Gehalt</span>
                    </Link>
                </nav>
            )}

            <div className="border-t border-white/10 px-4 py-4 mt-auto">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary/80 to-purple-500/80 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                        {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-white leading-tight">
                            {user?.fullName || user?.firstName || user?.email?.split('@')[0]}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${roleBadge?.dotColor}`} />
                            <span className="text-xs text-slate-400 truncate">{roleBadge?.label}</span>
                        </div>
                    </div>
                    <button
                        onClick={async () => { await signOut(); router.push('/'); }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                        title="Abmelden"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    const mainContent = role === 'employee' ? <EmployeeDashboard /> : children;

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

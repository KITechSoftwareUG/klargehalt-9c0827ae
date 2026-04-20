'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import Image from 'next/image';
import Link from 'next/link';
import {
    Shield, Users, Settings, LogOut, CreditCard,
    BarChart3, Building2, Scale, TrendingUp, MessageSquare,
    LayoutDashboard, Target, Briefcase, User, Building, Layers,
    ShieldCheck, Briefcase as BriefcaseIcon, ClipboardList, Bell as BellIcon,
    Menu, ArrowRight,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { TrialBanner } from '@/components/TrialBanner';
import { MfaBanner } from '@/components/MfaBanner';
import TrialExpiredOverlay from '@/components/dashboard/TrialExpiredOverlay';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';

// ── Role definitions ──────────────────────────────────────────────────────────

type AppRole = 'admin' | 'hr_manager' | 'employee' | 'lawyer';
type HRView = 'overview' | 'employees' | 'job-profiles' | 'pay-bands' | 'reports' | 'settings' | 'audit' | 'requests' | 'pay-equity-hr' | 'pay-equity-mgmt' | 'my-salary' | 'departments' | 'job-levels' | 'billing' | 'compliance' | 'job-postings' | 'joint-assessment' | 'hr-requests' | 'rights-notifications' | 'lawyer-reviews';

const ROLE_LABELS: Record<string, { label: string; color: string; dotColor: string }> = {
    admin: { label: 'Administrator', color: 'text-slate-300', dotColor: 'bg-emerald-400' },
    hr_manager: { label: 'HR-Manager', color: 'text-slate-300', dotColor: 'bg-amber-400' },
    employee: { label: 'Mitarbeiter', color: 'text-slate-300', dotColor: 'bg-blue-400' },
    lawyer: { label: 'Anwalt', color: 'text-slate-300', dotColor: 'bg-purple-400' },
};

// Map view keys to URL paths
const VIEW_TO_PATH: Record<HRView, string> = {
    compliance: '/dashboard',
    overview: '/dashboard/overview',
    employees: '/dashboard/employees',
    'job-profiles': '/dashboard/job-profiles',
    'pay-bands': '/dashboard/pay-bands',
    reports: '/dashboard/reports',
    audit: '/dashboard/audit',
    requests: '/dashboard/requests',
    'pay-equity-hr': '/dashboard/pay-equity-hr',
    'pay-equity-mgmt': '/dashboard/pay-equity-mgmt',
    'my-salary': '/dashboard/my-salary',
    departments: '/dashboard/departments',
    'job-levels': '/dashboard/job-levels',
    billing: '/dashboard/billing',
    settings: '/dashboard/settings',
    'job-postings': '/dashboard/job-postings',
    'joint-assessment': '/dashboard/joint-assessment',
    'hr-requests': '/dashboard/hr-requests',
    'rights-notifications': '/dashboard/rights-notifications',
    'lawyer-reviews': '/dashboard/lawyer-reviews',
};

// Nav items visible per role
const HR_ADMIN_NAV = [
    // ── Compliance ───────────────────────────────────────────────────────────
    { label: 'Compliance Center', icon: ShieldCheck, view: 'compliance' as HRView, group: 'Compliance' },
    { label: 'Gem. Bewertung (Art. 10)', icon: Scale, view: 'joint-assessment' as HRView, group: 'Compliance' },
    { label: 'Stellenanzeigen (Art. 5)', icon: BriefcaseIcon, view: 'job-postings' as HRView, group: 'Compliance' },
    { label: 'Anfragen HR (Art. 7)', icon: ClipboardList, view: 'hr-requests' as HRView, group: 'Compliance' },
    { label: 'Jahresinfo (Art. 7)', icon: BellIcon, view: 'rights-notifications' as HRView, group: 'Compliance' },
    // ── Analytics ────────────────────────────────────────────────────────────
    { label: 'Übersicht', icon: BarChart3, view: 'overview' as HRView, group: 'Analyse' },
    { label: 'Pay-Equity Analyse', icon: LayoutDashboard, view: 'pay-equity-hr' as HRView, group: 'Analyse' },
    { label: 'Management KPIs', icon: Briefcase, view: 'pay-equity-mgmt' as HRView, group: 'Analyse' },
    { label: 'Berichte', icon: TrendingUp, view: 'reports' as HRView, group: 'Analyse' },
    // ── HR-Verwaltung ─────────────────────────────────────────────────────────
    { label: 'Mitarbeiter', icon: Users, view: 'employees' as HRView, group: 'Verwaltung' },
    { label: 'Gehaltscheck', icon: Target, view: 'my-salary' as HRView, group: 'Verwaltung' },
    { label: 'Abteilungen', icon: Building, view: 'departments' as HRView, group: 'Verwaltung' },
    { label: 'Karrierestufen', icon: Layers, view: 'job-levels' as HRView, group: 'Verwaltung' },
    { label: 'Job-Profile', icon: Building2, view: 'job-profiles' as HRView, group: 'Verwaltung' },
    { label: 'Gehaltsbänder', icon: Scale, view: 'pay-bands' as HRView, group: 'Verwaltung' },
    { label: 'Mitarbeiter-Anfragen', icon: MessageSquare, view: 'requests' as HRView, group: 'Verwaltung' },
    // ── Admin ─────────────────────────────────────────────────────────────────
    { label: 'Audit-Log', icon: Shield, view: 'audit' as HRView, group: 'Admin', adminOnly: true },
    { label: 'Abrechnung', icon: CreditCard, view: 'billing' as HRView, group: 'Admin', adminOnly: true },
    { label: 'Einstellungen', icon: Settings, view: 'settings' as HRView, group: 'Admin', adminOnly: true },
] as const;

// Lawyer-specific navigation
const LAWYER_NAV = [
    { label: 'Bewertungen', icon: Scale, view: 'lawyer-reviews' as HRView, group: 'Anwalt' },
    { label: 'Pay-Gap-Berichte', icon: TrendingUp, view: 'reports' as HRView, group: 'Analyse' },
    { label: 'Gem. Bewertungen', icon: Scale, view: 'joint-assessment' as HRView, group: 'Analyse' },
    { label: 'Audit-Log', icon: Shield, view: 'audit' as HRView, group: 'Compliance' },
] as const;

// Derive the active view key from the current pathname
function getActiveViewFromPath(pathname: string): HRView {
    // Strip trailing slash
    const clean = pathname.replace(/\/$/, '') || '/dashboard';
    for (const [view, path] of Object.entries(VIEW_TO_PATH)) {
        if (clean === path) return view as HRView;
    }
    return 'compliance';
}

// Get the label for the current view
function getLabelForPath(pathname: string, navItems: readonly { label: string; view: HRView }[]): string {
    const activeView = getActiveViewFromPath(pathname);
    const found = navItems.find(i => i.view === activeView);
    return found?.label || 'Compliance Center';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, role, loading, isLoaded, orgId, signOut } = useAuth();
    const { isExpired } = useSubscription();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    // Redirect to onboarding if no org (inside useEffect to avoid render-time side effects)
    useEffect(() => {
        if (isLoaded && !loading && !orgId) {
            router.push('/onboarding');
        }
    }, [isLoaded, loading, orgId, router]);

    // Loading state or waiting for redirect
    if (!isLoaded || loading || !orgId) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    // Role badge info
    const roleBadge = ROLE_LABELS[role || 'employee'];

    // Nav items: lawyer gets own nav, filter admin-only for hr_manager
    const visibleNavItems = role === 'lawyer'
        ? [...LAWYER_NAV]
        : HR_ADMIN_NAV.filter(item => {
            if ('adminOnly' in item && item.adminOnly && role !== 'admin') return false;
            return true;
        });

    // Group nav items by group label
    type NavItem = { label: string; icon: typeof Shield; view: HRView; group: string; adminOnly?: boolean };
    const navItems: NavItem[] = visibleNavItems as unknown as NavItem[];
    const navGroups = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
        const g = item.group ?? 'Menu';
        if (!acc[g]) acc[g] = [];
        acc[g] = [...acc[g], item];
        return acc;
    }, {});

    const activeView = getActiveViewFromPath(pathname);

    // Sidebar nav content — shared between desktop aside and mobile Sheet
    const SidebarNav = () => (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-7">
                <Image src="/brandname.svg" alt="klargehalt" width={120} height={18} className="h-5 w-auto invert" />
                <span className="text-2xl font-bold tracking-tight lowercase">klargehalt</span>
            </div>

            {/* Navigation — hidden for employees */}
            {role !== 'employee' && (
                <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto sidebar-scroll">
                    {Object.entries(navGroups).map(([groupName, items]) => (
                        <div key={groupName}>
                            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                {groupName}
                            </p>
                            <div className="space-y-0.5">
                                {items.map((item) => (
                                    <Link
                                        key={item.view}
                                        href={VIEW_TO_PATH[item.view]}
                                        onClick={() => setMobileNavOpen(false)}
                                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${activeView === item.view
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

            {/* Employee: simplified sidebar */}
            {role === 'employee' && (
                <nav className="flex-1 px-4 py-4">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mein Portal</p>
                    <div className="px-4 py-3 text-sm text-slate-400 leading-relaxed">
                        <User className="h-5 w-5 mb-2 text-slate-500" />
                        Ihr persönliches Transparenzportal gemäß EntgTranspG.
                    </div>
                </nav>
            )}

            {/* User Card */}
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
                            {roleBadge && <span className={`h-1.5 w-1.5 rounded-full ${roleBadge.dotColor}`} />}
                            <span className="text-xs text-slate-400 truncate">
                                {roleBadge?.label}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                        title="Abmelden"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    // For employees, always render EmployeeDashboard regardless of sub-route
    const mainContent = role === 'employee' ? <EmployeeDashboard /> : children;

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Desktop Sidebar — hidden on mobile */}
            <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-[#0F172A] text-white overflow-y-auto hidden lg:block">
                <SidebarNav />
            </aside>

            {/* Mobile Sidebar — Sheet drawer */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetContent side="left" className="w-72 p-0 bg-[#0F172A] text-white overflow-y-auto border-r-0">
                    <SidebarNav />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <main className="lg:pl-72 transition-all duration-300">
                <TrialBanner />
                <MfaBanner />
                {isExpired && <TrialExpiredOverlay />}
                {/* Top Header */}
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl px-4 sm:px-8 py-4">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center gap-3">
                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setMobileNavOpen(true)}
                                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                                aria-label="Navigation öffnen"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                                    {role === 'employee'
                                        ? 'Mein Portal'
                                        : getLabelForPath(pathname, visibleNavItems)}
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
                                    {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/book-consulting')}
                            className="group flex items-center gap-3 pl-1 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all bg-white"
                        >
                            {/* Stacked advisor avatars */}
                            <div className="flex -space-x-2">
                                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face" alt="" className="h-7 w-7 rounded-full border-2 border-white object-cover" />
                                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face" alt="" className="h-7 w-7 rounded-full border-2 border-white object-cover" />
                                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face" alt="" className="h-7 w-7 rounded-full border-2 border-white object-cover" />
                            </div>
                            <span className="hidden sm:flex items-center gap-1.5 text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                                <span className="font-medium">Experten sprechen</span>
                                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    {mainContent}
                </div>
            </main>
        </div>
    );
}

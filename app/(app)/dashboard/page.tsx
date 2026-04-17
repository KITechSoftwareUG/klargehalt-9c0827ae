'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
    Shield, Users, Settings, LogOut, CreditCard,
    BarChart3, Building2, Scale, TrendingUp, Bell, MessageSquare,
    LayoutDashboard, Target, Briefcase, User, Building, Layers, Clock,
    ShieldCheck, Briefcase as BriefcaseIcon, ClipboardList, Bell as BellIcon, FileCheck,
    Menu,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

import { TrialBanner } from '@/components/TrialBanner';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { useSubscription } from '@/hooks/useSubscription';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import EmployeesView from '@/components/dashboard/EmployeesView';
import JobProfilesView from '@/components/dashboard/JobProfilesView';
import PayBandsView from '@/components/dashboard/PayBandsView';
import { PayGapReportView } from '@/components/dashboard/PayGapReportView';
import AuditLogsView from '@/components/dashboard/AuditLogsView';
import CompanySetup from '@/components/dashboard/CompanySetup';
import { InfoRequestsView } from '@/components/dashboard/InfoRequestsView';
import PayEquityHRView from '@/components/dashboard/PayEquityHRView';
import PayEquityManagementView from '@/components/dashboard/PayEquityManagementView';
import MySalaryComparisonView from '@/components/dashboard/MySalaryComparisonView';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';
import DepartmentsView from '@/components/dashboard/DepartmentsView';
import JobLevelsView from '@/components/dashboard/JobLevelsView';
import ComplianceCommandCenter from '@/components/dashboard/ComplianceCommandCenter';
import JobPostingsView from '@/components/dashboard/JobPostingsView';
import JointAssessmentView from '@/components/dashboard/JointAssessmentView';
import HRInfoRequestsPanel from '@/components/dashboard/HRInfoRequestsPanel';
import RightsNotificationsPanel from '@/components/dashboard/RightsNotificationsPanel';
import LawyerDashboard from '@/components/dashboard/LawyerDashboard';

// ── Role definitions ──────────────────────────────────────────────────────────

type AppRole = 'admin' | 'hr_manager' | 'employee' | 'lawyer';
type HRView = 'overview' | 'employees' | 'job-profiles' | 'pay-bands' | 'reports' | 'settings' | 'audit' | 'requests' | 'pay-equity-hr' | 'pay-equity-mgmt' | 'my-salary' | 'departments' | 'job-levels' | 'billing' | 'compliance' | 'job-postings' | 'joint-assessment' | 'hr-requests' | 'rights-notifications' | 'lawyer-reviews';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    admin: { label: 'Administrator', color: 'bg-red-50 border-red-200 text-red-700' },
    hr_manager: { label: 'HR-Manager', color: 'bg-amber-50 border-amber-200 text-amber-700' },
    employee: { label: 'Mitarbeiter', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    lawyer: { label: 'Anwalt', color: 'bg-purple-50 border-purple-200 text-purple-700' },
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const router = useRouter();
    const { user, role, loading, isLoaded, orgId, signOut } = useAuth();
    const { isExpired } = useSubscription();
    const [activeView, setActiveView] = useState<HRView>(role === 'lawyer' ? 'lawyer-reviews' : 'compliance');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    // Loading state
    if (!isLoaded || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    // No org → user hasn't completed onboarding yet
    if (!orgId) {
        router.push('/onboarding');
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

    const renderContent = () => {
        // Employees get their own restricted view — regardless of what URL they hit
        if (role === 'employee') {
            return <EmployeeDashboard />;
        }

        // Lawyers get a dedicated view with limited navigation
        if (role === 'lawyer') {
            switch (activeView) {
                case 'lawyer-reviews': return <LawyerDashboard />;
                case 'reports': return <PayGapReportView />;
                case 'joint-assessment': return <JointAssessmentView />;
                case 'audit': return <AuditLogsView />;
                case 'overview': return <DashboardOverview onNavigate={(v) => setActiveView(v as HRView)} />;
                default: return <LawyerDashboard />;
            }
        }

        // HR/Admin views
        switch (activeView) {
            // ── Compliance ────────────────────────────────────────────────────
            case 'compliance': return <ComplianceCommandCenter />;
            case 'joint-assessment': return <SubscriptionGate feature="pay_gap_analysis"><JointAssessmentView /></SubscriptionGate>;
            case 'job-postings': return <JobPostingsView />;
            case 'hr-requests': return <HRInfoRequestsPanel />;
            case 'rights-notifications': return <RightsNotificationsPanel />;
            // ── Analytics ─────────────────────────────────────────────────────
            case 'overview': return <DashboardOverview onNavigate={(v) => setActiveView(v as HRView)} />;
            case 'my-salary': return <MySalaryComparisonView />;
            case 'pay-equity-hr': return <SubscriptionGate feature="pay_gap_analysis"><PayEquityHRView /></SubscriptionGate>;
            case 'pay-equity-mgmt': return <SubscriptionGate feature="pay_gap_analysis"><PayEquityManagementView /></SubscriptionGate>;
            case 'reports': return <SubscriptionGate feature="pdf_reports"><PayGapReportView /></SubscriptionGate>;
            // ── HR Verwaltung ─────────────────────────────────────────────────
            case 'employees': return <EmployeesView />;
            case 'departments': return <DepartmentsView />;
            case 'job-levels': return <JobLevelsView />;
            case 'job-profiles': return <JobProfilesView />;
            case 'pay-bands': return <PayBandsView />;
            case 'requests': return <InfoRequestsView />;
            // ── Admin ─────────────────────────────────────────────────────────
            case 'lawyer-reviews': return <LawyerDashboard />;
            case 'audit': return role === 'admin' ? <AuditLogsView /> : <AccessDenied />;
            case 'billing': return role === 'admin' ? <BillingView /> : <AccessDenied />;
            case 'settings': return role === 'admin' ? <CompanySetup onComplete={() => setActiveView('overview')} /> : <AccessDenied />;
            default: return <ComplianceCommandCenter />;
        }
    };

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
                <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
                    {Object.entries(navGroups).map(([groupName, items]) => (
                        <div key={groupName}>
                            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                {groupName}
                            </p>
                            <div className="space-y-0.5">
                                {items.map((item) => (
                                    <button
                                        key={item.view}
                                        onClick={() => { setActiveView(item.view); setMobileNavOpen(false); }}
                                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${activeView === item.view
                                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <item.icon className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{item.label}</span>
                                    </button>
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
            <div className="border-t border-white/10 p-4 m-4 rounded-2xl bg-white/5 backdrop-blur-sm mt-auto">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-semibold shadow-inner">
                        {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                            {user?.firstName || user?.fullName || 'User'}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                            {user?.email}
                        </p>
                    </div>
                </div>
                {roleBadge && (
                    <div className={`text-xs font-semibold px-2 py-1 rounded-lg border mb-3 text-center ${roleBadge.color}`}>
                        {roleBadge.label}
                    </div>
                )}
                <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/10 h-9"
                    onClick={handleSignOut}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Abmelden
                </Button>
            </div>
        </div>
    );

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
                                        : (visibleNavItems.find(i => i.view === activeView)?.label || 'Compliance Center')}
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
                                    {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button className="relative p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
                            </button>
                            <div className="hidden sm:block h-8 w-px bg-slate-200" />
                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Live</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

function TrialExpiredOverlay() {
    const [loading, setLoading] = useState(false);

    const startCheckout = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: 'professional', interval: 'monthly' }),
            });
            const data = await res.json() as { url?: string };
            if (data.url) window.location.href = data.url;
        } catch {
            console.error('Failed to start checkout');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Testphase abgelaufen</h2>
                <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                    Ihre 14-tägige kostenlose Testphase ist beendet. Um weiterhin alle Funktionen
                    nutzen zu können, wählen Sie jetzt einen Plan.
                </p>
                <Button onClick={startCheckout} disabled={loading} className="w-full mb-3" size="lg">
                    {loading ? 'Wird weitergeleitet...' : 'Jetzt upgraden — ab €99/Monat'}
                </Button>
                <p className="text-xs text-slate-400">
                    Ihre Daten bleiben 30 Tage nach Ablauf erhalten.
                </p>
            </div>
        </div>
    );
}

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <Shield className="h-16 w-16 text-slate-200 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700">Kein Zugriff</h2>
            <p className="text-slate-400 mt-2 text-sm">Sie haben keine Berechtigung für diesen Bereich.</p>
        </div>
    );
}

function BillingView() {
    const sub = useSubscription();
    const [portalLoading, setPortalLoading] = useState(false);
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

    const openPortal = async () => {
        setPortalLoading(true);
        try {
            const res = await fetch('/api/stripe/portal', { method: 'POST' });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch {
            console.error('Failed to open billing portal');
        } finally {
            setPortalLoading(false);
        }
    };

    const startCheckout = async (tier: string) => {
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier, interval: billingInterval }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch {
            console.error('Failed to start checkout');
        }
    };

    if (sub.loading) {
        return <div className="flex justify-center py-24"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
    }

    const yearlyBasis = 990;
    const yearlyPro = 2990;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-slate-900">Abrechnung & Plan</h2>
                <p className="text-sm text-slate-500">Verwalten Sie Ihren Plan und Ihre Zahlungsinformationen.</p>
            </div>

            {/* Current Plan */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-slate-900">Aktueller Plan: {sub.plan.nameDE}</h3>
                        <p className="text-sm text-slate-500">
                            {sub.isTrialing
                                ? `Testphase — noch ${sub.trialDaysRemaining} Tage`
                                : sub.status === 'active'
                                ? 'Aktives Abonnement'
                                : sub.status === 'past_due'
                                ? 'Zahlung ausstehend'
                                : sub.status === 'canceled'
                                ? 'Gekündigt'
                                : 'Inaktiv'}
                        </p>
                    </div>
                    <Badge variant="outline" className={
                        sub.status === 'active' ? 'border-green-200 text-green-700 bg-green-50' :
                        sub.isTrialing ? 'border-blue-200 text-blue-700 bg-blue-50' :
                        sub.status === 'past_due' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                        'border-slate-200 text-slate-600'
                    }>
                        {sub.isTrialing ? 'Testphase' : sub.status === 'active' ? 'Aktiv' : sub.status === 'past_due' ? 'Überfällig' : sub.status}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-6">
                    <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs">Mitarbeiter-Limit</p>
                        <p className="font-semibold">{sub.limits.maxEmployees === -1 ? 'Unbegrenzt' : sub.limits.maxEmployees}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs">Admin-Nutzer</p>
                        <p className="font-semibold">{sub.limits.maxAdmins === -1 ? 'Unbegrenzt' : sub.limits.maxAdmins}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs">HR-Manager</p>
                        <p className="font-semibold">{sub.limits.maxHRManagers === -1 ? 'Unbegrenzt' : sub.limits.maxHRManagers}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {sub.stripeCustomerId ? (
                        <Button onClick={openPortal} disabled={portalLoading} variant="outline">
                            <CreditCard className="w-4 h-4 mr-2" />
                            {portalLoading ? 'Wird geöffnet...' : 'Rechnungen & Zahlungsmethoden'}
                        </Button>
                    ) : null}
                </div>
            </div>

            {/* Upgrade Options with billing interval toggle */}
            {sub.tier !== 'enterprise' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900">Plan upgraden</h3>
                            <p className="text-sm text-slate-500">Jährliche Zahlung spart bis zu 17%</p>
                        </div>
                        {/* Billing interval toggle */}
                        <div className="flex items-center bg-slate-100 rounded-full p-1 gap-1">
                            <button
                                onClick={() => setBillingInterval('monthly')}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    billingInterval === 'monthly'
                                        ? 'bg-white shadow-sm text-slate-900'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Monatlich
                            </button>
                            <button
                                onClick={() => setBillingInterval('yearly')}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    billingInterval === 'yearly'
                                        ? 'bg-white shadow-sm text-slate-900'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Jährlich
                                <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">−17%</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sub.tier !== 'professional' && (
                            <>
                                <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                                    <div>
                                        <p className="font-semibold text-slate-900">Basis</p>
                                        <p className="text-2xl font-bold mt-1">
                                            {billingInterval === 'monthly' ? '€99' : `€${Math.round(yearlyBasis / 12)}`}
                                            <span className="text-sm font-normal text-slate-500">/Monat</span>
                                        </p>
                                        {billingInterval === 'yearly' && (
                                            <p className="text-xs text-slate-500">€{yearlyBasis}/Jahr — eine Jahresrechnung</p>
                                        )}
                                    </div>
                                    <ul className="text-sm text-slate-600 space-y-1">
                                        <li>✓ Bis 50 Mitarbeiter</li>
                                        <li>✓ Gehaltsbänder & Job-Profile</li>
                                        <li>✓ CSV-Import</li>
                                    </ul>
                                    <Button variant="outline" className="w-full" onClick={() => startCheckout('basis')}>
                                        Basis wählen
                                    </Button>
                                </div>

                                <div className="border-2 border-primary rounded-xl p-5 space-y-3 relative">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Empfohlen</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">Professional</p>
                                        <p className="text-2xl font-bold mt-1">
                                            {billingInterval === 'monthly' ? '€299' : `€${Math.round(yearlyPro / 12)}`}
                                            <span className="text-sm font-normal text-slate-500">/Monat</span>
                                        </p>
                                        {billingInterval === 'yearly' && (
                                            <p className="text-xs text-slate-500">€{yearlyPro}/Jahr — eine Jahresrechnung</p>
                                        )}
                                    </div>
                                    <ul className="text-sm text-slate-600 space-y-1">
                                        <li>✓ Bis 250 Mitarbeiter</li>
                                        <li>✓ Gender-Pay-Gap Analyse</li>
                                        <li>✓ PDF-Berichte (EU-konform)</li>
                                        <li>✓ Unbegrenzte HR-Manager</li>
                                    </ul>
                                    <Button className="w-full" onClick={() => startCheckout('professional')}>
                                        Professional wählen
                                    </Button>
                                </div>
                            </>
                        )}

                        {sub.tier === 'professional' && (
                            <div className="border border-slate-200 rounded-xl p-5 space-y-3 col-span-2">
                                <p className="font-semibold text-slate-900">Enterprise — ab 250 Mitarbeiter</p>
                                <p className="text-sm text-slate-500">SSO, Auditor-Zugang, dedizierter Support, individuelle SLA. Preise auf Anfrage.</p>
                                <Button variant="outline" asChild>
                                    <a href="mailto:sales@klargehalt.de">Kontakt aufnehmen</a>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

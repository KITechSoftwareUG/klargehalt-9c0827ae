'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import {
    Shield, Users, Settings, LogOut,
    BarChart3, Building2, Scale, TrendingUp, Bell, MessageSquare,
    LayoutDashboard, Target, Briefcase, User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

// ── Role definitions ──────────────────────────────────────────────────────────

type AppRole = 'admin' | 'hr_manager' | 'employee';
type HRView = 'overview' | 'employees' | 'job-profiles' | 'pay-bands' | 'reports' | 'settings' | 'audit' | 'requests' | 'pay-equity-hr' | 'pay-equity-mgmt' | 'my-salary';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    admin: { label: 'Administrator', color: 'bg-red-50 border-red-200 text-red-700' },
    hr_manager: { label: 'HR-Manager', color: 'bg-amber-50 border-amber-200 text-amber-700' },
    employee: { label: 'Mitarbeiter', color: 'bg-blue-50 border-blue-200 text-blue-700' },
};

// Nav items visible per role
const HR_ADMIN_NAV = [
    { label: 'Übersicht', icon: BarChart3, view: 'overview' as HRView },
    { label: 'Mitarbeiter', icon: Users, view: 'employees' as HRView },
    { label: 'Gehaltscheck', icon: Target, view: 'my-salary' as HRView },
    { label: 'Analyse', icon: LayoutDashboard, view: 'pay-equity-hr' as HRView },
    { label: 'Strategie', icon: Briefcase, view: 'pay-equity-mgmt' as HRView },
    { label: 'Job-Profile', icon: Building2, view: 'job-profiles' as HRView },
    { label: 'Gehaltsbänder', icon: Scale, view: 'pay-bands' as HRView },
    { label: 'Berichte', icon: TrendingUp, view: 'reports' as HRView },
    { label: 'Anfragen', icon: MessageSquare, view: 'requests' as HRView },
    { label: 'Audit-Log', icon: Shield, view: 'audit' as HRView, adminOnly: true },
    { label: 'Einstellungen', icon: Settings, view: 'settings' as HRView, adminOnly: true },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const router = useRouter();
    const { signOut } = useClerk();
    const { user, role, loading, isLoaded } = useAuth();
    const [activeView, setActiveView] = useState<HRView>('overview');

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

    // Role badge info
    const roleBadge = ROLE_LABELS[role || 'employee'];

    // Nav items: filter admin-only for hr_manager
    const visibleNavItems = HR_ADMIN_NAV.filter(item => {
        if ((item as any).adminOnly && role !== 'admin') return false;
        return true;
    });

    const renderContent = () => {
        // Employees get their own restricted view — regardless of what URL they hit
        if (role === 'employee') {
            return <EmployeeDashboard />;
        }

        // HR/Admin views
        switch (activeView) {
            case 'overview': return <DashboardOverview onNavigate={(v) => setActiveView(v as HRView)} />;
            case 'employees': return <EmployeesView />;
            case 'my-salary': return <MySalaryComparisonView />;
            case 'pay-equity-hr': return <PayEquityHRView />;
            case 'pay-equity-mgmt': return <PayEquityManagementView />;
            case 'job-profiles': return <JobProfilesView />;
            case 'pay-bands': return <PayBandsView />;
            case 'reports': return <PayGapReportView />;
            case 'requests': return <InfoRequestsView />;
            case 'audit': return role === 'admin' ? <AuditLogsView /> : <AccessDenied />;
            case 'settings': return role === 'admin' ? <CompanySetup onComplete={() => setActiveView('overview')} /> : <AccessDenied />;
            default: return <DashboardOverview onNavigate={(v) => setActiveView(v as HRView)} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-[#0F172A] text-white overflow-y-auto">
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-8 py-8">
                        <Logo className="h-8 w-8 text-white" />
                        <span className="text-2xl font-bold tracking-tight lowercase">klargehalt</span>
                    </div>

                    {/* Navigation — hidden for employees (they see their own sub-nav inside EmployeeDashboard) */}
                    {role !== 'employee' && (
                        <nav className="flex-1 space-y-1 px-4 py-4">
                            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu</p>
                            {visibleNavItems.map((item) => (
                                <button
                                    key={item.view}
                                    onClick={() => setActiveView(item.view)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${activeView === item.view
                                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </button>
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
                                {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium text-white">
                                    {user?.firstName || 'User'}
                                </p>
                                <p className="truncate text-xs text-slate-400">
                                    {user?.emailAddresses[0]?.emailAddress}
                                </p>
                            </div>
                        </div>
                        {/* Role badge */}
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
            </aside>

            {/* Main Content */}
            <main className="pl-72 transition-all duration-300">
                {/* Top Header */}
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl px-8 py-4">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                {role === 'employee'
                                    ? 'Mein Portal'
                                    : (visibleNavItems.find(i => i.view === activeView)?.label || 'Dashboard')}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="relative p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
                            </button>
                            <div className="h-8 w-px bg-slate-200" />
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Live</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="p-8 max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
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

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Search, Users, Building2, ShieldCheck } from 'lucide-react';
import type { AdminUser } from '@/app/api/admin/users/route';

const SUPER_ADMIN_USER_ID = 'zqf0ih9ji1m1';

const TIER_LABELS: Record<string, string> = {
    basis: 'Basis',
    professional: 'Professional',
    enterprise: 'Enterprise',
};

const TIER_COLORS: Record<string, string> = {
    basis: 'bg-slate-100 text-slate-700',
    professional: 'bg-blue-100 text-blue-700',
    enterprise: 'bg-purple-100 text-purple-700',
};

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    hr_manager: 'bg-amber-100 text-amber-700',
    employee: 'bg-green-100 text-green-700',
};

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
}

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!loading && user?.id !== SUPER_ADMIN_USER_ID) {
            router.replace('/dashboard');
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (user?.id !== SUPER_ADMIN_USER_ID) return;
        fetch('/api/admin/users')
            .then(r => r.json())
            .then((data: AdminUser[]) => setUsers(data))
            .finally(() => setFetching(false));
    }, [user]);

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        return (
            u.email?.toLowerCase().includes(q) ||
            u.name?.toLowerCase().includes(q) ||
            u.company?.toLowerCase().includes(q) ||
            u.username?.toLowerCase().includes(q)
        );
    });

    if (loading || fetching) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
        );
    }

    const totalCompanies = new Set(users.map(u => u.organizationId).filter(Boolean)).size;
    const activeTrials = users.filter(u => u.subscriptionStatus === 'trialing').length;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                        <p className="text-xs text-slate-500">Registrierte User</p>
                    </div>
                </div>
                <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{totalCompanies}</p>
                        <p className="text-xs text-slate-500">Unternehmen</p>
                    </div>
                </div>
                <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{activeTrials}</p>
                        <p className="text-xs text-slate-500">Aktive Trials</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="User, Email oder Unternehmen suchen…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead>Email / Username</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Unternehmen</TableHead>
                            <TableHead>Rolle</TableHead>
                            <TableHead>Abo</TableHead>
                            <TableHead>Letzter Login</TableHead>
                            <TableHead>Registriert</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(u => (
                            <TableRow key={u.id} className="hover:bg-slate-50/50">
                                <TableCell className="font-mono text-sm">
                                    {u.email ?? u.username ?? u.id}
                                    {u.isSuspended && (
                                        <Badge variant="destructive" className="ml-2 text-xs">Gesperrt</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-slate-700">{u.name ?? '—'}</TableCell>
                                <TableCell className="text-slate-700">{u.company ?? '—'}</TableCell>
                                <TableCell>
                                    {u.role ? (
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-700'}`}>
                                            {u.role}
                                        </span>
                                    ) : '—'}
                                </TableCell>
                                <TableCell>
                                    {u.subscriptionTier ? (
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TIER_COLORS[u.subscriptionTier] ?? 'bg-slate-100 text-slate-700'}`}>
                                            {TIER_LABELS[u.subscriptionTier] ?? u.subscriptionTier}
                                            {u.subscriptionStatus === 'trialing' && ' · Trial'}
                                        </span>
                                    ) : '—'}
                                </TableCell>
                                <TableCell className="text-slate-500 text-sm">{formatDate(u.lastSignInAt)}</TableCell>
                                <TableCell className="text-slate-500 text-sm">{formatDate(u.createdAt)}</TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                                    Keine User gefunden
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

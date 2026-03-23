/**
 * HR-Dashboard View: Pay Equity Analyse
 * Uses canonical pay_gap_snapshots table
 */

'use client';

import { useState } from 'react';
import { usePayGapSnapshots } from '@/hooks/usePayEquity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    AlertCircle,
    Users
} from 'lucide-react';
import type { PayEquityFilters } from '@/lib/types/pay-equity';

export default function PayEquityHRView() {
    const [filters, setFilters] = useState<PayEquityFilters>({
        gap_status: 'all',
    });

    const {
        data: snapshots,
        isLoading,
        refetch
    } = usePayGapSnapshots(filters);

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!snapshots || snapshots.length === 0) {
        return (
            <div className="space-y-6">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Noch keine Pay-Gap-Analysen vorhanden. Legen Sie zunächst Mitarbeiter mit Gehaltsdaten an und starten Sie eine Analyse.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const breachSnapshots = snapshots.filter(s => s.gap_status === 'breach');
    const warningSnapshots = snapshots.filter(s => s.gap_status === 'warning');
    const compliantSnapshots = snapshots.filter(s => s.gap_status === 'compliant');

    // Unique scopes for filtering
    const scopes = Array.from(new Set(snapshots.map(s => s.scope)));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Pay Equity Analyse</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gender Pay Gap Übersicht gemäß EU-Richtlinie 2023/970.
                    </p>
                </div>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Aktualisieren
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Handlungsbedarf</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold text-red-600">{breachSnapshots.length}</p>
                            <AlertTriangle className="h-5 w-5 text-red-600/30" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Bewertung nötig</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold text-yellow-600">{warningSnapshots.length}</p>
                            <AlertCircle className="h-5 w-5 text-yellow-600/30" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Konform</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold text-green-600">{compliantSnapshots.length}</p>
                            <CheckCircle2 className="h-5 w-5 text-green-600/30" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Gesamt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold">{snapshots.length}</p>
                            <Users className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-slate-50/50 border-dashed">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            value={filters.scope || 'all'}
                            onValueChange={(value) => setFilters({ ...filters, scope: value === 'all' ? undefined : value as PayEquityFilters['scope'] })}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Scope" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Scopes</SelectItem>
                                {scopes.map(s => (
                                    <SelectItem key={s} value={s}>{s === 'company' ? 'Firma' : s === 'department' ? 'Abteilung' : s === 'job_profile' ? 'Job-Profil' : 'Level'}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.gap_status || 'all'}
                            onValueChange={(value) => setFilters({ ...filters, gap_status: value as PayEquityFilters['gap_status'] })}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Gap-Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Status</SelectItem>
                                <SelectItem value="breach">Handlungsbedarf (&gt;10%)</SelectItem>
                                <SelectItem value="warning">Bewertung nötig (5-10%)</SelectItem>
                                <SelectItem value="compliant">Konform (&lt;5%)</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center pl-2">
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                {snapshots.length} Analysen
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Scope</TableHead>
                                <TableHead className="text-center">♂ / ♀</TableHead>
                                <TableHead className="text-right">Mean Gap</TableHead>
                                <TableHead className="text-right">Median Gap</TableHead>
                                <TableHead className="text-center">Datum</TableHead>
                                <TableHead className="text-center pr-6">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {snapshots.map((snapshot) => {
                                const meanGap = snapshot.mean_gap_base_pct;
                                return (
                                    <TableRow key={snapshot.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6 py-4">
                                            <div className="font-medium">{snapshot.scope_label || snapshot.scope}</div>
                                            <div className="text-xs text-muted-foreground capitalize">{snapshot.scope}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className="text-xs text-blue-600 font-bold">{snapshot.male_count}</span>
                                                <span className="text-xs text-slate-300">/</span>
                                                <span className="text-xs text-pink-600 font-bold">{snapshot.female_count}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {meanGap != null ? `${meanGap > 0 ? '+' : ''}${meanGap.toFixed(1)}%` : '—'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {snapshot.median_gap_base_pct != null ? `${snapshot.median_gap_base_pct > 0 ? '+' : ''}${snapshot.median_gap_base_pct.toFixed(1)}%` : '—'}
                                        </TableCell>
                                        <TableCell className="text-center text-xs text-muted-foreground">
                                            {new Date(snapshot.snapshot_date).toLocaleDateString('de-DE')}
                                        </TableCell>
                                        <TableCell className="text-center pr-6">
                                            <GapStatusBadge status={snapshot.gap_status} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {breachSnapshots.length > 0 && (
                <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-900">
                        <strong>{breachSnapshots.length} Bereiche</strong> mit Handlungsbedarf (Gap &gt;10%).
                        Nach EU-Richtlinie Art. 10 ist eine gemeinsame Entgeltbewertung mit Arbeitnehmervertretung erforderlich.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

function GapStatusBadge({ status }: { status: string | null }) {
    const config = {
        breach: { label: 'Handlungsbedarf', className: 'bg-red-100 text-red-700 border-red-200' },
        warning: { label: 'Bewertung nötig', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        compliant: { label: 'Konform', className: 'bg-green-100 text-green-700 border-green-200' },
    };

    const fallback = { label: 'Nicht berechnet', className: 'bg-slate-100 text-slate-600 border-slate-200' };
    const { label, className } = (status && config[status as keyof typeof config]) || fallback;

    return (
        <Badge variant="outline" className={`font-medium ${className}`}>
            {label}
        </Badge>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    );
}

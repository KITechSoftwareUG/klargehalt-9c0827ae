/**
 * HR-Dashboard View: Pay Equity Analyse
 */

'use client';

import { useState } from 'react';
import { usePayGroups, useUpdatePayGroupStats } from '@/hooks/usePayEquity';
import { useCompany } from '@/hooks/useCompany';
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
    Filter,
    AlertTriangle,
    CheckCircle2,
    AlertCircle,
    Users
} from 'lucide-react';
import type { HRDashboardFilters } from '@/lib/types/pay-equity';

export default function PayEquityHRView() {
    const { currentCompany, isLoading: companyLoading } = useCompany();
    const [filters, setFilters] = useState<HRDashboardFilters>({
        gender_gap_status: 'all',
    });

    const {
        data: payGroups,
        isLoading: groupsLoading,
        refetch
    } = usePayGroups(currentCompany?.id || '', filters);

    const updateStats = useUpdatePayGroupStats();

    const handleUpdateStats = () => {
        if (currentCompany?.id) {
            updateStats.mutate(currentCompany.id, {
                onSuccess: () => {
                    refetch();
                },
            });
        }
    };

    if (companyLoading || groupsLoading) {
        return <LoadingSkeleton />;
    }

    if (!payGroups || payGroups.length === 0) {
        return (
            <div className="space-y-6">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Noch keine Vergleichsgruppen vorhanden. Legen Sie zunächst Mitarbeiter mit Job-Profilen an.
                    </AlertDescription>
                </Alert>
                <Button
                    onClick={handleUpdateStats}
                    disabled={updateStats.isPending}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${updateStats.isPending ? 'animate-spin' : ''}`} />
                    Statistiken berechnen
                </Button>
            </div>
        );
    }

    // Statistiken berechnen
    const criticalGroups = payGroups.filter(g => g.stats?.[0]?.gender_gap_status === 'red');
    const warningGroups = payGroups.filter(g => g.stats?.[0]?.gender_gap_status === 'yellow');
    const okGroups = payGroups.filter(g => g.stats?.[0]?.gender_gap_status === 'green');

    // Eindeutige Werte für Filter
    const jobFamilies = Array.from(new Set(payGroups.map(g => g.job_family)));
    const jobLevels = Array.from(new Set(payGroups.map(g => g.job_level)));
    const locations = Array.from(new Set(payGroups.map(g => g.location)));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Pay Equity Analyse</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gender Pay Gap Übersicht für alle Vergleichsgruppen gemäß EU-Richtlinie.
                    </p>
                </div>
                <Button
                    onClick={handleUpdateStats}
                    disabled={updateStats.isPending}
                    variant="outline"
                    size="sm"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${updateStats.isPending ? 'animate-spin' : ''}`} />
                    Aktualisieren
                </Button>
            </div>

            {/* KPI-Karten */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Kritisch</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold text-red-600">{criticalGroups.length}</p>
                            <AlertTriangle className="h-5 w-5 text-red-600/30" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Beobachten</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold text-yellow-600">{warningGroups.length}</p>
                            <AlertCircle className="h-5 w-5 text-yellow-600/30" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">OK</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold text-green-600">{okGroups.length}</p>
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
                            <p className="text-2xl font-bold">{payGroups.length}</p>
                            <Users className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <Card className="bg-slate-50/50 border-dashed">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select
                            value={filters.job_family || 'all'}
                            onValueChange={(value) => setFilters({ ...filters, job_family: value === 'all' ? undefined : value })}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Job-Familie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Familien</SelectItem>
                                {jobFamilies.map(jf => (
                                    <SelectItem key={jf} value={jf}>{jf}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.job_level || 'all'}
                            onValueChange={(value) => setFilters({ ...filters, job_level: value === 'all' ? undefined : value })}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Job-Level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Levels</SelectItem>
                                {jobLevels.map(jl => (
                                    <SelectItem key={jl} value={jl}>{jl}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.gender_gap_status || 'all'}
                            onValueChange={(value) => setFilters({ ...filters, gender_gap_status: value as any })}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Gap-Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Status</SelectItem>
                                <SelectItem value="red">🔴 Kritisch (&gt;5%)</SelectItem>
                                <SelectItem value="yellow">🟡 Beobachten (3-5%)</SelectItem>
                                <SelectItem value="green">🟢 Unkritisch (&lt;3%)</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center pl-2">
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                {payGroups.length} Gruppen gefiltert
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabelle */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Vergleichsgruppe</TableHead>
                                <TableHead className="text-center">MA</TableHead>
                                <TableHead className="text-right">Median</TableHead>
                                <TableHead className="text-center">♂/♀</TableHead>
                                <TableHead className="text-right">Gap %</TableHead>
                                <TableHead className="text-center pr-6">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payGroups.map((group) => {
                                const stats = group.stats?.[0];
                                const gapPercent = stats?.gender_gap_percent || 0;
                                const gapStatus = stats?.gender_gap_status || 'unknown';

                                return (
                                    <TableRow key={group.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6 py-4">
                                            <div className="font-medium">{group.job_family}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {group.job_level} • {group.location}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-sm font-medium">{group.employee_count}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {stats?.median_salary ? `€${Math.round(stats.median_salary).toLocaleString('de-DE')}` : '—'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className="text-xs text-blue-600 font-bold">{group.male_count}</span>
                                                <span className="text-xs text-slate-300">/</span>
                                                <span className="text-xs text-pink-600 font-bold">{group.female_count}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={`text-sm font-bold ${gapStatus === 'red' ? 'text-red-600' :
                                                    gapStatus === 'yellow' ? 'text-yellow-600' :
                                                        'text-green-600'
                                                }`}>
                                                {gapPercent > 0 ? '+' : ''}{gapPercent.toFixed(1)}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center pr-6">
                                            <GapStatusBadge status={gapStatus} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {criticalGroups.length > 0 && (
                <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-900">
                        Sie haben <strong>{criticalGroups.length} Gruppen</strong> mit kritischem Pay Gap (&gt;5%).
                        Nach EU-Richtlinie besteht hier Handlungs- oder Erklärungsbedarf.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

function GapStatusBadge({ status }: { status: string }) {
    const config = {
        red: { label: 'Kritisch', className: 'bg-red-100 text-red-700 border-red-200' },
        yellow: { label: 'Beobachten', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        green: { label: 'OK', className: 'bg-green-100 text-green-700 border-green-200' },
        unknown: { label: 'Keine Daten', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    };

    const { label, className } = config[status as keyof typeof config] || config.unknown;

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

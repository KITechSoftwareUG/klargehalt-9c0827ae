/**
 * HR-Dashboard: Pay Equity Analyse
 * Dashboard 2: Gruppen-Übersicht mit Gender-Gap-Ampel
 */

'use client';

import { useState } from 'react';
import { usePayGroups, useUpdatePayGroupStats } from '@/hooks/usePayEquity';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
    Users,
    TrendingUp
} from 'lucide-react';
import { GAP_STATUS_COLORS, GAP_STATUS_LABELS } from '@/lib/types/pay-equity';
import type { HRDashboardFilters } from '@/lib/types/pay-equity';

export default function HRAnalyticsPage() {
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
            <div className="container mx-auto p-6 max-w-7xl">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Noch keine Vergleichsgruppen vorhanden. Legen Sie zunächst Mitarbeiter mit Job-Profilen an.
                    </AlertDescription>
                </Alert>
                <Button
                    onClick={handleUpdateStats}
                    disabled={updateStats.isPending}
                    className="mt-4"
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
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Pay Equity Analyse</h1>
                    <p className="text-muted-foreground">
                        Gender Pay Gap Übersicht für alle Vergleichsgruppen
                    </p>
                </div>
                <Button
                    onClick={handleUpdateStats}
                    disabled={updateStats.isPending}
                    variant="outline"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${updateStats.isPending ? 'animate-spin' : ''}`} />
                    Aktualisieren
                </Button>
            </div>

            {/* KPI-Karten */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Kritische Gruppen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <p className="text-3xl font-bold text-red-600">{criticalGroups.length}</p>
                            <AlertTriangle className="h-8 w-8 text-red-600/20" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Gap &gt; 5%</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Beobachtung
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <p className="text-3xl font-bold text-yellow-600">{warningGroups.length}</p>
                            <AlertCircle className="h-8 w-8 text-yellow-600/20" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Gap 3-5%</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Unkritisch
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <p className="text-3xl font-bold text-green-600">{okGroups.length}</p>
                            <CheckCircle2 className="h-8 w-8 text-green-600/20" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Gap &lt; 3%</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Gesamt-Gruppen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <p className="text-3xl font-bold">{payGroups.length}</p>
                            <Users className="h-8 w-8 text-muted-foreground/20" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Vergleichsgruppen</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filter
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select
                            value={filters.job_family || 'all'}
                            onValueChange={(value) => setFilters({ ...filters, job_family: value === 'all' ? undefined : value })}
                        >
                            <SelectTrigger>
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
                            <SelectTrigger>
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
                            value={filters.location || 'all'}
                            onValueChange={(value) => setFilters({ ...filters, location: value === 'all' ? undefined : value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Standort" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Standorte</SelectItem>
                                {locations.map(loc => (
                                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.gender_gap_status || 'all'}
                            onValueChange={(value) => setFilters({ ...filters, gender_gap_status: value as any })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Gap-Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Status</SelectItem>
                                <SelectItem value="red">🔴 Kritisch</SelectItem>
                                <SelectItem value="yellow">🟡 Beobachten</SelectItem>
                                <SelectItem value="green">🟢 Unkritisch</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Haupt-Tabelle */}
            <Card>
                <CardHeader>
                    <CardTitle>Vergleichsgruppen</CardTitle>
                    <CardDescription>
                        {payGroups.length} Gruppen gefunden
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Gruppe</TableHead>
                                    <TableHead className="text-center">MA</TableHead>
                                    <TableHead className="text-right">Ø Gehalt</TableHead>
                                    <TableHead className="text-right">Median</TableHead>
                                    <TableHead className="text-center">♂</TableHead>
                                    <TableHead className="text-center">♀</TableHead>
                                    <TableHead className="text-center">Gap</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payGroups.map((group) => {
                                    const stats = group.stats?.[0];
                                    const gapStatus = stats?.gender_gap_status || 'unknown';
                                    const gap = stats?.gender_gap_percent || 0;

                                    return (
                                        <TableRow key={group.id}>
                                            <TableCell className="font-medium max-w-xs">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{group.job_family}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {group.job_level} • {group.location}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary">{group.employee_count}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {stats?.avg_salary ? `€${Math.round(stats.avg_salary).toLocaleString('de-DE')}` : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {stats?.median_salary ? `€${Math.round(stats.median_salary).toLocaleString('de-DE')}` : '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline">{group.male_count}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline">{group.female_count}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`font-bold ${Math.abs(gap) > 5 ? 'text-red-600' :
                                                        Math.abs(gap) > 3 ? 'text-yellow-600' :
                                                            'text-green-600'
                                                    }`}>
                                                    {gap.toFixed(1)}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <GapStatusBadge status={gapStatus} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* KI-Hinweis für kritische Gruppen */}
                    {criticalGroups.length > 0 && (
                        <Alert className="mt-4 border-red-200 bg-red-50 dark:bg-red-950/20">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-900 dark:text-red-100">
                                <strong>{criticalGroups.length} Gruppe(n)</strong> überschreiten den 5%-Schwellenwert
                                und erfordern eine nähere Analyse. Diese Abweichungen sind statistisch auffällig.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function GapStatusBadge({ status }: { status: string }) {
    const config = {
        red: { icon: AlertTriangle, label: 'Kritisch', variant: 'destructive' as const },
        yellow: { icon: AlertCircle, label: 'Beobachten', variant: 'default' as const },
        green: { icon: CheckCircle2, label: 'OK', variant: 'secondary' as const },
        unknown: { icon: AlertCircle, label: 'N/A', variant: 'outline' as const },
    };

    const { icon: Icon, label, variant } = config[status as keyof typeof config] || config.unknown;

    return (
        <Badge variant={variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {label}
        </Badge>
    );
}

function LoadingSkeleton() {
    return (
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
            <Skeleton className="h-12 w-96" />
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <Skeleton className="h-16 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Skeleton className="h-96 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

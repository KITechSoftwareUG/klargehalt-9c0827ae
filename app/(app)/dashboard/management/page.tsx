/**
 * Management-Dashboard: Executive Overview
 * Dashboard 3: 3 Kennzahlen + Simple Simulation
 */

'use client';

import { useManagementKPIs } from '@/hooks/usePayEquity';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    AlertTriangle,
    TrendingDown,
    DollarSign,
    Users
} from 'lucide-react';

export default function ManagementDashboardPage() {
    const { currentCompany, isLoading: companyLoading } = useCompany();
    const { data: kpis, isLoading: kpisLoading } = useManagementKPIs(currentCompany?.id || '');

    if (companyLoading || kpisLoading) {
        return <LoadingSkeleton />;
    }

    if (!kpis) {
        return (
            <div className="container mx-auto p-6 max-w-6xl">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Keine Daten verfügbar. Bitte lassen Sie zunächst die Pay-Equity-Analyse durchführen.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const isCritical = kpis.critical_groups_count > 0;
    const estimatedCostFormatted = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(kpis.estimated_closing_cost);

    return (
        <div className="container mx-auto p-6 max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Management-Übersicht</h1>
                    <p className="text-muted-foreground">
                        Executive Summary der Pay-Equity-Situation
                    </p>
                </div>
                {isCritical && (
                    <Badge variant="destructive" className="text-base px-4 py-2">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Handlungsbedarf
                    </Badge>
                )}
            </div>

            {/* Die 3 Haupt-Kennzahlen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KPI 1: Kritische Gruppen */}
                <Card className={`${isCritical ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : 'border-green-300 bg-green-50/50 dark:bg-green-950/20'}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <AlertTriangle className="h-4 w-4" />
                            Kritische Gruppen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-baseline gap-2">
                                <p className={`text-5xl font-bold ${isCritical ? 'text-red-600' : 'text-green-600'}`}>
                                    {kpis.critical_groups_count}
                                </p>
                                <p className="text-muted-foreground">/ {kpis.total_groups}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {isCritical
                                    ? `${kpis.critical_groups_count} Gruppe(n) überschreiten 5% Gender Pay Gap`
                                    : 'Alle Gruppen im unkritischen Bereich'
                                }
                            </p>
                            {isCritical && (
                                <Alert className="border-red-200">
                                    <AlertDescription className="text-sm">
                                        Diese Gruppen erfordern sofortige Analyse und mögliche Korrekturmaßnahmen.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* KPI 2: Größter Gap */}
                <Card className="border-orange-300 bg-orange-50/50 dark:bg-orange-950/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <TrendingDown className="h-4 w-4" />
                            Größter Gap
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-baseline gap-2">
                                <p className="text-5xl font-bold text-orange-600">
                                    {kpis.largest_gap_percent.toFixed(1)}%
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Betroffene Gruppe:</p>
                                <p className="text-xs text-muted-foreground break-words">
                                    {kpis.largest_gap_group}
                                </p>
                            </div>
                            {kpis.largest_gap_percent > 10 && (
                                <Badge variant="destructive" className="w-full justify-center">
                                    Kritischer Wert
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* KPI 3: Geschätzter Anpassungsaufwand */}
                <Card className="border-blue-300 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            Anpassungsaufwand
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-baseline gap-2">
                                <p className="text-4xl font-bold text-blue-600">
                                    {estimatedCostFormatted}
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Geschätzte jährliche Kosten um kritische Gaps zu schließen
                            </p>
                            <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground">
                                    Basierend auf {kpis.total_employees} Mitarbeitern in {kpis.total_groups} Vergleichsgruppen
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Zusatz-Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Unternehmens-Übersicht
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Gesamt-Mitarbeiter</p>
                            <p className="text-2xl font-bold">{kpis.total_employees}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Vergleichsgruppen</p>
                            <p className="text-2xl font-bold">{kpis.total_groups}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Kritische Gruppen</p>
                            <p className={`text-2xl font-bold ${isCritical ? 'text-red-600' : 'text-green-600'}`}>
                                {kpis.critical_groups_count}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Compliance-Status</p>
                            <Badge
                                variant={isCritical ? 'destructive' : 'secondary'}
                                className="text-base px-3 py-1"
                            >
                                {isCritical ? '⚠️ Handlung erforderlich' : '✅ Konform'}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function LoadingSkeleton() {
    return (
        <div className="container mx-auto p-6 max-w-6xl space-y-6">
            <div>
                <Skeleton className="h-10 w-96 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <Skeleton className="h-32 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

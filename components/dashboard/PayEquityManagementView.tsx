/**
 * Management-Dashboard View: Executive Overview
 * Uses canonical pay_gap_snapshots via usePayGapOverview
 */

'use client';

import { usePayGapOverview } from '@/hooks/usePayEquity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
    TrendingDown,
    Users,
    ShieldCheck,
    AlertTriangle,
    ArrowRight,
    Info
} from 'lucide-react';

export default function PayEquityManagementView() {
    const { data, isLoading } = usePayGapOverview();

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!data?.kpis) {
        return (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Keine Daten verfügbar</AlertTitle>
                <AlertDescription>
                    Es liegen noch keine berechneten Statistiken für Ihr Unternehmen vor.
                    Starten Sie zunächst eine Pay-Gap-Analyse.
                </AlertDescription>
            </Alert>
        );
    }

    const { kpis } = data;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Management Overview</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Strategische KPIs zur Entgelttransparenz gemäß EU-Richtlinie 2023/970.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700 uppercase">EU Compliance</span>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="relative overflow-hidden border-2 border-red-100">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AlertTriangle className="h-12 w-12 text-red-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription>Handlungsbedarf</CardDescription>
                        <CardTitle className="text-4xl font-bold text-red-600">
                            {kpis.breach_count}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Bereiche mit Gap &gt; 10%
                        </p>
                        <Progress value={kpis.breach_count > 0 ? Math.min(100, (kpis.breach_count / (kpis.breach_count + kpis.warning_count + kpis.compliant_count)) * 100) : 0} className="h-1 mt-4" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingDown className="h-12 w-12 text-blue-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription>Mean Pay Gap (Firma)</CardDescription>
                        <CardTitle className="text-4xl font-bold">
                            {kpis.mean_gap_pct != null ? `${kpis.mean_gap_pct.toFixed(1)}%` : '—'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Durchschnittliche Entgeltlücke (EU Art. 9)
                        </p>
                        <div className="flex items-center gap-1 mt-4 text-xs font-medium text-blue-600">
                            <span>Ziel: &lt; 5.0%</span>
                            <ArrowRight className="h-3 w-3" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Users className="h-12 w-12 text-slate-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription>Mitarbeiter erfasst</CardDescription>
                        <CardTitle className="text-4xl font-bold">
                            {kpis.total_employees}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            In der letzten Analyse berücksichtigt
                        </p>
                        {kpis.requires_joint_assessment && (
                            <div className="mt-4 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 font-medium">
                                Gemeinsame Bewertung erforderlich (EU Art. 10)
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {kpis.requires_joint_assessment && (
                <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-900">Gemeinsame Entgeltbewertung erforderlich</AlertTitle>
                    <AlertDescription className="text-amber-800">
                        Mindestens ein Bereich weist einen Gender Pay Gap von über 5% auf.
                        Gemäß EU-Richtlinie Art. 10 muss eine gemeinsame Entgeltbewertung mit der Arbeitnehmervertretung durchgeführt werden.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-3 gap-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    );
}

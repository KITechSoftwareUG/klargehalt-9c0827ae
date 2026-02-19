/**
 * Management-Dashboard View: Executive Overview
 */

'use client';

import { useManagementKPIs, useSalarySimulation } from '@/hooks/usePayEquity';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
    TrendingDown,
    Users,
    Euro,
    ShieldCheck,
    AlertTriangle,
    ArrowRight,
    Calculator,
    Info,
    Lock,
    RefreshCw
} from 'lucide-react';
import { useState } from 'react';

export default function PayEquityManagementView() {
    const { currentCompany } = useCompany();
    const { data: kpis, isLoading: kpisLoading } = useManagementKPIs(currentCompany?.id || '');
    const simulation = useSalarySimulation();
    const [simResult, setSimResult] = useState<any>(null);

    // Feature Restriction Logic
    const isRestricted = !currentCompany?.subscription_tier || currentCompany.subscription_tier === 'basis';

    const runSimulation = () => {
        if (!currentCompany?.id) return;

        simulation.mutate({
            company_id: currentCompany.id,
            simulation_type: 'close_gap',
            target_gap_percent: 3
        }, {
            onSuccess: (data) => {
                setSimResult(data);
            }
        });
    };

    if (kpisLoading) {
        return <LoadingSkeleton />;
    }

    if (!kpis) {
        return (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Keine Daten verfügbar</AlertTitle>
                <AlertDescription>
                    Es liegen noch keine berechneten Statistiken für Ihr Unternehmen vor.
                </AlertDescription>
            </Alert>
        );
    }

    if (isRestricted) {
        return (
            <div className="relative">
                {/* Blured Content Preview */}
                <div className="filter blur-sm pointer-events-none select-none opacity-50">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Management Overview</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Strategische KPIs und Kostenprognosen zur Entgelttransparenz.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-40 w-full" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Skeleton className="h-96 w-full" />
                            <Skeleton className="h-96 w-full" />
                        </div>
                    </div>
                </div>

                {/* Lock Overlay */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Card className="w-full max-w-lg border-2 border-primary/20 shadow-2xl bg-white/90 backdrop-blur-sm">
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                                <Lock className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle className="text-2xl">Fair Pay Manager</CardTitle>
                            <CardDescription className="text-base">
                                Schalten Sie strategische Werkzeuge frei, um Ihre Entgeltstruktur aktiv zu steuern.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                    <span>What-If Simulationen (Budgetplanung)</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                    <span>Detaillierte KI-Handlungsempfehlungen</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                    <span>Historische Trend-Analysen</span>
                                </li>
                            </ul>
                            <Button className="w-full text-lg h-12 mt-4" size="lg">
                                Jetzt upgraden (ab 299€/Monat)
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Management Overview</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Strategische KPIs und Kostenprognosen zur Entgelttransparenz.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700 uppercase">Fair Pay Manager: Aktiv</span>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="relative overflow-hidden border-2 border-red-100">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AlertTriangle className="h-12 w-12 text-red-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription>Kritische Gruppen</CardDescription>
                        <CardTitle className="text-4xl font-bold text-red-600">
                            {kpis.critical_groups_count}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Vergleichsgruppen mit einem Gap &gt; 5%
                        </p>
                        <Progress value={(kpis.critical_groups_count / (kpis.critical_groups_count + 5)) * 100} className="h-1 mt-4" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingDown className="h-12 w-12 text-blue-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription>Größter Gender Gap</CardDescription>
                        <CardTitle className="text-4xl font-bold">
                            {kpis.largest_gap_percent.toFixed(1)}%
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Maximale Abweichung in einer Gruppe
                        </p>
                        <div className="flex items-center gap-1 mt-4 text-xs font-medium text-blue-600">
                            <span>Ziel: &lt; 3.0%</span>
                            <ArrowRight className="h-3 w-3" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-slate-900 text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Euro className="h-12 w-12" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-400">Budget-Impact (Est.)</CardDescription>
                        <CardTitle className="text-4xl font-bold">
                            €{(kpis.estimated_closing_cost / 1000).toFixed(0)}k
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-400">
                            Geschätzte jährliche Kosten zur Gap-Schließung
                        </p>
                        <p className="mt-4 text-[10px] text-slate-500 uppercase tracking-wider">
                            Basierend auf aktuellen Gehältern
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* What-If Simulation Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-blue-600" />
                            Simulation: Gap Reduzierung
                        </CardTitle>
                        <CardDescription>
                            Berechnen Sie die Kosten für eine Reduzierung aller Gaps auf unter 3%.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="rounded-xl bg-slate-50 p-6 border">
                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Betroffene Mitarbeiter
                            </h4>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-slate-900">
                                    {simResult?.affected_employees || '—'}
                                </span>
                                <span className="text-slate-500 mb-1.5">Personen</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Mitarbeiter in Gruppen mit &gt;3% Gap, die eine Anpassung erhalten würden.
                            </p>
                        </div>

                        <Button
                            className="w-full h-12 text-lg shadow-lg shadow-primary/20"
                            onClick={runSimulation}
                            disabled={simulation.isPending}
                        >
                            {simulation.isPending ? (
                                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                                <Calculator className="h-5 w-5 mr-2" />
                            )}
                            Simulation jetzt starten
                        </Button>
                    </CardContent>
                </Card>

                <Card className={simResult ? 'border-primary shadow-xl shadow-primary/5' : 'opacity-50'}>
                    <CardHeader>
                        <CardTitle>Ergebnis der Simulation</CardTitle>
                        <CardDescription>Prognostizierte Werte nach Anpassung</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!simResult ? (
                            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
                                <Calculator className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-sm">Starten Sie links die Simulation</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                                    <span className="text-sm font-medium text-emerald-900">Neuer max. Gap</span>
                                    <span className="text-xl font-bold text-emerald-700">
                                        {simResult.simulated_gap_percent.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900 text-white">
                                    <span className="text-sm font-medium text-slate-300">Jährliche Mehrkosten</span>
                                    <span className="text-xl font-bold">
                                        €{Math.round(simResult.estimated_annual_cost).toLocaleString('de-DE')}
                                    </span>
                                </div>

                                <Alert className="bg-blue-50 border-blue-100">
                                    <Info className="h-4 w-4 text-blue-600" />
                                    <AlertTitle className="text-sm font-bold text-blue-900">Empfehlung</AlertTitle>
                                    <AlertDescription className="text-xs text-blue-800">
                                        Die Schließung der Gaps auf 3% ist strategisch sinnvoll, um die geplante EU-Auskunftspflicht
                                        und mögliche Pönalen proaktiv zu vermeiden.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
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
            <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}

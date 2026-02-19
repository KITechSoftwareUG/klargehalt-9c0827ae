/**
 * Mitarbeiter-Dashboard: Mein Gehalt
 * Dashboard 1: Eigene Gehaltszahl mit KI-Erklärung
 */

'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useEmployeeComparison, useGenerateExplanation } from '@/hooks/usePayEquity';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Sparkles, Users, TrendingUp, Info } from 'lucide-react';

const supabase = createClient();

export default function MySalaryPage() {
    const { user } = useUser();
    const [employeeId, setEmployeeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const { data: comparison, isLoading: comparisonLoading, refetch } = useEmployeeComparison(employeeId || '');
    const generateExplanation = useGenerateExplanation();

    // Hole Employee-ID für aktuellen User
    useEffect(() => {
        async function fetchEmployeeId() {
            if (!user) return;

            const { data, error } = await supabase
                .from('employees')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!error && data) {
                setEmployeeId(data.id);
            }
            setLoading(false);
        }

        fetchEmployeeId();
    }, [user]);

    // Auto-generiere Erklärung wenn noch nicht vorhanden
    useEffect(() => {
        if (comparison && !comparison.ai_explanation && employeeId) {
            generateExplanation.mutate(employeeId, {
                onSuccess: () => refetch(),
            });
        }
    }, [comparison, employeeId]);

    if (loading || comparisonLoading) {
        return <LoadingSkeleton />;
    }

    if (!comparison) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Für dich liegen noch keine Vergleichsdaten vor. Dein HR-Team muss zunächst die Gehaltsstrukturen analysieren.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Chart-Daten vorbereiten
    const chartData = [
        {
            name: 'Minimum',
            value: comparison.group_avg_salary * 0.8, // Approximation
            fill: '#94a3b8',
        },
        {
            name: 'Median',
            value: comparison.group_median_salary,
            fill: '#3b82f6',
        },
        {
            name: 'Durchschnitt',
            value: comparison.group_avg_salary,
            fill: '#8b5cf6',
        },
        {
            name: 'Dein Gehalt',
            value: comparison.employee_salary,
            fill: comparison.deviation_from_avg_percent >= 0 ? '#22c55e' : '#f59e0b',
        },
        {
            name: 'Maximum',
            value: comparison.group_avg_salary * 1.2, // Approximation
            fill: '#94a3b8',
        },
    ];

    const percentileColor =
        comparison.percentile_rank >= 75 ? 'text-green-600' :
            comparison.percentile_rank >= 50 ? 'text-blue-600' :
                comparison.percentile_rank >= 25 ? 'text-yellow-600' : 'text-orange-600';

    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Mein Gehalt</h1>
                <p className="text-muted-foreground">
                    Verstehe, wie dein Gehalt im Vergleich zu deiner Vergleichsgruppe steht
                </p>
            </div>

            {/* Haupt-Karte: Gehaltsvergleich */}
            <Card className="border-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Dein Gehaltsvergleich
                    </CardTitle>
                    <CardDescription>
                        Vergleich mit {(comparison as any).pay_group?.employee_count || 0} Personen in deiner Vergleichsgruppe
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Haupt-Visualisierung */}
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    formatter={(value: any) => `€${value.toLocaleString('de-DE')}`}
                                    labelStyle={{ color: '#000' }}
                                />
                                <ReferenceLine
                                    y={comparison.group_median_salary}
                                    stroke="#3b82f6"
                                    strokeDasharray="5 5"
                                    label="Median"
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Statistiken */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">Dein Gehalt</p>
                            <p className="text-2xl font-bold">
                                €{comparison.employee_salary.toLocaleString('de-DE')}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">Gruppen-Median</p>
                            <p className="text-2xl font-bold text-blue-600">
                                €{comparison.group_median_salary.toLocaleString('de-DE')}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">Gruppen-Ø</p>
                            <p className="text-2xl font-bold text-purple-600">
                                €{comparison.group_avg_salary.toLocaleString('de-DE')}
                            </p>
                        </div>
                    </div>

                    {/* Abweichung */}
                    <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">Abweichung vom Durchschnitt</p>
                            <p className={`text-3xl font-bold ${comparison.deviation_from_avg_percent >= 0 ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                {comparison.deviation_from_avg_percent > 0 ? '+' : ''}
                                {comparison.deviation_from_avg_percent.toFixed(1)}%
                            </p>
                        </div>
                        <div className="h-12 w-px bg-border" />
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">Dein Percentile</p>
                            <p className={`text-3xl font-bold ${percentileColor}`}>
                                {comparison.percentile_rank?.toFixed(0) || 50}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KI-Erklärung */}
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                        <Sparkles className="h-5 w-5" />
                        KI-Erklärung
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {generateExplanation.isPending ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/6" />
                        </div>
                    ) : comparison.ai_explanation ? (
                        <p className="text-base leading-relaxed text-blue-900/90 dark:text-blue-100/90">
                            {comparison.ai_explanation}
                        </p>
                    ) : (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Noch keine KI-Erklärung verfügbar
                            </p>
                            <Button
                                onClick={() => employeeId && generateExplanation.mutate(employeeId)}
                                disabled={generateExplanation.isPending}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Erklärung generieren
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Vergleichsgruppen-Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Deine Vergleichsgruppe
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <InfoRow
                            label="Gruppengröße"
                            value={`${(comparison as any).pay_group?.employee_count || 0} Personen`}
                        />
                        <InfoRow
                            label="Job-Familie"
                            value={(comparison as any).pay_group?.job_family || 'N/A'}
                        />
                        <InfoRow
                            label="Level"
                            value={(comparison as any).pay_group?.job_level || 'N/A'}
                        />
                        <InfoRow
                            label="Standort"
                            value={(comparison as any).pay_group?.location || 'N/A'}
                        />
                        <InfoRow
                            label="Beschäftigungsart"
                            value={(comparison as any).pay_group?.employment_type || 'N/A'}
                        />
                        {comparison.tenure_months && (
                            <InfoRow
                                label="Deine Betriebszugehörigkeit"
                                value={`${Math.floor(comparison.tenure_months / 12)} Jahre`}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-2 border-b last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
            <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-96" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

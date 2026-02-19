/**
 * Mitarbeiter-View: AI-gestützter Gehaltscheck
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Sparkles, Users, TrendingUp, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const supabase = createClient();

export default function MySalaryComparisonView() {
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
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Gehaltscheck</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Transparente Einordnung Ihrer Vergütung.
                    </p>
                </div>
                <Alert className="bg-slate-50 border-dashed">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Für Ihr Profil liegen noch keine Vergleichsdaten vor. Dies kann passieren, wenn Ihr Profil noch nicht vollständig zugeordnet wurde oder zu wenige Vergleichspersonen in Ihrer Gruppe sind.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Chart-Daten vorbereiten
    const chartData = [
        { name: 'Min', value: comparison.group_avg_salary * 0.85, type: 'ref' },
        { name: 'Median', value: comparison.group_median_salary, type: 'median' },
        { name: 'Ich', value: comparison.employee_salary, type: 'current' },
        { name: 'Max', value: comparison.group_avg_salary * 1.15, type: 'ref' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Mein Gehaltscheck</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Ihre Gehaltseinordnung im Vergleich zur Peer-Group.
                    </p>
                </div>
                <Badge variant="outline" className="px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                    <Users className="h-3 w-3 mr-1.5" />
                    Vergleichsgruppe: {(comparison as any).pay_group?.employee_count || 0} Personen
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visualisierung */}
                <Card className="lg:col-span-2 overflow-hidden border-2 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">Benchmark-Vergleich</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                    />
                                    <YAxis
                                        hide
                                        domain={[0, (dataMax: any) => dataMax * 1.1]}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white p-3 border rounded-xl shadow-xl">
                                                        <p className="text-xs font-semibold text-slate-500 mb-1">{payload[0].payload.name}</p>
                                                        <p className="text-lg font-bold">€{Number(payload[0].value).toLocaleString('de-DE')}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <ReferenceLine
                                        y={comparison.group_median_salary}
                                        stroke="#cbd5e1"
                                        strokeDasharray="5 5"
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    entry.type === 'current' ? '#0f172a' :
                                                        entry.type === 'median' ? '#3b82f6' :
                                                            '#e2e8f0'
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t font-mono">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase">Abweichung Median</p>
                                <p className={`text-2xl font-bold ${comparison.employee_salary >= comparison.group_median_salary
                                        ? 'text-emerald-600' : 'text-amber-600'
                                    }`}>
                                    {((comparison.employee_salary / comparison.group_median_salary - 1) * 100).toFixed(1)}%
                                </p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-xs text-muted-foreground uppercase">Percentile-Rank</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {comparison.percentile_rank?.toFixed(0) || '—'}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* KI Erklärung & Info */}
                <div className="space-y-6">
                    <Card className="border-blue-200 bg-blue-50/30 overflow-hidden relative">
                        <div className="absolute -top-6 -right-6 h-24 w-24 bg-blue-500/10 rounded-full blur-2xl" />
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-900">
                                <Sparkles className="h-4 w-4 text-blue-600" />
                                KI-Analyse & Einordnung
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="min-h-[200px]">
                            {generateExplanation.isPending ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            ) : comparison.ai_explanation ? (
                                <p className="text-sm leading-relaxed text-blue-900/80 italic">
                                    "{comparison.ai_explanation}"
                                </p>
                            ) : (
                                <Button
                                    size="sm"
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    onClick={() => employeeId && generateExplanation.mutate(employeeId)}
                                >
                                    Analyse anfordern
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold uppercase text-slate-500">Ihre Vergleichsgruppe</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Job-Familie</span>
                                <span className="font-medium">{(comparison as any).pay_group?.job_family || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Level</span>
                                <span className="font-medium">{(comparison as any).pay_group?.job_level || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Standort</span>
                                <span className="font-medium">{(comparison as any).pay_group?.location || 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-32" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-[400px] lg:col-span-2 w-full" />
                <div className="space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    );
}

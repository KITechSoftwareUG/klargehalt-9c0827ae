/**
 * Mitarbeiter-View: Gehaltseinordnung
 * Shows employee's salary position relative to their pay band
 * Uses canonical employees + pay_bands tables (no dead pay_groups)
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Info } from 'lucide-react';

interface EmployeePayInfo {
    base_salary: number;
    variable_pay: number;
    pay_band_min: number | null;
    pay_band_max: number | null;
    job_profile_title: string | null;
    job_level_name: string | null;
    department_name: string | null;
}

export default function MySalaryComparisonView() {
    const { user, orgId, supabase, isSignedIn } = useAuth();
    const [payInfo, setPayInfo] = useState<EmployeePayInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPayInfo() {
            if (!user || !orgId || !isSignedIn) {
                setLoading(false);
                return;
            }

            try {
                // Get employee record for current user
                const { data: employee, error: empErr } = await supabase
                    .from('employees')
                    .select('base_salary, variable_pay, job_profile_id, job_level_id, department_id, pay_band_id')
                    .eq('user_id', user.id)
                    .eq('organization_id', orgId)
                    .maybeSingle();

                if (empErr || !employee) {
                    setLoading(false);
                    return;
                }

                const info: EmployeePayInfo = {
                    base_salary: employee.base_salary,
                    variable_pay: employee.variable_pay || 0,
                    pay_band_min: null,
                    pay_band_max: null,
                    job_profile_title: null,
                    job_level_name: null,
                    department_name: null,
                };

                // Fetch pay band if assigned
                if (employee.pay_band_id) {
                    const { data: band } = await supabase
                        .from('pay_bands')
                        .select('min_salary, max_salary')
                        .eq('id', employee.pay_band_id)
                        .single();
                    if (band) {
                        info.pay_band_min = band.min_salary;
                        info.pay_band_max = band.max_salary;
                    }
                }

                // Fetch job profile title
                if (employee.job_profile_id) {
                    const { data: profile } = await supabase
                        .from('job_profiles')
                        .select('title')
                        .eq('id', employee.job_profile_id)
                        .single();
                    if (profile) info.job_profile_title = profile.title;
                }

                // Fetch job level name
                if (employee.job_level_id) {
                    const { data: level } = await supabase
                        .from('job_levels')
                        .select('name')
                        .eq('id', employee.job_level_id)
                        .single();
                    if (level) info.job_level_name = level.name;
                }

                // Fetch department name
                if (employee.department_id) {
                    const { data: dept } = await supabase
                        .from('departments')
                        .select('name')
                        .eq('id', employee.department_id)
                        .single();
                    if (dept) info.department_name = dept.name;
                }

                setPayInfo(info);
            } catch (error) {
                console.error('Error fetching pay info:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPayInfo();
    }, [user, orgId, isSignedIn, supabase]);

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (!payInfo) {
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
                        Für Ihr Profil liegen noch keine Gehaltsdaten vor. Bitte wenden Sie sich an Ihre HR-Abteilung.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const bandRange = payInfo.pay_band_min != null && payInfo.pay_band_max != null
        ? payInfo.pay_band_max - payInfo.pay_band_min
        : null;
    const positionInBand = bandRange && bandRange > 0
        ? ((payInfo.base_salary - payInfo.pay_band_min!) / bandRange) * 100
        : null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Mein Gehaltscheck</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Ihre Gehaltseinordnung gemäß EU-Entgelttransparenzrichtlinie.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Grundgehalt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(payInfo.base_salary)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Variable Vergütung</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(payInfo.variable_pay)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Position im Band</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {positionInBand != null ? (
                            <>
                                <p className="text-3xl font-bold">{positionInBand.toFixed(0)}%</p>
                                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all"
                                        style={{ width: `${Math.min(100, Math.max(0, positionInBand))}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(payInfo.pay_band_min!)}</span>
                                    <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(payInfo.pay_band_max!)}</span>
                                </div>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-sm">Kein Gehaltsband zugeordnet</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Profile Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase text-slate-500">Ihre Zuordnung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Job-Profil</span>
                        <span className="font-medium">{payInfo.job_profile_title || 'Nicht zugeordnet'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Karrierestufe</span>
                        <span className="font-medium">{payInfo.job_level_name || 'Nicht zugeordnet'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Abteilung</span>
                        <span className="font-medium">{payInfo.department_name || 'Nicht zugeordnet'}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                <Skeleton className="h-8 w-48" />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
            <Skeleton className="h-40 w-full" />
        </div>
    );
}

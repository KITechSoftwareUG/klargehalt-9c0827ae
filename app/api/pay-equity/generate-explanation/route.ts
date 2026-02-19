/**
 * API Route: Generate AI Explanation for Employee
 * POST /api/pay-equity/generate-explanation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { currentUser } from '@clerk/nextjs/server';
import { generateEmployeeExplanation } from '@/lib/services/gemini-service';

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();
        const body = await request.json();
        const { employee_id } = body;

        if (!employee_id) {
            return NextResponse.json(
                { error: 'employee_id is required' },
                { status: 400 }
            );
        }

        // Hole Mitarbeiter-Daten
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .select(`
        *,
        job_profile:job_profiles(category, level)
      `)
            .eq('id', employee_id)
            .single();

        if (empError || !employee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        // Prüfe Berechtigung (nur eigene Daten oder HR/Admin)
        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('company_id', employee.company_id)
            .single();

        const isOwnEmployee = employee.user_id === user.id;
        const isHRorAdmin = userRole && ['admin', 'hr_manager'].includes(userRole.role);

        if (!isOwnEmployee && !isHRorAdmin) {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // Finde PayGroup
        const { data: payGroup } = await supabase
            .from('pay_groups')
            .select('*, stats:pay_group_stats(*)')
            .eq('company_id', employee.company_id)
            .eq('job_family', employee.job_profile?.category || 'Unknown')
            .eq('job_level', employee.job_profile?.level || 'Unknown')
            .eq('location', employee.location || 'Unknown')
            .eq('employment_type', employee.employment_type || 'Vollzeit')
            .single();

        if (!payGroup || !payGroup.stats || payGroup.stats.length === 0) {
            return NextResponse.json(
                { error: 'No comparison group data available' },
                { status: 404 }
            );
        }

        const stats = payGroup.stats[0];

        // Berechne Tenure
        const tenureMonths = employee.hire_date
            ? Math.floor(
                (new Date().getTime() - new Date(employee.hire_date).getTime()) /
                (1000 * 60 * 60 * 24 * 30)
            )
            : 0;

        // Berechne Abweichung
        const deviation = stats.avg_salary
            ? ((employee.current_salary - stats.avg_salary) / stats.avg_salary) * 100
            : 0;

        // Generiere AI-Erklärung
        const explanation = await generateEmployeeExplanation({
            employee_salary: employee.current_salary,
            group_avg: stats.avg_salary,
            group_median: stats.median_salary,
            group_size: payGroup.employee_count,
            deviation_percent: deviation,
            tenure_months: tenureMonths,
            job_family: payGroup.job_family,
            job_level: payGroup.job_level,
            location: payGroup.location,
            gender: employee.gender,
        });

        // Speichere in employee_comparisons
        const { data: comparison, error: compError } = await supabase
            .from('employee_comparisons')
            .upsert({
                employee_id,
                pay_group_id: payGroup.id,
                company_id: employee.company_id,
                employee_salary: employee.current_salary,
                group_avg_salary: stats.avg_salary,
                group_median_salary: stats.median_salary,
                deviation_from_avg_percent: deviation,
                deviation_from_median_percent: stats.median_salary
                    ? ((employee.current_salary - stats.median_salary) / stats.median_salary) * 100
                    : 0,
                tenure_months: tenureMonths,
                ai_explanation: explanation,
                explanation_generated_at: new Date().toISOString(),
            }, {
                onConflict: 'employee_id,pay_group_id',
            })
            .select()
            .single();

        if (compError) {
            console.error('Error saving comparison:', compError);
        }

        return NextResponse.json({
            success: true,
            explanation,
            comparison,
        });

    } catch (error) {
        console.error('Error in generate-explanation API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

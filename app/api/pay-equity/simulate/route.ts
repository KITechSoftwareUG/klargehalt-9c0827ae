/**
 * API Route: Run Salary Simulation
 * POST /api/pay-equity/simulate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();
        const body = await request.json();
        const { company_id, pay_group_id, simulation_type, target_gap_percent } = body;

        if (!company_id) {
            return NextResponse.json(
                { error: 'company_id is required' },
                { status: 400 }
            );
        }

        // Auth-Check
        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('company_id', company_id)
            .single();

        if (!userRole || !['admin', 'hr_manager'].includes(userRole.role)) {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // Hole PayGroup-Daten
        const payGroupQuery = supabase
            .from('pay_groups')
            .select(`
        *,
        stats:pay_group_stats(*)
      `)
            .eq('company_id', company_id);

        if (pay_group_id) {
            payGroupQuery.eq('id', pay_group_id);
        }

        const { data: payGroups, error: groupError } = await payGroupQuery;

        if (groupError || !payGroups || payGroups.length === 0) {
            return NextResponse.json(
                { error: 'No pay groups found' },
                { status: 404 }
            );
        }

        let totalCost = 0;
        let totalAffected = 0;
        const breakdown: any[] = [];

        for (const group of payGroups) {
            if (!group.stats || group.stats.length === 0) continue;

            const stats = group.stats[0];
            if (!stats.gender_gap_percent || Math.abs(stats.gender_gap_percent) < 5) {
                continue; // Nur kritische Gruppen
            }

            // Hole alle weiblichen Mitarbeiter dieser Gruppe
            const { data: femaleEmployees } = await supabase
                .from('employees')
                .select('id, current_salary, first_name, last_name')
                .eq('company_id', company_id)
                .eq('gender', 'female')
                .eq('location', group.location)
                .eq('employment_type', group.employment_type);

            if (!femaleEmployees || femaleEmployees.length === 0) continue;

            // Simulation: Alle Frauen auf Median anheben
            const targetSalary = simulation_type === 'raise_to_median'
                ? stats.median_salary
                : stats.avg_salary;

            for (const emp of femaleEmployees) {
                if (emp.current_salary < targetSalary) {
                    const increase = targetSalary - emp.current_salary;
                    totalCost += increase;
                    totalAffected++;

                    breakdown.push({
                        employee_id: emp.id,
                        employee_name: `${emp.first_name} ${emp.last_name}`,
                        current_salary: emp.current_salary,
                        proposed_salary: targetSalary,
                        increase,
                        pay_group: group.group_name,
                    });
                }
            }
        }

        // Berechne neuen Gap
        const currentGap = payGroups[0]?.stats?.[0]?.gender_gap_percent || 0;
        const simulatedGap = simulation_type === 'raise_to_median' ? 0 : target_gap_percent || 0;

        // Speichere Simulation
        const { data: simulation, error: simError } = await supabase
            .from('salary_simulations')
            .insert({
                company_id,
                pay_group_id: pay_group_id || null,
                created_by: user.id,
                simulation_name: `${simulation_type} - ${new Date().toLocaleDateString('de-DE')}`,
                simulation_type,
                current_gap_percent: currentGap,
                simulated_gap_percent: simulatedGap,
                estimated_annual_cost: totalCost,
                affected_employees: totalAffected,
                simulation_details: { breakdown },
            })
            .select()
            .single();

        if (simError) {
            console.error('Error saving simulation:', simError);
        }

        return NextResponse.json({
            success: true,
            simulation,
            breakdown,
            summary: {
                total_cost: totalCost,
                affected_employees: totalAffected,
                current_gap: currentGap,
                simulated_gap: simulatedGap,
            },
        });

    } catch (error) {
        console.error('Error in simulate API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

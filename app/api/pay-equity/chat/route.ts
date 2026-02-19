/**
 * API Route: AI Chat for Pay Equity Questions
 * POST /api/pay-equity/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { currentUser } from '@clerk/nextjs/server';
import { chatWithAI } from '@/lib/services/gemini-service';

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();
        const body = await request.json();
        const { question, employee_id, company_id, history = [] } = body;

        if (!question) {
            return NextResponse.json(
                { error: 'question is required' },
                { status: 400 }
            );
        }

        // Auth-Check
        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role, company_id')
            .eq('user_id', user.id)
            .single();

        if (!userRole) {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // Sammle Kontext-Daten
        let context: Record<string, any> = {
            user_role: userRole.role,
            company_id: userRole.company_id,
        };

        // Wenn Mitarbeiter-Kontext vorhanden
        if (employee_id) {
            const { data: comparison } = await supabase
                .from('employee_comparisons')
                .select(`
          *,
          pay_group:pay_groups(*)
        `)
                .eq('employee_id', employee_id)
                .single();

            if (comparison) {
                context.employee_comparison = {
                    salary: comparison.employee_salary,
                    group_avg: comparison.group_avg_salary,
                    group_median: comparison.group_median_salary,
                    deviation: comparison.deviation_from_avg_percent,
                    group_size: (comparison as any).pay_group?.employee_count,
                    job_family: (comparison as any).pay_group?.job_family,
                    job_level: (comparison as any).pay_group?.job_level,
                };
            }
        }

        // Wenn HR/Admin: Company-weite Stats
        if (['admin', 'hr_manager'].includes(userRole.role) && company_id) {
            const { data: payGroups } = await supabase
                .from('pay_groups')
                .select(`
          *,
          stats:pay_group_stats(*)
        `)
                .eq('company_id', company_id);

            const criticalGroups = payGroups?.filter((g: any) =>
                g.stats?.[0]?.gender_gap_status === 'red'
            ).length || 0;

            context.company_stats = {
                total_groups: payGroups?.length || 0,
                critical_groups: criticalGroups,
            };
        }

        // KI antworten lassen
        const answer = await chatWithAI(question, context, history);

        return NextResponse.json({
            success: true,
            answer,
            context_used: Object.keys(context),
        });

    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

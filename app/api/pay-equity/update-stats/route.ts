/**
 * API Route: Update Pay Group Statistics
 * POST /api/pay-equity/update-stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
    try {
        // Auth-Check
        const user = await currentUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = await createClient();
        const body = await request.json();
        const { company_id } = body;

        if (!company_id) {
            return NextResponse.json(
                { error: 'company_id is required' },
                { status: 400 }
            );
        }

        // Prüfe, ob User zur Firma gehört und HR/Admin-Rechte hat
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

        // SQL-Funktion aufrufen
        const { error: updateError } = await supabase.rpc('update_pay_group_stats', {
            p_company_id: company_id,
        });

        if (updateError) {
            console.error('Error updating stats:', updateError);
            return NextResponse.json(
                { error: 'Failed to update statistics', details: updateError.message },
                { status: 500 }
            );
        }

        // Zähle aktualisierte Gruppen
        const { data: groups, error: countError } = await supabase
            .from('pay_groups')
            .select('id')
            .eq('company_id', company_id);

        if (countError) {
            console.error('Error counting groups:', countError);
        }

        return NextResponse.json({
            success: true,
            groups_updated: groups?.length || 0,
            message: 'Pay group statistics updated successfully',
        });

    } catch (error) {
        console.error('Error in update-stats API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

type RequestType = 'pay_band' | 'avg_pay_category' | 'gap_explanation';

type EmployeeRow = {
  id: string;
  job_profile_id: string | null;
  job_level_id: string | null;
  base_salary: number;
  gender: string;
};

type PayBandRow = {
  min_salary: number | null;
  max_salary: number | null;
  mid_salary: number | null;
};

type JobProfileRow = {
  title: string;
  required_qualifications: string | null;
  min_experience_years: number | null;
  education_level: string | null;
};

type SnapshotRow = {
  mean_gap_base_pct: number | null;
  is_suppressed: boolean;
};

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  if (!context.isAuthenticated || !context.activeOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitKey = `info-request:${context.user?.id}`;
  if (!(await checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { request_type } = (await request.json().catch(() => ({}))) as {
    request_type?: RequestType;
  };

  if (!request_type || !['pay_band', 'avg_pay_category', 'gap_explanation'].includes(request_type)) {
    return NextResponse.json({ error: 'Invalid request_type' }, { status: 400 });
  }

  const supabase = await createClient();

  const orgId = context.activeOrganizationId;
  const userId = context.user?.id;

  // Find the requesting employee record
  const { data: employeeData } = await supabase
    .from('employees')
    .select('id, job_profile_id, job_level_id, base_salary, gender')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  const employee = employeeData as EmployeeRow | null;

  if (!employee) {
    // No employee record — insert pending row for HR manual processing
    const { data, error } = await supabase
      .from('info_requests')
      .insert({
        organization_id: orgId,
        request_type,
        status: 'pending',
        response_data: null,
      })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: (data as { id: string }).id, status: 'pending' });
  }

  // ── Compute response_data ──────────────────────────────────────────────────

  let responseData: Record<string, unknown> | null = null;

  if (request_type === 'pay_band' && employee.job_profile_id) {
    // Get job profile name
    const { data: jpData } = await supabase
      .from('job_profiles')
      .select('title')
      .eq('id', employee.job_profile_id)
      .maybeSingle();
    const jp = jpData as { title: string } | null;

    // Get job level name
    const { data: jlData } = employee.job_level_id
      ? await supabase
          .from('job_levels')
          .select('name')
          .eq('id', employee.job_level_id)
          .maybeSingle()
      : { data: null };
    const jl = jlData as { name: string } | null;

    // Get pay band
    let bandQuery = supabase
      .from('pay_bands')
      .select('min_salary, max_salary, mid_salary')
      .eq('organization_id', orgId)
      .eq('job_profile_id', employee.job_profile_id);

    if (employee.job_level_id) {
      bandQuery = bandQuery.eq('job_level_id', employee.job_level_id);
    }

    const { data: bandData } = await bandQuery.maybeSingle();
    const band = bandData as PayBandRow | null;

    // Count employees in this band
    const { count: bandCount } = await supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('job_profile_id', employee.job_profile_id)
      .eq('is_active', true);

    if (band && (bandCount ?? 0) >= 5) {
      const minSal = band.min_salary ?? 0;
      const maxSal = band.max_salary ?? 0;
      const range = maxSal - minSal;
      const position = range > 0 ? (employee.base_salary - minSal) / range : 0.5;
      const quartile = Math.min(4, Math.max(1, Math.ceil(position * 4)));

      responseData = {
        job_profile: jp?.title ?? 'Unbekannt',
        job_level: jl?.name ?? null,
        band_min: band.min_salary,
        band_median: band.mid_salary,
        band_max: band.max_salary,
        quartile,
        employees_in_band: bandCount ?? 0,
      };
    }
  } else if (request_type === 'avg_pay_category' && employee.job_profile_id) {
    const { data: jpData } = await supabase
      .from('job_profiles')
      .select('title, required_qualifications, min_experience_years, education_level')
      .eq('id', employee.job_profile_id)
      .maybeSingle();
    const jp = jpData as JobProfileRow | null;

    const { data: jlData } = employee.job_level_id
      ? await supabase
          .from('job_levels')
          .select('name')
          .eq('id', employee.job_level_id)
          .maybeSingle()
      : { data: null };
    const jl = jlData as { name: string } | null;

    const { count } = await supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('job_profile_id', employee.job_profile_id)
      .eq('is_active', true);

    if ((count ?? 0) >= 5) {
      responseData = {
        job_profile: jp?.title ?? 'Unbekannt',
        job_level: jl?.name ?? null,
        criteria: {
          min_experience_years: jp?.min_experience_years ?? null,
          education_level: jp?.education_level ?? null,
          required_qualifications: jp?.required_qualifications ?? null,
        },
      };
    }
  } else if (request_type === 'gap_explanation') {
    // Try profile-scoped snapshot first
    if (employee.job_profile_id) {
      const { data: snap } = await supabase
        .from('pay_gap_snapshots')
        .select('mean_gap_base_pct, is_suppressed')
        .eq('organization_id', orgId)
        .eq('scope', 'job_profile')
        .eq('scope_id', employee.job_profile_id)
        .eq('is_suppressed', false)
        .order('snapshot_date', { ascending: false })
        .maybeSingle();
      const profileSnap = snap as SnapshotRow | null;
      if (profileSnap) {
        responseData = { gap_percent: profileSnap.mean_gap_base_pct };
      }
    }

    // Fall back to org-wide snapshot
    if (!responseData) {
      const { data: snap } = await supabase
        .from('pay_gap_snapshots')
        .select('mean_gap_base_pct, is_suppressed')
        .eq('organization_id', orgId)
        .eq('scope', 'company')
        .eq('is_suppressed', false)
        .order('snapshot_date', { ascending: false })
        .maybeSingle();
      const orgSnap = snap as SnapshotRow | null;
      responseData = { gap_percent: orgSnap?.mean_gap_base_pct ?? null };
    }
  }

  const { data, error } = await supabase
    .from('info_requests')
    .insert({
      organization_id: orgId,
      employee_id: employee.id,
      request_type,
      status: responseData ? 'fulfilled' : 'pending',
      response_data: responseData,
      processed_at: responseData ? new Date().toISOString() : null,
      processed_by: 'system',
    })
    .select('id, status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const row = data as { id: string; status: string };

  return NextResponse.json({ id: row.id, status: row.status });
}

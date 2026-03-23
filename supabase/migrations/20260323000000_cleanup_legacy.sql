-- ============================================================
-- CLEANUP MIGRATION: Remove legacy tables and functions
-- Renames dead tables to _deprecated_ prefix (safe rollback)
-- Drops functions that reference auth.uid() (NULL with Logto)
-- ============================================================

-- Legacy tables from pre-canonical migrations (Supabase Auth / Clerk era)
ALTER TABLE IF EXISTS pay_groups RENAME TO _deprecated_pay_groups;
ALTER TABLE IF EXISTS pay_group_stats RENAME TO _deprecated_pay_group_stats;
ALTER TABLE IF EXISTS employee_comparisons RENAME TO _deprecated_employee_comparisons;
ALTER TABLE IF EXISTS gender_gap_history RENAME TO _deprecated_gender_gap_history;
ALTER TABLE IF EXISTS salary_simulations RENAME TO _deprecated_salary_simulations;
ALTER TABLE IF EXISTS salary_info RENAME TO _deprecated_salary_info;
ALTER TABLE IF EXISTS salary_components RENAME TO _deprecated_salary_components;
ALTER TABLE IF EXISTS job_families RENAME TO _deprecated_job_families;
ALTER TABLE IF EXISTS job_levels_normalized RENAME TO _deprecated_job_levels_normalized;
ALTER TABLE IF EXISTS job_profiles_normalized RENAME TO _deprecated_job_profiles_normalized;
ALTER TABLE IF EXISTS job_profile_versions RENAME TO _deprecated_job_profile_versions;
ALTER TABLE IF EXISTS pay_bands_normalized RENAME TO _deprecated_pay_bands_normalized;
ALTER TABLE IF EXISTS pay_band_versions RENAME TO _deprecated_pay_band_versions;
ALTER TABLE IF EXISTS salary_component_types RENAME TO _deprecated_salary_component_types;
ALTER TABLE IF EXISTS salary_components_normalized RENAME TO _deprecated_salary_components_normalized;
ALTER TABLE IF EXISTS employee_assignments RENAME TO _deprecated_employee_assignments;
ALTER TABLE IF EXISTS data_change_history RENAME TO _deprecated_data_change_history;
ALTER TABLE IF EXISTS permissions RENAME TO _deprecated_permissions;
ALTER TABLE IF EXISTS role_permissions RENAME TO _deprecated_role_permissions;
ALTER TABLE IF EXISTS auditor_access RENAME TO _deprecated_auditor_access;
ALTER TABLE IF EXISTS user_sessions RENAME TO _deprecated_user_sessions;
ALTER TABLE IF EXISTS login_attempts RENAME TO _deprecated_login_attempts;
ALTER TABLE IF EXISTS user_mfa_settings RENAME TO _deprecated_user_mfa_settings;
ALTER TABLE IF EXISTS sso_configurations RENAME TO _deprecated_sso_configurations;
ALTER TABLE IF EXISTS employee_info_requests RENAME TO _deprecated_employee_info_requests;
ALTER TABLE IF EXISTS info_request_responses RENAME TO _deprecated_info_request_responses;
ALTER TABLE IF EXISTS request_rate_limits RENAME TO _deprecated_request_rate_limits;
ALTER TABLE IF EXISTS audit_exports RENAME TO _deprecated_audit_exports;
ALTER TABLE IF EXISTS anonymization_config RENAME TO _deprecated_anonymization_config;

-- Drop dead functions (all reference auth.uid() which returns NULL with Logto JWTs)
DROP FUNCTION IF EXISTS public.get_user_permissions();
DROP FUNCTION IF EXISTS public.get_user_company_id();
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role);
DROP FUNCTION IF EXISTS public.has_permission(TEXT);
DROP FUNCTION IF EXISTS public.has_any_permission(TEXT[]);
DROP FUNCTION IF EXISTS public.has_all_permissions(TEXT[]);
DROP FUNCTION IF EXISTS public.verify_tenant_access(UUID);
DROP FUNCTION IF EXISTS public.user_belongs_to_company(UUID);
DROP FUNCTION IF EXISTS public.validate_session();
DROP FUNCTION IF EXISTS public.log_login_attempt(TEXT, BOOLEAN, TEXT, TEXT, TEXT);

-- Audit system RPCs (reference auth.uid() and non-canonical columns)
DROP FUNCTION IF EXISTS public.get_audit_statistics(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.verify_audit_chain(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.create_audit_export(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT[], TEXT[]);
DROP FUNCTION IF EXISTS public.create_audit_log_v2(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.log_login_v2(TEXT, BOOLEAN, TEXT, TEXT, TEXT);

-- Pay equity RPCs (reference auth.uid() and dead tables)
DROP FUNCTION IF EXISTS public.get_safe_salary_statistics(UUID, UUID);
DROP FUNCTION IF EXISTS public.calculate_gender_pay_gap(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.analyze_salary_deviations(NUMERIC);
DROP FUNCTION IF EXISTS public.get_department_statistics();
DROP FUNCTION IF EXISTS public.generate_pay_equity_report();
DROP FUNCTION IF EXISTS public.calculate_gender_gap(NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS public.get_gap_status(NUMERIC);
DROP FUNCTION IF EXISTS public.update_pay_group_stats(UUID);

-- Info request RPCs (reference auth.uid() and dead tables)
DROP FUNCTION IF EXISTS public.get_my_info_requests();
DROP FUNCTION IF EXISTS public.check_request_rate_limit(TEXT);
DROP FUNCTION IF EXISTS public.submit_info_request(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_info_request_response(UUID);

-- Legacy auth functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.audit_job_profiles();
DROP FUNCTION IF EXISTS public.audit_pay_bands();
DROP FUNCTION IF EXISTS public.create_audit_log(TEXT, TEXT, TEXT, UUID, JSONB, JSONB);
DROP FUNCTION IF EXISTS public.check_no_overlapping_assignments();
DROP FUNCTION IF EXISTS public.get_next_job_profile_version(UUID);
DROP FUNCTION IF EXISTS public.get_next_pay_band_version(UUID);
DROP FUNCTION IF EXISTS public.create_job_profile_version(UUID, TEXT, TEXT, UUID, BOOLEAN, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_pay_band_version(UUID, UUID, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_employee_current_pay_band(UUID);
DROP FUNCTION IF EXISTS public.get_pay_band_statistics(UUID);

-- Drop legacy triggers (safe — they reference dropped functions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

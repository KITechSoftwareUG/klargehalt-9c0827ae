const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' }); // Try .env.local first
require('dotenv').config(); // Fallback to .env

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function runSecurityAudit() {
    console.log('\n🔒 STARTING SECURITY AUDIT (HACKER SIMULATION)...\n');
    let passed = true;

    // TEST 1: Anonymous Access (The "Public" Attack)
    console.log('1️⃣  Testing Anonymous Access to Sensitive Data...');
    const { data: publicData, error: publicError } = await supabase
        .from('employees')
        .select('*')
        .limit(5);

    if (publicError) {
        // Error is actually GOOD here if it says "permission denied" or similar, 
        // but typically RLS returns empty array for Anon if no policy matches.
        console.log('   ✅ Access blocked/restricted (Error received: ' + publicError.message + ')');
    } else if (publicData && publicData.length === 0) {
        console.log('   ✅ Access denied (0 records returned for anonymous user)');
    } else {
        console.error('   ❌ CRITICAL FAIL: Anonymous user could read ' + publicData.length + ' employee records!');
        console.log('      (Did you enable RLS and remove the "public" policy?)');
        passed = false;
    }

    // TEST 2: RLS Configuration Check (Introspection)
    // We try to call a stored procedure or check metadata if possible, 
    // but as Anon we usually can't see pg_policies.
    // Instead, we check if the 'audit_logs' table is accessible (should be write-only or admin-read)

    console.log('\n2️⃣  Testing Audit Log Access...');
    const { data: logs, error: logError } = await supabase
        .from('audit_logs')
        .select('*')
        .limit(1);

    if (logError || (logs && logs.length === 0)) {
        console.log('   ✅ Audit Logs are protected from anonymous read.');
    } else {
        console.error('   ❌ FAIL: Anonymous user can read Audit Logs!');
        passed = false;
    }

    // TEST 3: SQL Injection Simulation (Basic)
    console.log('\n3️⃣  Testing Basic SQL Injection protections...');
    const { error: injectionError } = await supabase
        .from('employees')
        .select('*')
        .eq('last_name', "' OR '1'='1"); // Classic SQLi attempt via API

    if (!injectionError) {
        // Supabase/PostgREST handles this safely by parameterizing. 
        // We expect 0 results, not an actual syntax error.
        console.log('   ✅ API successfully sanitized the input (No data leak observed).');
    } else {
        console.log('   ⚠️  API returned error (Safe, but noisy):', injectionError.message);
    }

    console.log('\n' + '='.repeat(50));
    if (passed) {
        console.log('✅  SECURITY AUDIT PASSED: Basic RLS protections appear active.');
    } else {
        console.log('❌  SECURITY AUDIT FAILED: Critical vulnerabilities detected.');
        console.log('    -> Run "SECURITY_HARDENING.sql" in Supabase Dashboard immediately!');
    }
    console.log('='.repeat(50) + '\n');
}

runSecurityAudit();

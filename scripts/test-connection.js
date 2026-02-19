const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);
console.log('Using Key (first 10 chars):', supabaseKey?.substring(0, 10));

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        console.log('--- Testing "companies" table ---');
        const { data, error } = await supabase.from('companies').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Companies search failed:', error.message);
        } else {
            console.log('Companies count:', data);
        }

        console.log('--- Testing "job_profiles" table ---');
        const { data: jp, error: jpe } = await supabase.from('job_profiles').select('id, title').limit(1);
        if (jpe) {
            console.error('Job Profiles search failed:', jpe.message);
        } else {
            console.log('Job Profiles sample:', jp);
        }

        console.log('--- Testing Table Schema (Check for organization_id) ---');
        const { data: cols, error: cole } = await supabase.rpc('get_column_info', { t_name: 'employees' });
        // Note: get_column_info might not exist yet, let's just try to select it
        const { error: colCheck } = await supabase.from('employees').select('organization_id').limit(1);
        if (colCheck) {
            console.error('Column organization_id check failed:', colCheck.message);
        } else {
            console.log('Column organization_id exists!');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

test();

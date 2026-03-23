/**
 * Mitarbeiter-Dashboard: Mein Gehalt
 * Renders the canonical MySalaryComparisonView component
 */

'use client';

import MySalaryComparisonView from '@/components/dashboard/MySalaryComparisonView';

export default function MySalaryPage() {
    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <MySalaryComparisonView />
        </div>
    );
}

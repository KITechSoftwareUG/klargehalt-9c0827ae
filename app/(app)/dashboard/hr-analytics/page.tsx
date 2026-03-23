/**
 * HR-Dashboard: Pay Equity Analyse
 * Renders the canonical PayEquityHRView component
 */

'use client';

import PayEquityHRView from '@/components/dashboard/PayEquityHRView';

export default function HRAnalyticsPage() {
    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <PayEquityHRView />
        </div>
    );
}

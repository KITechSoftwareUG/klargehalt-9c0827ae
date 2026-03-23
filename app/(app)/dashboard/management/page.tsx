/**
 * Management-Dashboard: Executive Overview
 * Renders the canonical PayEquityManagementView component
 */

'use client';

import PayEquityManagementView from '@/components/dashboard/PayEquityManagementView';

export default function ManagementDashboardPage() {
    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <PayEquityManagementView />
        </div>
    );
}

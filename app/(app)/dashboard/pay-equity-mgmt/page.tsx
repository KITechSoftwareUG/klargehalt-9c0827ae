'use client';

import PayEquityManagementView from '@/components/dashboard/PayEquityManagementView';
import { SubscriptionGate } from '@/components/SubscriptionGate';

export default function PayEquityMgmtPage() {
    return (
        <SubscriptionGate feature="pay_gap_analysis">
            <PayEquityManagementView />
        </SubscriptionGate>
    );
}

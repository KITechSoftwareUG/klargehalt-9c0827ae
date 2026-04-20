'use client';

import PayEquityHRView from '@/components/dashboard/PayEquityHRView';
import { SubscriptionGate } from '@/components/SubscriptionGate';

export default function PayEquityHRPage() {
    return (
        <SubscriptionGate feature="pay_gap_analysis">
            <PayEquityHRView />
        </SubscriptionGate>
    );
}

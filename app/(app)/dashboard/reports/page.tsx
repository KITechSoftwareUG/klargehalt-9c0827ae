'use client';

import { PayGapReportView } from '@/components/dashboard/PayGapReportView';
import { SubscriptionGate } from '@/components/SubscriptionGate';

export default function ReportsPage() {
    return (
        <SubscriptionGate feature="pdf_reports">
            <PayGapReportView />
        </SubscriptionGate>
    );
}

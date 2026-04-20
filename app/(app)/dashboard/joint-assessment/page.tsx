'use client';

import JointAssessmentView from '@/components/dashboard/JointAssessmentView';
import { SubscriptionGate } from '@/components/SubscriptionGate';

export default function JointAssessmentPage() {
    return (
        <SubscriptionGate feature="pay_gap_analysis">
            <JointAssessmentView />
        </SubscriptionGate>
    );
}

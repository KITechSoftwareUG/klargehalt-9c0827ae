'use client';

import BillingView from '@/components/dashboard/BillingView';
import { RoleGuard } from '@/components/RoleGuard';
import AccessDenied from '@/components/dashboard/AccessDenied';

export default function BillingPage() {
    return (
        <RoleGuard roles={['admin']} fallback={<AccessDenied />}>
            <BillingView />
        </RoleGuard>
    );
}

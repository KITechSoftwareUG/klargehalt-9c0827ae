'use client';

import AuditLogsView from '@/components/dashboard/AuditLogsView';
import { RoleGuard } from '@/components/RoleGuard';
import AccessDenied from '@/components/dashboard/AccessDenied';

export default function AuditPage() {
    return (
        <RoleGuard roles={['admin', 'lawyer']} fallback={<AccessDenied />}>
            <AuditLogsView />
        </RoleGuard>
    );
}

'use client';

import AuswertungView from '@/components/dashboard/AuswertungView';
import { RoleGuard } from '@/components/RoleGuard';
import AccessDenied from '@/components/dashboard/AccessDenied';

export default function AuswertungPage() {
  return (
    <RoleGuard roles={['owner', 'admin', 'hr_manager']} fallback={<AccessDenied />}>
      <AuswertungView />
    </RoleGuard>
  );
}

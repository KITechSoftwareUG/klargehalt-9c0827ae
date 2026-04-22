'use client';

import { useRouter } from 'next/navigation';
import CompanySetup from '@/components/dashboard/CompanySetup';
import { RoleGuard } from '@/components/RoleGuard';
import AccessDenied from '@/components/dashboard/AccessDenied';

export default function EinstellungenPage() {
    const router = useRouter();
    return (
        <RoleGuard roles={['admin']} fallback={<AccessDenied />}>
            <CompanySetup onComplete={() => router.push('/dashboard')} />
        </RoleGuard>
    );
}

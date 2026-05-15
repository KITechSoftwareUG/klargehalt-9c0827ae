'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { UserPlus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

type MemberRole = 'owner' | 'admin' | 'hr_manager' | 'employee' | 'lawyer' | 'auditor';

interface Member {
    id: string;
    user_id: string;
    role: MemberRole;
    status: 'active' | 'invited' | 'suspended' | 'removed';
    invited_by_user_id: string | null;
    joined_at: string | null;
    access_expires_at: string | null;
    created_at: string;
}

interface SeatUsage {
    planId: string;
    adminUsed: number;
    adminLimit: number;
    hrUsed: number;
    hrLimit: number;
}

interface MembersResponse {
    members: Member[];
    seatUsage: SeatUsage;
}

const ROLE_LABEL: Record<MemberRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    hr_manager: 'HR-Manager',
    employee: 'Mitarbeiter',
    lawyer: 'Anwalt',
    auditor: 'Auditor',
};

function formatLimit(used: number, limit: number): string {
    if (limit === -1) return `${used} (unbegrenzt)`;
    return `${used} von ${limit}`;
}

export default function TeamMembersSection() {
    const { user } = useAuth();
    const [data, setData] = useState<MembersResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'hr_manager'>('hr_manager');
    const [inviteSentResult, setInviteSentResult] = useState<{ email: string; alreadyExisted: boolean } | null>(null);
    const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
    const [removing, setRemoving] = useState(false);
    const [roleSavingId, setRoleSavingId] = useState<string | null>(null);

    const load = async () => {
        try {
            const res = await fetch('/api/members');
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || 'Mitgliederliste konnte nicht geladen werden');
                return;
            }
            const json = (await res.json()) as MembersResponse;
            setData(json);
        } catch {
            toast.error('Verbindungsfehler beim Laden der Mitgliederliste');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const submitInvite = async () => {
        if (!inviteEmail.trim()) {
            toast.error('Bitte Email-Adresse angeben');
            return;
        }
        setInviting(true);
        try {
            const res = await fetch('/api/members/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
            });
            const json = await res.json();
            if (!res.ok) {
                toast.error(json.error || 'Einladung fehlgeschlagen');
                return;
            }
            setInviteSentResult({
                email: inviteEmail.trim(),
                alreadyExisted: json.alreadyExisted,
            });
            setInviteEmail('');
            setInviteRole('hr_manager');
            setInviteOpen(false);
            await load();
        } catch {
            toast.error('Verbindungsfehler — bitte später erneut versuchen');
        } finally {
            setInviting(false);
        }
    };

    const changeRole = async (member: Member, newRole: 'admin' | 'hr_manager') => {
        if (member.role === newRole) return;
        setRoleSavingId(member.id);
        try {
            const res = await fetch(`/api/members/${member.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });
            const json = await res.json();
            if (!res.ok) {
                toast.error(json.error || 'Rolle konnte nicht geändert werden');
                return;
            }
            toast.success(`Rolle aktualisiert: ${ROLE_LABEL[newRole]}`);
            await load();
        } catch {
            toast.error('Verbindungsfehler beim Speichern der Rolle');
        } finally {
            setRoleSavingId(null);
        }
    };

    const confirmRemove = async () => {
        if (!removeTarget) return;
        setRemoving(true);
        try {
            const res = await fetch(`/api/members/${removeTarget.id}`, { method: 'DELETE' });
            const json = await res.json();
            if (!res.ok) {
                toast.error(json.error || 'Mitglied konnte nicht entfernt werden');
                return;
            }
            toast.success('Mitglied entfernt');
            setRemoveTarget(null);
            await load();
        } catch {
            toast.error('Verbindungsfehler beim Entfernen');
        } finally {
            setRemoving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Mitgliederliste wird geladen...
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { members, seatUsage } = data;
    const visibleMembers = members.filter((m) => m.status !== 'removed');
    const adminFull = seatUsage.adminLimit !== -1 && seatUsage.adminUsed >= seatUsage.adminLimit;
    const hrFull = seatUsage.hrLimit !== -1 && seatUsage.hrUsed >= seatUsage.hrLimit;
    const allFull = adminFull && hrFull;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h3 className="font-semibold text-slate-900">Team-Mitglieder</h3>
                    <p className="text-sm text-slate-500">
                        Personen, die sich einloggen und mit dieser Organisation arbeiten können.
                    </p>
                </div>
                <Button
                    onClick={() => setInviteOpen(true)}
                    disabled={allFull}
                    title={allFull ? 'Sitzplätze ausgeschöpft — Plan upgraden' : undefined}
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Mitglied einladen
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-500 text-xs">Admin-Sitze (inkl. Owner)</p>
                    <p className="font-semibold">{formatLimit(seatUsage.adminUsed, seatUsage.adminLimit)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-500 text-xs">HR-Manager-Sitze</p>
                    <p className="font-semibold">{formatLimit(seatUsage.hrUsed, seatUsage.hrLimit)}</p>
                </div>
            </div>

            {allFull && (
                <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">
                    Alle Sitzplätze deines aktuellen Plans sind belegt. Upgrade für mehr Plätze.
                </div>
            )}

            <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                        <tr>
                            <th className="text-left px-4 py-2.5 font-medium">User-ID</th>
                            <th className="text-left px-4 py-2.5 font-medium">Rolle</th>
                            <th className="text-left px-4 py-2.5 font-medium">Status</th>
                            <th className="text-left px-4 py-2.5 font-medium">Hinzugefügt</th>
                            <th className="text-right px-4 py-2.5 font-medium">Aktion</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visibleMembers.map((m) => {
                            const isSelf = m.user_id === user?.id;
                            const isOwner = m.role === 'owner';
                            const canChangeRole = !isSelf && !isOwner && (m.role === 'admin' || m.role === 'hr_manager');
                            const canRemove = !isSelf && !isOwner;
                            const joinedDate = m.joined_at ? new Date(m.joined_at).toLocaleDateString('de-DE') : '—';
                            return (
                                <tr key={m.id}>
                                    <td className="px-4 py-3 text-slate-700 font-mono text-xs">
                                        {m.user_id.slice(0, 12)}…{isSelf && <span className="ml-2 text-slate-400">(du)</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {canChangeRole ? (
                                            <Select
                                                value={m.role}
                                                onValueChange={(v) => changeRole(m, v as 'admin' | 'hr_manager')}
                                                disabled={roleSavingId === m.id}
                                            >
                                                <SelectTrigger className="h-8 w-[140px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="hr_manager">HR-Manager</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge variant="outline">{ROLE_LABEL[m.role]}</Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant="outline"
                                            className={
                                                m.status === 'active'
                                                    ? 'border-green-200 text-green-700 bg-green-50'
                                                    : 'border-slate-200 text-slate-600'
                                            }
                                        >
                                            {m.status === 'active' ? 'Aktiv' : m.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">{joinedDate}</td>
                                    <td className="px-4 py-3 text-right">
                                        {canRemove ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setRemoveTarget(m)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Invite Dialog */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mitglied einladen</DialogTitle>
                        <DialogDescription>
                            Die eingeladene Person bekommt einen Login per Email und kann sofort mit der gewählten
                            Rolle arbeiten.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="invite-email">Email-Adresse</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="kollegin@firma.de"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                disabled={inviting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invite-role">Rolle</Label>
                            <Select
                                value={inviteRole}
                                onValueChange={(v) => setInviteRole(v as 'admin' | 'hr_manager')}
                                disabled={inviting}
                            >
                                <SelectTrigger id="invite-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hr_manager" disabled={hrFull}>
                                        HR-Manager {hrFull && '(Limit erreicht)'}
                                    </SelectItem>
                                    <SelectItem value="admin" disabled={adminFull}>
                                        Admin {adminFull && '(Limit erreicht)'}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500">
                                {inviteRole === 'admin'
                                    ? 'Voller Zugriff inkl. Billing, Audit, Einstellungen.'
                                    : 'Zugriff auf Mitarbeiter, Pay-Bands, Job-Profile, Reports — kein Billing.'}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>
                            Abbrechen
                        </Button>
                        <Button onClick={submitInvite} disabled={inviting}>
                            {inviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Einladen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Invite-sent confirmation. Credentials are delivered via email,
                never returned in the API response — they would otherwise sit in
                the inviter's HTTPS body, DevTools, proxies, browser extensions. */}
            <Dialog
                open={!!inviteSentResult}
                onOpenChange={(open) => {
                    if (!open) setInviteSentResult(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Einladung versendet</DialogTitle>
                        <DialogDescription>
                            {inviteSentResult?.alreadyExisted
                                ? 'Diese Person hatte bereits einen Account und wurde der Organisation hinzugefügt. Sie kann sich mit ihrem bestehenden Passwort einloggen — wir haben sie per E-Mail benachrichtigt.'
                                : 'Wir haben eine E-Mail mit einem temporären Passwort an die eingeladene Person geschickt. Sie sollte es beim ersten Login ändern.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-500">Email</Label>
                            <p className="font-mono text-sm">{inviteSentResult?.email}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setInviteSentResult(null)}>Schließen</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove confirmation */}
            <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mitglied entfernen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Diese Person verliert sofort den Zugriff auf die Organisation. Der Account selbst wird
                            nicht gelöscht — sie kann nur nicht mehr auf diese Organisation zugreifen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={removing}>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmRemove}
                            disabled={removing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {removing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Entfernen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

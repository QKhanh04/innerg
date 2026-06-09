import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    AlertTriangle,
    Edit2,
    Loader2,
    MoreHorizontal,
    Power,
    PowerOff,
    Shield,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { hrModerationApi } from '../../api/hrApi';
import ActionDialog from '../common/ActionDialog';
import { useMemberActions } from '../../hooks/useMemberActions';
import { cn } from '../../lib/utils';
import { toastService } from '../../services/toastService';
import EditMemberModal from './EditMemberModal';
import MemberDetailDrawer from './MemberDetailDrawer';

function EscalateMemberDialog({ member, onClose, onSubmit, isPending }) {
    const [reason, setReason] = useState('Potential policy or conduct issue requires system-admin review');
    const [severity, setSeverity] = useState('High');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ reason: reason.trim(), severity });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-[#0a192f]/60 backdrop-blur-md"
                onClick={onClose}
            />

            <form
                onSubmit={handleSubmit}
                className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            >
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-6 py-6 text-white">
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10 blur-2xl" />
                    <div className="relative flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">Member Escalation</p>
                            <h2 className="text-2xl font-bold tracking-tight">Escalate User To System Admin</h2>
                            <p className="text-sm text-slate-200">
                                Report a member when the issue may need platform-level moderation or stronger enforcement.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition-all hover:bg-white/10 hover:text-white"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                <div className="space-y-5 p-6">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Target Member</p>
                        <p className="mt-2 text-base font-bold text-slate-900">{member.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                            {member.email} • {member.department?.name || 'No department'} • {member.status}
                        </p>
                    </div>

                    <label className="block space-y-2">
                        <span className="text-sm font-bold text-slate-800">Escalation reason</span>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={5}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/5"
                            placeholder="Describe the behavior, policy concern, or risk that needs system-admin review."
                            required
                        />
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm font-bold text-slate-800">Severity</span>
                        <select
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/5"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </label>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isPending || !reason.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0a192f] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#12305A] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isPending && <Loader2 className="size-4 animate-spin" />}
                        Send escalation
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function MemberActionMenu({ member }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [showEscalate, setShowEscalate] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const queryClient = useQueryClient();
    const { assignMentor, revokeMentor, updateStatus, deleteMember } = useMemberActions();

    const escalationMutation = useMutation({
        mutationFn: ({ reason, severity }) =>
            hrModerationApi.createEscalation({
                targetType: 'AppUser',
                targetId: member.id,
                reason,
                severity,
                sourceContext: 'HrMembersPage.MemberActionMenu',
            }),
        onSuccess: () => {
            toastService.success('Escalation sent to system admin.');
            queryClient.invalidateQueries({ queryKey: ['hr', 'moderation'] });
            setShowEscalate(false);
        },
        onError: (err) => {
            toastService.error(err?.response?.data?.message || 'Failed to escalate member');
        },
    });

    const isMentor = member.roles.includes('MENTOR');

    const handleAssignMentor = () => {
        if (isMentor) {
            setConfirmAction('revoke-mentor');
        } else {
            assignMentor(member.id);
        }
        setIsOpen(false);
    };

    const handleToggleStatus = () => {
        const isActivating = member.status !== 'ACTIVE';
        const msg = isActivating
            ? 'Activate this account?'
            : 'The user will not be able to log in. Data remains intact. Confirm deactivation?';

        setConfirmAction(isActivating ? 'activate' : 'deactivate');
        setIsOpen(false);
    };

    const handleDelete = () => {
        setConfirmAction('delete');
        setIsOpen(false);
    };

    const handleOpenEscalate = () => {
        setIsOpen(false);
        setShowEscalate(true);
    };

    const handleConfirmAction = () => {
        if (confirmAction === 'revoke-mentor') {
            revokeMentor(member.id);
        }
        if (confirmAction === 'activate') {
            updateStatus({ userId: member.id, status: 'ACTIVE' });
        }
        if (confirmAction === 'deactivate') {
            updateStatus({ userId: member.id, status: 'INACTIVE' });
        }
        if (confirmAction === 'delete') {
            deleteMember(member.id);
        }
        setConfirmAction(null);
    };

    const confirmConfig = {
        'revoke-mentor': {
            title: 'Revoke Mentor Role',
            description: 'Remove mentor privileges from this member.',
            details: 'If there are upcoming classes, the system will block this action automatically.',
            confirmLabel: 'Revoke mentor',
            intent: 'warning',
        },
        activate: {
            title: 'Activate Account',
            description: 'Allow this member to sign in and use the workspace again.',
            details: member.email,
            confirmLabel: 'Activate account',
        },
        deactivate: {
            title: 'Deactivate Account',
            description: 'The user will no longer be able to sign in, but data will stay intact.',
            details: member.email,
            confirmLabel: 'Deactivate account',
            intent: 'warning',
        },
        delete: {
            title: 'Delete Account',
            description: 'Hide this account while preserving learning history for reporting.',
            details: member.email,
            confirmLabel: 'Delete account',
            intent: 'danger',
        },
    }[confirmAction];

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                >
                    <MoreHorizontal className="w-5 h-5" />
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-50 overflow-hidden py-1">
                            <button
                                onClick={() => { setIsOpen(false); setShowDetail(true); }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <User className="w-4 h-4 text-slate-400" /> View Profile
                            </button>

                            <button
                                onClick={() => { setIsOpen(false); setShowEdit(true); }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <Edit2 className="w-4 h-4 text-slate-400" /> Edit
                            </button>

                            <div className="h-px bg-slate-100 my-1 mx-2" />

                            <button
                                onClick={handleAssignMentor}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <Shield className={cn('w-4 h-4', isMentor ? 'text-amber-500' : 'text-emerald-500')} />
                                {isMentor ? 'Revoke Mentor' : 'Assign Mentor'}
                            </button>

                            <button
                                onClick={handleToggleStatus}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                {member.status === 'ACTIVE' ? (
                                    <><PowerOff className="w-4 h-4 text-orange-500" /> Deactivate</>
                                ) : (
                                    <><Power className="w-4 h-4 text-emerald-500" /> Activate</>
                                )}
                            </button>

                            <button
                                onClick={handleOpenEscalate}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4" /> Escalate User
                            </button>

                            <div className="h-px bg-slate-100 my-1 mx-2" />

                            <button
                                onClick={handleDelete}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Account
                            </button>
                        </div>
                    </>
                )}
            </div>

            {showEdit && (
                <EditMemberModal
                    member={member}
                    onClose={() => setShowEdit(false)}
                />
            )}

            {showDetail && (
                <MemberDetailDrawer
                    userId={member.id}
                    onClose={() => setShowDetail(false)}
                />
            )}

            {showEscalate && (
                <EscalateMemberDialog
                    member={member}
                    onClose={() => setShowEscalate(false)}
                    onSubmit={(payload) => escalationMutation.mutate(payload)}
                    isPending={escalationMutation.isPending}
                />
            )}

            {confirmConfig && (
                <ActionDialog
                    open={Boolean(confirmConfig)}
                    title={confirmConfig.title}
                    description={confirmConfig.description}
                    details={confirmConfig.details}
                    confirmLabel={confirmConfig.confirmLabel}
                    intent={confirmConfig.intent}
                    onClose={() => setConfirmAction(null)}
                    onConfirm={handleConfirmAction}
                />
            )}
        </>
    );
}

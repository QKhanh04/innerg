import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, RotateCcw, X } from 'lucide-react';
import type { InviteListItem } from '../../../types/invitation.types';
import { useInvitationActions } from '../../../hooks/hr/useInvitationActions';

interface Props {
    invite: InviteListItem;
}

export default function InvitationActionMenu({ invite }: Props) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { resendMutation, revokeMutation } = useInvitationActions();

    const canRevoke = invite.status === 'PENDING';
    const canResend = invite.status === 'PENDING' || invite.status === 'EXPIRED';

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!canRevoke && !canResend) return null;

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button
                onClick={() => setOpen((p) => !p)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
                <MoreHorizontal className="w-5 h-5" />
            </button>

            {open && (
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    {canResend && (
                        <button
                            onClick={() => { resendMutation.mutate(invite.id); setOpen(false); }}
                            disabled={resendMutation.isPending}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            <RotateCcw className="w-4 h-4 text-blue-500" />
                            Resend invitation
                        </button>
                    )}
                    {canRevoke && (
                        <button
                            onClick={() => { revokeMutation.mutate(invite.id); setOpen(false); }}
                            disabled={revokeMutation.isPending}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                            <X className="w-4 h-4" />
                            Revoke invitation
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

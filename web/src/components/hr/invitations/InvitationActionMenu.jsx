import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, RotateCcw, X, Trash2 } from 'lucide-react';
import { useInvitationActions } from '../../../hooks/hr/useInvitationActions';

export default function InvitationActionMenu({ invite }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    const { resendMutation, revokeMutation, deleteMutation } = useInvitationActions();

    const canRevoke = invite.status === 'PENDING';
    const canResend = invite.status === 'PENDING' || invite.status === 'EXPIRED';

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button
                onClick={() => setOpen((p) => !p)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
                <MoreHorizontal className="w-5 h-5" />
            </button>

            {open && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-50">
                    <div className="py-1">
                        {canResend && (
                            <button
                                onClick={() => { resendMutation.mutate(invite.id); setOpen(false); }}
                                disabled={resendMutation.isPending}
                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                <RotateCcw className="w-4 h-4 text-[#13ecb6]" />
                                Resend invitation
                            </button>
                        )}
                        {canRevoke && (
                            <button
                                onClick={() => { revokeMutation.mutate(invite.id); setOpen(false); }}
                                disabled={revokeMutation.isPending}
                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                            >
                                <X className="w-4 h-4" />
                                Revoke invitation
                            </button>
                        )}
                    </div>
                    <div className="py-1">
                        <button
                            onClick={() => {
                                if (window.confirm("Are you sure you want to delete this invitation?")) {
                                    deleteMutation.mutate(invite.id);
                                    setOpen(false);
                                }
                            }}
                            disabled={deleteMutation.isPending}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete invitation
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

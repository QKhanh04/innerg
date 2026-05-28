import React from 'react';
import type { InviteListItem } from '../../../types/invitation.types';
import InvitationActionMenu from './InvitationActionMenu';

interface Props {
    invitations: InviteListItem[];
    isLoading: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Chờ xử lý', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    ACCEPTED: { label: 'Đã chấp nhận', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    EXPIRED: { label: 'Hết hạn', className: 'bg-slate-100 text-slate-500 border border-slate-200' },
    REVOKED: { label: 'Đã thu hồi', className: 'bg-red-50 text-red-600 border border-red-200' },
};

function fmt(date: string) {
    return new Date(date).toLocaleDateString('vi-VN');
}

export default function InvitationTable({ invitations, isLoading }: Props) {
    if (isLoading) return null;

    if (!invitations.length) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-20 flex flex-col items-center gap-3">
                <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-400 font-medium">No statement yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                            <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-xs">Email</th>
                            <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-xs">Full name</th>
                            <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-xs">Role</th>
                            <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-xs">Department</th>
                            <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-xs">Status</th>
                            <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-xs">Invited by</th>
                            <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-xs">Expired</th>
                            <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-xs">Date Sent</th>
                            <th className="px-5 py-3.5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {invitations.map((inv) => {
                            const sc = statusConfig[inv.status] ?? statusConfig.EXPIRED;
                            return (
                                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-5 py-4 font-medium text-slate-800">{inv.email}</td>
                                    <td className="px-5 py-4 text-slate-600">{inv.fullName || <span className="text-slate-300">---</span>}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {inv.roles.map((r) => (
                                                <span key={r} className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#13ecb6]/10 text-[#0a192f] border border-[#13ecb6]/30">{r}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-slate-600">{inv.department || <span className="text-slate-300">---</span>}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sc.className}`}>{sc.label}</span>
                                    </td>
                                    <td className="px-5 py-4 text-slate-600">{inv.invitedBy || <span className="text-slate-300">---</span>}</td>
                                    <td className="px-5 py-4 text-slate-500">{fmt(inv.expiresAt)}</td>
                                    <td className="px-5 py-4 text-slate-500">{fmt(inv.createdAt)}</td>
                                    <td className="px-5 py-4 text-right">
                                        <InvitationActionMenu invite={inv} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

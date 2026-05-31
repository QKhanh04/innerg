import React, { useState } from 'react';
import type { InviteListItem } from '../../../types/invitation.types';
import InvitationActionMenu from './InvitationActionMenu';
import { Trash2, AlertCircle } from 'lucide-react';
import { useInvitationActions } from '../../../hooks/hr/useInvitationActions';
import { cn } from '../../../lib/utils';

interface Props {
    invitations: InviteListItem[];
    isLoading: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    ACCEPTED: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    EXPIRED: { label: 'Expired', className: 'bg-slate-100 text-slate-500 border border-slate-200' },
    REVOKED: { label: 'Revoked', className: 'bg-red-50 text-red-600 border border-red-200' },
};

function fmt(date: string) {
    return new Date(date).toLocaleDateString('en-US');
}

export default function InvitationTable({ invitations, isLoading }: Props) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const { bulkDeleteMutation } = useInvitationActions();

    if (isLoading) return null;

    if (!invitations.length) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-20 flex flex-col items-center gap-3">
                <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-400 font-medium">No invitations found.</p>
            </div>
        );
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === invitations.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(invitations.map(i => i.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} invitations?`)) {
            bulkDeleteMutation.mutate(selectedIds, {
                onSuccess: () => setSelectedIds([])
            });
        }
    };

    return (
        <div className="relative">
            {/* Bulk Actions Toolbar */}
            <div className={cn(
                "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#0a192f] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 transition-all duration-300 border border-slate-700/50",
                selectedIds.length > 0 ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-95 pointer-events-none"
            )}>
                <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
                    <div className="size-8 rounded-lg bg-[#13ecb6] text-[#0a192f] flex items-center justify-center font-extrabold text-sm">
                        {selectedIds.length}
                    </div>
                    <span className="text-sm font-bold tracking-tight">Invitations Selected</span>
                </div>

                <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors font-bold text-sm px-2 py-1 rounded-lg hover:bg-red-400/10 active:scale-95 disabled:opacity-50"
                >
                    {bulkDeleteMutation.isPending ? (
                        <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Trash2 className="size-4" />
                    )}
                    Bulk Delete
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60">
                                <th className="px-5 py-3.5 text-left w-10">
                                    <input
                                        type="checkbox"
                                        className="size-4 rounded border-slate-300 text-[#13ecb6] focus:ring-[#13ecb6] cursor-pointer"
                                        checked={selectedIds.length === invitations.length && invitations.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Email</th>
                                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Full name</th>
                                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Role</th>
                                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Department</th>
                                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Status</th>
                                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Expired</th>
                                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Date Sent</th>
                                <th className="px-5 py-3.5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invitations.map((inv) => {
                                const sc = statusConfig[inv.status] ?? statusConfig.EXPIRED;
                                const isSelected = selectedIds.includes(inv.id);
                                return (
                                    <tr key={inv.id} className={cn(
                                        "hover:bg-slate-50/50 transition-colors group",
                                        isSelected && "bg-emerald-50/30"
                                    )}>
                                        <td className="px-5 py-4">
                                            <input
                                                type="checkbox"
                                                className="size-4 rounded border-slate-300 text-[#13ecb6] focus:ring-[#13ecb6] cursor-pointer"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(inv.id)}
                                            />
                                        </td>
                                        <td className="px-5 py-4 font-bold text-[#0a192f]">{inv.email}</td>
                                        <td className="px-5 py-4 text-slate-600 font-medium">{inv.fullName || <span className="text-slate-300 italic text-[11px]">No name</span>}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {inv.roles.map((r) => (
                                                    <span key={r} className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600 font-bold text-[11px] uppercase tracking-wider">{inv.department || <span className="text-slate-300 font-normal italic">---</span>}</td>
                                        <td className="px-5 py-4">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest",
                                                sc.className
                                            )}>
                                                {sc.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 font-medium tabular-nums">{fmt(inv.expiresAt)}</td>
                                        <td className="px-5 py-4 text-slate-500 font-medium tabular-nums">{fmt(inv.createdAt)}</td>
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
        </div>
    );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrWishlistsApi } from '../../../api/hrApi';
import { toastService } from '../../../services/toastService';
import { cn } from '../../../lib/utils';
import ActionDialog from '../../../components/common/ActionDialog';
import InternalMentorModal from './InternalMentorModal';
import { Award, Clock, Users, TrendingUp, Search, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function HrWishlistsPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState('');
    const [findingTrainerFor, setFindingTrainerFor] = useState(null);
    const [rejectDialog, setRejectDialog] = useState(null);

    const { data: items = [], isLoading } = useQuery({
        queryKey: ['hr', 'wishlists', statusFilter],
        queryFn: () => hrWishlistsApi.list(statusFilter ? { status: statusFilter } : {}),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status, rejectionReason }) =>
            hrWishlistsApi.updateStatus(id, { status, rejectionReason }),
        onSuccess: (_data, vars) => {
            toastService.success(`Status updated to ${vars.status}`);
            queryClient.invalidateQueries({ queryKey: ['hr', 'wishlists'] });
        },
        onError: (err) => {
            toastService.error(err?.response?.data?.message || 'Failed to update status');
        }
    });

    const openRejectDialog = (wishlist, status = 'Rejected', initialReason = 'Not suitable') => {
        setRejectDialog({
            wishlist,
            status,
            initialReason: wishlist.rejectionReason || initialReason,
        });
    };

    const handleRejectConfirm = (reason) => {
        if (!rejectDialog) {
            return;
        }

        statusMutation.mutate(
            {
                id: rejectDialog.wishlist.id,
                status: rejectDialog.status,
                rejectionReason: reason || 'Not suitable',
            },
            {
                onSuccess: () => setRejectDialog(null),
            }
        );
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-10"
        >
            {/* ── Hero Section ─────────────────────────────────────────────────── */}
            <motion.section variants={itemVariants} className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-8 py-10 text-white shadow-2xl shadow-primary/10 transition-transform duration-500">
                <div className="absolute right-0 top-0 h-48 w-48 translate-x-10 -translate-y-10 rounded-full bg-primary/20 blur-[60px] animate-pulse" />
                <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-10 translate-y-10 rounded-full bg-teal-400/10 blur-[60px]" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDExNSwxMTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20" />

                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
                    <div className="space-y-3">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md"
                        >
                            <div className="size-2 rounded-full bg-primary animate-pulse" />
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">HR Module</p>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl lg:text-5xl font-black tracking-tight drop-shadow-md"
                        >
                            Wishlist Management
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="max-w-2xl text-sm leading-relaxed text-slate-200/90 font-medium"
                        >
                            Review and assign trainers for learning proposals. Coordinate internal and external resources effectively.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="relative w-full md:w-64">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <TrendingUp className="size-4 text-primary" />
                        </div>
                        <select
                            className="w-full pl-11 pr-10 h-12 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary appearance-none cursor-pointer transition-all"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="" className="text-slate-900">All Project Statuses</option>
                            <option value="Pending" className="text-slate-900">Pending Review</option>
                            <option value="FindingTrainer" className="text-slate-900">Mentor Sourcing</option>
                            <option value="Scheduled" className="text-slate-900">Scheduled</option>
                            <option value="Completed" className="text-slate-900">Completed</option>
                            <option value="Rejected" className="text-slate-900">Rejected</option>
                            <option value="NeedsExternalExpert" className="text-slate-900">Expert Needed</option>
                            <option value="ExternalProcessing" className="text-slate-900">External Procurement</option>
                            <option value="Deferred" className="text-slate-900">Postponed</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {isLoading ? (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
                    >
                        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                            <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
                        </div>
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex gap-4 items-center animate-pulse">
                                    <div className="h-10 w-10 bg-slate-100 rounded-lg" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 w-1/3 bg-slate-100 rounded" />
                                        <div className="h-3 w-1/4 bg-slate-50 rounded" />
                                    </div>
                                    <div className="h-8 w-24 bg-slate-50 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            ) : (
                <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm transition-all hover:shadow-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Award className="size-3.5 text-primary" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Competency / Topic</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Users className="size-3.5 text-primary" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Originator</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="size-3.5 text-primary" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Demand Index</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Operational Status</span>
                                    </th>
                                    <th className="px-6 py-5 text-right">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Management</span>
                                    </th>
                                </tr>
                            </thead>
                            <motion.tbody
                                variants={{
                                    show: { transition: { staggerChildren: 0.05 } }
                                }}
                                initial="hidden"
                                animate="show"
                                className="divide-y divide-slate-50"
                            >
                                {items.map((w) => (
                                    <motion.tr
                                        variants={{
                                            hidden: { opacity: 0, y: 10 },
                                            show: { opacity: 1, y: 0 }
                                        }}
                                        key={w.id}
                                        className="hover:bg-slate-50/30 transition-colors group"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">{w.skillName}</div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                    <Clock className="size-3" />
                                                    {new Date(w.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-0.5">
                                                <div className="text-slate-700 font-bold text-sm tracking-tight">{w.proposerName}</div>
                                                <div className="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 w-fit">
                                                    {w.departmentName || 'Corporate'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-black text-xl text-slate-900 leading-none">{w.voteCount}</span>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-1 border-l border-slate-200 ml-1">Requests</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="relative w-fit">
                                                <select
                                                    className={cn(
                                                        "appearance-none h-8 pl-3 pr-8 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer shadow-sm outline-none",
                                                        w.status === 'Pending' ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                            w.status === 'FindingTrainer' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                                w.status === 'Scheduled' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                                    w.status === 'Rejected' ? "bg-red-50 text-red-600 border-red-100" :
                                                                        w.status === 'NeedsExternalExpert' ? "bg-purple-50 text-purple-600 border-purple-100" :
                                                                            w.status === 'ExternalProcessing' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                                                                w.status === 'Deferred' ? "bg-slate-100 text-slate-600 border-slate-200" :
                                                                                    "bg-slate-50 text-slate-500 border-slate-100"
                                                    )}
                                                    value={w.status}
                                                    onChange={(e) => {
                                                        const newStatus = e.target.value;
                                                        if (newStatus === 'Rejected') {
                                                            openRejectDialog(w, newStatus);
                                                        } else {
                                                            statusMutation.mutate({ id: w.id, status: newStatus });
                                                        }
                                                    }}
                                                >
                                                    <option value="Pending">Pending Review</option>
                                                    <option value="FindingTrainer">Mentor Sourcing</option>
                                                    <option value="Scheduled">Scheduled</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Rejected">Rejected</option>
                                                    <option value="NeedsExternalExpert">External Needed</option>
                                                    <option value="ExternalProcessing">External Proc.</option>
                                                    <option value="Deferred">Postponed</option>
                                                </select>
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end gap-3 transition-all">
                                                {w.status === 'Pending' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setFindingTrainerFor(w)}
                                                            className="h-9 px-4 bg-primary text-[#0a192f] text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                                        >
                                                            <Users className="size-3.5" />
                                                            Assign Mentor
                                                        </button>
                                                        <button
                                                            onClick={() => statusMutation.mutate({ id: w.id, status: 'NeedsExternalExpert' })}
                                                            className="h-9 px-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2"
                                                        >
                                                            <TrendingUp className="size-3.5 text-primary" />
                                                            External
                                                        </button>
                                                    </div>
                                                )}

                                                {w.status === 'NeedsExternalExpert' && (
                                                    <button
                                                        onClick={() => statusMutation.mutate({ id: w.id, status: 'ExternalProcessing' })}
                                                        className="h-9 px-5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-md shadow-indigo-600/20"
                                                    >
                                                        Dispatch to External
                                                    </button>
                                                )}

                                                {w.status === 'FindingTrainer' && (
                                                    <button
                                                        onClick={() => navigate(`/mentor/create?wishlistId=${w.id}&skillName=${encodeURIComponent(w.skillName)}`)}
                                                        className="h-9 px-5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-md shadow-emerald-600/20"
                                                    >
                                                        Initialize Class
                                                    </button>
                                                )}

                                                {/* Global Context Actions */}
                                                {!['Rejected', 'Completed', 'Scheduled'].includes(w.status) && (
                                                    <div className="flex gap-1.5 pl-3 border-l border-slate-100 ml-2">
                                                        <button
                                                            onClick={() => openRejectDialog(w)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Reject Proposal"
                                                        >
                                                            <X className="size-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => statusMutation.mutate({ id: w.id, status: 'Deferred' })}
                                                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                                            title="Postpone Action"
                                                        >
                                                            <Clock className="size-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </table>

                        {!items.length && (
                            <div className="bg-slate-50/50 border-t border-slate-100 flex flex-col items-center justify-center py-24 gap-6 text-center animate-in zoom-in-95">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-slate-200/50 blur-2xl rounded-full group-hover:bg-slate-200/80 transition-all duration-500" />
                                    <div className="relative size-20 rounded-3xl bg-white flex items-center justify-center text-slate-200 border border-slate-100 shadow-sm">
                                        <Search className="size-10" />
                                    </div>
                                </div>
                                <div className="space-y-1 relative">
                                    <p className="text-xl font-bold text-slate-900">Query Result Empty</p>
                                    <p className="text-slate-400 font-medium text-sm">No wishlist entries match the current status filters.</p>
                                </div>
                                <button
                                    onClick={() => setStatusFilter('')}
                                    className="mt-2 px-8 py-3 bg-[#0a192f] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:brightness-125 active:scale-95 transition-all shadow-lg shadow-slate-900/20"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {findingTrainerFor && (
                <InternalMentorModal
                    wishlist={findingTrainerFor}
                    onClose={() => setFindingTrainerFor(null)}
                />
            )}

            <ActionDialog
                open={Boolean(rejectDialog)}
                title="Reject Wishlist Proposal"
                description="Share a short reason so the requester understands why this proposal was not accepted."
                details={rejectDialog ? `${rejectDialog.wishlist.skillName} • ${rejectDialog.wishlist.proposerName}` : null}
                reasonLabel="Rejection reason"
                reasonPlaceholder="Explain why this topic is not being approved right now."
                initialReason={rejectDialog?.initialReason || 'Not suitable'}
                requireReason
                confirmLabel="Reject proposal"
                intent="danger"
                isPending={statusMutation.isPending}
                onClose={() => setRejectDialog(null)}
                onConfirm={handleRejectConfirm}
            />
        </motion.div>
    );
}

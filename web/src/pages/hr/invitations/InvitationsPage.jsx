import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { MailPlus, FileSpreadsheet, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { useInvitations } from '../../../hooks/hr/useInvitations';
import InvitationTable from '../../../components/hr/invitations/InvitationTable';
import InvitationFilters from '../../../components/hr/invitations/InvitationFilters';
import SingleInviteModal from '../../../components/hr/invitations/SingleInviteModal';
import BulkInviteModal from '../../../components/hr/invitations/BulkInviteModal';
import { motion, AnimatePresence } from 'framer-motion';

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function InvitationsPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebounce(search, 400);
    const [status, setStatus] = useState('');

    const [isSingleModalOpen, setSingleModalOpen] = useState(false);
    const [isBulkModalOpen, setBulkModalOpen] = useState(false);

    // Reset page when search or status changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status]);

    const { data, isLoading } = useInvitations({
        page,
        pageSize: 10,
        search: debouncedSearch,
        status: status || undefined,
    });

    const totalPages = Math.ceil((data?.total ?? 0) / 10);

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

                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10">
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
                            className="text-4xl font-black tracking-tight drop-shadow-md"
                        >
                            Invitations
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="max-w-2xl text-sm leading-relaxed text-slate-200/90 font-medium"
                        >
                            Manage and send invitations to new employees to join the workspace
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap items-center gap-3"
                    >
                        <button
                            onClick={() => setBulkModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 hover:shadow-lg transition-all text-sm"
                        >
                            <FileSpreadsheet className="size-4.5 text-primary" />
                            Bulk Import
                        </button>
                        <button
                            onClick={() => setSingleModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-[#0a192f] font-black rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-sm"
                        >
                            <UserPlus className="size-5" />
                            Create Invite
                        </button>
                    </motion.div>
                </div>
            </motion.section>

            {/* ── Filters ──────────────────────────────────────────────────────── */}
            <motion.div variants={itemVariants} className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-xl p-2.5 shadow-sm hover:shadow-md transition-all">
                <InvitationFilters
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                />
            </motion.div>

            {/* ── Table Container ──────────────────────────────────────────────── */}
            <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm overflow-hidden hover:shadow-lg transition-all">
                <InvitationTable invitations={data?.data ?? []} isLoading={isLoading} />
            </motion.div>

            {/* ── Pagination ───────────────────────────────────────────────────── */}
            <AnimatePresence>
                {!isLoading && (data?.total ?? 0) > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-slate-500 font-medium">
                                Showing <span className="text-slate-900 font-bold">{(page - 1) * 10 + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(page * 10, data?.total ?? 0)}</span> of <span className="text-primary font-black ml-1 bg-primary/10 px-2 py-0.5 rounded-md">{data?.total}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-primary hover:border-primary/40 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 hover:shadow-md transition-all"
                                title="Previous Page"
                            >
                                <ChevronLeft className="size-4.5" />
                            </button>

                            <div className="flex items-center gap-1 mx-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Page</span>
                                <div className="size-9 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-sm shadow-inner shadow-primary/5">
                                    {page}
                                </div>
                                <span className="text-[10px] font-black text-slate-300 mx-2 uppercase">Of</span>
                                <div className="size-9 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm">
                                    {totalPages || 1}
                                </div>
                            </div>

                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || totalPages === 0}
                                className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-primary hover:border-primary/40 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 hover:shadow-md transition-all"
                                title="Next Page"
                            >
                                <ChevronRight className="size-4.5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {isSingleModalOpen && <SingleInviteModal onClose={() => setSingleModalOpen(false)} />}
                {isBulkModalOpen && <BulkInviteModal onClose={() => setBulkModalOpen(false)} />}
            </AnimatePresence>
        </motion.div>
    );

}

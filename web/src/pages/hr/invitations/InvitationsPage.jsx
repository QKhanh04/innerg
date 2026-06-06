import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { MailPlus, FileSpreadsheet, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { useInvitations } from '../../../hooks/hr/useInvitations';
import InvitationTable from '../../../components/hr/invitations/InvitationTable';
import InvitationFilters from '../../../components/hr/invitations/InvitationFilters';
import SingleInviteModal from '../../../components/hr/invitations/SingleInviteModal';
import BulkInviteModal from '../../../components/hr/invitations/BulkInviteModal';

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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Hero Section ─────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-6 py-8 text-white shadow-lg shadow-slate-900/10">
                <div className="absolute right-0 top-0 h-48 w-48 translate-x-10 -translate-y-10 rounded-full bg-primary/15 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-10 translate-y-10 rounded-full bg-primary/10 blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">HR Module</p>
                        <h1 className="text-3xl font-bold tracking-tight">Invitations</h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-200">
                            Manage and send invitations to new employees to join the workspace
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setBulkModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-sm"
                        >
                            <FileSpreadsheet className="size-4 text-primary" />
                            Bulk Import
                        </button>
                        <button
                            onClick={() => setSingleModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-[#0a192f] font-bold rounded-xl shadow-lg hover:brightness-105 active:scale-95 transition-all text-sm"
                        >
                            <UserPlus className="size-5" />
                            Create Invite
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Filters ──────────────────────────────────────────────────────── */}
            <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                <InvitationFilters
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                />
            </div>

            {/* ── Table Container ──────────────────────────────────────────────── */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <InvitationTable invitations={data?.data ?? []} isLoading={isLoading} />
            </div>

            {/* ── Pagination ───────────────────────────────────────────────────── */}
            {!isLoading && (data?.total ?? 0) > 0 && (
                <div className="flex items-center justify-between px-6 py-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-slate-500 font-medium">
                            Showing <span className="text-slate-900 font-bold">{(page - 1) * 10 + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(page * 10, data?.total ?? 0)}</span> of <span className="text-slate-900 font-bold">{data?.total}</span> records
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-primary hover:border-primary/30 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all shadow-sm"
                            title="Previous Page"
                        >
                            <ChevronLeft className="size-4.5" />
                        </button>

                        <div className="flex items-center gap-1 mx-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Page</span>
                            <div className="size-9 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-sm">
                                {page}
                            </div>
                            <span className="text-xs font-bold text-slate-400 mx-2">of</span>
                            <div className="size-9 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm">
                                {totalPages || 1}
                            </div>
                        </div>

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || totalPages === 0}
                            className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-primary hover:border-primary/30 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all shadow-sm"
                            title="Next Page"
                        >
                            <ChevronRight className="size-4.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {isSingleModalOpen && <SingleInviteModal onClose={() => setSingleModalOpen(false)} />}
            {isBulkModalOpen && <BulkInviteModal onClose={() => setBulkModalOpen(false)} />}
        </div>
    );

}

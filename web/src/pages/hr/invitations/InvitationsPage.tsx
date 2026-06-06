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
        <div className="py-8 px-6 max-w-7xl mx-auto min-h-[calc(100vh-4rem)] space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#0a192f] tracking-tight">Invitations</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage and send invitations to new employees to join the workspace</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setBulkModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        Import CSV/Excel
                    </button>
                    <button
                        onClick={() => setSingleModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#13ecb6] text-[#0a192f] font-bold rounded-xl shadow-sm shadow-[#13ecb6]/20 hover:brightness-105 transition-all"
                    >
                        <UserPlus className="w-5 h-5" />
                        Create Invite
                    </button>
                </div>
            </div>

            {/* Filters */}
            <InvitationFilters
                search={search}
                onSearchChange={setSearch}
                status={status}
                onStatusChange={setStatus}
            />

            {/* Table */}
            <InvitationTable invitations={data?.data ?? []} isLoading={isLoading} />

            {/* Pagination */}
            {!isLoading && (data?.total ?? 0) > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">
                        Showing <span className="font-bold text-slate-700">{(page - 1) * 10 + 1}</span> - <span className="font-bold text-slate-700">{Math.min(page * 10, data?.total ?? 0)}</span> of <span className="font-bold text-slate-700">{data?.total}</span> invitations
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || totalPages === 0}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                        >
                            <ChevronRight className="w-4 h-4" />
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

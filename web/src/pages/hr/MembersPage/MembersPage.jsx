import React, { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Users, Plus, Download } from 'lucide-react';
import { useMembers } from '../../../hooks/useMembers';
import { membersApi } from '../../../api/memberApi';
import useDebounce from '../../../hooks/useDebound';
import MemberTable from '../../../components/members/MemberTable';

export default function MembersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [filters, setFilters] = useState({
        page: 1,
        pageSize: 10,
        role: '',
        status: ''
    });

    const { data, isLoading } = useMembers({
        ...filters,
        search: debouncedSearch
    });

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const totalPages = data ? Math.ceil(data.total / filters.pageSize) : 0;

    const handleExport = async () => {
        const blob = await membersApi.exportCsv({
            ...filters,
            search: debouncedSearch,
        });
        const url = window.URL.createObjectURL(new Blob([blob]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'members.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Hero Section ─────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-6 py-8 text-white shadow-lg shadow-slate-900/10">
                <div className="absolute right-0 top-0 h-48 w-48 translate-x-10 -translate-y-10 rounded-full bg-primary/15 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-10 translate-y-10 rounded-full bg-primary/10 blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">HR Module</p>
                        <h1 className="text-3xl font-bold tracking-tight">Members</h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-200">
                            Personnel management, access control, and learning status tracking.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={handleExport}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-sm"
                        >
                            <Download className="size-4 text-primary" />
                            Export Data
                        </button>
                        <a
                            href="/invitations"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-[#0a192f] font-bold rounded-xl shadow-lg hover:brightness-105 active:scale-95 transition-all text-sm"
                        >
                            <Plus className="size-5" />
                            Invite Member
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Filters Area ─────────────────────────────────────────────────── */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50/50 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/40 outline-none transition-all"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex w-full lg:w-auto items-center gap-3">
                    <div className="relative flex-1 lg:w-44">
                        <select
                            value={filters.role}
                            onChange={(e) => handleFilterChange('role', e.target.value)}
                            className="block w-full pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/40 appearance-none text-slate-700 font-bold cursor-pointer transition-all outline-none"
                        >
                            <option value="">All Roles</option>
                            <option value="HR">HR Administrator</option>
                            <option value="MENTOR">Mentor</option>
                            <option value="MENTEE">Mentee</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 border-l border-slate-200 my-2">
                            <Filter className="size-3.5" />
                        </div>
                    </div>

                    <div className="relative flex-1 lg:w-44">
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="block w-full pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/40 appearance-none text-slate-700 font-bold cursor-pointer transition-all outline-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="ACTIVE">Active Users</option>
                            <option value="INACTIVE">Inactive / Blocked</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 border-l border-slate-200 my-2">
                            <Filter className="size-3.5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content ─────────────────────────────────────────────────── */}
            <div className="relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl animate-in fade-in duration-300">
                        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-xl border border-slate-100 font-bold text-slate-600 text-sm">
                            <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            Synchronizing members...
                        </div>
                    </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <MemberTable members={data?.data || []} isLoading={isLoading} />
                </div>

                {/* ── Pagination ───────────────────────────────────────────────────── */}
                {data && data.total > 0 && (
                    <div className="mt-8 flex items-center justify-between px-6 py-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-slate-500 font-medium">
                                Showing <span className="text-slate-900 font-bold">{(filters.page - 1) * filters.pageSize + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(filters.page * filters.pageSize, data.total)}</span> of <span className="text-primary font-bold">{data.total}</span> members
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handlePageChange(filters.page - 1)}
                                disabled={filters.page === 1}
                                className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-primary hover:border-primary/30 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all shadow-sm"
                                title="Previous Page"
                            >
                                <ChevronLeft className="size-4.5" />
                            </button>

                            <div className="flex items-center gap-1 mx-1 px-2 border-x border-slate-100">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum = filters.page;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (filters.page <= 3) pageNum = i + 1;
                                    else if (filters.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = filters.page - 2 + i;

                                    const isActive = filters.page === pageNum;

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`size-9 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${isActive
                                                ? 'bg-primary text-[#0a192f] shadow-sm'
                                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(filters.page + 1)}
                                disabled={filters.page >= totalPages}
                                className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-primary hover:border-primary/30 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all shadow-sm"
                                title="Next Page"
                            >
                                <ChevronRight className="size-4.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

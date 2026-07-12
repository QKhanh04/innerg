import React, { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Users, Plus, Download } from 'lucide-react';
import { useMembers } from '../../../hooks/useMembers';
import { membersApi } from '../../../api/memberApi';
import useDebounce from '../../../hooks/useDebound';
import MemberTable from '../../../components/members/MemberTable';
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
                            className="text-4xl lg:text-5xl font-black tracking-tight drop-shadow-md"
                        >
                            Members
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="max-w-2xl text-sm leading-relaxed text-slate-200/90 font-medium"
                        >
                            Personnel management, access control, and learning status tracking across all active or inactive accounts in the enterprise.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap items-center gap-3"
                    >
                        <button
                            type="button"
                            onClick={handleExport}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 text-white font-bold rounded-xl border border-white/20 backdrop-blur-md hover:bg-white/20 hover:shadow-lg transition-all text-sm"
                        >
                            <Download className="size-4.5 text-primary" />
                            Export Data
                        </button>
                        <a
                            href="/invitations"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-[#0a192f] font-black rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-sm"
                        >
                            <Plus className="size-5" />
                            Invite Member
                        </a>
                    </motion.div>
                </div>
            </motion.section>

            {/* ── Filters Area ─────────────────────────────────────────────────── */}
            <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl p-3 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-slate-400 group-focus-within:text-primary transition-colors duration-300" />
                    <input
                        type="text"
                        className="block w-full pl-11 pr-4 py-2.5 border border-slate-200/80 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all shadow-inner shadow-slate-100/50"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex w-full md:w-auto items-center gap-3">
                    <div className="relative flex-1 md:w-48 group">
                        <select
                            value={filters.role}
                            onChange={(e) => handleFilterChange('role', e.target.value)}
                            className="block w-full pl-4 pr-10 py-2.5 text-sm border border-slate-200/80 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/40 appearance-none text-slate-700 font-bold cursor-pointer transition-all outline-none shadow-sm group-hover:border-slate-300"
                        >
                            <option value="">All Roles</option>
                            <option value="HR">HR Administrator</option>
                            <option value="MENTOR">Mentor</option>
                            <option value="MENTEE">Mentee</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 border-l border-slate-200/80 my-2 group-hover:text-primary transition-colors">
                            <Filter className="size-3.5" />
                        </div>
                    </div>

                    <div className="relative flex-1 md:w-48 group">
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="block w-full pl-4 pr-10 py-2.5 text-sm border border-slate-200/80 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/40 appearance-none text-slate-700 font-bold cursor-pointer transition-all outline-none shadow-sm group-hover:border-slate-300"
                        >
                            <option value="">All Statuses</option>
                            <option value="ACTIVE">Active Users</option>
                            <option value="INACTIVE">Inactive / Blocked</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 border-l border-slate-200/80 my-2 group-hover:text-primary transition-colors">
                            <Filter className="size-3.5" />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Main Content ─────────────────────────────────────────────────── */}
            <motion.div variants={itemVariants} className="relative rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-sm hover:shadow-lg transition-all overflow-hidden">
                <AnimatePresence>
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl"
                        >
                            <div className="flex items-center gap-3 bg-white px-6 py-3.5 rounded-2xl shadow-xl shadow-primary/5 border border-slate-100 font-bold text-slate-700 text-sm">
                                <div className="size-5 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                Synchronizing members...
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <MemberTable members={data?.data || []} isLoading={isLoading} />
            </motion.div>

            {/* ── Pagination ───────────────────────────────────────────────────── */}
            <AnimatePresence>
                {data && data.total > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-8 flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-slate-500 font-medium">
                                Showing <span className="text-slate-900 font-bold">{(filters.page - 1) * filters.pageSize + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(filters.page * filters.pageSize, data.total)}</span> of <span className="text-primary font-black ml-1 bg-primary/10 px-2 py-0.5 rounded-md">{data.total}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handlePageChange(filters.page - 1)}
                                disabled={filters.page === 1}
                                className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-primary hover:border-primary/40 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 hover:shadow-md transition-all"
                                title="Previous Page"
                            >
                                <ChevronLeft className="size-4.5" />
                            </button>

                            <div className="flex items-center gap-1 mx-2 p-1 bg-slate-50/50 rounded-xl border border-slate-100">
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
                                            className={`size-9 rounded-lg text-xs font-black flex items-center justify-center transition-all ${isActive
                                                ? 'bg-primary text-[#0a192f] shadow-md shadow-primary/20 border border-primary/20'
                                                : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900 border border-transparent'
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
                                className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-primary hover:border-primary/40 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 hover:shadow-md transition-all"
                                title="Next Page"
                            >
                                <ChevronRight className="size-4.5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

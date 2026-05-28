import React, { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Users, Plus, Download } from 'lucide-react';
import { useMembers } from '../../../hooks/useMembers';
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

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const totalPages = data ? Math.ceil(data.total / filters.pageSize) : 0;

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#0a192f] tracking-tight">Members</h1>
                    <p className="text-slate-500 mt-2 font-medium">Personnel management, access control, and learning status tracking.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
                        <Download className="w-4 h-4" /> Export Excel
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-[#13ecb6] text-[#0a192f] font-bold rounded-xl shadow-md shadow-[#13ecb6]/20 hover:brightness-105 transition-all">
                        <Plus className="w-5 h-5" /> Add new
                    </button>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#13ecb6] focus:border-[#13ecb6] sm:text-sm transition-all"
                        placeholder="Tìm theo tên hoặc email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex w-full md:w-auto items-center gap-3">
                    <div className="relative flex-1 md:w-40">
                        <select
                            value={filters.role}
                            onChange={(e) => handleFilterChange('role', e.target.value)}
                            className="block w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#13ecb6] focus:bg-white appearance-none text-slate-600 font-medium cursor-pointer transition-all"
                        >
                            <option value="">All</option>
                            <option value="HR">HR</option>
                            <option value="MENTOR">Mentor</option>
                            <option value="MENTEE">Mentee</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                            <Filter className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="relative flex-1 md:w-40">
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="block w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#13ecb6] focus:bg-white appearance-none text-slate-600 font-medium cursor-pointer transition-all"
                        >
                            <option value="">Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                            <Filter className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative min-h-[400px]">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg border border-slate-100 font-bold text-slate-600 text-sm">
                            <div className="w-5 h-5 border-2 border-[#13ecb6] border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                        </div>
                    </div>
                )}

                <MemberTable members={data?.data || []} isLoading={isLoading} />

                {/* Pagination */}
                {data && data.total > 0 && (
                    <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-sm text-slate-500 font-medium">
                            Hiển thị <span className="font-bold text-slate-700">{(filters.page - 1) * filters.pageSize + 1}</span> đến <span className="font-bold text-slate-700">{Math.min(filters.page * filters.pageSize, data.total)}</span> trong <span className="font-bold text-slate-700">{data.total}</span> kết quả
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(filters.page - 1)}
                                disabled={filters.page === 1}
                                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum = filters.page;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (filters.page <= 3) pageNum = i + 1;
                                    else if (filters.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = filters.page - 2 + i;

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-9 h-9 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${filters.page === pageNum
                                                ? 'bg-[#0a192f] text-white shadow-md'
                                                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
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
                                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

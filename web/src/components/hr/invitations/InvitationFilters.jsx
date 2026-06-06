import React from 'react';
import { Search, Filter } from 'lucide-react';

export default function InvitationFilters({ search, status, onSearchChange, onStatusChange }) {
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#13ecb6] focus:border-[#13ecb6] sm:text-sm transition-all"
                    placeholder="Search by email or full name..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="relative w-full md:w-48">
                <select
                    value={status}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#13ecb6] focus:bg-white appearance-none text-slate-600 font-medium cursor-pointer transition-all"
                >
                    <option value="">All statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="REVOKED">Revoked</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <Filter className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
}

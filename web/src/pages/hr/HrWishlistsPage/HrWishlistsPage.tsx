import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrWishlistsApi } from '../../../api/hrApi';
import { cn } from '../../../lib/utils';
import InternalMentorModal from './InternalMentorModal';
import { Award, Clock, Users, TrendingUp, Search, Info } from 'lucide-react';

export default function HrWishlistsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [findingTrainerFor, setFindingTrainerFor] = useState<any>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['hr', 'wishlists', statusFilter],
    queryFn: () => hrWishlistsApi.list(statusFilter ? { status: statusFilter } : {}),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) =>
      hrWishlistsApi.updateStatus(id, { status, rejectionReason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr', 'wishlists'] }),
  });

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0a192f] tracking-tight">Wishlist Management</h1>
          <p className="text-slate-500 mt-2 font-medium">Review and assign trainers for learning proposals.</p>
        </div>

        <div className="relative w-full md:w-56">
          <select
            className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#13ecb6]/20 focus:border-[#13ecb6] appearance-none cursor-pointer transition-all shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="FindingTrainer">Finding Trainer</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
            <option value="NeedsExternalExpert">Needs External Expert</option>
            <option value="ExternalProcessing">External Processing</option>
            <option value="Deferred">Postponed</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="h-5 w-full bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex gap-4 animate-pulse">
                <div className="h-5 w-1/4 bg-slate-100 rounded" />
                <div className="h-5 w-1/4 bg-slate-100 rounded" />
                <div className="h-5 w-1/6 bg-slate-100 rounded" />
                <div className="h-5 w-1/6 bg-slate-100 rounded" />
                <div className="h-5 w-1/6 bg-slate-100 rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 italic">
                  <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Skill / Topic</th>
                  <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Proposer</th>
                  <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Votes</th>
                  <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                  <th className="text-right px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((w: any) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0a192f]">{w.skillName}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Requested {new Date(w.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 font-bold">{w.proposerName}</div>
                      <div className="text-[10px] text-slate-400">{w.departmentName || 'No Department'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="font-extrabold text-lg">{w.voteCount}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">votes</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all cursor-pointer text-center",
                          w.status === 'Pending' ? "bg-amber-50 text-amber-600 border-amber-100 focus:ring-amber-200" :
                            w.status === 'FindingTrainer' ? "bg-blue-50 text-blue-600 border-blue-100 focus:ring-blue-200" :
                              w.status === 'Scheduled' ? "bg-emerald-50 text-emerald-600 border-emerald-100 focus:ring-emerald-200" :
                                w.status === 'Rejected' ? "bg-red-50 text-red-600 border-red-100 focus:ring-red-200" :
                                  w.status === 'NeedsExternalExpert' ? "bg-purple-50 text-purple-600 border-purple-100 focus:ring-purple-200" :
                                    w.status === 'ExternalProcessing' ? "bg-indigo-50 text-indigo-600 border-indigo-100 focus:ring-indigo-200" :
                                      w.status === 'Deferred' ? "bg-slate-100 text-slate-600 border-slate-200 focus:ring-slate-300" :
                                        "bg-slate-50 text-slate-500 border-slate-100 focus:ring-slate-200"
                        )}
                        value={w.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (newStatus === 'Rejected') {
                            const reason = window.prompt("Reason for rejection:", w.rejectionReason || "Not suitable");
                            if (reason !== null) {
                              statusMutation.mutate({ id: w.id, status: newStatus, rejectionReason: reason || 'Not suitable' });
                            }
                          } else {
                            statusMutation.mutate({ id: w.id, status: newStatus });
                          }
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="FindingTrainer">Finding Trainer</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Rejected">Rejected</option>
                        <option value="NeedsExternalExpert">External Needed</option>
                        <option value="ExternalProcessing">External Proc.</option>
                        <option value="Deferred">Postponed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 group-hover:translate-x-0 transition-transform">
                        {/* Core actions for Pending */}
                        {w.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              className="px-3 py-1.5 bg-[#13ecb6] text-[#0a192f] text-[11px] font-extrabold rounded-lg hover:brightness-105 active:scale-95 transition-all shadow-sm shadow-[#13ecb6]/20"
                              onClick={() => {
                                // Logic for suggesting/finding internal trainer
                                setFindingTrainerFor(w);
                              }}
                            >
                              Internal Mentor
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1.5 bg-purple-50 text-purple-700 text-[11px] font-extrabold rounded-lg hover:bg-purple-100 active:scale-95 transition-all border border-purple-100"
                              onClick={() => statusMutation.mutate({ id: w.id, status: 'NeedsExternalExpert' })}
                            >
                              External Expert
                            </button>
                          </>
                        )}

                        {/* Transitions */}
                        {w.status === 'NeedsExternalExpert' && (
                          <button
                            type="button"
                            className="px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-extrabold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                            onClick={() => statusMutation.mutate({ id: w.id, status: 'ExternalProcessing' })}
                          >
                            Transfer to Ext.
                          </button>
                        )}

                        {w.status === 'FindingTrainer' && (
                          <button
                            type="button"
                            className="px-3 py-1.5 bg-emerald-600 text-white text-[11px] font-extrabold rounded-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                            onClick={() => {
                              // Redirect to create class with this info
                              navigate(`/mentor/create?wishlistId=${w.id}&skillName=${encodeURIComponent(w.skillName)}`);
                            }}
                          >
                            Create Class
                          </button>
                        )}

                        {/* General actions */}
                        {w.status !== 'Rejected' && w.status !== 'Completed' && w.status !== 'Scheduled' && (
                          <div className="flex gap-1 border-l border-slate-100 pl-2 ml-2">
                            <button
                              type="button"
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                              title="Reject"
                              onClick={() => {
                                const reason = window.prompt("Reason for rejection:", "Not suitable");
                                if (reason !== null) {
                                  statusMutation.mutate({
                                    id: w.id,
                                    status: 'Rejected',
                                    rejectionReason: reason || 'Not suitable',
                                  });
                                }
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                              title="Postpone"
                              onClick={() => statusMutation.mutate({ id: w.id, status: 'Deferred' })}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!items.length && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="size-16 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-300">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-slate-400 font-bold text-sm tracking-wide">No wishlists found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {findingTrainerFor && (
        <InternalMentorModal
          wishlist={findingTrainerFor}
          onClose={() => setFindingTrainerFor(null)}
        />
      )}
    </div>
  );
}

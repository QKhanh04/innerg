import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrModerationApi } from '../../../api/hrApi';
import { ShieldCheck, XCircle, Clock, GraduationCap, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

export default function ModerationPage() {
    const qc = useQueryClient();

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['hr', 'moderation', 'events'],
        queryFn: hrModerationApi.pendingEvents,
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, approved, reason }) =>
            hrModerationApi.reviewEvent(id, { approved, reason }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'moderation'] }),
    });

    if (isLoading) {
        return (
            <div className="max-w-[1000px] mx-auto p-4 md:p-8 space-y-6">
                <div className="h-9 w-64 bg-slate-200 rounded-lg animate-pulse" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-white border border-slate-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1000px] mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-extrabold text-[#0a192f] tracking-tight">Content Moderation</h1>
                <p className="text-slate-500 mt-2 font-medium">Review and approve new learning sessions and content.</p>
            </div>

            <div className="space-y-4">
                {events.map((e) => (
                    <div key={e.id} className="group bg-white border border-slate-200/60 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#13ecb6]/50 hover:shadow-md hover:shadow-[#13ecb6]/5 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="size-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 group-hover:bg-[#13ecb6]/10 group-hover:text-[#13ecb6] group-hover:border-[#13ecb6]/20 transition-colors">
                                <GraduationCap className="size-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#0a192f] group-hover:text-[#13ecb6] transition-colors">{e.title}</h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                                    <span>{e.trainerName}</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">{e.type}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                type="button"
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-[#13ecb6] text-[#0a192f] rounded-xl text-xs font-extrabold hover:brightness-105 active:scale-95 transition-all shadow-sm shadow-[#13ecb6]/20"
                                onClick={() => reviewMutation.mutate({ id: e.id, approved: true })}
                            >
                                <ShieldCheck className="size-4" /> Approve
                            </button>
                            <button
                                type="button"
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 border border-red-100 text-red-600 rounded-xl text-xs font-extrabold hover:bg-red-50 active:scale-95 transition-all"
                                onClick={() => {
                                    const reason = window.prompt("Reason for rejection:", "Needs revision");
                                    if (reason !== null) {
                                        reviewMutation.mutate({ id: e.id, approved: false, reason: reason || 'Needs revision' });
                                    }
                                }}
                            >
                                <XCircle className="size-4" /> Reject
                            </button>
                        </div>
                    </div>
                ))}

                {!events.length && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                        <div className="size-16 rounded-3xl bg-white flex items-center justify-center border border-slate-100 text-slate-300">
                            <Clock className="size-8" />
                        </div>
                        <p className="text-slate-4400 font-bold text-sm tracking-wide">No classes pending review at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

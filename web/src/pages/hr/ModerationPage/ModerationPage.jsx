import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrModerationApi } from '../../../api/hrApi';
import { ShieldCheck, XCircle, Clock, GraduationCap, ChevronRight, CheckCircle2, History, Filter } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { toastService } from '../../../services/toastService';
import EventDetailModal from './EventDetailModal';

const statusTabs = [
    { id: 'all', label: 'All Classes', value: null, icon: History },
    { id: 'pending', label: 'Pending Approval', value: 'PendingApproval', icon: Clock },
    { id: 'published', label: 'Published', value: 'Published', icon: CheckCircle2 },
    { id: 'others', label: 'Others', value: 'Draft', icon: Filter },
];

const statusStyles = {
    PendingApproval: "bg-amber-50 text-amber-600 border-amber-100",
    Published: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Draft: "bg-slate-100 text-slate-500 border-slate-200",
    Cancelled: "bg-red-50 text-red-600 border-red-100",
    Completed: "bg-blue-50 text-blue-600 border-blue-100",
};

export default function ModerationPage() {
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedEvent, setSelectedEvent] = useState(null);

    const selectedStatus = statusTabs.find(t => t.id === activeTab)?.value;

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['hr', 'moderation', 'events', activeTab],
        queryFn: () => hrModerationApi.pendingEvents(selectedStatus ? { status: selectedStatus } : {}),
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, approved, reason }) =>
            hrModerationApi.reviewEvent(id, { approved, reason }),
        onSuccess: (_data, vars) => {
            toastService.success(vars.approved ? 'Event approved!' : 'Event rejected.');
            qc.invalidateQueries({ queryKey: ['hr', 'moderation'] });
        },
        onError: (err) => {
            toastService.error(err?.response?.data?.message || 'Failed to review event');
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="h-48 bg-slate-900/10 rounded-2xl animate-pulse" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (<>
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Hero Section ─────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-6 py-8 text-white shadow-lg shadow-slate-900/10">
                <div className="absolute right-0 top-0 h-48 w-48 translate-x-10 -translate-y-10 rounded-full bg-primary/15 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-10 translate-y-10 rounded-full bg-primary/10 blur-3xl" />

                <div className="relative space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">HR Module</p>
                    <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
                    <p className="max-w-2xl text-sm leading-6 text-slate-200">
                        Manage all workspace training events. Review pending requests or track published sessions and drafts.
                    </p>
                </div>
            </section>

            {/* ── Tabs ────────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 p-1 bg-slate-100/50 rounded-2xl border border-slate-200 w-fit">
                {statusTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                            activeTab === tab.id
                                ? "bg-[#0a192f] text-white shadow-lg shadow-[#0a192f]/20"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        )}
                    >
                        <tab.icon className="size-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Filtered List ────────────────────────────────────────────────── */}
            <div className="space-y-4">
                {events.map((e) => (
                    <div key={e.id} className="group relative bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                        <div className="flex items-start gap-5">
                            <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all duration-300">
                                <GraduationCap className="size-7" />
                            </div>
                            <div className="space-y-1.5 text-left">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                        {e.type}
                                    </span>
                                    <span className={cn(
                                        "inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest leading-none border",
                                        statusStyles[e.status] || "bg-slate-50 text-slate-400 border-slate-100"
                                    )}>
                                        {e.status}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">{e.title}</h3>
                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                                    <span className="text-slate-600 font-bold uppercase tracking-tight">{e.trainerName}</span>
                                    <span className="size-1 rounded-full bg-slate-200" />
                                    <span>{new Date(e.startDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                            {e.status === 'PendingApproval' && (
                                <>
                                    <button
                                        type="button"
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-[#0a192f] rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-105 active:scale-95 transition-all"
                                        onClick={() => reviewMutation.mutate({ id: e.id, approved: true })}
                                    >
                                        <ShieldCheck className="size-4" /> Approve
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 border border-slate-200 bg-white text-slate-600 rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 active:scale-95 transition-all"
                                        onClick={() => {
                                            const reason = window.prompt("Reason for rejection:", "Needs revision");
                                            if (reason !== null) {
                                                reviewMutation.mutate({ id: e.id, approved: false, reason: reason || 'Needs revision' });
                                            }
                                        }}
                                    >
                                        <XCircle className="size-4" /> Reject
                                    </button>
                                </>
                            )}
                            {(e.status === 'Published' || e.status === 'Completed') && (
                                <button
                                    onClick={() => setSelectedEvent(e)}
                                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all"
                                >
                                    View Details
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedEvent(e)}
                                className="hidden lg:flex size-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all border border-slate-100 font-bold"
                            >
                                <ChevronRight className="size-5" />
                            </button>
                        </div>
                    </div>
                ))}

                {!events.length && (
                    <div className="flex flex-col items-center justify-center py-24 gap-6 bg-slate-50/50 rounded-2xl border border-dotted border-slate-200 animate-in fade-in zoom-in-95 duration-500">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all" />
                            <div className="relative size-20 rounded-3xl bg-white flex items-center justify-center border border-slate-100 text-slate-300 shadow-sm">
                                <Clock className="size-10 text-slate-200" />
                            </div>
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-slate-900 font-bold text-lg tracking-tight">No Events Found</p>
                            <p className="text-slate-400 font-medium text-sm">There are no classes matching this category at the moment.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* ── Event Detail Modal ──────────────────────────────────────────── */}
        <AnimatePresence>
            {selectedEvent && (
                <EventDetailModal
                    eventId={selectedEvent.id}
                    eventTitle={selectedEvent.title}
                    eventStatus={selectedEvent.status}
                    onClose={() => setSelectedEvent(null)}
                />
            )}
        </AnimatePresence>
    </>);
}

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, GraduationCap, Calendar, Users, Star, Loader2,
    BookOpen, ClipboardList, UserCheck, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { hrReportsApi } from '../../../api/hrApi';
import { cn } from '../../../lib/utils';    


const statusStyles = {
    PendingApproval: 'bg-amber-50 text-amber-600 border-amber-200',
    Published: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Draft: 'bg-slate-100 text-slate-500 border-slate-200',
    Cancelled: 'bg-red-50 text-red-600 border-red-200',
    Completed: 'bg-blue-50 text-blue-600 border-blue-200',
};

function StatCard({ icon: Icon, label, value, color = 'text-slate-700' }) {
    return (
        <div className="flex flex-col gap-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-400">
                <Icon className="size-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <span className={cn('text-2xl font-black tracking-tight', color)}>{value}</span>
        </div>
    );
}

export default function EventDetailModal({ eventId, eventTitle, eventStatus, onClose }) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['hr', 'reports', 'events', eventId],
        queryFn: () => hrReportsApi.eventDetail(eventId),
        enabled: !!eventId,
    });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#0a192f]/60 backdrop-blur-md"
                    onClick={onClose}
                />

                {/* Panel */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200"
                >
                    {/* Header */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#0F1F3D] to-[#0d2b50] p-6 text-white shrink-0">
                        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/15 blur-2xl" />
                        <div className="relative flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                                    <GraduationCap className="size-6 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">Class Details</span>
                                        <span className={cn(
                                            'inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest leading-none border',
                                            statusStyles[eventStatus] || 'bg-slate-100 text-slate-500 border-slate-200'
                                        )}>
                                            {eventStatus}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-bold tracking-tight leading-tight">{eventTitle}</h2>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/10 shrink-0"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="overflow-y-auto flex-1 p-6 space-y-6 custom-scrollbar">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                                <Loader2 className="size-8 animate-spin text-primary" />
                                <p className="text-sm font-semibold">Loading class details...</p>
                            </div>
                        )}

                        {isError && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                                <XCircle className="size-8 text-red-300" />
                                <p className="text-sm font-semibold">Could not load class details.</p>
                            </div>
                        )}

                        {data && (
                            <>
                                {/* Sessions Overview */}
                                {data.sessions?.length > 0 && (
                                    <section>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Calendar className="size-4 text-primary" />
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Sessions</h3>
                                        </div>
                                        <div className="space-y-2">
                                            {data.sessions.map((s) => (
                                                <div key={s.sessionId} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-colors">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{s.title}</p>
                                                        <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                                                            <Clock className="size-3" />
                                                            {new Date(s.startTime).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs font-bold">
                                                        <span className="flex items-center gap-1 text-emerald-600">
                                                            <CheckCircle2 className="size-3.5" /> {s.presentCount}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-red-400">
                                                            <XCircle className="size-3.5" /> {s.absentCount}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Enrollment Stats */}
                                {data.enrollments?.length > 0 && (
                                    <section>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Users className="size-4 text-primary" />
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
                                                Enrollments ({data.enrollments.length})
                                            </h3>
                                        </div>
                                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-100 bg-slate-50">
                                                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Learner</th>
                                                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Dept</th>
                                                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                                        <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Points</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.enrollments.map((en, i) => (
                                                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                                                            <td className="px-4 py-3 font-bold text-slate-800">{en.fullName}</td>
                                                            <td className="px-4 py-3 text-slate-400 font-medium">{en.departmentName || '—'}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={cn(
                                                                    'inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest leading-none border',
                                                                    en.status === 'Completed'
                                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                        : 'bg-slate-100 text-slate-500 border-slate-100'
                                                                )}>
                                                                    {en.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-black text-primary">{en.earnedPoints}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>
                                )}

                                {/* Ratings */}
                                {data.criteriaRatings?.length > 0 && (
                                    <section>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Star className="size-4 text-primary" />
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Feedback Ratings</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {data.criteriaRatings.map((r, i) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-slate-600">{r.criteriaName}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary rounded-full transition-all"
                                                                style={{ width: `${(r.avgScore / 5) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-black text-slate-700 w-8 text-right">
                                                            {r.avgScore.toFixed(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Empty state */}
                                {!data.sessions?.length && !data.enrollments?.length && !data.criteriaRatings?.length && (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-300">
                                        <BookOpen className="size-10" />
                                        <p className="text-sm font-bold text-slate-400">No detailed data available yet for this class.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

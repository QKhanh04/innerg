import React from 'react';
import { BarChart3, Users, Clock, TrendingUp, Award } from 'lucide-react';
import { useHrAnalyticsOverview, useHrAnalyticsCharts } from '../../../hooks/hr/useHrAnalytics';

function KpiCard({ icon: Icon, label, value, sub }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-xl bg-[#13ecb6]/15 flex items-center justify-center">
                    <Icon className="size-5 text-[#0a192f]" />
                </div>
                <span className="text-sm font-medium text-slate-500">{label}</span>
            </div>
            <p className="text-3xl font-extrabold text-[#0a192f]">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
    );
}

export default function AnalyticsPage() {
    const { data: overview, isLoading } = useHrAnalyticsOverview();
    const { data: charts } = useHrAnalyticsCharts({ groupBy: 'month' });

    if (isLoading) {
        return (
            <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
                <div className="space-y-3">
                    <div className="h-9 w-48 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-5 w-96 bg-slate-100 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                    <div className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                </div>
            </div>
        );
    }

    const enrollmentPct = overview
        ? `${Math.round((overview.enrollmentRate || 0) * 100)}%`
        : '—';
    const activePct = overview
        ? `${Math.round((overview.activeLearnersRate || 0) * 100)}%`
        : '—';

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-extrabold text-[#0a192f] tracking-tight">HR Analytics</h1>
                <p className="text-slate-500 mt-2 font-medium">
                    Overview of training, mentors, and learners in the workspace.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={BarChart3} label="Classes Completed" value={overview?.totalEvents ?? 0} />
                <KpiCard icon={Clock} label="Total Learning Hours" value={overview?.totalHours?.toFixed(1) ?? 0} />
                <KpiCard icon={TrendingUp} label="Enrollment Rate" value={enrollmentPct} />
                <KpiCard icon={Users} label="Active Learners" value={activePct} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-[#0a192f] mb-6 flex items-center gap-2">
                        <Award className="size-5 text-[#13ecb6]" /> Top Mentors
                    </h2>
                    <ul className="space-y-4">
                        {(overview?.topMentors ?? []).map((m, idx) => (
                            <li key={m.trainerId} className="flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <span className="size-6 flex items-center justify-center rounded-lg bg-slate-50 text-xs font-bold text-slate-400 group-hover:bg-[#13ecb6]/10 group-hover:text-[#13ecb6] transition-colors">
                                        {idx + 1}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-700">{m.fullName}</span>
                                </div>
                                <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
                                    <span className="text-amber-500">★ {m.avgRating?.toFixed(1)}</span>
                                    <span className="text-slate-300">|</span>
                                    <span>{m.totalClassesTaught} classes</span>
                                </div>
                            </li>
                        ))}
                        {!overview?.topMentors?.length && (
                            <li className="text-slate-400 text-sm py-4 text-center">No data available</li>
                        )}
                    </ul>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-[#0a192f] mb-6 flex items-center gap-2">
                        <TrendingUp className="size-5 text-blue-500" /> Top Learners
                    </h2>
                    <ul className="space-y-4">
                        {(overview?.topLearners ?? []).map((l, idx) => (
                            <li key={l.userId} className="flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <span className="size-6 flex items-center justify-center rounded-lg bg-slate-50 text-xs font-bold text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                        {idx + 1}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-700">{l.fullName}</span>
                                </div>
                                <span className="text-xs font-extrabold text-[#13ecb6] bg-[#13ecb6]/10 px-2.5 py-1 rounded-lg">
                                    {l.totalEarnedPoints} pts
                                </span>
                            </li>
                        ))}
                        {!overview?.topLearners?.length && (
                            <li className="text-slate-400 text-sm py-4 text-center">No data available</li>
                        )}
                    </ul>
                </div>
            </div>

            {charts?.byDepartment?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-[#0a192f] mb-6">Enrollments by Department</h2>
                    <div className="space-y-4">
                        {charts.byDepartment.map((d) => (
                            <div key={d.departmentId ?? d.departmentName} className="flex flex-col gap-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{d.departmentName}</span>
                                    <span className="text-xs font-extrabold text-[#0a192f]">{d.enrollmentCount} enrollments</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#13ecb6] to-[#00C896] rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, (d.enrollmentCount / Math.max(...charts.byDepartment.map((x) => x.enrollmentCount))) * 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

import React from 'react';
import { Award, BarChart3, Clock, Loader2, TrendingUp, Users } from 'lucide-react';
import { useHrAnalyticsOverview, useHrAnalyticsCharts } from '../../../hooks/hr/useHrAnalytics';

// ─── Reusable layout primitives (mirrors AdminDashboard) ────────────────────

function SectionHeader({ title, subtitle, icon: Icon }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>
            <div className="rounded-xl border border-primary/15 bg-primary/10 p-3 text-primary">
                <Icon className="size-4.5" />
            </div>
        </div>
    );
}

function ChartPanel({ title, meta, footer, children }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <p className="mt-1 text-sm text-slate-500">{meta}</p>
                </div>
                {footer ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                        {footer}
                    </span>
                ) : null}
            </div>
            <div className="mt-5">{children}</div>
        </div>
    );
}

function EmptyState({ label }) {
    return <div className="py-6 text-sm text-slate-500">{label}</div>;
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const { data: overview, isLoading } = useHrAnalyticsOverview();
    const { data: charts } = useHrAnalyticsCharts({ groupBy: 'month' });

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 className="size-5 animate-spin" />
                    <span className="text-sm font-medium">Loading analytics...</span>
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

    const stats = [
        {
            label: 'Classes Completed',
            value: overview?.totalEvents ?? 0,
            meta: 'All-time sessions',
            icon: BarChart3,
        },
        {
            label: 'Total Learning Hours',
            value: overview?.totalHours?.toFixed(1) ?? '0',
            meta: 'Across all learners',
            icon: Clock,
        },
        {
            label: 'Enrollment Rate',
            value: enrollmentPct,
            meta: 'Active enrollments',
            icon: TrendingUp,
        },
        {
            label: 'Active Learners',
            value: activePct,
            meta: 'Of total members',
            icon: Users,
        },
    ];

    const maxEnrollment = Math.max(
        ...(charts?.byDepartment?.map((d) => d.enrollmentCount) ?? [1]),
        1,
    );

    return (
        <div className="space-y-8">
            {/* ── Hero ─────────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-6 py-6 text-white shadow-lg shadow-slate-900/10">
                <div className="absolute right-0 top-0 h-48 w-48 translate-x-10 -translate-y-10 rounded-full bg-primary/15 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-10 translate-y-10 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">HR Module</p>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                    <p className="max-w-2xl text-sm leading-6 text-slate-200">
                        Overview of training, mentors, and learners in the workspace.
                    </p>
                </div>
            </section>

            {/* ── KPI stat cards ───────────────────────────────────────────────── */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <article
                            key={stat.label}
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="rounded-xl border border-primary/15 bg-primary/10 p-3 text-primary">
                                    <Icon className="size-5" />
                                </div>
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                    Live
                                </span>
                            </div>
                            <div className="mt-5">
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                                <p className="mt-2 text-sm text-slate-500">{stat.meta}</p>
                            </div>
                        </article>
                    );
                })}
            </section>

            {/* ── Top Mentors & Top Learners ───────────────────────────────────── */}
            <section className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                    <SectionHeader
                        title="Top Mentors"
                        subtitle="Highest-rated mentors by sessions and learner feedback"
                        icon={Award}
                    />
                    <ChartPanel
                        title="Mentor Performance"
                        meta={`${overview?.topMentors?.length ?? 0} mentors ranked`}
                        footer="Rating & classes"
                    >
                        {(overview?.topMentors ?? []).length === 0 ? (
                            <EmptyState label="No mentor data available." />
                        ) : (
                            <div className="space-y-4">
                                {(overview?.topMentors ?? []).map((m, idx) => (
                                    <div
                                        key={m.trainerId}
                                        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                                    >
                                        <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{m.fullName}</p>
                                            <p className="mt-0.5 text-xs text-slate-500">{m.totalClassesTaught} classes taught</p>
                                        </div>
                                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                            ★ {m.avgRating?.toFixed(1)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ChartPanel>
                </div>

                <div className="space-y-4">
                    <SectionHeader
                        title="Top Learners"
                        subtitle="Most engaged learners ranked by total points earned"
                        icon={TrendingUp}
                    />
                    <ChartPanel
                        title="Learner Engagement"
                        meta={`${overview?.topLearners?.length ?? 0} learners ranked`}
                        footer="By earned points"
                    >
                        {(overview?.topLearners ?? []).length === 0 ? (
                            <EmptyState label="No learner data available." />
                        ) : (
                            <div className="space-y-4">
                                {(overview?.topLearners ?? []).map((l, idx) => (
                                    <div
                                        key={l.userId}
                                        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                                    >
                                        <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                            {idx + 1}
                                        </span>
                                        <p className="text-sm font-semibold text-slate-900">{l.fullName}</p>
                                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                                            {l.totalEarnedPoints} pts
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ChartPanel>
                </div>
            </section>

            {/* ── Enrollments by Department ────────────────────────────────────── */}
            {charts?.byDepartment?.length > 0 && (
                <section className="space-y-4">
                    <SectionHeader
                        title="Enrollments by Department"
                        subtitle="Distribution of training participation across departments"
                        icon={BarChart3}
                    />
                    <ChartPanel
                        title="Department Breakdown"
                        meta={`${charts.byDepartment.length} departments`}
                        footer={`${charts.byDepartment.reduce((s, d) => s + d.enrollmentCount, 0)} total enrollments`}
                    >
                        <div className="space-y-5">
                            {charts.byDepartment.map((d) => {
                                const width = Math.max(
                                    (d.enrollmentCount / maxEnrollment) * 100,
                                    d.enrollmentCount ? 6 : 0,
                                );
                                return (
                                    <div key={d.departmentId ?? d.departmentName}>
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <span className="text-sm font-medium text-slate-700">{d.departmentName}</span>
                                            <span className="text-sm font-semibold text-slate-900">{d.enrollmentCount}</span>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-slate-100">
                                            <div
                                                className="h-2.5 rounded-full bg-primary transition-all duration-500"
                                                style={{ width: `${width}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ChartPanel>
                </section>
            )}
        </div>
    );
}
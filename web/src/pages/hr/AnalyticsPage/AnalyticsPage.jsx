import React from 'react';
import { Award, BarChart3, Clock, Loader2, TrendingUp, Users } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { useHrAnalyticsOverview, useHrAnalyticsCharts } from '../../../hooks/hr/useHrAnalytics';

// ─── Animation Variants ─────────────────────────────────────────────────────────
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// ─── Reusable layout primitives (mirrors AdminDashboard) ────────────────────

function SectionHeader({ title, subtitle, icon: Icon }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>
            <div className="rounded-xl border border-primary/15 bg-primary/10 p-3 text-primary shadow-sm shadow-primary/5">
                <Icon className="size-4.5" />
            </div>
        </div>
    );
}

function ChartPanel({ title, meta, footer, children }) {
    return (
        <div className="rounded-xl border border-slate-200/80 bg-white/60 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:border-primary/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <p className="mt-1 text-sm text-slate-500">{meta}</p>
                </div>
                {footer ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary shadow-sm shadow-primary/5">
                        {footer}
                    </span>
                ) : null}
            </div>
            <div className="relative mt-5">{children}</div>
        </div>
    );
}

function EmptyState({ label }) {
    return <div className="py-8 text-sm text-slate-500 flex items-center justify-center font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">{label}</div>;
}

// ─── Custom Tooltip for Recharts ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white/90 backdrop-blur-md p-3.5 shadow-xl shadow-slate-200/50">
                <p className="text-sm font-bold text-slate-900 mb-2">{label}</p>
                <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-sm shadow-primary/40 animate-pulse"></span>
                    <p className="text-sm text-slate-600 font-medium">
                        Enrollments: <span className="font-black text-slate-900 ml-1">{payload[0].value}</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const { data: overview, isLoading } = useHrAnalyticsOverview();
    const { data: charts } = useHrAnalyticsCharts({ groupBy: 'month' });

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-slate-100">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span className="text-sm font-bold tracking-wide">Loading Analytics Dashboard...</span>
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
            color: 'from-blue-500 to-cyan-400'
        },
        {
            label: 'Total Learning Hours',
            value: overview?.totalHours?.toFixed(1) ?? '0',
            meta: 'Across all learners',
            icon: Clock,
            color: 'from-violet-500 to-purple-400'
        },
        {
            label: 'Enrollment Rate',
            value: enrollmentPct,
            meta: 'Active enrollments',
            icon: TrendingUp,
            color: 'from-emerald-500 to-teal-400'
        },
        {
            label: 'Active Learners',
            value: activePct,
            meta: 'Of total members',
            icon: Users,
            color: 'from-amber-500 to-orange-400'
        },
    ];

    const chartData = charts?.byDepartment?.map(d => ({
        name: d.departmentName,
        enrollments: d.enrollmentCount
    })) || [];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-10"
        >
            {/* ── Hero ─────────────────────────────────────────────────────────── */}
            <motion.section variants={itemVariants} className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-8 py-10 text-white shadow-2xl shadow-primary/10 transition-transform duration-500">
                <div className="absolute right-0 top-0 h-64 w-64 translate-x-10 -translate-y-10 rounded-full bg-primary/20 blur-[80px] animate-pulse" />
                <div className="absolute bottom-0 left-0 h-56 w-56 -translate-x-10 translate-y-10 rounded-full bg-teal-400/10 blur-[60px]" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDExNSwxMTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20" />

                <div className="relative space-y-3 z-10">
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
                        className="text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md"
                    >
                        Workforce Analytics
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="max-w-2xl text-sm leading-relaxed text-slate-200/90 font-medium"
                    >
                        Comprehensive overview of training progress, top performers, and departmental engagement across the organization. Data updates dynamically.
                    </motion.p>
                </div>
            </motion.section>

            {/* ── KPI stat cards ───────────────────────────────────────────────── */}
            <motion.section variants={containerVariants} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <motion.article
                            variants={itemVariants}
                            key={stat.label}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-slate-200/50"
                        >
                            <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${stat.color} opacity-[0.08] blur-2xl transition-all duration-500 group-hover:scale-[2] group-hover:opacity-[0.15]`}></div>
                            <div className="relative flex items-start justify-between gap-4">
                                <div className="rounded-xl border border-primary/15 bg-white p-3 text-primary shadow-sm shadow-primary/5 group-hover:scale-110 transition-transform duration-300">
                                    <Icon className="size-5" />
                                </div>
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary shadow-sm shadow-primary/5 scale-95 group-hover:scale-100 transition-transform">
                                    Live
                                </span>
                            </div>
                            <div className="relative mt-6">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                                <p className="mt-1 text-3xl lg:text-4xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors duration-300">{stat.value}</p>
                                <p className="mt-2 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                    <span className={`size-1.5 rounded-full bg-gradient-to-br ${stat.color}`} />
                                    {stat.meta}
                                </p>
                            </div>
                        </motion.article>
                    );
                })}
            </motion.section>

            {/* ── Top Mentors & Top Learners ───────────────────────────────────── */}
            <motion.section variants={containerVariants} className="grid gap-6 xl:grid-cols-2">
                <motion.div variants={itemVariants} className="space-y-4">
                    <SectionHeader
                        title="Top Mentors"
                        subtitle="Highest-rated mentors by sessions and learner feedback"
                        icon={Award}
                    />
                    <ChartPanel
                        title="Mentor Performance Leaderboard"
                        meta={`${overview?.topMentors?.length ?? 0} mentors ranked actively`}
                        footer="Rating & classes"
                    >
                        {(overview?.topMentors ?? []).length === 0 ? (
                            <EmptyState label="No mentor data available yet." />
                        ) : (
                            <div className="space-y-3.5">
                                {(overview?.topMentors ?? []).map((m, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={m.trainerId}
                                        className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-slate-100/80 bg-white px-4 py-3.5 transition-all duration-300 hover:bg-primary/[0.02] hover:border-primary/20 hover:shadow-md cursor-default"
                                    >
                                        <span className={`flex size-9 items-center justify-center rounded-xl text-sm font-black shadow-sm ${idx === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : idx === 1 ? 'bg-slate-200 text-slate-600 border border-slate-300' : idx === 2 ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-primary/5 text-primary border border-primary/10'}`}>
                                            #{idx + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{m.fullName}</p>
                                            <p className="mt-0.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">{m.totalClassesTaught} completed classes</p>
                                        </div>
                                        <span className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-xs font-black text-amber-700 shadow-sm transition-transform group-hover:scale-105">
                                            <span className="text-amber-500">★</span> {m.avgRating?.toFixed(1)}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </ChartPanel>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-4">
                    <SectionHeader
                        title="Top Learners"
                        subtitle="Most engaged learners ranked by total points earned"
                        icon={TrendingUp}
                    />
                    <ChartPanel
                        title="Learner Engagement Leaderboard"
                        meta={`${overview?.topLearners?.length ?? 0} learners ranked actively`}
                        footer="By earned points"
                    >
                        {(overview?.topLearners ?? []).length === 0 ? (
                            <EmptyState label="No learner data available yet." />
                        ) : (
                            <div className="space-y-3.5">
                                {(overview?.topLearners ?? []).map((l, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={l.userId}
                                        className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-slate-100/80 bg-white px-4 py-3.5 transition-all duration-300 hover:bg-emerald-50/30 hover:border-emerald-200 hover:shadow-md cursor-default"
                                    >
                                        <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-sm font-black text-emerald-600 shadow-sm border border-emerald-100">
                                            #{idx + 1}
                                        </span>
                                        <p className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{l.fullName}</p>
                                        <span className="rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 text-xs font-black text-emerald-700 shadow-sm transition-transform group-hover:scale-105">
                                            {l.totalEarnedPoints} pts
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </ChartPanel>
                </motion.div>
            </motion.section>

            {/* ── Enrollments by Department (Chart) ────────────────────────────────────── */}
            {chartData.length > 0 && (
                <motion.section variants={itemVariants} className="space-y-4">
                    <SectionHeader
                        title="Enrollments by Department"
                        subtitle="Visualization of training participation across departments"
                        icon={BarChart3}
                    />
                    <ChartPanel
                        title="Department Breakdown Matrix"
                        meta={`${chartData.length} departments recorded`}
                        footer={`${chartData.reduce((s, d) => s + d.enrollments, 0)} total enrollments`}
                    >
                        <div className="h-[380px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
                                    maxBarSize={50}
                                >
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                                        dy={15}
                                        angle={-35}
                                        textAnchor="end"
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                        dx={-10}
                                    />
                                    <Tooltip cursor={{ fill: '#f8fafc', rx: 8 }} content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="enrollments"
                                        radius={[6, 6, 0, 0]}
                                        animationDuration={1500}
                                        animationEasing="ease-out"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="url(#barGradient)" className="transition-all hover:opacity-80 drop-shadow-md cursor-pointer" />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartPanel>
                </motion.section>
            )}
        </motion.div>
    );
}
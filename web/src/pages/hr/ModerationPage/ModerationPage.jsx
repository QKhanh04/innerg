import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrModerationApi } from '../../../api/hrApi';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock,
    FileStack,
    Filter,
    GraduationCap,
    History,
    Loader2,
    ShieldAlert,
    ShieldCheck,
    X,
    XCircle,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { toastService } from '../../../services/toastService';
import EventDetailModal from './EventDetailModal';

const contentTabs = [
    { id: 'report-center', label: 'Report Center', icon: ClipboardList },
    { id: 'events', label: 'Events', icon: GraduationCap },
    { id: 'resources', label: 'Resources', icon: FileStack },
    { id: 'escalations', label: 'Escalations', icon: ShieldAlert },
];

const statusTabs = [
    { id: 'all', label: 'All Classes', value: null, icon: History },
    { id: 'pending', label: 'Pending Approval', value: 'PendingApproval', icon: Clock },
    { id: 'published', label: 'Published', value: 'Published', icon: CheckCircle2 },
    { id: 'others', label: 'Draft', value: 'Draft', icon: Filter },
];

const statusStyles = {
    PendingApproval: 'bg-amber-50 text-amber-600 border-amber-100',
    Published: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Draft: 'bg-slate-100 text-slate-500 border-slate-200',
    Cancelled: 'bg-red-50 text-red-600 border-red-100',
    Completed: 'bg-blue-50 text-blue-600 border-blue-100',
};

const severityStyles = {
    Low: 'bg-slate-100 text-slate-600 border-slate-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    High: 'bg-red-50 text-red-700 border-red-200',
    Critical: 'bg-rose-100 text-rose-700 border-rose-200',
};

const escalationStatusStyles = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Dismissed: 'bg-slate-100 text-slate-600 border-slate-200',
};

function EmptyState({ icon: Icon, title, description }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-6 bg-slate-50/50 rounded-2xl border border-dotted border-slate-200 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all" />
                <div className="relative size-20 rounded-3xl bg-white flex items-center justify-center border border-slate-100 text-slate-300 shadow-sm">
                    <Icon className="size-10 text-slate-200" />
                </div>
            </div>
            <div className="text-center space-y-1">
                <p className="text-slate-900 font-bold text-lg tracking-tight">{title}</p>
                <p className="text-slate-400 font-medium text-sm">{description}</p>
            </div>
        </div>
    );
}

function ModerationActionDialog({ config, onClose, onSubmit, isPending }) {
    const [reason, setReason] = useState(config.initialReason);
    const [severity, setSeverity] = useState(config.initialSeverity ?? 'High');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ reason: reason.trim(), severity });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0a192f]/60 backdrop-blur-md"
                onClick={onClose}
            />

            <motion.form
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                onSubmit={handleSubmit}
                className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            >
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-6 py-6 text-white">
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10 blur-2xl" />
                    <div className="relative flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">{config.kicker}</p>
                            <h2 className="text-2xl font-bold tracking-tight">{config.title}</h2>
                            <p className="text-sm text-slate-200">{config.description}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition-all hover:bg-white/10 hover:text-white"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                <div className="space-y-5 p-6">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Target</p>
                        <p className="mt-2 text-base font-bold text-slate-900">{config.targetLabel}</p>
                        <p className="mt-1 text-sm text-slate-500">{config.targetMeta}</p>
                    </div>

                    <label className="block space-y-2">
                        <span className="text-sm font-bold text-slate-800">{config.reasonLabel}</span>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={5}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/5"
                            placeholder={config.reasonPlaceholder}
                            required
                        />
                    </label>

                    {config.showSeverity && (
                        <label className="block space-y-2">
                            <span className="text-sm font-bold text-slate-800">Severity</span>
                            <select
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/5"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </label>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isPending || !reason.trim()}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60',
                            config.intent === 'danger'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-[#0a192f] hover:bg-[#12305A]'
                        )}
                    >
                        {isPending && <Loader2 className="size-4 animate-spin" />}
                        {config.confirmLabel}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}

export default function ModerationPage() {
    const qc = useQueryClient();
    const [contentTab, setContentTab] = useState('events');
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [actionDialog, setActionDialog] = useState(null);

    const selectedStatus = statusTabs.find((t) => t.id === activeTab)?.value;

    const { data: events = [], isLoading: eventsLoading } = useQuery({
        queryKey: ['hr', 'moderation', 'events', activeTab],
        queryFn: () => hrModerationApi.pendingEvents(selectedStatus ? { status: selectedStatus } : {}),
    });

    const { data: resources = [], isLoading: resourcesLoading } = useQuery({
        queryKey: ['hr', 'moderation', 'resources'],
        queryFn: () => hrModerationApi.pendingResources(),
    });

    const { data: escalations = [], isLoading: escalationsLoading } = useQuery({
        queryKey: ['hr', 'moderation', 'escalations'],
        queryFn: () => hrModerationApi.escalations(),
    });

    const { data: reportCenter = [], isLoading: reportCenterLoading } = useQuery({
        queryKey: ['hr', 'moderation', 'report-center'],
        queryFn: () => hrModerationApi.reportCenter(),
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, approved, reason }) => hrModerationApi.reviewEvent(id, { approved, reason }),
        onSuccess: (_data, vars) => {
            toastService.success(vars.approved ? 'Event approved!' : 'Event rejected.');
            qc.invalidateQueries({ queryKey: ['hr', 'moderation'] });
            setActionDialog(null);
        },
        onError: (err) => {
            toastService.error(err?.response?.data?.message || 'Failed to review event');
        },
    });

    const resourceReviewMutation = useMutation({
        mutationFn: ({ id, approved, reason }) => hrModerationApi.reviewResource(id, { approved, reason }),
        onSuccess: (_data, vars) => {
            toastService.success(vars.approved ? 'Resource approved!' : 'Resource sent back for revision.');
            qc.invalidateQueries({ queryKey: ['hr', 'moderation'] });
            setActionDialog(null);
        },
        onError: (err) => {
            toastService.error(err?.response?.data?.message || 'Failed to review resource');
        },
    });

    const escalationMutation = useMutation({
        mutationFn: ({ targetId, targetType, reason, severity, sourceContext }) =>
            hrModerationApi.createEscalation({
                targetType,
                targetId,
                reason,
                severity,
                sourceContext,
            }),
        onSuccess: () => {
            toastService.success('Escalation sent to system admin.');
            qc.invalidateQueries({ queryKey: ['hr', 'moderation'] });
            setActionDialog(null);
        },
        onError: (err) => {
            toastService.error(err?.response?.data?.message || 'Failed to escalate target');
        },
    });

    const currentLoading =
        contentTab === 'report-center'
            ? reportCenterLoading
            : contentTab === 'events'
            ? eventsLoading
            : contentTab === 'resources'
                ? resourcesLoading
                : escalationsLoading;

    const pendingEscalations = escalations.filter((item) => item.status === 'Pending').length;
    const resolvedEscalations = escalations.filter((item) => item.status === 'Resolved').length;
    const dismissedEscalations = escalations.filter((item) => item.status === 'Dismissed').length;

    const openEventReviewDialog = (eventItem) => {
        setActionDialog({
            type: 'event-review',
            target: eventItem,
            kicker: 'Event Review',
            title: 'Reject Event Submission',
            description: 'Share a clear note so the trainer knows what to fix before resubmitting.',
            targetLabel: eventItem.title,
            targetMeta: `${eventItem.trainerName} • ${new Date(eventItem.startDate).toLocaleDateString()}`,
            reasonLabel: 'Rejection reason',
            reasonPlaceholder: 'Example: agenda is incomplete and the learning objective needs to be clarified.',
            initialReason: 'Needs revision',
            confirmLabel: 'Reject event',
            intent: 'danger',
        });
    };

    const openResourceReviewDialog = (resource) => {
        setActionDialog({
            type: 'resource-review',
            target: resource,
            kicker: 'Resource Review',
            title: 'Send Resource Back For Revision',
            description: 'Explain what should be corrected before this resource is approved for learners.',
            targetLabel: resource.title,
            targetMeta: `${resource.eventTitle} • ${resource.type}`,
            reasonLabel: 'Revision note',
            reasonPlaceholder: 'Example: the attachment is outdated or missing important context for learners.',
            initialReason: 'Needs revision',
            confirmLabel: 'Request revision',
            intent: 'danger',
        });
    };

    const openEscalationDialog = (targetType, target, sourceContext) => {
        const targetMeta =
            targetType === 'TrainingEvent'
                ? `${target.trainerName} • ${new Date(target.startDate).toLocaleDateString()}`
                : `${target.eventTitle} • ${target.type}`;

        setActionDialog({
            type: 'escalation',
            targetType,
            sourceContext,
            target,
            kicker: 'Escalation Report',
            title: 'Escalate To System Admin',
            description: 'Use escalation when the issue may require platform-wide moderation or stronger action.',
            targetLabel: target.title,
            targetMeta,
            reasonLabel: 'Escalation reason',
            reasonPlaceholder: 'Describe the policy risk or the reason this needs system-admin review.',
            initialReason: 'Possible policy violation',
            initialSeverity: 'High',
            confirmLabel: 'Send escalation',
            intent: 'primary',
            showSeverity: true,
        });
    };

    const handleDialogSubmit = ({ reason, severity }) => {
        if (!actionDialog) {
            return;
        }

        if (actionDialog.type === 'event-review') {
            reviewMutation.mutate({
                id: actionDialog.target.id,
                approved: false,
                reason,
            });
            return;
        }

        if (actionDialog.type === 'resource-review') {
            resourceReviewMutation.mutate({
                id: actionDialog.target.id,
                approved: false,
                reason,
            });
            return;
        }

        escalationMutation.mutate({
            targetId: actionDialog.target.id,
            targetType: actionDialog.targetType,
            reason,
            severity,
            sourceContext: actionDialog.sourceContext,
        });
    };

    return (
        <>
            <div className="space-y-8 animate-in fade-in duration-500">
                <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-6 py-8 text-white shadow-lg shadow-slate-900/10">
                    <div className="absolute right-0 top-0 h-48 w-48 translate-x-10 -translate-y-10 rounded-full bg-primary/15 blur-3xl" />
                    <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-10 translate-y-10 rounded-full bg-primary/10 blur-3xl" />

                    <div className="relative space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">HR Module</p>
                        <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
                        <p className="max-w-3xl text-sm leading-6 text-slate-200">
                            Review events and resources, then escalate sensitive issues to system admin with a tracked report history.
                        </p>
                    </div>
                </section>

                <div className="flex flex-wrap gap-2 p-1 bg-slate-100/50 rounded-2xl border border-slate-200 w-fit">
                    {contentTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setContentTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
                                contentTab === tab.id
                                    ? 'bg-[#0a192f] text-white shadow-lg shadow-[#0a192f]/20'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            )}
                        >
                            <tab.icon className="size-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {contentTab === 'events' && (
                    <div className="flex flex-wrap gap-2 p-1 bg-slate-100/50 rounded-2xl border border-slate-200 w-fit">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
                                    activeTab === tab.id
                                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                )}
                            >
                                <tab.icon className="size-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {currentLoading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                )}

                {!currentLoading && contentTab === 'report-center' && (
                    <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">All items</p>
                                <p className="mt-3 text-3xl font-bold text-slate-900">{reportCenter.length}</p>
                            </div>
                            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">Pending HR</p>
                                <p className="mt-3 text-3xl font-bold text-slate-900">{reportCenter.filter((item) => item.workflowStatus === 'PendingHrReview').length}</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Resolved</p>
                                <p className="mt-3 text-3xl font-bold text-slate-900">{reportCenter.filter((item) => item.workflowStatus === 'Resolved').length}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Dismissed</p>
                                <p className="mt-3 text-3xl font-bold text-slate-900">{reportCenter.filter((item) => item.workflowStatus === 'Dismissed').length}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {reportCenter.map((item) => (
                                <div key={`${item.itemType}-${item.itemId || item.targetId}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                    {item.itemType}
                                                </span>
                                                <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                                    {item.targetType}
                                                </span>
                                                <span className={cn(
                                                    'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                                                    item.workflowStatus === 'PendingHrReview'
                                                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                                                        : item.workflowStatus === 'Resolved'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                            : item.workflowStatus === 'Dismissed'
                                                                ? 'border-slate-200 bg-slate-100 text-slate-600'
                                                                : 'border-sky-200 bg-sky-50 text-sky-700'
                                                )}>
                                                    {item.workflowStatus}
                                                </span>
                                                {item.severity && (
                                                    <span className={cn(
                                                        'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                                                        severityStyles[item.severity] || 'bg-slate-100 text-slate-600 border-slate-200'
                                                    )}>
                                                        {item.severity}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{item.targetLabel}</h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {item.sourceContext || item.summary} • {new Date(item.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            {item.detail && (
                                                <p className="text-sm leading-6 text-slate-600">{item.detail}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {!reportCenter.length && (
                                <EmptyState
                                    icon={ClipboardList}
                                    title="No Moderation Reports"
                                    description="Pending reviews and escalation reports will appear here in one unified workflow."
                                />
                            )}
                        </div>
                    </div>
                )}

                {!currentLoading && contentTab === 'events' && (
                    <div className="space-y-4">
                        {events.map((eventItem) => (
                            <div key={eventItem.id} className="group relative bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                                <div className="flex items-start gap-5">
                                    <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all duration-300">
                                        <GraduationCap className="size-7" />
                                    </div>
                                    <div className="space-y-1.5 text-left">
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                                {eventItem.type}
                                            </span>
                                            <span className={cn(
                                                'inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest leading-none border',
                                                statusStyles[eventItem.status] || 'bg-slate-50 text-slate-400 border-slate-100'
                                            )}>
                                                {eventItem.status}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">{eventItem.title}</h3>
                                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                                            <span className="text-slate-600 font-bold uppercase tracking-tight">{eventItem.trainerName}</span>
                                            <span className="size-1 rounded-full bg-slate-200" />
                                            <span>{new Date(eventItem.startDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                    {eventItem.status === 'PendingApproval' && (
                                        <>
                                            <button
                                                type="button"
                                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-[#0a192f] rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-105 active:scale-95 transition-all"
                                                onClick={() => reviewMutation.mutate({ id: eventItem.id, approved: true })}
                                            >
                                                <ShieldCheck className="size-4" /> Approve
                                            </button>
                                            <button
                                                type="button"
                                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 border border-slate-200 bg-white text-slate-600 rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 active:scale-95 transition-all"
                                                onClick={() => openEventReviewDialog(eventItem)}
                                            >
                                                <XCircle className="size-4" /> Reject
                                            </button>
                                            <button
                                                type="button"
                                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 border border-amber-200 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-100 active:scale-95 transition-all"
                                                onClick={() => openEscalationDialog('TrainingEvent', eventItem, 'HrModerationPage.EventQueue')}
                                            >
                                                <ChevronRight className="size-4" /> Escalate
                                            </button>
                                        </>
                                    )}
                                    {(eventItem.status === 'Published' || eventItem.status === 'Completed') && (
                                        <button
                                            onClick={() => setSelectedEvent(eventItem)}
                                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all"
                                        >
                                            View Details
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedEvent(eventItem)}
                                        className="hidden lg:flex size-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all border border-slate-100 font-bold"
                                    >
                                        <ChevronRight className="size-5" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {!events.length && (
                            <EmptyState
                                icon={Clock}
                                title="No Events Found"
                                description="There are no classes matching this moderation category right now."
                            />
                        )}
                    </div>
                )}

                {!currentLoading && contentTab === 'resources' && (
                    <div className="space-y-4">
                        {resources.map((resource) => (
                            <div key={resource.id} className="group relative rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-start gap-5">
                                        <div className="size-14 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all duration-300">
                                            <FileStack className="size-7" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                                    {resource.type}
                                                </span>
                                                <span className="inline-flex px-2 py-0.5 rounded-md border border-amber-100 bg-amber-50 text-[10px] font-bold uppercase tracking-widest leading-none text-amber-700">
                                                    Pending Resource
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">{resource.title}</h3>
                                            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400">
                                                <span className="text-slate-600 font-bold uppercase tracking-tight">{resource.eventTitle}</span>
                                                <span className="size-1 rounded-full bg-slate-200" />
                                                <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 lg:border-t-0 lg:pt-0">
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-[#0a192f] shadow-lg shadow-primary/20 transition-all hover:brightness-105 active:scale-95"
                                            onClick={() => resourceReviewMutation.mutate({ id: resource.id, approved: true })}
                                        >
                                            <ShieldCheck className="size-4" />
                                            Approve
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-600 active:scale-95"
                                            onClick={() => openResourceReviewDialog(resource)}
                                        >
                                            <XCircle className="size-4" />
                                            Reject
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-700 transition-all hover:bg-amber-100 active:scale-95"
                                            onClick={() => openEscalationDialog('Resource', resource, 'HrModerationPage.ResourceQueue')}
                                        >
                                            <AlertTriangle className="size-4" />
                                            Escalate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!resources.length && (
                            <EmptyState
                                icon={FileStack}
                                title="No Resources Waiting"
                                description="Every pending resource has been reviewed or there are no new submissions."
                            />
                        )}
                    </div>
                )}

                {!currentLoading && contentTab === 'escalations' && (
                    <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">Pending</p>
                                <p className="mt-3 text-3xl font-bold text-slate-900">{pendingEscalations}</p>
                                <p className="mt-1 text-sm text-slate-500">Still waiting for system-admin handling.</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Resolved</p>
                                <p className="mt-3 text-3xl font-bold text-slate-900">{resolvedEscalations}</p>
                                <p className="mt-1 text-sm text-slate-500">Handled through moderation action.</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Dismissed</p>
                                <p className="mt-3 text-3xl font-bold text-slate-900">{dismissedEscalations}</p>
                                <p className="mt-1 text-sm text-slate-500">Reviewed without stronger enforcement.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {escalations.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                    {item.targetType}
                                                </span>
                                                <span className={cn(
                                                    'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                                                    severityStyles[item.severity] || 'bg-slate-100 text-slate-600 border-slate-200'
                                                )}>
                                                    {item.severity}
                                                </span>
                                                <span className={cn(
                                                    'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                                                    escalationStatusStyles[item.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                                                )}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{item.targetLabel}</h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {item.sourceContext || 'HR moderation workflow'} • {new Date(item.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <p className="max-w-3xl text-sm leading-6 text-slate-600">{item.reason}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {!escalations.length && (
                                <EmptyState
                                    icon={ShieldAlert}
                                    title="No Escalations Yet"
                                    description="Escalated reports from HR moderation will appear here with their latest status."
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

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

            <AnimatePresence>
                {actionDialog && (
                    <ModerationActionDialog
                        config={actionDialog}
                        onClose={() => setActionDialog(null)}
                        onSubmit={handleDialogSubmit}
                        isPending={
                            reviewMutation.isPending ||
                            resourceReviewMutation.isPending ||
                            escalationMutation.isPending
                        }
                    />
                )}
            </AnimatePresence>
        </>
    );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrNotificationsApi, hrDepartmentsApi } from '../../../api/hrApi';
import {
    Bell, Send, History, Building, Users, Loader2, CheckCircle2,
    AlertCircle, Search, Mail, Smartphone, Clock, Info, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { toastService } from '../../../services/toastService';

export default function NotificationsPage() {
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState('create');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        targetType: 'Company',
        targetDepartmentIds: [],
        channel: 'Push',
    });

    // Queries
    const { data: departments = [] } = useQuery({
        queryKey: ['hr', 'departments'],
        queryFn: hrDepartmentsApi.list,
    });

    const { data: history = [], isLoading: isHistoryLoading } = useQuery({
        queryKey: ['hr', 'notifications', 'history'],
        queryFn: hrNotificationsApi.history,
        enabled: activeTab === 'history',
    });

    // Mutation
    const broadcastMutation = useMutation({
        mutationFn: (data) => hrNotificationsApi.broadcast(data),
        onSuccess: (data) => {
            toastService.success(`Broadcast sent successfully to ${data.recipientCount} users!`);
            setFormData({
                title: '',
                body: '',
                targetType: 'Company',
                targetDepartmentIds: [],
                channel: 'Push',
            });
            qc.invalidateQueries({ queryKey: ['hr', 'notifications', 'history'] });
            setActiveTab('history');
        },
        onError: (error) => {
            toastService.error(error?.response?.data?.message || 'Failed to send broadcast.');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.body.trim()) return;

        broadcastMutation.mutate({
            ...formData,
            targetDepartmentIds: formData.targetType === 'Department' ? formData.targetDepartmentIds : null
        });
    };

    const toggleDept = (id) => {
        setFormData(prev => ({
            ...prev,
            targetDepartmentIds: prev.targetDepartmentIds.includes(id)
                ? prev.targetDepartmentIds.filter(d => d !== id)
                : [...prev.targetDepartmentIds, id]
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Hero Section ─────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-6 py-8 text-white shadow-lg shadow-slate-900/10">
                <div className="absolute right-0 top-0 h-48 w-48 translate-x-10 -translate-y-10 rounded-full bg-primary/15 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-10 translate-y-10 rounded-full bg-primary/10 blur-3xl" />

                <div className="relative space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">HR Module</p>
                    <h1 className="text-3xl font-bold tracking-tight">Internal Communications</h1>
                    <p className="max-w-2xl text-sm leading-6 text-slate-200">
                        Keep your team informed and engaged with instant broadcasts and multi-channel notifications.
                    </p>
                </div>
            </section>

            {/* ── Navigation Tabs ─────────────────────────────────────────────── */}
            <div className="flex p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-xl w-fit border border-slate-200/50">
                <button
                    onClick={() => setActiveTab('create')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300",
                        activeTab === 'create'
                            ? "bg-white text-primary shadow-md shadow-slate-200 border border-slate-100"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    )}
                >
                    <Send className="size-4" />
                    New Broadcast
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300",
                        activeTab === 'history'
                            ? "bg-white text-primary shadow-md shadow-slate-200 border border-slate-100"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    )}
                >
                    <History className="size-4" />
                    Broadcast Log
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'create' ? (
                    <motion.div
                        key="create"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* ── Composition Panel ─────────────────────────────────── */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-8">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-slate-900">Message Composition</h3>
                                    <p className="text-xs text-slate-400 font-medium tracking-tight">Draft your notification and select delivery channels below.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1">
                                            Notification Subject
                                        </label>
                                        <div className="relative group">
                                            <Bell className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                            <input
                                                required
                                                className="w-full h-14 bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-6 text-sm font-bold text-slate-700 focus:border-primary/40 focus:bg-white outline-none transition-all"
                                                placeholder="Enter a descriptive title..."
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1">
                                            Content Message
                                        </label>
                                        <textarea
                                            required
                                            rows={6}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-5 text-sm font-bold text-slate-700 focus:border-primary/40 focus:bg-white outline-none transition-all resize-none leading-relaxed"
                                            placeholder="Type your message content here..."
                                            value={formData.body}
                                            onChange={e => setFormData({ ...formData, body: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1">Target Audience</label>
                                            <div className="space-y-2.5">
                                                {['Company', 'Department'].map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, targetType: type })}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all font-bold text-sm",
                                                            formData.targetType === type
                                                                ? "bg-[#0a192f] border-[#0a192f] text-white shadow-lg"
                                                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {type === 'Company' ? <Building className="size-4" /> : <Users className="size-4" />}
                                                            {type} Wide
                                                        </div>
                                                        {formData.targetType === type && <CheckCircle2 className="size-4 text-primary" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-1">Delivery Channel</label>
                                            <div className="space-y-2.5">
                                                {['Push', 'Email'].map((ch) => (
                                                    <button
                                                        key={ch}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, channel: ch })}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all font-bold text-sm",
                                                            formData.channel === ch
                                                                ? "bg-primary/5 border-primary/40 text-primary"
                                                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {ch === 'Push' ? <Smartphone className="size-4" /> : <Mail className="size-4" />}
                                                            {ch} Service
                                                        </div>
                                                        {formData.channel === ch && <CheckCircle2 className="size-4 text-primary" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={broadcastMutation.isPending}
                                        className="w-full h-16 bg-primary text-[#0a192f] text-base font-black rounded-xl hover:brightness-105 active:scale-[0.98] transition-all shadow-xl shadow-primary/10 flex items-center justify-center gap-3 disabled:opacity-50 mt-4 overflow-hidden"
                                    >
                                        <AnimatePresence mode="wait">
                                            {broadcastMutation.isPending ? (
                                                <motion.div
                                                    key="loading"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Loader2 className="size-5 animate-spin" />
                                                    Processing Broadcast...
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="idle"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Send className="size-5" />
                                                    Dispatch Notification
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* ── Configuration Panel ───────────────────────────────── */}
                        <div className="space-y-6">
                            <div className={cn(
                                "bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-hidden transition-all duration-500",
                                formData.targetType === 'Department' ? "opacity-100 translate-y-0" : "opacity-40 -translate-y-2 pointer-events-none grayscale"
                            )}>
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <Building className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">Target Filters</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select Departments</p>
                                    </div>
                                </div>

                                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                                    {departments.map((dept) => (
                                        <button
                                            key={dept.id}
                                            onClick={() => toggleDept(dept.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3.5 rounded-lg border transition-all text-left",
                                                formData.targetDepartmentIds.includes(dept.id)
                                                    ? "bg-primary/5 border-primary/20 text-[#0a192f] shadow-sm"
                                                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                            )}
                                        >
                                            <span className="text-xs font-bold truncate pr-2 uppercase tracking-wide">{dept.name}</span>
                                            <div className={cn(
                                                "size-4 rounded border flex items-center justify-center transition-all",
                                                formData.targetDepartmentIds.includes(dept.id)
                                                    ? "bg-primary border-primary text-[#0a192f]"
                                                    : "border-slate-200"
                                            )}>
                                                {formData.targetDepartmentIds.includes(dept.id) && <CheckCircle2 className="size-3" />}
                                            </div>
                                        </button>
                                    ))}
                                    {departments.length === 0 && (
                                        <p className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-widest border border-dashed border-slate-100 rounded-xl bg-slate-50/50">No departments found</p>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                                        Selection Summary
                                    </p>
                                    <span className="text-xs font-bold text-primary">
                                        {formData.targetDepartmentIds.length} Selected
                                    </span>
                                </div>
                            </div>

                            {/* Info Widget */}
                            <div className="bg-[#0a192f] text-white rounded-xl p-6 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-primary/20 blur-2xl group-hover:bg-primary/30 transition-all" />
                                <div className="relative space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 text-primary">
                                            <Info className="size-4" />
                                        </div>
                                        <h4 className="font-bold text-xs uppercase tracking-widest">Helpful Hint</h4>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                        Targeting the <span className="text-white font-bold">Company</span> will reach everyone. Using <span className="text-primary font-bold">Groups</span> will filter notifications only for relevant employees.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                    >
                        {isHistoryLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-white border border-slate-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : history.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {history.map((item) => (
                                    <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary/30 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 group flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-start gap-5 flex-1 min-w-0">
                                            <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all duration-300">
                                                <Bell className="size-7" />
                                            </div>
                                            <div className="space-y-1.5 overflow-hidden">
                                                <h4 className="font-bold text-slate-900 text-lg leading-none truncate">{item.title}</h4>
                                                <p className="text-slate-500 text-xs font-semibold line-clamp-1 leading-snug">{item.body}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <Clock className="size-3" /> {new Date(item.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/20">
                                                        <Users className="size-3" /> {item.recipientCount} Recipients
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="hidden lg:flex size-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all border border-slate-100">
                                            <ChevronRight className="size-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center py-24 gap-6 text-center animate-in zoom-in-95 duration-500">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-slate-200/50 blur-2xl rounded-full group-hover:bg-slate-200/80 transition-all" />
                                    <div className="relative size-20 rounded-3xl bg-white flex items-center justify-center text-slate-200 border border-slate-100 shadow-sm">
                                        <History className="size-10" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xl font-bold text-slate-900">Archive Empty</p>
                                    <p className="text-slate-400 font-medium text-sm">No notification logs were found in your record.</p>
                                </div>
                                <button onClick={() => setActiveTab('create')} className="mt-2 px-8 py-3 bg-[#0a192f] text-white text-sm font-bold rounded-xl hover:brightness-125 active:scale-95 transition-all shadow-lg shadow-slate-900/10">
                                    Go Send First Broadcast
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

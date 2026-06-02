import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrNotificationsApi, hrDepartmentsApi } from '../../../api/hrApi';
import {
    Bell, Send, History, Building, Users, Loader2, CheckCircle2,
    AlertCircle, Search, Mail, Smartphone, Clock, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';

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
            toast.success(`Broadcast sent successfully to ${data.recipientCount} users!`);
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
            toast.error(error?.response?.data?.message || 'Failed to send broadcast.');
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
        <div className="max-w-[1000px] mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[#0a192f] tracking-tight">Notifications</h1>
                    <p className="text-slate-500 mt-2 font-semibold">Keep your team informed and engaged with instant broadcasts.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1.5 bg-slate-100 rounded-[24px] w-fit">
                <button
                    onClick={() => setActiveTab('create')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-[18px] text-sm font-black transition-all",
                        activeTab === 'create' ? "bg-white text-[#0a192f] shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <Send className="size-4" />
                    Send Broadcast
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-[18px] text-sm font-black transition-all",
                        activeTab === 'history' ? "bg-white text-[#0a192f] shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <History className="size-4" />
                    Sent History
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'create' ? (
                    <motion.div
                        key="create"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* Form Section */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-[40px] border-2 border-slate-100 p-8 shadow-sm space-y-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                                            <Bell className="size-3.5 text-[#13ecb6]" /> Notification Title
                                        </label>
                                        <input
                                            required
                                            className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-700 focus:border-[#13ecb6]/50 focus:bg-white outline-none transition-all"
                                            placeholder="Enter a catchy title..."
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                                            Content Message
                                        </label>
                                        <textarea
                                            required
                                            rows={5}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-5 text-sm font-bold text-slate-700 focus:border-[#13ecb6]/50 focus:bg-white outline-none transition-all resize-none"
                                            placeholder="What do you want to tell everyone?"
                                            value={formData.body}
                                            onChange={e => setFormData({ ...formData, body: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Target Audience</label>
                                            <div className="flex flex-col gap-2">
                                                {['Company', 'Department'].map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, targetType: type })}
                                                        className={cn(
                                                            "flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-bold text-sm",
                                                            formData.targetType === type
                                                                ? "bg-[#0a192f] border-[#0a192f] text-white shadow-lg"
                                                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {type === 'Company' ? <Building className="size-4" /> : <Users className="size-4" />}
                                                            {type}
                                                        </div>
                                                        {formData.targetType === type && <CheckCircle2 className="size-4 text-[#13ecb6]" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Channel</label>
                                            <div className="flex flex-col gap-2">
                                                {['Push', 'Email'].map((ch) => (
                                                    <button
                                                        key={ch}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, channel: ch })}
                                                        className={cn(
                                                            "flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-bold text-sm",
                                                            formData.channel === ch
                                                                ? "bg-[#13ecb6]/10 border-[#13ecb6] text-[#0a192f]"
                                                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {ch === 'Push' ? <Smartphone className="size-4" /> : <Mail className="size-4" />}
                                                            {ch} Notifications
                                                        </div>
                                                        {formData.channel === ch && <CheckCircle2 className="size-4 text-[#13ecb6]" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={broadcastMutation.isPending}
                                        className="w-full h-18 bg-[#13ecb6] text-[#0a192f] text-base font-black rounded-3xl hover:scale-[1.01] active:scale-[0.98] transition-all shadow-xl shadow-[#13ecb6]/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {broadcastMutation.isPending ? (
                                            <Loader2 className="size-6 animate-spin" />
                                        ) : (
                                            <Send className="size-5" />
                                        )}
                                        Send Broadcast Now
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Selection Column (Visible when Department is selected) */}
                        <div className="space-y-6">
                            <div className={cn(
                                "bg-white rounded-[40px] border-2 border-slate-100 p-8 shadow-sm overflow-hidden transition-all duration-500",
                                formData.targetType === 'Department' ? "opacity-100 scale-100" : "opacity-30 scale-95 pointer-events-none grayscale"
                            )}>
                                <h3 className="text-lg font-black text-[#0a192f] mb-2 flex items-center gap-2">
                                    <Users className="size-5 text-[#13ecb6]" />
                                    Select Departments
                                </h3>
                                <p className="text-slate-400 font-bold text-xs mb-6">Choose one or more departments to receive this alert.</p>

                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {departments.map((dept) => (
                                        <button
                                            key={dept.id}
                                            onClick={() => toggleDept(dept.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                                                formData.targetDepartmentIds.includes(dept.id)
                                                    ? "bg-slate-50 border-[#13ecb6]/30 text-[#0a192f]"
                                                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                            )}
                                        >
                                            <span className="text-sm font-bold truncate pr-2">{dept.name}</span>
                                            <div className={cn(
                                                "size-5 rounded-lg border-2 flex items-center justify-center transition-all",
                                                formData.targetDepartmentIds.includes(dept.id)
                                                    ? "bg-[#13ecb6] border-[#13ecb6] text-white"
                                                    : "border-slate-200"
                                            )}>
                                                {formData.targetDepartmentIds.includes(dept.id) && <CheckCircle2 className="size-3.5 fill-white" />}
                                            </div>
                                        </button>
                                    ))}
                                    {departments.length === 0 && (
                                        <p className="text-center py-8 text-slate-400 text-sm font-bold">No departments available.</p>
                                    )}
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 italic">
                                        {formData.targetDepartmentIds.length} departments selected
                                    </p>
                                </div>
                            </div>

                            {/* Hint Box */}
                            <div className="bg-[#0a192f] text-white rounded-[32px] p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="size-5 text-[#13ecb6]" />
                                    <h4 className="font-black text-sm uppercase tracking-wider">Note</h4>
                                </div>
                                <p className="text-sm text-white/70 leading-relaxed font-bold">
                                    Broadcasting to the <span className="text-[#13ecb6]">Company</span> will reach all active users. Targeted <span className="text-[#13ecb6]">Departments</span> helps reduce noise for uninvolved teams.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {isHistoryLoading ? (
                            <div className="grid grid-cols-1 gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-28 bg-white border border-slate-100 rounded-[32px] animate-pulse" />
                                ))}
                            </div>
                        ) : history.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {history.map((item) => (
                                    <div key={item.id} className="bg-white rounded-[32px] border-2 border-slate-100 p-6 hover:border-slate-200 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-5 flex-1">
                                            <div className="size-12 rounded-2xl bg-[#0a192f] text-[#13ecb6] flex items-center justify-center shrink-0 border border-white/10">
                                                <Bell className="size-6" />
                                            </div>
                                            <div className="space-y-1 overflow-hidden">
                                                <h4 className="font-black text-[#0a192f] text-lg truncate pr-4">{item.title}</h4>
                                                <p className="text-slate-500 text-sm font-bold line-clamp-1">{item.body}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <Clock className="size-3" /> {new Date(item.sentAt).toLocaleString('vi-VN')}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-[#13ecb6] uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                        <Users className="size-3" /> {item.recipientCount} Recipients
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="self-end md:self-center p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-[#0a192f] transition-all border border-slate-100">
                                            <Info className="size-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center py-24 gap-4 text-center">
                                <div className="size-20 rounded-[30px] bg-slate-50 flex items-center justify-center text-slate-200">
                                    <History className="size-10" />
                                </div>
                                <div >
                                    <p className="text-xl font-black text-[#0a192f]">No history found</p>
                                    <p className="text-slate-400 font-bold mt-1">Send your first broadcast to see it here.</p>
                                </div>
                                <button onClick={() => setActiveTab('create')} className="mt-4 px-8 py-3 bg-[#0a192f] text-white text-sm font-black rounded-2xl hover:scale-105 active:scale-95 transition-all">
                                    Go Send One
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

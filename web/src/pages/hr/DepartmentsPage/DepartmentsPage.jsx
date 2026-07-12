import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrDepartmentsApi, hrMembersApi } from '../../../api/hrApi';
import {
    Building2, Users, Plus, Loader2, Edit2, Trash2, ChevronRight,
    Search, X, Check, BarChart3, Info, ChevronDown, User, Hash
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { toastService } from '../../../services/toastService';
import { motion, AnimatePresence } from 'framer-motion';

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function DepartmentsPage() {
    const qc = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [deletingDept, setDeletingDept] = useState(null);
    const [selectedDeptForStats, setSelectedDeptForStats] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        parentDepartmentId: '',
        managerUserId: ''
    });

    // Queries
    const { data: departments = [], isLoading: isDeptsLoading } = useQuery({
        queryKey: ['hr', 'departments'],
        queryFn: hrDepartmentsApi.list,
    });

    const { data: membersData } = useQuery({
        queryKey: ['hr', 'members', 'list-all'],
        queryFn: () => hrMembersApi.list({ pageSize: 1000 }),
    });
    const members = membersData?.data || [];

    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['hr', 'departments', selectedDeptForStats?.id, 'stats'],
        queryFn: () => hrDepartmentsApi.stats(selectedDeptForStats.id),
        enabled: !!selectedDeptForStats,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => hrDepartmentsApi.create(data),
        onSuccess: () => {
            toastService.success('Department created successfully');
            closeModal();
            qc.invalidateQueries({ queryKey: ['hr', 'departments'] });
        },
        onError: (err) => {
            toastService.error(err?.response?.data?.message || 'Failed to create department');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => hrDepartmentsApi.update(id, data),
        onSuccess: () => {
            toastService.success('Department updated successfully');
            closeModal();
            qc.invalidateQueries({ queryKey: ['hr', 'departments'] });
        },
        onError: (err) => {
            toastService.error(err?.response?.data?.message || 'Failed to update department');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => hrDepartmentsApi.remove(id),
        onSuccess: () => {
            toastService.success('Department deleted successfully');
            setIsDeleteConfirmOpen(false);
            setDeletingDept(null);
            qc.invalidateQueries({ queryKey: ['hr', 'departments'] });
        },
        onError: (err) => {
            toastService.error(err?.response?.data?.message || 'Failed to delete department');
        }
    });

    // Handlers
    const openModal = (dept = null) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({
                name: dept.name,
                code: dept.code || '',
                parentDepartmentId: dept.parentDepartmentId || '',
                managerUserId: dept.managerUserId || ''
            });
        } else {
            setEditingDept(null);
            setFormData({
                name: '',
                code: '',
                parentDepartmentId: '',
                managerUserId: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingDept(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            name: formData.name,
            code: formData.code || null,
            parentDepartmentId: formData.parentDepartmentId || null,
            managerUserId: formData.managerUserId || null,
        };

        if (editingDept) {
            updateMutation.mutate({ id: editingDept.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const filteredDepts = departments.filter((d) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.code && d.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isDeptsLoading) {
        return (
            <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-6">
                <div className="h-9 w-48 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-12 w-full bg-white border border-slate-100 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-48 bg-white border border-slate-100 rounded-3xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-10"
        >
            {/* ── Hero Section ─────────────────────────────────────────────────── */}
            <motion.section variants={itemVariants} className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-8 py-10 text-white shadow-2xl shadow-primary/10 transition-transform duration-500">
                <div className="absolute right-0 top-0 h-48 w-48 translate-x-10 -translate-y-10 rounded-full bg-primary/20 blur-[60px] animate-pulse" />
                <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-10 translate-y-10 rounded-full bg-teal-400/10 blur-[60px]" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDExNSwxMTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
                    <div className="space-y-3">
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
                            className="text-4xl lg:text-5xl font-black tracking-tight drop-shadow-md"
                        >
                            Departments
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="max-w-2xl text-sm leading-relaxed text-slate-200/90 font-medium"
                        >
                            Manage your organization's heartbeat, structural hierarchies, and nested team groups.
                        </motion.p>
                    </div>
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        onClick={() => openModal()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-[#0a192f] font-black rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-sm"
                    >
                        <Plus className="size-5" />
                        New Department
                    </motion.button>
                </div>
            </motion.section>

            {/* ── Actions & Filters ────────────────────────────────────────────── */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-slate-400 group-focus-within:text-primary transition-colors duration-300" />
                    <input
                        className="w-full bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm hover:shadow-md"
                        placeholder="Search by name or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-xl text-xs font-black text-slate-600 uppercase tracking-widest shadow-sm">
                    <Building2 className="size-4 text-primary" />
                    <span>{filteredDepts.length}</span> Departments
                </div>
            </motion.div>

            {/* ── Grid View ────────────────────────────────────────────────────── */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDepts.map((d) => (
                    <motion.article
                        variants={itemVariants}
                        key={d.id}
                        className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl p-5 shadow-sm transition duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/[0.03] blur-2xl group-hover:bg-primary/[0.08] transition-colors duration-500" />

                        <div className="relative z-10 flex justify-between items-start mb-5">
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-primary group-hover:scale-110 group-hover:bg-primary/10 group-hover:shadow-sm transition-all duration-300">
                                <Building2 className="size-5" />
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => openModal(d)}
                                    className="p-2 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/30 hover:shadow-sm transition-all"
                                    title="Edit"
                                >
                                    <Edit2 className="size-4" />
                                </button>
                                <button
                                    onClick={() => { setDeletingDept(d); setIsDeleteConfirmOpen(true); }}
                                    className="p-2 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 hover:shadow-sm transition-all"
                                    title="Delete"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </div>

                        <div className="relative z-10 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-black text-slate-900 group-hover:text-primary transition-colors truncate max-w-[70%]">{d.name}</h3>
                                {d.code && (
                                    <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                                        {d.code}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md w-fit">
                                {d.parentDepartmentName ? (
                                    <span className="flex items-center gap-1">
                                        <ChevronRight className="size-3 text-primary" />
                                        {d.parentDepartmentName}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-emerald-600">
                                        <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        Top Level
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="relative z-10 mt-8 pt-5 border-t border-slate-100 space-y-4 flex-grow">
                            <div className="flex items-center justify-between bg-slate-50/80 p-3 rounded-xl border border-slate-100 group-hover:border-slate-200 group-hover:bg-white transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm group-hover:border-primary/20 group-hover:text-primary transition-colors">
                                        <User className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manager</p>
                                        <p className="text-sm font-bold text-slate-700">{d.managerName || 'Not Assigned'}</p>
                                    </div>
                                </div>
                                <div className="rounded-lg bg-primary/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-primary flex items-center gap-1.5 border border-primary/10 shadow-sm">
                                    <Users className="size-3.5" />
                                    <span>{d.userCount}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => { setSelectedDeptForStats(d); setIsStatsOpen(true); }}
                            className="relative z-10 mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-100 bg-white text-xs font-black text-slate-600 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-md transition-all active:scale-95"
                        >
                            <BarChart3 className="size-4" />
                            View Performance Data
                        </button>
                    </motion.article>
                ))}

                {!filteredDepts.length && !isDeptsLoading && (
                    <motion.div variants={itemVariants} className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-sm py-24 text-center">
                        <div className="inline-flex size-20 items-center justify-center rounded-3xl bg-white shadow-lg shadow-slate-200/50 mb-6 border border-slate-100 relative">
                            <div className="absolute inset-0 bg-primary/10 rounded-3xl animate-pulse blur-xl" />
                            <Building2 className="size-10 text-slate-300 relative z-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">No departments found</h3>
                        <p className="mt-2 text-sm text-slate-500 font-medium max-w-md mx-auto">Try adjusting your search filters or start clean by creating a new department structure.</p>
                        <button
                            onClick={() => openModal()}
                            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-[#0a192f] hover:brightness-110 active:scale-95 shadow-lg shadow-primary/20 transition-all"
                        >
                            <Plus className="size-5" />
                            Create New Department
                        </button>
                    </motion.div>
                )}
            </motion.div>

            {/* ── Add/Edit Modal & Stats Modal omitted for brevity of content block if not changed. But included complete for stability. */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F1F3D]/60 backdrop-blur-md" onClick={closeModal} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                            <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5 flex items-center justify-between">
                                <h2 className="text-lg font-black text-slate-900">{editingDept ? 'Edit' : 'New'} Department</h2>
                                <button onClick={closeModal} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 shadow-sm transition-all">
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Building2 className="size-3.5" /> Department Name
                                        </label>
                                        <input
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                            placeholder="e.g. Engineering"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Hash className="size-3.5" /> Code
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                placeholder="ENG"
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <ChevronDown className="size-3.5" /> Parent
                                            </label>
                                            <select
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                value={formData.parentDepartmentId}
                                                onChange={e => setFormData({ ...formData, parentDepartmentId: e.target.value })}
                                            >
                                                <option value="">Top Level</option>
                                                {departments.filter((d) => d.id !== editingDept?.id).map((d) => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <User className="size-3.5" /> Department Manager
                                        </label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                            value={formData.managerUserId}
                                            onChange={e => setFormData({ ...formData, managerUserId: e.target.value })}
                                        >
                                            <option value="">Select a manager</option>
                                            {members.map((m) => (
                                                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="flex-[2] px-4 py-3 bg-primary text-[#0a192f] rounded-xl text-sm font-black hover:brightness-110 active:scale-[0.98] shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {(createMutation.isPending || updateMutation.isPending) ? (
                                            <Loader2 className="size-5 animate-spin" />
                                        ) : (
                                            <Check className="size-5" />
                                        )}
                                        {editingDept ? 'Update Structure' : 'Create Department'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isDeleteConfirmOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F1F3D]/60 backdrop-blur-md" onClick={() => setIsDeleteConfirmOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                            <div className="p-8 text-center space-y-6">
                                <div className="size-20 rounded-3xl bg-red-50 text-red-500 border border-red-100 mx-auto flex items-center justify-center shadow-inner relative">
                                    <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full" />
                                    <Trash2 className="size-10 relative z-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete Department?</h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                        Are you sure you want to delete <span className="font-bold text-slate-900 border-b border-slate-300">{deletingDept?.name}</span>? This structural change cannot be undone.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3 pt-4">
                                    <button
                                        onClick={() => deletingDept && deleteMutation.mutate(deletingDept.id)}
                                        disabled={deleteMutation.isPending}
                                        className="w-full py-3.5 bg-red-600 text-white rounded-xl text-sm font-black hover:bg-red-700 shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {deleteMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-5" />}
                                        Confirm Removal
                                    </button>
                                    <button
                                        onClick={() => setIsDeleteConfirmOpen(false)}
                                        className="w-full py-3.5 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-50 transition-all"
                                    >
                                        Cancel Process
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isStatsOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F1F3D]/60 backdrop-blur-md" onClick={() => setIsStatsOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                            <div className="relative border-b border-slate-100 bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-8 py-6 flex items-center justify-between text-white">
                                <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 bg-primary/20 rounded-full blur-2xl" />
                                <div className="relative z-10 flex flex-col gap-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Department Performance</p>
                                    <h2 className="text-2xl font-black">{selectedDeptForStats?.name}</h2>
                                </div>
                                <button onClick={() => setIsStatsOpen(false)} className="relative z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors">
                                    <X className="size-6 text-white" />
                                </button>
                            </div>

                            <div className="p-8 space-y-8 bg-slate-50/50">
                                {isStatsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-5">
                                        <Loader2 className="size-12 text-primary animate-spin drop-shadow-md" />
                                        <p className="text-sm font-black text-slate-400 tracking-widest uppercase">Fetching Analytics Data...</p>
                                    </div>
                                ) : stats ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-4">Total Enrollments</p>
                                                <p className="text-4xl font-black tracking-tighter text-slate-900">{stats.enrollmentCount}</p>
                                            </div>
                                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-4">Learning Hours</p>
                                                <div className="flex items-baseline gap-1.5">
                                                    <p className="text-4xl font-black tracking-tighter text-slate-900">{stats.totalHours.toFixed(1)}</p>
                                                    <span className="text-sm font-bold text-slate-400">hrs</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-white to-primary/5 p-8 shadow-md relative overflow-hidden group">
                                            <div className="absolute right-0 bottom-0 h-32 w-32 translate-x-8 translate-y-8 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
                                            <div className="relative z-10 flex items-center justify-between mb-5">
                                                <p className="text-xs text-primary font-black uppercase tracking-[0.15em]">Average Course Rating</p>
                                                <span className="rounded-md bg-primary text-[#0a192f] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm">Key Metric</span>
                                            </div>
                                            <div className="relative z-10 flex items-center gap-5">
                                                <p className="text-6xl font-black tracking-tighter text-slate-900">{stats.avgRating?.toFixed(1) || '0.0'}</p>
                                                <div className="space-y-1.5">
                                                    <div className="flex text-amber-400 gap-1">
                                                        {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-2xl drop-shadow-sm">★</span>)}
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Out of 5.0 points</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-start gap-4 shadow-sm">
                                            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                                                <Info className="size-5" />
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed font-bold">
                                                Statistical analysis based on members current participation in <span className="text-slate-800">training cycles</span>. Data updates in real-time.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-red-50 rounded-2xl border border-red-200 shadow-sm">
                                        <p className="text-sm font-black text-red-600 uppercase tracking-widest">Failed to aggregate data</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => setIsStatsOpen(false)}
                                    className="w-full py-4 border-2 border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-black hover:bg-slate-50 hover:border-slate-300 transition-all"
                                >
                                    Dismiss Report
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

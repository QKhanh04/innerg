import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrDepartmentsApi, hrMembersApi } from '../../../api/hrApi';
import {
    Building2, Users, Plus, Loader2, Edit2, Trash2, ChevronRight,
    Search, X, Check, BarChart3, Info, ChevronDown, User, Hash
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { toastService } from '../../../services/toastService';

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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Hero Section ─────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-6 py-8 text-white shadow-lg shadow-slate-900/10">
                <div className="absolute right-0 top-0 h-48 w-48 translate-x-10 -translate-y-10 rounded-full bg-primary/15 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-10 translate-y-10 rounded-full bg-primary/10 blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 font-geist">
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">HR Module</p>
                        <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-200">
                            Manage your organization's heartbeat and team structures.
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-[#0a192f] font-bold rounded-xl shadow-lg hover:brightness-105 active:scale-95 transition-all text-sm"
                    >
                        <Plus className="size-5" />
                        New Department
                    </button>
                </div>
            </section>

            {/* ── Actions & Filters ────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm"
                        placeholder="Search by name or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Building2 className="size-4" />
                    <span>{filteredDepts.length} Departments Total</span>
                </div>
            </div>

            {/* ── Grid View ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDepts.map((d) => (
                    <article
                        key={d.id}
                        className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md"
                    >
                        <div className="flex justify-between items-start mb-5">
                            <div className="rounded-xl border border-primary/15 bg-primary/10 p-3 text-primary group-hover:scale-110 transition-transform">
                                <Building2 className="size-5" />
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => openModal(d)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                                    title="Edit"
                                >
                                    <Edit2 className="size-4" />
                                </button>
                                <button
                                    onClick={() => { setDeletingDept(d); setIsDeleteConfirmOpen(true); }}
                                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                    title="Delete"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors truncate max-w-[70%]">{d.name}</h3>
                                {d.code && (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        {d.code}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                {d.parentDepartmentName ? (
                                    <span className="flex items-center gap-1">
                                        <ChevronRight className="size-3 text-slate-300" />
                                        {d.parentDepartmentName}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1">
                                        <div className="size-1 w-1 rounded-full bg-emerald-400" />
                                        Top Level
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 pt-5 border-t border-slate-100 space-y-4 flex-grow">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 overflow-hidden">
                                        <User className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Manager</p>
                                        <p className="text-sm font-semibold text-slate-700">{d.managerName || 'Not Assigned'}</p>
                                    </div>
                                </div>
                                <div className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary flex items-center gap-1.5">
                                    <Users className="size-3" />
                                    <span>{d.userCount}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => { setSelectedDeptForStats(d); setIsStatsOpen(true); }}
                            className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 hover:bg-white hover:border-primary/30 hover:text-primary hover:shadow-sm transition-all"
                        >
                            <BarChart3 className="size-4" />
                            View Performance Data
                        </button>
                    </article>
                ))}

                {!filteredDepts.length && !isDeptsLoading && (
                    <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-20 text-center">
                        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm mb-4">
                            <Building2 className="size-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No departments found</h3>
                        <p className="mt-1 text-sm text-slate-500">Try a different search or create a new department.</p>
                        <button
                            onClick={() => openModal()}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0a192f] px-5 py-2.5 text-sm font-bold text-white hover:brightness-125 transition-all"
                        >
                            <Plus className="size-4" />
                            Create New Department
                        </button>
                    </div>
                )}
            </div>

            {/* ── Add/Edit Modal ──────────────────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeModal} />
                    <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">{editingDept ? 'Edit' : 'New'} Department</h2>
                            <button onClick={closeModal} className="p-2 rounded-lg text-slate-400 hover:bg-white hover:text-slate-600 shadow-sm transition-all">
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Building2 className="size-3.5" /> Department Name
                                    </label>
                                    <input
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                        placeholder="e.g. Engineering"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <Hash className="size-3.5" /> Code
                                        </label>
                                        <input
                                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                            placeholder="ENG"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <ChevronDown className="size-3.5" /> Parent
                                        </label>
                                        <select
                                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
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

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <User className="size-3.5" /> Department Manager
                                    </label>
                                    <select
                                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
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

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex-[1.5] px-4 py-2.5 bg-primary text-[#0a192f] rounded-lg text-sm font-bold hover:brightness-105 active:scale-95 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {(createMutation.isPending || updateMutation.isPending) ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Check className="size-4" />
                                    )}
                                    {editingDept ? 'Update Details' : 'Create Department'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ─────────────────────────────────────────── */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsDeleteConfirmOpen(false)} />
                    <div className="relative bg-white w-full max-w-sm rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-8 text-center space-y-5">
                            <div className="size-16 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center shadow-sm">
                                <Trash2 className="size-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-900">Delete Department?</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Are you sure you want to delete <span className="font-bold text-slate-900">{deletingDept?.name}</span>? This structural change cannot be undone.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 pt-2">
                                <button
                                    onClick={() => deletingDept && deleteMutation.mutate(deletingDept.id)}
                                    disabled={deleteMutation.isPending}
                                    className="w-full py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                    Confirm Removal
                                </button>
                                <button
                                    onClick={() => setIsDeleteConfirmOpen(false)}
                                    className="w-full py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Stats Modal ─────────────────────────────────────────────────── */}
            {isStatsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsStatsOpen(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <BarChart3 className="size-5" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900">{selectedDeptForStats?.name} Dashboard</h2>
                            </div>
                            <button onClick={() => setIsStatsOpen(false)} className="p-2 rounded-lg text-slate-400 hover:bg-white hover:text-slate-600 shadow-sm transition-all">
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {isStatsLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <Loader2 className="size-10 text-primary animate-spin" />
                                    <p className="text-sm font-semibold text-slate-500 tracking-wide">CALCULATING METRICS...</p>
                                </div>
                            ) : stats ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mb-3">Total Enrollments</p>
                                            <p className="text-3xl font-bold tracking-tight text-slate-900">{stats.enrollmentCount}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mb-3">Learning Hours</p>
                                            <div className="flex items-baseline gap-1">
                                                <p className="text-3xl font-bold tracking-tight text-slate-900">{stats.totalHours.toFixed(1)}</p>
                                                <span className="text-sm font-semibold text-slate-400">hrs</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-white to-primary/5 p-6 shadow-sm border-l-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.15em]">Average Course Rating</p>
                                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">Department KPI</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-5xl font-black tracking-tighter text-slate-900">{stats.avgRating?.toFixed(1) || '0.0'}</p>
                                            <div className="space-y-1">
                                                <div className="flex text-amber-400">
                                                    {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-lg">★</span>)}
                                                </div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Out of 5.0 points</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-4">
                                        <div className="rounded-lg bg-white p-2 text-slate-400 shadow-sm border border-slate-100">
                                            <Info className="size-4" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                            Statistical analysis based on members current participation in <span className="font-bold text-slate-700">training cycles</span>.
                                            Data is refreshed in real-time.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100">
                                    <p className="text-sm font-bold text-red-600">Failed to aggregate department metrics.</p>
                                </div>
                            )}

                            <button
                                onClick={() => setIsStatsOpen(false)}
                                className="w-full py-3 bg-[#0a192f] text-white rounded-lg text-sm font-bold hover:brightness-125 transition-all shadow-md"
                            >
                                Dismiss Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

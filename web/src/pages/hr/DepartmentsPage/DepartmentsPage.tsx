import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrDepartmentsApi, hrMembersApi } from '../../../api/hrApi';
import {
  Building2, Users, Plus, Loader2, Edit2, Trash2, ChevronRight,
  Search, X, Check, BarChart3, Info, ChevronDown, User, Hash
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Department {
  id: string;
  name: string;
  code?: string;
  parentDepartmentId?: string;
  parentDepartmentName?: string;
  managerUserId?: string;
  managerName?: string;
  userCount: number;
}

interface Member {
  id: string;
  name: string;
  email: string;
}

export default function DepartmentsPage() {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [selectedDeptForStats, setSelectedDeptForStats] = useState<Department | null>(null);

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
  const members: Member[] = membersData?.data || [];

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['hr', 'departments', selectedDeptForStats?.id, 'stats'],
    queryFn: () => hrDepartmentsApi.stats(selectedDeptForStats!.id),
    enabled: !!selectedDeptForStats,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => hrDepartmentsApi.create(data),
    onSuccess: () => {
      closeModal();
      qc.invalidateQueries({ queryKey: ['hr', 'departments'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => hrDepartmentsApi.update(id, data),
    onSuccess: () => {
      closeModal();
      qc.invalidateQueries({ queryKey: ['hr', 'departments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hrDepartmentsApi.remove(id),
    onSuccess: () => {
      setIsDeleteConfirmOpen(false);
      setDeletingDept(null);
      qc.invalidateQueries({ queryKey: ['hr', 'departments'] });
    },
  });

  // Handlers
  const openModal = (dept: Department | null = null) => {
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

  const handleSubmit = (e: React.FormEvent) => {
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

  const filteredDepts = departments.filter((d: Department) =>
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
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0a192f] tracking-tight">Departments</h1>
          <p className="text-slate-500 mt-2 font-semibold">Manage your organization's heartbeat and team structures.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-[#13ecb6] text-[#0a192f] text-sm font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#13ecb6]/20 border-b-4 border-emerald-600/20"
        >
          <Plus className="size-5" />
          New Department
        </button>
      </div>

      {/* Search & Stats Overview */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-[#13ecb6] transition-colors" />
        <input
          className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:border-[#13ecb6]/50 focus:ring-4 focus:ring-[#13ecb6]/5 outline-none transition-all shadow-sm"
          placeholder="Search by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepts.map((d: Department) => (
          <div key={d.id} className="bg-white rounded-[32px] border-2 border-slate-100 p-6 hover:border-[#13ecb6]/30 hover:shadow-2xl hover:shadow-[#13ecb6]/5 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 group-hover:border-emerald-100 transition-all">
                <Building2 className="size-6" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => openModal(d)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 border border-slate-100 transition-all"
                >
                  <Edit2 className="size-4" />
                </button>
                <button
                  onClick={() => { setDeletingDept(d); setIsDeleteConfirmOpen(true); }}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-100 transition-all"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-[#0a192f] truncate">{d.name}</h3>
                {d.code && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{d.code}</span>}
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                {d.parentDepartmentName ? (
                  <>
                    <ChevronRight className="size-3" /> {d.parentDepartmentName}
                  </>
                ) : 'Top Level'}
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                    <User className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manager</p>
                    <p className="text-sm font-bold text-slate-700">{d.managerName || 'Not Assigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-wider">
                  <Users className="size-3.5" />
                  <span>{d.userCount}</span>
                </div>
              </div>

              <button
                onClick={() => { setSelectedDeptForStats(d); setIsStatsOpen(true); }}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-500 hover:border-[#13ecb6]/30 hover:text-[#0a192f] hover:bg-slate-50 transition-all"
              >
                <BarChart3 className="size-4" />
                Learning Statistics
              </button>
            </div>
          </div>
        ))}
        {!filteredDepts.length && !isDeptsLoading && (
          <div className="col-span-full bg-white border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="size-20 rounded-[30px] bg-slate-50 flex items-center justify-center text-slate-200">
              <Building2 className="size-10" />
            </div>
            <div>
              <p className="text-xl font-black text-[#0a192f]">No departments found</p>
              <p className="text-slate-400 font-bold mt-1">Try a different search or create a new one.</p>
            </div>
            <button onClick={() => openModal()} className="mt-4 px-8 py-3 bg-[#0a192f] text-white text-sm font-black rounded-2xl hover:scale-105 active:scale-95 transition-all">
              Create First Department
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a192f]/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl animate-scaleIn overflow-hidden border-t-8 border-[#13ecb6]">
            <div className="p-8 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-[#0a192f]">{editingDept ? 'Edit Department' : 'New Department'}</h2>
                  <p className="text-slate-400 font-bold text-sm mt-1">Configure your organizational structure.</p>
                </div>
                <button onClick={closeModal} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="size-3.5" /> Department Name
                    </label>
                    <input
                      required
                      className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:border-[#13ecb6]/50 focus:bg-white outline-none transition-all"
                      placeholder="e.g. Engineering"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Hash className="size-3.5" /> Code (Optional)
                    </label>
                    <input
                      className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:border-[#13ecb6]/50 focus:bg-white outline-none transition-all"
                      placeholder="ENG-01"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <ChevronDown className="size-3.5" /> Parent
                    </label>
                    <select
                      className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:border-[#13ecb6]/50 focus:bg-white outline-none transition-all appearance-none"
                      value={formData.parentDepartmentId}
                      onChange={e => setFormData({ ...formData, parentDepartmentId: e.target.value })}
                    >
                      <option value="">None (Top Level)</option>
                      {departments.filter((d: any) => d.id !== editingDept?.id).map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <User className="size-3.5" /> Manager
                    </label>
                    <select
                      className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:border-[#13ecb6]/50 focus:bg-white outline-none transition-all appearance-none"
                      value={formData.managerUserId}
                      onChange={e => setFormData({ ...formData, managerUserId: e.target.value })}
                    >
                      <option value="">Select a manager</option>
                      {members.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 h-16 rounded-3xl text-sm font-black text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-[1.5] h-16 rounded-3xl text-sm font-black text-[#0a192f] bg-[#13ecb6] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#13ecb6]/20 flex items-center justify-center gap-2"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Check className="size-5" />
                    )}
                    {editingDept ? 'Update Department' : 'Create Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a192f]/40 backdrop-blur-sm" onClick={() => setIsDeleteConfirmOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl animate-scaleIn p-10 text-center space-y-6">
            <div className="size-20 rounded-[30px] bg-red-50 text-red-500 mx-auto flex items-center justify-center">
              <Trash2 className="size-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#0a192f]">Delete Department?</h3>
              <p className="text-slate-500 font-bold mt-2">
                This action cannot be undone. Are you sure you want to delete <span className="text-[#0a192f]">{deletingDept?.name}</span>?
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => deletingDept && deleteMutation.mutate(deletingDept.id)}
                disabled={deleteMutation.isPending}
                className="w-full py-4 bg-red-500 text-white text-sm font-black rounded-2xl hover:bg-red-600 transition-all flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-4" />}
                Confirm Delete
              </button>
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="w-full py-4 bg-slate-50 text-slate-500 text-sm font-black rounded-2xl hover:bg-slate-100 transition-all"
              >
                Keep Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {isStatsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a192f]/40 backdrop-blur-sm" onClick={() => setIsStatsOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl animate-scaleIn overflow-hidden">
            <div className="p-8 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-[#0a192f]">{selectedDeptForStats?.name} Stats</h2>
                  <p className="text-slate-400 font-bold text-sm mt-1">Learning performance overview.</p>
                </div>
                <button onClick={() => setIsStatsOpen(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="size-5" />
                </button>
              </div>

              {isStatsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="size-10 text-[#13ecb6] animate-spin" />
                  <p className="text-slate-400 font-bold">Calculating statistics...</p>
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-6 rounded-[32px] space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enrollments</p>
                    <p className="text-3xl font-black text-[#0a192f]">{stats.enrollmentCount}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[32px] space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Hours</p>
                    <p className="text-3xl font-black text-[#0a192f]">{stats.totalHours.toFixed(1)}h</p>
                  </div>
                  <div className="col-span-2 bg-[#13ecb6]/5 p-6 rounded-[32px] border-2 border-[#13ecb6]/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Average Rating</p>
                      <p className="text-3xl font-black text-[#0a192f]">{stats.avgRating?.toFixed(1) || '0.0'}<span className="text-sm font-bold text-slate-400 ml-1">/ 5.0</span></p>
                    </div>
                    <div className="size-14 rounded-2xl bg-white flex items-center justify-center text-amber-400 shadow-sm">
                      <BarChart3 className="size-8 fill-current" />
                    </div>
                  </div>
                  <div className="col-span-2 bg-[#0a192f] p-6 rounded-[32px] flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-[#13ecb6]">
                      <Info className="size-5" />
                    </div>
                    <p className="text-white/60 text-xs font-bold leading-relaxed">
                      These statistics are calculated based on all employees currently assigned to this department and their participation in training events.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400 font-bold">Failed to load statistics.</p>
                </div>
              )}

              <button
                onClick={() => setIsStatsOpen(false)}
                className="w-full h-16 rounded-3xl text-sm font-black text-[#0a192f] bg-[#13ecb6] hover:scale-[1.02] transition-all"
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

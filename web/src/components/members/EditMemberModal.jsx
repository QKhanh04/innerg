import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Check, Building2, Plus, ChevronDown } from 'lucide-react';
import { useMemberActions } from '../../hooks/useMemberActions';
import { hrDepartmentsApi } from '../../api/hrApi';
import { cn } from '../../lib/utils';

export default function EditMemberModal({ member, onClose }) {
    const queryClient = useQueryClient();
    const { update, isUpdating } = useMemberActions();
    const [formData, setFormData] = useState({
        position: member.position || '',
    });
    const [departmentId, setDepartmentId] = useState(member.department?.id ?? '');
    const [deptQuery, setDeptQuery] = useState(member.department?.name ?? '');
    const [showDeptDropdown, setShowDeptDropdown] = useState(false);

    const { data: departments = [] } = useQuery({
        queryKey: ['hr', 'departments'],
        queryFn: hrDepartmentsApi.list,
    });

    const createDeptMutation = useMutation({
        mutationFn: (name) => hrDepartmentsApi.create({ name: name.trim() }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr', 'departments'] }),
    });

    const filteredDepartments = useMemo(() => {
        const q = deptQuery.trim().toLowerCase();
        if (!q) return departments;
        return departments.filter((d) => d.name.toLowerCase().includes(q));
    }, [departments, deptQuery]);

    const exactMatch = useMemo(() => {
        const q = deptQuery.trim().toLowerCase();
        if (!q) return null;
        return departments.find((d) => d.name.toLowerCase() === q) ?? null;
    }, [departments, deptQuery]);

    const showCreateOption = deptQuery.trim() && !exactMatch;

    const selectDepartment = (dept) => {
        if (!dept) {
            setDepartmentId('');
            setDeptQuery('');
        } else {
            setDepartmentId(dept.id);
            setDeptQuery(dept.name);
        }
        setShowDeptDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let resolvedDepartmentId = departmentId || null;
        const trimmedName = deptQuery.trim();

        if (trimmedName) {
            const existing = departments.find((d) => d.name.toLowerCase() === trimmedName.toLowerCase());
            if (existing) {
                resolvedDepartmentId = existing.id;
            } else {
                try {
                    const created = await createDeptMutation.mutateAsync(trimmedName);
                    resolvedDepartmentId = created.id;
                } catch {
                    return;
                }
            }
        } else {
            resolvedDepartmentId = null;
        }

        const payload = {
            position: formData.position,
            ...(resolvedDepartmentId
                ? { departmentId: resolvedDepartmentId }
                : { removeDepartment: true }),
        };

        update({ userId: member.id, data: payload }, {
            onSuccess: () => onClose(),
        });
    };

    const isSaving = isUpdating || createDeptMutation.isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-slideIn">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Edit Information</h3>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Employee</label>
                        <div className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700">
                            {member.name} - {member.email}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Name and email cannot be changed on this screen.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Department</label>
                        <div className="relative">
                            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={deptQuery}
                                onChange={(e) => {
                                    setDeptQuery(e.target.value);
                                    setDepartmentId('');
                                    setShowDeptDropdown(true);
                                }}
                                onFocus={() => setShowDeptDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDeptDropdown(false), 150)}
                                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#13ecb6] focus:ring-1 focus:ring-[#13ecb6] transition-all"
                                placeholder="Chọn hoặc nhập tên phòng ban mới..."
                                autoComplete="off"
                            />
                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

                            {showDeptDropdown && (
                                <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
                                    <button
                                        type="button"
                                        onMouseDown={() => selectDepartment(null)}
                                        className="w-full px-4 py-2.5 text-left text-sm text-slate-500 hover:bg-slate-50 border-b border-slate-100"
                                    >
                                        — Không có phòng ban —
                                    </button>
                                    {filteredDepartments.map((dept) => (
                                        <button
                                            key={dept.id}
                                            type="button"
                                            onMouseDown={() => selectDepartment(dept)}
                                            className={cn(
                                                'w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors',
                                                departmentId === dept.id ? 'text-[#0a192f] font-semibold bg-[#13ecb6]/10' : 'text-slate-700'
                                            )}
                                        >
                                            {dept.name}
                                            {dept.code && <span className="text-slate-400 ml-2 text-xs">({dept.code})</span>}
                                        </button>
                                    ))}
                                    {showCreateOption && (
                                        <button
                                            type="button"
                                            onMouseDown={() => {
                                                setDepartmentId('');
                                                setShowDeptDropdown(false);
                                            }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-[#0a192f] font-semibold hover:bg-[#13ecb6]/10 flex items-center gap-2 border-t border-slate-100"
                                        >
                                            <Plus className="w-4 h-4 text-[#13ecb6]" />
                                            Tạo phòng ban mới: &quot;{deptQuery.trim()}&quot;
                                        </button>
                                    )}
                                    {!filteredDepartments.length && !showCreateOption && deptQuery.trim() && (
                                        <p className="px-4 py-3 text-xs text-slate-400">Không tìm thấy phòng ban phù hợp</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Chọn từ danh sách hoặc nhập tên mới để tạo phòng ban.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Position</label>
                        <input
                            type="text"
                            value={formData.position}
                            onChange={e => setFormData({ ...formData, position: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#13ecb6] focus:ring-1 focus:ring-[#13ecb6] transition-all"
                            placeholder="e.g., Senior Developer"
                        />
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2 bg-[#13ecb6] text-[#0a192f] rounded-xl text-sm font-bold shadow-md shadow-[#13ecb6]/20 hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSaving ? 'Saving...' : <><Check className="w-4 h-4" /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

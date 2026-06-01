import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useInvitationActions } from '../../../hooks/hr/useInvitationActions';

interface Props {
    onClose: () => void;
}

const ROLES = ['Mentee', 'Mentor', 'HR'];

export default function SingleInviteModal({ onClose }: Props) {
    const { createMutation } = useInvitationActions();

    const [email, setEmail] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>(['Mentee']);
    const [fullName, setFullName] = useState('');
    const [position, setPosition] = useState('');
    const [department, setDepartment] = useState('');

    const toggleRole = (role: string) => {
        setSelectedRoles((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || selectedRoles.length === 0) return;

        await createMutation.mutateAsync({
            email: email.trim(),
            roles: selectedRoles,
            fullName: fullName.trim() || undefined,
            position: position.trim() || undefined,
            departmentName: department.trim() || undefined,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-extrabold text-[#0a192f]">Invite employee</h2>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="employee@company.com"
                            className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#13ecb6]/30 focus:border-[#13ecb6] focus:bg-white transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Role <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {ROLES.map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => toggleRole(role)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${selectedRoles.includes(role)
                                        ? 'bg-[#13ecb6] text-[#0a192f] border-[#13ecb6] shadow-sm shadow-[#13ecb6]/30'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                        {selectedRoles.length === 0 && (
                            <p className="text-xs font-semibold text-red-500 mt-2">Please select at least 1 role.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full name <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Nguyễn Văn A"
                            className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#13ecb6]/30 focus:border-[#13ecb6] focus:bg-white transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Position <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input
                            type="text"
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            placeholder="Frontend Developer"
                            className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#13ecb6]/30 focus:border-[#13ecb6] focus:bg-white transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input
                            type="text"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="IT, Marketing..."
                            className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#13ecb6]/30 focus:border-[#13ecb6] focus:bg-white transition-all"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || !email || selectedRoles.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#13ecb6] text-[#0a192f] font-bold rounded-xl shadow-sm shadow-[#13ecb6]/20 hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {createMutation.isPending ? (
                                <div className="w-5 h-5 border-2 border-[#0a192f]/30 border-t-[#0a192f] rounded-full animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Send invitation
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

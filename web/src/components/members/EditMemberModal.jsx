import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useMemberActions } from '../../hooks/useMemberActions';

export default function EditMemberModal({ member, onClose }) {
    const { update, isUpdating } = useMemberActions();
    const [formData, setFormData] = useState({
        position: member.position || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        update({ userId: member.id, data: formData }, {
            onSuccess: () => {
                onClose();
            }
        });
    };

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
                            disabled={isUpdating}
                            className="px-6 py-2 bg-[#13ecb6] text-[#0a192f] rounded-xl text-sm font-bold shadow-md shadow-[#13ecb6]/20 hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isUpdating ? 'Saving...' : <><Check className="w-4 h-4" /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

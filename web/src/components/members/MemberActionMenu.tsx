import React, { useState } from 'react';
import { MoreHorizontal, User, Edit2, Shield, Trash2, Power, PowerOff } from 'lucide-react';
import { useMemberActions } from '../../hooks/useMemberActions';
import { cn } from '../../lib/utils';
import EditMemberModal from './EditMemberModal';
import MemberDetailDrawer from './MemberDetailDrawer';

export default function MemberActionMenu({ member }: { member: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const { assignMentor, revokeMentor, updateStatus, deleteMember } = useMemberActions();

    const isMentor = member.roles.includes('MENTOR');

    const handleAssignMentor = () => {
        if (isMentor) {
            if (window.confirm("Revoke Mentor role. Are you sure? If there are upcoming classes, the system will block this action.")) {
                revokeMentor(member.id);
            }
        } else {
            assignMentor(member.id);
        }
        setIsOpen(false);
    };

    const handleToggleStatus = () => {
        const isActivating = member.status !== 'ACTIVE';
        const msg = isActivating
            ? "Activate this account?"
            : "The user will not be able to log in. Data remains intact. Confirm deactivation?";

        if (window.confirm(msg)) {
            updateStatus({ userId: member.id, status: isActivating ? 'ACTIVE' : 'INACTIVE' });
        }
        setIsOpen(false);
    };

    const handleDelete = () => {
        if (window.confirm("Account will be hidden. Learning history is preserved. Confirm delete?")) {
            deleteMember(member.id);
        }
        setIsOpen(false);
    };

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                >
                    <MoreHorizontal className="w-5 h-5" />
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-50 overflow-hidden py-1">

                            <button
                                onClick={() => { setIsOpen(false); setShowDetail(true); }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <User className="w-4 h-4 text-slate-400" /> View Profile
                            </button>

                            <button
                                onClick={() => { setIsOpen(false); setShowEdit(true); }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <Edit2 className="w-4 h-4 text-slate-400" /> Edit
                            </button>

                            <div className="h-px bg-slate-100 my-1 mx-2" />

                            <button
                                onClick={handleAssignMentor}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <Shield className={cn("w-4 h-4", isMentor ? "text-amber-500" : "text-emerald-500")} />
                                {isMentor ? "Revoke Mentor" : "Assign Mentor"}
                            </button>

                            <button
                                onClick={handleToggleStatus}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                {member.status === 'ACTIVE' ? (
                                    <><PowerOff className="w-4 h-4 text-orange-500" /> Deactivate</>
                                ) : (
                                    <><Power className="w-4 h-4 text-emerald-500" /> Activate</>
                                )}
                            </button>

                            <div className="h-px bg-slate-100 my-1 mx-2" />

                            <button
                                onClick={handleDelete}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Account
                            </button>
                        </div>
                    </>
                )}
            </div>

            {showEdit && (
                <EditMemberModal
                    member={member}
                    onClose={() => setShowEdit(false)}
                />
            )}

            {showDetail && (
                <MemberDetailDrawer
                    userId={member.id}
                    onClose={() => setShowDetail(false)}
                />
            )}
        </>
    );
}

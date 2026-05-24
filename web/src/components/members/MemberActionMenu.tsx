import React, { useState } from 'react';
import { MoreHorizontal, User, Edit2, Shield, Trash2, Power, PowerOff } from 'lucide-react';
import { useMemberActions } from '../../hooks/useMemberActions';
import { cn } from '../../lib/utils';
import EditMemberModal from './EditMemberModal';
import MemberDetailDrawer from './MemberDetailDrawer';

export default function MemberActionMenu({ member }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const { assignMentor, revokeMentor, updateStatus, deleteMember } = useMemberActions();

    const isMentor = member.roles.includes('MENTOR');

    const handleAssignMentor = () => {
        if (isMentor) {
            if (window.confirm("Thu hồi role Mentor. Bạn có chắc chắn? Nếu còn lớp học sắp diễn ra, hệ thống sẽ chặn hành động này.")) {
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
            ? "Kích hoạt tài khoản này?"
            : "Người dùng sẽ không thể đăng nhập. Dữ liệu giữ nguyên. Xác nhận vô hiệu hóa?";

        if (window.confirm(msg)) {
            updateStatus({ userId: member.id, status: isActivating ? 'ACTIVE' : 'INACTIVE' });
        }
        setIsOpen(false);
    };

    const handleDelete = () => {
        if (window.confirm("Tài khoản sẽ bị ẩn. Lịch sử học tập vẫn được lưu. Xác nhận xóa?")) {
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
                                <User className="w-4 h-4 text-slate-400" /> Xem hồ sơ
                            </button>

                            <button
                                onClick={() => { setIsOpen(false); setShowEdit(true); }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <Edit2 className="w-4 h-4 text-slate-400" /> Chỉnh sửa
                            </button>

                            <div className="h-px bg-slate-100 my-1 mx-2" />

                            <button
                                onClick={handleAssignMentor}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <Shield className={cn("w-4 h-4", isMentor ? "text-amber-500" : "text-emerald-500")} />
                                {isMentor ? "Thu hồi Mentor" : "Gán Mentor"}
                            </button>

                            <button
                                onClick={handleToggleStatus}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                {member.status === 'ACTIVE' ? (
                                    <><PowerOff className="w-4 h-4 text-orange-500" /> Vô hiệu hóa</>
                                ) : (
                                    <><Power className="w-4 h-4 text-emerald-500" /> Kích hoạt</>
                                )}
                            </button>

                            <div className="h-px bg-slate-100 my-1 mx-2" />

                            <button
                                onClick={handleDelete}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Xóa tài khoản
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

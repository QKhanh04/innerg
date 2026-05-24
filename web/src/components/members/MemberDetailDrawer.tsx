import React, { useState } from 'react';
import { X, Award, BookOpen, Star, Loader2, Target, Calendar } from 'lucide-react';
import { useMemberDetail } from '../../hooks/useMemberDetail';
import { cn } from '../../lib/utils';

export default function MemberDetailDrawer({ userId, onClose }) {
    const { data: member, isLoading, error } = useMemberDetail(userId);
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md md:max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slideIn border-l border-slate-200">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {member?.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member?.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xl font-bold text-slate-500">{member?.name?.charAt(0) || '?'}</span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">{member?.name || 'Đang tải...'}</h2>
                            <p className="text-sm text-slate-500 font-medium">{member?.email}</p>

                            {member && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                                        member.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                                    )}>
                                        {member.status}
                                    </span>
                                    {member.roles?.map(role => (
                                        <span key={role} className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 border border-blue-100 text-blue-600">
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                {member && (
                    <div className="px-6 pt-4 border-b border-slate-100 flex gap-6">
                        {[
                            { id: 'overview', label: 'Tổng quan' },
                            { id: 'history', label: 'Lịch sử học tập' },
                            { id: 'skills', label: 'Kỹ năng' },
                            ...(member.roles?.includes('MENTOR') ? [{ id: 'mentor', label: 'Mentor Profile' }] : [])
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "pb-3 text-sm font-bold transition-all relative",
                                    activeTab === tab.id ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#13ecb6] rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#f6f8f8]">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center p-10 h-full text-slate-400 gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-[#13ecb6]" />
                            <p className="text-sm font-semibold">Đang tải dữ liệu hồ sơ...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                            Lỗi tải dữ liệu. Bạn có thể không có quyền xem thông tin này.
                        </div>
                    )}

                    {member && activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Phòng ban</p>
                                    <p className="text-sm font-semibold text-slate-800">{member.department?.name || 'Chưa thiết lập'}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Chức vụ</p>
                                    <p className="text-sm font-semibold text-slate-800">{member.position || 'Chưa thiết lập'}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Tổng điểm InnerG</p>
                                    <p className="text-sm font-semibold text-[#13ecb6] flex items-center gap-1.5">
                                        <Star className="w-4 h-4 fill-current" /> {member.learningPoints}
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Ngày tham gia</p>
                                    <p className="text-sm font-semibold text-slate-800">{new Date(member.joinedAt).toLocaleDateString('vi-VN')}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-emerald-500" /> Huy hiệu đạt được
                                </h3>
                                {member.badges?.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {member.badges.map((badge, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm">
                                                <span className="text-sm font-semibold text-slate-700">{badge.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 bg-white p-4 border border-slate-200 rounded-xl text-center">
                                        Người dùng này chưa đạt được huy hiệu nào.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {member && activeTab === 'history' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-bold text-slate-800">Tổng giờ học:</span>
                                <span className="text-emerald-600 font-extrabold">{member.totalLearningHours}h</span>
                            </div>

                            {member.learningHistory?.length > 0 ? (
                                member.learningHistory.map((h, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <h4 className="text-sm font-bold text-slate-800">{h.classTitle}</h4>
                                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(h.scheduledAt).toLocaleDateString('vi-VN')}</span>
                                            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Mentor: {h.mentorName}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white p-8 rounded-xl text-center border border-slate-200">
                                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500 font-medium">Chưa có lịch sử học tập.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {member && activeTab === 'skills' && (
                        <div className="grid gap-3">
                            {member.skills?.length > 0 ? (
                                member.skills.map((skill, idx) => (
                                    <div key={idx} className="bg-white px-4 py-3 border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                        <span className="text-sm font-semibold text-slate-700">{skill.skillName}</span>
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider",
                                            skill.level === 'EXPERT' ? "bg-purple-100 text-purple-700" :
                                                skill.level === 'INTERMEDIATE' ? "bg-blue-100 text-blue-700" :
                                                    "bg-slate-100 text-slate-600"
                                        )}>{skill.level}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white p-8 rounded-xl text-center border border-slate-200">
                                    <Target className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500 font-medium">Chưa có kỹ năng nào được ghi nhận.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {member && activeTab === 'mentor' && member.trainerProfile && (
                        <div className="space-y-4">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-6">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Đánh giá TB</p>
                                    <p className="text-xl font-extrabold text-slate-800 flex items-center gap-1">
                                        {member.trainerProfile.avgRating} <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    </p>
                                </div>
                                <div className="w-px h-10 bg-slate-100" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Lớp đã dạy</p>
                                    <p className="text-xl font-extrabold text-slate-800">{member.trainerProfile.totalClassesTaught}</p>
                                </div>
                                <div className="w-px h-10 bg-slate-100" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Học viên</p>
                                    <p className="text-xl font-extrabold text-[#13ecb6]">{member.trainerProfile.totalStudents}</p>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Trạng thái Mentor</p>
                                <span className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold",
                                    member.trainerProfile.mentorStatus === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" :
                                        member.trainerProfile.mentorStatus === 'PENDING_VERIFICATION' ? "bg-amber-100 text-amber-700" :
                                            "bg-slate-100 text-slate-600"
                                )}>
                                    {member.trainerProfile.mentorStatus}
                                </span>

                                <div className="mt-5">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Giới thiệu (Bio)</p>
                                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[4rem]">
                                        {member.trainerProfile.bio || 'Chưa cập nhật giới thiệu.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

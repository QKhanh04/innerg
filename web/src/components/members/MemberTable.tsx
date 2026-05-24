import React from 'react';
import { cn } from '../../lib/utils';
import MemberActionMenu from './MemberActionMenu';
import { Star } from 'lucide-react';

export default function MemberTable({ members }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest min-w-[250px]">Nhân viên</th>
                            <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest min-w-[150px]">Phòng ban & Chức vụ</th>
                            <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center min-w-[150px]">Roles</th>
                            <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest min-w-[120px]">Trạng thái</th>
                            <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest min-w-[100px]">Tham gia</th>
                            <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {members?.map(member => (
                            <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            {member.avatarUrl ? (
                                                <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-bold text-slate-400">{member.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{member.name}</p>
                                            <p className="text-xs font-medium text-slate-500">{member.email}</p>
                                            <p className="text-[10px] font-bold text-[#13ecb6] flex items-center gap-1 mt-0.5">
                                                <Star className="w-3 h-3 fill-current" /> {member.learningPoints}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-semibold text-slate-700">{member.department?.name || '---'}</p>
                                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">{member.position || '---'}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                                        {member.roles?.map(role => (
                                            <span key={role} className={cn(
                                                "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border",
                                                role === 'MENTOR' ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                    role === 'HR' ? "bg-purple-50 text-purple-600 border-purple-200" :
                                                        "bg-blue-50 text-blue-600 border-blue-200"
                                            )}>
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider w-fit border",
                                        member.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            member.status === 'DELETED' ? "bg-red-50 text-red-600 border-red-100" :
                                                "bg-slate-100 text-slate-500 border-slate-200"
                                    )}>
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            member.status === 'ACTIVE' ? "bg-emerald-500" : "bg-slate-400"
                                        )} />
                                        {member.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-semibold text-slate-500">
                                        {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <MemberActionMenu member={member} />
                                </td>
                            </tr>
                        ))}

                        {(!members || members.length === 0) && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-sm font-medium text-slate-500">
                                    Không tìm thấy nhân viên nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

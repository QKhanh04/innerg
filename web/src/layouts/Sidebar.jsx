import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Search,
    Calendar,
    FolderOpen,
    Heart,
    User,
    Users,
    Settings,
    Zap,
    BarChart3,
    BookOpen,
    ShieldCheck,
    Bell,
    Building2,
    CreditCard,
    FileClock,
    Shield,
    Cog,
    Library,
    ChevronsUpDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useRole } from '../lib/RoleContext';

const navItems = [
    { icon: LayoutDashboard, label: 'Home Feed', path: '/dashboard', roles: ['mentee'] },
    { icon: BarChart3, label: 'Analytics', path: '/analytics', roles: ['hr'] },
    { icon: Users, label: 'Members', path: '/members', roles: ['hr'] },
    { icon: User, label: 'Invitations', path: '/invitations', roles: ['hr'] },
    { icon: Heart, label: 'HR Wishlists', path: '/hr/wishlists', roles: ['hr'] },
    { icon: FolderOpen, label: 'Moderation', path: '/hr/moderation', roles: ['hr'] },
    { icon: Users, label: 'Departments', path: '/hr/departments', roles: ['hr'] },
    { icon: Bell, label: 'Notifications', path: '/hr/notifications', roles: ['hr'] },
    { icon: LayoutDashboard, label: 'Mentor Dashboard', path: '/mentor', roles: ['mentor'] },
    { icon: BookOpen, label: 'Create Class', path: '/mentor/create', roles: ['mentor'] },
    { icon: Search, label: 'Explore', path: '/explore', roles: ['mentee', 'mentor'] },
    { icon: Calendar, label: 'My Schedule', path: '/schedule', roles: ['mentee', 'mentor'] },
    { icon: Library, label: 'My Classes', path: '/my-classes', roles: ['mentee', 'mentor'] },
    { icon: Heart, label: 'Wishlist', path: '/wishlist', roles: ['mentee', 'mentor'] },
    { icon: FolderOpen, label: 'Resource Hub', path: '/resources', roles: ['mentee', 'mentor', 'hr', 'admin'] },
    { icon: User, label: 'Profile', path: '/profile', roles: ['mentee', 'mentor', 'hr', 'admin'] },
];

const adminModuleItems = [
    { icon: ShieldCheck, label: 'Overview', path: '/admin' },
    { icon: Building2, label: 'Companies', path: '/admin/companies' },
    { icon: CreditCard, label: 'Subscriptions', path: '/admin/subscriptions' },
    { icon: FileClock, label: 'Audit', path: '/admin/audit' },
    { icon: Shield, label: 'Moderation', path: '/admin/moderation' },
    { icon: Cog, label: 'Platform', path: '/admin/platform' },
];

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { role, setRole, user } = useRole();

    const visibleNavItems = navItems.filter((item) => item.roles.includes(role));
    const adminUtilityItems = visibleNavItems.filter((item) => item.path === '/resources' || item.path === '/profile');

    const isNavActive = (path) => {
        // Chỉ bôi đen Dashboard nếu đúng là trang gốc (tránh lỗi Highlight cả 2 menu)
        if (path === '/admin' || path === '/mentor') {
            return location.pathname === path;
        }
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
            {/* Logo Section */}
            <div className="p-6 flex items-center gap-3">
                <div className="size-10 bg-gradient-to-br from-[#00C896] to-emerald-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#00C896]/30 border border-white/20">
                    <Zap className="size-5.5 fill-current" />
                </div>
                <div>
                    <h1 className="text-slate-900 font-black text-xl tracking-tight leading-none">InnerG</h1>
                    <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase mt-1">Workspace</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-hide">
                {role === 'admin' ? (
                    <>
                        <div className="px-3 pb-3 pt-2">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Admin Modules</p>
                        </div>
                        {adminModuleItems.map((item) => {
                            const isActive = isNavActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 font-bold"
                                            : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-bold"
                                    )}
                                >
                                    <item.icon className={cn("size-4.5 transition-transform group-hover:scale-110", isActive && "text-indigo-400")} />
                                    <span className="text-[13px]">{item.label}</span>
                                </Link>
                            );
                        })}

                        {adminUtilityItems.length > 0 ? (
                            <>
                                <div className="mx-3 my-4 border-t border-slate-100" />
                                <div className="px-3 pb-3">
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">General</p>
                                </div>
                                {adminUtilityItems.map((item) => {
                                    const isActive = isNavActive(item.path);
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                                isActive
                                                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 font-bold"
                                                    : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-bold"
                                            )}
                                        >
                                            <item.icon className={cn("size-4.5 transition-transform group-hover:scale-110", isActive && "text-emerald-400")} />
                                            <span className="text-[13px]">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </>
                        ) : null}
                    </>
                ) : null}

                {role !== 'admin' ? (
                    <>
                        <div className="px-3 pb-3 pt-2">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Main Menu</p>
                        </div>
                        {visibleNavItems.map((item) => {
                            const isActive = isNavActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 font-bold"
                                            : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-bold"
                                    )}
                                >
                                    <item.icon className={cn("size-4.5 transition-transform group-hover:scale-110", isActive ? "text-emerald-400" : "text-slate-400")} />
                                    <span className="text-[13px]">{item.label}</span>
                                </Link>
                            );
                        })}
                    </>
                ) : null}
            </nav>

            {/* Bottom Footer / User Profile */}
            <div className="p-4 border-t border-slate-100/80 bg-white">
                <Link
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-slate-900 font-bold hover:bg-slate-100/80 rounded-xl transition-all"
                >
                    <Settings className="size-4.5" />
                    <span className="text-[13px]">Settings</span>
                </Link>
                
                <div className="mt-2 p-1 border border-slate-200 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all bg-slate-50/50 cursor-pointer group">
                    <div className="flex items-center gap-3 p-2">
                        <div className="relative shrink-0">
                            <img
                                src={user.avatar || "https://ui-avatars.com/api/?name=User"}
                                alt={user.name}
                                className="size-9 rounded-full object-cover shadow-sm ring-2 ring-white"
                                referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-extrabold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">{user.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{user.position}</p>
                        </div>
                        <ChevronsUpDown className="size-4 text-slate-400 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>
        </aside>
    );
}

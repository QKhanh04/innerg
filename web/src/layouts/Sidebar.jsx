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
    Bell
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useRole } from '../lib/RoleContext';

const navItems = [
    { icon: ShieldCheck, label: 'Admin Dashboard', path: '/admin', roles: ['admin'] },
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
    { icon: Search, label: 'Explore / Marketplace', path: '/explore', roles: ['mentee', 'mentor'] },
    { icon: Calendar, label: 'My Schedule', path: '/schedule', roles: ['mentee', 'mentor'] },
    { icon: Heart, label: 'Learning Wishlist', path: '/wishlist', roles: ['mentee', 'mentor'] },
    { icon: FolderOpen, label: 'Resource Hub', path: '/resources', roles: ['mentee', 'mentor', 'hr', 'admin'] },
    { icon: User, label: 'Profile', path: '/profile', roles: ['mentee', 'mentor', 'hr', 'admin'] },
];

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { role, setRole, user } = useRole();

    const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

    const handleRoleChange = (newRole) => {
        setRole(newRole);

        // Redirect to landing page for the role
        switch (newRole) {
            case 'mentor':
                navigate('/mentor');
                break;
            case 'hr':
                navigate('/analytics');
                break;
            case 'mentee':
                navigate('/dashboard');
                break;
            case 'admin':
                navigate('/admin');
                break;
            default:
                navigate('/resources');
                break;
        }
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0">
            <div className="p-6 flex items-center gap-3">
                <div className="size-10 bg-[#00C896] rounded-xl flex items-center justify-center text-[#0F1F3D] shadow-md border border-[#00C896]/20">
                    <Zap className="size-6 fill-current" />
                </div>
                <div>
                    <h1 className="text-slate-900 font-bold text-lg leading-none">InnerG</h1>
                    <p className="text-slate-500 text-xs mt-1">Growth Platform</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {visibleNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                                isActive
                                    ? "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-l-none -ml-4 pl-7"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon className={cn("size-5", isActive && "fill-primary/20")} />
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100 space-y-3">
                <Link
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                    <Settings className="size-5" />
                    <span className="text-sm font-medium">Settings</span>
                </Link>
                <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="size-10 rounded-full object-cover border-2 border-primary/20"
                        referrerPolicy="no-referrer"
                    />
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{user.position}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

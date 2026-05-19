import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Calendar,
  FolderOpen,
  Heart,
  User,
  Settings,
  Zap,
  BarChart3,
  BookOpen,
  GraduationCap,
  Award
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useRole, Role } from '../lib/RoleContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Home Feed', path: '/dashboard', roles: ['mentee'] },
  { icon: BarChart3, label: 'Analytics', path: '/analytics', roles: ['hr'] },
  { icon: LayoutDashboard, label: 'Mentor Dashboard', path: '/mentor', roles: ['mentor'] },
  { icon: BookOpen, label: 'Create Class', path: '/mentor/create', roles: ['mentor', 'hr'] },
  { icon: Search, label: 'Explore / Marketplace', path: '/explore', roles: ['mentee', 'mentor', 'hr'] },
  { icon: Calendar, label: 'My Schedule', path: '/schedule', roles: ['mentee', 'mentor'] },
  { icon: Heart, label: 'Learning Wishlist', path: '/wishlist', roles: ['mentee', 'hr'] },
  { icon: FolderOpen, label: 'Resource Hub', path: '/resources', roles: ['mentee', 'mentor', 'hr', 'admin'] },
  { icon: User, label: 'Profile', path: '/profile', roles: ['mentee', 'mentor', 'hr', 'admin'] },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setRole, user } = useRole();

  // Filter items based on user's current role or "admin" who sees everything
  const visibleNavItems = navItems.filter(item =>
    role === 'admin' || item.roles.includes(role)
  );

  const handleRoleChange = (newRole: Role) => {
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
      case 'admin':
      default:
        navigate('/dashboard');
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
        <div className="px-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
            Dev Mode: Switch Role
          </label>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as Role)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2"
          >
            <option value="mentee">Mentee (Learner)</option>
            <option value="mentor">Mentor (Teacher)</option>
            <option value="hr">HR/Admin (Manager)</option>
            <option value="admin">Super Admin</option>
          </select>
        </div>

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

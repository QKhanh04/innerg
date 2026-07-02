import React, { useState } from 'react';
import { Search, MessageSquare, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useRole } from '../lib/RoleContext';
import { useAuth } from '../hooks/useAuth';
import NotificationDropdown from '../components/notifications/NotificationDropdown';

export function Header({ title }) {
    const navigate = useNavigate();
    const { user: roleUser } = useRole();
    const { user: authUser, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const displayName = authUser?.fullName || authUser?.email || roleUser.name;
    const displaySubtitle = authUser?.email || roleUser.position;

    const handleLogout = async () => {
        if (isLoggingOut) {
            return;
        }

        setIsLoggingOut(true);

        try {
            await logout();
            navigate('/login', { replace: true });
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-20 px-8 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0 max-w-md">
                {title ? (
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                ) : (
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search skills, mentors, or resources..."
                            className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <NotificationDropdown />
                <button className="flex items-center justify-center size-10 shrink-0 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                    <MessageSquare className="size-5" />
                </button>
                <div className="h-8 w-px bg-slate-200 mx-2"></div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors',
                            isLoggingOut
                                ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                                : 'hover:bg-slate-100 hover:text-slate-900'
                        )}
                    >
                        <LogOut className="size-4" />
                        <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                    </button>
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold leading-none">{displayName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">{displaySubtitle}</p>
                    </div>
                    <div className="size-10 rounded-full border-2 border-primary/20 p-0.5 bg-white shadow-sm">
                        <img
                            src={roleUser.avatar}
                            alt={displayName}
                            className="size-full rounded-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}

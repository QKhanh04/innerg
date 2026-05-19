import React from 'react';
import { Bell, Search, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { useRole } from '../lib/RoleContext';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useRole();
  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-md">
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

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl relative transition-colors">
          <Bell className="size-5" />
          <span className="absolute top-2 right-2 size-2 bg-primary rounded-full ring-2 ring-white"></span>
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
          <MessageSquare className="size-5" />
        </button>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold leading-none">{user.name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">{user.position}</p>
          </div>
          <div className="size-10 rounded-full border-2 border-primary/20 p-0.5 bg-white shadow-sm">
            <img
              src={user.avatar}
              alt={user.name}
              className="size-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2, X } from 'lucide-react';
import { notificationApi } from '../../api/notificationApi';
import { cn } from '../../lib/utils';
import { isPushSupported, registerWebPush } from '../../services/pushNotificationService';

function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString('vi-VN');
}

export default function NotificationDropdown() {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationApi.list({ limit: 20 }),
        enabled: open,
        refetchInterval: open ? 30000 : false,
    });

    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: notificationApi.unreadCount,
        refetchInterval: 60000,
    });

    const markReadMutation = useMutation({
        mutationFn: (id) => notificationApi.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => notificationApi.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = async () => {
        const nextOpen = !open;
        setOpen(nextOpen);

        if (nextOpen && isPushSupported() && Notification.permission === 'default') {
            registerWebPush().catch(() => {});
        }
    };

    const notifications = data?.items ?? [];

    return (
        <div className="relative shrink-0" ref={containerRef}>
            <button
                type="button"
                onClick={handleToggle}
                className="relative flex items-center justify-center size-10 shrink-0 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors overflow-visible"
                aria-label="Thông báo"
            >
                <Bell className="size-5 shrink-0" strokeWidth={2} />
                {unreadCount > 0 && (
                    <span className="pointer-events-none absolute -top-0.5 -right-0.5 z-10 min-w-[16px] h-4 px-1 bg-primary text-[#0a192f] text-[9px] font-bold leading-none rounded-full border-2 border-white flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[360px] max-h-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                        <h3 className="text-sm font-bold text-slate-900">Thông báo</h3>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => markAllReadMutation.mutate()}
                                    disabled={markAllReadMutation.isPending}
                                    className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-white transition-colors"
                                    title="Đánh dấu tất cả đã đọc"
                                >
                                    <CheckCheck className="size-4" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="size-6 animate-spin text-primary" />
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    onClick={() => {
                                        if (!n.isRead) markReadMutation.mutate(n.id);
                                    }}
                                    className={cn(
                                        'w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors',
                                        !n.isRead && 'bg-primary/5'
                                    )}
                                >
                                    <div className="flex items-start gap-2">
                                        {!n.isRead && (
                                            <span className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />
                                        )}
                                        <div className={cn('flex-1 min-w-0', n.isRead && 'pl-4')}>
                                            <p className="text-sm font-bold text-slate-900 truncate">{n.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-medium">{formatTime(n.sentAt)}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <Bell className="size-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm text-slate-400 font-medium">Chưa có thông báo</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

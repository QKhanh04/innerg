import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ActionDialog({
    open,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    intent = 'primary',
    details,
    reasonLabel,
    reasonPlaceholder,
    initialReason = '',
    requireReason = false,
    isPending = false,
    onClose,
    onConfirm,
}) {
    const [reason, setReason] = useState(initialReason);

    useEffect(() => {
        if (open) {
            setReason(initialReason);
        }
    }, [initialReason, open]);

    if (!open) {
        return null;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(reason.trim());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-[#0a192f]/60 backdrop-blur-md"
                onClick={onClose}
            />
            <form
                onSubmit={handleSubmit}
                className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            >
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-6 py-6 text-white">
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10 blur-2xl" />
                    <div className="relative flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                            {description && (
                                <p className="text-sm text-slate-200">{description}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition-all hover:bg-white/10 hover:text-white"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                <div className="space-y-5 p-6">
                    {details && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                            {details}
                        </div>
                    )}

                    {reasonLabel && (
                        <label className="block space-y-2">
                            <span className="text-sm font-bold text-slate-800">{reasonLabel}</span>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={5}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/5"
                                placeholder={reasonPlaceholder}
                                required={requireReason}
                            />
                        </label>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="submit"
                        disabled={isPending || (requireReason && !reason.trim())}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60',
                            intent === 'danger'
                                ? 'bg-red-600 hover:bg-red-700'
                                : intent === 'warning'
                                    ? 'bg-amber-600 hover:bg-amber-700'
                                    : 'bg-[#0a192f] hover:bg-[#12305A]'
                        )}
                    >
                        {isPending && <Loader2 className="size-4 animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </form>
        </div>
    );
}

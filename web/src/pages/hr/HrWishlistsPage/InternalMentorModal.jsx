import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Award, Star, Check, Loader2, Info } from 'lucide-react';
import { hrWishlistsApi } from '../../../api/hrApi';
import { cn } from '../../../lib/utils';
import { toastService } from '../../../services/toastService';

export default function InternalMentorModal({ wishlist, onClose }) {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: suggestions = [], isLoading } = useQuery({
        queryKey: ['hr', 'wishlists', wishlist.id, 'suggestions'],
        queryFn: () => hrWishlistsApi.suggestTrainers(wishlist.id),
    });

    const assignMutation = useMutation({
        mutationFn: (trainerId) => hrWishlistsApi.assignTrainer(wishlist.id, trainerId),
        onSuccess: () => {
            toastService.success('Trainer assigned successfully');
            queryClient.invalidateQueries({ queryKey: ['hr', 'wishlists'] });
            onClose();
        },
        onError: () => toastService.error('Failed to assign trainer'),
    });

    const filteredSuggestions = suggestions.filter((s) =>
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0a192f]/60 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
                {/* ── Modal Header ────────────────────────────────────────────── */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0F1F3D] to-[#0d2b50] p-6 text-white">
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10 blur-2xl" />
                    <div className="relative flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Award className="size-4 text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">Sourcing Talent</span>
                            </div>
                            <h2 className="text-xl font-bold tracking-tight">Internal Mentor Match</h2>
                            <p className="text-xs text-slate-300 font-medium mt-1">Skill Topic: <span className="text-white">{wishlist.skillName}</span></p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/10"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* ── Search Bar ────────────────────────────────────────────── */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Find internal expertise by name..."
                            className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-primary/40 focus:bg-white outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* ── Suggestions List ──────────────────────────────────────── */}
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredSuggestions.length > 0 ? (
                            filteredSuggestions.map((trainer) => (
                                <div
                                    key={trainer.trainerId}
                                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-slate-50/50 transition-all group shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 text-primary group-hover:bg-white group-hover:shadow-inner transition-all shadow-sm">
                                            <Star className="size-6 fill-primary/10" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{trainer.fullName}</h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-black border border-amber-100/50">
                                                    <Star className="size-3 fill-current" />
                                                    {trainer.avgRating.toFixed(1)}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 border-l border-slate-100">
                                                    {trainer.proficiency}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => assignMutation.mutate(trainer.trainerId)}
                                        disabled={assignMutation.isPending}
                                        className="h-9 px-4 bg-primary text-[#0a192f] text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
                                    >
                                        {assignMutation.isPending ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <Check className="size-3.5" />
                                        )}
                                        Assign
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 border border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                                <Search className="size-8 text-slate-200" />
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.1em] italic">No Match Found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Modal Footer ────────────────────────────────────────────── */}
                <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex items-center gap-4">
                    <div className="size-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                        <Info className="size-4" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed tracking-tight">
                        Confirming an assignment will instantly coordinate with both the <span className="text-primary">Internal Mentor</span> and original <span className="text-primary">Requesting Parties</span>.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

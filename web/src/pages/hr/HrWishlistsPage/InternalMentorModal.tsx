import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, Award, Star, Check } from 'lucide-react';
import { hrWishlistsApi } from '../../../api/hrApi';
import { cn } from '../../../lib/utils';
import toast from 'react-hot-toast';

interface Props {
    wishlist: any;
    onClose: () => void;
}

export default function InternalMentorModal({ wishlist, onClose }: Props) {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: suggestions = [], isLoading } = useQuery({
        queryKey: ['hr', 'wishlists', wishlist.id, 'suggestions'],
        queryFn: () => hrWishlistsApi.suggestTrainers(wishlist.id),
    });

    const assignMutation = useMutation({
        mutationFn: (trainerId: string) => hrWishlistsApi.assignTrainer(wishlist.id, trainerId),
        onSuccess: () => {
            toast.success('Trainer assigned successfully');
            queryClient.invalidateQueries({ queryKey: ['hr', 'wishlists'] });
            onClose();
        },
        onError: () => toast.error('Failed to assign trainer'),
    });

    const filteredSuggestions = suggestions.filter((s: any) =>
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-extrabold text-[#0a192f]">Internal Mentor Suggestions</h2>
                        <p className="text-xs text-slate-400 font-medium">For: {wishlist.skillName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search internal mentors..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#13ecb6]/30 focus:border-[#13ecb6] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                            ))
                        ) : filteredSuggestions.length > 0 ? (
                            filteredSuggestions.map((trainer: any) => (
                                <div
                                    key={trainer.trainerId}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#13ecb6] hover:bg-[#13ecb6]/5 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                            <Award className="w-5 h-5 text-[#13ecb6]" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[#0a192f]">{trainer.fullName}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-500">
                                                    <Star className="w-3 h-3 fill-current" /> {trainer.avgRating.toFixed(1)}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {trainer.proficiency}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => assignMutation.mutate(trainer.trainerId)}
                                        disabled={assignMutation.isPending}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-[#0a192f] text-[11px] font-extrabold rounded-lg hover:bg-[#13ecb6] hover:text-[#0a192f] hover:border-[#13ecb6] transition-all shadow-sm"
                                    >
                                        {assignMutation.isPending ? (
                                            <div className="w-3 h-3 border-2 border-[#0a192f]/30 border-t-[#0a192f] rounded-full animate-spin" />
                                        ) : (
                                            <Check className="w-3 h-3" />
                                        )}
                                        Assign
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm font-medium italic">
                                No matching mentors found.
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 text-center font-medium">
                        Assigning a mentor will notify both the mentor and the proposers.
                    </p>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { feedbackApi } from '../../../api/feedbackApi';
import { toast } from 'react-hot-toast';

export default function FeedbackModal({ eventId, onClose, onSuccess }) {
    const [criteria, setCriteria] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const [overallRating, setOverallRating] = useState(0);
    const [comment, setComment] = useState('');
    const [criteriaScores, setCriteriaScores] = useState({});
    const [isAnonymous, setIsAnonymous] = useState(false);

    useEffect(() => {
        const fetchCriteria = async () => {
            try {
                const data = await feedbackApi.getLearnerCriteria();
                setCriteria(data);
                // Initialize scores
                const initialScores = {};
                data.forEach(c => initialScores[c.id] = 0);
                setCriteriaScores(initialScores);
            } catch (error) {
                console.error("Failed to load criteria", error);
                toast.error("Failed to load rating criteria.");
            } finally {
                setLoading(false);
            }
        };
        fetchCriteria();
    }, []);

    const handleCriteriaScore = (criteriaId, score) => {
        setCriteriaScores(prev => ({ ...prev, [criteriaId]: score }));
    };

    const handleSubmit = async () => {
        if (overallRating === 0) {
            toast.error("Please provide an overall rating.");
            return;
        }

        // Check if all criteria are rated
        const unrated = Object.values(criteriaScores).some(score => score === 0);
        if (unrated) {
            toast.error("Please rate all criteria.");
            return;
        }

        try {
            setSubmitting(true);
            await feedbackApi.submitFeedback(eventId, {
                overallRating,
                comment,
                isAnonymous,
                criteriaScores
            });
            
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 1500);

        } catch (error) {
            console.error("Failed to submit feedback", error);
            toast.error(error?.response?.data?.message || "Failed to submit feedback.");
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (currentScore, onRate) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onRate(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                    >
                        <Star 
                            className={cn(
                                "size-6", 
                                star <= currentScore 
                                    ? "fill-amber-400 text-amber-400" 
                                    : "fill-transparent text-slate-300 hover:text-amber-200"
                            )} 
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0F1F3D] to-[#1a2d52] p-6 text-white relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 rounded-full p-1.5"
                    >
                        <X className="size-5" />
                    </button>
                    <h2 className="text-2xl font-black flex items-center gap-2">
                        <Star className="size-6 fill-amber-400 text-amber-400" /> Rate & Review
                    </h2>
                    <p className="text-white/70 text-sm mt-1 font-medium">Your feedback helps mentors improve.</p>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="size-8 animate-spin text-indigo-500" /></div>
                    ) : success ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }} 
                                className="size-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4"
                            >
                                <CheckCircle2 className="size-8" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-slate-800">Thank You!</h3>
                            <p className="text-slate-500 text-sm mt-2">Your feedback has been submitted successfully.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            
                            {/* Overall Rating */}
                            <div className="flex flex-col items-center text-center space-y-3 bg-amber-50/50 p-6 rounded-2xl border border-amber-100/50">
                                <h3 className="font-extrabold text-slate-800 text-lg">Overall Experience</h3>
                                {renderStars(overallRating, setOverallRating)}
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select 1 to 5 stars</span>
                            </div>

                            {/* Criteria Ratings */}
                            <div className="space-y-5">
                                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Detailed Evaluation</h4>
                                {criteria.map(c => (
                                    <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm text-slate-700">{c.name}</p>
                                            {c.description && <p className="text-[10px] text-slate-500 mt-0.5">{c.description}</p>}
                                        </div>
                                        <div className="shrink-0 scale-75 sm:scale-100 origin-left sm:origin-right">
                                            {renderStars(criteriaScores[c.id], (score) => handleCriteriaScore(c.id, score))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Comment */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    <MessageSquare className="size-4 text-indigo-500" /> Share your thoughts
                                </h4>
                                <textarea 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                                    rows={4}
                                    placeholder="What did you like? What could be improved?"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>

                            {/* Anonymous Toggle */}
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input 
                                        type="checkbox" 
                                        className="peer sr-only"
                                        checked={isAnonymous}
                                        onChange={(e) => setIsAnonymous(e.target.checked)}
                                    />
                                    <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-indigo-600 transition-colors" />
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                                </div>
                                <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                                    Submit Anonymously
                                </span>
                            </label>

                        </div>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={submitting || loading}
                            className="flex-[2] py-3 bg-[#0F1F3D] hover:bg-[#1a2d52] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                        >
                            {submitting ? <Loader2 className="size-5 animate-spin" /> : 'Submit Review'}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { useRole } from '../../../lib/RoleContext';
import { exploreApi } from '../../../api/exploreApi';
import { mentorApi } from '../../../api/mentorApi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    BookOpen, Star, Calendar, Clock, MapPin, Video,
    CheckCircle2, AlertCircle, PlayCircle, Loader2, Award
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import FeedbackModal from './FeedbackModal';

export default function MyClasses() {
    const { role } = useRole();
    const navigate = useNavigate();
    
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, UPCOMING, COMPLETED, CANCELLED
    
    const [selectedEventForReview, setSelectedEventForReview] = useState(null);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoading(true);
                let data = [];
                if (role === 'mentor') {
                    // For mentor, we map the properties to be consistent with mentee
                    const response = await mentorApi.getHostedClasses();
                    data = response.map(item => ({
                        id: item.id,
                        title: item.title,
                        coverImageUrl: item.coverImageUrl,
                        mentorName: 'You (Host)',
                        status: getComputedStatus(item), // Compute dynamic status
                        type: item.type,
                        startDate: item.startDate,
                        endDate: item.endDate,
                        hasReviewed: true // Mentors don't rate themselves
                    }));
                } else {
                    const response = await exploreApi.getMyClasses();
                    data = response.map(item => ({
                        ...item,
                        status: getComputedStatus(item)
                    }));
                }
                setClasses(data);
            } catch (error) {
                console.error("Failed to fetch classes:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, [role]);

    const normalizeStatus = (status) => {
        if (status === 2 || status === 'Completed') return 2;
        if (status === 3 || status === 'Cancelled') return 3;
        if (status === 1 || status === 'Confirmed' || status === 'Published') return 1;
        return 0; // Pending / Draft
    };

    const getComputedStatus = (item) => {
        let st = normalizeStatus(item.status);
        if (st === 3) return 3; // Keep Cancelled
        if (st === 0) return 0; // Keep Draft/Pending
        // If it's Confirmed/Published but the endDate has passed, it's Completed
        if (item.endDate && new Date(item.endDate) < new Date()) return 2; 
        return st;
    };

    // Filter logic
    // EnrollmentStatus: Pending=0, Confirmed=1, Completed=2, Cancelled=3
    const filteredClasses = classes.filter(c => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'UPCOMING') return c.status === 1; 
        if (activeTab === 'COMPLETED') return c.status === 2;
        if (activeTab === 'CANCELLED') return c.status === 3 || c.status === 0;
        return true;
    });

    const handleFeedbackSuccess = () => {
        // Mark as reviewed
        setClasses(prev => prev.map(c => c.id === selectedEventForReview ? { ...c, hasReviewed: true } : c));
        setSelectedEventForReview(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 xl:p-10 pb-24">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <BookOpen className="size-8 text-indigo-600" /> My Classes
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        {role === 'mentor' 
                            ? 'Manage all the workshops and sessions you are hosting.'
                            : 'Track your enrolled classes, past sessions, and leave reviews.'}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
                    {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-5 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 relative",
                                activeTab === tab 
                                    ? "text-indigo-600 border-indigo-600" 
                                    : "text-slate-400 border-transparent hover:text-slate-600 hover:border-slate-300"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-indigo-600">
                        <Loader2 className="size-10 animate-spin mb-4" />
                        <p className="font-bold text-sm tracking-widest uppercase">Loading Classes...</p>
                    </div>
                ) : filteredClasses.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
                        <div className="size-20 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mx-auto mb-5">
                            <BookOpen className="size-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">No classes found</h3>
                        <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">
                            You don't have any classes in this category yet. Explore the marketplace to find new sessions!
                        </p>
                        {role === 'mentee' && (
                            <button 
                                onClick={() => navigate('/explore')}
                                className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md"
                            >
                                Explore Marketplace
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredClasses.map((item) => (
                                <motion.div 
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col"
                                >
                                    {/* Cover Image */}
                                    <div 
                                        className="h-40 bg-slate-100 relative cursor-pointer"
                                        onClick={() => navigate(`/explore/${item.id}`)}
                                    >
                                        <img 
                                            src={item.coverImageUrl || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400&auto=format&fit=crop"} 
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                                        
                                        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                                            <span className={cn(
                                                "px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-md",
                                                item.status === 2 ? "bg-emerald-500 text-white" :
                                                item.status === 1 ? "bg-indigo-500 text-white" :
                                                item.status === 3 ? "bg-rose-500 text-white" :
                                                "bg-amber-500 text-white"
                                            )}>
                                                {item.status === 2 ? 'Completed' : item.status === 1 ? 'Confirmed' : item.status === 3 ? 'Cancelled' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 
                                            className="font-extrabold text-slate-800 text-lg leading-tight mb-2 cursor-pointer hover:text-indigo-600 transition-colors line-clamp-2"
                                            onClick={() => navigate(`/explore/${item.id}`)}
                                        >
                                            {item.title}
                                        </h3>
                                        
                                        <p className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-2">
                                            <span className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <Award className="size-3" />
                                            </span>
                                            {item.mentorName}
                                        </p>

                                        <div className="space-y-2 mb-6 text-xs font-semibold text-slate-600">
                                            <p className="flex items-center gap-2">
                                                <Calendar className="size-4 text-slate-400" />
                                                {new Date(item.startDate).toLocaleDateString()}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <Clock className="size-4 text-slate-400" />
                                                {new Date(item.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
                                            <button 
                                                onClick={() => navigate(`/explore/${item.id}`)}
                                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                                            >
                                                View Details
                                            </button>
                                            
                                            {item.status === 2 && role === 'mentee' && (
                                                item.hasReviewed ? (
                                                    <button 
                                                        disabled
                                                        className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 opacity-80"
                                                    >
                                                        <CheckCircle2 className="size-3.5" /> Reviewed
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => setSelectedEventForReview(item.id)}
                                                        className="flex-1 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-md shadow-orange-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <Star className="size-3.5 fill-white" /> Rate Class
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Feedback Modal */}
            {selectedEventForReview && (
                <FeedbackModal 
                    eventId={selectedEventForReview} 
                    onClose={() => setSelectedEventForReview(null)} 
                    onSuccess={handleFeedbackSuccess}
                />
            )}
        </div>
    );
}

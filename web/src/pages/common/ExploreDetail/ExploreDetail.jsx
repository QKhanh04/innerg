import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Video, 
  Award, Users, User, CheckCircle2, AlertCircle,
  Activity, PlayCircle, Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useRole } from '../../../lib/RoleContext';
import { exploreApi } from '../../../api/exploreApi';
import { toastService } from '../../../services/toastService';

export default function ExploreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await exploreApi.getClassDetail(id);
        if (isMounted) {
          setDetail(data);
        }
      } catch (err) {
        toastService.error("Failed to load workshop details.");
        navigate('/explore');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDetail();
    return () => { isMounted = false; };
  }, [id, navigate]);

  const handleRegister = async () => {
    if (detail.takenSlots >= detail.totalSlots) {
      toastService.warning("Sorry, this class is full!");
      return;
    }
    try {
      setActionLoading(true);
      await exploreApi.registerClass(id);
      toastService.success(`Registration request sent for "${detail.title}". Pending mentor approval!`);
      setDetail(prev => ({ ...prev, registrationStatus: 'Pending', takenSlots: prev.takenSlots + 1 }));
    } catch (err) {
      toastService.error("Operation failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    try {
      setActionLoading(true);
      await exploreApi.unregisterClass(id);
      toastService.success(`Successfully canceled registration for "${detail.title}".`);
      setDetail(prev => ({ ...prev, registrationStatus: 'NotRegistered', takenSlots: Math.max(0, prev.takenSlots - 1) }));
    } catch (err) {
      toastService.error("Operation failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto pb-16 space-y-8 animate-pulse">
        <div className="h-64 w-full bg-slate-200 rounded-3xl" />
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-32 w-full bg-slate-200 rounded-xl" />
            <div className="h-48 w-full bg-slate-200 rounded-xl" />
          </div>
          <div className="w-full lg:w-80 space-y-6">
            <div className="h-40 w-full bg-slate-200 rounded-2xl" />
            <div className="h-64 w-full bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const isFull = detail.takenSlots >= detail.totalSlots;
  const isRegistered = detail.registrationStatus === 'Registered';
  const isPending = detail.registrationStatus === 'Pending';
  const canRegister = role === 'mentee';

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-8 px-4 sm:px-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/explore')}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-extrabold text-xs uppercase tracking-wider transition-colors pt-4"
      >
        <ArrowLeft className="size-4" />
        Back to Marketplace
      </button>

      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-[350px] lg:h-[450px] w-full rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/50 flex flex-col justify-end p-8 lg:p-12 group"
      >
        <img src={detail.image} alt={detail.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 space-y-5 max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-indigo-600/90 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg backdrop-blur-md border border-indigo-500/50">
              {detail.category}
            </span>
            <span className={cn(
              "text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg backdrop-blur-md text-white flex items-center gap-1.5 border",
              detail.format === 'Online' ? "bg-teal-600/90 border-teal-500/50" : "bg-amber-600/90 border-amber-500/50"
            )}>
              {detail.format === 'Online' ? <Video className="size-3.5" /> : <MapPin className="size-3.5" />}
              {detail.format}
            </span>
            {role !== 'mentee' && (
               <span className="bg-slate-800/90 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg backdrop-blur-md border border-slate-600/50">
                 Status: {detail.eventStatus}
               </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
            {detail.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-slate-200 text-sm font-semibold">
            <div className="flex items-center gap-2.5 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
              <Calendar className="size-4 text-indigo-300" />
              {detail.date}
            </div>
            <div className="flex items-center gap-2.5 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
              <Clock className="size-4 text-indigo-300" />
              {detail.time} ({detail.duration})
            </div>
          </div>
        </div>
      </motion.div>

      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        
        {/* Left Column: Details */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 space-y-10"
        >
          {/* Quick Facts */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col items-center text-center gap-2">
                <div className="size-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <Award className="size-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Level</span>
                  <span className="text-sm font-bold text-slate-800">{detail.level}</span>
                </div>
             </div>
             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col items-center text-center gap-2">
                <div className="size-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                  {detail.format === 'Online' ? <Video className="size-5" /> : <MapPin className="size-5" />}
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Location</span>
                  <span className="text-sm font-bold text-slate-800 line-clamp-1">{detail.formatDetail}</span>
                </div>
             </div>
             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col items-center text-center gap-2">
                <div className="size-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                  <Star className="size-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Reward</span>
                  <span className="text-sm font-bold text-slate-800">+{detail.points} Points</span>
                </div>
             </div>
             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col items-center text-center gap-2">
                <div className="size-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                  <Users className="size-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Capacity</span>
                  <span className="text-sm font-bold text-slate-800">{detail.totalSlots} Slots</span>
                </div>
             </div>
          </section>

          {/* About */}
          <section className="bg-white rounded-[32px] p-8 lg:p-10 border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <Activity className="size-6 text-indigo-500" />
              About This Workshop
            </h2>
            <div className="prose prose-slate prose-base max-w-none text-slate-600 leading-loose">
              <p>{detail.description || "No description provided. Please contact the mentor for more details."}</p>
            </div>
            
            {detail.skills.length > 0 && (
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Targeted Skills</h3>
                <div className="flex flex-wrap gap-2.5">
                  {detail.skills.map((skill, idx) => (
                    <span key={idx} className="bg-indigo-50/50 text-indigo-700 border border-indigo-100 px-4 py-2 rounded-xl text-sm font-bold shadow-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Agenda / Sessions */}
          <section className="space-y-6">
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3 px-2">
              <PlayCircle className="size-6 text-indigo-500" />
              Session Agenda
            </h2>
            <div className="space-y-4">
              {detail.sessions.length > 0 ? detail.sessions.map((session, index) => (
                <div key={session.id} className="bg-white rounded-[24px] p-6 lg:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-6 lg:gap-8 transition-all hover:border-indigo-300 hover:shadow-lg group cursor-default">
                  <div className="flex-shrink-0 bg-indigo-50/80 rounded-2xl p-5 text-center min-w-[120px] border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                    <span className="block text-xs font-extrabold text-indigo-400 group-hover:text-indigo-200 uppercase tracking-widest mb-1 transition-colors">Session</span>
                    <span className="block text-3xl font-black text-indigo-600 group-hover:text-white transition-colors">0{index + 1}</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <h4 className="text-lg font-extrabold text-slate-800">{session.title}</h4>
                    <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-500">
                      <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <Clock className="size-4 text-slate-400" />
                        {session.startTime} ({session.duration})
                      </span>
                      <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        {session.format === 'Online' ? <Video className="size-4 text-teal-500" /> : <MapPin className="size-4 text-rose-500" />}
                        <span className="truncate max-w-[200px]">{session.locationOrLink}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="bg-slate-50 rounded-[24px] p-12 border border-slate-200 border-dashed text-center">
                  <p className="text-base font-semibold text-slate-500">No sessions scheduled yet.</p>
                </div>
              )}
            </div>
          </section>
        </motion.div>

        {/* Right Column: Sticky Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full lg:w-[380px] space-y-6 sticky top-8"
        >
          {/* Registration Card */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl shadow-indigo-100/50 space-y-8">
            
            {/* Gamification Points */}
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-amber-600 rounded-[24px] p-6 text-white shadow-lg shadow-amber-500/25 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-black text-amber-100 uppercase tracking-widest mb-1 drop-shadow-sm">Completion Reward</span>
                  <span className="block text-2xl font-black drop-shadow-md">+{detail.points} Points</span>
                </div>
                <Award className="size-12 text-amber-100 drop-shadow-xl" />
              </div>
            </div>

            {/* Capacity Status */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
                  <Users className="size-5 text-indigo-500" />
                  Class Capacity
                </span>
                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                  {detail.takenSlots} / {detail.totalSlots} Slots
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={cn("h-full rounded-full transition-all duration-1000", isFull ? "bg-rose-500" : "bg-gradient-to-r from-indigo-500 to-violet-500")}
                  style={{ width: `${Math.min(100, (detail.takenSlots / detail.totalSlots) * 100)}%` }}
                />
              </div>
            </div>

            {/* Role-based Actions */}
            <div className="pt-2">
              {canRegister ? (
                isRegistered ? (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl p-4 flex items-center justify-center gap-3 text-base font-bold shadow-sm">
                      <CheckCircle2 className="size-6 text-emerald-500" />
                      Registered Successfully!
                    </div>
                    <button 
                      onClick={handleCancelRegistration}
                      disabled={actionLoading}
                      className="w-full text-sm font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors py-3 disabled:opacity-50"
                    >
                      Cancel Registration
                    </button>
                  </div>
                ) : isPending ? (
                   <div className="space-y-4">
                    <div className="bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl p-4 flex items-center justify-center gap-3 text-base font-bold shadow-sm">
                      <Clock className="size-6 text-amber-500" />
                      Pending Approval
                    </div>
                    <button 
                      onClick={handleCancelRegistration}
                      disabled={actionLoading}
                      className="w-full text-sm font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors py-3 disabled:opacity-50"
                    >
                      Cancel Request
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleRegister}
                    disabled={actionLoading || isFull}
                    className={cn(
                      "w-full font-black py-4 rounded-2xl text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2",
                      isFull 
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                        : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/25 hover:brightness-110 active:scale-[0.98] hover:shadow-indigo-500/40"
                    )}
                  >
                    {actionLoading ? "Processing..." : isFull ? "Class Full" : "Register Now"}
                  </button>
                )
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
                   <AlertCircle className="size-6 text-slate-400 mx-auto" />
                   <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                     Registration is available for Mentee roles only.
                   </p>
                </div>
              )}
            </div>
          </div>

          {/* Mentor Profile */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm text-center space-y-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-left flex items-center gap-2">
              <User className="size-4" />
              Lead Instructor
            </h3>
            {/* FIXED AVATAR CONTAINER */}
            <div className="w-32 h-32 mx-auto rounded-full p-1.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 shadow-lg relative overflow-hidden">
              <img src={detail.mentor.avatar} alt={detail.mentor.name} className="w-full h-full rounded-full border-4 border-white object-cover bg-slate-50" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-black text-slate-800 tracking-tight">{detail.mentor.name}</h4>
              <p className="text-sm font-bold text-indigo-600">{detail.mentor.position}</p>
            </div>
            <div className="flex justify-center items-center gap-2 pt-3 border-t border-slate-100">
               <Star className="size-5 fill-amber-400 text-amber-400" />
               <span className="text-base font-black text-slate-700">{detail.mentor.rating} <span className="text-sm font-semibold text-slate-400">Rating</span></span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

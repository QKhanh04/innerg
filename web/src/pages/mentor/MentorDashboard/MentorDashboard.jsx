import React, { useState, useEffect, useMemo } from 'react';
import { mentorApi } from '../../../api/mentorApi';
import { 
  BarChart3, 
  BookOpen, 
  Users, 
  Star, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  ChevronRight, 
  Award, 
  Sparkles, 
  MapPin, 
  Video, 
  ExternalLink,
  MessageSquare,
  Plus,
  Heart,
  Sliders,
  Settings2,
  CalendarDays,
  BookmarkCheck,
  CheckCircle2,
  QrCode,
  Scan,
  Copy,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { toastService } from '../../../services/toastService';

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [activeLaunchSession, setActiveLaunchSession] = useState(null);
  const [rollCallList, setRollCallList] = useState([
    { name: 'Jane Doe', avatar: 'https://i.pravatar.cc/150?u=janedoe', position: 'Junior Frontend Developer', attended: true },
    { name: 'Michael Scott', avatar: 'https://i.pravatar.cc/150?u=michael', position: 'Sales Lead', attended: false },
    { name: 'Pam Beesly', avatar: 'https://i.pravatar.cc/150?u=pam', position: 'Designer', attended: true }
  ]);

  const showToast = (message) => {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('failed') || lowerMsg.includes('error') || lowerMsg.includes('decline') || lowerMsg.includes('reject')) {
      toastService.error(message);
    } else if (lowerMsg.includes('success') || lowerMsg.includes('approve') || lowerMsg.includes('confirm') || lowerMsg.includes('copied') || lowerMsg.includes('launch') || message.includes('🎉') || message.includes('🎁') || message.includes('⌚') || message.includes('📋')) {
      toastService.success(message);
    } else {
      toastService.info(message);
    }
  };

  const toggleAttendance = (idx) => {
    setRollCallList(prev => prev.map((std, i) => i === idx ? { ...std, attended: !std.attended } : std));
  };  // Data States
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [classes, setClasses] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [availability, setAvailability] = useState([
    { dayOfWeek: 'Monday', isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '11:00' }] },
    { dayOfWeek: 'Tuesday', isAvailable: false, timeSlots: [] },
    { dayOfWeek: 'Wednesday', isAvailable: true, timeSlots: [{ startTime: '15:00', endTime: '17:00' }] },
    { dayOfWeek: 'Thursday', isAvailable: true, timeSlots: [{ startTime: '10:00', endTime: '12:00' }] },
    { dayOfWeek: 'Friday', isAvailable: false, timeSlots: [] }
  ]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [statsRes, classesRes, pendingRes, availRes] = await Promise.all([
          mentorApi.getDashboardStats(),
          mentorApi.getHostedClasses(),
          mentorApi.getPendingEnrollments(),
          mentorApi.getAvailability()
        ]);

        setStats(statsRes);
        setClasses(classesRes);
        setPendingApprovals(pendingRes);
        
        if (availRes?.weeklySchedule?.length > 0) {
          setAvailability(availRes.weeklySchedule);
        }
      } catch (error) {
        console.error('Failed to fetch mentor data:', error);
        showToast('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAvailabilityToggle = (idx) => {
    setAvailability(prev => prev.map((item, i) => i === idx ? { ...item, isAvailable: !item.isAvailable } : item));
  };

  const handleTimeChange = (idx, field, value) => {
    setAvailability(prev => prev.map((item, i) => {
      if (i === idx) {
        const newTimeSlots = item.timeSlots?.length > 0 ? [...item.timeSlots] : [{ startTime: '09:00', endTime: '17:00' }];
        newTimeSlots[0] = { ...newTimeSlots[0], [field]: value };
        return { ...item, timeSlots: newTimeSlots };
      }
      return item;
    }));
  };

  const saveAvailability = async () => {
    try {
      await mentorApi.updateAvailability(availability);
      showToast("Availability settings saved successfully! ⌚");
    } catch (error) {
      showToast("Failed to save availability. Please try again.");
    }
  };

  const handleApprovalAction = async (id, action, name) => {
    try {
      if (action === 'approve') {
        await mentorApi.approveEnrollment(id);
        showToast(`Approved registration for ${name}! 🎉`);
        // Refresh classes to update slots
        const classesRes = await mentorApi.getHostedClasses();
        setClasses(classesRes);
      } else {
        await mentorApi.rejectEnrollment(id);
        showToast(`Declined registration request from ${name}.`);
      }
      // Remove from list
      setPendingApprovals(prev => prev.filter(item => item.enrollmentId !== id));
    } catch (error) {
      showToast(`Failed to ${action} enrollment. Please try again.`);
    }
  };

  const handleConfirmRollCall = async () => {
    const attendedIds = rollCallList.filter(s => s.attended).map(s => s.id || 'mock-id');
    try {
      await mentorApi.submitRollCall(activeLaunchSession?.id || 'mock-session', attendedIds, "Roll call note");
      showToast(`Roll call success! Awarded points to ${attendedIds.length} attendees! 🎁`);
      setActiveLaunchSession(null);
    } catch (error) {
      showToast('Failed to submit roll call.');
    }
  };

  // 4. Auto-Scheduler Golden Slots state
  const goldenSlots = [
    { id: 1, date: 'Wednesday, May 27', time: '03:00 PM', rating: 94, reason: 'Highly active slot for Tech & Product (94% team availability)' },
    { id: 2, date: 'Thursday, May 28', time: '10:00 AM', rating: 88, reason: 'Lowest corporate meeting conflict rates' },
    { id: 3, date: 'Tuesday, June 02', time: '02:00 PM', rating: 82, reason: 'Ideal for cross-functional soft skill attendance' }
  ];

  const handleApplyGoldenSlot = (slot) => {
    showToast(`Slot chosen: ${slot.date} at ${slot.time}. Pre-filling Creation Form...`);
    setTimeout(() => {
      navigate('/mentor/create');
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-16">
      
      {/* 1. HERO HEADER WITH GRADIENT & GENERAL STATS */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 rounded-3xl p-8 lg:p-10 shadow-xl border border-indigo-500/25 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00C896]/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />

        <div className="space-y-4 max-w-2xl text-left relative z-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#00C896] uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <Sparkles className="size-3.5" />
            Mentor Console
          </span>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Mentor Workspace & Analytics
          </h1>
          <p className="text-slate-350 text-sm leading-relaxed max-w-xl">
            Review your classes, approve pending student applications, configure availability calendar blocks, and analyze class performance.
          </p>
          
          {/* Stats Badges */}
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-left min-w-[120px]">
              {isLoading ? (
                <div className="h-7 w-12 bg-white/10 animate-pulse rounded mb-1"></div>
              ) : (
                <p className="text-xl font-extrabold text-white">{stats?.totalClassesTaught || 0}</p>
              )}
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Classes Taught</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-left min-w-[120px]">
              {isLoading ? (
                <div className="h-7 w-12 bg-white/10 animate-pulse rounded mb-1"></div>
              ) : (
                <p className="text-xl font-extrabold text-[#00C896]">{stats?.totalStudents || 0}</p>
              )}
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Total Students</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-left min-w-[120px]">
              {isLoading ? (
                <div className="h-7 w-12 bg-white/10 animate-pulse rounded mb-1"></div>
              ) : (
                <p className="text-xl font-extrabold text-amber-400 flex items-center gap-1">
                  <Star className="size-4.5 fill-current" />
                  {stats?.averageRating?.toFixed(1) || '0.0'}
                </p>
              )}
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Avg Rating</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-left min-w-[120px]">
              {isLoading ? (
                <div className="h-7 w-12 bg-white/10 animate-pulse rounded mb-1"></div>
              ) : (
                <p className="text-xl font-extrabold text-indigo-300">+{stats?.currentPoints || 0}</p>
              )}
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Points Balance</p>
            </div>
          </div>
        </div>

        {/* Create new Class Shortcut */}
        <div className="shrink-0 relative z-10">
          <button 
            onClick={() => navigate('/mentor/create')}
            className="bg-gradient-to-r from-[#00C896] to-[#00B083] hover:brightness-105 active:scale-[0.98] text-[#0F1F3D] font-extrabold px-6 py-4 rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-[#00C896]/20 flex items-center gap-2"
          >
            <Plus className="size-4.5 stroke-[3]" />
            Host a New Class
          </button>
        </div>
      </div>

      {/* 2. THREE-PANEL CORE GRID WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: PENDING APPROVALS & AUTO-SCHEDULER */}
        <div className="xl:col-span-1 space-y-8 text-left">
          
          {/* A. Pending Approvals list */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Users className="size-4.5 text-indigo-650" />
                Pending Registrations
              </h3>
              <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                {pendingApprovals.length} Request{pendingApprovals.length !== 1 && 's'}
              </span>
            </div>

            <div className="space-y-4">
              {isLoading && [1, 2].map((i) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3 animate-pulse">
                  <div className="size-9 rounded-full bg-slate-200 shrink-0"></div>
                  <div className="space-y-2 flex-1 pt-1">
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
              {!isLoading && (
                <AnimatePresence mode="popLayout">
                  {pendingApprovals.map((req) => (
                  <motion.div 
                    layout
                    key={req.enrollmentId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col gap-3 relative overflow-hidden"
                  >
                    <div className="flex gap-3">
                      <img src={req.menteeAvatar || 'https://ui-avatars.com/api/?name=User'} className="size-9 rounded-full object-cover border border-slate-200" alt={req.menteeName} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-850">{req.menteeName}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{req.jobTitle || 'Member'}</p>
                        <p className="text-[10px] text-indigo-600 font-extrabold mt-1 truncate">Class: "{req.eventTitle}"</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                      <span className="text-[9px] text-slate-400 font-semibold">{new Date(req.requestedAt).toLocaleDateString()}</span>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApprovalAction(req.enrollmentId, 'decline', req.menteeName)}
                          className="size-7 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-500 rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-[0.95]"
                        >
                          <X className="size-3.5" />
                        </button>
                        <button 
                          onClick={() => handleApprovalAction(req.enrollmentId, 'approve', req.menteeName)}
                          className="size-7 bg-slate-900 hover:bg-emerald-600 border border-slate-900 hover:border-emerald-600 text-white rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-[0.95]"
                        >
                          <Check className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              )}

              {!isLoading && pendingApprovals.length === 0 && (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">All caught up!</p>
                  <p className="text-[10px] text-slate-400">No pending student registration requests left.</p>
                </div>
              )}
            </div>
          </section>

          {/* B. Auto-Scheduler golden slots selector widget */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="size-4.5 text-[#9333EA] animate-pulse" />
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                AI Golden Time Slots
              </h3>
            </div>
            
            <p className="text-[11px] text-slate-455 leading-relaxed">
              Calculated by InnerG AI based on target departments, free calendar times, and work hours.
            </p>

            <div className="space-y-3 pt-1">
              {goldenSlots.map((slot) => (
                <div 
                  key={slot.id}
                  onClick={() => handleApplyGoldenSlot(slot)}
                  className="p-3 bg-gradient-to-br from-purple-50/20 via-white to-white border border-purple-100 hover:border-purple-300 hover:shadow-xs rounded-2xl cursor-pointer transition-all flex justify-between items-center gap-3 text-left group"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-extrabold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-lg">
                        {slot.rating}% Match
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-800">{slot.date}</p>
                    <p className="text-[9px] text-slate-500 font-medium truncate">{slot.time} • {slot.reason}</p>
                  </div>
                  <ChevronRight className="size-4 text-purple-400 group-hover:text-purple-600 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* MIDDLE & RIGHT COLUMN (2/3): CLASSES DIRECTORY & AVAILABILITY CALENDAR */}
        <div className="xl:col-span-2 space-y-8 text-left">
          
          {/* C. Availability Scheduler Column */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays className="size-4.5 text-emerald-650" />
                  Weekly Availability Scheduler
                </h3>
                <p className="text-xs text-slate-455 leading-normal">
                  Configure default hours when you are free to teach mentoring sessions and peer workshops.
                </p>
              </div>

              <button 
                onClick={saveAvailability}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer transition-all active:scale-[0.98] shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
              >
                Save Availability
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {availability.map((item, idx) => (
                <div key={item.dayOfWeek} className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Day active state toggle */}
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id={`day-${item.dayOfWeek}`}
                      checked={item.isAvailable} 
                      onChange={() => handleAvailabilityToggle(idx)}
                      className="size-4 accent-indigo-650 rounded cursor-pointer" 
                    />
                    <label htmlFor={`day-${item.dayOfWeek}`} className={cn(
                      "text-xs font-extrabold cursor-pointer select-none",
                      item.isAvailable ? "text-slate-800" : "text-slate-400 line-through"
                    )}>
                      {item.dayOfWeek}
                    </label>
                  </div>

                  {/* Time picker input fields */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">AVAILABLE HOURS:</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="time" 
                        value={item.timeSlots?.[0]?.startTime || ''}
                        disabled={!item.isAvailable}
                        onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 disabled:bg-slate-100 border border-slate-200 disabled:border-slate-200/50 rounded-xl text-xs font-bold text-slate-700 disabled:text-slate-400 outline-none focus:border-indigo-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-slate-400 text-xs">—</span>
                      <input 
                        type="time" 
                        value={item.timeSlots?.[0]?.endTime || ''}
                        disabled={!item.isAvailable}
                        onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 disabled:bg-slate-100 border border-slate-200 disabled:border-slate-200/50 rounded-xl text-xs font-bold text-slate-700 disabled:text-slate-400 outline-none focus:border-indigo-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </section>

          {/* D. Hosted Classes Management Directory */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="size-4.5 text-indigo-650" />
                Hosted Classes Management
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading && [1, 2].map((i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden h-64 animate-pulse">
                  <div className="h-28 bg-slate-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
              {!isLoading && classes.map((cls) => {
                const spotsLeft = (cls.maxParticipants || 0) - cls.registeredCount;
                const isFull = spotsLeft <= 0 && cls.maxParticipants !== null;

                const formatString = cls.type === 0 ? 'Course' : cls.type === 1 ? 'Workshop' : cls.type === 2 ? 'Seminar' : 'SharingSession';
                const statusString = cls.status === 0 ? 'DRAFT' : cls.status === 1 ? 'PENDING' : cls.status === 2 ? 'PUBLISHED' : cls.status === 3 ? 'CANCELLED' : 'COMPLETED';

                return (
                  <div 
                    key={cls.id}
                    className="bg-white border border-slate-250/70 hover:border-slate-350 hover:shadow-xs rounded-2xl overflow-hidden transition-all flex flex-col justify-between group"
                  >
                    {/* Header Cover Image */}
                    <div className="h-28 w-full relative overflow-hidden bg-slate-100">
                      <img src={cls.coverImageUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=300&auto=format&fit=crop'} className="size-full object-cover group-hover:scale-101 transition-transform duration-500" alt={cls.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      
                      <span className={cn(
                        "absolute top-3 left-3 text-[7px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-lg text-white backdrop-blur-md",
                        "bg-indigo-600/85"
                      )}>
                        {formatString}
                      </span>

                      <span className={cn(
                        "absolute bottom-3 left-3 text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-lg text-white backdrop-blur-md",
                        statusString === 'PUBLISHED' ? "bg-emerald-600/85" : "bg-slate-650/85"
                      )}>
                        {statusString}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">{cls.skillName}</span>
                        <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1 leading-snug">{cls.title}</h4>
                        
                        <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-500 font-bold">
                          <Calendar className="size-3 text-slate-400" />
                          <span>{new Date(cls.startDate).toLocaleDateString()} • {new Date(cls.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>

                      {/* Footer ratings / launch button */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-650 font-bold">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <Star className="size-3 fill-current" />
                          <span>-</span>
                        </div>
                        
                        <span className="text-slate-400">
                          {cls.registeredCount}/{cls.maxParticipants || '∞'} Slots Taken
                        </span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button 
                          onClick={() => setActiveLaunchSession(cls)}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl text-[9px] uppercase tracking-widest cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="size-3" />
                          Launch Session
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

      </div>

      {/* 5. ONLINE / OFFLINE LAUNCH SESSION MODALS */}
      <AnimatePresence>
        {activeLaunchSession && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
            {activeLaunchSession.format === 'Online' ? (
              /* A. ONLINE MEETING LAUNCHER MODAL */
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 text-left"
              >
                <div className="size-16 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center mx-auto border border-indigo-100 animate-bounce">
                  <Video className="size-8 stroke-[2.5]" />
                </div>

                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Virtual Classroom Live!</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Your online training session for <strong>"{activeLaunchSession.title}"</strong> is successfully launched.
                  </p>
                </div>

                {/* Virtual Meeting Details */}
                <div className="p-4.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-left">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Meeting URL Platform</span>
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="size-2 bg-emerald-500 rounded-full animate-ping" />
                      {activeLaunchSession.formatDetail} (Zoom Meeting Room)
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value="https://zoom.us/j/9876543210?pwd=innergActive" 
                      className="flex-1 bg-white border border-slate-250 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-650 outline-none select-all" 
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText("https://zoom.us/j/9876543210?pwd=innergActive");
                        showToast("Zoom link copied to clipboard! 📋");
                      }}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl transition-colors cursor-pointer"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <a 
                    href="https://zoom.us/j/9876543210?pwd=innergActive"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      showToast("Redirecting to Zoom Classroom...");
                      setActiveLaunchSession(null);
                    }}
                    className="w-full bg-[#00C896] hover:brightness-105 active:scale-[0.98] text-[#0F1F3D] font-extrabold py-3.5 rounded-2xl text-[10px] uppercase tracking-widest cursor-pointer transition-all text-center flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ExternalLink className="size-4 stroke-[3]" />
                    Join Classroom as Host
                  </a>
                  <button 
                    onClick={() => setActiveLaunchSession(null)}
                    className="w-full bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 py-3 rounded-2xl text-[10px] uppercase tracking-widest cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Close & Keep Active
                  </button>
                </div>
              </motion.div>
            ) : (
              /* B. OFFLINE ROLL CALL & QR CODE CHECK-IN MODAL */
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 lg:p-8 max-w-3xl w-full shadow-2xl border border-slate-100 flex flex-col gap-6 text-left"
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <BookmarkCheck className="size-5.5 text-emerald-650" />
                      Offline Attendance Roll Call
                    </h3>
                    <p className="text-slate-500 text-xs leading-normal">
                      Class: <strong>"{activeLaunchSession.title}"</strong> ({activeLaunchSession.formatDetail})
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveLaunchSession(null)}
                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-650 rounded-lg cursor-pointer"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Left panel: Simulated QR Code */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-4 flex flex-col items-center">
                    <span className="inline-flex items-center gap-1.5 text-[8px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                      <span className="size-1.5 bg-rose-500 rounded-full animate-pulse" />
                      Live QR Code Check-in
                    </span>

                    {/* QR Code Container */}
                    <div className="size-40 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-center relative group">
                      <QrCode className="size-full text-slate-800 transition-opacity duration-300 group-hover:opacity-40" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <Scan className="size-8 text-indigo-650 animate-pulse" />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-455 max-w-[200px] leading-relaxed">
                      Mentees can scan this QR code with their mobile phone or check in instantly inside the InnerG app.
                    </p>
                  </div>

                  {/* Right panel: Manual roll call */}
                  <div className="space-y-4 flex flex-col h-full justify-between">
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Manual Attendance List</label>
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {rollCallList.map((student, sIdx) => (
                          <div 
                            key={sIdx}
                            onClick={() => toggleAttendance(sIdx)}
                            className={cn(
                              "p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center gap-3",
                              student.attended 
                                ? "bg-emerald-50/50 border-emerald-200 hover:border-emerald-350" 
                                : "bg-slate-50/40 border-slate-200/60 hover:border-slate-300"
                            )}
                          >
                            <div className="flex gap-2.5">
                              <img src={student.avatar} className="size-8 rounded-full object-cover border border-slate-200" alt={student.name} />
                              <div>
                                <p className="text-xs font-extrabold text-slate-800">{student.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold leading-none mt-0.5">{student.position}</p>
                              </div>
                            </div>

                            <span className={cn(
                              "px-2.5 py-1 rounded-lg text-[8px] font-extrabold uppercase tracking-wider transition-colors",
                              student.attended 
                                ? "text-emerald-700 bg-emerald-100" 
                                : "text-slate-400 bg-slate-100"
                            )}>
                              {student.attended ? "Attended" : "Absent"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50/50 to-indigo-50/50 p-3 rounded-xl border border-emerald-100/50 text-[10px] text-slate-650 font-bold leading-normal">
                      🎁 Confirming attendance will instantly distribute <strong>+{activeLaunchSession.points} points</strong> to all checked-in mentees.
                    </div>
                  </div>

                </div>

                {/* Footer confirm */}
                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button 
                    onClick={() => setActiveLaunchSession(null)}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-500 border border-slate-250 py-3 rounded-2xl text-[10px] uppercase tracking-widest cursor-pointer transition-all active:scale-[0.98] text-center"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmRollCall}
                    className="flex-1 bg-gradient-to-r from-[#00C896] to-[#00B083] hover:brightness-105 active:scale-[0.98] text-[#0F1F3D] font-extrabold py-3.5 rounded-2xl text-[10px] uppercase tracking-widest cursor-pointer transition-all shadow-sm"
                  >
                    Confirm & Distribute Points
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

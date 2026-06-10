import React, { useState, useEffect, useMemo, useRef } from 'react';
import { mentorApi } from '../../../api/mentorApi';
import { 
  BarChart3, BookOpen, Users, Star, Calendar, Clock, Check, X, 
  ChevronRight, Award, Sparkles, MapPin, Video, ExternalLink,
  Plus, Heart, Sliders, Settings2, BookmarkCheck, CheckCircle2, 
  QrCode, Scan, Copy, Edit2, Ban, Activity, Zap, TrendingUp, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { toastService } from '../../../services/toastService';
import ActionDialog from '../../../components/common/ActionDialog';

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [activeLaunchSession, setActiveLaunchSession] = useState(null);
  const [rollCallList, setRollCallList] = useState([]);
  const [isLoadingRollCall, setIsLoadingRollCall] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(null);

  // Fetch enrolled users when launching a session
  useEffect(() => {
    if (activeLaunchSession?.id) {
      const fetchRollCallList = async () => {
        setIsLoadingRollCall(true);
        try {
          const users = await mentorApi.getEnrolledUsersForSession(activeLaunchSession.id);
          setRollCallList(users);
        } catch (error) {
          showToast('Failed to load enrolled users for this session.');
          setRollCallList([]);
        } finally {
          setIsLoadingRollCall(false);
        }
      };
      fetchRollCallList();
    } else {
      setRollCallList([]);
    }
  }, [activeLaunchSession]);

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
  };

  const handleCancelClass = async (classId, classTitle) => {
    setCancelDialog({ classId, classTitle });
  };

  const confirmCancelClass = async () => {
    if (!cancelDialog) return;
    try {
      await mentorApi.cancelClass(cancelDialog.classId);
      showToast(`Successfully cancelled class "${cancelDialog.classTitle}" 🎉`);
      const classesRes = await mentorApi.getHostedClasses();
      setClasses(classesRes);
      setCancelDialog(null);
    } catch (error) {
      console.error('Failed to cancel class:', error);
      const errMsg = error.response?.data?.message || 'Failed to cancel class. Please try again.';
      showToast(errMsg);
    }
  };

  const getEventStatus = (status) => {
    if (status === 0 || status === 'Draft') return 'Draft';
    if (status === 1 || status === 'PendingApproval' || status === 'Pending') return 'PendingApproval';
    if (status === 2 || status === 'Published') return 'Published';
    if (status === 3 || status === 'Cancelled') return 'Cancelled';
    return 'Completed';
  };

  const getEventType = (type) => {
    if (type === 0 || type === 'Course') return 'Course';
    if (type === 1 || type === 'Workshop') return 'Workshop';
    if (type === 2 || type === 'Seminar') return 'Seminar';
    return 'SharingSession';
  };

  // Data States
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [classes, setClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [pendingApprovals, setPendingApprovals] = useState([]);

  const filteredClasses = useMemo(() => {
    if (activeTab === 'All') return classes;
    if (activeTab === 'Draft') return classes.filter(c => getEventStatus(c.status) === 'Draft');
    if (activeTab === 'Pending') return classes.filter(c => getEventStatus(c.status) === 'PendingApproval');
    if (activeTab === 'Published') return classes.filter(c => getEventStatus(c.status) === 'Published');
    if (activeTab === 'Cancelled') return classes.filter(c => getEventStatus(c.status) === 'Cancelled');
    if (activeTab === 'Completed') return classes.filter(c => getEventStatus(c.status) === 'Completed');
    return classes;
  }, [classes, activeTab]);

  const isMounted = useRef(true);

  // Fetch initial data
  useEffect(() => {
    isMounted.current = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [statsRes, classesRes, pendingRes] = await Promise.all([
          mentorApi.getDashboardStats(),
          mentorApi.getHostedClasses(),
          mentorApi.getPendingEnrollments()
        ]);
        if (!isMounted.current) return;
        setStats(statsRes);
        setClasses(classesRes);
        setPendingApprovals(pendingRes);
      } catch (error) {
        if (isMounted.current) {
          showToast('Failed to load dashboard data.');
        }
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted.current = false; };
  }, []);

  const handleApprovalAction = async (id, action, name) => {
    try {
      if (action === 'approve') {
        await mentorApi.approveEnrollment(id);
        showToast(`Approved registration for ${name}! 🎉`);
        const classesRes = await mentorApi.getHostedClasses();
        setClasses(classesRes);
      } else {
        await mentorApi.rejectEnrollment(id);
        showToast(`Declined registration request from ${name}.`);
      }
      setPendingApprovals(prev => prev.filter(item => item.enrollmentId !== id));
    } catch (error) {
      showToast(`Failed to ${action} enrollment.`);
    }
  };

  const handleConfirmRollCall = async () => {
    if (!activeLaunchSession?.id) return;
    const attendedIds = rollCallList.filter(s => s.attended).map(s => s.id);
    try {
      await mentorApi.submitRollCall(activeLaunchSession.id, attendedIds, "Roll call note");
      showToast(`Roll call success! Awarded points to ${attendedIds.length} attendees! 🎁`);
      setActiveLaunchSession(null);
    } catch (error) {
      showToast('Failed to submit roll call.');
    }
  };

  return (
    <>
    <div className="min-h-screen bg-[#FAFAFC] font-sans pb-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8 space-y-8">
        
        {/* 1. HERO & BENTO STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Hero Banner (Spans 3 cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 md:p-10 shadow-2xl shadow-slate-900/10 flex flex-col justify-between min-h-[280px]"
          >
            {/* Mesh Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/40 via-purple-500/20 to-transparent mix-blend-overlay"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-[100px]"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-bold mb-4">
                  <Sparkles className="size-3.5" /> Welcome to your workspace
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  Shape the future,<br />one class at a time.
                </h1>
                <p className="text-slate-300 font-medium text-sm md:text-base mt-2 max-w-md leading-relaxed">
                  You have {pendingApprovals.length} pending requests and {classes.filter(c => getEventStatus(c.status) === 'Published').length} active classes. Let's make an impact today.
                </p>
              </div>
              
              <div className="mt-8 flex items-center gap-4">
                <button 
                  onClick={() => navigate('/mentor/create')}
                  className="bg-white hover:bg-slate-50 text-slate-900 font-extrabold px-6 py-3.5 rounded-2xl text-[13px] transition-all active:scale-[0.98] shadow-xl shadow-white/10 flex items-center gap-2"
                >
                  <Plus className="size-4.5" /> Host New Class
                </button>
              </div>
            </div>
            
            {/* Decorative SVG */}
            <div className="absolute bottom-0 right-0 p-8 opacity-20 pointer-events-none hidden md:block">
              <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          </motion.div>

          {/* Primary Bento Stat (Spans 1 col) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 bg-white border border-slate-200/60 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-center min-h-[280px]"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="size-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/20">
                <Zap className="size-6" />
              </div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Available Points</p>
              {isLoading ? (
                <div className="h-12 w-24 bg-slate-100 animate-pulse rounded-lg mt-2"></div>
              ) : (
                <>
                  <p className="text-5xl font-black text-slate-900 tracking-tight">{stats?.currentPoints || 0}</p>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[11px] font-bold">
                    <TrendingUp className="size-3.5" /> +15% vs last month
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* 2. SECONDARY STATS (3 items) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Classes Taught', value: stats?.totalClassesTaught || 0, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50', gradient: 'from-blue-500/10 to-transparent' },
            { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50', gradient: 'from-emerald-500/10 to-transparent' },
            { label: 'Average Rating', value: stats?.averageRating?.toFixed(1) || '0.0', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', gradient: 'from-amber-500/10 to-transparent', suffix: <Star className="size-5 fill-amber-500 text-amber-500 inline-block ml-1" /> }
          ].map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-100", stat.gradient)}></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  {isLoading ? (
                    <div className="h-8 w-16 bg-slate-100 animate-pulse rounded"></div>
                  ) : (
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-black text-slate-800">{stat.value}</p>
                      {stat.suffix}
                    </div>
                  )}
                </div>
                <div className={cn("size-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                  <stat.icon className="size-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 3. MAIN WORKSPACE (2 COLUMNS) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start pt-4">
          
          {/* LEFT: CLASSES DATA TABLE */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="size-5 text-slate-400" />
                Class Directory
              </h3>
              
              {/* Glassy Tabs */}
              <div className="hidden md:flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl">
                {['All', 'Draft', 'Pending', 'Published'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[11px] font-extrabold transition-all",
                      activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile tabs */}
            <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['All', 'Draft', 'Pending', 'Published', 'Cancelled', 'Completed'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[11px] font-extrabold whitespace-nowrap border transition-all",
                    activeTab === tab ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Seamless List (Table-like) */}
            <div className="bg-white border border-slate-200/60 rounded-[2rem] shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="divide-y divide-slate-100">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-5 flex gap-4 animate-pulse">
                      <div className="size-14 rounded-2xl bg-slate-100"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="size-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">No classes found in this category.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredClasses.map((cls) => {
                    const isDraft = getEventStatus(cls.status) === 'Draft';
                    const isPending = getEventStatus(cls.status) === 'PendingApproval';
                    const isPublished = getEventStatus(cls.status) === 'Published';
                    const isCancelled = getEventStatus(cls.status) === 'Cancelled';
                    const isCompleted = getEventStatus(cls.status) === 'Completed';

                    const isFormatCourse = cls.type === 0 || cls.type === 'Course';

                    return (
                      <div key={cls.id} className="p-5 md:p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center gap-5 group">
                        
                        {/* Class Info */}
                        <div className="flex items-center gap-5 flex-1 min-w-0">
                          <div className="size-14 rounded-2xl overflow-hidden shrink-0 border border-slate-200/60 relative bg-white shadow-sm">
                            <img src={cls.coverImageUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=300&auto=format&fit=crop'} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                          </div>
                          <div className="min-w-0 space-y-1.5">
                            <h4 className="text-sm font-extrabold text-slate-900 truncate" title={cls.title}>{cls.title}</h4>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md",
                                isDraft ? "bg-slate-100 text-slate-500" :
                                isPending ? "bg-amber-50 text-amber-600" :
                                isPublished ? "bg-emerald-50 text-emerald-600" :
                                isCancelled ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"
                              )}>
                                {isDraft ? 'DRAFT' : isPending ? 'PENDING' : isPublished ? 'ACTIVE' : isCancelled ? 'CANCELLED' : 'COMPLETED'}
                              </span>
                              <span className="text-[10px] text-slate-300">•</span>
                              <span className="text-[10px] font-bold text-slate-400 truncate">{cls.skillName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center gap-8 text-[11px] font-bold text-slate-500 shrink-0 md:w-56">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5"><Calendar className="size-3.5 text-slate-400" /> {new Date(cls.startDate).toLocaleDateString()}</div>
                            <div className="flex items-center gap-1.5"><Clock className="size-3.5 text-slate-400" /> {new Date(cls.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          </div>
                          <div className="space-y-1.5 w-24">
                            <div className="flex justify-between">
                              <span className="flex items-center gap-1"><Users className="size-3.5 text-slate-400"/></span>
                              <span>{cls.registeredCount}/{cls.maxParticipants || '∞'}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
                              <div className="h-full bg-slate-800 rounded-full" style={{ width: `${Math.min((cls.registeredCount / (cls.maxParticipants || 1)) * 100, 100)}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 shrink-0 md:w-32">
                          {(isDraft || isPending) && (
                            <>
                              <button onClick={() => navigate(`/mentor/edit/${cls.id}`)} className="size-9 flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-sm hover:shadow" title="Edit">
                                <Edit2 className="size-4" />
                              </button>
                              {isPending && (
                                <button onClick={() => handleCancelClass(cls.id, cls.title)} className="size-9 flex items-center justify-center bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm hover:shadow" title="Cancel">
                                  <Ban className="size-4" />
                                </button>
                              )}
                            </>
                          )}
                          {isPublished && (() => {
                            const now = new Date();
                            const start = new Date(cls.startDate);
                            const end = new Date(cls.endDate);
                            const isPast = now > end;
                            const isFuture = now < new Date(start.getTime() - 30 * 60 * 1000);

                            if (isPast) return <span className="text-[10px] font-bold text-slate-400 px-3 py-1.5 bg-slate-50 rounded-lg">Ended</span>;
                            if (isFuture) return (
                              <>
                                <button onClick={() => navigate(`/mentor/edit/${cls.id}`)} className="size-9 flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-sm">
                                  <Edit2 className="size-4" />
                                </button>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl">Upcoming</span>
                              </>
                            );
                            return (
                              <button onClick={() => setActiveLaunchSession(cls)} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 w-full md:w-auto justify-center">
                                <ExternalLink className="size-3.5" /> Launch
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: INBOX / ACTION ITEMS */}
          <div className="xl:col-span-1 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Activity className="size-5 text-slate-400" />
                Inbox
              </h3>
              {pendingApprovals.length > 0 && (
                <span className="size-6 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-sm shadow-rose-500/30">
                  {pendingApprovals.length}
                </span>
              )}
            </div>

            <div className="bg-white border border-slate-200/60 rounded-[2rem] p-5 shadow-sm">
              <div className="space-y-3">
                {isLoading ? (
                  [1, 2].map(i => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl flex gap-3 animate-pulse">
                      <div className="size-10 rounded-full bg-slate-200 shrink-0"></div>
                      <div className="space-y-2 flex-1 pt-1">
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))
                ) : pendingApprovals.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="size-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="size-7 text-emerald-500" />
                    </div>
                    <p className="text-sm font-extrabold text-slate-800">You're all caught up!</p>
                    <p className="text-xs text-slate-500">No pending requests at the moment.</p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {pendingApprovals.map((req) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={req.enrollmentId} 
                        className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all group"
                      >
                        <div className="flex gap-3 mb-4">
                          <img src={req.menteeAvatar || 'https://ui-avatars.com/api/?name=User'} className="size-10 rounded-full object-cover border border-slate-200" alt="" />
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-slate-900 truncate">{req.menteeName}</p>
                            <p className="text-[10px] font-bold text-slate-400 truncate">{req.jobTitle || 'Member'}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100/50">
                          <p className="text-[10px] font-bold text-slate-500 mb-1">Requested to join:</p>
                          <p className="text-[11px] font-extrabold text-slate-800 line-clamp-2">{req.eventTitle}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApprovalAction(req.enrollmentId, 'decline', req.menteeName)}
                            className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 rounded-xl text-[11px] font-extrabold transition-all"
                          >
                            Decline
                          </button>
                          <button 
                            onClick={() => handleApprovalAction(req.enrollmentId, 'approve', req.menteeName)}
                            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-extrabold transition-all shadow-md shadow-slate-900/10"
                          >
                            Approve
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    {/* Modals remain mostly similar but can inherit the styling later */}
    {/* Launch Modal */}
    <AnimatePresence>
        {activeLaunchSession && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 text-left"
              >
                <div className="size-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto border border-indigo-100 animate-bounce">
                  <Video className="size-8 stroke-[2.5]" />
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Virtual Classroom Live!</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Session <strong>"{activeLaunchSession.title}"</strong> is successfully launched.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-left">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value="https://zoom.us/j/9876543210?pwd=innergActive" 
                      className="flex-1 bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 outline-none" 
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText("https://zoom.us/j/9876543210?pwd=innergActive");
                        showToast("Link copied!");
                      }}
                      className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    onClick={() => setActiveLaunchSession(null)}
                    className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-3.5 rounded-2xl text-[11px] font-extrabold uppercase tracking-widest transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
          </div>
        )}
    </AnimatePresence>

    <ActionDialog
      open={Boolean(cancelDialog)}
      title="Cancel Class"
      description="This will cancel the selected class."
      details={cancelDialog ? cancelDialog.classTitle : null}
      confirmLabel="Cancel class"
      intent="danger"
      onClose={() => setCancelDialog(null)}
      onConfirm={confirmCancelClass}
    />
    </>
  );
}

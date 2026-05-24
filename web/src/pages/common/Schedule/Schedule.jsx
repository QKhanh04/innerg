import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  Check, 
  X, 
  AlertCircle, 
  RefreshCw, 
  Users, 
  Tv, 
  Moon, 
  ChevronRight, 
  Star, 
  ArrowRight,
  TrendingUp,
  BookmarkCheck,
  CheckCircle2,
  CalendarDays,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useRole } from '../../../lib/RoleContext';

export default function SchedulePage() {
  const { role, user } = useRole();
  const [viewMode, setViewMode] = useState('week'); // week, month
  const [schedulerBannerVisible, setSchedulerBannerVisible] = useState(true);
  const [conflictResolved, setConflictResolved] = useState(false);
  const [resolvingConflict, setResolvingConflict] = useState(false);
  const [toast, setToast] = useState(null);

  // Dynamic Navigation Offsets
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = prev week, +1 = next week
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month, -1 = prev month, +1 = next month

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleResolveConflict = () => {
    setResolvingConflict(true);
    setTimeout(() => {
      setConflictResolved(true);
      setResolvingConflict(false);
      showToast("Conflict auto-resolved using AI Smart-Scheduler! 🚀");
    }, 1500);
  };

  const handleScheduleNow = () => {
    setSchedulerBannerVisible(false);
    showToast("Event successfully scheduled for dynamic time slot! 🎉");
  };

  // ==========================================
  // DYNAMIC REAL-TIME CALENDAR COMPUTATION
  // ==========================================
  const today = new Date();

  // Calculate Monday of the targeted calendar week (influenced by weekOffset)
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    // Adjust diff to find the Monday of the week, plus the offset of weeks
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7); 
    return new Date(date.setDate(diff));
  };

  const monday = getMonday(today);

  // Generate 5 week days dynamically based on the actual system clock and weekOffset
  const weekDays = Array.from({ length: 5 }, (_, idx) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + idx);
    
    const isSameDayAsToday = 
      dayDate.getDate() === today.getDate() &&
      dayDate.getMonth() === today.getMonth() &&
      dayDate.getFullYear() === today.getFullYear();

    const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    
    return {
      key: labels[idx].toLowerCase(),
      label: labels[idx],
      date: String(dayDate.getDate()),
      fullDate: dayDate,
      isToday: isSameDayAsToday
    };
  });

  // Format week range label (e.g. "May 18 – May 22, 2026")
  const firstDayOfWeekStr = weekDays[0].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const lastDayOfWeekStr = weekDays[4].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const weekRangeStr = `${firstDayOfWeekStr} – ${lastDayOfWeekStr}`;

  const timeSlots = ['08:00 AM', '10:00 AM', '02:00 PM', '03:00 PM'];

  // Map events to the relative week days of the current calendar week
  const calendarEvents = {
    'mon-08:00 AM': { type: 'UPCOMING', title: 'Morning Alignment', tagColor: 'text-[#3B82F6]', borderClass: 'border-l-[#3B82F6]', bgClass: 'bg-white' },
    'mon-02:00 PM': { type: 'TEACHING', title: 'Prenatal Yoga Core', tagColor: 'text-[#10B981]', borderClass: 'border-l-[#10B981]', bgClass: 'bg-white' },
    'tue-10:00 AM': { type: 'UPCOMING', title: 'Vinyasa Flow', tagColor: 'text-[#3B82F6]', borderClass: 'border-l-[#3B82F6]', bgClass: 'bg-white' },
    'wed-08:00 AM': { type: 'TEACHING', title: 'Intermediate Hatha', tagColor: 'text-[#10B981]', borderClass: 'border-l-[#10B981]', bgClass: 'bg-white' },
    'wed-02:00 PM': { type: 'UPCOMING', title: 'Sound Healing Bath', tagColor: 'text-[#3B82F6]', borderClass: 'border-l-[#3B82F6]', bgClass: 'bg-white', hasAlert: !conflictResolved },
    'wed-03:00 PM': schedulerBannerVisible ? null : { type: 'SCHEDULED', title: 'Advanced React', tagColor: 'text-[#6366F1]', borderClass: 'border-l-[#6366F1]', bgClass: 'bg-white' },
    'thu-10:00 AM': { type: 'TEACHING', title: 'Beginner Asanas', tagColor: 'text-[#10B981]', borderClass: 'border-l-[#10B981]', bgClass: 'bg-white' },
    'fri-08:00 AM': { type: 'COMPLETED', title: 'Early Meditation', tagColor: 'text-[#64748B]', borderClass: 'border-l-[#64748B]', bgClass: 'bg-white' },
    'fri-02:00 PM': { type: 'UPCOMING', title: 'Yin Yoga Special', tagColor: 'text-[#3B82F6]', borderClass: 'border-l-[#3B82F6]', bgClass: 'bg-white' }
  };

  const upcomingClasses = [
    { icon: Users, title: 'Advanced Vinyasa', time: '04:30 PM • 60 mins', count: '3 TODAY', type: 'today' },
    { icon: Tv, title: 'Breathwork 101', time: '06:00 PM • 30 mins' },
    { icon: Moon, title: 'Night Meditation', time: '09:00 PM • 15 mins' }
  ];

  const pendingRequests = [
    { title: 'Product Strategy 101', requester: 'THU HA (PM)', badge: 'NORMAL', count: '+5 interested' }
  ];

  const completedClasses = [
    { image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=300&auto=format&fit=crop', title: 'Power Yoga Core', when: 'Yesterday • 45 mins', rating: '4.9' },
    { image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=300&auto=format&fit=crop', title: 'Zen Stillness', when: '2 days ago • 20 mins', rating: '5.0' },
    { image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=300&auto=format&fit=crop', title: 'Restorative Pilates', when: '3 days ago • 60 mins', rating: '4.8' },
    { image: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?q=80&w=300&auto=format&fit=crop', title: 'Gentle Flow', when: '4 days ago • 50 mins', rating: '4.9' }
  ];

  // ==========================================
  // DYNAMIC MONTH COMPUTATIONS (WITH OFFSET)
  // ==========================================
  const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const currentYear = targetDate.getFullYear();
  const currentMonth = targetDate.getMonth(); // 0-11
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Generate days in month grid dynamically (handling prev/next padding days)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0: Sun, 1: Mon...
  const prevMonthPaddingCount = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
  
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  const monthDays = [];
  
  // Prev month padding
  for (let i = prevMonthPaddingCount - 1; i >= 0; i--) {
    monthDays.push({
      dayNumber: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateStr: 'prev'
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    const isSameDay = 
      i === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();
      
    monthDays.push({
      dayNumber: i,
      isCurrentMonth: true,
      isToday: isSameDay,
      dateStr: 'current'
    });
  }
  
  // Next month padding
  const totalCells = monthDays.length <= 35 ? 35 : 42;
  const nextMonthPaddingCount = totalCells - monthDays.length;
  for (let i = 1; i <= nextMonthPaddingCount; i++) {
    monthDays.push({
      dayNumber: i,
      isCurrentMonth: false,
      dateStr: 'next'
    });
  }

  // Event distribution map based on fixed days of the month for visual perfection in any month view
  const monthEvents = {
    3: [{ title: 'Intro Seminar', bg: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20' }],
    7: [{ title: 'Design Systems', bg: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20' }],
    10: [{ title: 'C# Refactoring', bg: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' }],
    14: [{ title: 'Amplitude Growth', bg: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' }],
    17: [{ title: 'Stakeholder Comm', bg: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20' }],
    21: [
      { title: 'Morning Align', bg: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20' },
      { title: 'Prenatal Yoga', bg: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' }
    ],
    22: [{ title: 'Vinyasa Flow', bg: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20' }],
    23: [
      { title: 'Intermediate Hatha', bg: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' },
      { title: 'Sound Healing Bath', bg: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20', hasAlert: !conflictResolved },
      ...(schedulerBannerVisible ? [] : [{ title: 'Advanced React', bg: 'bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20' }])
    ],
    24: [{ title: 'Beginner Asanas', bg: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' }],
    25: [
      { title: 'Early Meditation', bg: 'bg-slate-100 text-slate-500 border-slate-200/50' },
      { title: 'Yin Yoga Special', bg: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20' }
    ],
    28: [{ title: 'Performance Audit', bg: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20' }]
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-16">
      
      {/* 1. AI SMART-SCHEDULER BANNER */}
      <AnimatePresence>
        {schedulerBannerVisible && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#0d2a4e] rounded-3xl p-6 shadow-xl border border-slate-800/80 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            {/* Ambient Background Light */}
            <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#00C896]/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="size-12 rounded-2xl bg-[#00C896]/10 text-[#00C896] border border-[#00C896]/20 flex items-center justify-center shrink-0 shadow-[0_0_18px_rgba(0,200,150,0.12)]">
                <Sparkles className="size-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-[#00C896] text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                  AI Smart-Scheduler suggestion
                </p>
                <p className="text-slate-200 text-xs lg:text-sm leading-relaxed font-semibold">
                  Based on <span className="font-extrabold text-white">12 Mentees</span> and <span className="font-extrabold text-white">Mentor Minh Dang</span>'s availability, the optimal time for <span className="text-[#00C896] font-extrabold underline cursor-pointer">Advanced React</span> is <span className="font-extrabold text-white">Wed, 03:00 PM</span>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 relative z-10">
              <button 
                onClick={handleScheduleNow}
                className="bg-gradient-to-r from-[#00C896] to-[#00B083] hover:brightness-105 active:scale-[0.98] text-[#0F1F3D] font-extrabold px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-[#00C896]/15"
              >
                Schedule Now
              </button>
              <button 
                onClick={() => setSchedulerBannerVisible(false)}
                className="bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white font-extrabold px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all border border-white/10 cursor-pointer"
              >
                Ignore
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. TITLE BAR */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">My Schedule</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-400 text-xs font-semibold">Manage your personal and company-wide sessions</span>
            <span className="h-3.5 w-px bg-slate-250 hidden sm:block" />
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-extrabold uppercase tracking-widest text-[9px] bg-emerald-50/60 px-2.5 py-1 rounded-lg border border-emerald-500/10">
              <span className="size-1.5 bg-emerald-500 rounded-full animate-ping" />
              LIVE SYNC ACTIVE
            </span>
          </div>
        </div>

        {/* WEEK / MONTH SWITCHER */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-[20px] border border-slate-200/30 backdrop-blur-sm self-start sm:self-auto shrink-0 shadow-inner">
          <button 
            onClick={() => setViewMode('week')}
            className={cn(
              "px-6 py-2.5 rounded-2xl text-xs font-extrabold transition-all uppercase tracking-widest cursor-pointer",
              viewMode === 'week' 
                ? "bg-white text-slate-800 shadow-md shadow-slate-200/50 border border-slate-100" 
                : "text-slate-450 hover:text-slate-800"
            )}
          >
            Week
          </button>
          <button 
            onClick={() => setViewMode('month')}
            className={cn(
              "px-6 py-2.5 rounded-2xl text-xs font-extrabold transition-all uppercase tracking-widest cursor-pointer",
              viewMode === 'month' 
                ? "bg-white text-slate-800 shadow-md shadow-slate-200/50 border border-slate-100" 
                : "text-slate-455 hover:text-slate-800"
            )}
          >
            Month
          </button>
        </div>
      </div>

      {/* 3. CALENDAR + SIDEBAR GRID */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT: Calendar Grid Container (70%) */}
        <div className="flex-[0.70] bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            
            {viewMode === 'week' ? (
              <motion.div
                key="week-view-grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="overflow-x-auto min-w-[700px] space-y-4"
              >
                
                {/* Week Navigator Sub-Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                  <h3 className="font-extrabold text-slate-800 text-base tracking-tight">
                    {weekRangeStr}
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setWeekOffset(prev => prev - 1);
                        showToast("Moved to previous week");
                      }} 
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      &lt; Prev Week
                    </button>
                    <button 
                      onClick={() => {
                        setWeekOffset(0);
                        showToast("Back to current week");
                      }} 
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-[#00C896] border border-[#00C896]/20 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      Today
                    </button>
                    <button 
                      onClick={() => {
                        setWeekOffset(prev => prev + 1);
                        showToast("Moved to next week");
                      }} 
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-655 border border-slate-200/80 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      Next Week &gt;
                    </button>
                  </div>
                </div>

                {/* 6-Column Grid Header */}
                <div className="grid grid-cols-[100px_repeat(5,_1fr)] gap-4 items-center pb-4 border-b border-slate-100">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-2">Time</div>
                  {weekDays.map((day, idx) => (
                    <div key={idx} className="flex justify-center">
                      <div className={cn(
                        "flex flex-col items-center py-2 px-4 rounded-[20px] w-24 transition-all",
                        day.isToday 
                          ? "bg-[#e6faf4] text-[#00C896] border border-[#00C896]/20 font-extrabold" 
                          : "text-slate-500"
                      )}>
                        <span className="text-[9px] font-extrabold tracking-widest leading-none mb-1">{day.label}</span>
                        <span className="text-lg font-extrabold leading-none">{day.date}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grid Rows */}
                <div className="space-y-4 pt-2">
                  {timeSlots.map((time, rowIdx) => (
                    <div key={rowIdx} className="grid grid-cols-[100px_repeat(5,_1fr)] gap-4 items-center">
                      
                      {/* Fixed Time Column Cell */}
                      <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-tight pl-2">
                        {time}
                      </div>

                      {/* Day Column Cells */}
                      {weekDays.map((day, colIdx) => {
                        const eventKey = `${day.key}-${time}`;
                        const event = calendarEvents[eventKey];
                        const isAiRecommendedCell = day.key === 'wed' && time === '03:00 PM' && schedulerBannerVisible;

                        return (
                          <div key={colIdx} className="w-full">
                            {event ? (
                              <motion.div 
                                whileHover={{ y: -2, scale: 1.01 }}
                                onClick={() => showToast(`Selected "${event.title}"`)}
                                className={cn(
                                  "p-3.5 rounded-[20px] border-l-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-slate-200/50 hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:border-slate-350 transition-all cursor-pointer h-[78px] flex flex-col justify-between relative group",
                                  event.bgClass, event.borderClass
                                )}
                              >
                                <div className="space-y-0.5">
                                  <span className={cn(
                                    "text-[9px] font-extrabold uppercase tracking-widest block leading-none",
                                    event.tagColor
                                  )}>
                                    {event.type}
                                  </span>
                                  <p className="text-xs font-extrabold text-slate-800 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                    {event.title}
                                  </p>
                                </div>
                                {event.hasAlert && (
                                  <span className="absolute top-3.5 right-3.5 size-2 bg-rose-500 rounded-full border border-white animate-pulse shadow-sm shadow-rose-500" />
                                )}
                              </motion.div>
                            ) : isAiRecommendedCell ? (
                              <motion.div 
                                whileHover={{ scale: 1.01 }}
                                onClick={handleScheduleNow}
                                className="p-3.5 rounded-[20px] border border-dashed border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/40 text-left h-[78px] flex flex-col justify-between cursor-pointer group transition-all"
                              >
                                <div className="space-y-0.5">
                                  <span className="text-[#6366F1] text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1 leading-none">
                                    <Sparkles className="size-2.5 animate-spin" /> AI RECOMMENDED
                                  </span>
                                  <p className="text-xs font-extrabold text-indigo-900 group-hover:underline leading-snug">
                                    Advanced React
                                  </p>
                                </div>
                              </motion.div>
                            ) : (
                              <div className="border border-dashed border-slate-200 bg-[#FAFBFC]/30 rounded-[20px] h-[78px] transition-all hover:bg-[#FAFBFC]/60 hover:border-slate-300 cursor-pointer" />
                            )}
                          </div>
                        );
                      })}

                    </div>
                  ))}
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="month-view-grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Month Navigation Control Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setMonthOffset(prev => prev - 1);
                        showToast("Moved to previous month");
                      }} 
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      &lt; Prev
                    </button>
                    <button 
                      onClick={() => {
                        setMonthOffset(0);
                        showToast("Back to current month");
                      }} 
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-[#00C896] border border-[#00C896]/20 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      This Month
                    </button>
                    <button 
                      onClick={() => {
                        setMonthOffset(prev => prev + 1);
                        showToast("Moved to next month");
                      }} 
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      Next &gt;
                    </button>
                  </div>
                </div>

                {/* Days of Week Header Grid */}
                <div className="grid grid-cols-7 gap-3 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div className="text-slate-300">Sat</div>
                  <div className="text-slate-300">Sun</div>
                </div>

                {/* 35/42-Day Dynamic Grid */}
                <div className="grid grid-cols-7 gap-3">
                  {monthDays.map((day, idx) => {
                    const dayEvts = monthEvents[day.dayNumber] && day.isCurrentMonth ? monthEvents[day.dayNumber] : [];
                    return (
                      <div 
                        key={idx}
                        className={cn(
                          "min-h-[110px] rounded-2xl border p-2.5 flex flex-col justify-between transition-all",
                          day.isCurrentMonth 
                            ? "bg-white border-slate-200/50 hover:border-slate-300 shadow-xs" 
                            : "bg-slate-50/50 border-slate-100/50 opacity-40 select-none pointer-events-none",
                          day.isToday && "ring-2 ring-emerald-500/20 border-emerald-500/30 shadow-[0_4px_12px_rgba(0,200,150,0.06)]"
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <span className={cn(
                            "text-xs font-extrabold",
                            day.isToday 
                              ? "size-6 bg-emerald-500 text-white rounded-full flex items-center justify-center font-extrabold shadow-sm shadow-emerald-500/20" 
                              : day.isCurrentMonth ? "text-slate-700" : "text-slate-400"
                          )}>
                            {day.dayNumber}
                          </span>
                        </div>

                        <div className="flex-1 mt-2 space-y-1 overflow-y-auto max-h-[70px] custom-scrollbar">
                          {dayEvts.map((evt, eIdx) => (
                            <div 
                              key={eIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                showToast(`Selected "${evt.title}"`);
                              }}
                              className={cn(
                                "text-[9px] font-extrabold px-1.5 py-1 rounded-lg truncate border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]",
                                evt.bg
                              )}
                              title={evt.title}
                            >
                              <span className="truncate">{evt.title}</span>
                              {evt.hasAlert && <span className="size-1.5 bg-rose-500 rounded-full animate-pulse shrink-0 ml-1" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Stats and Integration Sidebar (30%) */}
        <div className="flex-[0.30] space-y-8">
          
          {/* A. UPCOMING CLASSES */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Upcoming Classes</h3>
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-extrabold uppercase tracking-widest rounded-lg">
                3 TODAY
              </span>
            </div>
            
            <div className="space-y-4">
              {upcomingClasses.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3.5 bg-slate-50/60 hover:bg-slate-50 rounded-2xl border border-slate-100/60 hover:border-slate-200 transition-all duration-300 group cursor-pointer">
                  <div className="size-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50 flex items-center justify-center shrink-0">
                    <item.icon className="size-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-slate-800 group-hover:text-primary transition-colors truncate">{item.title}</p>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">{item.time}</p>
                  </div>
                  <ChevronRight className="size-4 text-slate-355 group-hover:text-slate-655 group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            </div>
          </div>

          {/* B. PENDING REQUESTS */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Pending Requests</h3>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[9px] font-extrabold uppercase tracking-widest rounded-lg">
                4 NEW
              </span>
            </div>

            <div className="space-y-4">
              {pendingRequests.map((item, idx) => (
                <div key={idx} className="p-4.5 bg-slate-50/60 rounded-2xl border border-slate-100/60 relative group overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 group-hover:text-primary transition-colors leading-tight">{item.title}</p>
                      <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-1 tracking-wider">REQUESTED BY {item.requester}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[8px] font-extrabold uppercase tracking-widest">
                      {item.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-1 border-t border-slate-100/60">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      <img src="https://i.pravatar.cc/100?u=1" className="inline-block size-5 rounded-full ring-2 ring-white object-cover" />
                      <img src="https://i.pravatar.cc/100?u=2" className="inline-block size-5 rounded-full ring-2 ring-white object-cover" />
                      <img src="https://i.pravatar.cc/100?u=3" className="inline-block size-5 rounded-full ring-2 ring-white object-cover" />
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* C. EXTERNAL SYNC */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="size-4.5 text-[#00C896] animate-spin" />
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">External Sync</h3>
            </div>

            <div className="space-y-3">
              {/* Google Calendar */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100/60">
                <div className="flex items-center gap-3">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="size-5 shrink-0" alt="Google Calendar" />
                  <div>
                    <p className="font-extrabold text-xs text-slate-800">Google Calendar</p>
                    <p className="text-[8px] text-emerald-600 font-extrabold uppercase tracking-wider mt-0.5">CONNECTED</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100/40 text-emerald-655 rounded-md text-[8px] font-extrabold tracking-widest uppercase">
                  Active
                </span>
              </div>

              {/* Outlook Calendar */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100/60 opacity-60">
                <div className="flex items-center gap-3">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" className="size-5 shrink-0" alt="Outlook Calendar" />
                  <div>
                    <p className="font-extrabold text-xs text-slate-800">Outlook Calendar</p>
                    <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">DISCONNECTED</p>
                  </div>
                </div>
                <button 
                  onClick={() => showToast("Connecting to Outlook Calendar...")}
                  className="px-2 py-1 border border-slate-200 hover:border-slate-350 text-slate-500 rounded-md text-[8px] font-extrabold tracking-widest uppercase bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Connect
                </button>
              </div>
            </div>

            {/* Conflict Detected Alert Card */}
            <AnimatePresence>
              {!conflictResolved && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-2xl bg-amber-50 border border-amber-100/60 space-y-3 shadow-xs"
                >
                  <div className="flex items-start gap-2.5 text-amber-700">
                    <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-500" />
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-extrabold uppercase tracking-widest">CONFLICT DETECTED</p>
                      <p className="text-[11px] font-bold leading-normal text-amber-800">
                        Your "Vinyasa Mastery" overlaps with an external "Product Review" on Google Calendar.
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={handleResolveConflict}
                    disabled={resolvingConflict}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 active:scale-[0.98] text-white py-2.5 rounded-xl font-extrabold text-[10px] uppercase tracking-widest transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {resolvingConflict ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" /> Resolving...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3.5" /> Auto-Resolve with AI
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* 4. COMPLETED CLASSES */}
      <section className="space-y-5 pt-8 border-t border-slate-200/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Completed Classes</h2>
          <button 
            onClick={() => showToast("Navigating to full history...")}
            className="text-xs font-extrabold text-[#00C896] hover:underline cursor-pointer flex items-center gap-1"
          >
            View All History <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {completedClasses.map((item, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -4 }}
              className="bg-white rounded-[24px] overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group cursor-pointer"
            >
              <div className="h-40 w-full relative overflow-hidden bg-slate-150">
                <img src={item.image} className="size-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <h4 className="text-sm font-extrabold text-slate-800 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                    {item.when}
                  </span>
                  <div className="flex items-center gap-1 font-extrabold text-amber-500 text-xs">
                    <Star className="size-3.5 fill-current" />
                    <span>{item.rating}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ left: '50%', translateX: '-50%' }}
            className="fixed bottom-10 z-[200] px-6 py-4 bg-slate-900/95 backdrop-blur-sm text-white rounded-2xl shadow-2xl font-extrabold text-xs flex items-center gap-3 border border-slate-800"
          >
            <div className="size-6 bg-[#00C896] rounded-full flex items-center justify-center text-[#0F1F3D] shrink-0 shadow-[0_0_8px_#00C896]">
              <Check className="size-4 stroke-[2.5]" />
            </div>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
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
import api from '../../../api/axios';
import { useGoogleLogin } from '@react-oauth/google';
import { toastService } from '../../../services/toastService';

export default function SchedulePage() {
  const { role, user } = useRole();
  const [viewMode, setViewMode] = useState('week'); // week, month
  const [schedulerBannerVisible, setSchedulerBannerVisible] = useState(true);
  const [conflictResolved, setConflictResolved] = useState(false);
  const [resolvingConflict, setResolvingConflict] = useState(false);

  // API Integration States
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [googleSync, setGoogleSync] = useState({ isConnected: false, lastSyncedAt: null, email: null });
  const [syncingGoogleAction, setSyncingGoogleAction] = useState(false);

  // Dynamic Navigation Offsets
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = prev week, +1 = next week
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month, -1 = prev month, +1 = next month

  const [currentHourSlot, setCurrentHourSlot] = useState('');
  
  // Real-time Red Line positions matching Image 1
  const [showRedLine, setShowRedLine] = useState(false);
  const [redLineTop, setRedLineTop] = useState(0);
  const [redLineDotLeft, setRedLineDotLeft] = useState(null);

  // ==========================================
  // DYNAMIC REAL-TIME CALENDAR COMPUTATION (MOVED TO TOP FOR SAFE HOISTING)
  // ==========================================
  const today = new Date();

  // Calculate Monday of the targeted calendar week (influenced by weekOffset)
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7); 
    const result = new Date(date.setDate(diff));
    result.setHours(0, 0, 0, 0); // Reset to exact midnight of Monday local time to avoid event cutoff
    return result;
  };

  const monday = getMonday(today);

  // Generate 7 week days dynamically based on the actual system clock and weekOffset (Monday to Sunday)
  const weekDays = React.useMemo(() => {
    const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return Array.from({ length: 7 }, (_, idx) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + idx);
      
      const isSameDayAsToday = 
        dayDate.getDate() === today.getDate() &&
        dayDate.getMonth() === today.getMonth() &&
        dayDate.getFullYear() === today.getFullYear();

      return {
        key: labels[idx].toLowerCase(),
        label: labels[idx],
        date: String(dayDate.getDate()),
        fullDate: dayDate,
        isToday: isSameDayAsToday
      };
    });
  }, [monday, today]);

  // Format week range label (e.g. "May 18 – May 24, 2026")
  const firstDayOfWeekStr = weekDays[0].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const lastDayOfWeekStr = weekDays[6].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const weekRangeStr = `${firstDayOfWeekStr} – ${lastDayOfWeekStr}`;

  // Base default time slots matching the user's image exactly (08:00 AM up to 06:00 PM)
  const baseSlots = ['08:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];
  
  // Dynamically extract and append any unique hours from fetched events to ensure they always show up in the weekly grid!
  const timeSlots = React.useMemo(() => {
    const slots = new Set(baseSlots);
    
    events.forEach(evt => {
      if (!evt.startTime) return;
      const evtDate = new Date(evt.startTime);
      
      let hours = evtDate.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // convert 0 to 12
      const formattedHour = `${String(hours).padStart(2, '0')}:00 ${ampm}`;
      
      slots.add(formattedHour);
    });
    
    // Sort chronological
    return Array.from(slots).sort((a, b) => {
      const getMinutes = (timeStr) => {
        const [timePart, ampm] = timeStr.split(' ');
        let [hrs] = timePart.split(':').map(Number);
        if (ampm === 'PM' && hrs < 12) hrs += 12;
        if (ampm === 'AM' && hrs === 12) hrs = 0;
        return hrs * 60;
      };
      return getMinutes(a) - getMinutes(b);
    });
  }, [events]);

  // Matches database training sessions/events to dynamic grid cell hours
  const findEventForSlot = (dayDate, slotTime) => {
    return events.find(evt => {
      const evtDate = new Date(evt.startTime);
      const isSameDay = 
        evtDate.getFullYear() === dayDate.getFullYear() &&
        evtDate.getMonth() === dayDate.getMonth() &&
        evtDate.getDate() === dayDate.getDate();
        
      if (!isSameDay) return false;
      
      // Match timeslot hour
      const [timePart, ampm] = slotTime.split(' ');
      let [hours] = timePart.split(':').map(Number);
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      return evtDate.getHours() === hours;
    });
  };

  const upcomingClasses = React.useMemo(() => {
    const now = new Date();
    return events
      .filter(e => new Date(e.startTime) > now && e.type !== 'EXTERNAL')
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 4)
      .map(e => ({
        id: e.id,
        title: e.title,
        time: `${new Date(e.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • ${Math.round((new Date(e.endTime) - new Date(e.startTime))/60000)} mins`,
        icon: e.isOnline ? Tv : Users,
        isOnline: e.isOnline,
        meetingLink: e.meetingLink,
        location: e.location,
        type: e.type, // TEACHING or UPCOMING
      }));
  }, [events]);

  const pendingRequests = [
    { title: 'Product Strategy 101', requester: 'THU HA (PM)', badge: 'IMPORTANT', count: '+5 Interested' }
  ];

  const completedClasses = React.useMemo(() => {
    const now = new Date();
    return events
      .filter(e => new Date(e.endTime) < now && e.type !== 'EXTERNAL')
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
      .slice(0, 4)
      .map(e => {
        const timeDiff = now - new Date(e.endTime);
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        return {
          id: e.id,
          title: e.title,
          image: `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=300&auto=format&fit=crop`,
          when: `${days === 0 ? 'Today' : days === 1 ? 'Yesterday' : days + ' days ago'} • ${Math.round((new Date(e.endTime) - new Date(e.startTime))/60000)} mins`,
          rating: '5.0',
          type: e.type
        };
      });
  }, [events]);

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

  // Get active events for a specific month day dynamically
  const getMonthEventsForDay = (dayNum) => {
    return events.filter(evt => {
      const evtDate = new Date(evt.startTime);
      return evtDate.getDate() === dayNum && 
             evtDate.getMonth() === currentMonth &&
             evtDate.getFullYear() === currentYear;
    });
  };

  // Helper to format exact event time range (e.g. 12:00 - 1:00 PM) matching Image 1
  const formatEventTimeRange = (evt) => {
    if (!evt.startTime) return '';
    const start = new Date(evt.startTime);
    const end = evt.endTime ? new Date(evt.endTime) : new Date(start.getTime() + 60 * 60 * 1000);
    
    const formatTime = (d) => {
      let hrs = d.getHours();
      const mins = d.getMinutes();
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12;
      hrs = hrs ? hrs : 12;
      const minStr = mins ? `:${String(mins).padStart(2, '0')}` : '';
      return `${hrs}${minStr} ${ampm}`;
    };
    
    const startStr = formatTime(start).replace(' AM', '').replace(' PM', '');
    const endStr = formatTime(end);
    
    return `${startStr} - ${endStr}`;
  };

  // Helper to color-code calendar events based on role/source with custom solid thin borders exactly matching the user's design image
  const getEventStyles = (evt) => {
    if (evt.hasConflict) {
      return {
        bg: 'bg-[#FCE8E6] border border-[#F28B82] text-[#C5221F] hover:shadow-xs transition-all',
        tagBg: 'bg-rose-100 text-rose-800',
        label: 'CONFLICTED'
      };
    }
    switch (evt.type) {
      case 'TEACHING':
        return {
          bg: 'bg-[#E6F4EA] border border-[#81C995] text-[#137333] hover:shadow-xs transition-all',
          tagBg: 'bg-emerald-100 text-emerald-800',
          label: 'TEACHING'
        };
      case 'COMPLETED':
        return {
          bg: 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:shadow-xs transition-all',
          tagBg: 'bg-slate-105 text-slate-600',
          label: 'COMPLETED'
        };
      case 'EXTERNAL':
        return {
          bg: 'bg-[#E8F0FE] border border-[#8AB4F8] text-[#1A73E8] hover:shadow-xs transition-all',
          tagBg: 'bg-blue-100 text-blue-800',
          label: 'GCAL'
        };
      default:
        return {
          bg: 'bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA] hover:shadow-xs transition-all',
          tagBg: 'bg-indigo-100 text-indigo-800',
          label: 'LEARNING'
        };
    }
  };

  // Find if there are any active conflicts in the current schedule
  const activeConflict = events.find(e => e.hasConflict);

  const showToast = (message) => {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('failed') || lowerMsg.includes('error') || lowerMsg.includes('conflict')) {
      toastService.error(message);
    } else if (lowerMsg.includes('success') || lowerMsg.includes('sync') || lowerMsg.includes('connected') || lowerMsg.includes('resolved') || message.includes('🎉') || message.includes('🚀') || message.includes('⌚')) {
      toastService.success(message);
    } else {
      toastService.info(message);
    }
  };

  // Real-time hour matching tracker to highlight current active timeslot
  useEffect(() => {
    const updateCurrentSlot = () => {
      const now = new Date();
      const hrs = now.getHours();
      const mins = now.getMinutes();
      const currentMinutes = hrs * 60 + mins;

      // Find the slot that the current time falls into
      const slotsWithMinutes = [
        { label: '08:00 AM', start: 8 * 60, end: 10 * 60 },
        { label: '10:00 AM', start: 10 * 60, end: 12 * 60 },
        { label: '12:00 PM', start: 12 * 60, end: 13 * 60 },
        { label: '01:00 PM', start: 13 * 60, end: 14 * 60 },
        { label: '02:00 PM', start: 14 * 60, end: 15 * 60 },
        { label: '03:00 PM', start: 15 * 60, end: 17 * 60 }
      ];

      const active = slotsWithMinutes.find(s => currentMinutes >= s.start && currentMinutes < s.end);
      setCurrentHourSlot(active ? active.label : '');
    };
    updateCurrentSlot();
    const interval = setInterval(updateCurrentSlot, 60000);
    return () => clearInterval(interval);
  }, []);

  // Real-time red line positioning logic matching Image 1
  useEffect(() => {
    const updateRedLine = () => {
      const now = new Date();
      const hrs = now.getHours();
      const mins = now.getMinutes();
      const currentMinutes = hrs * 60 + mins;

      // Find which slot the current time belongs to
      const slotsWithMinutes = timeSlots.map((timeStr) => {
        const [timePart, ampm] = timeStr.split(' ');
        let [h] = timePart.split(':').map(Number);
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        return { label: timeStr, minutes: h * 60 };
      });

      // Find the active slot index
      let activeIdx = -1;
      for (let i = 0; i < slotsWithMinutes.length; i++) {
        if (currentMinutes >= slotsWithMinutes[i].minutes) {
          activeIdx = i;
        }
      }

      if (activeIdx !== -1) {
        const currentSlotMin = slotsWithMinutes[activeIdx].minutes;
        const nextSlotMin = activeIdx < slotsWithMinutes.length - 1 
          ? slotsWithMinutes[activeIdx + 1].minutes 
          : currentSlotMin + 60;
        
        const slotDuration = nextSlotMin - currentSlotMin;
        const elapsed = currentMinutes - currentSlotMin;
        const pctOfRow = Math.min(1, Math.max(0, elapsed / slotDuration));
        
        // Each row is h-24 which is 96px
        const calculatedTop = (activeIdx * 96) + (pctOfRow * 96);
        setRedLineTop(calculatedTop);
        setShowRedLine(true);
      } else {
        setShowRedLine(false);
      }

      // Calculate today's column left position
      const todayIdx = weekDays.findIndex(d => d.isToday);
      if (todayIdx !== -1) {
        const leftPct = (todayIdx * (100 / 7)) + (100 / 14);
        setRedLineDotLeft(leftPct);
      } else {
        setRedLineDotLeft(null);
      }
    };
    
    updateRedLine();
    const interval = setInterval(updateRedLine, 60000);
    return () => clearInterval(interval);
  }, [timeSlots, weekDays]);

  // Fetch Google Integration Status on mount
  useEffect(() => {
    fetchGoogleStatus();
  }, []);

  const fetchGoogleStatus = async () => {
    try {
      const response = await api.get('/integrations/google/status');
      setGoogleSync(response.data);
    } catch (err) {
      console.error("Error fetching Google Status", err);
    }
  };

  const handleConnectGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setSyncingGoogleAction(true);
      try {
        const response = await api.post('/integrations/google/connect', {
          accessToken: tokenResponse.access_token
        });
        setGoogleSync({
          isConnected: true,
          lastSyncedAt: response.data.lastSyncedAt,
          email: user?.email || "user@company.com"
        });
        showToast("Google Calendar successfully synced! 📅");
        fetchSchedule(); // Refresh events to show Google calendar events
      } catch (err) {
        showToast("Sync failed, please try again.");
        console.error(err);
      } finally {
        setSyncingGoogleAction(false);
      }
    },
    onError: (err) => {
      showToast("Google authorization failed.");
      console.error(err);
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly'
  });

  const handleDisconnectGoogle = async () => {
    setSyncingGoogleAction(true);
    try {
      await api.post('/integrations/google/disconnect');
      setGoogleSync({
        isConnected: false,
        lastSyncedAt: null,
        email: null
      });
      showToast("Google Calendar disconnected.");
      fetchSchedule(); // Refresh events to remove Google calendar events
    } catch (err) {
      showToast("Disconnection failed.");
      console.error(err);
    } finally {
      setSyncingGoogleAction(false);
    }
  };

  // Fetch Personal Schedule based on date range
  const fetchSchedule = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      // Compute range based on active view mode, resetting times to avoid timezone event cutoff
      let startDateStr, endDateStr;
      if (viewMode === 'week') {
        const startOfWeek = new Date(monday);
        startOfWeek.setHours(0, 0, 0, 0);
        startDateStr = startOfWeek.toISOString();

        const endOfWeek = new Date(monday);
        endOfWeek.setDate(monday.getDate() + 7);
        endOfWeek.setHours(0, 0, 0, 0); // covers up to midnight of next Monday
        endDateStr = endOfWeek.toISOString();
      } else {
        const startOfMonth = new Date(firstDayOfMonth);
        startOfMonth.setHours(0, 0, 0, 0);
        startDateStr = startOfMonth.toISOString();

        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        endDateStr = endOfMonth.toISOString();
      }

      const response = await api.get('/schedule', {
        params: {
          startDate: startDateStr,
          endDate: endDateStr
        }
      });
      setEvents(response.data);
    } catch (err) {
      console.error("Error fetching schedule data from backend", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Trigger schedule fetch whenever navigation offsets or view modes change
  useEffect(() => {
    fetchSchedule();
  }, [weekOffset, monthOffset, viewMode]);

  // Real-time Background Polling (30s) & Window Focus Auto-Refetching
  useEffect(() => {
    // 1. Periodical Polling every 30 seconds
    const interval = setInterval(() => {
      fetchSchedule(true); // Quietly refresh in the background
    }, 30000);

    // 2. Focus Refetching when user switches back to this tab
    const handleFocus = () => {
      fetchSchedule(true); // Quietly refresh when window is focused
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [monday, firstDayOfMonth, viewMode]);

  const handleResolveConflict = () => {
    setResolvingConflict(true);
    setTimeout(() => {
      setConflictResolved(true);
      setResolvingConflict(false);
      // Clean up local conflicts
      setEvents(prev => prev.map(e => ({ ...e, hasConflict: false, conflictMessage: null })));
      showToast("Schedule conflict resolved by AI! 🚀");
    }, 1500);
  };

  const handleScheduleNow = () => {
    setSchedulerBannerVisible(false);
    showToast("Successfully scheduled at the optimal slot! 🎉");
    fetchSchedule(); // Refresh schedule from backend
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-16">
      

      {/* 2. TITLE BAR */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1 text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">My Schedule</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-400 text-xs font-semibold">Manage your professional training, workshops and mentorships</span>
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
                : "text-slate-455 hover:text-slate-800"
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

      {/* 2.5 PREMIUM STATS SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-gradient-to-br from-white to-slate-50/50 p-5 rounded-3xl border border-slate-200/60 shadow-xs flex items-center justify-between group"
        >
          <div className="space-y-1.5 text-left">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Learning Analytics</span>
            <p className="text-2xl font-extrabold text-slate-900">08 Hours Learned</p>
            <span className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-wider block bg-indigo-50 px-2.5 py-0.5 rounded-lg inline-block border border-indigo-100/50">
              3 Upcoming Events
            </span>
          </div>
          <div className="size-12 rounded-2xl bg-indigo-50/80 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
            <CalendarDays className="size-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-gradient-to-br from-white to-slate-50/50 p-5 rounded-3xl border border-slate-200/60 shadow-xs flex items-center justify-between group"
        >
          <div className="space-y-1.5 text-left">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Teaching Role</span>
            <p className="text-2xl font-extrabold text-slate-900">02 Sessions Taught</p>
            <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider block bg-emerald-50 px-2.5 py-0.5 rounded-lg inline-block border border-emerald-100/50">
              +150 Reward Points
            </span>
          </div>
          <div className="size-12 rounded-2xl bg-emerald-50/80 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
            <Sparkles className="size-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-gradient-to-br from-white to-slate-50/50 p-5 rounded-3xl border border-slate-200/60 shadow-xs flex items-center justify-between group"
        >
          <div className="space-y-1.5 text-left">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Google Sync</span>
            <p className="text-2xl font-extrabold text-slate-900">
              {googleSync.isConnected ? "Linked" : "Not Linked"}
            </p>
            <span className={cn(
              "text-[9px] font-extrabold uppercase tracking-wider block px-2.5 py-0.5 rounded-lg inline-block border",
              googleSync.isConnected ? "text-emerald-600 bg-emerald-50 border-emerald-100/50" : "text-amber-600 bg-amber-50 border-amber-100/50"
            )}>
              {googleSync.isConnected ? "Real-time sync active" : "Real-time Google Calendar integration"}
            </span>
          </div>
          <div className="size-12 rounded-2xl bg-amber-50/80 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:bg-amber-100 transition-colors">
            <RefreshCw className="size-6" />
          </div>
        </motion.div>
      </div>

      {/* 3. CALENDAR + SIDEBAR GRID */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT: Calendar Grid Container (70%) */}
        <div className="flex-[0.70] bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 overflow-hidden w-full relative">
          
          {/* Real-time Loader Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xs z-50 flex items-center justify-center rounded-3xl">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="size-8 text-[#00C896] animate-spin" />
                <p className="text-slate-400 text-xs font-extrabold uppercase tracking-widest">Loading schedule...</p>
              </div>
            </div>
          )}

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
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      &lt; Prev Week
                    </button>
                    <button 
                      onClick={() => {
                        setWeekOffset(0);
                        showToast("Returned to current week");
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
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      Next Week &gt;
                    </button>
                  </div>
                </div>

                {/* 8-Column Grid Header (Time + 7 Days) matching Image 1 */}
                <div className="grid items-center pb-2 border-b border-slate-200" style={{ gridTemplateColumns: '90px repeat(7, 1fr)' }}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right pr-6 select-none">UTC+7</div>
                  {weekDays.map((day, idx) => (
                    <div key={idx} className="flex justify-center w-full border-r border-slate-100 last:border-r-0">
                      <div className="flex flex-col items-center py-2 w-full text-center">
                        <span className={cn(
                          "text-[10px] font-bold tracking-wider leading-none mb-2 block",
                          day.isToday ? "text-[#1A73E8]" : "text-slate-500"
                        )}>
                          {day.label}
                        </span>
                        {day.isToday ? (
                          <div className="relative flex flex-col items-center">
                            <span className="size-9 bg-[#1A73E8] text-white font-extrabold flex items-center justify-center rounded-full text-sm shadow-xs">
                              {day.date}
                            </span>
                            <span className="size-1.5 bg-[#1A73E8] rounded-full mt-1.5 absolute -bottom-3" />
                          </div>
                        ) : (
                          <span className="text-slate-900 text-base font-semibold leading-none py-1.5 block">
                            {day.date}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grid Rows Wrapper */}
                <div className="pt-1 border-t border-slate-150 relative">
                  
                  {/* Real-time Red Line Indicator matching Image 1 perfectly */}
                  {showRedLine && (
                    <div 
                      className="absolute left-[90px] right-0 h-0.5 bg-red-500 z-20 pointer-events-none flex items-center"
                      style={{ top: `${redLineTop}px` }}
                    >
                      {/* Red Dot aligned horizontally to today column */}
                      {redLineDotLeft !== null && (
                        <div 
                          className="size-2.5 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.85)] -ml-1.5 absolute"
                          style={{ left: `${redLineDotLeft}%` }}
                        />
                      )}
                    </div>
                  )}

                  {timeSlots.map((time, rowIdx) => (
                    <div 
                      key={rowIdx} 
                      className="grid border-b border-slate-100 hover:bg-slate-50/10 transition-colors h-24 relative" 
                      style={{ gridTemplateColumns: '90px repeat(7, 1fr)' }}
                    >
                      
                      {/* Fixed Time Column Cell */}
                      <div className="text-[10px] font-bold text-slate-400 uppercase py-3 pr-6 text-right sticky left-0 bg-white z-10 select-none flex flex-col items-end justify-start h-24">
                        <span>{time === '08:00 AM' ? 'AM' : time}</span>
                      </div>

                      {/* Day Column Cells (Pristine grid sheets without dashed borders) */}
                      {weekDays.map((day, colIdx) => {
                        const event = findEventForSlot(day.fullDate, time);
                        const isAiRecommendedCell = day.key === 'wed' && time === '03:00 PM' && schedulerBannerVisible;

                        return (
                          <div 
                            key={colIdx} 
                            className={cn(
                              "p-1 border-l border-slate-100 h-24 relative flex flex-col justify-stretch",
                              day.isToday && "bg-[#F8FAFC]/40"
                            )}
                          >
                            {event ? (
                              <motion.div 
                                whileHover={{ y: -1, scale: 1.01 }}
                                onClick={() => showToast(`Selected session: "${event.title}"`)}
                                className={cn(
                                  "p-2.5 rounded-xl text-left transition-all cursor-pointer h-full flex flex-col justify-between relative group shadow-xs min-h-[78px]",
                                  getEventStyles(event).bg
                                )}
                              >
                                <div className="space-y-1 text-left">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] font-extrabold uppercase tracking-widest leading-none block">
                                      🗎 {getEventStyles(event).label}
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-bold leading-tight line-clamp-1">
                                    {event.title}
                                  </p>
                                </div>
                                
                                <div className="flex items-center justify-between mt-auto">
                                  <span className="text-[8px] opacity-75 font-semibold">
                                    {formatEventTimeRange(event)}
                                  </span>
                                  {event.isOnline && event.meetingLink ? (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); window.open(event.meetingLink, '_blank'); }}
                                      className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider hover:brightness-110 shadow-sm"
                                    >
                                      Join
                                    </button>
                                  ) : event.hasConflict && (
                                    <span className="flex items-center gap-0.5 text-rose-600 font-extrabold text-[8px] animate-pulse">
                                      <AlertCircle className="size-2.5" /> OVERLAP
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                            ) : isAiRecommendedCell ? (
                              <motion.div 
                                whileHover={{ scale: 1.01 }}
                                onClick={handleScheduleNow}
                                className="p-2.5 rounded-xl border border-dashed border-[#D8B4FE] bg-[#F3E8FF]/60 hover:bg-[#F3E8FF]/80 text-left h-full flex flex-col justify-between cursor-pointer group transition-all shadow-xs min-h-[78px]"
                              >
                                <div className="space-y-0.5">
                                  <span className="text-[#9333EA] text-[8px] font-extrabold uppercase tracking-widest flex items-center gap-1 leading-none">
                                    ✦ AI SUGGESTED
                                  </span>
                                  <p className="text-[11px] font-bold text-[#5B21B6] group-hover:underline leading-tight">
                                    Advanced React
                                  </p>
                                </div>
                                <div className="flex justify-between items-end mt-auto text-[8px] text-purple-600 font-semibold">
                                  <span>3:00 - 4:30 PM</span>
                                  <span className="size-4 rounded-full bg-purple-200 text-purple-800 text-[7px] font-extrabold flex items-center justify-center shrink-0 uppercase">JD</span>
                                </div>
                              </motion.div>
                            ) : (
                              // Completely pristine empty cell aligned with the simple horizontal/vertical lines of Image 1
                              <div className="size-full bg-transparent transition-colors hover:bg-slate-50/40 cursor-pointer" />
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
                      className="px-4 py-2 bg-slate-55 hover:bg-slate-100 text-slate-600 border border-slate-200/80 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      &lt; Prev Month
                    </button>
                    <button 
                      onClick={() => {
                        setMonthOffset(0);
                        showToast("Returned to current month");
                      }} 
                      className="px-4 py-2 bg-slate-55 hover:bg-slate-100 text-[#00C896] border border-[#00C896]/20 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      This Month
                    </button>
                    <button 
                      onClick={() => {
                        setMonthOffset(prev => prev + 1);
                        showToast("Moved to next month");
                      }} 
                      className="px-4 py-2 bg-slate-55 hover:bg-slate-100 text-slate-600 border border-slate-200/80 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      Next Month &gt;
                    </button>
                  </div>
                </div>

                {/* Days of Week Header Grid */}
                <div className="grid grid-cols-7 gap-3 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                  <div>MON</div>
                  <div>TUE</div>
                  <div>WED</div>
                  <div>THU</div>
                  <div>FRI</div>
                  <div className="text-slate-300">SAT</div>
                  <div className="text-slate-300">SUN</div>
                </div>

                {/* 35/42-Day Dynamic Grid */}
                <div className="grid grid-cols-7 gap-3">
                  {monthDays.map((day, idx) => {
                    const dayEvts = getMonthEventsForDay(day.dayNumber);
                    return (
                      <div 
                        key={idx}
                        className={cn(
                          "min-h-[120px] rounded-2xl border p-3 flex flex-col justify-between transition-all relative overflow-hidden group/cell",
                          day.isCurrentMonth 
                            ? "bg-white border-slate-200/60 hover:border-indigo-200 hover:shadow-[0_8px_20px_rgba(99,102,241,0.04)]" 
                            : "bg-slate-55/50 border-slate-100/50 opacity-40 select-none pointer-events-none",
                          day.isToday && "ring-2 ring-emerald-500/20 border-emerald-500/30 bg-emerald-50/10 shadow-[0_4px_16px_rgba(0,200,150,0.04)]"
                        )}
                      >
                        <div className="flex justify-between items-center relative z-10">
                          <span className={cn(
                            "text-xs font-extrabold flex items-center justify-center rounded-xl",
                            day.isToday 
                              ? "size-6 bg-gradient-to-br from-[#00C896] to-[#00B083] text-white font-extrabold shadow-sm shadow-emerald-500/20" 
                              : day.isCurrentMonth ? "text-slate-700" : "text-slate-400"
                          )}>
                            {day.dayNumber}
                          </span>
                          
                          {/* Mini indicator if day has events */}
                          {day.isCurrentMonth && dayEvts.length > 0 && (
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100/50 scale-90">
                              {dayEvts.length} EVENTS
                            </span>
                          )}
                        </div>

                        <div className="flex-1 mt-2.5 space-y-1.5 overflow-y-auto max-h-[72px] custom-scrollbar relative z-10 text-left">
                          {day.isCurrentMonth && dayEvts.map((evt, eIdx) => {
                            const isCompleted = evt.type === 'COMPLETED';
                            const isExternal = evt.type === 'EXTERNAL';
                            const hasConflict = evt.hasConflict;

                            return (
                              <div 
                                key={eIdx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showToast(`Selected: "${evt.title}"`);
                                }}
                                className={cn(
                                  "text-[9px] font-bold px-2 py-1 rounded-lg truncate border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xs",
                                  hasConflict 
                                    ? "bg-rose-55 border-rose-200 text-rose-700" 
                                    : isCompleted
                                      ? "bg-slate-50 text-slate-550 border-slate-200/50"
                                      : isExternal 
                                        ? "bg-amber-55 border-amber-250 text-amber-805"
                                        : "bg-indigo-55 border-indigo-250 text-indigo-805"
                                )}
                                title={evt.title}
                              >
                                <span className="truncate">{evt.title}</span>
                                {evt.hasConflict && <span className="size-1.5 bg-rose-500 rounded-full animate-pulse shrink-0 ml-1" />}
                              </div>
                            );
                          })}
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
        <div className="flex-[0.30] space-y-8 w-full">
          
          {/* A. UPCOMING CLASSES */}
          <div className="bg-gradient-to-br from-white to-slate-50/40 rounded-3xl p-6 border border-slate-200/60 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="size-4.5 text-indigo-500" />
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Upcoming Classes</h3>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[8px] font-extrabold uppercase tracking-widest rounded-lg">
                TODAY
              </span>
            </div>
            
              {upcomingClasses.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium text-center py-4">No upcoming classes</p>
              ) : upcomingClasses.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-col gap-3 p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/40 transition-all duration-300 group shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <item.icon className="size-4.5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-bold text-xs text-slate-800 truncate">{item.title}</p>
                      <p className="text-[9px] text-slate-455 font-extrabold uppercase tracking-wider mt-0.5">{item.time}</p>
                    </div>
                  </div>
                  {item.isOnline && item.meetingLink && (
                     <button onClick={() => window.open(item.meetingLink, '_blank')} className="w-full mt-1 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl text-[10px] font-extrabold tracking-widest uppercase shadow-md shadow-indigo-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                       Join Online Class <ExternalLink className="size-3" />
                     </button>
                  )}
                </div>
              ))}
          </div>

          {/* B. PENDING REQUESTS */}
          <div className="bg-gradient-to-br from-white to-slate-50/40 rounded-3xl p-6 border border-slate-200/60 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-4.5 text-emerald-500" />
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Pending Requests</h3>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[8px] font-extrabold uppercase tracking-widest rounded-lg">
                4 NEW
              </span>
            </div>

            <div className="space-y-3.5">
              {pendingRequests.map((item, idx) => (
                <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200/40 relative group overflow-hidden shadow-xs text-left">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{item.title}</p>
                      <p className="text-[8px] text-slate-400 font-extrabold uppercase mt-1 tracking-wider">REQUESTED BY {item.requester}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[7px] font-extrabold uppercase tracking-widest border border-slate-200/50">
                      {item.badge}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      <img src="https://i.pravatar.cc/100?u=1" className="inline-block size-5 rounded-full ring-2 ring-white object-cover" />
                      <img src="https://i.pravatar.cc/100?u=2" className="inline-block size-5 rounded-full ring-2 ring-white object-cover" />
                      <img src="https://i.pravatar.cc/100?u=3" className="inline-block size-5 rounded-full ring-2 ring-white object-cover" />
                    </div>
                    <span className="text-[8px] text-[#00C896] bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-widest">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* C. EXTERNAL SYNC */}
          <div className="bg-gradient-to-br from-white to-slate-50/40 rounded-3xl p-6 border border-slate-200/60 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-left">
              <RefreshCw className={cn("size-4.5 text-[#00C896]", (syncingGoogleAction || loading) && "animate-spin")} />
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Calendar Integration</h3>
            </div>

            <div className="space-y-3">
              {/* Google Calendar */}
              <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/40 shadow-xs">
                <div className="flex items-center gap-3">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="size-5 shrink-0" alt="Google Calendar" />
                  <div className="text-left">
                    <p className="font-bold text-xs text-slate-800">Google Calendar</p>
                    <p className={cn(
                      "text-[8px] font-extrabold uppercase tracking-wider mt-0.5",
                      googleSync.isConnected ? "text-emerald-600" : "text-slate-400"
                    )}>
                      {googleSync.isConnected ? "Connected" : "Not Connected"}
                    </p>
                  </div>
                </div>
                {googleSync.isConnected ? (
                  <button 
                    onClick={handleDisconnectGoogle}
                    disabled={syncingGoogleAction}
                    className="px-2.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-500 rounded-xl text-[8px] font-extrabold tracking-widest uppercase bg-white cursor-pointer transition-colors shadow-xs"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button 
                    onClick={handleConnectGoogle}
                    disabled={syncingGoogleAction}
                    className="px-2.5 py-1.5 border border-slate-250 hover:border-slate-350 text-[#00C896] rounded-xl text-[8px] font-extrabold tracking-widest uppercase bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Outlook Calendar */}
              <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/40 shadow-xs opacity-65">
                <div className="flex items-center gap-3">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" className="size-5 shrink-0" alt="Outlook Calendar" />
                  <div className="text-left">
                    <p className="font-bold text-xs text-slate-800">Outlook Calendar</p>
                    <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">NOT CONNECTED</p>
                  </div>
                </div>
                <button 
                  onClick={() => showToast("Connecting Outlook Calendar...")}
                  className="px-2.5 py-1.5 border border-slate-250 hover:border-slate-350 text-slate-500 rounded-xl text-[8px] font-extrabold tracking-widest uppercase bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-xs"
                >
                  Connect
                </button>
              </div>
            </div>

            {/* Conflict Detected Alert Card */}
            <AnimatePresence>
              {activeConflict && !conflictResolved && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/60 space-y-3 shadow-sm text-left"
                >
                  <div className="flex items-start gap-2.5 text-rose-700">
                    <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-550" />
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-extrabold uppercase tracking-widest text-rose-600">CONFLICT DETECTED</p>
                      <p className="text-[11px] font-bold leading-normal text-rose-800">
                        "{activeConflict.title}" overlaps with another session: {activeConflict.conflictMessage}.
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={handleResolveConflict}
                    disabled={resolvingConflict}
                    className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-105 active:scale-[0.98] text-white py-2.5 rounded-xl font-extrabold text-[9px] uppercase tracking-widest transition-all shadow-md shadow-rose-500/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {resolvingConflict ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" /> Optimizing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3.5 animate-pulse" /> Resolve Overlaps with AI
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
            onClick={() => showToast("Loading learning history...")}
            className="text-xs font-extrabold text-[#00C896] hover:underline cursor-pointer flex items-center gap-1"
          >
            View Learning History <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {completedClasses.map((item, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -4 }}
              className="bg-white rounded-[24px] overflow-hidden border border-slate-200/60 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group cursor-pointer"
            >
              <div className="h-40 w-full relative overflow-hidden bg-slate-150">
                <img src={item.image} className="size-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <h4 className="text-sm font-extrabold text-slate-800 leading-snug line-clamp-2 group-hover:text-primary transition-colors text-left">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="text-[9px] text-slate-455 font-extrabold uppercase tracking-wider">
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
    </div>
  );
}

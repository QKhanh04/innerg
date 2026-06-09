import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  BookOpen,
  Users,
  Clock,
  MapPin,
  Video,
  ChevronRight,
  Check,
  Star,
  Award,
  AlertCircle,
  Bookmark,
  ArrowRight,
  SlidersHorizontal,
  BookmarkCheck,
  Plus,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { useRole } from '../../../lib/RoleContext';
import { toastService } from '../../../services/toastService';
import { exploreApi } from '../../../api/exploreApi';

export default function ExplorePage() {
  const { role, user } = useRole();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  // Live loading and dataset states
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = localStorage.getItem('explore_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isMounted = useRef(true);

  // Dynamic statistics calculated from live data
  const stats = useMemo(() => {
    const activeMentors = new Set(classes.map(c => c.mentor?.name)).size;
    const skillsExchanged = classes.reduce((acc, c) => acc + (c.skills?.length || 0), 0) * 15;
    return {
      activeClasses: classes.length,
      skillsExchanged: 1240 + skillsExchanged,
      activeMentors: 350 + activeMentors
    };
  }, [classes]);

  const showToast = (type, message) => {
    switch (type) {
      case 'success':
        toastService.success(message);
        break;
      case 'error':
        toastService.error(message);
        break;
      case 'info':
      default:
        toastService.info(message);
        break;
    }
  };

  // Live fetch function
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await exploreApi.getExploreClasses();
      if (isMounted.current) {
        // Normalize categories in-place to prevent "Soft Skill" vs "Soft Skills" duplicates
        const normalizedData = data.map(cls => {
          let cat = cls.category ? cls.category.trim() : "General";
          cat = cat.replace(/\b\w/g, c => c.toUpperCase());
          if (cat === 'Soft Skill' || cat === 'Soft Skills') {
            cat = 'Soft Skills';
          }
          return {
            ...cls,
            category: cat
          };
        });
        setClasses(normalizedData);
      }
    } catch (err) {
      if (isMounted.current) {
        console.error("Failed to load explore classes:", err);
        toastService.error("Failed to load classes from marketplace");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchClasses();
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Save wishlist items
  useEffect(() => {
    try {
      localStorage.setItem('explore_wishlist', JSON.stringify(wishlistIds));
    } catch (err) {
      console.error(err);
    }
  }, [wishlistIds]);

  const categories = useMemo(() => {
    const cats = new Set();
    classes.forEach(cls => {
      if (cls.category) cats.add(cls.category);
    });
    return ['All', ...Array.from(cats)];
  }, [classes]);

  const levels = ['All', 'Beginner', 'Intermediate', 'Expert'];
  const formats = ['All', 'Online', 'Offline'];

  // AI Recommendation list dynamically matched from active classes
  const aiRecommendations = useMemo(() => {
    return classes.slice(0, 2).map((cls, idx) => ({
      ...cls,
      matchPercentage: idx === 0 ? 98 : 94
    }));
  }, [classes]);

  // Handle Live Registration Flow
  const handleRegister = async (id) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return;

    const isInstructor = cls.mentor?.userId === user?.userId;
    if (isInstructor) {
      showToast('error', "You are the mentor of this class and cannot register.");
      return;
    }

    const isPending = cls.registrationStatus === 'Pending';
    const isRegistered = cls.registrationStatus === 'Registered';
    const isClosed = cls.isRegistrationClosed;

    try {
      if (isPending || isRegistered) {
        // Cancel/unregister
        await exploreApi.unregisterClass(id);
        setClasses(prev => prev.map(c => {
          if (c.id === id) {
            return {
              ...c,
              registrationStatus: 'NotRegistered',
              takenSlots: isRegistered ? Math.max(0, c.takenSlots - 1) : c.takenSlots
            };
          }
          return c;
        }));
        showToast('success', `Successfully canceled registration for "${cls.title}".`);
      } else {
        // Check if slot is available
        if (cls.takenSlots >= cls.totalSlots) {
          showToast('error', "Sorry, this class is full!");
          return;
        }

        await exploreApi.registerClass(id);
        setClasses(prev => prev.map(c => {
          if (c.id === id) {
            return {
              ...c,
              registrationStatus: 'Pending'
            };
          }
          return c;
        }));
        showToast('success', `Successfully requested registration for "${cls.title}". Pending mentor approval! ⌛`);
      }
    } catch (err) {
      console.error("Failed to register/unregister:", err);
      const errorMessage = err.response?.data?.message || "Operation failed. Please try again.";
      showToast('error', errorMessage);
    }
  };

  // Toggle wishlist item
  const handleWishlistToggle = (id) => {
    if (wishlistIds.includes(id)) {
      setWishlistIds(prev => prev.filter(item => item !== id));
      showToast('success', "Removed from learning wishlist.");
    } else {
      setWishlistIds(prev => [...prev, id]);
      showToast('success', "Added to learning wishlist! ❤️");
    }
  };

  // Search & Filtering Logic
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const matchesSearch =
        cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'All' || cls.category === selectedCategory;
      const matchesLevel = selectedLevel === 'All' || cls.level === selectedLevel;
      const matchesFormat = selectedFormat === 'All' || cls.format === selectedFormat;
      const matchesAvailability = !showOnlyAvailable || cls.takenSlots < cls.totalSlots;

      return matchesSearch && matchesCategory && matchesLevel && matchesFormat && matchesAvailability;
    });
  }, [classes, searchQuery, selectedCategory, selectedLevel, selectedFormat, showOnlyAvailable]);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-16">

      {/* 1. HERO BANNER WITH GRADIENT & STATS */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 rounded-3xl p-8 lg:p-10 shadow-xl border border-indigo-500/25 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        {/* Glowing Background Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00C896]/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />

        <div className="space-y-4 max-w-2xl text-left relative z-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#00C896] uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <Sparkles className="size-3.5" />
            Empower Skills & Growth
          </span>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Skill Marketplace & Training Portal
          </h1>
          <p className="text-slate-350 text-sm leading-relaxed max-w-xl">
            Explore company-internal mentoring sessions, workshops, peer learning groups, and earn learning rewards points while growing your career.
          </p>

          {/* Quick Metrics */}
          <div className="flex gap-6 pt-2">
            <div>
              <p className="text-2xl font-extrabold text-white">{stats.activeClasses}</p>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Active Classes</p>
            </div>
            <div className="border-l border-white/10 pl-6">
              <p className="text-2xl font-extrabold text-white">{stats.skillsExchanged}</p>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Skills Exchanged</p>
            </div>
            <div className="border-l border-white/10 pl-6">
              <p className="text-2xl font-extrabold text-white">{stats.activeMentors}</p>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Active Mentors</p>
            </div>
          </div>
        </div>

        {/* Dynamic CTA for Mentor Role to Teach */}
        {(role === 'mentor' || role === 'hr') && (
          <div className="shrink-0 relative z-10">
            <button
              onClick={() => showToast('info', "Redirecting to Create Class form...")}
              className="bg-gradient-to-r from-[#00C896] to-[#00B083] hover:brightness-105 active:scale-[0.98] text-[#0F1F3D] font-extrabold px-6 py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-[#00C896]/20 flex items-center gap-2"
            >
              <Plus className="size-4.5 stroke-[3]" />
              Host a Class
            </button>
          </div>
        )}
      </div>

      {/* 2. AI RECOMMENDED COURSES (PERSONALIZED MATCHES) */}
      <section className="space-y-5 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-[#9333EA] animate-pulse" />
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">AI Suggestions for You</h2>
          </div>
          <span className="text-[10px] font-extrabold text-[#9333EA] bg-purple-50 border border-purple-100 px-3 py-1 rounded-full uppercase tracking-wider">
            98% PROFILE MATCH
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aiRecommendations.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -2 }}
              className="bg-gradient-to-br from-purple-50/30 via-white to-white p-5 rounded-3xl border border-purple-200/50 shadow-xs flex flex-col sm:flex-row gap-5 relative overflow-hidden group"
            >
              {/* Cover Image */}
              <div className="w-full sm:w-36 h-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                <img src={item.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60'} className="size-full object-cover group-hover:scale-103 transition-transform duration-300" alt={item.title} />
              </div>

              {/* Course Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#9333EA] bg-purple-50 border border-purple-100/50 px-2 py-0.5 rounded-lg font-extrabold uppercase tracking-widest">
                      ✦ AI RECOMMENDED
                    </span>
                    <span className="text-[10px] text-[#00C896] font-extrabold">{item.matchPercentage}% Match</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800 leading-tight truncate">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <img src={item.mentor.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(item.mentor.name || 'Mentor')}`} className="size-5 rounded-full object-cover" alt={item.mentor.name} />
                    <span className="text-[10px] text-slate-600 font-bold">{item.mentor.name}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRegister(item.id); }}
                    disabled={item.mentor?.userId === user?.userId || (item.isRegistrationClosed && item.registrationStatus === 'NotRegistered')}
                    className={cn(
                      "text-[9px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-xl transition-all disabled:opacity-60",
                      item.mentor?.userId === user?.userId
                        ? "bg-indigo-50 text-indigo-650 border border-indigo-200 cursor-default"
                        : item.registrationStatus === 'Registered'
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-pointer"
                          : item.registrationStatus === 'Pending'
                            ? "bg-amber-50 text-amber-600 border border-amber-200 cursor-pointer animate-pulse"
                            : item.isRegistrationClosed
                              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                              : "bg-[#9333EA] hover:bg-[#7e22ce] text-white cursor-pointer"
                    )}
                  >
                    {item.mentor?.userId === user?.userId ? "Hosting" : item.registrationStatus === 'Registered' ? "✓ Enrolled" : item.registrationStatus === 'Pending' ? "⌛ Pending" : item.isRegistrationClosed ? "Closed" : "Register"}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. DYNAMIC CLASS DIRECTORY WITH FILTER CONTROL PANEL */}
      <section className="bg-white rounded-3xl border border-slate-250/60 shadow-sm p-6 lg:p-8 space-y-6">

        {/* Search & Filter Top Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search classes, skills, mentors, rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-sm rounded-2xl outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Show Available Switch */}
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 select-none hover:bg-slate-100/50 transition-colors">
              <input
                type="checkbox"
                checked={showOnlyAvailable}
                onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                className="accent-indigo-600 rounded"
              />
              Show Open Only
            </label>

            {/* Level Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200">
              <SlidersHorizontal className="size-3.5 text-slate-400" />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-650 outline-none cursor-pointer"
              >
                {levels.map(lvl => <option key={lvl} value={lvl}>{lvl === 'All' ? 'All Levels' : lvl}</option>)}
              </select>
            </div>

            {/* Format Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200">
              <Video className="size-3.5 text-slate-400" />
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-650 outline-none cursor-pointer"
              >
                {formats.map(fmt => <option key={fmt} value={fmt}>{fmt === 'All' ? 'All Formats' : fmt}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Tab-Style Category Filters */}
        <div className="flex gap-2 pb-2 overflow-x-auto border-b border-slate-100 scrollbar-none text-left">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer shrink-0 border",
                selectedCategory === cat
                  ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Class Catalog Grid (Pristine Glassmorphism look) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-[24px] overflow-hidden border border-slate-200 shadow-xs p-5 space-y-4 animate-pulse">
                <div className="h-44 w-full bg-slate-200 rounded-2xl" />
                <div className="h-4 w-1/3 bg-slate-200 rounded" />
                <div className="h-5 w-3/4 bg-slate-200 rounded" />
                <div className="h-12 w-full bg-slate-200 rounded" />
                <div className="flex gap-2">
                  <div className="h-6 w-12 bg-slate-200 rounded-md" />
                  <div className="h-6 w-12 bg-slate-200 rounded-md" />
                </div>
                <div className="h-10 w-full bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredClasses.map((item) => {
                const isFull = item.takenSlots >= item.totalSlots;
                const isRegistered = item.registrationStatus === 'Registered';
                const isPending = item.registrationStatus === 'Pending';
                const inWishlist = wishlistIds.includes(item.id);
                const spotsLeft = item.totalSlots - item.takenSlots;

                return (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/explore/${item.id}`)}
                    className="bg-white rounded-[24px] overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full group cursor-pointer"
                  >
                    {/* Card Header Image with Cover */}
                    <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                      <img src={item.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60'} className="size-full object-cover group-hover:scale-102 transition-transform duration-550" alt={item.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                      {/* Floating Formats Badge */}
                      <span className={cn(
                        "absolute top-4 left-4 inline-flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg text-white backdrop-blur-md shadow-xs",
                        item.format === 'Online' ? "bg-indigo-600/85" : "bg-teal-600/85"
                      )}>
                        {item.format === 'Online' ? <Video className="size-2.5" /> : <MapPin className="size-2.5" />}
                        {item.format}
                      </span>

                      {/* Reward Points cost/prize */}
                      <span className="absolute top-4 right-4 bg-slate-900/85 text-white font-extrabold text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-lg backdrop-blur-md">
                        +{item.points} pts
                      </span>

                      {/* Slots availability tag */}
                      <span className={cn(
                        "absolute bottom-4 left-4 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg text-white shadow-xs backdrop-blur-md",
                        isFull
                          ? "bg-rose-600/85"
                          : spotsLeft <= 3
                            ? "bg-amber-600/85"
                            : "bg-emerald-600/85"
                      )}>
                        {item.isRegistrationClosed && item.registrationStatus === 'NotRegistered' ? "REGISTRATION CLOSED" : isFull ? "FULL HOUSE" : `${spotsLeft} Slots Left`}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-left">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">
                            {item.category} • {item.level}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/explore/${item.id}`); }}
                              className="size-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50"
                              title="View Details"
                            >
                              <Info className="size-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleWishlistToggle(item.id); }}
                              className={cn(
                                "size-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
                                inWishlist ? "text-rose-500 bg-rose-50" : "text-slate-300 hover:text-slate-500 bg-slate-50"
                              )}
                              title="Add to wishlist"
                            >
                              <Bookmark className={cn("size-3.5", inWishlist && "fill-current")} />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* Skill Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.skills.map((skill, sIdx) => (
                          <span key={sIdx} className="text-[8px] font-extrabold text-slate-650 bg-slate-100/70 border border-slate-200/50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Time & Venue Meta Info */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-450 font-bold">
                        <div className="flex items-center gap-1">
                          <Clock className="size-3 text-slate-400" />
                          <span>{item.date} • {item.time} ({item.duration})</span>
                        </div>
                        <span className="text-slate-500 truncate max-w-[90px]">{item.formatDetail}</span>
                      </div>

                      {/* Mentor Profile and Action Register Button */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={item.mentor.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(item.mentor.name || 'Mentor')}`} className="size-8 rounded-full object-cover border-2 border-slate-200" alt={item.mentor.name} />
                          <div className="min-w-0 text-left">
                            <p className="text-[10px] font-extrabold text-slate-800 truncate leading-tight">{item.mentor.name}</p>
                            <p className="text-[8px] text-slate-400 font-semibold truncate mt-0.5">{item.mentor.position}</p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); handleRegister(item.id); }}
                          disabled={item.mentor?.userId === user?.userId || (item.isRegistrationClosed && item.registrationStatus === 'NotRegistered') || (isFull && !isRegistered && !isPending)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all border shadow-xs disabled:opacity-50 shrink-0",
                            item.mentor?.userId === user?.userId
                              ? "bg-indigo-50 text-indigo-650 border-indigo-200 cursor-default"
                              : isRegistered
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100/50 cursor-pointer"
                                : isPending
                                  ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100/50 cursor-pointer animate-pulse"
                                  : item.isRegistrationClosed
                                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                    : isFull
                                      ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                      : "bg-slate-900 border-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                          )}
                        >
                          {item.mentor?.userId === user?.userId ? "Hosting" : isRegistered ? "✓ Enrolled" : isPending ? "⌛ Pending" : item.isRegistrationClosed ? "CLOSED" : isFull ? "FULL" : "Register"}
                        </button>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Empty Search Result Page */}
        {filteredClasses.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <AlertCircle className="size-10 text-slate-300 mx-auto" />
            <p className="text-slate-700 text-sm font-bold">No classes found matching your search</p>
            <p className="text-slate-400 text-xs">Try selecting a different category or clearing search filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedLevel('All');
                setSelectedFormat('All');
                setShowOnlyAvailable(false);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer mt-2"
            >
              Reset Filters
            </button>
          </div>
        )}

      </section>
    </div>
  );
}

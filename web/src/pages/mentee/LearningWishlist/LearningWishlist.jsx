/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  ThumbsUp, 
  Search, 
  Award, 
  Filter, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronRight, 
  Send, 
  Users,
  Flame,
  MessageSquare,
  LayoutGrid,
  List,
  ArrowUpDown,
  BookOpen,
  User,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { wishlistApi } from '../../../api/wishlistApi';
import { toastService } from '../../../services/toastService';

export default function LearningWishlist() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, popular, approved, my-proposals
  const [sortBy, setSortBy] = useState('votes'); // votes, recent
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  
  // Track expanded descriptions
  const [expandedItems, setExpandedItems] = useState({});

  // Form states
  const [newRequest, setNewRequest] = useState({
    title: '',
    category: 'Technical',
    description: '',
    reason: ''
  });

  const showToast = (message) => {
    toastService.success(message);
  };

  // Live fetch function
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const data = await wishlistApi.getWishlist();
      if (isMounted.current) {
        setWishlistItems(data);
      }
    } catch (err) {
      console.error("Failed to load wishlist items:", err);
      toastService.error("Failed to load wishlist from server");
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchWishlist();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleVote = async (id) => {
    try {
      const res = await wishlistApi.toggleVote(id); const targetItem = wishlistItems.find(item => item.id === id); const title = targetItem ? targetItem.title : "this topic"; if (res.voted) { showToast(`Upvoted "${title}"! 👍`); } else { showToast(`Removed upvote from "${title}".`); }
      
      // Update locally
      setWishlistItems(prevItems => 
        prevItems.map(item => {
          if (item.id === id) {
            const hasVoted = res.voted;
            const currentVoters = [...item.voters || []];
            
            if (hasVoted) {
              currentVoters.push("https://api.dicebear.com/7.x/adventurer/svg?seed=You");
              /* Already notified */
            } else {
              const index = currentVoters.indexOf("https://api.dicebear.com/7.x/adventurer/svg?seed=You");
              if (index > -1) currentVoters.splice(index, 1);
               /* Already notified */
            }

            return {
              ...item,
              voted: hasVoted,
              votes: res.votes,
              voters: currentVoters
            };
          }
          return item;
        })
      );
    } catch (err) {
      console.error("Failed to cast vote:", err);
      showToast("Failed to submit vote. Please try again. ⚠️");
    }
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newRequest.title || !newRequest.description) return;

    try {
      const createdItem = await wishlistApi.createRequest({
        title: newRequest.title,
        category: newRequest.category,
        description: newRequest.description,
        reason: newRequest.reason
      });

      setWishlistItems(prev => [createdItem, ...prev]);
      setIsModalOpen(false);
      setNewRequest({ title: '', category: 'Technical', description: '', reason: '' });
      showToast("Your training request has been published! 🚀");
    } catch (err) {
      console.error("Failed to create request:", err);
      showToast("Failed to submit request. ⚠️");
    }
  };

  // Filter, Search, and Sort Logic
  const filteredItems = useMemo(() => {
    return wishlistItems
      .filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        
        if (selectedFilter === 'popular') return item.votes >= 30;
        if (selectedFilter === 'approved') return item.status === 'approved';
        if (selectedFilter === 'my-proposals') return item.proposedBy === 'You';
        return true; // all
      })
      .sort((a, b) => {
        if (sortBy === 'votes') return b.votes - a.votes;
        return b.id.localeCompare(a.id); // Guid string locale comparison for stable recent sorting
      });
  }, [wishlistItems, searchQuery, selectedFilter, sortBy]);

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto pb-16">
      
      {/* HERO SECTION - More compact to maximize screen estate */}
      <section className="relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-[#0F1F3D] via-[#162747] to-[#0A1224] rounded-3xl p-8 lg:p-10 overflow-hidden border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00C896]/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-blue-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />
          
          <div className="relative z-10 space-y-3 max-w-2xl">
             <div className="flex items-center gap-2 px-3.5 py-1 bg-[#00C896]/10 border border-[#00C896]/20 rounded-full w-fit backdrop-blur-sm shadow-inner shadow-white/5">
                <Sparkles className="size-3.5 text-[#00C896] animate-pulse" />
                <span className="text-[#00C896] text-[10px] font-bold uppercase tracking-widest">Internal Knowledge Demand</span>
             </div>
             <h1 className="text-2xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
               Learning Wishlist
             </h1>
             <p className="text-slate-300 text-xs lg:text-sm leading-relaxed font-medium">
               What skills do you need to level up? Request a seminar or upvote existing topics. When interest hits critical mass, HR will coordinate with experts to build a tailored workshop.
             </p>
          </div>

          <div className="relative z-10 shrink-0">
             <button 
               onClick={() => setIsModalOpen(true)}
               className="bg-gradient-to-r from-[#00C896] to-[#00B083] hover:from-[#00E0A8] hover:to-[#00C896] text-[#0F1F3D] font-extrabold px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-md shadow-[#00C896]/15 flex items-center gap-2 cursor-pointer"
             >
                <Plus className="size-4.5 stroke-[2.5]" /> Request a Skill
             </button>
          </div>
        </motion.div>
      </section>

      {/* FILTER, SEARCH & GRID CONTROLS HUB */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
         
         {/* Search & Sort Input combo */}
         <div className="flex flex-col sm:flex-row gap-3 w-full xl:max-w-xl">
            {/* Search */}
            <div className="relative flex-1">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
               <input 
                 type="text"
                 placeholder="Search requested topics, skills..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300/80 focus:border-[#00C896] focus:bg-white text-slate-800 text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none transition-all"
               />
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative shrink-0 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 gap-2 hover:bg-slate-100 transition-colors">
               <ArrowUpDown className="size-3.5 text-slate-400" />
               <span>Sort by:</span>
               <select 
                 value={sortBy} 
                 onChange={(e) => setSortBy(e.target.value)}
                 className="bg-transparent focus:outline-none cursor-pointer pr-1"
               >
                  <option value="votes">Most Upvotes</option>
                  <option value="recent">Recently Proposed</option>
               </select>
            </div>
         </div>

         {/* Navigation filter pill list & View Switcher */}
         <div className="flex items-center gap-4 justify-between xl:justify-end w-full xl:w-auto border-t xl:border-t-0 pt-3 xl:pt-0 border-slate-100">
            
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
               {[
                 { id: 'all', label: 'All' },
                 { id: 'popular', label: '🔥 Trending' },
                 { id: 'approved', label: '✓ Approved' },
                 { id: 'my-proposals', label: 'My Proposals' }
               ].map((filter) => (
                 <button
                   key={filter.id}
                   onClick={() => setSelectedFilter(filter.id)}
                   className={cn(
                     "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                     selectedFilter === filter.id 
                       ? "bg-[#0F1F3D] text-white shadow-sm" 
                       : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                   )}
                 >
                   {filter.label}
                 </button>
               ))}
            </div>

            {/* View Grid/List Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 shrink-0">
               <button 
                 onClick={() => setViewMode('grid')}
                 className={cn("p-1.5 rounded-lg transition-all cursor-pointer", viewMode === 'grid' ? "bg-white text-slate-800 shadow-xs" : "text-slate-400 hover:text-slate-600")}
                 title="Grid View (Dense)"
               >
                  <LayoutGrid className="size-4" />
               </button>
               <button 
                 onClick={() => setViewMode('list')}
                 className={cn("p-1.5 rounded-lg transition-all cursor-pointer", viewMode === 'list' ? "bg-white text-slate-800 shadow-xs" : "text-slate-400 hover:text-slate-600")}
                 title="List View (Table)"
               >
                  <List className="size-4" />
               </button>
            </div>
         </div>
      </div>

      {/* WISHLIST GRID/LIST CONTAINER */}
      <div>
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-5 border border-slate-200/50 shadow-sm space-y-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-16 bg-slate-200 rounded-lg" />
                    <div className="h-5 w-20 bg-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
                    <div className="h-4 w-full bg-slate-200 rounded" />
                    <div className="h-4 w-5/6 bg-slate-200 rounded" />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-slate-200" />
                      <div className="h-3 w-16 bg-slate-200 rounded" />
                    </div>
                    <div className="h-8 w-16 bg-slate-200 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            
            viewMode === 'grid' ? (
              // DENSE GRID LAYOUT (2 or 3 columns to maximize visibility)
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filteredItems.map((item, index) => {
                  const isExpanded = expandedItems[item.id];
                  return (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={cn(
                        "bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group",
                        item.voted ? "border-[#00C896]/30 ring-1 ring-emerald-500/5 bg-[#00C896]/[0.005]" : "border-slate-200/50"
                      )}
                    >
                      <div className="space-y-4">
                         {/* Card Header Tag Row */}
                         <div className="flex items-center justify-between gap-2">
                            <span className={cn(
                              "px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest border",
                              item.category === 'Technical' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50/80 text-orange-600 border-orange-100"
                            )}>{item.category}</span>
                            
                            {/* Status Tag */}
                            <span className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest border",
                              item.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              item.status === 'in-review' ? "bg-amber-50 text-amber-600 border-amber-100" :
                              "bg-slate-50 text-slate-500 border-slate-200"
                            )}>
                               {item.status === 'approved' && <CheckCircle2 className="size-2.5" />}
                               {item.status === 'in-review' && <Clock className="size-2.5" />}
                               {item.status === 'approved' ? 'Approved' : 
                                item.status === 'in-review' ? 'In Review' : 'Active'}
                            </span>
                         </div>

                         {/* Title & Description */}
                         <div className="space-y-2">
                            <h3 className="text-base font-extrabold text-slate-800 group-hover:text-primary transition-colors leading-snug line-clamp-2" title={item.title}>
                               {item.title}
                            </h3>
                            <p className={cn(
                              "text-slate-500 text-xs leading-relaxed font-medium",
                              !isExpanded && "line-clamp-3"
                            )}>
                               {item.description}
                            </p>
                            {item.description.length > 120 && (
                              <button 
                                onClick={() => toggleExpand(item.id)}
                                className="text-[#00C896] text-[10px] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                              >
                                 {isExpanded ? 'Show less' : 'Read full description'}
                              </button>
                            )}
                         </div>

                         {/* Discussion & voters count */}
                         <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                            <div className="flex items-center gap-1.5">
                               <MessageSquare className="size-3.5 text-slate-300" />
                               <span>{item.commentsCount || 0} comments</span>
                            </div>
                            <div className="flex items-center gap-1">
                               <Users className="size-3.5 text-slate-300" />
                               <span>{item.votes} voted</span>
                            </div>
                         </div>
                      </div>

                      {/* Card Footer Actions row */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
                         
                         {/* Proposed By info */}
                         <div className="flex items-center gap-2">
                            <img src={item.proposedByAvatar} className="size-6 rounded-full border border-slate-200 object-cover bg-slate-100" />
                            <p className="text-[10px] text-slate-400 font-bold">By <span className="text-slate-700">{item.proposedBy}</span></p>
                         </div>

                         {/* Compact Vote Button */}
                         <button 
                           onClick={() => handleVote(item.id)}
                           className={cn(
                             "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest cursor-pointer border transition-all duration-300 active:scale-[0.94]",
                             item.voted 
                               ? "bg-[#00C896] border-transparent text-[#0F1F3D] shadow-sm shadow-[#00C896]/15" 
                               : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700"
                           )}
                         >
                            <ThumbsUp className="size-3 stroke-[2.5]" />
                            <span>{item.voted ? 'Voted' : 'Vote'}</span>
                         </button>
                      </div>

                      {/* HR Response overlay banner if approved/in-review */}
                      {item.hrNote && isExpanded && (
                        <div className="mt-3 p-3 rounded-xl border border-blue-100 bg-blue-50/50 backdrop-blur-sm text-[11px]">
                           <p className="font-extrabold text-blue-700 uppercase tracking-widest mb-0.5">HR Response</p>
                           <p className="font-medium text-blue-800 leading-relaxed">{item.hrNote}</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              // ULTRA COMPACT TABLE/LIST LAYOUT (1 row per item, highly scroll-friendly)
              <motion.div 
                layout
                className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
              >
                 <div className="hidden sm:grid grid-cols-12 gap-4 bg-slate-50 px-6 py-3 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    <div className="col-span-6">Topic / Description</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-2">Proposed By</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-center">Action</div>
                 </div>

                 <div className="divide-y divide-slate-100">
                    {filteredItems.map((item, index) => (
                      <motion.div
                        layout
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "grid grid-cols-1 sm:grid-cols-12 gap-4 items-center px-6 py-4 transition-all duration-300 hover:bg-slate-50/50",
                          item.voted && "bg-[#00C896]/[0.005]"
                        )}
                      >
                         {/* Topic Column */}
                         <div className="col-span-1 sm:col-span-6 space-y-1">
                            <div className="flex items-center gap-2">
                               <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-primary transition-colors leading-snug">{item.title}</h4>
                               {item.votes >= 30 && <span className="text-orange-500 text-xs animate-pulse" title="Trending Topic">🔥</span>}
                            </div>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed truncate max-w-lg">{item.description}</p>
                         </div>

                         {/* Category Column */}
                         <div className="col-span-1 sm:col-span-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest border",
                              item.category === 'Technical' ? "bg-blue-50/80 text-blue-600 border-blue-100" : "bg-orange-50/80 text-orange-600 border-orange-100"
                            )}>{item.category}</span>
                         </div>

                         {/* Proposed By Column */}
                         <div className="col-span-1 sm:col-span-2 flex items-center gap-2">
                            <img src={item.proposedByAvatar} className="size-5 rounded-full object-cover border border-slate-200 bg-slate-100" />
                            <span className="text-xs text-slate-600 font-bold">{item.proposedBy}</span>
                         </div>

                         {/* Status Column */}
                         <div className="col-span-1 sm:col-span-1 text-left sm:text-center">
                            <span className={cn(
                              "inline-flex items-center justify-center size-5 rounded-full border shadow-xs",
                              item.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                              item.status === 'in-review' ? "bg-amber-50 text-amber-600 border-amber-200" :
                              "bg-slate-50 text-slate-400 border-slate-200"
                            )} title={item.status === 'approved' ? 'Approved by HR' : item.status === 'in-review' ? 'In Review' : 'Pending Review'}>
                               {item.status === 'approved' ? <CheckCircle2 className="size-3.5" /> : 
                                item.status === 'in-review' ? <Clock className="size-3.5" /> : 
                                <AlertCircle className="size-3.5" />}
                            </span>
                         </div>

                         {/* Vote Button Column */}
                         <div className="col-span-1 sm:col-span-1 flex items-center justify-end sm:justify-center gap-3">
                            <span className="text-xs font-bold text-slate-700 sm:hidden">Votes: {item.votes}</span>
                            <button 
                              onClick={() => handleVote(item.id)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest cursor-pointer border transition-all duration-300 active:scale-[0.94]",
                                item.voted 
                                  ? "bg-[#00C896] border-transparent text-[#0F1F3D]" 
                                  : "bg-white hover:bg-slate-100 border-slate-200 text-slate-500"
                              )}
                            >
                               <ThumbsUp className="size-3 stroke-[2.5]" />
                               <span>{item.votes}</span>
                            </button>
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </motion.div>
            )
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-3xl p-16 text-center border border-slate-200/60 shadow-sm"
            >
               <Award className="size-16 text-slate-300 mx-auto mb-6" />
               <h3 className="text-xl font-bold text-slate-800 mb-2">No learning requests found</h3>
               <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                  We couldn't find any learning requests matching your criteria. Propose your own or try adjusting your search terms!
               </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* GAMIFICATION FOOTNOTE */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200/50 shadow-sm">
               <Flame className="size-4.5" />
            </div>
            <p className="text-slate-600 text-xs font-semibold leading-relaxed">
               **Propose helpful training topics**! You will earn <span className="text-[#00C896] font-extrabold">10 InnerG points</span> immediately upon approval by HR.
            </p>
         </div>
      </div>

      {/* REQUEST MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsModalOpen(false)}
               className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
             />

             <motion.div 
               initial={{ opacity: 0, scale: 0.96, y: 15 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.96, y: 15 }}
               className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl p-6 lg:p-8 z-10 border border-slate-100"
             >
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all cursor-pointer"
                >
                   <X className="size-5" />
                </button>

                <div className="space-y-6">
                   <div>
                      <div className="px-3.5 py-1 bg-[#00C896]/15 text-[#00C896] text-[10px] font-extrabold uppercase tracking-widest rounded-full w-fit mb-3">SKILL PROPOSAL</div>
                      <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Request a Training Session</h2>
                      <p className="text-slate-400 text-xs mt-1">Propose topics, tools, or frameworks you want internal experts to teach.</p>
                   </div>

                   <form onSubmit={handleCreateRequest} className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                         <label className="text-slate-800 text-[10px] font-extrabold uppercase tracking-wider">Skill / Topic Title</label>
                         <input 
                           type="text"
                           placeholder="e.g. Next.js App Router & Server Actions"
                           value={newRequest.title}
                           onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                           required
                           className="w-full bg-slate-50 border border-slate-200 focus:border-[#00C896] focus:bg-white text-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none transition-all"
                         />
                      </div>

                      <div className="flex flex-col gap-1.5">
                         <label className="text-slate-800 text-[10px] font-extrabold uppercase tracking-wider">Category</label>
                         <select 
                           value={newRequest.category}
                           onChange={(e) => setNewRequest(prev => ({ ...prev, category: e.target.value }))}
                           className="w-full bg-slate-50 border border-slate-200 focus:border-[#00C896] focus:bg-white text-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none transition-all cursor-pointer"
                         >
                            <option value="Technical">Technical (Coding, Tools, Engineering)</option>
                            <option value="Soft Skill">Soft Skill (Communication, Strategy)</option>
                            <option value="Design">Design (UI/UX, Branding)</option>
                            <option value="Product">Product Management</option>
                         </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                         <label className="text-slate-800 text-[10px] font-extrabold uppercase tracking-wider">Description</label>
                         <textarea 
                           placeholder="Describe what you want to learn, key concepts, or target libraries."
                           value={newRequest.description}
                           rows={3}
                           onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                           required
                           className="w-full bg-slate-50 border border-slate-200 focus:border-[#00C896] focus:bg-white text-slate-800 text-xs p-4 rounded-xl focus:outline-none transition-all resize-none"
                         />
                      </div>

                      <div className="flex flex-col gap-1.5">
                         <label className="text-slate-800 text-[10px] font-extrabold uppercase tracking-wider">Business Impact (Optional)</label>
                         <input 
                           type="text"
                           placeholder="e.g. Will improve team's frontend speed & SEO rankings"
                           value={newRequest.reason}
                           onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                           className="w-full bg-slate-50 border border-slate-200 focus:border-[#00C896] focus:bg-white text-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none transition-all"
                         />
                      </div>

                      <div className="pt-3 flex gap-3">
                         <button 
                           type="button" 
                           onClick={() => setIsModalOpen(false)}
                           className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                         >
                            Cancel
                         </button>
                         <button 
                           type="submit" 
                           className="flex-1 bg-gradient-to-r from-[#00C896] to-[#00B083] text-[#0F1F3D] font-extrabold py-3.5 rounded-xl text-[10px] uppercase tracking-wider shadow-md shadow-[#00C896]/10 hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                         >
                            <Send className="size-3.5" /> Submit Request
                         </button>
                      </div>
                   </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  FolderOpen, 
  Search, 
  Download, 
  BookOpen, 
  FileText, 
  Video, 
  ExternalLink, 
  Bookmark, 
  ChevronRight, 
  Calendar, 
  User, 
  Clock, 
  Sparkles, 
  Code, 
  Filter, 
  ArrowUpRight,
  BookmarkCheck,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

export default function ResourceHub() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, pre-session, post-session, bookmarked
  const [selectedTag, setSelectedTag] = useState('All');
  const [toast, setToast] = useState(null);
  
  // Mock Resources Database
  const [resources, setResources] = useState([
    {
      id: 1,
      workshopTitle: "Advanced Product Strategy Masterclass",
      date: "Sep 19, 2026",
      mentor: "Nguyen Van Minh",
      mentorAvatar: "https://i.pravatar.cc/150?u=minh",
      tag: "Product",
      bookmarked: true,
      downloadsCount: 142,
      files: [
        { name: "Product Strategy Framework Slide.pdf", type: "pdf", size: "4.8 MB", phase: "post-session", url: "#" },
        { name: "Competitor Analysis Template.xlsx", type: "sheet", size: "1.2 MB", phase: "pre-session", url: "#" },
        { name: "Full Session High-Quality Recording", type: "video", duration: "1h 45m", phase: "post-session", url: "#" }
      ]
    },
    {
      id: 2,
      workshopTitle: "Generative AI Integration with LLMs & LangChain",
      date: "Upcoming (Sep 26, 2026)",
      mentor: "Alex Rivera",
      mentorAvatar: "https://i.pravatar.cc/150?u=alex",
      tag: "Technical",
      bookmarked: false,
      downloadsCount: 89,
      files: [
        { name: "Prerequisite Setup & Key API Keys.md", type: "code", size: "12 KB", phase: "pre-session", url: "#" },
        { name: "Vite React Starter Boilerplate Repository", type: "repo", size: "GitHub Link", phase: "pre-session", url: "https://github.com" },
        { name: "LangChain Concept Cheatsheet.pdf", type: "pdf", size: "2.1 MB", phase: "pre-session", url: "#" }
      ]
    },
    {
      id: 3,
      workshopTitle: "Strategic Stakeholder Communication & Negotiation",
      date: "Sep 12, 2026",
      mentor: "Sarah Chen",
      mentorAvatar: "https://i.pravatar.cc/150?u=sarah",
      tag: "Soft Skill",
      bookmarked: false,
      downloadsCount: 64,
      files: [
        { name: "Session Slides Handout.pdf", type: "pdf", size: "3.2 MB", phase: "post-session", url: "#" },
        { name: "Negotiation Roleplay Scenario Card.pdf", type: "pdf", size: "750 KB", phase: "pre-session", url: "#" },
        { name: "Roleplay Exercise Recording", type: "video", duration: "42 min", phase: "post-session", url: "#" }
      ]
    },
    {
      id: 4,
      workshopTitle: "Clean Code & Refactoring Practices in C#",
      date: "Sep 05, 2026",
      mentor: "Tran Minh Dang",
      mentorAvatar: "https://i.pravatar.cc/150?u=dang",
      tag: "Technical",
      bookmarked: true,
      downloadsCount: 201,
      files: [
        { name: "SOLID Principles Annotated Slide.pdf", type: "pdf", size: "5.1 MB", phase: "post-session", url: "#" },
        { name: "Refactoring Exercise Source Code", type: "repo", size: "GitHub Link", phase: "post-session", url: "https://github.com" },
        { name: "Refactored Clean Code Solution.zip", type: "zip", size: "3.4 MB", phase: "post-session", url: "#" }
      ]
    }
  ]);

  const handleBookmark = (id) => {
    setResources(prev => prev.map(res => {
      if (res.id === id) {
        const nextState = !res.bookmarked;
        setToast(nextState ? "Added resource to bookmarks! 📚" : "Removed from bookmarks");
        setTimeout(() => setToast(null), 3000);
        return { ...res, bookmarked: nextState };
      }
      return res;
    }));
  };

  const handleDownloadFile = (fileName) => {
    setToast(`Downloading "${fileName}"... 📥`);
    setTimeout(() => setToast(null), 3000);
  };

  // Filter & Search logic
  const filteredResources = resources.filter(res => {
    const matchesSearch = res.workshopTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.mentor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.files.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag === 'All' || res.tag === selectedTag;

    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'pre-session' ? res.files.some(f => f.phase === 'pre-session') :
      activeTab === 'post-session' ? res.files.some(f => f.phase === 'post-session') :
      activeTab === 'bookmarked' ? res.bookmarked : true;

    return matchesSearch && matchesTag && matchesTab;
  });

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto pb-16">
      
      {/* HERO SECTION */}
      <section className="relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-[#0F1F3D] via-[#1b2d56] to-[#0A1224] rounded-3xl p-8 lg:p-10 overflow-hidden border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#00C896]/10 rounded-full blur-[110px] -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[280px] h-[280px] bg-blue-500/10 rounded-full blur-[90px] -ml-28 -mb-28 pointer-events-none" />
          
          <div className="relative z-10 space-y-3 max-w-2xl">
             <div className="flex items-center gap-2 px-3.5 py-1 bg-[#00C896]/10 border border-[#00C896]/20 rounded-full w-fit backdrop-blur-sm shadow-inner shadow-white/5">
                <Sparkles className="size-3.5 text-[#00C896] animate-pulse" />
                <span className="text-[#00C896] text-[10px] font-bold uppercase tracking-widest">Internal Knowledge Hub</span>
             </div>
             <h1 className="text-2xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
               Resource Hub
             </h1>
             <p className="text-slate-300 text-xs lg:text-sm leading-relaxed font-medium">
               Access high-quality study files, recorded videos, slides, and source code. Review pre-session setup files to prepare early, or revisit post-session documents to deepen your expertise.
             </p>
          </div>

          <div className="relative z-10 shrink-0">
             <div className="size-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[#00C896] backdrop-blur-md shadow-inner">
                <FolderOpen className="size-8" />
             </div>
          </div>
        </motion.div>
      </section>

      {/* SEARCH, FILTER & TAB CONTROL BAR */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
         
         {/* Search & Tag dropdown */}
         <div className="flex flex-col sm:flex-row gap-3 w-full xl:max-w-xl">
            {/* Search */}
            <div className="relative flex-1">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
               <input 
                 type="text"
                 placeholder="Search workshop name, mentor, files..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300/80 focus:border-[#00C896] focus:bg-white text-slate-800 text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none transition-all"
               />
            </div>
            
            {/* Tag Filter */}
            <div className="relative shrink-0 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 gap-2 hover:bg-slate-100 transition-colors">
               <Filter className="size-3.5 text-slate-400" />
               <span>Category:</span>
               <select 
                 value={selectedTag} 
                 onChange={(e) => setSelectedTag(e.target.value)}
                 className="bg-transparent focus:outline-none cursor-pointer pr-1"
               >
                  <option value="All">All Categories</option>
                  <option value="Technical">Technical</option>
                  <option value="Soft Skill">Soft Skill</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
               </select>
            </div>
         </div>

         {/* Phase Tabs */}
         <div className="flex items-center gap-1.5 w-full xl:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'All Resources' },
              { id: 'pre-session', label: '🎒 Pre-Session Prep' },
              { id: 'post-session', label: '🎓 Post-Session Review' },
              { id: 'bookmarked', label: '★ Bookmarks' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-[#0F1F3D] text-white border-transparent shadow-sm" 
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
         </div>
      </div>

      {/* DENSE RESOURCE CARD GRID */}
      <div>
         <AnimatePresence mode="popLayout">
            {filteredResources.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredResources.map((res, index) => (
                     <motion.div
                       layout
                       key={res.id}
                       initial={{ opacity: 0, scale: 0.96 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.92 }}
                       transition={{ duration: 0.2, delay: index * 0.04 }}
                       className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                     >
                        <div className="space-y-5">
                           
                           {/* Bundle Top Info */}
                           <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                 <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest bg-emerald-50 text-[#00C896] border border-[#00C896]/20">
                                       {res.tag}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                       <Calendar className="size-3" /> {res.date}
                                    </span>
                                 </div>
                                 <h3 className="text-base lg:text-lg font-extrabold text-slate-800 leading-snug line-clamp-2" title={res.workshopTitle}>
                                    {res.workshopTitle}
                                 </h3>
                              </div>

                              <button 
                                onClick={() => handleBookmark(res.id)}
                                className={cn(
                                  "size-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0",
                                  res.bookmarked 
                                    ? "bg-amber-50 text-amber-500 border-amber-200" 
                                    : "bg-slate-50 text-slate-400 border-slate-250 hover:bg-slate-100"
                                )}
                              >
                                 <Bookmark className={cn("size-4", res.bookmarked && "fill-current")} />
                              </button>
                           </div>

                           {/* Instructor Detail */}
                           <div className="flex items-center gap-2.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/50">
                              <img src={res.mentorAvatar} className="size-7 rounded-full object-cover border border-slate-200 bg-slate-100" />
                              <div>
                                 <p className="text-[10px] text-slate-400 font-bold">WORKSHOP HOST</p>
                                 <p className="text-xs font-extrabold text-slate-700">{res.mentor}</p>
                              </div>
                           </div>

                           {/* File List Segment */}
                           <div className="space-y-2">
                              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Included Materials ({res.files.length})</p>
                              <div className="divide-y divide-slate-100 bg-slate-50/40 border border-slate-200/40 rounded-xl overflow-hidden">
                                 {res.files.map((file, idx) => {
                                    // Match icons based on type
                                    const isVideo = file.type === 'video';
                                    const isCode = file.type === 'code' || file.type === 'repo';
                                    
                                    return (
                                       <div 
                                         key={idx}
                                         className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 transition-colors group/row"
                                       >
                                          <div className="flex items-center gap-3 min-w-0">
                                             <div className={cn(
                                               "size-8 rounded-lg flex items-center justify-center border shrink-0",
                                               isVideo ? "bg-red-50 text-red-500 border-red-100" :
                                               isCode ? "bg-slate-900 text-white border-transparent" :
                                               "bg-blue-50 text-blue-500 border-blue-100"
                                             )}>
                                                {isVideo ? <PlayCircle className="size-4.5" /> :
                                                 isCode ? <Code className="size-4.5" /> :
                                                 <FileText className="size-4.5" />}
                                             </div>
                                             
                                             <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-700 truncate max-w-[240px] group-hover/row:text-primary transition-colors">{file.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                   <span className={cn(
                                                     "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest",
                                                     file.phase === 'pre-session' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                                                   )}>
                                                      {file.phase === 'pre-session' ? 'Pre-prep' : 'Review'}
                                                   </span>
                                                   <span className="text-[9px] text-slate-400 font-bold uppercase">{file.size || file.duration}</span>
                                                </div>
                                             </div>
                                          </div>

                                          <button 
                                            onClick={() => handleDownloadFile(file.name)}
                                            className="size-8 rounded-lg bg-white border border-slate-200 hover:border-[#00C896] hover:text-[#00C896] flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
                                            title={file.type === 'repo' ? 'Open Repo' : 'Download File'}
                                          >
                                             {file.type === 'repo' ? <ArrowUpRight className="size-4" /> : <Download className="size-4" />}
                                          </button>
                                       </div>
                                    );
                                 })}
                              </div>
                           </div>

                        </div>

                        {/* Card bottom download action summary */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-5 text-[10px] text-slate-400 font-bold uppercase">
                           <span>Downloaded {res.downloadsCount} times</span>
                           <button 
                             onClick={() => {
                               res.files.forEach(f => handleDownloadFile(f.name));
                             }}
                             className="text-[#00C896] hover:underline cursor-pointer flex items-center gap-1"
                           >
                              Download All Package <Download className="size-3.5" />
                           </button>
                        </div>
                     </motion.div>
                  ))}
               </div>
            ) : (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="bg-white rounded-3xl p-16 text-center border border-slate-200/60 shadow-sm"
               >
                  <FolderOpen className="size-16 text-slate-350 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No resources found</h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                     Try adjusting your search criteria or explore other categories of files to prepare for upcoming workshops.
                  </p>
               </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* INFORMATION FOOTNOTE */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200 shadow-sm">
               <BookOpen className="size-4.5" />
            </div>
            <p className="text-slate-600 text-xs font-semibold leading-relaxed">
               **Prerequisite Setup**: Remember to download and execute all **Pre-prep** guides at least 2 hours before the session starts to prevent setup issues during workshops!
            </p>
         </div>
      </div>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ left: '50%', translateX: '-50%' }}
            className="fixed bottom-10 z-[200] px-6 py-4 bg-slate-900/95 backdrop-blur-sm text-white rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-3 border border-slate-800"
          >
            <div className="size-6 bg-[#00C896] rounded-full flex items-center justify-center text-[#0F1F3D] shrink-0 shadow-[0_0_8px_#00C896]">
              <ChevronRight className="size-4.5" />
            </div>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

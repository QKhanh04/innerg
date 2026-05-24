/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { 
  Trophy, 
  ChevronRight, 
  Play, 
  Calendar, 
  Clock, 
  Star,
  BookOpen,
  Video,
  Mic,
  MapPin,
  Users2,
  Info,
  X,
  ArrowRight,
  Sparkles,
  Flame,
  TrendingUp,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useRole } from '../../../lib/RoleContext';

export default function DashboardPage() {
  const { user } = useRole();
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');

  const handleRegister = (title) => {
    setToast(`Successfully registered for ${title}! 🎉`);
    setTimeout(() => setToast(null), 3000);
  };

  const heroWorkshop = {
    id: 'hero-1',
    title: "Advanced Product Strategy Masterclass",
    instructor: "Nguyen Van Minh",
    role: "Senior Product Manager",
    rating: "4.9",
    location: "Room 402 • HQ Building",
    joined: "42/50",
    duration: "90 min",
    tags: ['Product Strategy', 'Leadership', 'Internal'],
    description: "Deep dive into product-led growth, market positioning, and scalable strategy frameworks used by industry leaders. This session covers practical case studies and hands-on exercises.",
    outcomes: [
      "Master the 7-step strategy framework",
      "Build a scalable product roadmap",
      "Learn to align stakeholders on vision"
    ]
  };

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-16">
      
      {/* SECTION 1 — HERO "NEXT UP" BANNER */}
      <section className="relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative bg-gradient-to-br from-[#0F1F3D] via-[#172554] to-[#0B132B] rounded-[32px] overflow-hidden min-h-[380px] flex flex-col lg:flex-row shadow-xl shadow-slate-900/10 border border-slate-800"
        >
          {/* Decorative Background Lighting Effects */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00C896]/10 rounded-full blur-[130px] -mr-80 -mt-80 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[110px] -ml-40 -mb-40 pointer-events-none" />
          
          {/* LEFT SIDE: Class Info (60%) */}
          <div className="flex-[0.60] p-10 lg:p-14 relative overflow-hidden flex flex-col justify-between">
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2 px-4 py-1.5 bg-[#00C896]/10 border border-[#00C896]/20 rounded-full backdrop-blur-sm shadow-inner shadow-white/5">
                      <span className="size-2 bg-[#00C896] rounded-full animate-pulse shadow-[0_0_10px_#00C896]" />
                      <span className="text-[#00C896] text-xs font-bold uppercase tracking-widest">Live in 2h 45m</span>
                   </div>
                </div>

                <h1 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight max-w-2xl bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  {heroWorkshop.title}
                </h1>

                <div className="flex items-center gap-4 bg-white/5 w-fit pr-6 pl-2 py-2 rounded-full border border-white/10 backdrop-blur-md shadow-sm">
                   <div className="size-11 rounded-full border-2 border-[#00C896] p-0.5 bg-[#0F1F3D] overflow-hidden">
                      <img src={`https://i.pravatar.cc/150?u=${heroWorkshop.instructor}`} className="size-full rounded-full object-cover" alt="Mentor" />
                   </div>
                   <div>
                      <p className="text-slate-300 font-medium text-xs">Hosted by <span className="font-bold text-white">{heroWorkshop.instructor}</span></p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <Star className="size-3 text-amber-400 fill-amber-400" />
                         <span className="text-slate-200 text-[11px] font-bold">{heroWorkshop.rating}</span>
                         <span className="text-slate-500 text-[10px]">•</span>
                         <span className="text-slate-400 text-[11px]">{heroWorkshop.role}</span>
                      </div>
                   </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-slate-300 text-sm font-medium pt-2">
                   <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-[#00C896]" />
                      <span>{heroWorkshop.location}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Users2 className="size-4 text-[#00C896]" />
                      <span>{heroWorkshop.joined} Joined</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Clock className="size-4 text-[#00C896]" />
                      <span>{heroWorkshop.duration}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* RIGHT SIDE: Smart Recommendation Action Panel (40%) */}
          <div className="flex-[0.40] bg-gradient-to-br from-[#162040] via-[#0f1836] to-[#091026] p-10 lg:p-14 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col justify-between relative">
             <div>
                <p className="text-[#00C896] text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Sparkles className="size-4" /> Customized Alignment
                </p>
                <div className="space-y-4">
                   {[
                      `Matches your interest in UI Design & Strategy`,
                      `Highly relevant to your current Product Management path`
                   ].map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-white/5 hover:bg-white/[0.07] p-3.5 rounded-2xl border border-white/5 backdrop-blur-sm transition-all duration-300">
                         <div className="size-2 bg-[#00C896] rounded-full mt-2 shrink-0 shadow-[0_0_8px_#00C896]" />
                         <p className="text-slate-300 text-sm font-medium leading-relaxed">{reason}</p>
                      </div>
                   ))}
                </div>
             </div>

             <div className="space-y-4 mt-8">
                <div className="flex gap-3">
                   <button 
                     onClick={() => handleRegister(heroWorkshop.title)}
                     className="flex-1 bg-gradient-to-r from-[#00C896] to-[#00B083] hover:from-[#00E0A8] hover:to-[#00C896] text-[#0F1F3D] py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-[#00C896]/20 flex items-center justify-center gap-2 cursor-pointer"
                   >
                      Register Now <ArrowRight className="size-4" />
                   </button>
                  <button 
                    onClick={() => setSelectedWorkshop(heroWorkshop)}
                     className="size-14 shrink-0 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl transition-all flex items-center justify-center border border-white/10 hover:border-white/20 group cursor-pointer"
                     title="View Details"
                   >
                      <Info className="size-5 group-hover:scale-110 transition-transform" />
                   </button>
                </div>
                <button className="w-full bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 py-3 rounded-2xl font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer">
                   <Calendar className="size-4" /> Add to Calendar Schedule
                </button>
             </div>
          </div>
        </motion.div>
      </section>

      {/* SECTION 2 — WEEKLY ROADMAP + POINTS WIDGET */}
      <div className="flex flex-col xl:flex-row gap-12">
        {/* LEFT: Weekly Roadmap (65%) */}
        <div className="flex-[0.65] space-y-8">
          <div className="flex items-center justify-between">
             <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
               <TrendingUp className="size-6 text-primary" /> Weekly Roadmap
             </h2>
             <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-300/30 backdrop-blur-sm">
                <button 
                  onClick={() => setActiveTab('timeline')}
                  className={cn(
                    "px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    activeTab === 'timeline' 
                      ? "bg-white text-slate-800 shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Timeline
                </button>
                <button 
                  onClick={() => setActiveTab('calendar')}
                  className={cn(
                    "px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    activeTab === 'calendar' 
                      ? "bg-white text-slate-800 shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Calendar
                </button>
             </div>
          </div>

          <div className="relative pl-4">
             {/* Centered Timeline Line */}
             <div className="absolute left-[38px] top-6 bottom-6 w-[2px] bg-slate-200/80" />
             
             <div className="space-y-6 relative z-10">
                <RoadmapItem 
                  date="TODAY"
                  time="10:00 AM"
                  title="Workshop: Leadership Fundamentals"
                  instructor="Alex Rivera"
                  status="active"
                  category="Internal"
                  onViewDetails={setSelectedWorkshop}
                  onRegister={handleRegister}
                />
                <RoadmapItem 
                  date="WED, SEP 23"
                  time="01:00 PM"
                  title="Advanced React Masterclass"
                  instructor="Minh Dang"
                  status="later"
                  category="Hard Skill"
                  onViewDetails={setSelectedWorkshop}
                  onRegister={handleRegister}
                />
                <RoadmapItem 
                  date="FRI, SEP 25"
                  time="02:30 PM"
                  title="Mentorship Strategy Session"
                  instructor="Sarah Chen"
                  status="upcoming"
                  category="1-on-1"
                  onViewDetails={setSelectedWorkshop}
                  onRegister={handleRegister}
                />
             </div>
          </div>
        </div>

        {/* RIGHT: Points Widget + Activity Stream (35%) */}
        <aside className="flex-[0.35] space-y-8">
          
          {/* POINTS WIDGET (Ultra premium Glassmorphic mesh gradient design) */}
          <div className="bg-gradient-to-br from-[#0F1F3D] via-[#1a2d52] to-[#047857] rounded-3xl p-8 shadow-xl relative overflow-hidden group border border-slate-800/80">
             <div className="absolute top-0 right-0 w-52 h-52 bg-[#00C896]/20 rounded-full blur-[70px] -mr-20 -mt-20 group-hover:scale-110 transition-all duration-700 pointer-events-none" />
             
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                   <div className="flex items-center justify-between mb-8">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Trophy className="size-4 text-[#00C896] animate-bounce" /> Current Balance
                      </p>
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white text-[10px] font-bold uppercase">Level 8</span>
                   </div>
                   
                   <div className="flex items-baseline gap-2 mb-8">
                      <h3 className="text-5xl font-extrabold text-white tracking-tight">1,240</h3>
                      <p className="text-[#00C896] font-bold text-sm tracking-widest">PTS</p>
                   </div>
                </div>
                
                <div className="space-y-3">
                   <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>Progress</span>
                      <span className="text-slate-400">850 / 2,000 to Level 9</span>
                   </div>
                   <div className="h-2.5 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/5 p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '42.5%' }}
                        className="h-full bg-gradient-to-r from-[#00C896] to-[#00E0A8] rounded-full relative"
                      >
                         <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]" />
                      </motion.div>
                   </div>
                   <p className="text-[11px] font-semibold text-slate-400 text-center mt-2 leading-relaxed">
                      Earn <span className="text-[#00C896] font-extrabold">1,150 more points</span> for Level 9 🚀
                   </p>
                </div>

                <div className="h-px bg-white/10 my-6" />

                <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-white font-bold py-3.5 rounded-xl text-xs transition-all tracking-wider uppercase cursor-pointer">
                  Visit Rewards Store
                </button>
             </div>
          </div>

          {/* ACTIVITY STREAM */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
             <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">Activity Stream</h3>
                <button className="text-xs text-slate-400 hover:text-primary font-bold cursor-pointer transition-colors">View all</button>
             </div>
             <div className="space-y-1">
                 <ActivityItem icon={BookOpen} title="Q3 Strategy Guide" type="Resource • 2h ago" color="blue" />
                 <ActivityItem icon={Video} title="Communication Mastery" type="Video • 5h ago" color="purple" />
                 <ActivityItem icon={Mic} title="Growth Fireside Chat" type="Podcast • Yesterday" color="orange" />
             </div>
          </div>

          {/* TRENDING SKILLS */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
             <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
               <Flame className="size-5 text-orange-500 animate-pulse" /> Trending in Tech
             </h3>
             <div className="flex flex-wrap gap-2.5">
                <TrendingTag label="Gen AI" count="28" heat="hot" />
                <TrendingTag label="React" count="21" heat="hot" />
                <TrendingTag label="Zustand" count="14" heat="rising" />
                <TrendingTag label="Motion" count="11" heat="normal" />
                <TrendingTag label="Next.js" count="19" heat="normal" />
             </div>
          </div>
        </aside>
      </div>

      {/* SECTION 3 — RECOMMENDED FOR YOU */}
      <section className="space-y-8">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recommended for You</h2>
               <span className="px-3 py-1 bg-[#00C896]/10 text-[#00C896] text-xs font-bold rounded-full border border-[#00C896]/20">Personalized</span>
            </div>
             <button className="text-sm font-semibold text-slate-400 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
               See all <ArrowRight className="size-4" />
             </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <RecommendedCard 
               title="Advanced Design Systems"
               stats="4.8 ★ • 12 Modules • ~4h"
               category="Technical"
               accent="blue"
               mentor="Alex Rivera"
               onViewDetails={setSelectedWorkshop}
               onRegister={handleRegister}
            />
            <RecommendedCard 
               title="Frontend for Designers"
               stats="4.9 ★ • 8 Modules • ~3h"
               category="Technical"
               accent="indigo"
               mentor="Minh Dang"
               onViewDetails={setSelectedWorkshop}
               onRegister={handleRegister}
            />
            <RecommendedCard 
               title="Stakeholder Communication"
               stats="4.7 ★ • 6 Modules • ~2h"
               category="Soft Skill"
               accent="orange"
               mentor="Sarah Chen"
               onViewDetails={setSelectedWorkshop}
               onRegister={handleRegister}
            />
            <RecommendedCard 
               title="Performance Optimization"
               stats="4.9 ★ • 10 Modules • ~5h"
               category="Technical"
               accent="green"
               mentor="John Doe"
               onViewDetails={setSelectedWorkshop}
               onRegister={handleRegister}
            />
         </div>
      </section>

      {/* WORKSHOP DETAILS MODAL */}
      <AnimatePresence>
        {selectedWorkshop && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWorkshop(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative w-full max-w-5xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[600px] max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedWorkshop(null)}
                className="absolute top-6 right-6 z-20 size-10 rounded-full bg-white/10 lg:bg-slate-100 flex items-center justify-center text-white lg:text-slate-500 hover:bg-white/20 lg:hover:bg-slate-200 transition-all backdrop-blur-md cursor-pointer"
              >
                <X className="size-5" />
              </button>

              {/* Modal Left: Info Panel */}
              <div className="flex-[0.4] bg-gradient-to-br from-[#0F1F3D] to-[#1e345e] p-10 lg:p-14 text-white relative overflow-hidden flex flex-col justify-between">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C896]/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                 
                 <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                    <div>
                       <div className="px-3 py-1.5 bg-[#00C896]/20 border border-[#00C896]/30 rounded-full text-[#00C896] text-xs font-bold uppercase tracking-widest inline-block mb-8">WORKSHOP DETAILS</div>
                       <h2 className="text-2xl lg:text-3xl font-extrabold leading-tight tracking-tight mb-8">{selectedWorkshop.title}</h2>
                       
                       <div className="space-y-6">
                          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                             <div className="size-12 rounded-full border-2 border-[#00C896] p-0.5 bg-[#0F1F3D] shrink-0 overflow-hidden">
                                <img src={`https://i.pravatar.cc/150?u=${selectedWorkshop.instructor}`} className="size-full rounded-full object-cover" />
                             </div>
                             <div>
                                <p className="font-bold text-base leading-snug">{selectedWorkshop.instructor}</p>
                                <p className="text-slate-300 text-xs mt-0.5">{selectedWorkshop.role}</p>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">Duration</p>
                                <p className="font-bold text-sm flex items-center gap-2"><Clock className="size-4 text-[#00C896]" /> {selectedWorkshop.duration || '90 min'}</p>
                              </div>
                              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">Rating</p>
                                <p className="font-bold text-sm flex items-center gap-2"><Star className="size-4 text-amber-400 fill-amber-400" /> {selectedWorkshop.rating}</p>
                              </div>
                          </div>
                       </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                       <button 
                         onClick={() => {
                           handleRegister(selectedWorkshop.title);
                           setSelectedWorkshop(null);
                         }}
                         className="w-full bg-gradient-to-r from-[#00C896] to-[#00B083] text-[#0F1F3D] py-4 rounded-xl font-bold text-sm shadow-xl shadow-[#00C896]/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                       >
                          Register for Session <ArrowRight className="size-4" />
                       </button>
                    </div>
                 </div>
              </div>

              {/* Modal Right: Details & Description */}
              <div className="flex-[0.6] p-10 lg:p-14 bg-white overflow-y-auto">
                 <div className="space-y-10 max-w-2xl">
                    <section>
                       <h3 className="text-slate-900 font-bold text-lg mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Info className="size-5 text-[#00C896]" /> About this Workshop
                       </h3>
                       <p className="text-slate-600 text-sm leading-relaxed">
                          {selectedWorkshop.description}
                       </p>
                    </section>

                    <section>
                       <h3 className="text-slate-900 font-bold text-lg mb-6 flex items-center gap-2 border-b border-slate-100 pb-2">
                         <Trophy className="size-5 text-[#00C896]" /> Learning Outcomes
                       </h3>
                       <div className="grid gap-3">
                          {selectedWorkshop.outcomes.map((item, i) => (
                             <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#00C896]/20 hover:bg-slate-50/80 transition-all duration-300">
                                <div className="size-6 rounded-full bg-[#00C896]/15 flex items-center justify-center text-[#00C896] font-extrabold text-[11px] shrink-0">{i+1}</div>
                                <p className="text-slate-700 text-xs font-semibold leading-relaxed pt-0.5">{item}</p>
                             </div>
                          ))}
                       </div>
                    </section>

                    <section>
                       <h3 className="text-slate-900 font-bold text-lg mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                         <MapPin className="size-5 text-[#00C896]" /> Location & Logistics
                       </h3>
                       <div className="flex items-center gap-4 p-5 border border-slate-200/75 rounded-2xl bg-slate-50/50">
                          <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                             <MapPin className="size-5" />
                          </div>
                          <div>
                             <p className="text-slate-900 font-bold text-sm">{selectedWorkshop.location}</p>
                             <p className="text-slate-500 text-[11px] mt-0.5">HQ Campus Standard Access Required. Please arrive 10 mins early.</p>
                          </div>
                       </div>
                    </section>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
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

function RoadmapItem({ date, time, title, instructor, status, category, onViewDetails, onRegister }) {
  const isNow = status === 'active';
  const isLater = status === 'later';

  const itemData = {
    title,
    instructor,
    role: "Expert Instructor",
    rating: "4.8",
    location: "Online Workshop",
    joined: "12/20",
    duration: "60 min",
    tags: [category, 'Skill Growth'],
    description: `Join us for this high-impact session on ${title}. This workshop is designed for intermediate to advanced learners looking to sharpen their expertise in ${category}.`,
    outcomes: [
       "Develop foundational and advanced practical knowledge",
       "Peer-to-peer networking with industry experts",
       "Access to exclusive downloadable resources"
    ]
  };

  return (
    <div className="flex gap-6 group relative">
      {/* Icon Column */}
      <div className="w-14 shrink-0 flex flex-col items-center relative z-20 pt-2">
        <div className={cn(
          "size-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
          isNow ? "bg-[#00C896] text-[#0F1F3D] shadow-lg shadow-[#00C896]/30 ring-4 ring-[#00C896]/20" : 
          isLater ? "bg-white text-slate-700 border-2 border-slate-200 group-hover:border-[#00C896]/50 group-hover:bg-slate-50" :
          "bg-slate-50 text-slate-400 border-2 border-slate-200"
        )}>
          {isNow ? <Play className="size-4.5 fill-current ml-1" /> : 
           isLater ? <Clock className="size-4.5" /> : 
           <Calendar className="size-4.5" />}
        </div>
      </div>
      
      {/* Card Column */}
      <div className={cn(
        "flex-1 p-6 rounded-2xl transition-all duration-300",
        isNow ? "bg-white border border-slate-200/60 shadow-lg shadow-slate-200/40 ring-1 ring-emerald-500/10" :
        isLater ? "bg-white border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300/80" :
        "bg-slate-50/50 border border-slate-200/50 shadow-none opacity-70"
      )}>
        <div className="flex items-center gap-3 mb-4">
           <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest",
              isNow ? "bg-[#00C896]/10 text-[#00C896]" : "bg-slate-100 text-slate-500"
           )}>
              {isNow && <span className="mr-1.5 animate-pulse text-[#00C896]">●</span>} {date} • {time}
           </span>
           <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border",
              category === 'Hard Skill' ? "bg-orange-50 text-orange-600 border-orange-100" :
              category === '1-on-1' ? "bg-blue-50 text-blue-600 border-blue-100" :
              "bg-slate-50 text-slate-500 border-slate-200"
           )}>{category}</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h4 className="text-lg lg:text-xl font-extrabold text-slate-900 mb-3 group-hover:text-primary transition-colors duration-300 leading-snug">{title}</h4>
              <div className="flex items-center gap-3">
                 <div className="size-7 rounded-full border border-slate-200 shadow-sm overflow-hidden bg-slate-100 shrink-0">
                    <img src={`https://i.pravatar.cc/150?u=${instructor}`} className="size-full object-cover" />
                 </div>
                 <p className="text-xs font-semibold text-slate-500">Led by <span className="text-slate-800 font-extrabold">{instructor}</span></p>
              </div>
           </div>
           
           <div className="flex gap-3 shrink-0 items-center">
             <button 
               onClick={() => onRegister(title)}
               className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer",
                isNow ? "bg-[#0F1F3D] text-white hover:bg-slate-800 shadow-sm shadow-slate-900/10" :
                isLater ? "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50" :
                "bg-transparent text-slate-400 hover:text-slate-600"
             )}>
                {isNow ? 'Join Now' : 'Remind Me'}
             </button>
             {!isNow && (
               <button 
                 onClick={() => onViewDetails(itemData)} 
                 className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                 <Info className="size-4.5" />
               </button>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ icon: Icon, title, type, color }) {
   const colorMap = {
      blue: "bg-blue-50/80 text-blue-600 border-blue-100",
      purple: "bg-purple-50/80 text-purple-600 border-purple-100",
      orange: "bg-orange-50/80 text-orange-600 border-orange-100"
   };

   return (
      <div className="flex items-center gap-4 py-3.5 hover:bg-slate-50 rounded-2xl transition-all duration-300 group cursor-pointer border-b border-slate-100 last:border-0 px-3 -mx-3">
         <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0 border", colorMap[color])}>
            <Icon className="size-4.5" />
         </div>
         <div className="flex-1 min-w-0">
            <p className="font-bold text-xs text-slate-800 mb-0.5 truncate group-hover:text-primary transition-colors">{title}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{type}</p>
         </div>
         <ChevronRight className="size-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
   );
}

function TrendingTag({ label, count, heat }) {
   return (
      <div className={cn(
         "px-3 py-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all duration-300 hover:shadow-sm active:scale-[0.98]",
         heat === 'hot' ? "bg-orange-50/50 border-orange-200/60 text-orange-700 hover:bg-orange-50" :
         heat === 'rising' ? "bg-emerald-50/50 border-emerald-200/60 text-emerald-700 hover:bg-emerald-50" :
         "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50"
      )}>
         <span className="text-[11px] font-bold">{label}</span>
         <span className="h-3 w-px bg-current opacity-20" />
         <span className="text-[10px] font-bold opacity-75">{count}</span>
      </div>
   );
}

function RecommendedCard({ title, stats, category, accent, mentor, onViewDetails, onRegister }) {
   const accentMap = {
      blue: "text-blue-600 bg-blue-50 border-blue-100",
      indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
      orange: "text-orange-600 bg-orange-50 border-orange-100",
      green: "text-[#00C896] bg-emerald-50 border-[#00C896]/20"
   };

   const accentStyle = accentMap[accent] || accentMap.blue;

   const itemData = {
    title,
    instructor: mentor,
    role: "Expert Mentor",
    rating: "4.9",
    location: "Online Course",
    joined: "128/150",
    duration: "4h",
    tags: [category, 'Top Rated'],
    description: `Master the principles of ${title} with our expert-led course. Includes hands-on projects, downloadable templates, and a recognized certificate of completion.`,
    outcomes: [
       "Practical application of modern methodologies",
       "Access to world-class mentoring network",
       "Certification of expertise upon completion"
    ]
  };

   return (
      <div className="bg-white rounded-[24px] p-6 border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-1.5 transition-all duration-300 group flex flex-col h-full">
         <div className="flex items-center justify-between mb-5">
            <span className={cn(
               "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border",
               accentStyle
            )}>{category}</span>
            <button className="size-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-500 hover:border-amber-200 transition-all cursor-pointer">
               <Bookmark className="size-4" />
            </button>
         </div>

         <h4 className="text-base font-extrabold text-slate-800 leading-snug mb-4 line-clamp-2 group-hover:text-primary transition-colors">{title}</h4>
         
         <div className="flex items-center gap-2.5 mb-5 mt-auto">
            <div className="size-7 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
               <img src={`https://i.pravatar.cc/150?u=${mentor}`} className="size-full object-cover" />
            </div>
            <p className="text-xs font-semibold text-slate-600">{mentor}</p>
         </div>

         <p className="text-[11px] font-bold text-slate-400 mb-6 flex items-center gap-1.5">
            <Star className="size-3.5 fill-amber-400 text-amber-400" /> {stats}
         </p>
         
         <div className="flex gap-2">
            <button 
              onClick={() => onRegister(title)}
              className="flex-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 hover:bg-slate-50 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
            >
               Enroll
            </button>
            <button 
              onClick={() => onViewDetails(itemData)}
              className="size-10 shrink-0 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-600 transition-all flex items-center justify-center cursor-pointer"
            >
               <Info className="size-4.5" />
            </button>
         </div>
      </div>
   );
}

import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Clock, 
  MapPin, 
  Video, 
  Check, 
  X, 
  Info, 
  AlertCircle,
  HelpCircle,
  Plus,
  Sliders,
  Calendar,
  Gift,
  ArrowRight,
  ChevronRight,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function CreateClassPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technical',
    level: 'Beginner',
    format: 'Online',
    meetingLink: '',
    location: '',
    date: '',
    time: '',
    duration: 60,
    maxSlots: 15,
    points: 100,
    department: 'All'
  });

  const [skills, setSkills] = useState(['React', 'Frontend']);
  const [skillInput, setSkillInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [aiOptimizing, setAiOptimizing] = useState(false);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Add custom skill tags dynamically
  const handleAddSkill = (e) => {
    e.preventDefault();
    const cleanInput = skillInput.trim();
    if (!cleanInput) return;
    if (skills.includes(cleanInput)) {
      showToast("Skill tag already added!");
      return;
    }
    setSkills(prev => [...prev, cleanInput]);
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  // AI Assistant Optimization Logic (Fills out optimal fields and reviews scheduling)
  const handleAIOptimize = () => {
    if (!formData.title) {
      showToast("Please enter a class title first to optimize!");
      return;
    }
    
    setAiOptimizing(true);
    setTimeout(() => {
      setAiOptimizing(false);
      setFormData(prev => ({
        ...prev,
        description: `This structured peer-learning workshop on "${prev.title}" is fully optimized to maximize hands-on collaboration. Attendees will acquire practical insights, complete dynamic coding challenges, and gain immediate architectural feedback.`,
        date: '2026-05-27', // Optimal Wednesday slot
        time: '15:00', // 03:00 PM
        points: 150
      }));
      if (!skills.includes('Software Architecture')) {
        setSkills(prev => [...prev, 'Software Architecture']);
      }
      showToast("Class optimized by InnerG AI! Optimal slot found: Wed at 03:00 PM 🚀");
    }, 1200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Core Form Validation
    if (!formData.title.trim()) {
      showToast("Please enter a class title");
      return;
    }
    if (!formData.description.trim()) {
      showToast("Please write a course syllabus/description");
      return;
    }
    if (!formData.date || !formData.time) {
      showToast("Please schedule a valid date and time slot");
      return;
    }
    if (formData.format === 'Online' && !formData.meetingLink) {
      showToast("Please provide an online meeting URL");
      return;
    }
    if (formData.format === 'Offline' && !formData.location) {
      showToast("Please provide a physical room location");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API registration
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 1500);
  };

  // Capacity visual feedback tags helper
  const getCapacityLabel = (slots) => {
    if (slots <= 10) return { text: "Intimate Mentorship (1-10 slots)", color: "text-amber-600 bg-amber-50" };
    if (slots <= 30) return { text: "Interactive Workshop (11-30 slots)", color: "text-indigo-600 bg-indigo-50" };
    return { text: "Company-wide Seminar (30+ slots)", color: "text-emerald-600 bg-emerald-50" };
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-16">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <BookOpen className="size-8 text-[#00C896]" />
            Host a Class
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Create internal training sessions, workshops, peer learning groups, or mentoring sessions.
          </p>
        </div>
        
        <button 
          onClick={() => navigate('/schedule')}
          className="px-4 py-2 border border-slate-250 hover:border-slate-350 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-extrabold transition-all cursor-pointer bg-white"
        >
          View My Schedule
        </button>
      </div>

      {/* 2. CORE FORM SECTION */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (2/3): Content and Specifications */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-6 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-[#00C896]/5 to-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

            <h3 className="font-extrabold text-slate-800 text-base tracking-tight flex items-center gap-2">
              Class Specifications
            </h3>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Class Title</label>
              <input 
                type="text" 
                name="title"
                placeholder="e.g. Advanced React state patterns & caching strategies"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-sm rounded-2xl outline-none transition-all placeholder:text-slate-400 text-slate-850"
              />
            </div>

            {/* Category & Difficulty Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Category</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-sm rounded-2xl outline-none transition-all text-slate-700 cursor-pointer"
                >
                  <option value="Technical">Technical</option>
                  <option value="Soft Skills">Soft Skills</option>
                  <option value="Design">Design</option>
                  <option value="Leadership">Leadership</option>
                  <option value="Wellness">Wellness</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Difficulty Level</label>
                <select 
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-sm rounded-2xl outline-none transition-all text-slate-700 cursor-pointer"
                >
                  <option value="Beginner">Beginner (All Levels)</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>

            {/* AI Assistant Help Banner inside left panel */}
            <div className="bg-gradient-to-r from-indigo-50/70 to-purple-50/70 p-4.5 rounded-2xl border border-indigo-100 flex items-center justify-between gap-4">
              <div className="flex gap-3 text-left">
                <Sparkles className="size-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-widest leading-none">InnerG AI Assistant</p>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Let AI recommend the optimal calendar slot, complete the syllabus, and auto-assign points reward.
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleAIOptimize}
                disabled={aiOptimizing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {aiOptimizing ? "Optimizing..." : "Optimize with AI"}
              </button>
            </div>

            {/* Description / Syllabus */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Syllabus & Description</label>
              <textarea 
                name="description"
                rows={5}
                placeholder="Detail what knowledge mentees will obtain, coding challenges they will tackle, or learning milestones they will achieve..."
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-sm rounded-2xl outline-none transition-all placeholder:text-slate-400 text-slate-850 resize-y min-h-[120px]"
              />
            </div>

            {/* Prerequisite Skill Tags */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Target Skills Exchanged</label>
              <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl min-h-[50px] items-center">
                {skills.map((skill, sIdx) => (
                  <span 
                    key={sIdx} 
                    className="inline-flex items-center gap-1 text-[9px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl uppercase tracking-wider"
                  >
                    {skill}
                    <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-indigo-900 cursor-pointer">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                
                {skills.length === 0 && (
                  <span className="text-xs text-slate-400 pl-2">No skills specified yet. Add one below!</span>
                )}
              </div>

              {/* Dynamic tag input box */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Add another prerequisite/target skill..." 
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(e);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-xs rounded-xl outline-none transition-all placeholder:text-slate-400 text-slate-800"
                />
                <button 
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-[0.98]"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN (1/3): Schedule & Logistics */}
        <div className="space-y-8">
          
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-6 text-left relative overflow-hidden">
            <h3 className="font-extrabold text-slate-800 text-base tracking-tight flex items-center gap-2">
              Logistics & Capacity
            </h3>

            {/* Format Selection Tab Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Format</label>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/40">
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, format: 'Online' }))}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    formData.format === 'Online' 
                      ? "bg-white text-indigo-650 shadow-sm border border-slate-200/50" 
                      : "text-slate-455 hover:text-slate-800"
                  )}
                >
                  <Video className="size-3.5" />
                  Online
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, format: 'Offline' }))}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    formData.format === 'Offline' 
                      ? "bg-white text-teal-650 shadow-sm border border-slate-200/50" 
                      : "text-slate-455 hover:text-slate-800"
                  )}
                >
                  <MapPin className="size-3.5" />
                  Offline
                </button>
              </div>
            </div>

            {/* Conditional Input based on Online / Offline selection */}
            <AnimatePresence mode="wait">
              {formData.format === 'Online' ? (
                <motion.div 
                  key="online-input"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-2 text-left"
                >
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Zoom/Teams Meeting URL</label>
                  <input 
                    type="url" 
                    name="meetingLink"
                    placeholder="https://zoom.us/j/987654321..."
                    value={formData.meetingLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-xs rounded-2xl outline-none transition-all placeholder:text-slate-400 text-slate-800"
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="offline-input"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-2 text-left"
                >
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Physical Room / Venue</label>
                  <input 
                    type="text" 
                    name="location"
                    placeholder="e.g. Floor 4, Meeting Room 402"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-xs rounded-2xl outline-none transition-all placeholder:text-slate-400 text-slate-800"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Target Date & Time */}
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Select Date</label>
                  <input 
                    type="date" 
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-xs rounded-2xl outline-none transition-all text-slate-700 cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Select Time</label>
                  <input 
                    type="time" 
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-xs rounded-2xl outline-none transition-all text-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              {/* Duration Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-650">
                  <span className="uppercase tracking-wider">Duration</span>
                  <span>{formData.duration} minutes</span>
                </div>
                <input 
                  type="range" 
                  name="duration"
                  min="30"
                  max="180"
                  step="15"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Slots Capacity Slider */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs font-bold text-slate-650">
                <span className="uppercase tracking-wider">Class Capacity</span>
                <span>{formData.maxSlots} Mentees</span>
              </div>
              <input 
                type="range" 
                name="maxSlots"
                min="5"
                max="100"
                step="5"
                value={formData.maxSlots}
                onChange={handleInputChange}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className={cn(
                "p-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-center",
                getCapacityLabel(formData.maxSlots).color
              )}>
                {getCapacityLabel(formData.maxSlots).text}
              </div>
            </div>

            {/* Attendance Rewards Points */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Gift className="size-4 text-emerald-500" />
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Attendance Reward points</label>
              </div>
              <input 
                type="number" 
                name="points"
                min="20"
                max="500"
                step="10"
                value={formData.points}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-xs rounded-2xl outline-none transition-all text-slate-800"
              />
              <span className="text-[9px] text-slate-400 leading-normal block">Mentees will earn this reward automatically upon successful training session check-in.</span>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#00C896] to-[#00B083] hover:brightness-105 active:scale-[0.98] text-[#0F1F3D] py-3.5 rounded-2xl font-extrabold text-xs uppercase tracking-widest transition-all shadow-md shadow-[#00C896]/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Creating class..." : "Create Training Class"}
              <ArrowRight className="size-4 stroke-[3.5]" />
            </button>

          </div>

        </div>

      </form>

      {/* 3. SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6"
            >
              <div className="size-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <Check className="size-8 stroke-[3]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Training Class Created!</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Your workshop <strong>"{formData.title}"</strong> is successfully created and published onto the public Skill Marketplace feed. Mentees can now register immediately.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 text-left space-y-2.5 text-xs font-bold text-slate-650">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">SCHEDULED</span>
                  <span>{formData.date} at {formData.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">VENUE</span>
                  <span className="truncate max-w-[200px]">{formData.format === 'Online' ? 'Zoom Link' : formData.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">REWARD</span>
                  <span className="text-emerald-600">+{formData.points} Points</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button 
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/schedule'); // Redirect to schedule to see the new class
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-2xl text-[10px] uppercase tracking-widest cursor-pointer transition-all active:scale-[0.98]"
                >
                  View on My Schedule
                </button>
                <button 
                  onClick={() => {
                    setShowSuccessModal(false);
                    // Reset fields
                    setFormData({
                      title: '',
                      description: '',
                      category: 'Technical',
                      level: 'Beginner',
                      format: 'Online',
                      meetingLink: '',
                      location: '',
                      date: '',
                      time: '',
                      duration: 60,
                      maxSlots: 15,
                      points: 100,
                      department: 'All'
                    });
                    setSkills([]);
                  }}
                  className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-250 py-3.5 rounded-2xl text-[10px] uppercase tracking-widest cursor-pointer transition-all active:scale-[0.98]"
                >
                  Create another class
                </button>
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

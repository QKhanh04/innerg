import React, { useState, useEffect } from 'react';
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
  Play,
  Paperclip,
  Link2,
  UploadCloud,
  FileText,
  Trash2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useNavigate, useParams } from 'react-router-dom';
import { mentorApi } from '../../../api/mentorApi';
import { exploreApi } from '../../../api/exploreApi';
import { toastService } from '../../../services/toastService';

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
    department: 'All',
    coverImageUrl: ''
  });

  const { id } = useParams();
  const isEditMode = !!id;
  const [isDataLoading, setIsDataLoading] = useState(isEditMode);

  const [skills, setSkills] = useState(['React', 'Frontend']);
  const [skillInput, setSkillInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [aiOptimizing, setAiOptimizing] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchClassDetails = async () => {
      try {
        setIsDataLoading(true);
        const detail = await exploreApi.getClassDetail(id);

        let category = 'Technical';
        if (detail.category === 'Course' || detail.category === 0) category = 'Course';
        else if (detail.category === 'Seminar' || detail.category === 2) category = 'Seminar';
        else category = 'Workshop';

        const format = detail.format || 'Online';
        const meetingLink = format === 'Online' ? (detail.sessions?.[0]?.locationOrLink || '') : '';
        const location = format === 'Offline' ? (detail.sessions?.[0]?.locationOrLink || '') : '';

        // Extract Date & Time from detail
        let rawDate = '';
        let rawTime = '';
        if (detail.date) {
          const dateStr = `${detail.date} ${detail.time}`;
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const day = String(parsedDate.getDate()).padStart(2, '0');
            rawDate = `${year}-${month}-${day}`;

            const hours = String(parsedDate.getHours()).padStart(2, '0');
            const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
            rawTime = `${hours}:${minutes}`;
          }
        }

        // Parse duration: e.g. "60 mins" or "2 hours"
        let durationMins = 60;
        if (detail.duration) {
          const match = detail.duration.match(/(\d+)\s*(min|hour|day)/i);
          if (match) {
            const val = parseInt(match[1], 10);
            const unit = match[2].toLowerCase();
            if (unit === 'min') durationMins = val;
            else if (unit === 'hour') durationMins = val * 60;
            else if (unit === 'day') durationMins = val * 1440;
          }
        }

        setFormData({
          title: detail.title || '',
          description: detail.description || '',
          category: category,
          level: detail.level || 'Beginner',
          format: format,
          meetingLink: meetingLink,
          location: location,
          date: rawDate,
          time: rawTime,
          duration: durationMins,
          maxSlots: detail.totalSlots || 15,
          points: detail.points || 100,
          department: detail.department || 'All',
          coverImageUrl: detail.image || ''
        });

        if (detail.skills) {
          setSkills(detail.skills);
        }

        if (detail.resources) {
          setResources(detail.resources.map(r => ({
            title: r.title,
            description: r.description,
            type: r.type,
            url: r.url,
            fileType: r.fileType,
            fileSizeBytes: r.fileSizeBytes
          })));
        }

      } catch (error) {
        console.error('Failed to load class details:', error);
        toastService.error('Failed to fetch class details for editing.');
        navigate('/mentor');
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchClassDetails();
  }, [id, isEditMode, navigate]);

  // Learning Resources & Attachments States
  const [resources, setResources] = useState([]);
  const [linkData, setLinkData] = useState({ title: '', url: '' });
  const [uploadingFile, setUploadingFile] = useState(null);
  const [resourceTab, setResourceTab] = useState('upload');

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
      toastService.warning("Skill tag already added!");
      return;
    }
    setSkills(prev => [...prev, cleanInput]);
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  // Handle adding a web reference link
  const handleAddLinkResource = (e) => {
    e.preventDefault();
    if (!linkData.title.trim()) {
      toastService.warning("Please enter a title for the reference link");
      return;
    }
    if (!linkData.url.trim()) {
      toastService.warning("Please enter the URL");
      return;
    }
    try {
      new URL(linkData.url);
    } catch (err) {
      toastService.warning("Please enter a valid URL (including http:// or https://)");
      return;
    }

    setResources(prev => [
      ...prev,
      {
        title: linkData.title.trim(),
        description: "Reference web link",
        type: "Link",
        url: linkData.url.trim(),
        fileType: "url",
        fileSizeBytes: 0
      }
    ]);
    setLinkData({ title: '', url: '' });
    toastService.success("Link added successfully!");
  };

  // Simulate file upload with premium progress loading state
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulate upload starting
    setUploadingFile({ name: file.name, progress: 10 });
    
    let currentProgress = 10;
    const interval = setInterval(() => {
      currentProgress += 30;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setUploadingFile(null);
        
        // Add to resources list
        setResources(prev => [
          ...prev,
          {
            title: file.name,
            description: "Class attachment file",
            type: "Document",
            url: `https://innerg-storage.s3.amazonaws.com/attachments/${file.name}`,
            fileType: file.name.substring(file.name.lastIndexOf('.')),
            fileSizeBytes: file.size
          }
        ]);
        toastService.success("File uploaded and attached successfully! 🎉");
      } else {
        setUploadingFile({ name: file.name, progress: currentProgress });
      }
    }, 300);
  };

  const handleRemoveResource = (indexToRemove) => {
    setResources(prev => prev.filter((_, idx) => idx !== indexToRemove));
    toastService.success("Resource removed");
  };

  // AI Assistant Optimization Logic (Fills out optimal fields and reviews scheduling)
  const handleAIOptimize = () => {
    if (!formData.title) {
      toastService.warning("Please enter a class title first to optimize!");
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
      toastService.success("Class optimized by InnerG AI! Optimal slot found: Wed at 03:00 PM 🚀");
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Title Validation
    const cleanTitle = formData.title.trim();
    if (!cleanTitle) {
      toastService.warning("Please enter a class title");
      return;
    }
    if (cleanTitle.length < 5) {
      toastService.warning("Class title must be at least 5 characters long");
      return;
    }

    // 2. Description Validation
    const cleanDesc = formData.description.trim();
    if (!cleanDesc) {
      toastService.warning("Please write a course syllabus/description");
      return;
    }
    if (cleanDesc.length < 20) {
      toastService.warning("Please write a more detailed syllabus description (at least 20 characters)");
      return;
    }

    // 3. Date & Time Validation (Future Schedule Only)
    if (!formData.date || !formData.time) {
      toastService.warning("Please schedule a valid date and time slot");
      return;
    }
    const now = new Date();
    const classStartDateTime = new Date(`${formData.date}T${formData.time}`);
    if (isNaN(classStartDateTime.getTime())) {
      toastService.warning("Please schedule a valid date and time slot");
      return;
    }
    if (classStartDateTime <= now) {
      toastService.warning("The scheduled class time must be in the future. Please select a future date and time slot.");
      return;
    }

    // 4. Format-specific Validation
    if (formData.format === 'Online') {
      if (!formData.meetingLink.trim()) {
        toastService.warning("Please provide a Zoom or Teams meeting URL");
        return;
      }
      try {
        new URL(formData.meetingLink);
      } catch (err) {
        toastService.warning("Please enter a valid meeting URL (e.g. https://zoom.us/...)");
        return;
      }
    } else {
      if (!formData.location.trim() || formData.location.trim().length < 3) {
        toastService.warning("Please provide a valid physical room or venue location (at least 3 characters)");
        return;
      }
    }

    // 5. Numeric range validations
    const durationVal = parseInt(formData.duration, 10);
    if (isNaN(durationVal) || durationVal < 15 || durationVal > 360) {
      toastService.warning("Duration must be between 15 and 360 minutes");
      return;
    }

    const maxSlotsVal = parseInt(formData.maxSlots, 10);
    if (isNaN(maxSlotsVal) || maxSlotsVal < 1 || maxSlotsVal > 200) {
      toastService.warning("Available slots must be between 1 and 200");
      return;
    }

    const pointsVal = parseInt(formData.points, 10);
    if (isNaN(pointsVal) || pointsVal < 10 || pointsVal > 1000) {
      toastService.warning("Learning points value must be between 10 and 1000 points");
      return;
    }

    // 6. Skills tag check
    if (!skills || skills.length === 0) {
      toastService.warning("Please add at least one relevant skill tag for the class");
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isEditMode) {
        await mentorApi.updateClass(id, {
          ...formData,
          title: cleanTitle,
          description: cleanDesc,
          duration: durationVal,
          maxSlots: maxSlotsVal,
          points: pointsVal,
          skills,
          resources,
          coverImageUrl: formData.coverImageUrl.trim() || null
        });
      } else {
        await mentorApi.createClass({
          ...formData,
          title: cleanTitle,
          description: cleanDesc,
          duration: durationVal,
          maxSlots: maxSlotsVal,
          points: pointsVal,
          skills,
          resources,
          coverImageUrl: formData.coverImageUrl.trim() || null
        });
      }
      setIsSubmitting(false);
      setShowSuccessModal(true);
    } catch (error) {
      setIsSubmitting(false);
      console.error(error);
      const errMsg = error.response?.data?.message || `Failed to ${isEditMode ? "update" : "create"} class. Please try again.`;
      toastService.error(errMsg);
    }
  };

  // Capacity visual feedback tags helper
  const getCapacityLabel = (slots) => {
    if (slots <= 10) return { text: "Intimate Mentorship (1-10 slots)", color: "text-amber-600 bg-amber-50" };
    if (slots <= 30) return { text: "Interactive Workshop (11-30 slots)", color: "text-indigo-650 bg-indigo-50" };
    return { text: "Company-wide Seminar (30+ slots)", color: "text-emerald-600 bg-emerald-50" };
  };

  if (isDataLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-10 text-[#00C896] animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Loading class details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-16">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <BookOpen className="size-8 text-[#00C896]" />
            {isEditMode ? "Edit Class Details" : "Host a Class"}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {isEditMode ? "Modify details for your scheduled or draft training session." : "Create internal training sessions, workshops, peer learning groups, or mentoring sessions."}
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

            {/* Cover Image URL */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block flex justify-between">
                <span>Cover Image URL (Optional)</span>
              </label>
              <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-2">
                  <input 
                    type="url" 
                    name="coverImageUrl"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.coverImageUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-xs rounded-2xl outline-none transition-all placeholder:text-slate-400 text-slate-850"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">Paste a valid image URL. If left empty, a default premium placeholder will be used.</p>
                </div>
                {/* Image Preview */}
                <div className="size-16 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center relative group">
                  <img 
                    src={formData.coverImageUrl || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400&auto=format&fit=crop"} 
                    alt="Cover preview" 
                    className="size-full object-cover"
                    onError={(e) => { 
                      if (formData.coverImageUrl && e.target.src !== "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400&auto=format&fit=crop") {
                        toastService.warning("The image URL you entered is invalid or protected. Using default cover.");
                        e.target.src = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400&auto=format&fit=crop";
                      }
                    }}
                  />
                </div>
              </div>
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

          {/* ATTACHMENTS & LEARNING RESOURCES */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-6 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-[#00C896]/5 to-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base tracking-tight flex items-center gap-2">
                <Paperclip className="size-5 text-[#00C896]" />
                Attachments & Learning Resources
              </h3>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-500 uppercase tracking-wider">
                {resources.length} {resources.length === 1 ? 'Resource' : 'Resources'}
              </span>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed -mt-2">
              Share syllabus slides, preparatory materials, documents or direct references so mentees can prepare before attending the session.
            </p>

            {/* TAB SELECTOR FOR FILE VS LINK */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setResourceTab('upload')}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  resourceTab === 'upload' 
                    ? "bg-white text-slate-800 shadow-xs" 
                    : "text-slate-450 hover:text-slate-700"
                )}
              >
                Upload Document Files
              </button>
              <button
                type="button"
                onClick={() => setResourceTab('link')}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  resourceTab === 'link' 
                    ? "bg-white text-slate-800 shadow-xs" 
                    : "text-slate-450 hover:text-slate-700"
                )}
              >
                Add External URL Link
              </button>
            </div>

            {/* TAB PANELS */}
            <AnimatePresence mode="wait">
              {resourceTab === 'upload' ? (
                <motion.div
                  key="tab-upload"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  {/* File Upload Dropzone */}
                  <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-slate-50/50 hover:bg-indigo-50/10 group relative">
                    <input 
                      type="file" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.zip"
                    />
                    
                    {uploadingFile ? (
                      <div className="flex flex-col items-center gap-3 w-full max-w-[200px]">
                        <Loader2 className="size-8 text-indigo-600 animate-spin" />
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${uploadingFile.progress}%` }}></div>
                        </div>
                        <p className="text-[10px] text-slate-650 font-bold truncate max-w-full">
                          Uploading {uploadingFile.name}...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="size-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <UploadCloud className="size-5" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-700">Click or drag file to upload</p>
                          <p className="text-[10px] text-slate-400 mt-1">PDF, Word, Excel, PowerPoint, ZIP (Max 25MB)</p>
                        </div>
                      </>
                    )}
                  </label>
                </motion.div>
              ) : (
                <motion.div
                  key="tab-link"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Link Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. GitHub Repository, Google Slides" 
                        value={linkData.title}
                        onChange={(e) => setLinkData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-xs rounded-xl outline-none transition-all placeholder:text-slate-400 text-slate-800 font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Resource URL</label>
                      <input 
                        type="url" 
                        placeholder="https://github.com/..." 
                        value={linkData.url}
                        onChange={(e) => setLinkData(prev => ({ ...prev, url: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-xs rounded-xl outline-none transition-all placeholder:text-slate-400 text-slate-800 font-semibold"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLinkResource}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.99]"
                  >
                    <Plus className="size-3.5" />
                    Attach External Resource Link
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* LIST OF CURRENT ATTACHED RESOURCES */}
            {resources.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Attached Materials List</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {resources.map((res, rIdx) => {
                    const isLink = res.type === 'Link';
                    const isPdf = res.fileType?.toLowerCase() === '.pdf';
                    
                    return (
                      <div 
                        key={rIdx}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-slate-200 transition-all text-left"
                      >
                        <div className={cn(
                          "size-8 rounded-xl flex items-center justify-center shrink-0",
                          isLink 
                            ? "bg-sky-50 text-sky-600" 
                            : isPdf 
                              ? "bg-rose-50 text-rose-600" 
                              : "bg-emerald-50 text-emerald-600"
                        )}>
                          {isLink ? <Link2 className="size-4" /> : <FileText className="size-4" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate" title={res.title}>
                            {res.title}
                          </p>
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold mt-0.5">
                            {isLink ? 'Web URL Link' : `${res.fileType?.replace('.', '') || 'Doc'} File • ${(res.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveResource(rIdx)}
                          className="size-7 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200/50 rounded-lg flex items-center justify-center cursor-pointer transition-all shrink-0 active:scale-95 shadow-sm"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                    min={new Date().toISOString().split('T')[0]}
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
              {isSubmitting ? (isEditMode ? "Saving changes..." : "Creating class...") : (isEditMode ? "Save Changes" : "Create Training Class")}
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
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {isEditMode ? "Class Details Updated!" : "Class Request Submitted!"}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {isEditMode 
                    ? <>Your class <strong>"{formData.title}"</strong> has been successfully updated.</>
                    : <>Your class <strong>"{formData.title}"</strong> is successfully submitted. It will be reviewed by the HR department and published onto the marketplace once approved.</>
                  }
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
                    navigate('/mentor');
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-2xl text-[10px] uppercase tracking-widest cursor-pointer transition-all active:scale-[0.98]"
                >
                  Go to Mentor Dashboard
                </button>
                {!isEditMode && (
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
                        department: 'All',
                        coverImageUrl: ''
                      });
                      setSkills([]);
                    }}
                    className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-250 py-3.5 rounded-2xl text-[10px] uppercase tracking-widest cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Create another class
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

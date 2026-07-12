import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Award,
  BookOpen,
  Lock,
  Camera,
  CheckCircle2,
  LogOut,
  Globe,
  Laptop,
  Tablet,
  Smartphone,
  Key,
  RefreshCw,
  Sparkles,
  Calendar,
  Loader2,
  Briefcase,
  Building2,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';
import authService from '../../../services/authService';
import uploadApi from '../../../api/uploadApi';
import { toastService } from '../../../services/toastService';
import { cn } from '../../../lib/utils';

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal'); // personal, skills, achievements, security
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Forms states
  const [fullName, setFullName] = useState('');
  const [phoneInternal, setPhoneInternal] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);



  const fileInputRef = useRef(null);

  // Fetch full profile info
  const fetchProfile = async () => {
    if (!user?.userId) return;
    try {
      setLoading(true);
      const data = await authService.getUserInfo(user.userId);
      setProfileData(data);
      setFullName(data.fullName || '');
      setPhoneInternal(data.phoneInternal || '');
      setAvatarUrl(data.avatarUrl || '');
    } catch (err) {
      console.error('Failed to load profile:', err);
      toastService.error('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.userId]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toastService.warning('Full name cannot be empty');
      return;
    }

    try {
      setSaving(true);
      await authService.updateProfile(user.userId, {
        fullName: fullName.trim(),
        avatarUrl,
        phoneInternal: phoneInternal.trim() || null
      });
      toastService.success('Profile updated successfully! 🎉');
      fetchProfile();
    } catch (err) {
      console.error('Failed to update profile:', err);
      toastService.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle Avatar Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastService.warning('Only image files are accepted');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastService.warning('Max image size is 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      toastService.success('Uploading image... 📤');
      const response = await uploadApi.uploadImage(file);
      setAvatarUrl(response.url);
      toastService.success('New avatar uploaded! Click Save to confirm.');
    } catch (err) {
      console.error('Avatar upload failed:', err);
      toastService.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle Password Change
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toastService.warning('Please fill in all password fields');
      return;
    }
    if (newPassword.length < 6) {
      toastService.warning('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastService.warning('Confirm password does not match');
      return;
    }

    try {
      setChangingPassword(true);
      await authService.changePassword({
        oldPassword,
        newPassword
      });
      toastService.success('Password changed successfully! 🔐');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change failed:', err);
      toastService.error(err?.response?.data?.message || 'Incorrect old password');
    } finally {
      setChangingPassword(false);
    }
  };



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="size-10 text-[#00C896] animate-spin" />
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Loading profile information...</span>
      </div>
    );
  }

  const defaultAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName || 'User')}`;
  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-16 px-4 lg:px-0">

      {/* 1. HERO BANNER (Light Theme Premium Card) */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Left Side: Avatar & Info */}
        <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
          {/* Avatar Container */}
          <div className="relative shrink-0 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="size-20 md:size-24 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-50 flex items-center justify-center shadow-xs transition-all group-hover:border-primary">
              <img
                src={avatarUrl || defaultAvatar}
                alt="Avatar"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Hover Camera Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <Camera className="size-5 text-white" />
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="size-5 text-white animate-spin" />
                </div>
              )}
            </div>
            {/* Small camera badge at bottom-right of avatar */}
            <div
              className="absolute -bottom-1 -right-1 size-7 rounded-full flex items-center justify-center shadow-xs border-2 transition-transform group-hover:scale-110"
              style={{ backgroundColor: '#13ecb6', color: '#0F1F3D', borderColor: '#ffffff' }}
            >
              <Camera className="size-3" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* User Meta Info */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">
                {fullName || 'Name not set'}
              </h1>
              {(profileData?.roles || []).map((r, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border"
                  style={{ backgroundColor: 'rgba(19, 236, 182, 0.15)', color: '#13ecb6', borderColor: 'rgba(19, 236, 182, 0.2)' }}
                >
                  {r}
                </span>
              ))}
            </div>

            <p className="text-slate-500 text-xs font-semibold flex items-center justify-center md:justify-start gap-1.5">
              <Briefcase className="size-3.5 text-slate-400" />
              {profileData?.jobTitle || 'Job title not updated'}
              {profileData?.departmentName && (
                <>
                  <span className="text-slate-350">•</span>
                  <Building2 className="size-3.5 text-blue-500" />
                  <span>Dept {profileData.departmentName}</span>
                </>
              )}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 text-xs text-slate-500 font-semibold pt-0.5">
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5 text-slate-400" /> {profileData?.email}
              </span>
              {phoneInternal && (
                <span className="flex items-center gap-1.5">
                  <span className="hidden sm:inline text-slate-350">•</span>
                  <Phone className="size-3.5 text-slate-400" /> Ext: {phoneInternal}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Elegant Stats Bar */}
        <div className="flex items-center justify-center md:justify-end gap-6 w-full md:w-auto border-t border-slate-100 pt-4 md:pt-0 md:border-t-0">
          <div className="text-center min-w-[70px]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Points</p>
            <p className="text-lg font-black text-amber-500">{(profileData?.totalInnerGPoints ?? 0).toLocaleString()}</p>
          </div>
          <div className="h-8 w-px bg-slate-200/80" />
          <div className="text-center min-w-[70px]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Skills</p>
            <p className="text-lg font-black text-blue-600">{(profileData?.skills || []).length}</p>
          </div>
          <div className="h-8 w-px bg-slate-200/80" />
          <div className="text-center min-w-[70px]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Badges</p>
            <p className="text-lg font-black text-[#00b084]">{(profileData?.badges || []).length}</p>
          </div>
        </div>

      </div>

      {/* 2. HORIZONTAL TAB NAVIGATION (iOS/Segmented Control style) */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/50 shadow-2xs">
        {[
          { id: 'personal', label: 'Personal Info', icon: User },
          { id: 'skills', label: 'Professional Skills', icon: BookOpen },
          { id: 'achievements', label: 'Badges & Achievements', icon: Award },
          { id: 'security', label: 'Security & Devices', icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-1",
                isActive
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200/30"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              )}
            >
              <Icon className={cn("size-4 shrink-0", isActive ? "text-[#00C896]" : "text-slate-400")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. CONTENT CONTAINER */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-xs min-h-[380px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >

            {/* TAB 1: PERSONAL DETAILS */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-800">Personal Info</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Update your contact information and identity in the enterprise system.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {/* EDITABLE FIELDS GROUP */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="size-3.5 text-slate-400" /> Full Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#00C896] focus:bg-white focus:ring-4 focus:ring-[#00C896]/5 text-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none transition-all font-semibold"
                          placeholder="Enter full name..."
                        />
                      </div>
                    </div>

                    {/* Phone Internal */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="size-3.5 text-slate-400" /> Internal Phone Extension
                      </label>
                      <input
                        type="text"
                        placeholder="E.g., 808"
                        value={phoneInternal}
                        onChange={(e) => setPhoneInternal(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#00C896] focus:bg-white focus:ring-4 focus:ring-[#00C896]/5 text-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none transition-all font-semibold"
                      />
                    </div>
                  </div>

                  {/* SYSTEM READONLY INFO GROUP */}
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1">
                      <Lock className="size-3" /> System Information (Read-only)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Email - Read-only */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          Email Address <Lock className="size-3 text-slate-400" />
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            readOnly
                            value={profileData?.email || ''}
                            className="w-full bg-slate-50/50 border border-slate-200 text-slate-600 text-xs px-4 py-3 pl-10 rounded-xl font-semibold cursor-default outline-none"
                          />
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Job Title - Read-only */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          Job Title <Lock className="size-3 text-slate-400" />
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={profileData?.jobTitle || 'Not updated'}
                            className="w-full bg-slate-50/50 border border-slate-200 text-slate-600 text-xs px-4 py-3 pl-10 rounded-xl font-semibold cursor-default outline-none"
                          />
                          <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Department - Read-only */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          Department <Lock className="size-3 text-slate-400" />
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={profileData?.departmentName || 'Not assigned'}
                            className="w-full bg-slate-50/50 border border-slate-200 text-slate-600 text-xs px-4 py-3 pl-10 rounded-xl font-semibold cursor-default outline-none"
                          />
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Company Name - Read-only */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          Company <Lock className="size-3 text-slate-400" />
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={profileData?.companyName || 'N/A'}
                            className="w-full bg-slate-50/50 border border-slate-200 text-slate-600 text-xs px-4 py-3 pl-10 rounded-xl font-semibold cursor-default outline-none"
                          />
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-5 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 rounded-xl bg-[#00C896] hover:bg-[#00b084] text-[#0F1F3D] text-xs font-black cursor-pointer transition-all shadow-md shadow-[#00C896]/10 flex items-center gap-2 hover:translate-y-[-1px] active:translate-y-0"
                    >
                      {saving && <Loader2 className="size-4 animate-spin" />}
                      Save changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: SKILLS LIST */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-800">Professional Skills</h2>
                  <p className="text-slate-400 text-xs mt-0.5">List of your professional skills verified by HR or through the course system.</p>
                </div>

                {(profileData?.skills || []).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(profileData?.skills || []).map((skill, index) => {
                      const isExpert = skill.proficiency?.toLowerCase() === 'expert';
                      const isIntermediate = skill.proficiency?.toLowerCase() === 'intermediate';
                      const isVerified = skill.source?.toLowerCase() === 'hrverified' || skill.source?.toLowerCase() === 'coursecompleted';

                      return (
                        <div
                          key={index}
                          className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-[#00C896]/40 hover:shadow-xs transition-all flex items-start justify-between gap-4"
                        >
                          <div className="space-y-2">
                            <h3 className="text-xs font-black text-slate-800">{skill.skillName}</h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                isExpert ? "bg-red-50 text-red-600 border border-red-100" :
                                  isIntermediate ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                    "bg-slate-100 text-slate-500"
                              )}>
                                {skill.proficiency}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">•</span>
                              <span className="text-[9px] text-slate-500 font-bold uppercase">
                                {skill.source === 'SelfDeclared' ? 'Self-declared' :
                                  skill.source === 'HRVerified' ? 'HR Verified ✓' : 'Course Completed'}
                              </span>
                            </div>
                          </div>

                          {isVerified && (
                            <div className="size-7 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center border border-emerald-100 shadow-2xs">
                              <CheckCircle2 className="size-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                    <BookOpen className="size-12 text-slate-350 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-700">No skills recorded yet</h4>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto mt-1 leading-normal">
                      Your skills will automatically appear here when you enroll and complete skill sessions or get verified by HR.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ACHIEVEMENTS & BADGES */}
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-800">Badges & Achievements</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Learning and teaching milestones you have achieved on your journey with InnerG.</p>
                </div>

                {(profileData?.badges || []).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {(profileData?.badges || []).map((b, idx) => {
                      const fallbackIcon = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(b.badgeName || 'Badge')}`;
                      return (
                        <div
                          key={idx}
                          className="bg-slate-50/30 hover:bg-white border border-slate-150 hover:border-amber-300 p-5 rounded-2xl text-center space-y-3 transition-all flex flex-col justify-between items-center group hover:shadow-sm"
                        >
                          <div className="size-16 rounded-2xl bg-amber-50/50 border border-amber-100/80 flex items-center justify-center shrink-0 shadow-2xs relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                            <div className="absolute inset-0 bg-gradient-to-tr from-amber-200/10 to-transparent pointer-events-none" />
                            <img src={b.iconUrl || fallbackIcon} className="size-10 object-contain z-10" />
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-xs font-black text-slate-800 group-hover:text-amber-600 transition-colors">{b.badgeName}</h3>
                            <p className="text-[10px] text-slate-450 leading-relaxed line-clamp-2" title={b.description}>
                              {b.description || 'Excellent Member Badge'}
                            </p>
                          </div>

                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-2 border-t border-slate-100 w-full flex items-center justify-center gap-1.5">
                            <Calendar className="size-3" /> Earned {new Date(b.awardedAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                    <Award className="size-12 text-slate-350 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-700">No badges received yet</h4>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto mt-1 leading-normal">
                      Actively participate in company classes, discuss and contribute documents to earn your first excellence awards!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-800">Change Password</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Reset your password periodically to protect your account.</p>
                </div>

                <form onSubmit={handleChangePasswordSubmit} className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Old Password</label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#00C896] focus:bg-white focus:ring-4 focus:ring-[#00C896]/5 text-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none transition-all font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#00C896] focus:bg-white focus:ring-4 focus:ring-[#00C896]/5 text-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none transition-all font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#00C896] focus:bg-white focus:ring-4 focus:ring-[#00C896]/5 text-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none transition-all font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-5 py-3 rounded-xl bg-[#0F1F3D] hover:bg-[#1b2d56] text-white text-xs font-black cursor-pointer transition-all shadow-xs flex items-center gap-2 hover:translate-y-[-1px] active:translate-y-0"
                  >
                    {changingPassword && <Loader2 className="size-4 animate-spin text-[#00C896]" />}
                    Update Password
                  </button>
                </form>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

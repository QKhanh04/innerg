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
      toastService.error('Không thể tải thông tin hồ sơ');
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
      toastService.warning('Họ và tên không được để trống');
      return;
    }

    try {
      setSaving(true);
      await authService.updateProfile(user.userId, {
        fullName: fullName.trim(),
        avatarUrl,
        phoneInternal: phoneInternal.trim() || null
      });
      toastService.success('Cập nhật hồ sơ cá nhân thành công! 🎉');
      fetchProfile();
    } catch (err) {
      console.error('Failed to update profile:', err);
      toastService.error(err?.response?.data?.message || 'Cập nhật hồ sơ thất bại');
    } finally {
      setSaving(false);
    }
  };

  // Handle Avatar Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastService.warning('Chỉ chấp nhận tệp hình ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastService.warning('Kích thước ảnh tối đa là 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      toastService.success('Đang tải ảnh lên... 📤');
      const response = await uploadApi.uploadImage(file);
      setAvatarUrl(response.url);
      toastService.success('Tải ảnh đại diện mới thành công! Bấm Lưu để hoàn tất.');
    } catch (err) {
      console.error('Avatar upload failed:', err);
      toastService.error('Không thể upload ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle Password Change
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toastService.warning('Vui lòng điền đầy đủ các trường mật khẩu');
      return;
    }
    if (newPassword.length < 6) {
      toastService.warning('Mật khẩu mới phải từ 6 ký tự trở lên');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastService.warning('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setChangingPassword(true);
      await authService.changePassword({
        oldPassword,
        newPassword
      });
      toastService.success('Đổi mật khẩu thành công! 🔐');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change failed:', err);
      toastService.error(err?.response?.data?.message || 'Mật khẩu cũ không chính xác');
    } finally {
      setChangingPassword(false);
    }
  };



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="size-10 text-[#00C896] animate-spin" />
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Đang tải thông tin hồ sơ...</span>
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
                {fullName || 'Chưa thiết lập tên'}
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
              {profileData?.jobTitle || 'Chưa cập nhật chức danh'}
              {profileData?.departmentName && (
                <>
                  <span className="text-slate-350">•</span>
                  <Building2 className="size-3.5 text-blue-500" />
                  <span>Phòng {profileData.departmentName}</span>
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
                  <Phone className="size-3.5 text-slate-400" /> Máy lẻ: {phoneInternal}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Elegant Stats Bar */}
        <div className="flex items-center justify-center md:justify-end gap-6 w-full md:w-auto border-t border-slate-100 pt-4 md:pt-0 md:border-t-0">
          <div className="text-center min-w-[70px]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Tích lũy</p>
            <p className="text-lg font-black text-amber-500">{(profileData?.totalInnerGPoints ?? 0).toLocaleString()}</p>
          </div>
          <div className="h-8 w-px bg-slate-200/80" />
          <div className="text-center min-w-[70px]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Kỹ năng</p>
            <p className="text-lg font-black text-blue-600">{(profileData?.skills || []).length}</p>
          </div>
          <div className="h-8 w-px bg-slate-200/80" />
          <div className="text-center min-w-[70px]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Huy hiệu</p>
            <p className="text-lg font-black text-[#00b084]">{(profileData?.badges || []).length}</p>
          </div>
        </div>

      </div>

      {/* 2. HORIZONTAL TAB NAVIGATION (iOS/Segmented Control style) */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/50 shadow-2xs">
        {[
          { id: 'personal', label: 'Thông tin cá nhân', icon: User },
          { id: 'skills', label: 'Kỹ năng chuyên môn', icon: BookOpen },
          { id: 'achievements', label: 'Huy hiệu & Thành tích', icon: Award },
          { id: 'security', label: 'Bảo mật & Thiết bị', icon: Shield },
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
                  <h2 className="text-lg font-black text-slate-800">Thông tin cá nhân</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Cập nhật thông tin liên hệ và định danh của bạn trong hệ thống doanh nghiệp.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {/* EDITABLE FIELDS GROUP */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="size-3.5 text-slate-400" /> Họ và tên
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#00C896] focus:bg-white focus:ring-4 focus:ring-[#00C896]/5 text-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none transition-all font-semibold"
                          placeholder="Nhập họ và tên..."
                        />
                      </div>
                    </div>

                    {/* Phone Internal */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="size-3.5 text-slate-400" /> Số điện thoại máy lẻ (Internal)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 808"
                        value={phoneInternal}
                        onChange={(e) => setPhoneInternal(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#00C896] focus:bg-white focus:ring-4 focus:ring-[#00C896]/5 text-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none transition-all font-semibold"
                      />
                    </div>
                  </div>

                  {/* SYSTEM READONLY INFO GROUP */}
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1">
                      <Lock className="size-3" /> Thông tin hệ thống (Chỉ đọc)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Email - Read-only */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          Địa chỉ Email <Lock className="size-3 text-slate-400" />
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
                          Chức danh công việc <Lock className="size-3 text-slate-400" />
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={profileData?.jobTitle || 'Chưa cập nhật'}
                            className="w-full bg-slate-50/50 border border-slate-200 text-slate-600 text-xs px-4 py-3 pl-10 rounded-xl font-semibold cursor-default outline-none"
                          />
                          <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Department - Read-only */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          Phòng ban trực thuộc <Lock className="size-3 text-slate-400" />
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={profileData?.departmentName || 'Chưa phân bổ'}
                            className="w-full bg-slate-50/50 border border-slate-200 text-slate-600 text-xs px-4 py-3 pl-10 rounded-xl font-semibold cursor-default outline-none"
                          />
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Company Name - Read-only */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          Công ty quản lý <Lock className="size-3 text-slate-400" />
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
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: SKILLS LIST */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-800">Kỹ năng chuyên môn</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Danh sách các kỹ năng chuyên môn của bạn được xác nhận bởi HR hoặc qua hệ thống khóa học.</p>
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
                                {skill.source === 'SelfDeclared' ? 'Tự khai báo' :
                                  skill.source === 'HRVerified' ? 'HR Xác minh ✓' : 'Khóa học hoàn thành'}
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
                    <h4 className="text-sm font-bold text-slate-700">Chưa ghi nhận kỹ năng nào</h4>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto mt-1 leading-normal">
                      Kỹ năng của bạn sẽ tự động xuất hiện tại đây khi bạn đăng ký và hoàn thành các buổi học kỹ năng hoặc được quản lý HR xác minh.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ACHIEVEMENTS & BADGES */}
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-800">Huy hiệu & Thành tích</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Các cột mốc học tập và giảng dạy bạn đã đạt được trên chặng đường cùng InnerG.</p>
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
                              {b.description || 'Huy hiệu thành viên xuất sắc'}
                            </p>
                          </div>

                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-2 border-t border-slate-100 w-full flex items-center justify-center gap-1.5">
                            <Calendar className="size-3" /> Đạt được {new Date(b.awardedAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                    <Award className="size-12 text-slate-350 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-700">Chưa nhận được huy hiệu nào</h4>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto mt-1 leading-normal">
                      Hãy tích cực tham gia các lớp học của công ty, thảo luận và đóng góp tài liệu để nhận được các danh hiệu xuất sắc đầu tiên nhé!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-800">Đổi mật khẩu</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Đặt lại mật khẩu mới định kỳ để bảo vệ tài khoản của bạn.</p>
                </div>

                <form onSubmit={handleChangePasswordSubmit} className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mật khẩu cũ</label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#00C896] focus:bg-white focus:ring-4 focus:ring-[#00C896]/5 text-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none transition-all font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#00C896] focus:bg-white focus:ring-4 focus:ring-[#00C896]/5 text-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none transition-all font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
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
                    Cập nhật mật khẩu
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

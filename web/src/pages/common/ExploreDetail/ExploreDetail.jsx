import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin, Video,
  Award, Users, User, CheckCircle2, AlertCircle,
  PlayCircle, Star, Paperclip, FileText, Link2,
  Download, Zap, BookOpen, ChevronRight, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useRole } from '../../../lib/RoleContext';
import { exploreApi } from '../../../api/exploreApi';
import { toastService } from '../../../services/toastService';

/* ─── Skeleton Loader ─────────────────────────────────────────── */
function SkeletonLoader() {
  return (
    <div className="max-w-[1260px] mx-auto px-4 sm:px-6 pb-20 animate-pulse">
      <div className="h-5 w-32 bg-slate-200 rounded-lg mt-6 mb-8" />
      <div className="h-[420px] w-full bg-slate-200 rounded-[28px] mb-8" />
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {[1,2,3].map(i => <div key={i} className="h-36 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="w-full lg:w-[360px] space-y-5">
          <div className="h-56 bg-slate-100 rounded-2xl" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/* ─── Pill Badge ──────────────────────────────────────────────── */
function Pill({ children, color = 'indigo', icon: Icon }) {
  const colors = {
    indigo: 'bg-indigo-600/85 border-indigo-500/40 text-white',
    teal:   'bg-teal-600/85 border-teal-500/40 text-white',
    amber:  'bg-amber-500/85 border-amber-400/40 text-white',
    slate:  'bg-slate-700/85 border-slate-600/40 text-slate-200',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md', colors[color])}>
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  );
}

/* ─── Stat Chip (inline, horizontal) ─────────────────────────── */
function StatChip({ icon: Icon, label, value, accent = 'indigo' }) {
  const accents = {
    indigo: 'text-indigo-500 bg-indigo-50',
    teal:   'text-teal-500 bg-teal-50',
    amber:  'text-amber-500 bg-amber-50',
    rose:   'text-rose-500 bg-rose-50',
  };
  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs">
      <div className={cn('size-9 rounded-xl flex items-center justify-center shrink-0', accents[accent])}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-extrabold text-slate-800 leading-tight">{value}</p>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function ExploreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user } = useRole();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await exploreApi.getClassDetail(id);
        if (alive) setDetail(data);
      } catch {
        toastService.error('Failed to load workshop details.');
        navigate('/explore');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, navigate]);

  const handleRegister = async () => {
    if (detail.takenSlots >= detail.totalSlots) {
      toastService.warning('Sorry, this class is full!');
      return;
    }
    try {
      setActionLoading(true);
      await exploreApi.registerClass(id);
      toastService.success(`Registration sent for "${detail.title}". Pending mentor approval!`);
      setDetail(p => ({ ...p, registrationStatus: 'Pending', takenSlots: p.takenSlots + 1 }));
    } catch {
      toastService.error('Operation failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      await exploreApi.unregisterClass(id);
      toastService.success(`Cancelled registration for "${detail.title}".`);
      setDetail(p => ({ ...p, registrationStatus: 'NotRegistered', takenSlots: Math.max(0, p.takenSlots - 1) }));
    } catch {
      toastService.error('Operation failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <SkeletonLoader />;
  if (!detail) return null;

  const isFull       = detail.takenSlots >= detail.totalSlots;
  const isRegistered = detail.registrationStatus === 'Registered';
  const isPending    = detail.registrationStatus === 'Pending';
  const canRegister  = ['mentee', 'mentor', 'hr'].includes(role);
  const isInstructor = detail.mentor?.userId === user?.userId;
  const fillPct      = Math.min(100, (detail.takenSlots / detail.totalSlots) * 100);

  return (
    <div className="max-w-[1260px] mx-auto px-4 sm:px-6 pb-24">

      {/* ── Back ── */}
      <motion.button
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/explore')}
        className="flex items-center gap-2 mt-6 mb-7 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-colors group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
        Back to Marketplace
      </motion.button>

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full h-[400px] lg:h-[480px] rounded-[28px] overflow-hidden shadow-2xl mb-10 group"
      >
        <img
          src={detail.image} alt={detail.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-1000"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        {/* glow */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

        {/* content */}
        <div className="absolute inset-0 flex flex-col justify-between p-8 lg:p-12">
          {/* top pills */}
          <div className="flex flex-wrap gap-2">
            <Pill color="indigo">{detail.category}</Pill>
            <Pill color={detail.format === 'Online' ? 'teal' : 'amber'} icon={detail.format === 'Online' ? Video : MapPin}>
              {detail.format}
            </Pill>
            {role !== 'mentee' && <Pill color="slate">{detail.eventStatus}</Pill>}
          </div>

          {/* bottom: title + meta */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-lg max-w-3xl">
              {detail.title}
            </h1>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 text-white text-sm font-semibold px-4 py-2 rounded-xl">
                <Calendar className="size-4 text-indigo-300" />
                {detail.date}
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 text-white text-sm font-semibold px-4 py-2 rounded-xl">
                <Clock className="size-4 text-indigo-300" />
                {detail.time} · {detail.duration}
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 text-white text-sm font-semibold px-4 py-2 rounded-xl">
                <Users className="size-4 text-emerald-300" />
                {detail.takenSlots}/{detail.totalSlots} enrolled
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Two-column Layout ── */}
      <div className="flex flex-col lg:flex-row gap-10 items-start">

        {/* ══ LEFT: Content ══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex-1 min-w-0 space-y-8"
        >
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatChip icon={Award}  label="Level"    value={detail.level}            accent="indigo" />
            <StatChip icon={detail.format === 'Online' ? Video : MapPin} label="Location" value={detail.formatDetail} accent="teal" />
            <StatChip icon={Zap}   label="Reward"   value={`+${detail.points} pts`} accent="amber" />
            <StatChip icon={Users}  label="Capacity" value={`${detail.totalSlots} slots`} accent="rose" />
          </div>

          {/* About */}
          <section className="bg-white border border-slate-200 rounded-[24px] p-7 lg:p-9 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="size-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                <BookOpen className="size-5 text-indigo-500" />
              </div>
              <h2 className="text-lg font-black text-slate-800">About This Workshop</h2>
            </div>

            <p className="text-slate-600 text-[15px] leading-relaxed">
              {detail.description || 'No description provided. Contact the mentor for more details.'}
            </p>

            {detail.skills?.length > 0 && (
              <div className="pt-5 border-t border-slate-100 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skills You'll Gain</p>
                <div className="flex flex-wrap gap-2">
                  {detail.skills.map((s, i) => (
                    <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-100/80 px-3.5 py-1.5 rounded-xl text-xs font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Sessions Timeline */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <div className="size-9 bg-violet-50 rounded-xl flex items-center justify-center">
                <PlayCircle className="size-5 text-violet-500" />
              </div>
              <h2 className="text-lg font-black text-slate-800">Session Agenda</h2>
              {detail.sessions?.length > 0 && (
                <span className="text-[10px] font-black text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full">
                  {detail.sessions.length} sessions
                </span>
              )}
            </div>

            {detail.sessions?.length > 0 ? (
              <div className="relative">
                {/* timeline track */}
                <div className="absolute left-[17px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-violet-200 via-indigo-200 to-slate-100 rounded-full hidden md:block" />
                <div className="space-y-3">
                  {detail.sessions.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                      className="flex gap-5 items-start"
                    >
                      {/* dot */}
                      <div className="shrink-0 size-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-md shadow-indigo-200 mt-3 hidden md:flex">
                        {i + 1}
                      </div>
                      {/* card */}
                      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 hover:border-violet-300 hover:shadow-md transition-all cursor-default group">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1 md:hidden">
                              <span className="size-5 rounded-full bg-violet-100 text-violet-600 text-[9px] font-black flex items-center justify-center">{i+1}</span>
                            </div>
                            <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-violet-700 transition-colors">{s.title}</h4>
                          </div>
                          <div className="flex flex-wrap gap-2 shrink-0">
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                              <Clock className="size-3 text-slate-400" />
                              {s.startTime} ({s.duration})
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg truncate max-w-[160px]">
                              {s.format === 'Online' ? <Video className="size-3 text-teal-500 shrink-0" /> : <MapPin className="size-3 text-rose-500 shrink-0" />}
                              {s.locationOrLink}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 text-center">
                <p className="text-sm text-slate-400 font-semibold">No sessions scheduled yet.</p>
              </div>
            )}
          </section>

          {/* Resources */}
          {detail.resources?.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <div className="size-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Paperclip className="size-5 text-emerald-500" />
                </div>
                <h2 className="text-lg font-black text-slate-800">Learning Resources</h2>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                  {detail.resources.length} files
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detail.resources.map((res, i) => {
                  const isLink = res.type === 'Link';
                  const isPdf  = res.fileType?.toLowerCase() === '.pdf';
                  const iconBg = isLink ? 'bg-sky-50 text-sky-600' : isPdf ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600';
                  return (
                    <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3.5 bg-white border border-slate-200 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-md transition-all group"
                    >
                      <div className={cn('size-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
                        {isLink ? <Link2 className="size-5" /> : <FileText className="size-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{res.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                          {isLink ? 'External Link' : `${res.fileType?.replace('.','') || 'Document'} · ${(res.fileSizeBytes/1048576).toFixed(2)} MB`}
                        </p>
                      </div>
                      <Download className="size-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                    </a>
                  );
                })}
              </div>
            </section>
          )}
        </motion.div>

        {/* ══ RIGHT: Sticky Sidebar ══════════════════════════════ */}
        <motion.aside
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="w-full lg:w-[360px] shrink-0 space-y-5 sticky top-6"
        >
          {/* ── Registration Card ── */}
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-xl shadow-slate-200/60 overflow-hidden">

            {/* Points banner */}
            <div className="relative bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 p-6 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.4),transparent_65%)]" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">Completion Reward</p>
                  <p className="text-3xl font-black text-white drop-shadow">+{detail.points} <span className="text-lg font-bold opacity-80">pts</span></p>
                </div>
                <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/15 backdrop-blur-sm">
                  <Award className="size-8 text-violet-200 drop-shadow-lg" />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Capacity bar */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-extrabold text-slate-700 flex items-center gap-2">
                    <Users className="size-4 text-slate-400" /> Enrollment
                  </span>
                  <span className={cn('font-black text-xs px-2.5 py-1 rounded-lg', isFull ? 'text-rose-600 bg-rose-50' : 'text-indigo-600 bg-indigo-50')}>
                    {detail.takenSlots}/{detail.totalSlots}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${fillPct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', isFull ? 'bg-rose-400' : 'bg-gradient-to-r from-indigo-500 to-violet-500')}
                  />
                </div>
                {isFull && <p className="text-xs text-rose-500 font-bold text-center">This class is fully booked</p>}
              </div>

              {/* CTA */}
              <AnimatePresence mode="wait">
                {isInstructor ? (
                  <motion.div key="instructor" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                    <Sparkles className="size-5 text-indigo-500" />
                    <p className="text-sm font-bold text-indigo-700">You're teaching this class</p>
                  </motion.div>
                ) : canRegister ? (
                  isRegistered ? (
                    <motion.div key="registered" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <div className="flex items-center justify-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                        <CheckCircle2 className="size-5 text-emerald-500" />
                        <p className="text-sm font-extrabold text-emerald-700">Registered Successfully!</p>
                      </div>
                      <button onClick={handleCancel} disabled={actionLoading}
                        className="w-full text-sm font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 py-3 rounded-xl transition-colors disabled:opacity-50">
                        Cancel Registration
                      </button>
                    </motion.div>
                  ) : isPending ? (
                    <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <div className="flex items-center justify-center gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <Clock className="size-5 text-amber-500" />
                        <p className="text-sm font-extrabold text-amber-700">Pending Approval</p>
                      </div>
                      <button onClick={handleCancel} disabled={actionLoading}
                        className="w-full text-sm font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 py-3 rounded-xl transition-colors disabled:opacity-50">
                        Cancel Request
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={handleRegister} disabled={actionLoading || isFull}
                      className={cn(
                        'w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg',
                        isFull
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/30 hover:brightness-110 active:scale-[0.98]'
                      )}
                    >
                      {actionLoading ? (
                        <><span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                      ) : isFull ? 'Class Full' : (
                        <><ChevronRight className="size-4" /> Register Now</>
                      )}
                    </motion.button>
                  )
                ) : (
                  <motion.div key="no-access" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <AlertCircle className="size-5 text-slate-400 shrink-0" />
                    <p className="text-sm text-slate-500 font-semibold">Registration not available for your role.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Mentor Card ── */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User className="size-3.5" /> Lead Instructor
            </p>
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 shadow-md shrink-0">
                <img src={detail.mentor.avatar} alt={detail.mentor.name}
                  className="w-full h-full rounded-[14px] object-cover border-2 border-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-slate-800 text-base leading-tight truncate">{detail.mentor.name}</h4>
                <p className="text-xs font-bold text-indigo-500 mt-0.5 truncate">{detail.mentor.position}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black text-slate-700">{detail.mentor.rating}</span>
                  <span className="text-xs text-slate-400 font-semibold">Rating</span>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

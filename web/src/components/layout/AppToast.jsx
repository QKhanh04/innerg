import { Check, X, Info, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";

const styles = {
  success: {
    icon: <Check className="w-5 h-5 text-[#0F1F3D] stroke-[3]" />,
    iconBg: "bg-gradient-to-br from-emerald-400 to-[#00C896] shadow-[0_0_12px_#00C896]",
    title: "Success",
    titleColor: "text-emerald-400 font-extrabold uppercase tracking-wider text-[10px]",
    progress: "bg-[#00C896] shadow-[0_0_8px_#00C896]",
    cardBorder: "border border-emerald-500/25",
    cardShadow: "shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_20px_rgba(16,185,129,0.15)]",
  },
  error: {
    icon: <X className="w-5 h-5 text-white stroke-[3]" />,
    iconBg: "bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_0_12px_#EF4444]",
    title: "Error",
    titleColor: "text-rose-400 font-extrabold uppercase tracking-wider text-[10px]",
    progress: "bg-rose-500 shadow-[0_0_8px_#EF4444]",
    cardBorder: "border border-rose-500/25",
    cardShadow: "shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_20px_rgba(239,68,68,0.15)]",
  },
  info: {
    icon: <Info className="w-5 h-5 text-white stroke-[2.5]" />,
    iconBg: "bg-gradient-to-br from-sky-400 to-blue-500 shadow-[0_0_12px_#3B82F6]",
    title: "Update",
    titleColor: "text-sky-400 font-extrabold uppercase tracking-wider text-[10px]",
    progress: "bg-sky-500 shadow-[0_0_8px_#3B82F6]",
    cardBorder: "border border-sky-500/25",
    cardShadow: "shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_20px_rgba(59,130,246,0.15)]",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-[#0F1F3D] stroke-[2.5]" />,
    iconBg: "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-[0_0_12px_#F59E0B]",
    title: "Warning",
    titleColor: "text-amber-400 font-extrabold uppercase tracking-wider text-[10px]",
    progress: "bg-amber-500 shadow-[0_0_8px_#F59E0B]",
    cardBorder: "border border-amber-500/25",
    cardShadow: "shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_20px_rgba(245,158,11,0.15)]",
  },
};

export const showToast = (type = "success", message, duration = 3000) => {
  const config = styles[type] || styles.success;

  toast.custom(
    (t) => (
      <div
        className={`
          relative
          flex items-start gap-3.5
          w-[360px] md:w-[380px]
          bg-slate-900/95
          backdrop-blur-md
          rounded-2xl
          px-4.5 py-4
          overflow-hidden
          transition-all duration-300 ease-out
          ${config.cardBorder}
          ${config.cardShadow}
          ${t.visible ? "animate-slideIn" : "animate-slideOut"}
        `}
      >
        {/* Glowing Badge Circle */}
        <div
          className={`
            flex items-center justify-center 
            w-9 h-9
            rounded-full 
            shrink-0
            ${config.iconBg}
          `}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
          <p className={`font-black text-xs ${config.titleColor} tracking-widest uppercase mb-1`}>
            {config.title}
          </p>
          <p className="text-slate-100 text-sm font-semibold leading-snug">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl p-1.5 transition-all shrink-0 -mt-1 -mr-1"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Floating animated progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950/40 overflow-hidden">
          <div
            className={`h-full ${config.progress}`}
            style={{
              animation: `progress ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>
    ),
    { 
      duration: duration ?? 3000,
      position: "top-right",
      removeDelay: 0
    }
  );
};
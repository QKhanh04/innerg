import { Check, X, Info, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";

const styles = {
  success: {
    icon: <Check className="w-5 h-5 text-white" />,
    iconBg: "bg-green-500",
    title: "Success!",
    titleColor: "text-green-500",
    progress: "bg-green-500",
  },
  error: {
    icon: <X className="w-5 h-5 text-white" />,
    iconBg: "bg-red-500",
    title: "Error!",
    titleColor: "text-red-500",
    progress: "bg-red-500",
  },
  info: {
    icon: <Info className="w-5 h-5 text-white" />,
    iconBg: "bg-blue-500",
    title: "Info",
    titleColor: "text-blue-500",
    progress: "bg-blue-500",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-white" />,
    iconBg: "bg-yellow-500",
    title: "Warning!",
    titleColor: "text-yellow-500",
    progress: "bg-yellow-500",
  },
};

export const showToast = (type = "success", message, duration = 3000) => {
  const config = styles[type];

  toast.custom(
    (t) => (
      <div
        className={`
          relative
          flex items-center gap-3
          w-80
          bg-white
          rounded-3xl
          shadow-[0_8px_30px_rgb(0,0,0,0.12)]
          px-3 py-2
          overflow-hidden
          transition-all duration-300 ease-out
          ${t.visible ? "animate-slideIn" : "animate-slideOut"}
        `}
      >
        {/* Icon circle */}
        <div
          className={`
            flex items-center justify-center 
            w-9 h-9
            rounded-full 
            ${config.iconBg}
          `}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-base ${config.titleColor} mb-0.5`}>
            {config.title}
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Close button - căn giữa theo chiều dọc */}
        <button
          onClick={() => toast.dismiss(t.id)}
          className=" text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
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

// // Helper functions
// export const toastSuccess = (message) => showToast("success", message);
// export const toastError = (message) => showToast("error", message);
// export const toastInfo = (message) => showToast("info", message);
// export const toastWarning = (message) => showToast("warning", message);
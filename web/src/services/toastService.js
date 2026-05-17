// toastService.js
import { toast } from "react-hot-toast";
import { showToast } from "../components/layout/AppToast";

export const toastService = {
  success: (message, duration) =>
    showToast("success", message, duration),

  error: (message, duration) =>
    showToast("error", message, duration),

  info: (message, duration) =>
    showToast("info", message, duration),

  warning: (message, duration) =>
    showToast("warning", message, duration),

  loading: (message) => toast.loading(message),

  dismiss: (id) => toast.dismiss(id),
};

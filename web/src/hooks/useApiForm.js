import { useState } from "react";
import { getErrorMessage, formatValidationErrors } from "../utils/errorHandler";
import { toastService } from "../services/toastService";
export const useApiForm = () => {
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  const submit = async ({ action, successMessage, onSuccess, showSuccessToast = true }) => {
    if (isLoading) return;

    setIsLoading(true);
    setErrors({});
    setGlobalError(null);


    try {
      const data = await action();
      if (successMessage && showSuccessToast) {
        toastService.success(successMessage);
      }
      if (onSuccess) onSuccess(data);
      return { success: true, data };
    } catch (error) {
      const validationErrors = formatValidationErrors(error);

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
      } else {
        const errorMsg = getErrorMessage(error);
        setGlobalError(errorMsg);
        toastService.error(getErrorMessage(error));
      }

      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    errors,
    globalError,
    isLoading,
    submit,
    setErrors,
  };
};



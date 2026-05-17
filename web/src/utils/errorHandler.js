// Extract error message from API response
export const getErrorMessage = (error) => {
  // Validation errors with multiple fields
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    
    // If it's an object with field-specific errors
    if (typeof errors === 'object') {
      return Object.entries(errors)
        .map(([field, messages]) => {
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
          return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
        })
        .join('\n');
    }
  }

  // Single error message
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }

  if (error.response?.data?.title) {
    return error.response.data.title;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Network errors
  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

// Format validation errors for form display
export const formatValidationErrors = (error) => {
  if (!error.response?.data?.errors) {
    return {};
  }

  const errors = error.response.data.errors;
  const formattedErrors = {};

  Object.entries(errors).forEach(([field, messages]) => {
    const lowerField = field;
    formattedErrors[lowerField] = Array.isArray(messages) 
      ? messages[0] 
      : messages;
  });

  return formattedErrors;
};
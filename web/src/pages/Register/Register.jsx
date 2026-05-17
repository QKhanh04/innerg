import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApiForm } from '../../hooks/useApiForm';
import { toastService } from '../../services/toastService';
const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { submit, errors, setErrors, isLoading } = useApiForm();
  const [requiresVerification, setRequiresVerification] = useState(false);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.userName.length < 3) {
      newErrors.userName = 'Username must be at least 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await submit({
      action: () => register(formData),
      successMessage: "Registration successful!",
      onSuccess: (data) => {
        if (data.requiresEmailVerification) {
          setRequiresVerification(true);
        } else {
          toastService.success("Registration successful! Please log in.");
          navigate('/login');
        }
      },
      showSuccessToast: false,
    });
  };
  useEffect(() => {
    if (!requiresVerification) return;

    const timer = setTimeout(() => {
      navigate('/login');
    }, 5000);
    return () => clearTimeout(timer);

  }, [requiresVerification, navigate])


  if (requiresVerification) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎉</span>
            </div>
            <h1 className="text-3xl font-bold text-deep-blue mb-2">
              Registration Successful!
            </h1>
            <p className="text-gray-600">
              Please check your email to verify your account
            </p>
          </div>

          <div className="bg-primary/10 border border-primary rounded-lg p-4 mb-6">
            <p className="text-deep-blue">
              A verification email has been sent to <span className="font-semibold">{formData.email}</span>.
              Please verify your email before logging in.
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-500 flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-deep-blue mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">Sign up to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label
              htmlFor="userName"
              className="block text-sm font-semibold text-deep-blue mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.userName
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 focus:border-primary'
                }`}
              required
              autoComplete="username"
            />
            {errors.userName && (
              <p className="mt-1 text-sm text-red-600">{errors.userName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-deep-blue mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.email
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 focus:border-primary'
                }`}
              required
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-deep-blue  mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.password
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 focus:border-primary'
                }`}
              required
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-deep-blue mb-2"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.confirmPassword
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 focus:border-primary'
                }`}
              required
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-[#11d4a3] text-deep-blue font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary hover:text-[#11d4a3] font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
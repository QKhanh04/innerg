import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApiForm } from '../../../hooks/useApiForm';
import { useAuth } from '../../../hooks/useAuth';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const { submit, errors, setErrors, isLoading } = useApiForm();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  const userId = searchParams.get('userId') || '';
  const token = searchParams.get('token') || '';
  const hasValidLink = useMemo(() => Boolean(userId && token), [token, userId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    await submit({
      action: () => resetPassword({
        userId,
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      }),
      successMessage: 'Password reset successfully!',
      onSuccess: () => {
        setIsResetSuccess(true);
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      },
    });
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-deep-blue mb-2">Reset Password</h1>
          <p className="text-gray-600">
            Choose a new password for your account.
          </p>
        </div>

        {!hasValidLink ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              This reset link is invalid or incomplete.
            </div>
            <div className="text-center">
              <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
                Request a new reset link
              </Link>
            </div>
          </div>
        ) : isResetSuccess ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-deep-blue">
              Your password has been updated. Redirecting to login...
            </div>
            <div className="text-center">
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Go to login now
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-deep-blue mb-2">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-primary'
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-deep-blue mb-2">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-primary'
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-[#11d4a3] text-deep-blue font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {isLoading ? 'Resetting password...' : 'Reset password'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

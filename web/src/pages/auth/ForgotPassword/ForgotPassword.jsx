import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApiForm } from '../../../hooks/useApiForm';
import { useAuth } from '../../../hooks/useAuth';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const { submit, errors, setErrors, isLoading } = useApiForm();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (event) => {
    setEmail(event.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await submit({
      action: () => forgotPassword(email),
      successMessage: 'If that email exists, a reset link has been sent.',
      onSuccess: () => setIsSubmitted(true),
    });
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-deep-blue mb-2">Forgot Password</h1>
          <p className="text-gray-600">
            Enter your email and we will send you a password reset link.
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-deep-blue">
              Please check <span className="font-semibold">{email}</span> for the reset link.
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Back to login
              </Link>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="font-semibold text-slate-600 hover:text-slate-900"
              >
                Use another email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-deep-blue mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleChange}
                autoComplete="email"
                required
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-primary'
                }`}
                placeholder="name@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-[#11d4a3] text-deep-blue font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {isLoading ? 'Sending reset link...' : 'Send reset link'}
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

export default ForgotPassword;

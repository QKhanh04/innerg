import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useApiForm } from '../../../hooks/useApiForm';
import { toastService } from '../../../services/toastService';
import { getErrorMessage } from '../../../utils/errorHandler';
import { getDefaultRouteFromRoles } from '../../../utils/authRoute';

const AcceptInvite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token') || '';
  const { acceptInvite, getInvite } = useAuth();

  const [invite, setInvite] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [inviteError, setInviteError] = useState('');
  const [formData, setFormData] = useState({
    token: inviteToken,
    fullName: '',
    password: '',
    confirmPassword: '',
  });

  const { submit, errors, setErrors, isLoading, globalError } = useApiForm();

  useEffect(() => {
    const loadInvite = async () => {
      if (!inviteToken) {
        setInviteError('Account activation requires an invite link from HR.');
        setInviteLoading(false);
        return;
      }

      try {
        const data = await getInvite(inviteToken);
        if (data.status !== 'PENDING') {
          setInviteError(`This invite is ${data.status.toLowerCase()}.`);
          return;
        }

        setInvite(data);
        setFormData(prev => ({
          ...prev,
          token: inviteToken,
          fullName: data.fullName || '',
        }));
      } catch (error) {
        setInviteError(getErrorMessage(error));
      } finally {
        setInviteLoading(false);
      }
    };

    loadInvite();
  }, [getInvite, inviteToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one digit';
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
      action: () => acceptInvite(formData),
      showSuccessToast: false,
      onSuccess: (data) => {
        if (data.requiresWorkspaceSelection) return;
        toastService.success('Account activated successfully!');
        navigate(getDefaultRouteFromRoles(data.roles || []), { replace: true });
      },
    });
  };

  if (inviteLoading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Checking invite...</p>
        </div>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-deep-blue mb-3">Invite required</h1>
          <p className="text-gray-600 mb-6">{inviteError}</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 font-bold text-deep-blue"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-deep-blue mb-2">
            Join {invite?.companyName}
          </h1>
          <p className="text-gray-600">Activate your InnerG workspace account</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-6">
          <div className="flex justify-between gap-4 text-sm mb-2">
            <span className="text-gray-500">Email</span>
            <span className="font-semibold text-deep-blue text-right">{invite?.email}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-gray-500">Roles</span>
            <span className="font-semibold text-deep-blue text-right">
              {(invite?.roles || []).join(', ')}
            </span>
          </div>
        </div>

        {globalError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-semibold text-deep-blue mb-2"
            >
              Full name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.fullName
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 focus:border-primary'
                }`}
              required
              autoComplete="name"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-deep-blue mb-2"
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
              Confirm password
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
            {isLoading ? 'Activating account...' : 'Activate account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already activated?{' '}
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

export default AcceptInvite;

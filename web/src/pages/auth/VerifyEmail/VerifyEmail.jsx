import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { getErrorMessage } from '../../../utils/errorHandler';
import { toastService } from '../../../services/toastService';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerificationEmail } = useAuth();

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const email = useMemo(() => searchParams.get('email') || '', [searchParams]);

  useEffect(() => {
    const verify = async () => {
      const userId = searchParams.get('userId');
      const token = searchParams.get('token');

      if (!userId || !token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        await verifyEmail(userId, token);
        setStatus('success');
        setMessage('Email verified successfully!');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(getErrorMessage(error));
      }
    };

    verify();
  }, [searchParams, verifyEmail, navigate]);

  const handleResend = async () => {
    if (!email || isResending) {
      return;
    }

    setIsResending(true);
    try {
      await resendVerificationEmail(email);
      toastService.success('Verification email sent again.');
    } catch (error) {
      toastService.error(getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-deep-blue mb-2">
            {status === 'verifying' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified! ✓'}
            {status === 'error' && 'Verification Failed'}
          </h1>
          <p className="text-gray-600">
            {status === 'verifying' && 'Please wait while we verify your email.'}
            {status === 'success' && 'Your account is ready. Redirecting to login.'}
            {status === 'error' && 'The verification link may be invalid or expired.'}
          </p>
        </div>

        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-slate-600">Please wait while we verify your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-deep-blue">
              {message}
            </div>
            <div className="text-center text-sm text-slate-600">
              <p>Redirecting to login page...</p>
              <p className="mt-2">
                Or <Link to="/login">click here</Link> to login now
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {message}
            </div>
            <div className="flex flex-col gap-3">
              {email && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isResending ? 'Resending...' : 'Resend verification email'}
                </button>
              )}
              <p className="text-center">
                <Link to="/login">Go to Login</Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

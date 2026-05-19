import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

import { getErrorMessage } from '../../utils/errorHandler';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>
            {status === 'verifying' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified! ✓'}
            {status === 'error' && 'Verification Failed'}
          </h1>
        </div>

        {status === 'verifying' && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Please wait while we verify your email...</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="alert alert-success">
              {message}
            </div>
            <div className="auth-footer">
              <p>Redirecting to login page...</p>
              <p>
                Or <Link to="/login">click here</Link> to login now
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="alert alert-error">
              {message}
            </div>
            <div className="auth-footer">
              <p>
                <Link to="/login">Go to Login</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
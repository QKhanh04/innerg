import React, { useCallback, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { getErrorMessage } from '../../utils/errorHandler';
import { toastService } from '../../services/toastService';
const GoogleLoginButton = () => {
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const googleButtonRef = React.useRef(null);

    const handleGoogleLoginSuccess = useCallback(async (credentialResponse) => {
        setIsLoading(true);
        setError(null);
        try {
            const idToken = credentialResponse.credential;
            await loginWithGoogle(idToken);
            toastService.success('Logged in successfully!');
            
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        } catch (err) {
            console.error('Google login error:', err);
            const errorMsg = getErrorMessage(err);
            setError(errorMsg);
            toastService.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, [loginWithGoogle, navigate, location]);

    const handleGoogleLoginError = useCallback((err) => {
        console.error('Google login failed:', err);
        const errorMsg = 'Google login failed. Please try again.';
        setError(errorMsg);
        toastService.error(errorMsg);
    }, []);

    // Trigger hidden Google button
    const handleCustomButtonClick = () => {
        if (!isLoading && googleButtonRef.current) {
            const googleButton = googleButtonRef.current.querySelector('div[role="button"]');
            if (googleButton) {
                googleButton.click();
            }
        }
    };

    return (
        <div className="w-full">
            {/* Hidden Google Login Button */}
            <div ref={googleButtonRef} className="hidden">
                <GoogleLogin
                    onSuccess={handleGoogleLoginSuccess}
                    onError={handleGoogleLoginError}
                    useOneTap={false}
                />
            </div>

            {/* Custom Styled Button */}
            <button
                type="button"
                onClick={handleCustomButtonClick}
                disabled={isLoading}
                className="w-full flex h-14 items-center justify-center gap-3 rounded-lg border-2 border-slate-200 bg-white text-slate-700 text-base font-semibold hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {/* Google Icon SVG */}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.8055 10.2292C19.8055 9.55156 19.7501 8.86719 19.6323 8.19531H10.2002V12.0489H15.6014C15.375 13.2911 14.6569 14.3898 13.6166 15.0875V17.586H16.8338C18.7171 15.8444 19.8055 13.2722 19.8055 10.2292Z" fill="#4285F4"/>
                    <path d="M10.2002 20.0006C12.9518 20.0006 15.2723 19.1048 16.8407 17.5865L13.6235 15.088C12.7468 15.698 11.6025 16.0426 10.2072 16.0426C7.5459 16.0426 5.2881 14.2833 4.51668 11.917H1.2002V14.4928C2.80882 17.6952 6.3501 20.0006 10.2002 20.0006Z" fill="#34A853"/>
                    <path d="M4.50977 11.9169C4.06943 10.6747 4.06943 9.33032 4.50977 8.08813V5.51233H1.20019C-0.206724 8.33947 -0.206724 11.6654 1.20019 14.4926L4.50977 11.9169Z" fill="#FBBC04"/>
                    <path d="M10.2002 3.95805C11.6722 3.936 13.0953 4.47255 14.1776 5.45722L17.0294 2.60537C15.1827 0.904118 12.7415 -0.0290617 10.2002 0.000244021C6.3501 0.000244021 2.80882 2.30567 1.2002 5.51233L4.50977 8.08814C5.27426 5.71552 7.53903 3.95805 10.2002 3.95805Z" fill="#EA4335"/>
                </svg>
                
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Signing in...
                    </span>
                ) : (
                    'Sign in with Google'
                )}
            </button>

            {/* Error message */}
            {error && (
                <p className="mt-3 text-sm text-red-500 text-center">
                    {error}
                </p>
            )}

            {/* Loading overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 shadow-2xl flex flex-col items-center gap-3 max-w-sm mx-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                        <span className="text-slate-700 font-semibold">
                            Signing in with Google...
                        </span>
                        <p className="text-slate-500 text-sm text-center">
                            Please wait while we verify your account
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(GoogleLoginButton);
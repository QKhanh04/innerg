import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import GoogleLoginButton from '../../../components/login/GoogleLoginButton';
import { useApiForm } from '../../../hooks/useApiForm';
import { toastService } from '../../../services/toastService';
import { getDefaultRouteFromRoles } from '../../../utils/authRoute';
import loginIllustration from '../../../assets/login-illustration.png';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
    twoFactorCode: '',
  });
  const [workspaceOptions, setWorkspaceOptions] = useState([]);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  const { submit, errors, setErrors, isLoading } = useApiForm();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name !== 'twoFactorCode' && requiresTwoFactor) {
      setRequiresTwoFactor(false);
    }
    if (workspaceOptions.length > 0) {
      setWorkspaceOptions([]);
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };


  const handleSubmit = async (e) => {

    e.preventDefault();
    await submit({
      action: () => login(formData),
      showSuccessToast: false,
      onSuccess: (data) => {
        if (data.requiresWorkspaceSelection) {
          setWorkspaceOptions(data.workspaces || []);
          toastService.success('Select a workspace to continue.');
          return;
        }

        if (data.requiresTwoFactor) {
          setRequiresTwoFactor(true);
          toastService.success('Enter the verification code sent to your email.');
          return;
        }

        toastService.success('Login successfully!');
        const from = location.state?.from?.pathname || getDefaultRouteFromRoles(data.roles || []);
        navigate(from, { replace: true });

      }
    });
  };

  const handleWorkspaceSelect = async (companyId) => {
    await submit({
      action: () => login({ ...formData, companyId }),
      showSuccessToast: false,
      onSuccess: (data) => {
        if (data.requiresTwoFactor) {
          setRequiresTwoFactor(true);
          toastService.success('Enter the verification code sent to your email.');
          return;
        }

        toastService.success('Login successfully!');
        const from = location.state?.from?.pathname || getDefaultRouteFromRoles(data.roles || []);
        navigate(from, { replace: true });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* Left Side: Illustration & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1f2927] relative overflow-hidden flex-col justify-between p-12 shrink-0 sticky top-0 h-screen">
          {/* Decorative Background Elements */}
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-primary/10 rounded-full blur-[100px]"></div>

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-2 text-white">
            <div className="w-8 h-8 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">InnerG</h2>
          </div>

          {/* Heading */}
          <div className="relative z-10">
            <h1 className="text-white text-5xl font-extrabold leading-tight mb-6">
              Empower your team's <br />
              <span className="text-primary">collective intelligence.</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              The central hub for internal knowledge management and enterprise-wide skill exchange.
            </p>
          </div>

          {/* Illustration */}
          <div className="relative z-10 w-full flex-grow mx-auto flex justify-center items-center mt-8 mb-8 max-h-[65vh]">
            <div className="relative w-full max-w-lg aspect-square rounded-2xl overflow-hidden shadow-2xl group">
              <img
                alt="Corporate collaboration and knowledge sharing illustration"
                className="w-full h-full object-cover"
                src={loginIllustration}
              />
              {/* Glassmorphism Overlay Card */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">hub</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm drop-shadow-sm">Skill Exchange Active</p>
                  <p className="text-slate-200 text-xs font-mono mt-0.5">4.2k Team Members Online</p>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="relative z-10 text-slate-500 text-sm">
            © 2024 InnerG Technologies Inc. All rights reserved.
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center min-h-screen relative p-6 sm:p-12 lg:p-24">
          
          <div className="w-full max-w-[400px] mx-auto flex flex-col relative z-10 py-12">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2 text-deep-blue mb-8">
              <div className="w-8 h-8 text-primary">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold">InnerG</h2>
            </div>

            {/* Header */}
            <div className="mb-8 text-left">
              <h1 className="text-[#0a192f] tracking-tight text-3xl font-extrabold leading-tight mb-2">
                Welcome Back
              </h1>
              <p className="text-slate-500 text-[15px]">
                Enter your corporate credentials to access InnerG.
              </p>
            </div>

            {/* {globalError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm text-center border border-red-200">
                {globalError}
              </div>
            )} */}
            
            {/* Form */}
            {workspaceOptions.length > 0 && (
              <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-bold text-slate-900 mb-3">Choose workspace</h2>
                <div className="space-y-2">
                  {workspaceOptions.map((workspace) => (
                    <button
                      key={workspace.companyId}
                      type="button"
                      onClick={() => handleWorkspaceSelect(workspace.companyId)}
                      className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <span>
                        <span className="block font-semibold text-slate-900">{workspace.companyName}</span>
                        <span className="block text-xs text-slate-500">{workspace.emailDomain}</span>
                      </span>
                      <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#3b4c68] text-[11px] font-bold tracking-widest uppercase font-sans">
                  Corporate Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    mail
                  </span>
                  <input
                    className={`w-full h-12 pl-11 pr-4 rounded-md bg-white text-slate-900 focus:outline-0 focus:ring-1 focus:ring-primary border ${errors.emailOrUsername ? 'border-red-500' : 'border-slate-200 focus:border-primary'} placeholder:text-slate-300 text-[15px] transition-colors`}
                    placeholder="name@company.com"
                    type="text"
                    name="emailOrUsername"
                    value={formData.emailOrUsername}
                    onChange={handleChange}
                    required
                    autoComplete="username"
                  />
                </div>
                {errors.emailOrUsername && (
                  <span className="text-red-500 text-xs">{errors.emailOrUsername}</span>
                )}
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[#3b4c68] text-[11px] font-bold tracking-widest uppercase font-sans">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[#13ecb6] text-[12px] font-bold hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    lock
                  </span>
                  <input
                    className={`w-full h-12 pl-11 pr-10 rounded-md bg-white text-slate-900 focus:outline-0 focus:ring-1 focus:ring-primary border ${errors.password ? 'border-red-500' : 'border-slate-200 focus:border-primary'} placeholder:text-slate-300 text-[15px] transition-colors`}
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <span className="text-red-500 text-xs">{errors.password}</span>
                )}
              </div>

              {requiresTwoFactor && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#3b4c68] text-[11px] font-bold tracking-widest uppercase font-sans">
                    Verification Code
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                      shield
                    </span>
                    <input
                      className={`w-full h-12 pl-11 pr-4 rounded-md bg-white text-slate-900 focus:outline-0 focus:ring-1 focus:ring-primary border ${errors.twoFactorCode ? 'border-red-500' : 'border-slate-200 focus:border-primary'} placeholder:text-slate-300 text-[15px] transition-colors`}
                      placeholder="6-digit code"
                      type="text"
                      name="twoFactorCode"
                      value={formData.twoFactorCode}
                      onChange={handleChange}
                      required={requiresTwoFactor}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      maxLength={6}
                    />
                  </div>
                  {errors.twoFactorCode && (
                    <span className="text-red-500 text-xs">{errors.twoFactorCode}</span>
                  )}
                </div>
              )}

              {/* Sign In Button */}
              <button
                className="w-full h-12 flex items-center justify-center rounded-md bg-[#13ecb6] text-[#0a192f] text-[15px] font-bold hover:bg-[#0bc99b] active:bg-[#0aa37e] transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Divider */}
              <div className="relative py-4 flex items-center">
                <div className="grow border-t border-slate-200/60"></div>
                <span className="shrink-0 mx-4 text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest font-sans">
                  Or continue with
                </span>
                <div className="grow border-t border-slate-200/60"></div>
              </div>

              {/* SSO Button */}
              <GoogleLoginButton />
            </form>

            {/* Footer Link */}
            <div className="mt-8 text-center text-[15px]">
              <span className="text-slate-500">New to InnerG? </span>
              <a href="#" className="text-[#0aa37e] font-bold hover:underline">Ask your HR team for an invite link.</a>
            </div>
          </div>
          
          {/* Privacy and Terms bottom right */}
          <div className="absolute bottom-6 left-0 right-0 lg:left-auto lg:right-12 text-[#64748b] text-[11px] font-sans font-bold tracking-widest flex justify-center gap-6 pb-6 lg:pb-0">
            <a href="#" className="hover:text-[#0a192f] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#0a192f] transition-colors">Terms of Service</a>
          </div>
        </div>
    </div>
  );
};

export default Login;

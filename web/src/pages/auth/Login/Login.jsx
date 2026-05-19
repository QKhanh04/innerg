import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GoogleLoginButton from '../../components/login/GoogleLoginButton';
import { useApiForm } from '../../hooks/useApiForm';
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });

  const { submit, errors, globalError, setErrors, isLoading } = useApiForm();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };


  const handleSubmit = async (e) => {

    e.preventDefault();
    await submit({
      action: () => login(formData),
      successMessage: "Login successfully!",
      onSuccess: () => {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });

      }
    });
  };

  return (
    <div className="fixed top-0 left-0 w-screen h-screen overflow-hidden m-0 p-0">
      <div className="flex w-full h-full">
        {/* Left Side: Illustration & Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-deep-blue relative overflow-hidden flex-col justify-between p-12 shrink-0">
          {/* Decorative Background Elements */}
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-primary/20 rounded-full blur-3xl"></div>

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
          <div
            className="
    relative z-10 w-full mx-auto aspect-square
    max-w-xs
    sm:max-w-sm
    lg:max-w-md
    xl:max-w-lg
    max-h-[55vh]
  "
          >


            <img
              alt="Corporate collaboration and knowledge sharing illustration"
              className="w-full h-full object-contain drop-shadow-2xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAb_3N3oPrzb8T8_69jUoPQoy2JFID76fctd1eFKKf-wLmJNXfoSmpfN2r-C-wN7QpPJQypnjA_i8Rlxb3HRq1scgLd60vE6TX1AdwI3Nwc4V_0mL9tXEmYXNC5kB8PNAVGx-W6V9Mxxi1JsugbyaHMyP60mNNvuIUY-voSGorPuZ74XKln3i5ODSd9K7bx25Zj26mxT-RTrHaRmgqMxh3Tu2Hly9d76ZqIaHJ4BfPr78RFKYUauS8H1oyjlVLIj9qOVg8guy4cm43s"
            />
          </div>

          {/* Copyright */}
          <div className="relative z-10 text-slate-500 text-sm">
            © 2024 InnerG Technologies Inc. All rights reserved.
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-bg-light p-8 md:p-16 overflow-auto shrink-0">
          <div className="w-full max-w-md flex flex-col">
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
            <div className="mb-10 text-center lg:text-left">
              <h1 className="text-slate-900 tracking-tight text-3xl font-bold leading-tight mb-2">
                Welcome Back
              </h1>
              <p className="text-slate-500 text-base font-normal">
                Enter your corporate credentials to access InnerG.
              </p>
            </div>

            {/* {globalError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm text-center border border-red-200">
                {globalError}
              </div>
            )} */}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-900 text-sm font-semibold leading-normal">
                  Corporate Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                    mail
                  </span>
                  <input
                    className={`w-full h-14 pl-12 pr-4 rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border ${errors.emailOrUsername ? 'border-red-500' : 'border-slate-200'
                      } bg-white placeholder:text-slate-400 text-base font-normal`}
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
                  <span className="text-red-500 text-sm">{errors.emailOrUsername}</span>
                )}
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-slate-900 text-sm font-semibold leading-normal">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-primary text-sm font-semibold hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                    lock
                  </span>
                  <input
                    className={`w-full h-14 pl-12 pr-12 rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border ${errors.password ? 'border-red-500' : 'border-slate-200'
                      } bg-white placeholder:text-slate-400 text-base font-normal`}
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <span className="text-red-500 text-sm">{errors.password}</span>
                )}
              </div>

              {/* Sign In Button */}
              <button
                className="w-full flex h-14 items-center justify-center overflow-hidden rounded-lg bg-primary text-deep-blue text-base font-extrabold leading-normal tracking-wide hover:brightness-105 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Divider */}
              <div className="relative py-4 flex items-center">
                <div className="grow border-t border-slate-100"></div>
                <span className="shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Or continue with
                </span>
                <div className="grow border-t border-slate-100"></div>
              </div>

              {/* SSO Button */}
              <GoogleLoginButton />
            </form>

            {/* Footer Link */}
            <div className="mt-10 text-center">
              <p className="text-slate-500 text-sm font-medium">
                New to InnerG?{' '}
                <Link
                  to="/register"
                  className="text-primary font-bold hover:underline ml-1"
                >
                  Register your company
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
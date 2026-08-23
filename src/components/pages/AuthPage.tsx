import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../layout/Navbar';
import { supabase } from '../../lib/supabaseClient';
import { LogIn, UserPlus, AlertCircle, ArrowRight, CheckCircle2, Shield } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { navigateTo } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isPasswordError = Boolean(
    errorMsg && (
      errorMsg.toLowerCase().includes('password should contain') ||
      errorMsg.toLowerCase().includes('password requirement') ||
      errorMsg.toLowerCase().includes('abcdefghijklmnopqrstuvwxyz') ||
      (mode === 'signup' && errorMsg.toLowerCase().includes('password'))
    )
  );

  const [resendingEmail, setResendingEmail] = useState(false);

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address to resend confirmation.');
      return;
    }
    setResendingEmail(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (error) throw error;
      setSuccessMsg('Confirmation email sent! Please check your inbox (and spam folder) to verify your email before logging in.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend confirmation email.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (mode === 'signup' && !fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (mode === 'signup') {
      const hasLower = /[a-z]/.test(password);
      const hasUpper = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[^a-zA-Z0-9]/.test(password);
      if (!hasLower || !hasUpper || !hasNumber || !hasSpecial || password.length < 6) {
        setErrorMsg('Password should contain at least one character of each required category.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          setSuccessMsg('Account created successfully! Redirecting...');
          setTimeout(() => navigateTo('dashboard'), 1000);
        } else if (data.user) {
          // Try instant login in case auto-confirm is enabled or instant session available
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (signInData?.session) {
            setSuccessMsg('Account created successfully! Redirecting to dashboard...');
            setTimeout(() => navigateTo('dashboard'), 1000);
          } else {
            setSuccessMsg('Account created! Supabase requires email verification before first login.');
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        if (data.session) {
          setSuccessMsg('Signed in successfully! Redirecting...');
          setTimeout(() => navigateTo('dashboard'), 800);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('email not confirmed')) {
        setErrorMsg('Your email has not been confirmed yet. Please check your inbox for the confirmation link from Supabase, or click below to resend it.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#14213D] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-3xl border border-[#EDE9DF] shadow-vestiq-lg max-w-lg w-full overflow-hidden">
          
          <div className="p-6 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#C57D25] bg-[#FFF8EE] px-2.5 py-1 rounded-full border border-[#F7E5C8]">
                VestIQ Auth
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14213D] mt-3">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-xs text-[#6B7280] mt-1.5">
                {mode === 'signup'
                  ? 'Sign up to monitor portfolio health and SEBI red flags.'
                  : 'Sign in to access your portfolio guardian and holdings.'}
              </p>
            </div>

            {/* Password Requirements Styled Card (Matches design requirement) */}
            {isPasswordError ? (
              <div className="mb-6 p-4 sm:p-4.5 bg-[#FFF5F5] border border-[#FEE2E2] border-l-4 border-l-[#EF4444] rounded-2xl shadow-xs flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-full bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-[#EF4444]">
                    Password requirements
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#475569] mt-0.5 mb-2.5 leading-relaxed">
                    Password should contain at least one character from each of the following:
                  </p>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {/* Lowercase & Uppercase Pill */}
                    <div className="bg-white border border-[#FEE2E2] rounded-2xl px-2.5 py-1.5 flex items-center space-x-2.5 text-[11px] font-medium text-[#334155]">
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${/[a-z]/.test(password) ? 'text-[#16A34A]' : 'text-[#EF4444]'}`} />
                        <span>Lowercase (a–z)</span>
                      </div>
                      <span className="text-[#E2E8F0]">|</span>
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${/[A-Z]/.test(password) ? 'text-[#16A34A]' : 'text-[#EF4444]'}`} />
                        <span>Uppercase (A–Z)</span>
                      </div>
                    </div>

                    {/* Number & Special character Pill */}
                    <div className="bg-white border border-[#FEE2E2] rounded-2xl px-2.5 py-1.5 flex items-center space-x-2.5 text-[11px] font-medium text-[#334155]">
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${/[0-9]/.test(password) ? 'text-[#16A34A]' : 'text-[#EF4444]'}`} />
                        <span>Number (0–9)</span>
                      </div>
                      <span className="text-[#E2E8F0]">|</span>
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${/[^a-zA-Z0-9]/.test(password) ? 'text-[#16A34A]' : 'text-[#EF4444]'}`} />
                        <span>Special character</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : errorMsg ? (
              <div className="mb-6 p-3.5 bg-[#FDF2F2] border border-[#FCA5A5] rounded-2xl text-xs font-bold text-[#EF4444] flex flex-col space-y-2">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
                {errorMsg.toLowerCase().includes('confirmed') && (
                  <button
                    type="button"
                    disabled={resendingEmail}
                    onClick={handleResendConfirmation}
                    className="self-start mt-1 text-xs font-extrabold underline text-[#C57D25] hover:text-[#B06C19] cursor-pointer disabled:opacity-50"
                  >
                    {resendingEmail ? 'Sending confirmation email...' : 'Resend Confirmation Email →'}
                  </button>
                )}
              </div>
            ) : null}

            {successMsg && (
              <div className="mb-6 p-4 bg-[#E6F4EA] border border-[#A7F3D0] rounded-2xl text-xs text-[#15803D] flex flex-col space-y-2">
                <div className="flex items-start space-x-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{successMsg}</div>
                </div>
                {successMsg.includes('verification') && (
                  <div className="mt-2 pt-2 border-t border-[#A7F3D0]/60 text-[11px] text-[#166534] space-y-1">
                    <div className="font-bold">⚡ How to enable instant sign-in without email waiting:</div>
                    <ol className="list-decimal list-inside space-y-0.5 text-[#15803D]">
                      <li>Open your <strong>Supabase Dashboard</strong> (https://supabase.com/dashboard)</li>
                      <li>Go to <strong>Authentication</strong> → <strong>Providers</strong> → <strong>Email</strong></li>
                      <li>Turn <strong>OFF "Confirm email"</strong> and click <strong>Save</strong></li>
                    </ol>
                    <div className="pt-1 font-semibold text-[#166534]">
                      Once turned off, click "Sign In" below with your email and password to log in immediately!
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-[#14213D] mb-1">
                    Full Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EDE9DF] rounded-xl text-sm font-medium focus:outline-none focus:border-[#C57D25]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#14213D] mb-1">
                  Email Address <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE9DF] rounded-xl text-sm font-medium focus:outline-none focus:border-[#C57D25]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14213D] mb-1">
                  Password <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE9DF] rounded-xl text-sm font-medium focus:outline-none focus:border-[#C57D25]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl font-bold text-sm transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 mt-6"
              >
                <span>{loading ? 'Processing...' : mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Mode Switcher */}
            <div className="mt-6 text-center text-xs text-[#6B7280]">
              {mode === 'signup' ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setErrorMsg(null); }}
                    className="font-bold text-[#C57D25] hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setErrorMsg(null); }}
                    className="font-bold text-[#C57D25] hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </span>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

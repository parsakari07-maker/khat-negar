import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, AlertCircle, LogIn, Sparkles, ArrowLeft, XCircle, UserPlus, KeyRound, CheckCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSettings } from '../context/SettingsContext.js';
import { WelcomeCelebration } from './WelcomeCelebration.js';
import { BackgroundArtwork } from './BackgroundArtwork.js';
import type { User as UserType } from '../types.js';

export function AuthScreen() {
  const { login, register } = useAuth();
  const { logoUrl, settings } = useSettings();

  // Mode state
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Success Animation state
  const [successUser, setSuccessUser] = useState<UserType | null>(null);
  const [isEntering, setIsEntering] = useState(false);

  // Dynamic Texts
  const loginBadge = settings.login_badge_fa || 'تایپوگرافی هوشمند';
  const loginTitle = settings.login_title_fa || 'خط نگار';
  const loginSubtitle = mode === 'login'
    ? (settings.login_subtitle_fa || 'سامانه تخصصی مهندسی پرامپت خط، خوشنویسی و تایپوگرافی فارسی')
    : 'عضویت رایگان در سامانه مهندسی پرامپت خط‌نگار';
  const usernameLabel = settings.login_username_label_fa || 'نام کاربری:';
  const usernamePlaceholder = settings.login_username_placeholder_fa || 'نام کاربری شما (حداقل ۳ کاراکتر)';
  const passwordLabel = settings.login_password_label_fa || 'رمز عبور:';
  const passwordPlaceholder = settings.login_password_placeholder_fa || 'رمز عبور شما (حداقل ۶ کاراکتر)';
  const loginButtonText = mode === 'login'
    ? (settings.login_button_fa || 'ورود به سامانه')
    : 'ایجاد حساب و ورود';

  const welcomeBadge = mode === 'login'
    ? (settings.welcome_badge_fa || 'ورود با موفقیت انجام شد')
    : 'ثبت‌نام با موفقیت انجام شد';
  const welcomeTitleTemplate = settings.welcome_title_fa || 'خوش آمدید، {username}';
  const welcomeSubtitleAdmin = settings.welcome_subtitle_admin_fa || 'دسترسی: مدیریت ارشد سامانه';
  const welcomeSubtitleUser = settings.welcome_subtitle_user_fa || 'دسترسی: کاربر سامانه خط‌نگار';
  const welcomeLoadingText = settings.welcome_loading_text_fa || 'در حال آماده‌سازی و انتقال به محیط کاربری...';

  const formatWelcomeTitle = (name: string) => {
    return welcomeTitleTemplate.replace('{username}', name);
  };

  const triggerErrorShake = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError('لطفاً نام کاربری و رمز عبور را وارد نمایید.');
      triggerErrorShake();
      return;
    }

    if (cleanUsername.length < 3) {
      setError('نام کاربری باید حداقل ۳ کاراکتر باشد.');
      triggerErrorShake();
      return;
    }

    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      triggerErrorShake();
      return;
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        setError('لطفاً تکرار رمز عبور را وارد نمایید.');
        triggerErrorShake();
        return;
      }
      if (password !== confirmPassword) {
        setError('تکرار رمز عبور با رمز عبور واردشده مطابقت ندارد.');
        triggerErrorShake();
        return;
      }
    }

    setLoading(true);
    const result = mode === 'login'
      ? await login(cleanUsername, password, true)
      : await register(cleanUsername, password, true);
    setLoading(false);

    if (result.success && result.user && result.commitUser) {
      setSuccessUser(result.user);
      setIsEntering(true);

      // Play entrance celebration animation then commit session
      setTimeout(() => {
        result.commitUser!();
      }, 1650);
    } else {
      setError(result.error || (mode === 'login' ? 'نام کاربری یا رمز عبور اشتباه است.' : 'خطا در فرآیند ثبت‌نام.'));
      triggerErrorShake();
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-[var(--bg-app)] relative overflow-hidden select-none">
      {/* Living Persian Calligraphy and Islamic Geometry Background */}
      <BackgroundArtwork variant="auth" />

      {/* Screen Red Flash Effect on Error */}
      {isShaking && (
        <div className="fixed inset-0 bg-red-600/15 pointer-events-none z-50 animate-error-flash" />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-md bg-[var(--bg-surface)] border rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 overflow-hidden ${
          isShaking
            ? 'border-red-500 shadow-red-500/30 animate-error-shake ring-4 ring-red-500/20'
            : 'border-[var(--border-color)]'
        }`}
      >
        {/* Animated Rejection Cross Indicator Overlay on Error */}
        {isShaking && (
          <div className="absolute inset-0 z-30 bg-red-950/25 flex flex-col items-center justify-center pointer-events-none animate-error-cross">
            <div className="w-18 h-18 rounded-full bg-red-500/95 text-white flex items-center justify-center shadow-2xl shadow-red-500/50">
              <XCircle className="w-12 h-12 stroke-[2.5]" />
            </div>
            <span className="mt-2.5 text-xs font-black text-white px-3 py-1.5 rounded-xl bg-red-600/95 shadow-md">
              {error || 'اطلاعات وارد شده نامعتبر است!'}
            </span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isEntering && successUser ? (
            /* Login Success Celebration Animation */
            <WelcomeCelebration
              key="login-celebration"
              user={successUser}
              welcomeBadge={welcomeBadge}
              welcomeTitle={formatWelcomeTitle(successUser.username)}
              subtitleAdmin={welcomeSubtitleAdmin}
              subtitleUser={welcomeSubtitleUser}
              loadingText={welcomeLoadingText}
            />
          ) : (
            /* Normal Login/Register Form View */
            <motion.div
              key="login-form-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              {/* Brand Header */}
              <div className="text-center mb-5">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="w-14 h-14 rounded-3xl overflow-hidden shadow-xl shadow-[#F55951]/20 border border-[var(--border-color)] mx-auto mb-2.5 bg-[#361D32]"
                >
                  <img
                    src={logoUrl}
                    alt={loginTitle}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                    {loginTitle}
                  </h1>
                  {loginBadge && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#F55951]/10 text-[#F55951] border border-[#F55951]/20">
                      {loginBadge}
                    </span>
                  )}
                </div>
                {loginSubtitle && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium leading-relaxed">
                    {loginSubtitle}
                  </p>
                )}
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 mb-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'login'
                      ? 'bg-[#F55951] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>ورود به سامانه</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'register'
                      ? 'bg-[#F55951] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>ثبت‌نام رایگان</span>
                </button>
              </div>

              {/* Information Banner */}
              {mode === 'register' ? (
                <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                  <span className="leading-relaxed">
                    با عضویت رایگان، روزانه ۱ تولید پرامپت اصلی و تعداد <strong>نامحدود</strong> بازتولید پرامپت در اختیار شما خواهد بود!
                  </span>
                </div>
              ) : (
                settings.login_notice_fa && (
                  <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                    <span className="leading-relaxed">
                      {settings.login_notice_fa}
                    </span>
                  </div>
                )
              )}

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2.5 shadow-xs"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    {usernameLabel}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="input-login-username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder={usernamePlaceholder}
                      disabled={loading}
                      autoComplete="username"
                      spellCheck={false}
                      className={`w-full pl-4 pr-10 py-2.5 rounded-xl border bg-[var(--bg-card)] text-sm font-bold text-[var(--text-primary)] focus:outline-hidden transition select-text ${
                        isShaking
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-[var(--border-color)] focus:border-[#F55951] focus:ring-2 focus:ring-[#F55951]/20'
                      }`}
                      required
                    />
                    <User className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    {passwordLabel}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="input-login-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={passwordPlaceholder}
                      disabled={loading}
                      dir="ltr"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      spellCheck={false}
                      className={`w-full pl-4 pr-10 py-2.5 rounded-xl border bg-[var(--bg-card)] text-sm font-bold text-[var(--text-primary)] focus:outline-hidden transition select-text ${
                        isShaking
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-[var(--border-color)] focus:border-[#F55951] focus:ring-2 focus:ring-[#F55951]/20'
                      }`}
                      required
                    />
                    <Lock className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      تکرار رمز عبور:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        id="input-register-confirm-password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="رمز عبور را مجدداً وارد نمایید"
                        disabled={loading}
                        dir="ltr"
                        autoComplete="new-password"
                        spellCheck={false}
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:ring-2 focus:ring-[#F55951]/20 focus:outline-hidden transition select-text"
                        required
                      />
                      <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  id="btn-login-submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-xl bg-[#F55951] hover:bg-[#E04840] text-white font-bold text-sm shadow-md shadow-[#F55951]/25 transition-all cursor-pointer flex items-center justify-center gap-2 btn-interactive mt-2 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <span className="animate-spin text-sm">⏳</span>
                  ) : mode === 'login' ? (
                    <LogIn className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>{loading ? 'در حال بررسی اطلاعات...' : loginButtonText}</span>
                </motion.button>
              </form>

              {/* Bottom Switcher */}
              <div className="mt-4 pt-3 border-t border-[var(--border-color)] text-center">
                {mode === 'login' ? (
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(null); }}
                    className="text-xs text-[var(--text-secondary)] hover:text-[#F55951] transition font-bold cursor-pointer"
                  >
                    حساب کاربری ندارید؟ <span className="text-[#F55951] underline underline-offset-4">ثبت‌نام رایگان</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); }}
                    className="text-xs text-[var(--text-secondary)] hover:text-[#F55951] transition font-bold cursor-pointer"
                  >
                    قبلاً حساب ایجاد کرده‌اید؟ <span className="text-[#F55951] underline underline-offset-4">ورود به سامانه</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

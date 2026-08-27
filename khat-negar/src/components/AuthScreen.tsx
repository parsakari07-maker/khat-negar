import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, AlertCircle, LogIn, Sparkles, ArrowLeft, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSettings } from '../context/SettingsContext.js';
import { WelcomeCelebration } from './WelcomeCelebration.js';
import { BackgroundArtwork } from './BackgroundArtwork.js';
import type { User as UserType } from '../types.js';

export function AuthScreen() {
  const { login } = useAuth();
  const { logoUrl, settings } = useSettings();

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Success Animation state
  const [successUser, setSuccessUser] = useState<UserType | null>(null);
  const [isEntering, setIsEntering] = useState(false);

  // Dynamic Texts
  const loginBadge = settings.login_badge_fa || 'تایپوگرافی هوشمند';
  const loginTitle = settings.login_title_fa || 'خط نگار';
  const loginSubtitle = settings.login_subtitle_fa || 'سامانه تخصصی مهندسی پرامپت خط، خوشنویسی و تایپوگرافی فارسی';
  const usernameLabel = settings.login_username_label_fa || 'نام کاربری:';
  const usernamePlaceholder = settings.login_username_placeholder_fa || 'نام کاربری شما';
  const passwordLabel = settings.login_password_label_fa || 'رمز عبور:';
  const passwordPlaceholder = settings.login_password_placeholder_fa || 'رمز عبور شما';
  const loginButtonText = settings.login_button_fa || 'ورود به سامانه';
  const loginNotice = settings.login_notice_fa || 'ایجاد و فعال‌سازی حساب‌های کاربری صرفاً توسط مدیریت سامانه انجام می‌پذیرد.';

  const welcomeBadge = settings.welcome_badge_fa || 'ورود با موفقیت انجام شد';
  const welcomeTitleTemplate = settings.welcome_title_fa || 'خوش آمدید، {username}';
  const welcomeSubtitleAdmin = settings.welcome_subtitle_admin_fa || 'دسترسی: مدیریت ارشد سامانه';
  const welcomeSubtitleUser = settings.welcome_subtitle_user_fa || 'دسترسی: کاربری سامانه مهندسی پرامپت';
  const welcomeLoadingText = settings.welcome_loading_text_fa || 'در حال آماده‌سازی و انتقال به محیط کاربری...';

  const formatWelcomeTitle = (name: string) => {
    return welcomeTitleTemplate.replace('{username}', name);
  };

  const triggerErrorShake = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 650);
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

    setLoading(true);
    // Request login with delayCommit=true to perform entrance animation
    const result = await login(cleanUsername, password, true);
    setLoading(false);

    if (result.success && result.user && result.commitUser) {
      setSuccessUser(result.user);
      setIsEntering(true);

      // Play entrance celebration animation then commit session
      setTimeout(() => {
        result.commitUser!();
      }, 1650);
    } else {
      setError(result.error || 'نام کاربری یا رمز عبور اشتباه است.');
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
        className={`w-full max-w-md bg-[var(--bg-surface)]/95 backdrop-blur-xl border rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 overflow-hidden transition-colors ${
          isShaking
            ? 'border-red-500 shadow-red-500/30 animate-error-shake ring-4 ring-red-500/20'
            : 'border-[var(--border-color)]'
        }`}
      >
        {/* Animated Big Rejection Cross Indicator Overlay on Wrong Password */}
        {isShaking && (
          <div className="absolute inset-0 z-30 bg-red-950/25 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none animate-error-cross">
            <div className="w-20 h-20 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-2xl shadow-red-500/50">
              <XCircle className="w-14 h-14 animate-pulse stroke-[2.5]" />
            </div>
            <span className="mt-3 text-sm font-black text-white px-3 py-1 rounded-xl bg-red-600/90 shadow-md">
              اطلاعات ورود نادرست است!
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
            /* Normal Login Form View */
            <motion.div
              key="login-form-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              {/* Brand Header */}
              <div className="text-center mb-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="w-16 h-16 rounded-3xl overflow-hidden shadow-xl shadow-[#F55951]/20 border border-[var(--border-color)] mx-auto mb-3 bg-[#361D32]"
                >
                  <img
                    src={logoUrl}
                    alt={loginTitle}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
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

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2.5 shadow-xs"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 animate-bounce" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
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
                      className={`w-full pl-4 pr-10 py-3 rounded-xl border bg-[var(--bg-card)] text-sm font-bold text-[var(--text-primary)] focus:outline-hidden transition ${
                        isShaking
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-[var(--border-color)] focus:border-[#F55951] focus:ring-2 focus:ring-[#F55951]/20'
                      }`}
                      required
                    />
                    <User className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
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
                      className={`w-full pl-4 pr-10 py-3 rounded-xl border bg-[var(--bg-card)] text-sm font-bold text-[var(--text-primary)] focus:outline-hidden transition dir-ltr ${
                        isShaking
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-[var(--border-color)] focus:border-[#F55951] focus:ring-2 focus:ring-[#F55951]/20'
                      }`}
                      required
                    />
                    <Lock className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-3.5" />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  id="btn-login-submit"
                  disabled={loading}
                  className={`w-full py-3.5 px-4 rounded-xl bg-[#F55951] hover:bg-[#E04840] text-white font-bold text-sm shadow-md shadow-[#F55951]/25 transition-all cursor-pointer flex items-center justify-center gap-2 btn-interactive ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <span className="animate-spin text-sm">⏳</span>
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>{loading ? 'در حال بررسی اطلاعات...' : loginButtonText}</span>
                </motion.button>
              </form>

              {/* Info Note */}
              {loginNotice && (
                <div className="mt-5 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {loginNotice}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

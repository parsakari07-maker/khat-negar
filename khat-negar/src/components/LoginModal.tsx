import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, KeyRound, AlertCircle, X, ShieldAlert, XCircle, UserPlus, LogIn, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSettings } from '../context/SettingsContext.js';
import { WelcomeCelebration } from './WelcomeCelebration.js';
import type { User as UserType } from '../types.js';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function LoginModal({ isOpen, onClose, initialMode = 'login' }: LoginModalProps) {
  const { login, register } = useAuth();
  const { logoUrl, settings } = useSettings();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [successUser, setSuccessUser] = useState<UserType | null>(null);
  const [isEntering, setIsEntering] = useState(false);

  if (!isOpen) return null;

  // Dynamic texts from Settings
  const loginBadge = settings.login_badge_fa || 'تایپوگرافی هوشمند';
  const loginTitle = settings.login_title_fa || 'خط نگار';
  const loginSubtitle = mode === 'login'
    ? (settings.login_subtitle_fa || 'جهت تولید پرامپت و دسترسی به امکانات وارد شوید')
    : 'ایجاد حساب کاربری رایگان در سامانه خط‌نگار';
  const usernameLabel = settings.login_username_label_fa || 'نام کاربری:';
  const usernamePlaceholder = settings.login_username_placeholder_fa || 'نام کاربری شما (حداقل ۳ کاراکتر)';
  const passwordLabel = settings.login_password_label_fa || 'رمز عبور:';
  const passwordPlaceholder = settings.login_password_placeholder_fa || 'رمز عبور شما (حداقل ۶ کاراکتر)';
  const loginButtonText = mode === 'login'
    ? (settings.login_button_fa || 'ورود به حساب کاربری')
    : 'ثبت‌نام و ورود به خط‌نگار';

  const welcomeBadge = mode === 'login'
    ? (settings.welcome_badge_fa || 'ورود با موفقیت انجام شد')
    : 'ثبت‌نام با موفقیت انجام شد';
  const welcomeTitleTemplate = settings.welcome_title_fa || 'خوش آمدید، {username}';
  const welcomeLoadingText = settings.welcome_loading_text_fa || 'در حال آماده‌سازی میز کار...';

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
    const cleanUser = username.trim();

    if (!cleanUser || !password) {
      setError('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      triggerErrorShake();
      return;
    }

    if (cleanUser.length < 3) {
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

    setError(null);
    setLoading(true);

    const result = mode === 'login'
      ? await login(cleanUser, password, true)
      : await register(cleanUser, password, true);

    setLoading(false);

    if (result.success && result.user && result.commitUser) {
      setSuccessUser(result.user);
      setIsEntering(true);

      setTimeout(() => {
        result.commitUser!();
        onClose();
        setIsEntering(false);
        setSuccessUser(null);
      }, 1550);
    } else {
      setError(result.error || (mode === 'login' ? 'نام کاربری یا رمز عبور اشتباه است.' : 'خطا در فرآیند ثبت‌نام.'));
      triggerErrorShake();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Screen Red Flash Effect on Error */}
      {isShaking && (
        <div className="fixed inset-0 bg-red-600/15 pointer-events-none z-50 animate-error-flash" />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-md rounded-3xl bg-[var(--bg-surface)] border shadow-2xl p-6 md:p-8 relative overflow-hidden transition-colors ${
          isShaking
            ? 'border-red-500 shadow-red-500/30 animate-error-shake ring-4 ring-red-500/20'
            : 'border-[var(--border-color)]'
        }`}
      >
        {/* Animated Rejection Cross Indicator Overlay on Wrong Password */}
        {isShaking && (
          <div className="absolute inset-0 z-30 bg-red-950/25 flex flex-col items-center justify-center pointer-events-none animate-error-cross">
            <div className="w-16 h-16 rounded-full bg-red-500/95 text-white flex items-center justify-center shadow-2xl shadow-red-500/50">
              <XCircle className="w-10 h-10 stroke-[2.5]" />
            </div>
            <span className="mt-2.5 text-xs font-black text-white px-3 py-1 rounded-xl bg-red-600/95 shadow-md">
              {error || 'اطلاعات وارد شده نامعتبر است!'}
            </span>
          </div>
        )}

        {/* Close Button */}
        {!isEntering && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 left-5 p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <AnimatePresence mode="wait">
          {isEntering && successUser ? (
            <WelcomeCelebration
              key="modal-celebration"
              user={successUser}
              welcomeBadge={welcomeBadge}
              welcomeTitle={formatWelcomeTitle(successUser.username)}
              loadingText={welcomeLoadingText}
              compact={true}
            />
          ) : (
            <motion.div key="modal-form-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Modal Header */}
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border border-[var(--border-color)] mx-auto mb-2.5 bg-[#361D32]">
                  <img
                    src={logoUrl}
                    alt={loginTitle}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <h2 className="text-lg font-black text-[var(--text-primary)]">{loginTitle}</h2>
                  {loginBadge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#F55951]/10 text-[#F55951]">
                      {loginBadge}
                    </span>
                  )}
                </div>
                {loginSubtitle && (
                  <p className="text-xs text-[var(--text-secondary)]">
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
                  <span>ورود به حساب</span>
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

              {/* Notice Banner */}
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
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      {settings.login_notice_fa}
                    </span>
                  </div>
                )
              )}

              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 shadow-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{usernameLabel}</label>
                  <div className="relative">
                    <input
                      type="text"
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
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{passwordLabel}</label>
                  <div className="relative">
                    <input
                      type="password"
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
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">تکرار رمز عبور:</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="تکرار رمز عبور خود را وارد نمایید"
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
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-xl bg-[#F55951] hover:bg-[#E04840] text-white font-bold text-sm shadow-md shadow-[#F55951]/25 transition-all cursor-pointer flex items-center justify-center gap-2 btn-interactive mt-2 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <span className="animate-spin">⏳</span>
                  ) : mode === 'login' ? (
                    <KeyRound className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>{loading ? 'در حال بررسی...' : loginButtonText}</span>
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
                    قبلاً ثبت‌نام کرده‌اید؟ <span className="text-[#F55951] underline underline-offset-4">ورود به حساب</span>
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, KeyRound, AlertCircle, X, ShieldAlert, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSettings } from '../context/SettingsContext.js';
import { WelcomeCelebration } from './WelcomeCelebration.js';
import type { User as UserType } from '../types.js';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useAuth();
  const { logoUrl, settings } = useSettings();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [successUser, setSuccessUser] = useState<UserType | null>(null);
  const [isEntering, setIsEntering] = useState(false);

  if (!isOpen) return null;

  // Dynamic texts from Settings
  const loginBadge = settings.login_badge_fa || 'تایپوگرافی هوشمند';
  const loginTitle = settings.login_title_fa || 'خط نگار';
  const loginSubtitle = settings.login_subtitle_fa || 'جهت تولید پرامپت و دسترسی به امکانات وارد شوید';
  const usernameLabel = settings.login_username_label_fa || 'نام کاربری:';
  const usernamePlaceholder = settings.login_username_placeholder_fa || 'نام کاربری شما';
  const passwordLabel = settings.login_password_label_fa || 'رمز عبور:';
  const passwordPlaceholder = settings.login_password_placeholder_fa || 'رمز عبور شما';
  const loginButtonText = settings.login_button_fa || 'ورود به حساب کاربری';
  const loginNotice = settings.login_notice_fa || 'ایجاد و فعال‌سازی حساب‌های کاربری صرفاً توسط مدیریت سامانه انجام می‌پذیرد.';

  const welcomeBadge = settings.welcome_badge_fa || 'ورود با موفقیت انجام شد';
  const welcomeTitleTemplate = settings.welcome_title_fa || 'خوش آمدید، {username}';
  const welcomeLoadingText = settings.welcome_loading_text_fa || 'در حال به‌روزرسانی نشست کاربری...';

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
    if (!username.trim() || !password) {
      setError('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      triggerErrorShake();
      return;
    }

    setError(null);
    setLoading(true);

    const result = await login(username.trim(), password, true);
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
      setError(result.error || 'نام کاربری یا رمز عبور اشتباه است.');
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
        {/* Animated Big Rejection Cross Indicator Overlay on Wrong Password (1 Second Duration) */}
        {isShaking && (
          <div className="absolute inset-0 z-30 bg-red-950/25 flex flex-col items-center justify-center pointer-events-none animate-error-cross">
            <div className="w-18 h-18 rounded-full bg-red-500/95 text-white flex items-center justify-center shadow-2xl shadow-red-500/50">
              <XCircle className="w-12 h-12 stroke-[2.5]" />
            </div>
            <span className="mt-2.5 text-xs font-black text-white px-3 py-1 rounded-xl bg-red-600/95 shadow-md">
              اطلاعات ورود نادرست است!
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
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-[var(--border-color)] mx-auto mb-3 bg-[#361D32]">
                  <img
                    src={logoUrl}
                    alt={loginTitle}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <h2 className="text-xl font-black text-[var(--text-primary)]">{loginTitle}</h2>
                  {loginBadge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#F55951]/10 text-[#F55951]">
                      {loginBadge}
                    </span>
                  )}
                </div>
                {loginSubtitle && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {loginSubtitle}
                  </p>
                )}
              </div>

              {/* Info on Provisioning Notice */}
              {loginNotice && (
                <div className="mb-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {loginNotice}
                  </span>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 shadow-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">{usernameLabel}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder={usernamePlaceholder}
                      disabled={loading}
                      autoComplete="username"
                      spellCheck={false}
                      className={`w-full pl-4 pr-10 py-3 rounded-xl border bg-[var(--bg-card)] text-sm font-bold text-[var(--text-primary)] focus:outline-hidden transition select-text ${
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
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">{passwordLabel}</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={passwordPlaceholder}
                      disabled={loading}
                      dir="ltr"
                      autoComplete="current-password"
                      spellCheck={false}
                      className={`w-full pl-4 pr-10 py-3 rounded-xl border bg-[var(--bg-card)] text-sm font-bold text-[var(--text-primary)] focus:outline-hidden transition select-text ${
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
                  disabled={loading}
                  className={`w-full py-3.5 px-4 rounded-xl bg-[#F55951] hover:bg-[#E04840] text-white font-bold text-sm shadow-md shadow-[#F55951]/25 transition-all cursor-pointer flex items-center justify-center gap-2 btn-interactive ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? <span className="animate-spin">⏳</span> : <KeyRound className="w-4 h-4" />}
                  <span>{loading ? 'در حال بررسی...' : loginButtonText}</span>
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

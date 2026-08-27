import React from 'react';
import {
  Sparkles,
  Shield,
  Sun,
  Moon,
  LogOut,
  LogIn,
  User,
  LayoutDashboard,
  Wand2,
  MessageSquarePlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSettings } from '../context/SettingsContext.js';

interface HeaderProps {
  currentView: 'generator' | 'admin';
  onChangeView: (view: 'generator' | 'admin') => void;
  onOpenLogin: () => void;
  onOpenFeedback?: () => void;
}

export function Header({ currentView, onChangeView, onOpenLogin, onOpenFeedback }: HeaderProps) {
  const { user, theme, toggleTheme, logout } = useAuth();
  const { logoUrl, settings } = useSettings();

  const siteTitle = settings.site_title_fa || 'خط نگار';
  const siteBadge = settings.site_badge_fa || 'تایپوگرافی هوشمند';
  const siteSubtitle = settings.site_subtitle_fa || 'مهندسی پرامپت خط و خوشنویسی';
  const generatorBtnText = settings.header_generator_btn_fa || 'تولید پرامپت';
  const adminBtnText = settings.header_admin_btn_fa || 'پنل مدیریت';

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border-color)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChangeView('generator')}
            className="flex items-center gap-2.5 text-right transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform border border-[var(--border-color)] bg-[#361D32] shrink-0">
              <img
                src={logoUrl}
                alt={siteTitle}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base md:text-lg font-black text-[var(--text-primary)] block leading-tight tracking-tight">
                  {siteTitle}
                </span>
                {siteBadge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#F55951]/10 text-[#F55951] border border-[#F55951]/20">
                    {siteBadge}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">{siteSubtitle}</span>
            </div>
          </button>
        </div>

        {/* Center / Navigation Tabs */}
        <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => onChangeView('generator')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentView === 'generator'
                ? 'bg-[#F55951] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{generatorBtnText}</span>
          </button>

          {user && user.role === 'admin' && (
            <button
              type="button"
              onClick={() => onChangeView('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-[#F55951] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-300" />
              <span>{adminBtnText}</span>
            </button>
          )}
        </div>

        {/* Right Tools & User Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Admin toggle button */}
          {user && user.role === 'admin' && (
            <button
              type="button"
              onClick={() => onChangeView(currentView === 'generator' ? 'admin' : 'generator')}
              className="sm:hidden p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[#F55951] transition cursor-pointer"
              title={currentView === 'generator' ? 'ورود به پنل مدیریت' : 'بازگشت به مولد'}
            >
              {currentView === 'generator' ? <Shield className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
            </button>
          )}

          {/* Feedback & Bug Report Button */}
          {onOpenFeedback && (
            <button
              type="button"
              id="btn-header-feedback"
              onClick={onOpenFeedback}
              className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#F55951] text-[var(--text-secondary)] hover:text-[#F55951] text-xs font-bold transition cursor-pointer"
              title={settings.feedback_title_fa || 'اعلام گزارش و پیشنهادات'}
            >
              <MessageSquarePlus className="w-4 h-4 text-[#F55951]" />
              <span className="hidden sm:inline">{settings.feedback_title_fa || 'گزارش و پیشنهاد'}</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[#F55951] transition cursor-pointer"
            title={theme === 'dark' ? 'تغییر به تم روز' : 'تغییر به تم شب'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#543C52]" />}
          </button>

          {/* User Status / Login */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex flex-col text-left pl-2">
                <span className="text-xs font-bold text-[var(--text-primary)]">{user.username}</span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {user.role === 'admin' ? 'مدیر ارشد سامانه' : 'کاربر ویژه'}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-red-400 text-xs font-bold text-red-500 transition cursor-pointer"
                title="خروج از حساب"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F55951] hover:bg-[#E04840] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>ورود به سامانه</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

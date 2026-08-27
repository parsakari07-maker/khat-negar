import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LogoProvider } from './context/LogoContext.js';
import { SettingsProvider, useSettings } from './context/SettingsContext.js';
import { Header } from './components/Header.js';
import { GeneratorView } from './components/GeneratorView.js';
import { AdminLayout } from './components/AdminPanel/AdminLayout.js';
import { LoginModal } from './components/LoginModal.js';
import { AuthScreen } from './components/AuthScreen.js';
import { BackgroundArtwork } from './components/BackgroundArtwork.js';
import { FeedbackModal } from './components/FeedbackModal.js';
import { Sparkles } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  const [currentView, setCurrentView] = useState<'generator' | 'admin'>('generator');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Automatically redirect based on user role when user changes
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('generator');
      }
    }
  }, [user?.id, user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#361D32] to-[#F55951] text-white flex items-center justify-center shadow-lg animate-bounce">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-[var(--text-muted)] animate-pulse">
            در حال بارگذاری سامانه تایپوگرافی...
          </span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, display the AuthScreen as the initial screen
  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="auth-screen-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          <AuthScreen />
        </motion.div>
      </AnimatePresence>
    );
  }

  const handleNavigateView = (view: 'generator' | 'admin') => {
    if (view === 'admin' && user?.role !== 'admin') {
      return;
    }
    setCurrentView(view);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="authenticated-app-canvas"
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors relative"
      >
        {/* Persian Calligraphy & Islamic Geometry Ambient Background Artwork */}
        <BackgroundArtwork variant={currentView === 'admin' ? 'admin' : 'full'} />

        {/* Top Header */}
        <Header
          currentView={currentView}
          onChangeView={handleNavigateView}
          onOpenLogin={() => setLoginModalOpen(true)}
          onOpenFeedback={() => setFeedbackModalOpen(true)}
        />

        {/* Main View Area with transition */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            {currentView === 'generator' ? (
              <motion.div
                key="view-generator"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <GeneratorView
                  isLoggedIn={!!user}
                  onOpenLogin={() => setLoginModalOpen(true)}
                />
              </motion.div>
            ) : (
              user.role === 'admin' && (
                <motion.div
                  key="view-admin"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <AdminLayout onBackToGenerator={() => setCurrentView('generator')} />
                </motion.div>
              )
            )}
          </AnimatePresence>
        </main>

        {/* Persian Footer */}
        <footer className="mt-auto py-6 border-t border-[var(--border-color)] bg-[var(--bg-surface)] text-center text-xs text-[var(--text-secondary)]">
          <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#F55951] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                ف
              </div>
              <span className="font-extrabold text-[var(--text-primary)]">
                {settings?.footer_title_fa || 'سامانه تخصصی مهندسی پرامپت تایپوگرافی فارسی'}
              </span>
            </div>
            
            <p className="text-[11px] text-[var(--text-muted)]">
              {settings?.footer_subtitle_fa || 'تولید هوشمند دستورات خوشنویسی اصیل سنتی و مدرن با حفظ ۱۰۰٪ دقت کاراکترها'}
            </p>
          </div>
        </footer>

        {/* Feedback & Bug Report Modal */}
        <FeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
        />

        {/* Login Modal for session refresh */}
        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
        />
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <LogoProvider>
          <AppContent />
        </LogoProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

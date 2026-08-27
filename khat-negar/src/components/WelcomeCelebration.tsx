import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Sparkles, ShieldCheck, Crown, Feather, Stars } from 'lucide-react';
import type { User as UserType } from '../types.js';

interface WelcomeCelebrationProps {
  key?: React.Key;
  user: UserType;
  welcomeBadge?: string;
  welcomeTitle: string;
  subtitleAdmin?: string;
  subtitleUser?: string;
  loadingText?: string;
  compact?: boolean;
}

// Pre-defined deterministic confetti particle configs
const CONFETTI_PARTICLES = [
  { id: 1, x: -65, y: -50, color: '#F55951', size: 7, delay: 0.05, shape: 'circle' },
  { id: 2, x: 70, y: -45, color: '#10B981', size: 8, delay: 0.1, shape: 'diamond' },
  { id: 3, x: -85, y: -10, color: '#FBBF24', size: 6, delay: 0.15, shape: 'star' },
  { id: 4, x: 90, y: -15, color: '#6366F1', size: 7, delay: 0.08, shape: 'circle' },
  { id: 5, x: -45, y: -75, color: '#EC4899', size: 6, delay: 0.12, shape: 'diamond' },
  { id: 6, x: 50, y: -70, color: '#F55951', size: 8, delay: 0.18, shape: 'star' },
  { id: 7, x: -95, y: 35, color: '#10B981', size: 5, delay: 0.2, shape: 'circle' },
  { id: 8, x: 95, y: 30, color: '#FBBF24', size: 6, delay: 0.14, shape: 'diamond' },
  { id: 9, x: -30, y: -85, color: '#38BDF8', size: 7, delay: 0.16, shape: 'circle' },
  { id: 10, x: 35, y: -85, color: '#A855F7', size: 6, delay: 0.22, shape: 'star' },
  { id: 11, x: -75, y: -65, color: '#F55951', size: 5, delay: 0.25, shape: 'circle' },
  { id: 12, x: 75, y: -60, color: '#34D399', size: 7, delay: 0.28, shape: 'diamond' },
];

export function WelcomeCelebration({
  user,
  welcomeBadge = 'ورود با موفقیت انجام شد',
  welcomeTitle,
  subtitleAdmin = 'دسترسی: مدیریت ارشد سامانه',
  subtitleUser = 'دسترسی: کاربری سامانه مهندسی پرامپت',
  loadingText = 'در حال آماده‌سازی و انتقال به محیط کاربری...',
  compact = false
}: WelcomeCelebrationProps) {
  const isAdmin = user.role === 'admin';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`relative w-full text-center flex flex-col items-center justify-center ${
        compact ? 'py-4 space-y-3.5' : 'py-7 space-y-5'
      }`}
    >
      {/* Background Radiant Aura */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.35, 0.6, 0.35],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="w-48 h-48 rounded-full bg-gradient-to-tr from-emerald-500/25 via-[#F55951]/20 to-amber-400/25 blur-3xl"
        />
      </div>

      {/* Floating Confetti & Sparkles */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {CONFETTI_PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
            animate={{
              x: p.x,
              y: [0, p.y - 10, p.y],
              scale: [0, 1.2, 1],
              opacity: [0, 1, 0.85],
              rotate: [0, p.x > 0 ? 180 : -180]
            }}
            transition={{
              duration: 0.8,
              delay: p.delay,
              ease: [0.16, 1, 0.3, 1]
            }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'diamond' ? '2px' : '4px',
              transform: p.shape === 'diamond' ? 'rotate(45deg)' : undefined,
              boxShadow: `0 0 8px ${p.color}80`
            }}
          />
        ))}
      </div>

      {/* Hero Badge Icon with Multiple Pulsing Rings */}
      <div className="relative flex items-center justify-center my-1">
        {/* Outer Wave Rings */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{
            scale: [1, 1.6, 1.8],
            opacity: [0.7, 0.2, 0]
          }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          className={`absolute rounded-full border-2 ${
            isAdmin ? 'border-amber-400/40' : 'border-emerald-500/40'
          } ${compact ? 'w-24 h-24' : 'w-32 h-32'}`}
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [1, 1.35, 1.5],
            opacity: [0.6, 0.25, 0]
          }}
          transition={{ duration: 1.6, repeat: Infinity, delay: 0.3, ease: "easeOut" }}
          className={`absolute rounded-full ${
            isAdmin ? 'bg-amber-400/15' : 'bg-emerald-500/15'
          } ${compact ? 'w-20 h-20' : 'w-26 h-26'}`}
        />

        {/* Central Glowing Crest */}
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 340,
            damping: 18,
            mass: 0.8
          }}
          className={`relative rounded-3xl flex items-center justify-center text-white shadow-2xl z-10 ${
            isAdmin
              ? 'bg-gradient-to-tr from-amber-600 via-[#F55951] to-amber-400 shadow-amber-500/40 border border-amber-300/40'
              : 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 shadow-emerald-500/40 border border-emerald-300/30'
          } ${compact ? 'w-16 h-16 rounded-2xl' : 'w-20 h-20 rounded-3xl'}`}
        >
          {isAdmin ? (
            <Crown className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} drop-shadow-md stroke-[2.2]`} />
          ) : (
            <CheckCircle2 className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} drop-shadow-md stroke-[2.4]`} />
          )}

          {/* Sparkle Badge Corner Indicator */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`absolute -top-1.5 -right-1.5 rounded-full p-1 shadow-md text-white ${
              isAdmin ? 'bg-amber-400 text-amber-950' : 'bg-emerald-400 text-emerald-950'
            }`}
          >
            <Sparkles className="w-3 h-3" />
          </motion.div>
        </motion.div>
      </div>

      {/* Congratulatory Text & Status Pill */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.35 }}
        className="space-y-1.5 px-2 relative z-10"
      >
        {welcomeBadge && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.22, duration: 0.3 }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-0.5 shadow-2xs ${
              isAdmin
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}
          >
            {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Stars className="w-3.5 h-3.5" />}
            <span>{welcomeBadge}</span>
          </motion.div>
        )}

        <h2 className={`font-black text-[var(--text-primary)] tracking-tight ${
          compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'
        }`}>
          {welcomeTitle}
        </h2>

        <p className="text-xs text-[var(--text-secondary)] font-medium flex items-center justify-center gap-1">
          {isAdmin ? (
            <span className="text-[#F55951] font-bold flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>{subtitleAdmin}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[var(--text-secondary)]">
              <Feather className="w-3.5 h-3.5 text-[#F55951]" />
              <span>{subtitleUser}</span>
            </span>
          )}
        </p>
      </motion.div>

      {/* Modern Progress Line with Floating Shimmer Head */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className={`w-full max-w-xs space-y-2 relative z-10 ${compact ? 'pt-1' : 'pt-2'}`}
      >
        <div className="w-full h-2 rounded-full bg-[var(--bg-card)] overflow-hidden border border-[var(--border-color)] p-0.5 shadow-inner">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.4, ease: [0.25, 1, 0.5, 1] }}
            className={`h-full rounded-full relative overflow-hidden ${
              isAdmin
                ? 'bg-gradient-to-r from-amber-500 via-[#F55951] to-amber-300'
                : 'bg-gradient-to-r from-[#543C52] via-[#F55951] to-emerald-400'
            }`}
          >
            {/* Light Shimmer Sweep across the progress bar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
            />
          </motion.div>
        </div>

        <span className="text-[11px] text-[var(--text-muted)] font-semibold block animate-pulse">
          {loadingText}
        </span>
      </motion.div>
    </motion.div>
  );
}

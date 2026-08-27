import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, RefreshCw, Check, Sparkles, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiFetch } from '../utils/api.js';

interface PromptResultCardProps {
  prompt: string;
  onGenerateAgain: () => void;
  isGeneratingAgain: boolean;
}

export function PromptResultCard({
  prompt,
  onGenerateAgain,
  isGeneratingAgain
}: PromptResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);

      // Subtle celebratory confetti
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.8 },
        colors: ['#F55951', '#EDD2CB', '#543C52']
      });

      apiFetch('/api/prompts/copy-event', { method: 'POST' }).catch(() => {});
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = prompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const wordCount = prompt.trim().split(/\s+/).length;
  const charCount = prompt.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full mt-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-xl overflow-hidden"
    >
      {/* Sleek Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[var(--bg-card)] border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#F55951]/10 text-[#F55951] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-[var(--text-primary)]">
            پرامپت نهایی تولید شده
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-[11px] font-mono text-[var(--text-muted)]">
          <span>{wordCount} کلمه</span>
          <span>•</span>
          <span>{charCount} حرف</span>
        </div>
      </div>

      {/* Main Prompt Content Slate (Compact, fewer lines, easy to scroll and copy) */}
      <div className="p-4 sm:p-5 space-y-3.5">
        <div className="relative group rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 sm:p-4 transition-colors hover:border-[#F55951]/40">
          <div className="font-mono text-xs sm:text-[13px] leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap max-h-28 sm:max-h-32 overflow-y-auto dir-ltr select-all scrollbar-thin scrollbar-thumb-[var(--border-color)] scrollbar-track-transparent pr-1">
            {prompt}
          </div>
        </div>

        {/* Copy Status Notification */}
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 overflow-hidden"
            >
              <Check className="w-4 h-4 text-emerald-500" />
              <span>پرامپت با موفقیت کپی شد.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[#F55951] hover:bg-[#E04840] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#F55951]/20 hover:shadow-lg transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کپی شد' : 'کپی پرامپت'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={isGeneratingAgain}
            onClick={onGenerateAgain}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              isGeneratingAgain ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 text-[#F55951] ${isGeneratingAgain ? 'animate-spin' : ''}`} />
            <span>تولید نگارش جدید</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Feather, Wand2 } from 'lucide-react';

interface GenerationAnimationProps {
  isGenerateAgain?: boolean;
  onComplete: () => void;
}

const STEPS = [
  'تحلیل هندسه و فرم حروف فارسی...',
  'محاسبه زاویه قلم و تناسبات دور و سطح...',
  'تنظیم متریال، نورپردازی و ترکیب‌بندی...',
  'تثبیت املا و نگارش دقیق خوشنویسی...'
];

export function GenerationAnimation({ isGenerateAgain, onComplete }: GenerationAnimationProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Step progression
    const stepInterval = setInterval(() => {
      setStepIndex(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 280);

    // Smooth progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 4;
      });
    }, 45);

    // Complete timer
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1350);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="w-full my-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#361D32] via-[#2A1527] to-[#1E0F1C] border border-[#F55951]/40 shadow-2xl relative overflow-hidden text-white"
    >
      {/* Dynamic Animated Ambient Glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-[#F55951]/25 via-[#EDD2CB]/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" />
      
      {/* Subtle Calligraphic Grid Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F55951_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-5">
        {/* Animated Central Icon with Orbiting Ring */}
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'linear' }}
            className="absolute -inset-3 rounded-full border border-dashed border-[#F55951]/60"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#F55951] to-[#FF8A80] p-0.5 shadow-lg shadow-[#F55951]/30 flex items-center justify-center"
          >
            <div className="w-full h-full rounded-[14px] bg-[#361D32] flex items-center justify-center text-[#F55951]">
              {isGenerateAgain ? (
                <Wand2 className="w-7 h-7 animate-pulse text-[#FF8A80]" />
              ) : (
                <Feather className="w-7 h-7 text-[#FF8A80]" />
              )}
            </div>
          </motion.div>
        </div>

        {/* Dynamic Status Text */}
        <div className="min-h-[30px] flex items-center justify-center">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm sm:text-base font-bold text-[#EDD2CB]"
          >
            {STEPS[stepIndex]}
          </motion.p>
        </div>

        {/* Fluid Progress Bar */}
        <div className="w-full max-w-sm space-y-2">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden p-0.5">
            <motion.div
              className="h-full bg-gradient-to-r from-[#F55951] via-[#FF8A80] to-[#EDD2CB] rounded-full shadow-sm shadow-[#F55951]"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/50 font-medium">
            <span>در حال نگارش هوشمند</span>
            <span className="font-mono">{progress}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

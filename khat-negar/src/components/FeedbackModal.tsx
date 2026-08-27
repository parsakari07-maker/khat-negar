import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquarePlus,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MessageSquare,
  X,
  RefreshCw
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext.js';
import { apiFetch } from '../utils/api.js';

const MAX_TITLE_LEN = 120;
const MAX_DESC_LEN = 1000;

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { settings } = useSettings();
  const [type, setType] = useState<'suggestion' | 'report'>('suggestion');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('لطفاً عنوان پیام را وارد کنید.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('لطفاً متن توضیحات را وارد کنید.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const { ok, data } = await apiFetch<{ success: boolean; error?: string; message?: string }>('/api/feedback/submit', {
        method: 'POST',
        body: JSON.stringify({
          type,
          title: title.trim().slice(0, MAX_TITLE_LEN),
          description: description.trim().slice(0, MAX_DESC_LEN)
        })
      });

      if (ok && data.success) {
        setSuccess(true);
        setTitle('');
        setDescription('');
      } else {
        setErrorMsg(data?.error || 'خطا در ثبت پیام. لطفاً دوباره تلاش کنید.');
      }
    } catch (err) {
      setErrorMsg('خطا در برقراری ارتباط با سرور.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="feedback-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={handleClose}
        >
          <motion.div
            key="feedback-modal-dialog"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              duration: 0.24,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl p-6 sm:p-7 text-right my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Background Decorative Accents */}
            <div className="absolute -top-16 -left-16 w-36 h-36 rounded-full bg-[#F55951]/8 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-36 h-36 rounded-full bg-[#543C52]/8 blur-2xl pointer-events-none" />

            {/* Top Close Button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="بستن پنجره"
              className="absolute top-5 left-5 z-10 w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[#F55951] flex items-center justify-center text-xs font-bold transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Section Header */}
            <div className="flex flex-col items-start pr-1 mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EDD2CB]/60 text-[#361D32] dark:bg-[#3D2F3C] dark:text-[#EDD2CB] mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#F55951]" />
                <span>{settings.feedback_badge_fa || 'صدای شما، پیشرفت ما'}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">
                {settings.feedback_title_fa || 'اعلام گزارش و پیشنهادات'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md leading-relaxed">
                {settings.feedback_subtitle_fa || 'دیدگاه‌ها، پیشنهادات بهبود، یا گزارش خطاهای احتمالی خود را برای ارتقای سامانه با ما در میان بگذارید.'}
              </p>
            </div>

            {/* Success State View */}
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4 my-2"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                  className="w-14 h-14 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-8 h-8" />
                </motion.div>

                <div>
                  <h3 className="text-base font-black text-emerald-800 dark:text-emerald-200">
                    پیام شما با موفقیت ثبت شد!
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1.5 leading-relaxed">
                    {settings.feedback_success_msg_fa || 'دیدگاه و گزارش شما با موفقیت ثبت شد و به زودی توسط مدیران سامانه بررسی خواهد شد. سپاس از همراهی شما!'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccess(false);
                      setErrorMsg(null);
                    }}
                    className="btn-interactive inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>ارسال پیام جدید</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                  >
                    بستن
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Main Feedback Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Alert */}
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2 text-xs font-bold"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                {/* Type Selector (Suggestion vs Report) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-color)]">
                  <label className="text-xs font-bold text-[var(--text-primary)]">
                    {settings.feedback_type_label_fa || 'نوع پیام:'}
                  </label>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      id="btn-feedback-type-suggestion"
                      onClick={() => setType('suggestion')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        type === 'suggestion'
                          ? 'bg-[#F55951] text-white shadow-xs ring-2 ring-[#F55951]/30'
                          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>پیشنهاد بهبود</span>
                    </button>

                    <button
                      type="button"
                      id="btn-feedback-type-report"
                      onClick={() => setType('report')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        type === 'report'
                          ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/30'
                          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>گزارش باگ یا خطا</span>
                    </button>
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="feedback-modal-title" className="text-xs font-semibold text-[var(--text-primary)]">
                      {settings.feedback_input_title_label_fa || 'عنوان موضوع'} <span className="text-[#F55951]">*</span>
                    </label>
                    <span className={`text-[10px] ${title.length > MAX_TITLE_LEN * 0.9 ? 'text-amber-500 font-bold' : 'text-[var(--text-muted)]'}`}>
                      {title.length} / {MAX_TITLE_LEN}
                    </span>
                  </div>
                  <input
                    id="feedback-modal-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LEN))}
                    placeholder={settings.feedback_input_title_placeholder_fa || 'مثال: پیشنهاد افزودن فرم هندسی شمسه، گزارش عدم تطابق رنگ و...'}
                    className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[#F55951] focus:ring-2 focus:ring-[#F55951]/20 transition-all font-medium"
                    required
                  />
                </div>

                {/* Description Textarea */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="feedback-modal-desc" className="text-xs font-semibold text-[var(--text-primary)]">
                      {settings.feedback_input_desc_label_fa || 'متن و توضیحات تکمیلی'} <span className="text-[#F55951]">*</span>
                    </label>
                    <span className={`text-[10px] ${description.length > MAX_DESC_LEN * 0.9 ? 'text-amber-500 font-bold' : 'text-[var(--text-muted)]'}`}>
                      {description.length} / {MAX_DESC_LEN}
                    </span>
                  </div>
                  <textarea
                    id="feedback-modal-desc"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC_LEN))}
                    placeholder={settings.feedback_input_desc_placeholder_fa || 'نکات و جزئیات مورد نظر خود را با دقت بنویسید...'}
                    className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[#F55951] focus:ring-2 focus:ring-[#F55951]/20 transition-all resize-none font-medium leading-relaxed"
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                  >
                    انصراف
                  </button>

                  <motion.button
                    type="submit"
                    id="btn-submit-modal-feedback"
                    disabled={submitting || !title.trim() || !description.trim()}
                    whileHover={{ scale: submitting ? 1 : 1.02 }}
                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                    className="btn-interactive flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F55951] hover:bg-[#E04840] text-white font-black text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>در حال ارسال...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{settings.feedback_submit_btn_fa || 'ارسال پیام'}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

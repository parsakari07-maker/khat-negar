import React, { useState } from 'react';
import {
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Database,
  ShieldAlert,
  Clock,
  Activity,
  MessageSquare,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';

interface AdminDataCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTarget?: 'all' | 'login_logs' | 'audit_logs' | 'security_events' | 'generation_logs' | 'feedback_reports';
  onSuccess?: () => void;
}

export function AdminDataCleanupModal({
  isOpen,
  onClose,
  defaultTarget = 'all',
  onSuccess
}: AdminDataCleanupModalProps) {
  const [target, setTarget] = useState<'all' | 'login_logs' | 'audit_logs' | 'security_events' | 'generation_logs' | 'feedback_reports'>(defaultTarget);
  const [days, setDays] = useState<number>(30); // Default to 1 month (30 days)
  const [customDays, setCustomDays] = useState<string>('30');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmStep, setConfirmStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    totalDeleted: number;
    deletedCounts: Record<string, number>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetLabels = {
    all: 'تمامی بخش‌ها و لاگ‌های دیتابیس (پاکسازی جامع)',
    login_logs: 'لاگ‌های نشست‌ها و ورودهای کاربران',
    audit_logs: 'لاگ‌های بازرسی و تغییرات مدیران',
    security_events: 'رویدادها و هشدارهای امنیتی',
    generation_logs: 'تاریخچه و لاگ‌های تولید پرامپت',
    feedback_reports: 'گزارش‌ها و پیشنهادات کاربران'
  };

  const handleExecuteCleanup = async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedDays = days === -1 ? Math.max(0, parseInt(customDays) || 0) : days;
      const { ok, data } = await apiFetch<{
        success: boolean;
        message?: string;
        error?: string;
        result?: {
          totalDeleted: number;
          deletedCounts: Record<string, number>;
        };
      }>('/api/admin/maintenance/cleanup', {
        method: 'POST',
        body: JSON.stringify({
          target,
          olderThanDays: selectedDays,
          statusFilter
        })
      });

      if (ok && data.success && data.result) {
        setResult(data.result);
        setConfirmStep(false);
        if (onSuccess) onSuccess();
      } else {
        setError(data?.error || 'خطا در انجام عملیات پاکسازی.');
      }
    } catch (err: any) {
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <span>پاکسازی و بهینه‌سازی داده‌های دیتابیس</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                حذف ایمن لاگ‌ها و رکوردهای قدیمی برای خلوت‌سازی دیتابیس و افزایش سرعت سامانه
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره"
            className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Result View */}
        {result ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-emerald-700 dark:text-emerald-300">
                عملیات پاکسازی با موفقیت انجام شد!
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                مجموعاً <span className="font-extrabold text-sm">{result.totalDeleted}</span> رکورد قدیمی با موفقیت از دیتابیس حذف گردید.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-right text-xs pt-2">
              <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <span className="text-[11px] text-[var(--text-muted)] block">لاگ ورود:</span>
                <span className="font-bold text-[var(--text-primary)]">{result.deletedCounts.login_logs || 0} مورد</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <span className="text-[11px] text-[var(--text-muted)] block">لاگ بازرسی:</span>
                <span className="font-bold text-[var(--text-primary)]">{result.deletedCounts.audit_logs || 0} مورد</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <span className="text-[11px] text-[var(--text-muted)] block">رویداد امنیتی:</span>
                <span className="font-bold text-[var(--text-primary)]">{result.deletedCounts.security_events || 0} مورد</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <span className="text-[11px] text-[var(--text-muted)] block">تولید پرامپت:</span>
                <span className="font-bold text-[var(--text-primary)]">{result.deletedCounts.generation_logs || 0} مورد</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] col-span-2 sm:col-span-1">
                <span className="text-[11px] text-[var(--text-muted)] block">پیشنهادات/گزارشات:</span>
                <span className="font-bold text-[var(--text-primary)]">{result.deletedCounts.feedback_reports || 0} مورد</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              متوجه شدم و بستن
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Target Selector */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                بخش هدف جهت پاکسازی اطلاعات:
              </label>
              <select
                value={target}
                onChange={e => setTarget(e.target.value as any)}
                aria-label="بخش هدف جهت پاکسازی اطلاعات"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
              >
                <option value="all">🧹 تمامی بخش‌ها و لاگ‌ها (پاکسازی کلی)</option>
                <option value="login_logs">🔐 لاگ‌های ورود و نشست‌ها (Login Logs)</option>
                <option value="audit_logs">📝 لاگ‌های بازرسی و تغییرات مدیران (Audit Logs)</option>
                <option value="security_events">🛡️ رویدادها و هشدارهای امنیتی (Security Events)</option>
                <option value="generation_logs">✨ تاریخچه و تله‌متری ساخت پرامپت‌ها</option>
                <option value="feedback_reports">📬 گزارش‌ها و پیشنهادات کاربران</option>
              </select>
            </div>

            {/* Timeframe Presets */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                بازه زمانی و قدمت رکوردها برای حذف:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { value: 7, label: 'قدیمی‌تر از ۷ روز' },
                  { value: 14, label: 'قدیمی‌تر از ۱۴ روز' },
                  { value: 30, label: 'قدیمی‌تر از ۱ ماه (۳۰ روز)' },
                  { value: 60, label: 'قدیمی‌تر از ۲ ماه (۶۰ روز)' },
                  { value: 90, label: 'قدیمی‌تر از ۳ ماه (۹۰ روز)' },
                  { value: 0, label: 'حذف تمام لاگ‌ها (همه زمان‌ها)' }
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setDays(item.value);
                    }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-center transition cursor-pointer ${
                      days === item.value
                        ? 'bg-[#F55951] text-white border-[#F55951] shadow-xs'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[#F55951]/60'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target-specific status filter if feedback or security */}
            {(target === 'feedback_reports' || target === 'security_events') && (
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  فیلتر وضعیت رکوردهای حذفی:
                </label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  aria-label="فیلتر وضعیت رکوردهای حذفی"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                >
                  <option value="all">حذف همه وضعیت‌ها</option>
                  {target === 'feedback_reports' ? (
                    <>
                      <option value="resolved">فقط موارد حل شده / اقدام شده</option>
                      <option value="read">فقط موارد خوانده شده</option>
                    </>
                  ) : (
                    <>
                      <option value="reviewed">فقط رویدادهای بررسی شده</option>
                      <option value="ignored">فقط رویدادهای نادیده گرفته شده</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Warning Box */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">هشدار مهم بازگشت‌ناپذیری:</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  رکوردهای قدیمی پس از حذف از دیتابیس قابل بازیابی نخواهند بود. تنظیمات و داده‌های هویتی کاربران و پرامپت‌های مادر دست‌نخورده باقی می‌مانند.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {confirmStep ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                <p className="text-xs font-black text-rose-600 dark:text-rose-400 text-center">
                  آیا از پاکسازی رکوردهای {targetLabels[target]} مطمئن هستید؟
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleExecuteCleanup}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>تایید قطعی و پاکسازی</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setConfirmStep(false)}
                    className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmStep(true)}
                  className="btn-interactive inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>مرحله بعد: تایید پاکسازی</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

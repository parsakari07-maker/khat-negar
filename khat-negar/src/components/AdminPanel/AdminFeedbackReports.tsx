import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Shield,
  Eye,
  Check,
  Database,
  Sparkles,
  AlertTriangle,
  X
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import type { FeedbackReport } from '../../types.js';
import { AdminDataCleanupModal } from './AdminDataCleanupModal.js';

export function AdminFeedbackReports() {
  const [feedbacks, setFeedbacks] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackReport | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<FeedbackReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filterType !== 'all') queryParams.append('type', filterType);
      if (filterStatus !== 'all') queryParams.append('status', filterStatus);
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());

      const url = `/api/admin/feedback?${queryParams.toString()}`;
      const { ok, data } = await apiFetch<{ success: boolean; feedbacks: FeedbackReport[] }>(url);
      if (ok && data.success) {
        setFeedbacks(data.feedbacks || []);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [filterType, filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeedbacks();
  };

  const handleUpdateStatus = async (id: string, status: 'unread' | 'read' | 'resolved') => {
    setActionLoading(true);
    try {
      const { ok, data } = await apiFetch<{ success: boolean; feedback: FeedbackReport; message?: string }>(
        `/api/admin/feedback/${id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status })
        }
      );
      if (ok && data.success) {
        setFeedbacks(prev =>
          prev.map(f => (f.id === id ? { ...f, status } : f))
        );
        if (selectedFeedback && selectedFeedback.id === id) {
          setSelectedFeedback(prev => (prev ? { ...prev, status } : null));
        }
        showToast(data.message || 'وضعیت پیام با موفقیت تغییر کرد.');
      } else {
        showToast('خطا در به‌روزرسانی وضعیت پیام');
      }
    } catch (err) {
      showToast('خطا در به‌روزرسانی وضعیت پیام');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!feedbackToDelete) return;
    const id = feedbackToDelete.id;
    setActionLoading(true);
    try {
      const { ok, data } = await apiFetch<{ success: boolean; message?: string }>(`/api/admin/feedback/${id}`, {
        method: 'DELETE'
      });
      if (ok && data.success) {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
        if (selectedFeedback && selectedFeedback.id === id) {
          setSelectedFeedback(null);
        }
        setFeedbackToDelete(null);
        showToast(data.message || 'پیام با موفقیت از دیتابیس حذف گردید.');
      } else {
        showToast('خطا در حذف پیام از سرور');
      }
    } catch (err) {
      showToast('خطا در برقراری ارتباط با سرور جهت حذف پیام');
    } finally {
      setActionLoading(false);
    }
  };

  const unreadCount = feedbacks.filter(f => f.status === 'unread').length;
  const suggestionsCount = feedbacks.filter(f => f.type === 'suggestion').length;
  const reportsCount = feedbacks.filter(f => f.type === 'report').length;

  return (
    <div className="space-y-6">
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 px-4 py-3 rounded-2xl bg-[#361D32] text-white border border-[#F55951] shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[var(--text-primary)]">
              صندوق گزارش‌ها و پیشنهادات کاربران
            </h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F55951] text-white">
                {unreadCount} جدید
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            مشاهده، پیگیری، تغییر وضعیت و پاکسازی بازخوردهای ثبت شده کاربران
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Data Cleanup Button */}
          <button
            type="button"
            onClick={() => setCleanupModalOpen(true)}
            className="btn-interactive inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>پاکسازی گزارش‌های قدیمی</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchFeedbacks}
            disabled={loading}
            className="btn-interactive inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] hover:border-[#F55951] transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تازه‌سازی</span>
          </button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-[11px] text-[var(--text-muted)] font-medium">کل پیام‌ها</span>
          <div className="text-xl font-black text-[var(--text-primary)] mt-1">{feedbacks.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-[11px] text-rose-500 font-medium">خوانده‌نشده</span>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{unreadCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-[11px] text-blue-500 font-medium">پیشنهادات</span>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{suggestionsCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-[11px] text-amber-500 font-medium">گزارش خطاها</span>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{reportsCount}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان، متن یا کاربر..."
            className="w-full pl-3 pr-9 py-1.5 rounded-xl text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#F55951]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            aria-label="فیلتر بر اساس نوع پیام"
            className="px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[#F55951]"
          >
            <option value="all">همه انواع (پیشنهاد و گزارش)</option>
            <option value="suggestion">فقط پیشنهادات</option>
            <option value="report">فقط گزارش‌های خطا</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            aria-label="فیلتر بر اساس وضعیت بررسی"
            className="px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[#F55951]"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="unread">خوانده نشده</option>
            <option value="read">بررسی شده (خوانده شده)</option>
            <option value="resolved">حل شده / اقدام شده</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
          <div className="w-8 h-8 border-2 border-[#F55951] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">در حال بارگذاری گزارش‌ها و پیشنهادات...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-[var(--bg-card)] border border-dashed border-[var(--border-color)]">
          <MessageSquare className="w-10 h-10 text-[var(--text-muted)] mb-3 opacity-50" />
          <p className="text-sm font-bold text-[var(--text-primary)]">پیامی یافت نشد</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            هنوز پیامی مطابق فیلترهای انتخابی ثبت نشده است.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {feedbacks.map(item => {
            const isSelected = selectedFeedback?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedFeedback(item);
                  if (item.status === 'unread') {
                    handleUpdateStatus(item.id, 'read');
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative ${
                  isSelected
                    ? 'bg-[var(--bg-surface)] border-[#F55951] ring-2 ring-[#F55951]/20 shadow-md'
                    : item.status === 'unread'
                    ? 'bg-[var(--bg-card)] border-[#F55951]/40 shadow-xs'
                    : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--border-highlight)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        item.type === 'suggestion'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {item.type === 'suggestion' ? <MessageSquare className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {item.type === 'suggestion' ? 'پیشنهاد' : 'گزارش خطا'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.status === 'unread'
                            ? 'bg-rose-500 text-white'
                            : item.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                        }`}
                      >
                        {item.status === 'unread' ? 'جدید' : item.status === 'resolved' ? 'اقدام شد' : 'خوانده شده'}
                      </span>

                      {/* Direct Card Delete Button */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setFeedbackToDelete(item);
                        }}
                        title="حذف پیام"
                        className="p-1 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] line-clamp-1 mb-1.5">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed mb-3">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    <span className="font-semibold">{item.username || 'کاربر مهمان'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.created_at).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Single Feedback Deletion (Replaces browser confirm) */}
      {feedbackToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setFeedbackToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl space-y-4 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-[var(--text-primary)]">
                آیا از حذف این پیام اطمینان دارید؟
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2 bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)]">
                «{feedbackToDelete.title}»
              </p>
              <p className="text-[11px] text-rose-500 mt-2">
                این پیام برای همیشه از دیتابیس حذف خواهد شد و قابل بازیابی نیست.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>بله، حذف قطعی پیام</span>
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setFeedbackToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Modal for Selected Message */}
      {selectedFeedback && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedFeedback(null)}
        >
          <div
            className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                      selectedFeedback.type === 'suggestion'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {selectedFeedback.type === 'suggestion' ? <MessageSquare className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {selectedFeedback.type === 'suggestion' ? 'پیشنهاد کاربر' : 'گزارش خطای ارسالی'}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {new Date(selectedFeedback.created_at).toLocaleString('fa-IR')}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                  {selectedFeedback.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                aria-label="بستن پنجره جزئیات"
                className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sender Meta */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)]">ارسال‌کننده:</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedFeedback.username || 'کاربر مهمان'}</span>
              </div>
              {selectedFeedback.ip_address && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--text-muted)]">آدرس IP:</span>
                  <span className="font-mono text-[11px] dir-ltr">{selectedFeedback.ip_address}</span>
                </div>
              )}
            </div>

            {/* Full Message Body */}
            <div>
              <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">
                متن کامل پیام و توضیحات:
              </label>
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedFeedback.description}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-secondary)]">تغییر وضعیت:</span>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedFeedback.id, 'read')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedFeedback.status === 'read'
                      ? 'bg-[#361D32] text-white'
                      : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[#F55951]'
                  }`}
                >
                  خوانده شد
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedFeedback.id, 'resolved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedFeedback.status === 'resolved'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-500'
                  }`}
                >
                  اقدام / برطرف شد
                </button>
              </div>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setFeedbackToDelete(selectedFeedback)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف پیام</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Retention / Cleanup Modal */}
      <AdminDataCleanupModal
        isOpen={cleanupModalOpen}
        onClose={() => setCleanupModalOpen(false)}
        defaultTarget="feedback_reports"
        onSuccess={() => {
          fetchFeedbacks();
        }}
      />
    </div>
  );
}

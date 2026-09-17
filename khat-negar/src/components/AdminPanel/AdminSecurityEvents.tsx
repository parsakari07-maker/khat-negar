import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Check,
  X,
  Trash2,
  Database
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import type { SecurityEvent } from '../../types.js';
import { AdminDataCleanupModal } from './AdminDataCleanupModal.js';

export function AdminSecurityEvents() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<SecurityEvent | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { ok, data } = await apiFetch('/api/admin/security-events');
      if (ok && data.success) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'reviewed' | 'ignored') => {
    try {
      const { ok, data } = await apiFetch(`/api/admin/security-events/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (ok && data.success) {
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    setActionLoading(true);
    try {
      const { ok, data } = await apiFetch(`/api/admin/security-events/${id}`, {
        method: 'DELETE'
      });
      if (ok && data.success) {
        setEvents(prev => prev.filter(e => e.id !== id));
        setEventToDelete(null);
      }
    } catch (err) {
      console.error('Failed to delete security event', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getEventNameFa = (type: string) => {
    switch (type) {
      case 'MULTIPLE_IPS_FAST':
      case 'multiple_ips':
      case 'MULTIPLE_IPS':
        return 'ورود همزمان/سریع از چندین آدرس IP مجزا';
      case 'EXCESSIVE_FAILED_LOGINS':
      case 'failed_logins':
      case 'failed_login':
        return 'تلاش‌های متوالی و مشکوک ناموفق برای ورود';
      case 'CONCURRENT_SESSIONS':
      case 'concurrent_sessions':
        return 'نشست‌های همزمان فعال در نقاط مختلف';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span>پایش رویدادهای مشکوک امنیتی (Security Events)</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            شناسایی هوشمند اشتراک‌گذاری اکانت، ورود غیرمجاز، تغییرات ناگهانی موقعیت و هشدارهای سرور
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
            <span>پاکسازی رویدادهای قدیمی</span>
          </button>

          <button
            type="button"
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[#F55951] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>به‌روزرسانی</span>
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] animate-pulse">
            در حال دریافت هشدارهای امنیتی...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span className="text-sm font-bold text-[var(--text-primary)] block">هیچ هشدار امنیتی بازی وجود ندارد</span>
            <span className="text-xs text-[var(--text-muted)]">تمامی فعالیت‌های کاربران در وضعیت عادی قرار دارند.</span>
          </div>
        ) : (
          events.map(ev => (
            <div
              key={ev.id}
              className={`p-5 rounded-3xl border transition-all ${
                ev.status === 'pending'
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] opacity-75'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">{getEventNameFa(ev.event_type)}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-surface)] font-bold text-[#F55951]">
                        کاربر: {ev.username}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{ev.description}</p>
                    <span className="text-[10px] text-[var(--text-muted)] block mt-1">
                      ثبت: {new Date(ev.timestamp).toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center gap-2">
                  {ev.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ev.id, 'reviewed')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>بررسی شد</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ev.id, 'ignored')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-500 text-xs font-bold cursor-pointer transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>نادیده گرفتن</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-[var(--text-muted)] px-3 py-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                      {ev.status === 'reviewed' ? 'بررسی‌شده توسط مدیر' : 'نادیده گرفته شده'}
                    </span>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => setEventToDelete(ev)}
                    title="حذف هشدار"
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Single Security Event Modal */}
      {eventToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEventToDelete(null)}
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
                حذف رویداد امنیتی
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                آیا از حذف این رویداد امنیتی مطمئن هستید؟
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleDeleteSingle(eventToDelete.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>بله، حذف هشدار</span>
              </button>
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Retention Cleanup Modal */}
      <AdminDataCleanupModal
        isOpen={cleanupModalOpen}
        onClose={() => setCleanupModalOpen(false)}
        defaultTarget="security_events"
        onSuccess={() => {
          fetchEvents();
        }}
      />
    </div>
  );
}

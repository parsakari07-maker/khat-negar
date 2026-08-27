import React, { useEffect, useState } from 'react';
import {
  Clock,
  Search,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Database,
  AlertTriangle
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import type { LoginLog } from '../../types.js';
import { AdminDataCleanupModal } from './AdminDataCleanupModal.js';

export function AdminLoginLogs() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<LoginLog | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { ok, data } = await apiFetch('/api/admin/login-logs');
      if (ok && data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDeleteSingle = async (id: string) => {
    setDeletingId(id);
    try {
      const { ok, data } = await apiFetch(`/api/admin/login-logs/${id}`, {
        method: 'DELETE'
      });
      if (ok && data.success) {
        setLogs(prev => prev.filter(l => l.id !== id));
        setLogToDelete(null);
      }
    } catch (err) {
      console.error('Failed to delete login log', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchSearch = l.username.toLowerCase().includes(search.toLowerCase()) || l.ip_address.includes(search);
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#F55951]" />
            <span>گزارش کامل ورودها و نشست‌های کاربران (Login Logs)</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            ثبت لحظه‌ای آدرس‌های IP، وضعیت موفقیت/شکست، مشخصات دستگاه و برچسب‌های مشکوک
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
            <span>پاکسازی داده‌های قدیمی</span>
          </button>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[#F55951] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>به‌روزرسانی</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجوی نام کاربری یا IP..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-3" />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
              statusFilter === 'all' ? 'bg-[#F55951] text-white' : 'text-[var(--text-secondary)]'
            }`}
          >
            همه موارد ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('success')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
              statusFilter === 'success' ? 'bg-emerald-600 text-white' : 'text-[var(--text-secondary)]'
            }`}
          >
            ورود موفق
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('failed')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
              statusFilter === 'failed' ? 'bg-red-600 text-white' : 'text-[var(--text-secondary)]'
            }`}
          >
            ورود ناموفق
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">
            <tr>
              <th className="p-4">زمان دقیق</th>
              <th className="p-4">نام کاربری</th>
              <th className="p-4">آدرس IP</th>
              <th className="p-4">مرورگر و دستگاه</th>
              <th className="p-4">وضعیت</th>
              <th className="p-4">علت / جزئیات</th>
              <th className="p-4">شناسایی امنیتی</th>
              <th className="p-4 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[var(--text-muted)]">
                  در حال بارگذاری لاگ‌ها...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[var(--text-muted)]">
                  موردی یافت نشد.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-[var(--bg-surface)]/60 transition">
                  <td className="p-4 text-[11px] text-[var(--text-secondary)]">
                    {new Date(log.timestamp).toLocaleString('fa-IR')}
                  </td>
                  <td className="p-4 font-bold">{log.username}</td>
                  <td className="p-4 font-mono dir-ltr text-right text-[11px]">{log.ip_address}</td>
                  <td className="p-4 text-[11px] text-[var(--text-muted)] max-w-xs truncate" title={log.device_info}>
                    {log.device_info}
                  </td>
                  <td className="p-4">
                    {log.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>موفق</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500 font-bold">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ناموفق</span>
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-[11px] text-[var(--text-secondary)]">
                    {log.reason || 'ورود عادی به سامانه'}
                  </td>
                  <td className="p-4">
                    {log.is_suspicious ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                        <ShieldAlert className="w-3 h-3 text-amber-500" />
                        <span>مشکوک</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)]">عادی</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => setLogToDelete(log)}
                      title="حذف لاگ"
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Single Log Confirmation Modal */}
      {logToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLogToDelete(null)}
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
                حذف لاگ ورود کاربر
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                آیا از حذف لاگ ورود کاربر <span className="font-bold text-[var(--text-primary)]">{logToDelete.username}</span> در تاریخ {new Date(logToDelete.timestamp).toLocaleString('fa-IR')} مطمئن هستید؟
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={deletingId === logToDelete.id}
                onClick={() => handleDeleteSingle(logToDelete.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {deletingId === logToDelete.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>بله، حذف رکورد</span>
              </button>
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
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
        defaultTarget="login_logs"
        onSuccess={() => {
          fetchLogs();
        }}
      />
    </div>
  );
}

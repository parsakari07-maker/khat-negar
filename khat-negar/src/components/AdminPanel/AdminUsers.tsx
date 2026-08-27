import React, { useEffect, useState } from 'react';
import {
  UserPlus,
  Search,
  KeyRound,
  Shield,
  ShieldAlert,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Monitor,
  AlertTriangle,
  History,
  X,
  AlertCircle
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import type { User, LoginLog } from '../../types.js';

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Target User State
  const [targetUser, setTargetUser] = useState<User | null>(null);

  // Create Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  // Edit Form State
  const [editUsername, setEditUsername] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [editIsSuspicious, setEditIsSuspicious] = useState(false);

  // Reset Form State
  const [resetNewPassword, setResetNewPassword] = useState('');

  // History State
  const [historyData, setHistoryData] = useState<{
    recentLogs: LoginLog[];
    uniqueIps: string[];
    lastLogin?: string;
    totalLogins: number;
  } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : '/api/admin/users';
      const { ok, data } = await apiFetch(url);
      if (ok && data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const { ok, data } = await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole
        })
      });
      if (ok && data.success) {
        setSuccessMessage(data.message || 'کاربر با موفقیت ایجاد شد.');
        setShowCreateModal(false);
        setNewUsername('');
        setNewPassword('');
        fetchUsers();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'خطا در ایجاد کاربر.');
      }
    } catch (err: any) {
      setErrorMessage('خطای ارتباط با سرور.');
    }
  };

  const handleOpenEdit = (user: User) => {
    setTargetUser(user);
    setEditUsername(user.username);
    setEditIsActive(user.is_active);
    setEditRole(user.role);
    setEditIsSuspicious(user.is_suspicious || false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setErrorMessage(null);
    try {
      const { ok, data } = await apiFetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          username: editUsername,
          is_active: editIsActive,
          role: editRole,
          is_suspicious: editIsSuspicious
        })
      });
      if (ok && data.success) {
        setSuccessMessage(data.message || 'تغییرات با موفقیت ذخیره شد.');
        setShowEditModal(false);
        fetchUsers();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'خطا در ذخیره تغییرات.');
      }
    } catch (err) {
      setErrorMessage('خطای ارتباط با سرور.');
    }
  };

  const handleOpenReset = (user: User) => {
    setTargetUser(user);
    setResetNewPassword('');
    setShowResetModal(true);
  };

  const handleSaveReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setErrorMessage(null);
    try {
      const { ok, data } = await apiFetch(`/api/admin/users/${targetUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: resetNewPassword })
      });
      if (ok && data.success) {
        setSuccessMessage(data.message || 'رمز عبور تغییر یافت.');
        setShowResetModal(false);
        setResetNewPassword('');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'خطا در تغییر رمز عبور.');
      }
    } catch (err) {
      setErrorMessage('خطای ارتباط با سرور.');
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteTargetUser) return;
    setIsDeletingUser(true);
    try {
      const { ok, data } = await apiFetch(`/api/admin/users/${deleteTargetUser.id}`, { method: 'DELETE' });
      if (ok && data.success) {
        setSuccessMessage(data.message || `حساب کاربری «${deleteTargetUser.username}» با موفقیت حذف شد.`);
        setDeleteTargetUser(null);
        fetchUsers();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'خطا در حذف کاربر.');
      }
    } catch (err) {
      setErrorMessage('خطا در ارتباط با سرور.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleOpenHistory = async (user: User) => {
    setTargetUser(user);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const { ok, data } = await apiFetch(`/api/admin/users/${user.id}/history`);
      if (ok && data.success) {
        setHistoryData(data.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#F55951]" />
            <span>مدیریت و صدور حساب‌های کاربری</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            ایجاد دستی، بازنشانی کلمه عبور، پایش IPها و نظارت بر امنیت کاربران
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewUsername('');
            setNewPassword('');
            setNewRole('user');
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F55951] hover:bg-[#E04840] text-white text-xs font-bold shadow-md shadow-[#F55951]/20 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>ایجاد کاربر جدید (صدور اکانت)</span>
        </button>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search Filter */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="جستجوی نام کاربری..."
          className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
        />
        <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-3" />
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">
            <tr>
              <th className="p-4">نام کاربری</th>
              <th className="p-4">نقش</th>
              <th className="p-4">وضعیت حساب</th>
              <th className="p-4">تعداد IP ثبت‌شده</th>
              <th className="p-4">آخرین ورود</th>
              <th className="p-4">وضعیت امنیتی</th>
              <th className="p-4 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">
                  در حال بارگذاری اطلاعات کاربران...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">
                  کاربری با این مشخصات یافت نشد.
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-[var(--bg-surface)]/60 transition">
                  <td className="p-4 font-bold text-sm">
                    <div className="flex items-center gap-2">
                      <span>{u.username}</span>
                      {u.username === 'admin' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-bold">
                          مدیر اصلی
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-semibold">
                      {u.role === 'admin' ? 'مدیر کل' : 'کاربر عادی'}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>فعال</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>غیرفعال (مسدود)</span>
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-mono dir-ltr text-right">
                    <span className="px-2 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-color)] text-[11px]">
                      {u.ip_count} IP
                    </span>
                  </td>
                  <td className="p-4 text-[11px] text-[var(--text-muted)]">
                    {u.last_login_at ? (
                      new Date(u.last_login_at).toLocaleDateString('fa-IR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    ) : (
                      'تاکنون وارد نشده'
                    )}
                  </td>
                  <td className="p-4">
                    {u.is_suspicious ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                        <ShieldAlert className="w-3 h-3 text-amber-500" />
                        <span>فعالیت مشکوک</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">عادی</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenHistory(u)}
                        className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-indigo-500 text-indigo-500 transition cursor-pointer"
                        title="تاریخچه ورود و IPها"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-amber-500 text-amber-500 transition cursor-pointer"
                        title="ویرایش کاربر"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReset(u)}
                        className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-blue-500 text-blue-500 transition cursor-pointer"
                        title="تغییر رمز عبور"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      {u.username !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetUser(u)}
                          className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-red-500 text-red-500 transition cursor-pointer"
                          title="حذف کاربر"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================
          MODAL 1: CREATE USER (MANUAL PROVISIONING)
      ========================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 left-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">ایجاد و صدور حساب کاربری جدید</h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">نام کاربری:</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="مثال: parsa_user"
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">رمز عبور اولیه:</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden dir-ltr text-right"
                  required
                />
                <span className="text-[10px] text-[var(--text-muted)] block mt-1">
                  این رمز را در پیام‌رسان ایتا برای کاربر ارسال کنید.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">نقش دسترسی:</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as 'user' | 'admin')}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                >
                  <option value="user">کاربر عادی (تولید پرامپت)</option>
                  <option value="admin">مدیر کل (دسترسی به پنل مدیریت)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#F55951] hover:bg-[#E04840] text-white text-xs font-bold cursor-pointer"
                >
                  ثبت و ایجاد کاربر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: EDIT USER
      ========================================== */}
      {showEditModal && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="absolute top-5 left-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">ویرایش مشخصات کاربر: {targetUser.username}</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">نام کاربری:</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">وضعیت حساب:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsActive(true)}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      editIsActive
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'
                    }`}
                  >
                    فعال
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIsActive(false)}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      !editIsActive
                        ? 'bg-red-500/15 border-red-500 text-red-700 dark:text-red-300'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'
                    }`}
                  >
                    مسدود / غیرفعال
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">برچسب فعالیت مشکوک:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsSuspicious(false)}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      !editIsSuspicious
                        ? 'bg-[var(--bg-card)] border-emerald-500 text-emerald-600'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'
                    }`}
                  >
                    حالت عادی
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIsSuspicious(true)}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      editIsSuspicious
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'
                    }`}
                  >
                    فعالیت مشکوک
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#F55951] hover:bg-[#E04840] text-white text-xs font-bold cursor-pointer"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 3: RESET PASSWORD
      ========================================== */}
      {showResetModal && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="absolute top-5 left-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">تغییر رمز عبور: {targetUser.username}</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              رمز جدید را تعیین کنید (رمز قبلی به صورت هش‌شده نگهداری می‌شود و قابل مشاهده نیست).
            </p>

            <form onSubmit={handleSaveReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">رمز عبور جدید:</label>
                <input
                  type="text"
                  value={resetNewPassword}
                  onChange={e => setResetNewPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden dir-ltr text-right"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#F55951] hover:bg-[#E04840] text-white text-xs font-bold cursor-pointer"
                >
                  تغییر و ذخیره رمز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 4: USER LOGIN & IP HISTORY
      ========================================== */}
      {showHistoryModal && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-5 left-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
              تاریخچه ورود و امنیت IP کاربر: «{targetUser.username}»
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              بررسی IPهای مشاهده شده و تاریخچه نشست‌های کاربر
            </p>

            {historyLoading ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">در حال دریافت تاریخچه...</div>
            ) : historyData ? (
              <div className="space-y-5">
                {/* IP Summary Box */}
                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <span className="text-xs font-bold text-[var(--text-primary)] block mb-2">
                    آدرس‌های IP ثبت‌شده ({historyData.uniqueIps.length} IP مجزا):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {historyData.uniqueIps.map((ip, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono text-[11px] dir-ltr text-[var(--text-secondary)]">
                        {ip}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Login Logs Table */}
                <div>
                  <span className="text-xs font-bold text-[var(--text-primary)] block mb-2">
                    آخرین ورودهای کاربر:
                  </span>
                  <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[var(--bg-card)] text-[var(--text-muted)] font-bold">
                        <tr>
                          <th className="p-2.5">زمان</th>
                          <th className="p-2.5">آدرس IP</th>
                          <th className="p-2.5">دستگاه / مرورگر</th>
                          <th className="p-2.5">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {historyData.recentLogs.map(l => (
                          <tr key={l.id}>
                            <td className="p-2.5 text-[11px]">
                              {new Date(l.timestamp).toLocaleString('fa-IR')}
                            </td>
                            <td className="p-2.5 font-mono dir-ltr text-right text-[11px]">{l.ip_address}</td>
                            <td className="p-2.5 text-[11px] text-[var(--text-muted)]">{l.device_info}</td>
                            <td className="p-2.5">
                              {l.status === 'success' ? (
                                <span className="text-emerald-600 font-bold">موفق</span>
                              ) : (
                                <span className="text-red-500 font-bold">ناموفق ({l.reason})</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete User */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-center text-[var(--text-primary)] mb-2">
              تأیید حذف حساب کاربری
            </h3>

            <p className="text-xs text-center text-[var(--text-secondary)] leading-relaxed mb-4">
              آیا از حذف حساب کاربری <strong className="text-[var(--text-primary)]">«{deleteTargetUser.username}»</strong> اطمینان دارید؟
              با حذف این حساب، کاربر امکان ورود مجدد به سامانه را نخواهد داشت.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                disabled={isDeletingUser}
                className="py-2.5 px-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                className="py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-red-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeletingUser ? (
                  <span className="animate-spin text-xs">⏳</span>
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeletingUser ? 'در حال حذف...' : 'بله، حذف حساب'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

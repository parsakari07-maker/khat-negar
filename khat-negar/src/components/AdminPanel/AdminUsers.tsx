import React, { useEffect, useState, useMemo } from 'react';
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
  AlertCircle,
  Crown,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import type { User, LoginLog } from '../../types.js';

type SortField = 'username' | 'ip_count' | 'usage_today' | 'last_login' | 'created_at' | 'subscription';

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Target User State
  const [targetUser, setTargetUser] = useState<User | null>(null);

  // Create Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [newIsUnlimited, setNewIsUnlimited] = useState(false);

  // Subscription Form State
  const [subPlanType, setSubPlanType] = useState<'unlimited' | 'free'>('unlimited');
  const [subLoading, setSubLoading] = useState(false);

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

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Memoized sorted users list
  // Memoized sorted and instantly filtered users list
  const sortedUsers = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    let list = users;
    if (q) {
      const normQ = q.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
      list = users.filter(u => {
        const uName = (u.username || '').toLowerCase();
        const uEitaa = (u.eitaa_id || '').toLowerCase();
        const uRole = (u.role || '').toLowerCase();
        const uPlan = (u.subscription_plan_name || '').toLowerCase();
        return (
          uName.includes(q) ||
          uName.includes(normQ) ||
          uEitaa.includes(q) ||
          uEitaa.includes(normQ) ||
          uRole.includes(q) ||
          uPlan.includes(q) ||
          (q === 'نامحدود' && u.is_unlimited) ||
          (q === 'رایگان' && !u.is_unlimited)
        );
      });
    }

    return [...list].sort((a, b) => {
      let compareVal = 0;
      if (sortField === 'username') {
        compareVal = (a.username || '').localeCompare(b.username || '', 'fa');
      } else if (sortField === 'ip_count') {
        compareVal = (a.ip_count || 0) - (b.ip_count || 0);
      } else if (sortField === 'usage_today') {
        const totalA = (a.today_primary_count || 0) + (a.today_generate_again_count || 0);
        const totalB = (b.today_primary_count || 0) + (b.today_generate_again_count || 0);
        compareVal = totalA - totalB;
      } else if (sortField === 'last_login') {
        const timeA = a.last_login_at ? new Date(a.last_login_at).getTime() : 0;
        const timeB = b.last_login_at ? new Date(b.last_login_at).getTime() : 0;
        compareVal = timeA - timeB;
      } else if (sortField === 'created_at') {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        compareVal = timeA - timeB;
      } else if (sortField === 'subscription') {
        const isUnlA = a.is_unlimited ? 1 : 0;
        const isUnlB = b.is_unlimited ? 1 : 0;
        compareVal = isUnlA - isUnlB;
      }
      return sortDirection === 'asc' ? compareVal : -compareVal;
    });
  }, [users, search, sortField, sortDirection]);

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
        if (newIsUnlimited && data.user?.id) {
          await apiFetch(`/api/admin/users/${data.user.id}/subscription`, {
            method: 'POST',
            body: JSON.stringify({
              plan_type: 'unlimited',
              is_unlimited: true,
              status: 'active'
            })
          });
        }
        setSuccessMessage(data.message || 'کاربر با موفقیت ایجاد شد.');
        setShowCreateModal(false);
        setNewUsername('');
        setNewPassword('');
        setNewIsUnlimited(false);
        fetchUsers();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'خطا در ایجاد کاربر.');
      }
    } catch (err: any) {
      setErrorMessage('خطای ارتباط با سرور.');
    }
  };

  const handleOpenSubscription = (user: User) => {
    setTargetUser(user);
    setSubPlanType(user.is_unlimited ? 'unlimited' : 'unlimited');
    setShowSubscriptionModal(true);
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setErrorMessage(null);
    setSubLoading(true);
    try {
      const isActivating = subPlanType === 'unlimited';
      const { ok, data } = await apiFetch(`/api/admin/users/${targetUser.id}/subscription`, {
        method: 'POST',
        body: JSON.stringify({
          plan_type: subPlanType,
          is_unlimited: isActivating,
          status: isActivating ? 'active' : 'free'
        })
      });
      if (ok && data.success) {
        setSuccessMessage(data.message || `وضعیت اشتراک کاربر «${targetUser.username}» با موفقیت به‌روزرسانی شد.`);
        setShowSubscriptionModal(false);
        fetchUsers();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data?.error || 'خطا در تغییر وضعیت اشتراک.');
      }
    } catch (err: any) {
      setErrorMessage('خطای ارتباط با سرور.');
    } finally {
      setSubLoading(false);
    }
  };

  const handleQuickToggleUnlimited = async (user: User) => {
    setErrorMessage(null);
    const newPlan = user.is_unlimited ? 'free' : 'unlimited';
    try {
      const isActivating = newPlan === 'unlimited';
      const { ok, data } = await apiFetch(`/api/admin/users/${user.id}/subscription`, {
        method: 'POST',
        body: JSON.stringify({
          plan_type: newPlan,
          is_unlimited: isActivating,
          status: isActivating ? 'active' : 'free'
        })
      });
      if (ok && data.success) {
        setSuccessMessage(newPlan === 'unlimited' ? `اشتراک نامحدود برای کاربر «${user.username}» فعال شد.` : `اشتراک کاربر «${user.username}» به حالت عادی تغییر یافت.`);
        fetchUsers();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data?.error || 'خطا در تغییر اشتراک.');
      }
    } catch (err) {
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

      {/* Search & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجوی نام کاربری..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-3" />
        </div>

        {/* Sort Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <span className="text-[var(--text-muted)] font-bold text-[11px]">مرتب‌سازی:</span>
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value as SortField)}
              className="bg-transparent border-none text-xs font-bold text-[var(--text-primary)] focus:outline-hidden cursor-pointer"
            >
              <option value="created_at">تاریخ عضویت (جدیدترین)</option>
              <option value="usage_today">بیشترین مصرف امروز</option>
              <option value="ip_count">بیشترین تعداد IP</option>
              <option value="username">نام کاربری (حروف الفبا)</option>
              <option value="last_login">آخرین زمان ورود</option>
              <option value="subscription">وضعیت اشتراک (نامحدود)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[#F55951] transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            title={sortDirection === 'desc' ? 'ترتیب: نزولی (بیشترین/جدیدترین به کمترین)' : 'ترتیب: صعودی (کمترین/قدیمی‌ترین به بیشترین)'}
          >
            {sortDirection === 'desc' ? (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-[#F55951]" />
                <span className="hidden sm:inline text-[10px]">نزولی</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-3.5 h-3.5 text-[#F55951]" />
                <span className="hidden sm:inline text-[10px]">صعودی</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">
            <tr>
              <th className="p-4 cursor-pointer hover:text-[var(--text-primary)] transition select-none" onClick={() => handleSort('username')}>
                <div className="flex items-center gap-1">
                  <span>نام کاربری</span>
                  {sortField === 'username' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#F55951]" /> : <ArrowDown className="w-3 h-3 text-[#F55951]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th className="p-4">نقش</th>
              <th className="p-4 cursor-pointer hover:text-[var(--text-primary)] transition select-none" onClick={() => handleSort('subscription')}>
                <div className="flex items-center gap-1">
                  <span>وضعیت اشتراک</span>
                  {sortField === 'subscription' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#F55951]" /> : <ArrowDown className="w-3 h-3 text-[#F55951]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th className="p-4 cursor-pointer hover:text-[var(--text-primary)] transition select-none" onClick={() => handleSort('usage_today')}>
                <div className="flex items-center gap-1">
                  <span>مصرف ۲۴ ساعت گذشته</span>
                  {sortField === 'usage_today' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#F55951]" /> : <ArrowDown className="w-3 h-3 text-[#F55951]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th className="p-4">وضعیت حساب</th>
              <th className="p-4 cursor-pointer hover:text-[var(--text-primary)] transition select-none" onClick={() => handleSort('ip_count')}>
                <div className="flex items-center gap-1">
                  <span>تعداد IP ورود</span>
                  {sortField === 'ip_count' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#F55951]" /> : <ArrowDown className="w-3 h-3 text-[#F55951]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th className="p-4 cursor-pointer hover:text-[var(--text-primary)] transition select-none" onClick={() => handleSort('last_login')}>
                <div className="flex items-center gap-1">
                  <span>آخرین ورود</span>
                  {sortField === 'last_login' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#F55951]" /> : <ArrowDown className="w-3 h-3 text-[#F55951]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th className="p-4">وضعیت امنیتی</th>
              <th className="p-4 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-[var(--text-muted)]">
                  در حال بارگذاری اطلاعات کاربران...
                </td>
              </tr>
            ) : sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-[var(--text-muted)]">
                  کاربری با این مشخصات یافت نشد.
                </td>
              </tr>
            ) : (
              sortedUsers.map(u => {
                const totalToday = (u.today_primary_count || 0) + (u.today_generate_again_count || 0);
                const hasMultipleIps = (u.ip_count || 0) > 1;

                return (
                  <tr key={u.id} className="hover:bg-[var(--bg-surface)]/60 transition">
                    <td className="p-4 font-bold text-sm">
                      <div className="flex items-center gap-2">
                        <span>{u.username}</span>
                        {u.auth_provider === 'eitaa' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20" title={`کاربر برنامک ایتا (شناسه: ${u.eitaa_id || 'نامشخص'})`}>
                            برنامک ایتا
                          </span>
                        )}
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
                      {u.is_unlimited ? (
                        <button
                          type="button"
                          onClick={() => handleOpenSubscription(u)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
                          title="کلیک جهت مدیریت اشتراک"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span>نامحدود</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenSubscription(u)}
                          className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-500/10 hover:bg-gray-500/20 text-[var(--text-secondary)] text-[11px] font-medium transition cursor-pointer"
                          title="کلیک جهت ارتقا به اشتراک نامحدود"
                        >
                          <span>رایگان</span>
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      {totalToday > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                              {totalToday} پرامپت
                            </span>
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">
                            {u.today_primary_count || 0} اصلی + {u.today_generate_again_count || 0} بازتولید
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">۰ پرامپت</span>
                      )}
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
                      <button
                        type="button"
                        onClick={() => handleOpenHistory(u)}
                        className="px-2 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[var(--text-secondary)] text-[11px] transition cursor-pointer"
                        title="مشاهده جزئیات تاریخچه ورود و IPها"
                      >
                        {u.ip_count || 1} IP
                      </button>
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
                      {u.is_active ? (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">عادی</span>
                      ) : (
                        <span className="text-[11px] text-red-500 font-semibold">مسدود شده</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenSubscription(u)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            u.is_unlimited
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 hover:bg-amber-500/25'
                              : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-amber-500 text-amber-500'
                          }`}
                          title="مدیریت اشتراک نامحدود"
                        >
                          <Crown className="w-3.5 h-3.5" />
                        </button>
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
                );
              })
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

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsUnlimited}
                    onChange={e => setNewIsUnlimited(e.target.checked)}
                    className="w-4 h-4 rounded text-[#F55951] focus:ring-[#F55951]"
                  />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>اعطای اشتراک نامحدود بدون سقف روزانه</span>
                  </span>
                </label>
                <span className="text-[10px] text-[var(--text-muted)] block mt-1 mr-6">
                  در صورت فعال‌سازی، این کاربر محدودیت ۱ پرامپت در روز را نخواهد داشت.
                </span>
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

      {/* =========================================
          MODAL 5: USER SUBSCRIPTION MANAGEMENT
      ========================================== */}
      {showSubscriptionModal && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowSubscriptionModal(false)}
              className="absolute top-5 left-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  مدیریت اشتراک: «{targetUser.username}»
                </h3>
                <span className="text-xs text-[var(--text-muted)]">
                  فعال‌سازی یا لغو اشتراک نامحدود سایت
                </span>
              </div>
            </div>

            {/* Current status info */}
            <div className="mb-4 p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">وضعیت کنونی:</span>
                <span className="font-bold">
                  {targetUser.is_unlimited ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold inline-flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5" />
                      <span>نامحدود</span>
                    </span>
                  ) : (
                    <span className="text-[var(--text-secondary)] font-bold">رایگان</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">مصرف امروز:</span>
                <span className="font-mono font-bold">
                  {targetUser.today_primary_count || 0} پرامپت اصلی / {targetUser.today_generate_again_count || 0} بازتولید
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                  انتخاب طرح اشتراک:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSubPlanType('unlimited')}
                    className={`p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col gap-1 ${
                      subPlanType === 'unlimited'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-200 shadow-xs'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>طرح نامحدود</span>
                      <Crown className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] leading-tight">
                      بدون سقف تولید پرامپت
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubPlanType('free')}
                    className={`p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col gap-1 ${
                      subPlanType === 'free'
                        ? 'bg-[#F55951]/10 border-[#F55951] text-[var(--text-primary)] shadow-xs'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[#F55951]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>طرح رایگان</span>
                      <Zap className="w-4 h-4 text-[#F55951]" />
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] leading-tight">
                      سهمیه استاندارد
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubscriptionModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={subLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  {subLoading ? (
                    <span className="animate-spin text-xs">⏳</span>
                  ) : (
                    <Crown className="w-3.5 h-3.5" />
                  )}
                  <span>ثبت و اعمال فوری تغییرات</span>
                </button>
              </div>
            </form>
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

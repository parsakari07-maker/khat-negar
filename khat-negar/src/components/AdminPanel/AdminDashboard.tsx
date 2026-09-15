import React, { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Layers,
  Feather,
  Clock,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Database,
  Trash2
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import { AdminDataCleanupModal } from './AdminDataCleanupModal.js';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingSecurityEvents: number;
  totalGenerations: number;
  totalGenerateAgain: number;
  activeMasterPrompts: number;
  activeStyles: number;
  recentLogins: any[];
  recentAudits: any[];
}

export function AdminDashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { ok, data } = await apiFetch('/api/admin/dashboard');
      if (ok && data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-8 text-center text-sm font-bold text-[var(--text-muted)] animate-pulse">
        در حال بارگذاری آمار داشبورد...
      </div>
    );
  }

  const kpis = [
    {
      title: 'کل کاربران سامانه',
      value: stats.totalUsers,
      sub: `${stats.activeUsers} فعال / ${stats.inactiveUsers} غیرفعال`,
      icon: <Users className="w-5 h-5 text-[#F55951]" />,
      tab: 'users'
    },
    {
      title: 'کل تولیدهای پرامپت',
      value: stats.totalGenerations,
      sub: `${stats.totalGenerateAgain} مورد تولید دوباره`,
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      tab: 'audit_logs'
    },
    {
      title: 'پرامپت‌های مادر فعال',
      value: stats.activeMasterPrompts,
      sub: 'آماده پردازش زنجیره‌ای',
      icon: <Layers className="w-5 h-5 text-indigo-500" />,
      tab: 'master_prompts'
    },
    {
      title: 'سبک‌های خط فعال',
      value: stats.activeStyles,
      sub: 'سنتی و فانتزی',
      icon: <Feather className="w-5 h-5 text-emerald-500" />,
      tab: 'styles'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">داشبورد مانیتورینگ و مدیریت</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            خلاصه وضعیت کاربران، نرخ تولید پرامپت‌ها، هشدارهای امنیتی و نگهداری دیتابیس
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Data Cleanup Quick Action */}
          <button
            type="button"
            onClick={() => setCleanupModalOpen(true)}
            className="btn-interactive inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>پاکسازی لاگ‌های قدیمی</span>
          </button>

          <button
            type="button"
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[#F55951] transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>به‌روزرسانی آمار</span>
          </button>
        </div>
      </div>

      {/* Security Alerts Banner if any */}
      {stats.pendingSecurityEvents > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                {stats.pendingSecurityEvents} فعالیت مشکوک در انتظار بررسی مدیر
              </span>
              <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                ورود از چندین IP یا تلاش‌های مکرر ناموفق ثبت شده است.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('security_events')}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition cursor-pointer shrink-0"
          >
            مشاهده رویدادها
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onNavigate(kpi.tab)}
            className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#F55951]/50 text-right transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                {kpi.icon}
              </div>
              <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[#F55951] transition" />
            </div>
            <span className="text-xs font-semibold text-[var(--text-muted)] block">{kpi.title}</span>
            <div className="text-2xl font-black text-[var(--text-primary)] my-1">{kpi.value}</div>
            <span className="text-[11px] text-[var(--text-secondary)]">{kpi.sub}</span>
          </button>
        ))}
      </div>

      {/* Daily Usage 24-Hour Statistics Section */}
      <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                آمار مصرف ۲۴ ساعت اخیر (مبتنی بر دیتابیس)
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                آمار دقیق محاسبه‌شده از جدول لاگ‌های تولید در بازه زمانی ۲۴ ساعت گذشته
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
            مرجع محاسباتی معتبر
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] block">تولیدهای اصلی (۲۴س)</span>
            <div className="text-xl font-black text-[var(--text-primary)] mt-1">
              {stats.todayPrimaryGenerations ?? 0}
            </div>
            <span className="text-[10px] text-[var(--text-secondary)]">مصرف‌کننده سهمیه روزانه</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] block">بازتولیدها (۲۴س)</span>
            <div className="text-xl font-black text-amber-500 mt-1">
              {stats.todayGenerateAgain ?? 0}
            </div>
            <span className="text-[10px] text-[var(--text-secondary)]">تولید مجدد بدون کسر سهمیه</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] block">کل تولیدها (۲۴س)</span>
            <div className="text-xl font-black text-[#F55951] mt-1">
              {stats.todayGenerations ?? 0}
            </div>
            <span className="text-[10px] text-[var(--text-secondary)]">مجموع تولید و بازتولید</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] block">کاربران فعال (۲۴س)</span>
            <div className="text-xl font-black text-indigo-500 mt-1">
              {stats.todayActiveUsersCount ?? 0}
            </div>
            <span className="text-[10px] text-[var(--text-secondary)]">کاربران دارای فعالیت تولید</span>
          </div>
        </div>
      </div>

      {/* Tables: Recent Logins & Recent Audit Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Logins Feed */}
        <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-color)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F55951]" />
              <span>آخرین ورودهای کاربران</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('login_logs')}
              className="text-xs font-bold text-[#F55951] hover:underline cursor-pointer"
            >
              مشاهده همه
            </button>
          </div>

          <div className="space-y-2.5">
            {stats.recentLogins && stats.recentLogins.length > 0 ? (
              stats.recentLogins.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-primary)]">{log.username}</span>
                      {log.status === 'success' ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                          موفق
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-semibold">
                          ناموفق
                        </span>
                      )}
                      {log.is_suspicious && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-bold">
                          مشکوک
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 font-mono dir-ltr">
                      {log.ip_address} • {log.device_info}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(log.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">هنوز لاگ ورودی ثبت نشده است.</p>
            )}
          </div>
        </div>

        {/* Recent Admin Audit Logs Feed */}
        <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-color)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span>آخرین اقدامات مدیریتی (Audit)</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('audit_logs')}
              className="text-xs font-bold text-indigo-500 hover:underline cursor-pointer"
            >
              مشاهده همه
            </button>
          </div>

          <div className="space-y-2.5">
            {stats.recentAudits && stats.recentAudits.length > 0 ? (
              stats.recentAudits.map((audit: any) => (
                <div
                  key={audit.id}
                  className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[var(--text-primary)]">{audit.action}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(audit.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">{audit.details}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">اقدام مدیریتی ثبت نشده است.</p>
            )}
          </div>
        </div>
      </div>

      {/* Database Retention Cleanup Modal */}
      <AdminDataCleanupModal
        isOpen={cleanupModalOpen}
        onClose={() => setCleanupModalOpen(false)}
        defaultTarget="all"
        onSuccess={() => {
          fetchStats();
        }}
      />
    </div>
  );
}

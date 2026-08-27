import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  Feather,
  Box,
  Clock,
  ShieldAlert,
  Activity,
  Settings,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard.js';
import { AdminUsers } from './AdminUsers.js';
import { AdminMasterPrompts } from './AdminMasterPrompts.js';
import { AdminStyles } from './AdminStyles.js';
import { AdminMaterialsModels } from './AdminMaterialsModels.js';
import { AdminLoginLogs } from './AdminLoginLogs.js';
import { AdminSecurityEvents } from './AdminSecurityEvents.js';
import { AdminAuditLogs } from './AdminAuditLogs.js';
import { AdminSettings } from './AdminSettings.js';
import { AdminFeedbackReports } from './AdminFeedbackReports.js';
import { useLogo } from '../../context/LogoContext.js';

interface AdminLayoutProps {
  onBackToGenerator: () => void;
}

type TabType =
  | 'dashboard'
  | 'users'
  | 'master_prompts'
  | 'styles'
  | 'materials_models'
  | 'feedback'
  | 'security_events'
  | 'login_logs'
  | 'audit_logs'
  | 'settings';

export function AdminLayout({ onBackToGenerator }: AdminLayoutProps) {
  const { logoUrl } = useLogo();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Categorized Navigation Structure
  const primaryGroups = [
    {
      id: 'dashboard',
      label: 'داشبورد مانیتورینگ',
      icon: <LayoutDashboard className="w-4 h-4" />,
      tabs: ['dashboard']
    },
    {
      id: 'users',
      label: 'کاربران و دسترسی‌ها',
      icon: <Users className="w-4 h-4" />,
      tabs: ['users']
    },
    {
      id: 'ai_engine',
      label: 'موتور هوش مصنوعی',
      icon: <Cpu className="w-4 h-4" />,
      subLabel: 'پرامپت‌ها و سبک‌ها',
      tabs: ['master_prompts', 'styles', 'materials_models'],
      subItems: [
        { id: 'master_prompts', label: 'پرامپت‌های مادر ۵‌گانه', icon: <Layers className="w-3.5 h-3.5" /> },
        { id: 'styles', label: 'سبک‌های خط و خوشنویسی', icon: <Feather className="w-3.5 h-3.5" /> },
        { id: 'materials_models', label: 'متریال، ابعاد و مدل‌ها', icon: <Box className="w-3.5 h-3.5" /> }
      ]
    },
    {
      id: 'feedback_reports',
      label: 'گزارش‌ها و پیشنهادات',
      icon: <Sparkles className="w-4 h-4" />,
      tabs: ['feedback']
    },
    {
      id: 'security_logs',
      label: 'امنیت و رویدادنگاری',
      icon: <ShieldCheck className="w-4 h-4" />,
      subLabel: 'لاگ‌ها و هشدارها',
      tabs: ['security_events', 'login_logs', 'audit_logs'],
      subItems: [
        { id: 'security_events', label: 'هشدارهای امنیتی و IP', icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> },
        { id: 'login_logs', label: 'تاریخچه و لاگ ورودها', icon: <Clock className="w-3.5 h-3.5" /> },
        { id: 'audit_logs', label: 'لاگ‌های نظارتی (Audit)', icon: <Activity className="w-3.5 h-3.5" /> }
      ]
    },
    {
      id: 'settings',
      label: 'تنظیمات و دیتابیس',
      icon: <Settings className="w-4 h-4" />,
      tabs: ['settings']
    }
  ];

  // Helper to find the current active group
  const currentGroup = primaryGroups.find(group => group.tabs.includes(activeTab)) || primaryGroups[0];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-5 md:py-7 space-y-6">
      {/* 1. Admin Header & Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[#361D32] shadow-xs shrink-0 flex items-center justify-center">
            <img
              src={logoUrl}
              alt="لوگوی خط نگار"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-[var(--text-primary)] tracking-tight">
                پنل مدیریت یکپارچه خط‌نگار
              </h1>
              <span className="text-[10px] font-extrabold text-[#F55951] px-2.5 py-0.5 rounded-lg bg-[#F55951]/10 border border-[#F55951]/20">
                مدیریت ارشد
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
              مدیریت کاربران، پیکربندی پرامپت‌های مادر و نظارت زنده بر امنیت سامانه
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToGenerator}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] hover:border-[#F55951] hover:text-[#F55951] shadow-xs transition cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به مولد پرامپت</span>
        </button>
      </div>

      {/* 2. Structured Main Navigation Categories (بخش‌بندی منظم و اصولی دسته‌بندی‌ها) */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {primaryGroups.map(group => {
            const isGroupActive = group.tabs.includes(activeTab);
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => {
                  // If group has multiple sub-tabs and activeTab is not inside it, switch to its first tab
                  if (!group.tabs.includes(activeTab)) {
                    setActiveTab(group.tabs[0] as TabType);
                  }
                }}
                className={`flex flex-col items-start justify-center p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                  isGroupActive
                    ? 'bg-[#F55951] border-[#F55951] text-white shadow-md shadow-[#F55951]/25 ring-2 ring-[#F55951]/20'
                    : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[#F55951]/50 hover:bg-[var(--bg-card)]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="p-1.5 rounded-xl bg-black/10 text-inherit">
                    {group.icon}
                  </div>
                  {group.subItems && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isGroupActive ? 'bg-white/20 text-white' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                      }`}
                    >
                      {group.subItems.length} بخش
                    </span>
                  )}
                </div>
                <span className="text-xs font-black tracking-tight block truncate w-full">
                  {group.label}
                </span>
                {group.subLabel && (
                  <span
                    className={`text-[10px] block truncate w-full mt-0.5 ${
                      isGroupActive ? 'text-white/80' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {group.subLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Sub-Navigation Bar (نمایش زیرمجموعه‌های فعال در صورت وجود) */}
        {currentGroup.subItems && (
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-xs">
            <span className="text-xs font-bold text-[var(--text-muted)] px-2 shrink-0">
              زیرمجموعه‌های {currentGroup.label}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentGroup.subItems.map(subItem => {
                const isSubActive = activeTab === subItem.id;
                return (
                  <button
                    key={subItem.id}
                    type="button"
                    onClick={() => setActiveTab(subItem.id as TabType)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSubActive
                        ? 'bg-[#361D32] dark:bg-[#EDD2CB] text-white dark:text-[#361D32] shadow-xs'
                        : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[#F55951] hover:border-[#F55951]/40'
                    }`}
                  >
                    {subItem.icon}
                    <span>{subItem.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Main Section Content Area */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-6 shadow-xs min-h-[500px]">
        {activeTab === 'dashboard' && <AdminDashboard onNavigate={tab => setActiveTab(tab as TabType)} />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'master_prompts' && <AdminMasterPrompts />}
        {activeTab === 'styles' && <AdminStyles />}
        {activeTab === 'materials_models' && <AdminMaterialsModels />}
        {activeTab === 'feedback' && <AdminFeedbackReports />}
        {activeTab === 'security_events' && <AdminSecurityEvents />}
        {activeTab === 'login_logs' && <AdminLoginLogs />}
        {activeTab === 'audit_logs' && <AdminAuditLogs />}
        {activeTab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import {
  Settings,
  Save,
  Database,
  Download,
  CheckCircle2,
  ShieldAlert,
  Image,
  Upload,
  RefreshCw,
  Layout,
  LogIn,
  PartyPopper,
  Sparkles,
  Sliders,
  Type,
  Eye,
  Lock,
  FileText,
  Crown,
  Zap,
  ExternalLink
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import type { AppSettings } from '../../types.js';
import { useSettings } from '../../context/SettingsContext.js';
import { DEFAULT_CLIENT_SETTINGS } from '../../context/SettingsContext.js';
import { AdminDataCleanupModal } from './AdminDataCleanupModal.js';

export function AdminSettings() {
  const { settings: globalSettings, updateSettings, setCustomLogo, resetLogo, logoUrl, isCustom } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'brand' | 'auth' | 'generator' | 'subscriptions' | 'security'>('brand');
  const [formData, setFormData] = useState<AppSettings>(DEFAULT_CLIENT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { ok, data } = await apiFetch<{ success: boolean; settings?: AppSettings }>('/api/admin/settings');
        if (ok && data.success && data.settings) {
          setFormData({ ...DEFAULT_CLIENT_SETTINGS, ...data.settings });
        } else {
          setFormData({ ...DEFAULT_CLIENT_SETTINGS, ...globalSettings });
        }
      } catch (err) {
        setFormData({ ...DEFAULT_CLIENT_SETTINGS, ...globalSettings });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [globalSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const success = await updateSettings(formData);
      if (success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
      } else {
        alert('خطا در ذخیره تنظیمات در سرور.');
      }
    } catch (err) {
      alert('خطا در ارتباط با سرور.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('لطفاً یک فایل تصویری معتبر انتخاب کنید.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert('حجم تصویر نباید بیشتر از ۴ مگابایت باشد.');
      return;
    }

    setLogoUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      if (base64Data) {
        setFormData(prev => ({ ...prev, custom_logo_url: base64Data }));
        await setCustomLogo(base64Data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
      setLogoUploading(false);
    };
    reader.onerror = () => {
      alert('خطا در خواندن فایل تصویر.');
      setLogoUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = async () => {
    if (!confirm('آیا از بازگردانی لوگوی رسمی پیش‌فرض سامانه اطمینان دارید؟')) return;
    setLogoUploading(true);
    setFormData(prev => ({ ...prev, custom_logo_url: '' }));
    await resetLogo();
    setLogoUploading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetSectionDefaults = (section: 'brand' | 'auth' | 'generator' | 'subscriptions' | 'security') => {
    if (!confirm('آیا مایلید فیلدهای این بخش به مقادیر پیش‌فرض اولیه بازگردانی شوند؟')) return;

    if (section === 'brand') {
      setFormData(prev => ({
        ...prev,
        site_title_fa: DEFAULT_CLIENT_SETTINGS.site_title_fa,
        site_badge_fa: DEFAULT_CLIENT_SETTINGS.site_badge_fa,
        site_subtitle_fa: DEFAULT_CLIENT_SETTINGS.site_subtitle_fa,
        header_generator_btn_fa: DEFAULT_CLIENT_SETTINGS.header_generator_btn_fa,
        header_admin_btn_fa: DEFAULT_CLIENT_SETTINGS.header_admin_btn_fa
      }));
    } else if (section === 'auth') {
      setFormData(prev => ({
        ...prev,
        login_badge_fa: DEFAULT_CLIENT_SETTINGS.login_badge_fa,
        login_title_fa: DEFAULT_CLIENT_SETTINGS.login_title_fa,
        login_subtitle_fa: DEFAULT_CLIENT_SETTINGS.login_subtitle_fa,
        login_username_label_fa: DEFAULT_CLIENT_SETTINGS.login_username_label_fa,
        login_username_placeholder_fa: DEFAULT_CLIENT_SETTINGS.login_username_placeholder_fa,
        login_password_label_fa: DEFAULT_CLIENT_SETTINGS.login_password_label_fa,
        login_password_placeholder_fa: DEFAULT_CLIENT_SETTINGS.login_password_placeholder_fa,
        login_button_fa: DEFAULT_CLIENT_SETTINGS.login_button_fa,
        login_notice_fa: DEFAULT_CLIENT_SETTINGS.login_notice_fa,
        welcome_badge_fa: DEFAULT_CLIENT_SETTINGS.welcome_badge_fa,
        welcome_title_fa: DEFAULT_CLIENT_SETTINGS.welcome_title_fa,
        welcome_subtitle_admin_fa: DEFAULT_CLIENT_SETTINGS.welcome_subtitle_admin_fa,
        welcome_subtitle_user_fa: DEFAULT_CLIENT_SETTINGS.welcome_subtitle_user_fa,
        welcome_loading_text_fa: DEFAULT_CLIENT_SETTINGS.welcome_loading_text_fa
      }));
    } else if (section === 'generator') {
      setFormData(prev => ({
        ...prev,
        generator_top_badge_fa: DEFAULT_CLIENT_SETTINGS.generator_top_badge_fa,
        generator_heading_fa: DEFAULT_CLIENT_SETTINGS.generator_heading_fa,
        generator_subtitle_fa: DEFAULT_CLIENT_SETTINGS.generator_subtitle_fa,
        generator_sample_btn_fa: DEFAULT_CLIENT_SETTINGS.generator_sample_btn_fa,
        generator_input_label_fa: DEFAULT_CLIENT_SETTINGS.generator_input_label_fa,
        generator_input_placeholder_fa: DEFAULT_CLIENT_SETTINGS.generator_input_placeholder_fa,
        generator_submit_btn_fa: DEFAULT_CLIENT_SETTINGS.generator_submit_btn_fa,
        generator_again_btn_fa: DEFAULT_CLIENT_SETTINGS.generator_again_btn_fa,
        generator_result_title_fa: DEFAULT_CLIENT_SETTINGS.generator_result_title_fa,
        generator_result_subtitle_fa: DEFAULT_CLIENT_SETTINGS.generator_result_subtitle_fa,
        footer_title_fa: DEFAULT_CLIENT_SETTINGS.footer_title_fa,
        footer_subtitle_fa: DEFAULT_CLIENT_SETTINGS.footer_subtitle_fa
      }));
    } else if (section === 'subscriptions') {
      setFormData(prev => ({
        ...prev,
        daily_free_limit: DEFAULT_CLIENT_SETTINGS.daily_free_limit,
        eitaa_channel_url: DEFAULT_CLIENT_SETTINGS.eitaa_channel_url,
        daily_limit_badge_unlimited_fa: DEFAULT_CLIENT_SETTINGS.daily_limit_badge_unlimited_fa,
        daily_limit_badge_free_fa: DEFAULT_CLIENT_SETTINGS.daily_limit_badge_free_fa,
        daily_limit_free_subtext_fa: DEFAULT_CLIENT_SETTINGS.daily_limit_free_subtext_fa,
        daily_limit_exceeded_title_fa: DEFAULT_CLIENT_SETTINGS.daily_limit_exceeded_title_fa,
        daily_limit_exceeded_desc_fa: DEFAULT_CLIENT_SETTINGS.daily_limit_exceeded_desc_fa,
        daily_limit_upgrade_prompt_fa: DEFAULT_CLIENT_SETTINGS.daily_limit_upgrade_prompt_fa,
        daily_limit_eitaa_btn_text_fa: DEFAULT_CLIENT_SETTINGS.daily_limit_eitaa_btn_text_fa
      }));
    } else if (section === 'security') {
      setFormData(prev => ({
        ...prev,
        rate_limit_per_minute: DEFAULT_CLIENT_SETTINGS.rate_limit_per_minute,
        suspicious_ip_threshold: DEFAULT_CLIENT_SETTINGS.suspicious_ip_threshold,
        failed_login_threshold: DEFAULT_CLIENT_SETTINGS.failed_login_threshold
      }));
    }
  };

  const handleDownloadSql = () => {
    window.open('/api/admin/export-sql', '_blank');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#F55951]" />
            <span>مدیریت متون، سرخط‌ها و پیکربندی سامانه</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            ویرایش کامل تمامی عناوین، پیام‌های ورود، کارت خوش‌آمدگویی، صفحات، لوگو و تنظیمات امنیتی
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Database Cleanup Button */}
          <button
            type="button"
            onClick={() => setCleanupModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition cursor-pointer"
            title="پاکسازی لاگ‌های قدیمی و داده‌های اضافی دیتابیس"
          >
            <Database className="w-4 h-4" />
            <span>پاکسازی لاگ‌های قدیمی</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSql}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
            title="دانلود ساختار جداول و اسکریپت دیتابیس"
          >
            <Download className="w-4 h-4" />
            <span>دانلود فایل ساختار دیتابیس (SQL)</span>
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>تمامی تغییرات با موفقیت در سرور ذخیره شد و در تمام بخش‌های سامانه فوراً اعمال گردید.</span>
          </div>
          <span className="text-[11px] font-normal opacity-80">همگام‌سازی لحظه‌ای فعال</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => setActiveTab('brand')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'brand'
              ? 'bg-[#F55951] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>سربرگ و لوگو</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('auth')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'auth'
              ? 'bg-[#F55951] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>صفحه ورود و کارت خوش‌آمدگویی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('generator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'generator'
              ? 'bg-[#F55951] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>مولد پرامپت و فوتر</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'subscriptions'
              ? 'bg-[#F55951] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>اشتراک، سهمیه روزانه و ایتا</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#F55951] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>امنیت و محدودیت‌ها</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ================= TAB 1: BRAND & HEADER ================= */}
        {activeTab === 'brand' && (
          <div className="space-y-6">
            {/* Logo Management Section */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F55951]/10 text-[#F55951] flex items-center justify-center">
                    <Image className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      مدیریت و بارگذاری لوگوی سامانه
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      لوگوی انتخابی در سربرگ، صفحه ورود و تمام بخش‌های کاربری نمایش داده می‌شود.
                    </p>
                  </div>
                </div>
                {isCustom && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    لوگوی اختصاصی فعال است
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[var(--border-color)] bg-[#361D32] shadow-xl flex items-center justify-center">
                    <img
                      src={logoUrl}
                      alt="پیش‌نمایش لوگو"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[10px] text-center block mt-1.5 text-[var(--text-muted)] font-medium">
                    پیش‌نمایش زنده
                  </span>
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={logoUploading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F55951] hover:bg-[#E04840] text-white text-xs font-bold shadow-md transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{logoUploading ? 'در حال پردازش...' : 'بارگذاری لوگوی جدید'}</span>
                    </button>

                    {isCustom && (
                      <button
                        type="button"
                        onClick={handleResetLogo}
                        disabled={logoUploading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] text-xs font-bold transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>بازنشانی به لوگوی رسمی</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                      یا آدرس اینترنتی (URL) مستقیم تصویر لوگو:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://example.com/logo.png"
                        value={formData.custom_logo_url || ''}
                        onChange={e => setFormData({ ...formData, custom_logo_url: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden dir-ltr text-left"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (formData.custom_logo_url) {
                            await setCustomLogo(formData.custom_logo_url);
                            setSaved(true);
                            setTimeout(() => setSaved(false), 3000);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[#F55951] text-xs font-bold text-[var(--text-primary)] transition cursor-pointer"
                      >
                        اعمال آدرس
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Header Titles Card */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Layout className="w-4 h-4 text-[#F55951]" />
                  <span>عناوین و سرخط‌های سربرگ سامانه (Header)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleResetSectionDefaults('brand')}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[#F55951] flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>بازنشانی پیش‌فرض‌های این بخش</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    نام برند / عنوان اصلی سامانه:
                  </label>
                  <input
                    type="text"
                    value={formData.site_title_fa || ''}
                    onChange={e => setFormData({ ...formData, site_title_fa: e.target.value })}
                    placeholder="مثال: خط نگار"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    نشانک کوچک کنار عنوان سربرگ:
                  </label>
                  <input
                    type="text"
                    value={formData.site_badge_fa || ''}
                    onChange={e => setFormData({ ...formData, site_badge_fa: e.target.value })}
                    placeholder="مثال: تایپوگرافی هوشمند"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    زیرعنوان و توضیح مختصر سربرگ:
                  </label>
                  <input
                    type="text"
                    value={formData.site_subtitle_fa || ''}
                    onChange={e => setFormData({ ...formData, site_subtitle_fa: e.target.value })}
                    placeholder="مثال: مهندسی پرامپت خط و خوشنویسی"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    عنوان دکمه رفتن به مولد پرامپت:
                  </label>
                  <input
                    type="text"
                    value={formData.header_generator_btn_fa || ''}
                    onChange={e => setFormData({ ...formData, header_generator_btn_fa: e.target.value })}
                    placeholder="تولید پرامپت"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    عنوان دکمه پنل مدیریت:
                  </label>
                  <input
                    type="text"
                    value={formData.header_admin_btn_fa || ''}
                    onChange={e => setFormData({ ...formData, header_admin_btn_fa: e.target.value })}
                    placeholder="پنل مدیریت"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: AUTH & WELCOME CARD ================= */}
        {activeTab === 'auth' && (
          <div className="space-y-6">
            {/* Login Screen Card */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-[#F55951]" />
                  <span>عناوین و متون صفحه و پنجره ورود (Login Screen & Modal)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleResetSectionDefaults('auth')}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[#F55951] flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>بازنشانی پیش‌فرض‌ها</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    سرخط / عنوان اصلی کادر ورود:
                  </label>
                  <input
                    type="text"
                    value={formData.login_title_fa || ''}
                    onChange={e => setFormData({ ...formData, login_title_fa: e.target.value })}
                    placeholder="مثال: خط نگار"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    نشانک کوچک بالای کادر ورود:
                  </label>
                  <input
                    type="text"
                    value={formData.login_badge_fa || ''}
                    onChange={e => setFormData({ ...formData, login_badge_fa: e.target.value })}
                    placeholder="مثال: تایپوگرافی هوشمند"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    زیرعنوان و متن معرفی صفحه ورود:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.login_subtitle_fa || ''}
                    onChange={e => setFormData({ ...formData, login_subtitle_fa: e.target.value })}
                    placeholder="توضیحات معرفی سامانه..."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    برچسب فیلد نام کاربری:
                  </label>
                  <input
                    type="text"
                    value={formData.login_username_label_fa || ''}
                    onChange={e => setFormData({ ...formData, login_username_label_fa: e.target.value })}
                    placeholder="نام کاربری:"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن راهنمای فیلد نام کاربری (Placeholder):
                  </label>
                  <input
                    type="text"
                    value={formData.login_username_placeholder_fa || ''}
                    onChange={e => setFormData({ ...formData, login_username_placeholder_fa: e.target.value })}
                    placeholder="نام کاربری شما"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    برچسب فیلد رمز عبور:
                  </label>
                  <input
                    type="text"
                    value={formData.login_password_label_fa || ''}
                    onChange={e => setFormData({ ...formData, login_password_label_fa: e.target.value })}
                    placeholder="رمز عبور:"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن راهنمای فیلد رمز عبور (Placeholder):
                  </label>
                  <input
                    type="text"
                    value={formData.login_password_placeholder_fa || ''}
                    onChange={e => setFormData({ ...formData, login_password_placeholder_fa: e.target.value })}
                    placeholder="رمز عبور شما"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن دکمه ورود به سامانه:
                  </label>
                  <input
                    type="text"
                    value={formData.login_button_fa || ''}
                    onChange={e => setFormData({ ...formData, login_button_fa: e.target.value })}
                    placeholder="ورود به سامانه"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن کادر اطلاعیه پایین صفحه ورود:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.login_notice_fa || ''}
                    onChange={e => setFormData({ ...formData, login_notice_fa: e.target.value })}
                    placeholder="توضیحات نحوه تحویل اکانت توسط مدیریت..."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Welcome Card & Entrance Animation */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-[#F55951]" />
                  <span>کارت تبریک و انیمیشن خوش‌آمدگویی پس از ورود موفق</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    نشانک بالای کارت تبریک:
                  </label>
                  <input
                    type="text"
                    value={formData.welcome_badge_fa || ''}
                    onChange={e => setFormData({ ...formData, welcome_badge_fa: e.target.value })}
                    placeholder="ورود با موفقیت انجام شد"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    عنوان تبریک (از {'{username}'} برای جایگذاری نام کاربر استفاده کنید):
                  </label>
                  <input
                    type="text"
                    value={formData.welcome_title_fa || ''}
                    onChange={e => setFormData({ ...formData, welcome_title_fa: e.target.value })}
                    placeholder="خوش آمدید، {username}"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن دسترسی مدیر ارشد:
                  </label>
                  <input
                    type="text"
                    value={formData.welcome_subtitle_admin_fa || ''}
                    onChange={e => setFormData({ ...formData, welcome_subtitle_admin_fa: e.target.value })}
                    placeholder="دسترسی: مدیریت ارشد سامانه"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن دسترسی کاربر عادی:
                  </label>
                  <input
                    type="text"
                    value={formData.welcome_subtitle_user_fa || ''}
                    onChange={e => setFormData({ ...formData, welcome_subtitle_user_fa: e.target.value })}
                    placeholder="دسترسی: کاربری سامانه مهندسی پرامپت"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن نوار لودینگ و انتقال به سامانه:
                  </label>
                  <input
                    type="text"
                    value={formData.welcome_loading_text_fa || ''}
                    onChange={e => setFormData({ ...formData, welcome_loading_text_fa: e.target.value })}
                    placeholder="در حال آماده‌سازی و انتقال به محیط کاربری..."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: GENERATOR VIEW & FOOTER ================= */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            {/* Generator Page Main Card */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F55951]" />
                  <span>عناوین، بنر بالا و دکمه‌های صفحه تولید پرامپت</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleResetSectionDefaults('generator')}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[#F55951] flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>بازنشانی پیش‌فرض‌ها</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    نشانک بنر بالای صفحه مولد:
                  </label>
                  <input
                    type="text"
                    value={formData.generator_top_badge_fa || ''}
                    onChange={e => setFormData({ ...formData, generator_top_badge_fa: e.target.value })}
                    placeholder="مهندسی هوشمند پرامپت‌های خوشنویسی و تایپوگرافی اصیل"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    سرخط / عنوان بزرگ صفحه مولد (H1):
                  </label>
                  <input
                    type="text"
                    value={formData.generator_heading_fa || ''}
                    onChange={e => setFormData({ ...formData, generator_heading_fa: e.target.value })}
                    placeholder="مولد تخصصی پرامپت تایپوگرافی"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن توضیحی زیرعنوان مولد:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.generator_subtitle_fa || ''}
                    onChange={e => setFormData({ ...formData, generator_subtitle_fa: e.target.value })}
                    placeholder="توضیحات معرفی نحوه تولید پرامپت و دقت..."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن دکمه بارگذاری نمونه تستی:
                  </label>
                  <input
                    type="text"
                    value={formData.generator_sample_btn_fa || ''}
                    onChange={e => setFormData({ ...formData, generator_sample_btn_fa: e.target.value })}
                    placeholder="بارگذاری نمونه آزمایشی (ایران من)"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    عنوان فیلد ورودی متن تایپوگرافی:
                  </label>
                  <input
                    type="text"
                    value={formData.generator_input_label_fa || ''}
                    onChange={e => setFormData({ ...formData, generator_input_label_fa: e.target.value })}
                    placeholder="عنوان و متن دقیق تایپوگرافی"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن راهنمای فیلد ورودی (Placeholder):
                  </label>
                  <input
                    type="text"
                    value={formData.generator_input_placeholder_fa || ''}
                    onChange={e => setFormData({ ...formData, generator_input_placeholder_fa: e.target.value })}
                    placeholder="متن یا عبارت خوشنویسی خود را بنویسید..."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    عنوان دکمه اصلی تولید پرامپت:
                  </label>
                  <input
                    type="text"
                    value={formData.generator_submit_btn_fa || ''}
                    onChange={e => setFormData({ ...formData, generator_submit_btn_fa: e.target.value })}
                    placeholder="تولید پرامپت تخصصی تایپوگرافی"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    عنوان دکمه تولید مجدد (پرامپت بعدی):
                  </label>
                  <input
                    type="text"
                    value={formData.generator_again_btn_fa || ''}
                    onChange={e => setFormData({ ...formData, generator_again_btn_fa: e.target.value })}
                    placeholder="تولید دوباره (پرامپت بعدی)"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    عنوان باکس نمایش پرامپت نهایی:
                  </label>
                  <input
                    type="text"
                    value={formData.generator_result_title_fa || ''}
                    onChange={e => setFormData({ ...formData, generator_result_title_fa: e.target.value })}
                    placeholder="پرامپت نهایی تولید شده (انگلیسی)"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن راهنمای زیر باکس خروجی:
                  </label>
                  <input
                    type="text"
                    value={formData.generator_result_subtitle_fa || ''}
                    onChange={e => setFormData({ ...formData, generator_result_subtitle_fa: e.target.value })}
                    placeholder="این پرامپت آماده استفاده در ابزارهای هوش مصنوعی تصویرساز است."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Feedback & Suggestions Section Texts Card */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F55951]" />
                  <span>عناوین بخش اعلام گزارش و پیشنهادات (فوتر سایت)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    نشانک بالای کادر بازخورد:
                  </label>
                  <input
                    type="text"
                    value={formData.feedback_badge_fa || ''}
                    onChange={e => setFormData({ ...formData, feedback_badge_fa: e.target.value })}
                    placeholder="صدای شما، پیشرفت ما"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    عنوان اصلی بخش گزارش و پیشنهادات:
                  </label>
                  <input
                    type="text"
                    value={formData.feedback_title_fa || ''}
                    onChange={e => setFormData({ ...formData, feedback_title_fa: e.target.value })}
                    placeholder="اعلام گزارش و پیشنهادات"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    توضیحات زیرعنوان کادر:
                  </label>
                  <input
                    type="text"
                    value={formData.feedback_subtitle_fa || ''}
                    onChange={e => setFormData({ ...formData, feedback_subtitle_fa: e.target.value })}
                    placeholder="دیدگاه‌ها، پیشنهادات بهبود، یا گزارش خطاهای احتمالی خود را برای ارتقای سامانه با ما در میان بگذارید."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    عنوان دکمه ارسال پیام:
                  </label>
                  <input
                    type="text"
                    value={formData.feedback_submit_btn_fa || ''}
                    onChange={e => setFormData({ ...formData, feedback_submit_btn_fa: e.target.value })}
                    placeholder="ارسال گزارش یا پیشنهاد"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    پیام موفقیت‌آمیز بودن ارسال:
                  </label>
                  <input
                    type="text"
                    value={formData.feedback_success_msg_fa || ''}
                    onChange={e => setFormData({ ...formData, feedback_success_msg_fa: e.target.value })}
                    placeholder="پیام شما با موفقیت ثبت شد و توسط مدیران سامانه بررسی خواهد شد..."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Footer Texts Card */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#F55951]" />
                  <span>عناوین و متن بخش پاورقی (Footer)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    عنوان اصلی فوتر:
                  </label>
                  <input
                    type="text"
                    value={formData.footer_title_fa || ''}
                    onChange={e => setFormData({ ...formData, footer_title_fa: e.target.value })}
                    placeholder="سامانه تخصصی مهندسی پرامپت تایپوگرافی فارسی"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن زیرعنوان و توضیحات فوتر:
                  </label>
                  <input
                    type="text"
                    value={formData.footer_subtitle_fa || ''}
                    onChange={e => setFormData({ ...formData, footer_subtitle_fa: e.target.value })}
                    placeholder="تولید هوشمند دستورات خوشنویسی اصیل سنتی و مدرن..."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: SUBSCRIPTIONS, DAILY LIMITS & EITAA ================= */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            {/* Card 1: Core Quota & Eitaa Link */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>تنظیمات سقف روزانه پرامپت‌های رایگان و پیوند به ایتا</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleResetSectionDefaults('subscriptions')}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[#F55951] flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>بازنشانی پیش‌فرض‌ها</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    سقف مجاز پرامپت‌های اصلی رایگان در هر روز:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.daily_free_limit || 1}
                    onChange={e => setFormData({ ...formData, daily_free_limit: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                    پیش‌فرض: ۱ پرامپت در روز (تولید دوباره پرامپت‌ها همواره نامحدود و بدون سقف است).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    لینک کامل کانال ایتا جهت ارتقای حساب:
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    value={formData.eitaa_channel_url || ''}
                    onChange={e => setFormData({ ...formData, eitaa_channel_url: e.target.value })}
                    placeholder="https://eitaa.com/khatnegarTypographicCraft"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden text-left"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                    کاربر با کلیک روی دکمه ارتقا یا بنر اتمام سهمیه مستقیماً به این آدرس هدایت می‌شود.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن عنوان دکمه هدایت به کانال ایتا:
                  </label>
                  <input
                    type="text"
                    value={formData.daily_limit_eitaa_btn_text_fa || ''}
                    onChange={e => setFormData({ ...formData, daily_limit_eitaa_btn_text_fa: e.target.value })}
                    placeholder="کانال ایتا خط‌نگار"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن دعوت به ارتقای اشتراک در کانال:
                  </label>
                  <input
                    type="text"
                    value={formData.daily_limit_upgrade_prompt_fa || ''}
                    onChange={e => setFormData({ ...formData, daily_limit_upgrade_prompt_fa: e.target.value })}
                    placeholder="برای ارتقا به اشتراک نامحدود و حذف سقف روزانه، به کانال ایتا مراجعه فرمایید:"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Status Badges on Generator */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span>متون نشانک‌های وضعیت اشتراک و سهمیه در بالای صفحه مولد</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن نشانک اکانت‌های دارای اشتراک نامحدود فعال:
                  </label>
                  <input
                    type="text"
                    value={formData.daily_limit_badge_unlimited_fa || ''}
                    onChange={e => setFormData({ ...formData, daily_limit_badge_unlimited_fa: e.target.value })}
                    placeholder="وضعیت حساب: اشتراک نامحدود فعال ✨"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                    این نشانک با رنگ سبز زمردی برای کاربران با اشتراک ویژه نمایش داده می‌شود.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن نشانک سهمیه روزانه کاربر عادی:
                  </label>
                  <input
                    type="text"
                    value={formData.daily_limit_badge_free_fa || ''}
                    onChange={e => setFormData({ ...formData, daily_limit_badge_free_fa: e.target.value })}
                    placeholder="سهمیه روزانه: {remaining} از {limit} پرامپت رایگان امروز باقیمانده"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                    می‌توانید از {'{remaining}'} برای باقیمانده و {'{limit}'} برای سقف کل استفاده کنید.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن راهنمای زیر نشانک سهمیه رایگان:
                  </label>
                  <input
                    type="text"
                    value={formData.daily_limit_free_subtext_fa || ''}
                    onChange={e => setFormData({ ...formData, daily_limit_free_subtext_fa: e.target.value })}
                    placeholder="امکان «تولید دوباره» پرامپت‌های قبلی کاملاً نامحدود و رایگان است ✨"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Limit Exceeded Notice */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>متون کادر اعلان اتمام سهمیه روزانه و بازتولید رایگان</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    عنوان کادر اتمام سقف روزانه:
                  </label>
                  <input
                    type="text"
                    value={formData.daily_limit_exceeded_title_fa || ''}
                    onChange={e => setFormData({ ...formData, daily_limit_exceeded_title_fa: e.target.value })}
                    placeholder="سقف ۱ پرامپت رایگان امروز شما استفاده شده است"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    متن توضیحی اتمام سقف روزانه و اطمینان‌بخشی بازتولید:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.daily_limit_exceeded_desc_fa || ''}
                    onChange={e => setFormData({ ...formData, daily_limit_exceeded_desc_fa: e.target.value })}
                    placeholder="💡 نکته مهم: امکان «تولید دوباره» برای پرامپت‌های قبلی شما همچنان کاملاً نامحدود و رایگان است!"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SECURITY & LIMITS ================= */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#F55951]" />
                  <span>تنظیمات امنیت، محدودیت نرخ درخواست‌ها و رفتار سیستم</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleResetSectionDefaults('security')}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[#F55951] flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>بازنشانی پیش‌فرض‌ها</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    سقف مجاز تولید پرامپت در دقیقه:
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={formData.rate_limit_per_minute || 20}
                    onChange={e => setFormData({ ...formData, rate_limit_per_minute: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 block">پیش‌فرض: ۲۰ درخواست در دقیقه</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    آستانه هشدار ورود از آی‌پی‌های متعدد:
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={formData.suspicious_ip_threshold || 3}
                    onChange={e => setFormData({ ...formData, suspicious_ip_threshold: parseInt(e.target.value) || 3 })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 block">پیش‌فرض: ۳ آی‌پی مختلف</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    آستانه هشدار ورود ناموفق رمز عبور:
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={15}
                    value={formData.failed_login_threshold || 5}
                    onChange={e => setFormData({ ...formData, failed_login_threshold: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 block">پیش‌فرض: ۵ تلاش ناموفق</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button Bar */}
        <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--border-color)] shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>با زدن دکمه ذخیره، تمام سرخط‌ها و متون در لحظه ذخیره و اعمال می‌شوند.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-[#F55951] hover:bg-[#E04840] text-white text-xs font-bold shadow-lg shadow-[#F55951]/25 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'در حال ذخیره و همگام‌سازی...' : 'ذخیره تمامی تغییرات'}</span>
          </button>
        </div>
      </form>

      {/* Database Retention / Data Cleanup Modal */}
      <AdminDataCleanupModal
        isOpen={cleanupModalOpen}
        onClose={() => setCleanupModalOpen(false)}
        defaultTarget="all"
      />
    </div>
  );
}
